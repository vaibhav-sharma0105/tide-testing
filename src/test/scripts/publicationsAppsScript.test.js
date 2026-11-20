// Runs the real apps-script/publications/Code.gs in a Node vm sandbox with fake Google services
// (it can't run on Google from CI). Checks: no public listing, the submitter's email and the
// Timestamp never leave the Sheet, the TIDE/THRIvE split, and the Sheet → publication mapping.
import { describe, it, expect, beforeEach } from 'vitest'
import { readCodeGs, makeAppsScriptEnv, exportWith } from './helpers/fakeAppsScript.js'

const CODE = readCodeGs('apps-script/publications/Code.gs')
const T0 = Date.parse('2026-11-20T10:00:00.000Z')
const MIN = 60_000

// The real header row of "Form responses 1" (A–P), as read from the Sheet on 2026-11-20.
const HEADER = [
  'Timestamp', 'Email address', 'Date of publication', 'TIDE / THRIvE', 'Title of TIDE publication',
  'Type of material', 'Short description', 'TIDE Link to the publication', 'Thumbnail / cover image',
  'Title of THRIvE publication', 'THRIvE Type of material', 'THRIvE Field of Work', 'THRIvE Short description',
  'APA Style Reference', 'THRIvE Link to the publication', 'THRIvE Thumbnail / cover image',
]
let tsCounter = 0
function tide(o = {}) {
  return [
    o.ts ?? new Date(Date.UTC(2026, 5, 19, 9, 0, tsCounter++)), 'person@example.com', o.date ?? new Date(Date.UTC(2025, 11, 6, 0, 0, 0)), o.org ?? 'TIDE',
    o.title ?? 'Annual report', o.type ?? 'Report', o.desc ?? 'What we did', o.link ?? 'https://example.org/report.pdf', o.photo ?? '',
    '', '', '', '', '', '', '',
  ]
}
function thrive(o = {}) {
  return [
    o.ts ?? new Date(Date.UTC(2026, 5, 19, 9, 0, tsCounter++)), 'person@example.com', o.date ?? '23/03/2026', o.org ?? 'THRIvE',
    '', '', '', '', '',
    o.title ?? 'Teaching against the odds', o.type ?? 'Blog', o.fields ?? 'People with disability', o.desc ?? 'A study',
    o.citation ?? 'Author, A. (2026). Teaching against the odds.', o.link ?? 'https://example.org/blog', o.photo ?? '',
  ]
}

function makeEnv(rows) {
  return makeAppsScriptEnv({
    code: CODE, now: T0, spreadsheetName: 'TIDE THRIvE Publications (Responses)', timeZone: 'UTC',
    sheets: { 'Form responses 1': [HEADER, ...rows], Notes: [['Anything'], ['else']] },
  })
}

describe('Publications Apps Script — privacy', () => {
  it('has no public listing: every action needs the token', () => {
    const env = makeEnv([tide()])
    expect(env.ctx.doGet({ parameter: {} }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-tokeX' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'x' } }).success).toBe(false)
  })

  it('never outputs the email address or the Timestamp', () => {
    const env = makeEnv([tide({ ts: new Date('2026-06-19T15:04:18Z') }), thrive({ ts: '19/06/2026 15:53:00' })])
    const out = exportWith(env)
    const text = JSON.stringify(out)
    for (const secret of ['person@example.com', '2026-06-19', '19/06/2026', '15:04', '15:53']) expect(text).not.toContain(secret)
    expect(Object.keys(out.resources[0]).sort()).toEqual(
      ['citation', 'date', 'description', 'fields', 'id', 'link', 'org', 'photoUrl', 'title', 'type'])
  })

  it('fails loudly (publishes nothing) when a required header is renamed', () => {
    const env = makeEnv([tide()])
    env.sheets['Form responses 1'][0] = HEADER.map(h => h === 'Title of THRIvE publication' ? 'Name' : h)
    const out = exportWith(env)
    expect(out.success).toBe(false)
    expect(out.error).toMatch(/thriveTitle/)
  })
})

describe('Publications Apps Script — which rows and which columns', () => {
  it('maps TIDE rows from the TIDE columns and THRIvE rows from the THRIvE columns', () => {
    const env = makeEnv([
      tide({ photo: 'https://drive.google.com/open?id=photoFile0001' }),
      thrive({ fields: 'Holistic Education, Social emotional learning', photo: 'https://drive.google.com/open?id=photoFile0002' }),
    ])
    const [t, h] = exportWith(env).resources
    expect(t).toMatchObject({ org: 'TIDE', date: '2025-12-06', title: 'Annual report', type: 'Report', description: 'What we did',
      link: 'https://example.org/report.pdf', photoUrl: 'https://drive.google.com/open?id=photoFile0001', citation: null, fields: null })
    expect(h).toMatchObject({ org: 'THRIvE', date: '2026-03-23', title: 'Teaching against the odds', type: 'Blog', description: 'A study',
      fields: 'Holistic Education, Social emotional learning', citation: 'Author, A. (2026). Teaching against the odds.',
      link: 'https://example.org/blog', photoUrl: 'https://drive.google.com/open?id=photoFile0002' })
    expect(exportWith(env).photos.map(p => p.fileId)).toEqual(['photoFile0001', 'photoFile0002'])
  })

  it('publishes only TIDE/THRIvE rows with a title, and honours "Hide from website"', () => {
    const env = makeEnv([tide(), tide({ org: '' }), tide({ org: 'Other' }), thrive({ title: '' }), thrive({ org: ' thrive ' })])
    const out = exportWith(env)
    expect(out.resources.map(r => r.org)).toEqual(['TIDE', 'THRIvE'])
    expect(out.stats).toMatchObject({ rows: 5, published: 2, tide: 1, thrive: 1, noOrg: 2, noTitle: 1 })

    const hidden = makeEnv([tide(), tide({ title: 'Hidden one' })])
    hidden.sheets['Form responses 1'][0] = [...HEADER, 'Hide from website']
    hidden.sheets['Form responses 1'][2].push('Yes')
    const out2 = exportWith(hidden)
    expect(out2.resources.map(r => r.title)).toEqual(['Annual report'])
    expect(out2.stats.hidden).toBe(1)
  })

  it('keeps only a web link: text without one becomes null', () => {
    const env = makeEnv([thrive({ link: 'Happiness Education in India - Mind & Life Institute' }), thrive({ link: ' https://osf.io/jvrbh ' })])
    expect(exportWith(env).resources.map(r => r.link)).toEqual([null, 'https://osf.io/jvrbh'])
  })

  it('completes links typed without https:// (www.… and doi.org/…), as seen in the Sheet', () => {
    const env = makeEnv([thrive({ link: 'www.doi.org/10.1080/00958964.2023.2261389' }), thrive({ link: 'doi.org/10.1177/16094069251357771' })])
    expect(exportWith(env).resources.map(r => r.link)).toEqual(['https://www.doi.org/10.1080/00958964.2023.2261389', 'https://doi.org/10.1177/16094069251357771'])
  })

  it('gives each row a stable anonymous id from the Timestamp and skips duplicates and blank lines', () => {
    const ts = new Date('2026-06-19T15:04:18Z')
    const env = makeEnv([tide({ ts }), Array(HEADER.length).fill(''), tide({ ts, title: 'Copy' })])
    const out = exportWith(env)
    expect(out.resources).toHaveLength(1)
    expect(out.resources[0].id).toMatch(/^P-[0-9a-f]{10}$/)
    expect(exportWith(env).resources[0].id).toBe(out.resources[0].id)
    expect(out.stats.rows).toBe(2)
    expect(out.problems.map(p => p.kind)).toEqual(['duplicate-id'])
  })

  it('publishes rows typed in by hand (no Timestamp) with an id from org + title + date', () => {
    // As in the real Sheet on 2026-11-20: rows 63–66 are TIDE annual reports without a Timestamp.
    const env = makeEnv([tide({ ts: '', title: 'Annual Report 2021-2022' }), tide({ ts: '', title: 'Annual Report 2020-2021' }), tide({ ts: '', title: 'Annual Report 2020-2021' })])
    const out = exportWith(env)
    expect(out.resources.map(r => r.title)).toEqual(['Annual Report 2021-2022', 'Annual Report 2020-2021'])
    expect(new Set(out.resources.map(r => r.id)).size).toBe(2)
    expect(exportWith(env).resources.map(r => r.id)).toEqual(out.resources.map(r => r.id))
    expect(out.stats.idFromContent).toBe(3)
    expect(out.problems.map(p => p.kind)).toEqual(['duplicate-id'])
  })

  it('records Drive errors per thumbnail instead of failing the export', () => {
    const env = makeEnv([tide({ photo: 'https://drive.google.com/file/d/missingFile0001/view' })])
    expect(exportWith(env).photos[0]).toMatchObject({ error: expect.stringContaining('No item') })
  })

  it('fetchImage refuses ids that are not publishable rows', () => {
    const env = makeEnv([tide({ org: '', photo: 'https://drive.google.com/file/d/photoFile0001/view' })])
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'P-0000000000', token: 'secret-token' } }).error).toMatch(/Unknown publication/)
  })
})

describe('Publications Apps Script — telling GitHub', () => {
  let env
  beforeEach(() => { env = makeEnv([tide()]) })

  it('setup installs change, form-submit and 5-minute triggers, and is safe to re-run', () => {
    env.ctx.setup()
    env.ctx.setup()
    expect(env.triggers.map(t => `${t.getHandlerFunction()}:${t.getEventType()}`).sort()).toEqual(['onSheetChange:change', 'onSheetChange:form', 'tick:time'])
  })

  it('dispatches the publications workflow, debounces bursts and sends the trailing update', () => {
    env.ctx.onSheetChange({})
    env.clock.t += 30_000
    env.ctx.onSheetChange({})
    const calls = () => env.fetches.filter(f => f.url.includes('/dispatches'))
    expect(calls()).toHaveLength(1)
    expect(calls()[0].url).toContain('/actions/workflows/sync-publications.yml/dispatches')
    env.clock.t += 3 * MIN
    env.ctx.tick()
    expect(calls()).toHaveLength(2)
    expect(env.props.has('PENDING_SINCE')).toBe(false)
  })
})
