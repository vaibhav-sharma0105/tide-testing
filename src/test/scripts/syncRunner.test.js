// Shared sync plumbing (scripts/lib/sync-runner.js). The full runs of both syncs are checked
// end-to-end against a fake Apps Script outside the test suite; these cover the pieces whose
// mistakes would be silent: token redaction, the delete guard, the env loader, the report text.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createRedactor, isInsideAssetsDir, loadLocalEnv, createReport, readJson, SHEET_TEXT_NOTICE,
} from '../../../scripts/lib/sync-runner.js'

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sync-runner-'))

describe('createRedactor', () => {
  it('hides token= query values and every copy of the token', () => {
    const redact = createRedactor('tok-123')
    expect(redact('GET https://x/exec?action=export&token=abc&x=1')).toBe('GET https://x/exec?action=export&token=<redacted>&x=1')
    expect(redact('error: tok-123 rejected (tok-123)')).toBe('error: <redacted> rejected (<redacted>)')
    expect(createRedactor(undefined)('no token here')).toBe('no token here')
  })
})

describe('isInsideAssetsDir', () => {
  const dir = path.resolve('public/assets/images/x')
  it('accepts files strictly inside, refuses the dir itself and anything outside', () => {
    expect(isInsideAssetsDir(dir, path.join(dir, 'a-thumb.webp'))).toBeTruthy()
    expect(isInsideAssetsDir(dir, dir)).toBeFalsy()
    expect(isInsideAssetsDir(dir, path.resolve(dir, '../y/a.webp'))).toBeFalsy()
    expect(isInsideAssetsDir(dir, path.resolve('src/data/a.json'))).toBeFalsy()
  })
})

describe('loadLocalEnv', () => {
  const keys = ['FAKESYNC_API_URL', 'FAKESYNC_SYNC_TOKEN', 'OTHER_SYNC_TOKEN']
  afterEach(() => { for (const k of keys) delete process.env[k] })
  it('reads only the given prefix, strips quotes, never overrides a set variable', () => {
    const file = path.join(tmp(), '.env.development')
    fs.writeFileSync(file, 'FAKESYNC_API_URL="https://example.org/exec"\r\n  FAKESYNC_SYNC_TOKEN = \'abc\'  \nOTHER_SYNC_TOKEN=x\n')
    process.env.FAKESYNC_SYNC_TOKEN = 'already-set'
    loadLocalEnv('FAKESYNC_', file)
    expect(process.env.FAKESYNC_API_URL).toBe('https://example.org/exec')
    expect(process.env.FAKESYNC_SYNC_TOKEN).toBe('already-set')
    expect(process.env.OTHER_SYNC_TOKEN).toBeUndefined()
  })
  it('does nothing when the file is missing', () => {
    expect(() => loadLocalEnv('FAKESYNC_', path.join(tmp(), 'missing'))).not.toThrow()
  })
})

describe('createReport', () => {
  it('names the setup guide and the workflow in its fixed texts', async () => {
    const reportPath = path.join(tmp(), 'report.md')
    const report = createReport({ reportPath, summaryTitle: 'X sync', setupGuide: 'docs/X-SETUP-GUIDE.md', workflowName: 'Sync X' })
    report.errors.push('boom')
    report.refused.push('too many removed')
    report.problems.push({ message: 'row 2: bad' })
    report.notes.push('a note')
    const summary = process.env.GITHUB_STEP_SUMMARY
    delete process.env.GITHUB_STEP_SUMMARY
    try { await report.write('❌ Failed') } finally { if (summary !== undefined) process.env.GITHUB_STEP_SUMMARY = summary }
    const md = fs.readFileSync(reportPath, 'utf8')
    expect(md.startsWith('**Outcome:** ❌ Failed\n')).toBe(true)
    expect(md).toContain('See docs/X-SETUP-GUIDE.md → Troubleshooting.')
    expect(md).toContain('**Actions → Sync X → Run workflow**')
    expect(md).toContain(`### Rows that need attention in the Sheet (1)\n\n_${SHEET_TEXT_NOTICE}_\n\n- row 2: bad`)
    expect(md).toContain('### Notes\n\n- a note')
  })
})

describe('readJson', () => {
  it('returns the fallback for a missing or broken file', async () => {
    const d = tmp()
    fs.writeFileSync(path.join(d, 'bad.json'), '{')
    expect(await readJson(path.join(d, 'missing.json'), 'fb')).toBe('fb')
    expect(await readJson(path.join(d, 'bad.json'), null)).toBeNull()
  })
})
