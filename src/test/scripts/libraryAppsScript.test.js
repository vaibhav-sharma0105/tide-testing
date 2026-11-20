// Runs the real apps-script/pramaan-library/Code.gs in a Node vm sandbox with fake Google
// services (it can't run on Google from CI). Checks the rules that protect contributors: consent
// filter, personal columns never output, no public listing, and the Sheet → resource mapping.
import { describe, it, expect, beforeEach } from 'vitest'
import { readCodeGs, makeAppsScriptEnv, exportWith } from './helpers/fakeAppsScript.js'

const CODE = readCodeGs('apps-script/pramaan-library/Code.gs')
const T0 = Date.parse('2026-11-16T10:00:00.000Z')
const MIN = 60_000

// The real header row of "Form responses 1" (A–Y), as read from the Sheet on 2026-11-16.
const HEADER = [
  'Internal ID if any', 'Subject', 'Name of resource', 'Short description',
  'What type of resources would you like to share? ', 'Concepts captured', 'Language of materials',
  'Upload a photo / print ready PDF of the resource',
  'Link to explanation video (if you have a video file then upload to youtube or cloud storage platform and share the link). ',
  'Any additional link/information', 'Organization / Person that owns the material ', 'Timestamp', 'Email address', 'Name ',
  'Name of NGO/School/College/University/Other educational institution', 'Position',
  'Do you consent to share the teaching materials you are submitting with educators worldwide through an open-access platform?',
  'Do you confirm that the materials you are submitting are your original work or that you have obtained the necessary permissions to share any third-party content included?',
  'Do you confirm that the materials you are submitting are accurate, appropriate for classroom use, and align with ethical educational practices?',
  'Curricular alignment with NCERT textbook chapters [Grade 1]', 'Curricular alignment with NCERT textbook chapters [Grade 2]',
  'Curricular alignment with NCERT textbook chapters [Grade 3]', 'Curricular alignment with NCERT textbook chapters [Grade 4]',
  'Curricular alignment with NCERT textbook chapters [Grade 5]', 'Curricular alignment with NCERT textbook chapters [Foundational]',
]
const NO = "Doesn't fit the grade"
function row(o) {
  return [
    o.id ?? '', o.subject ?? 'Mathematics', o.name ?? 'Counting', o.desc ?? 'A puzzle', o.type ?? 'Worksheet', 'Addition', 'Gujarati',
    o.photo ?? '', o.video ?? '', o.extra ?? '', o.owner ?? 'TIDE Foundation', o.ts ?? '', 'person@example.com', 'A Person',
    'Some School', 'Teacher', ...(o.consent ?? ['Yes', 'Yes', 'Yes']), ...(o.grades ?? ['ch 2, ch 5', 'ch 10', NO, '', NO, '']),
  ]
}

function makeEnv(rows) {
  return makeAppsScriptEnv({
    code: CODE, now: T0, spreadsheetName: 'Responses',
    sheets: {
      'Form responses 1': [HEADER, ...rows],
      'Next steps required in cleaning the ABL RC': [['Next steps required'], ['Chapter alignment']],
    },
  })
}

describe('Pramaan Library Apps Script — privacy and consent', () => {
  it('has no public listing: every action needs the token', () => {
    const env = makeEnv([row({ id: 'W1' })])
    expect(env.ctx.doGet({ parameter: {} }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-tokeX' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'W1' } }).success).toBe(false)
  })

  it('publishes a row only when all three consent answers are "Yes"', () => {
    const env = makeEnv([
      row({ id: 'W1', consent: ['Yes', 'Yes', 'Yes'] }),
      row({ id: 'W2', consent: ['', '', ''] }),
      row({ id: 'W3', consent: ['Yes', 'No', 'Yes'] }),
      row({ id: 'W4', consent: ['yes', 'YES', 'Yes, I confirm'] }),
    ])
    const out = exportWith(env)
    expect(out.resources.map(r => r.id)).toEqual(['W1', 'W4'])
    expect(out.stats).toMatchObject({ rows: 4, published: 2, notConsented: 2 })
  })

  it('never outputs the personal columns (timestamp, email, name, institution, position)', () => {
    const env = makeEnv([row({ id: 'W1', ts: new Date('2026-03-01T05:00:00Z') }), row({ ts: '3/2/2026 10:00:00' })])
    const text = JSON.stringify(exportWith(env))
    for (const secret of ['person@example.com', 'A Person', 'Some School', 'Teacher', '2026-03-01', '3/2/2026']) {
      expect(text).not.toContain(secret)
    }
    expect(Object.keys(exportWith(env).resources[0]).sort()).toEqual(
      ['additionalInfo', 'chapters', 'concept', 'description', 'grades', 'id', 'language', 'name', 'ownership', 'photoUrl', 'subject', 'type', 'videoUrl'])
  })

  it('fails loudly (publishes nothing) when a consent question header is renamed', () => {
    const env = makeEnv([row({ id: 'W1' })])
    env.sheets['Form responses 1'][0] = HEADER.map(h => h.startsWith('Do you consent') ? 'Consent?' : h)
    const out = exportWith(env)
    expect(out.success).toBe(false)
    expect(out.error).toMatch(/consent/i)
  })
})

describe('Pramaan Library Apps Script — mapping the form columns', () => {
  it('maps the stakeholder columns and derives grades + chapters from the alignment columns', () => {
    const env = makeEnv([row({ id: 'W1', grades: ['ch 2, ch 5', 'ch 10,  ch 14', NO, '', NO, 'Number sense'] })])
    const r = exportWith(env).resources[0]
    expect(r).toMatchObject({ id: 'W1', name: 'Counting', subject: 'Mathematics', type: 'Worksheet', ownership: 'TIDE Foundation', description: 'A puzzle' })
    expect(r.grades).toEqual(['GRADE 1', 'GRADE 2', 'FOUNDATIONAL'])
    expect(r.chapters).toEqual({ 'GRADE 1': ['ch 2', 'ch 5'], 'GRADE 2': ['ch 10', 'ch 14'], FOUNDATIONAL: ['Number sense'] })
  })

  it('accepts Google Form upload links (open?id=) and keeps the first of repeated video links', () => {
    const v = 'https://drive.google.com/file/d/videoFile0001/view?usp=drive_link'
    const env = makeEnv([row({ id: 'W1', photo: 'https://drive.google.com/open?id=photoFile0001', video: `${v} ${v}\nhttps://youtu.be/abcdefghijk` })])
    const out = exportWith(env)
    expect(out.resources[0].photoUrl).toBe('https://drive.google.com/open?id=photoFile0001')
    expect(out.resources[0].videoUrl).toBe(v)
    expect(out.photos).toEqual([{ id: 'W1', fileId: 'photoFile0001', modifiedTime: '2026-01-01T00:00:00.000Z' }])
  })

  it('gives rows without an Internal ID a stable id from the timestamp, and reports rows with neither', () => {
    const env = makeEnv([row({ ts: '3/2/2026 10:00:00', name: 'A' }), row({ name: 'B' })])
    const first = exportWith(env)
    expect(first.resources).toHaveLength(1)
    expect(first.resources[0].id).toMatch(/^R-[0-9a-f]{10}$/)
    expect(exportWith(env).resources[0].id).toBe(first.resources[0].id) // stable across runs
    expect(first.problems.map(p => p.kind)).toEqual(['missing-id'])
    expect(JSON.stringify(first.problems)).not.toContain('3/2/2026')
  })

  it('skips duplicate ids and blank lines, reporting duplicates', () => {
    const env = makeEnv([row({ id: 'W1' }), Array(HEADER.length).fill(''), row({ id: 'W1', name: 'Other' })])
    const out = exportWith(env)
    expect(out.resources.map(r => r.name)).toEqual(['Counting'])
    expect(out.stats.rows).toBe(2)
    expect(out.problems[0].kind).toBe('duplicate-id')
  })

  it('records Drive errors per photo instead of failing the export', () => {
    const env = makeEnv([row({ id: 'W1', photo: 'https://drive.google.com/file/d/missingFile0001/view' })])
    expect(exportWith(env).photos[0]).toMatchObject({ id: 'W1', error: expect.stringContaining('No item') })
  })

  it('fetchImage refuses ids that are not consented rows', () => {
    const env = makeEnv([row({ id: 'W1', photo: 'https://drive.google.com/file/d/photoFile0001/view', consent: ['', '', ''] })])
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'W1', token: 'secret-token' } }).error).toMatch(/Unknown resource/)
  })
})

describe('Pramaan Library Apps Script — telling GitHub', () => {
  let env
  beforeEach(() => { env = makeEnv([row({ id: 'W1' })]) })

  it('setup installs change, form-submit and 5-minute triggers, and is safe to re-run', () => {
    env.ctx.setup()
    env.ctx.setup()
    expect(env.triggers.map(t => `${t.getHandlerFunction()}:${t.getEventType()}`).sort()).toEqual(['onSheetChange:change', 'onSheetChange:form', 'tick:time'])
  })

  it('dispatches the library workflow, debounces bursts and sends the trailing update', () => {
    env.ctx.onSheetChange({})
    env.clock.t += 30_000
    env.ctx.onSheetChange({})
    const calls = () => env.fetches.filter(f => f.url.includes('/dispatches'))
    expect(calls()).toHaveLength(1)
    expect(calls()[0].url).toContain('/actions/workflows/sync-pramaan-library.yml/dispatches')
    env.clock.t += 3 * MIN
    env.ctx.tick()
    expect(calls()).toHaveLength(2)
    expect(env.props.has('PENDING_SINCE')).toBe(false)
  })
})
