// Runs the real apps-script/social-changemakers/Code.gs in a Node vm sandbox with fake Google services.
// Checks: no public listing, the email columns / other questions / Timestamp never leave the Sheet,
// which rows are published, two photos per profile, and videos only when shared publicly.
// All rows here are made up.
import { describe, it, expect } from 'vitest'
import { readCodeGs, makeAppsScriptEnv, exportWith } from './helpers/fakeAppsScript.js'

const CODE = readCodeGs('apps-script/social-changemakers/Code.gs')
const T0 = Date.parse('2026-11-23T10:00:00.000Z')

// The real header row of "Form responses 1" (A–V), as read from the Sheet on 2026-11-23.
const HEADER = [
  'Timestamp', 'Email address', 'Order to post within batch', 'SCF Batch', 'Name', 'Project name',
  'Write 50-100 words summary about your project that you would like displayed on the website',
  'Upload your photo that can go onto the website; ensure that your face is clearly visible.',
  'Upload one photo that captures your real field work', 'Submit the final video of your project', 'Email Id',
  'What are the next steps in your project (150 words)',
  'This is to confirm that I will present my project (as a poster in the exhibition) at the Miracle of Ideas exhibition by TIDE Foundation on  21st  of July.',
  'In addition to your presentation at Miracle of Ideas Public Exhibition, will you be taking part in other parts of the event? ',
  'Will you be working on a newspaper article?', 'Will you continue working on your project?',
  'If yes, what approach are you going to continue your project?',
  'If you are continuing, please write a formal plan detailing how you intend to continue working on your project (150 words)',
  'I understand that I will be handed physical certificate of Fellowship at the Miracle of Ideas Public Exhibition on 21st July.',
  'Upload webpage write-up (word document) below', 'Upload your testimonial video', 'Upload a few more field work photos',
]
let n = 0
function fellow(o = {}) {
  const r = Array(HEADER.length).fill('')
  r[0] = 'ts' in o ? o.ts : new Date(Date.UTC(2024, 6, 1, 4, 0, n++))
  r[1] = 'student@example.com'
  r[2] = o.order ?? 1
  r[3] = o.batch ?? '23-24'
  r[4] = 'name' in o ? o.name : 'Example Fellow'
  r[5] = o.project ?? 'Example Project'
  r[6] = o.summary ?? 'A short summary.'
  r[7] = o.photo ?? ''
  r[8] = o.field ?? ''
  r[9] = o.video ?? ''
  r[10] = 'private@example.com'
  r[11] = o.next ?? 'Next steps text.'
  r[12] = 'Yes'; r[15] = 'Yes'; r[17] = 'PRIVATE PLAN TEXT'
  r[19] = o.writeup ?? 'https://drive.google.com/open?id=writeupFile001'
  r[20] = o.testimonial ?? ''
  r[21] = 'https://drive.google.com/open?id=morePhotos0001'
  return r
}
const makeEnv = rows => makeAppsScriptEnv({
  code: CODE, now: T0, spreadsheetName: "Social Changemakers' Fellowship Completion Form (Responses)",
  sheets: { 'Form responses 1': [HEADER, ...rows] },
})

describe('Social Changemakers Apps Script — privacy', () => {
  it('has no public listing: every action needs the token', () => {
    const env = makeEnv([fellow()])
    expect(env.ctx.doGet({ parameter: {} }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-tokeX' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'x' } }).success).toBe(false)
  })

  it('never outputs the email columns, the Timestamp or any other question', () => {
    const out = exportWith(makeEnv([fellow({ photo: 'https://drive.google.com/open?id=photoFile0001' })]))
    const text = JSON.stringify(out)
    for (const secret of ['example.com', 'PRIVATE PLAN', 'morePhotos', '2024-07-01']) expect(text).not.toContain(secret)
    expect(Object.keys(out.resources[0]).sort()).toEqual(
      ['batch', 'fieldPhotoUrl', 'id', 'name', 'nextSteps', 'order', 'photoUrl', 'project', 'summary', 'testimonialUrl', 'videoUrl', 'writeupUrl'].sort(),
    )
  })

  it('refuses a photo id that is not a publishable profile', () => {
    const env = makeEnv([fellow({ photo: 'https://drive.google.com/open?id=photoFile0001' })])
    const r = env.ctx.doGet({ parameter: { action: 'fetchImage', token: 'secret-token', id: 'photoFile0001' } })
    expect(r.success).toBe(false)
  })
})

describe('Social Changemakers Apps Script — rows', () => {
  it('maps columns by header and gives anonymous ids', () => {
    const out = exportWith(makeEnv([fellow({ name: 'Asha', project: 'Clean Lake', order: 2, batch: '24-25' })]))
    expect(out.success).toBe(true)
    expect(out.resources[0]).toMatchObject({ name: 'Asha', project: 'Clean Lake', order: '2', batch: '24-25', summary: 'A short summary.', nextSteps: 'Next steps text.' })
    expect(out.resources[0].id).toMatch(/^SC-[0-9a-f]{10}$/)
  })

  it('skips rows without a name or batch and reports them; honours "Hide from website"', () => {
    const header = [...HEADER, 'Hide from website']
    const hidden = [...fellow({ name: 'Hidden One' }), 'Yes']
    const env = makeAppsScriptEnv({ code: CODE, now: T0, spreadsheetName: 'x', sheets: { 'Form responses 1': [header, [...fellow({ name: '' }), ''], [...fellow({ batch: '' }), ''], hidden, [...fellow(), '']] } })
    const out = exportWith(env)
    expect(out.resources).toHaveLength(1)
    expect(out.stats).toMatchObject({ rows: 4, published: 1, noName: 1, noBatch: 1, hidden: 1 })
    expect(out.problems.map(p => p.kind).sort()).toEqual(['missing-batch', 'missing-name'])
  })

  it('gives a hand-typed row (no Timestamp) an id from batch + name', () => {
    const out = exportWith(makeEnv([fellow({ ts: '', name: 'Typed In' })]))
    expect(out.resources[0].id).toMatch(/^SC-/)
    expect(out.stats.idFromContent).toBe(1)
  })

  it('lists both photos per profile, field-work photo as "<id>__field", and serves them by that id', () => {
    const env = makeEnv([fellow({ photo: 'https://drive.google.com/open?id=photoFile0001', field: 'https://drive.google.com/file/d/fieldFile0001/view' })])
    const out = exportWith(env)
    const id = out.resources[0].id
    expect(out.photos.map(p => p.id).sort()).toEqual([id, `${id}__field`].sort())
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', token: 'secret-token', id: `${id}__field` } }).success).toBe(true)
  })

  it('lists a poster frame for a public Drive video ("<id>__video") but none for a private one', () => {
    const env = makeEnv([fellow({ video: 'https://drive.google.com/open?id=videoFile0001' }), fellow({ video: 'https://drive.google.com/open?id=privateVideo01' })])
    const out = exportWith(env)
    const ids = out.photos.map(p => p.id)
    expect(ids).toContain(`${out.resources[0].id}__video`)
    expect(ids).not.toContain(`${out.resources[1].id}__video`)
    expect(env.ctx.doGet({ parameter: { action: 'fetchImage', token: 'secret-token', id: `${out.resources[0].id}__video` } }).success).toBe(true)
  })

  it('publishes a Drive video only when it is shared publicly, and YouTube as youtube-nocookie', () => {
    const out = exportWith(makeEnv([
      fellow({ video: 'https://drive.google.com/open?id=videoFile0001', testimonial: 'https://youtu.be/abcdefghijk' }),
      fellow({ video: 'https://drive.google.com/open?id=privateVideo01', testimonial: 'just some text' }),
    ]))
    expect(out.resources[0].videoUrl).toBe('https://drive.google.com/file/d/videoFile0001/preview')
    expect(out.resources[0].testimonialUrl).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk')
    expect(out.resources[1].videoUrl).toBeNull()
    expect(out.resources[1].testimonialUrl).toBeNull()
    expect(out.problems.map(p => p.kind).sort()).toEqual(['video-not-a-link', 'video-not-public'])
    expect(JSON.stringify(out.problems)).not.toContain('privateVideo01') // the private file id isn't echoed
  })

  it('publishes the write-up (T) only when the Drive file is shared publicly', () => {
    const out = exportWith(makeEnv([fellow(), fellow({ writeup: 'https://drive.google.com/open?id=privateDoc0001' })]))
    expect(out.resources[0].writeupUrl).toBe('https://drive.google.com/file/d/writeupFile001/preview')
    expect(out.resources[1].writeupUrl).toBeNull()
    expect(out.problems.map(p => p.kind)).toContain('writeup-not-public')
  })

  it('fails loudly when a required header is renamed', () => {
    const header = HEADER.map(h => (h === 'SCF Batch' ? 'Batch' : h))
    const env = makeAppsScriptEnv({ code: CODE, now: T0, spreadsheetName: 'x', sheets: { 'Form responses 1': [header, fellow()] } })
    expect(exportWith(env).success).toBe(false)
  })
})

describe('Social Changemakers Apps Script — triggers', () => {
  it('setup installs the change, form-submit and 5-minute triggers once', () => {
    const env = makeEnv([fellow()])
    env.ctx.setup(); env.ctx.setup()
    expect(env.triggers.map(t => `${t.getHandlerFunction()}:${t.getEventType()}`).sort()).toEqual(['onSheetChange:change', 'onSheetChange:form', 'tick:time'])
  })

  it('dispatches to its own workflow', () => {
    const env = makeEnv([fellow()])
    env.ctx.testDispatch()
    expect(env.fetches.at(-1).url).toContain('/actions/workflows/sync-social-changemakers.yml/dispatches')
  })
})
