// Runs the real apps-script/partners/Code.gs in a Node vm sandbox with fake Google services
// (it can't run on Google from CI). Checks: no public listing, the notes columns and the Timestamp
// never leave the Sheet, which rows are published, and the Sheet → partner mapping.
import { describe, it, expect, beforeEach } from 'vitest'
import { readCodeGs, makeAppsScriptEnv, exportWith } from './helpers/fakeAppsScript.js'

const CODE = readCodeGs('apps-script/partners/Code.gs')
const T0 = Date.parse('2026-11-21T10:00:00.000Z')
const MIN = 60_000

// The real header row of "Form Responses 1" (A–H), as read from the Sheet on 2026-11-21.
const HEADER = [
  'Timestamp', 'Type of partner', 'Priority', 'Name of the partner', 'Website (if available)', 'Logo',
  'Column 2', 'Notes for Jwalin- to remove?',
]
let tsCounter = 0
function partner(o = {}) {
  return [
    o.ts ?? new Date(Date.UTC(2026, 7, 31, 4, 0, tsCounter++)), o.type ?? 'Collaborators', o.priority ?? 'High',
    o.name ?? 'Example Foundation', o.website ?? 'https://example.org/', o.logo ?? 'https://drive.google.com/open?id=logoFile00001',
    o.col2 ?? '', o.notes ?? '',
  ]
}

function makeEnv(rows) {
  return makeAppsScriptEnv({
    code: CODE, now: T0, spreadsheetName: 'TIDE/THRIvE Partners (Responses)',
    sheets: { 'Form Responses 1': [HEADER, ...rows], Notes: [['Anything'], ['else']] },
  })
}

describe('Partners Apps Script — privacy', () => {
  it('has no public listing: every action needs the token', () => {
    const env = makeEnv([partner()])
    expect(env.ctx.doGet({ parameter: {} }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-tokeX' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'x' } }).success).toBe(false)
  })

  it('never outputs the notes columns or the Timestamp', () => {
    const env = makeEnv([partner({ ts: new Date('2026-08-31T02:33:46Z'), col2: 'internal-col2', notes: 'internal note: remove?' })])
    const out = exportWith(env)
    const text = JSON.stringify(out)
    for (const secret of ['internal-col2', 'internal note', '2026-08-31', '02:33']) expect(text).not.toContain(secret)
    expect(Object.keys(out.resources[0]).sort()).toEqual(['id', 'name', 'photoUrl', 'priority', 'type', 'website'])
  })

  it('a line with only a note in it is not counted as a submission', () => {
    const env = makeEnv([partner(), ['', '', '', '', '', '', '', 'just a note']])
    expect(exportWith(env).stats.rows).toBe(1)
  })

  it('fails loudly (publishes nothing) when a required header is renamed', () => {
    const env = makeEnv([partner()])
    env.sheets['Form Responses 1'][0] = HEADER.map(h => h === 'Name of the partner' ? 'Organisation' : h)
    const out = exportWith(env)
    expect(out.success).toBe(false)
    expect(out.error).toMatch(/name/)
  })
})

describe('Partners Apps Script — which rows and which columns', () => {
  it('maps the columns by header text, whatever their order (the Sheet has Priority in C and Name in D)', () => {
    const env = makeEnv([partner({ type: 'Knowledge, Research and Funding', priority: 'Extremely high', name: 'University of Example' })])
    const [r] = exportWith(env).resources
    expect(r).toMatchObject({ type: 'Knowledge, Research and Funding', priority: 'Extremely high', name: 'University of Example',
      website: 'https://example.org/', photoUrl: 'https://drive.google.com/open?id=logoFile00001' })
    expect(exportWith(env).photos.map(p => p.fileId)).toEqual(['logoFile00001'])
  })

  it('publishes rows with a type and a name, and honours "Hide from website"', () => {
    const env = makeEnv([partner(), partner({ type: '' }), partner({ name: '' }), partner({ logo: '' })])
    const out = exportWith(env)
    expect(out.resources).toHaveLength(2)
    expect(out.stats).toMatchObject({ rows: 4, published: 2, noType: 1, noName: 1, noLogo: 1 })
    expect(out.problems.map(p => p.kind).sort()).toEqual(['missing-name', 'missing-type'])

    const hidden = makeEnv([partner(), partner({ name: 'Hidden one' })])
    hidden.sheets['Form Responses 1'][0] = [...HEADER, 'Hide from website']
    hidden.sheets['Form Responses 1'][2].push('Yes')
    const out2 = exportWith(hidden)
    expect(out2.resources.map(r => r.name)).toEqual(['Example Foundation'])
    expect(out2.stats.hidden).toBe(1)
  })

  it('keeps only a web link for the website, completing www.…', () => {
    const env = makeEnv([partner({ website: 'our site' }), partner({ website: 'www.example.org' }), partner({ website: ' http://example.org/a ' })])
    const out = exportWith(env)
    expect(out.resources.map(r => r.website)).toEqual([null, 'https://www.example.org', 'http://example.org/a'])
    expect(out.problems.map(p => p.kind)).toEqual(['website-not-a-link'])
  })

  it('gives each row a stable anonymous id from the Timestamp and skips duplicates and blank lines', () => {
    const ts = new Date('2026-08-31T02:33:46Z')
    const env = makeEnv([partner({ ts }), Array(HEADER.length).fill(''), partner({ ts, name: 'Copy' })])
    const out = exportWith(env)
    expect(out.resources).toHaveLength(1)
    expect(out.resources[0].id).toMatch(/^PA-[0-9a-f]{10}$/)
    expect(exportWith(env).resources[0].id).toBe(out.resources[0].id)
    expect(out.stats.rows).toBe(2)
    expect(out.problems.map(p => p.kind)).toEqual(['duplicate-id'])
  })

  it('publishes rows typed in by hand (no Timestamp) with an id from type + name', () => {
    const env = makeEnv([partner({ ts: '', name: 'A' }), partner({ ts: '', name: 'B' }), partner({ ts: '', name: 'B' })])
    const out = exportWith(env)
    expect(out.resources.map(r => r.name)).toEqual(['A', 'B'])
    expect(out.stats.idFromContent).toBe(3)
    expect(out.problems.map(p => p.kind)).toEqual(['duplicate-id'])
  })

  it('records Drive errors per logo instead of failing the export', () => {
    const env = makeEnv([partner({ logo: 'https://drive.google.com/file/d/missingFile0001/view' })])
    expect(exportWith(env).photos[0]).toMatchObject({ error: expect.stringContaining('No item') })
  })
})

describe('Partners Apps Script — fetchImage', () => {
  const fetchImage = (env, id) => env.ctx.doGet({ parameter: { action: 'fetchImage', id, token: 'secret-token' } })

  it('refuses ids that are not publishable rows', () => {
    const env = makeEnv([partner({ name: '' })])
    expect(fetchImage(env, 'PA-0000000000').error).toMatch(/Unknown partner/)
  })

  it('sends a PNG logo as the original file (keeps transparency)', () => {
    const env = makeEnv([partner()])
    const id = exportWith(env).resources[0].id
    expect(fetchImage(env, id)).toMatchObject({ success: true, id, mimeType: 'image/png', base64: 'AQID' })
    expect(env.fetches).toHaveLength(0) // no thumbnail-renderer request for a plain PNG
  })

  it('does not send an SVG as-is (it goes through the Drive renderer)', () => {
    const env = makeEnv([partner({ logo: 'https://drive.google.com/open?id=svgFile00001' })])
    const id = exportWith(env).resources[0].id
    const out = fetchImage(env, id)
    expect(out.base64).toBeUndefined()
  })
})

describe('Partners Apps Script — telling GitHub', () => {
  let env
  beforeEach(() => { env = makeEnv([partner()]) })

  it('setup installs change, form-submit and 5-minute triggers, and is safe to re-run', () => {
    env.ctx.setup()
    env.ctx.setup()
    expect(env.triggers.map(t => `${t.getHandlerFunction()}:${t.getEventType()}`).sort()).toEqual(['onSheetChange:change', 'onSheetChange:form', 'tick:time'])
  })

  it('dispatches the partners workflow, debounces bursts and sends the trailing update', () => {
    env.ctx.onSheetChange({})
    env.clock.t += 30_000
    env.ctx.onSheetChange({})
    const calls = () => env.fetches.filter(f => f.url.includes('/dispatches'))
    expect(calls()).toHaveLength(1)
    expect(calls()[0].url).toContain('/actions/workflows/sync-partners.yml/dispatches')
    env.clock.t += 3 * MIN
    env.ctx.tick()
    expect(calls()).toHaveLength(2)
    expect(env.props.has('PENDING_SINCE')).toBe(false)
  })
})
