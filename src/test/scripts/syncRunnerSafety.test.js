// The safety half of scripts/lib/sync-runner.js (audit P6): the parts that decide whether a sync
// publishes, refuses, keeps a photo or deletes a file. Each Sheet sync calls these in order, so a
// regression here would hit all four integrations at once. No network: fetch is stubbed, files live
// in a temp folder, process.exit is intercepted.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createFetchJson, createRedactor, createReport, fetchExport, notePatExpiry, refuseUnlessAllowed,
  fetchPhotos, deletePhotos, writeResults, setOutputs,
} from '../../../scripts/lib/sync-runner.js'
import { isSafeId, photoDeletionError, THRESHOLDS } from '../../../scripts/lib/snapshot-core.js'

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sync-safety-'))
const quiet = () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
const newReport = (dir) => createReport({
  reportPath: path.join(dir, 'report.md'), summaryTitle: 'Test sync', setupGuide: 'docs/X.md', workflowName: 'Sync X',
})

beforeEach(() => {
  quiet()
  vi.stubEnv('GITHUB_OUTPUT', '')
  vi.stubEnv('GITHUB_STEP_SUMMARY', '')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('createFetchJson', () => {
  it('retries a failing request and never puts the token in the final error', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)
    const fetchJson = createFetchJson({ redactToken: createRedactor('s3cret'), timeoutMs: 1000 })
    const done = fetchJson('https://x/exec?action=export&token=s3cret', 3).catch((e) => e)
    await vi.runAllTimersAsync()
    const err = await done
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(err.message).toContain('HTTP 500')
    expect(err.message).not.toContain('s3cret')
    expect(err.message).toContain('token=<redacted>')
  })

  it('returns the JSON of the first successful attempt', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const fetchJson = createFetchJson({ redactToken: (s) => s, timeoutMs: 1000 })
    const done = fetchJson('https://x')
    await vi.runAllTimersAsync()
    expect(await done).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('fetchExport', () => {
  const report = () => ({ notes: [] })
  it('refuses an Apps Script error, a missing answer and a script older than the minimum', async () => {
    const opts = { url: 'u', minScriptVersion: 3, codeGsPath: 'apps-script/x/Code.gs', slowExportMs: 1e9 }
    await expect(fetchExport({ ...opts, report: report(), fetchJson: async () => ({ success: false, error: 'bad token' }) }))
      .rejects.toThrow('bad token')
    await expect(fetchExport({ ...opts, report: report(), fetchJson: async () => null })).rejects.toThrow('no response')
    await expect(fetchExport({ ...opts, report: report(), fetchJson: async () => ({ success: true, scriptVersion: 2 }) }))
      .rejects.toThrow(/too old.*apps-script\/x\/Code\.gs/)
    await expect(fetchExport({ ...opts, report: report(), fetchJson: async () => ({ success: true }) })).rejects.toThrow(/too old/)
  })

  it('passes a current script through', async () => {
    const res = { success: true, scriptVersion: 3, resources: [] }
    const r = report()
    expect(await fetchExport({ url: 'u', minScriptVersion: 3, codeGsPath: 'x', slowExportMs: 1e9, report: r, fetchJson: async () => res })).toBe(res)
    expect(r.notes).toEqual([])
  })
})

describe('notePatExpiry', () => {
  it('warns only inside the warning window', () => {
    const r = { notes: [] }
    const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString()
    notePatExpiry(r, { patExpiresAt: inDays(60) }, 14)
    notePatExpiry(r, {}, 14)
    notePatExpiry(r, null, 14)
    expect(r.notes).toEqual([])
    notePatExpiry(r, { patExpiresAt: inDays(5) }, 14)
    expect(r.notes).toHaveLength(1)
    expect(r.notes[0]).toContain('MAINTENANCE-GITHUB-PAT-REFRESH')
  })
})

describe('refuseUnlessAllowed (the mass-removal gate)', () => {
  it('does nothing when there is no structural problem', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const dir = tmp()
    const report = newReport(dir)
    await refuseUnlessAllowed({ structural: [], allowLargeChange: false, report })
    expect(exit).not.toHaveBeenCalled()
    expect(fs.existsSync(path.join(dir, 'report.md'))).toBe(false)
  })

  it('without allow_large_change: writes the Refused report and outputs, then exits 1', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const dir = tmp()
    const out = path.join(dir, 'out.txt')
    vi.stubEnv('GITHUB_OUTPUT', out)
    const report = newReport(dir)
    await refuseUnlessAllowed({ structural: ['42 of 100 rows would be removed.'], allowLargeChange: false, report })
    expect(exit).toHaveBeenCalledWith(1)
    const md = fs.readFileSync(path.join(dir, 'report.md'), 'utf8')
    expect(md).toContain('Refused')
    expect(md).toContain('42 of 100 rows would be removed.')
    expect(md).toContain('allow_large_change')
    expect(fs.readFileSync(out, 'utf8')).toBe('changed=false\nrefused=true\nproblems=0\n')
  })

  it('with allow_large_change: carries on and records the override', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const report = newReport(tmp())
    await refuseUnlessAllowed({ structural: ['too many'], allowLargeChange: true, report })
    expect(exit).not.toHaveBeenCalled()
    expect(report.refused).toEqual([])
    expect(report.notes.join(' ')).toContain('too many')
  })
})

describe('photo deletion limit (snapshot-core)', () => {
  it('allows max(10, 20 %) deletions, never more', () => {
    expect(THRESHOLDS.maxPhotoDeletesAbs).toBe(10)
    expect(THRESHOLDS.maxPhotoDeletesRatio).toBe(0.2)
    expect(photoDeletionError(10, 12)).toBeNull()
    expect(photoDeletionError(11, 12)).toMatch(/11 of 12/)
    expect(photoDeletionError(100, 500)).toBeNull()
    expect(photoDeletionError(101, 500)).toMatch(/limit 100/)
    expect(photoDeletionError(0, 0)).toBeNull()
  })
})

describe('fetchPhotos', () => {
  const base = { maxPhotos: 50, timeBudgetMs: 1e9, redactToken: createRedactor('tok') }

  it('keeps the previous photo when a download fails and reports it without the token', async () => {
    const manifest = { A: { thumb: 'old-a.webp', fileId: 'f1' } }
    const report = { notes: [], problems: [] }
    const changed = await fetchPhotos({
      ...base, report, manifest,
      plan: { toBackfill: [], toFetch: [{ id: 'A', fileId: 'f2' }] },
      processPhoto: async () => { throw new Error('Drive said no (token=tok)') },
    })
    expect(changed).toBe(false)
    expect(manifest.A).toEqual({ thumb: 'old-a.webp', fileId: 'f1' })
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0].kind).toBe('photo-failed')
    expect(report.problems[0].message).not.toContain('tok)')
  })

  it('stops at the per-run cap and leaves a note for the next run', async () => {
    const manifest = {}
    const report = { notes: [], problems: [] }
    const toFetch = Array.from({ length: 5 }, (_, i) => ({ id: `R${i}`, fileId: `f${i}` }))
    const changed = await fetchPhotos({
      ...base, maxPhotos: 2, report, manifest, plan: { toBackfill: [{ id: 'Z', fileId: 'fz' }], toFetch },
      processPhoto: async (item) => ({ thumb: `${item.id}.webp`, fileId: item.fileId }),
    })
    expect(changed).toBe(true)
    expect(Object.keys(manifest).sort()).toEqual(['R0', 'R1', 'Z'])
    expect(manifest.Z.fileId).toBe('fz')
    expect(report.notes[0]).toMatch(/^3 photo\(s\) still to download/)
  })
})

describe('deletePhotos', () => {
  it('deletes files inside the assets folder only, and only for safe ids', async () => {
    const cwd = tmp()
    const prev = process.cwd()
    process.chdir(cwd)
    try {
      const assets = path.resolve('public/assets/images/x')
      fs.mkdirSync(assets, { recursive: true })
      fs.writeFileSync(path.join(assets, 'a-thumb.webp'), '1')
      fs.writeFileSync(path.resolve('public/keep.txt'), 'keep')
      fs.writeFileSync(path.join(assets, 'b-thumb.webp'), '1')
      const manifest = {
        A: { thumb: 'assets/images/x/a-thumb.webp' },
        B: { thumb: '../public/keep.txt', full: 'keep.txt' },     // escapes the folder: refused
        '../C': { thumb: 'assets/images/x/b-thumb.webp' },        // unsafe id: refused
      }
      const changed = await deletePhotos({ ids: ['A', 'B', '../C'], manifest, assetsDir: assets, isSafeId })
      expect(changed).toBe(true)
      expect(manifest).toEqual({})
      expect(fs.existsSync(path.join(assets, 'a-thumb.webp'))).toBe(false)
      expect(fs.existsSync(path.resolve('public/keep.txt'))).toBe(true)
      expect(fs.existsSync(path.join(assets, 'b-thumb.webp'))).toBe(true)
    } finally {
      process.chdir(prev)
    }
  })
})

describe('writeResults', () => {
  it('writes the snapshot only when its text changed and sorts the manifest keys', async () => {
    const dir = tmp()
    const snapshotPath = path.join(dir, 'sheets', 'x.json')
    const manifestPath = path.join(dir, 'x-photos.json')
    const out = path.join(dir, 'out.txt')
    vi.stubEnv('GITHUB_OUTPUT', out)

    await writeResults({ snapshotPath, snapshotText: '{"a":1}\n', manifestPath, manifest: { b: 1, a: 2 }, manifestChanged: true, report: newReport(dir) })
    expect(fs.readFileSync(snapshotPath, 'utf8')).toBe('{"a":1}\n')
    expect(Object.keys(JSON.parse(fs.readFileSync(manifestPath, 'utf8')))).toEqual(['a', 'b'])
    expect(fs.readFileSync(path.join(dir, 'report.md'), 'utf8')).toContain('Published changes')

    const before = fs.statSync(snapshotPath).mtimeMs
    fs.writeFileSync(out, '')
    await writeResults({ snapshotPath, snapshotText: '{"a":1}\n', manifestPath, manifest: {}, manifestChanged: false, report: newReport(dir) })
    expect(fs.statSync(snapshotPath).mtimeMs).toBe(before)
    expect(fs.readFileSync(out, 'utf8')).toBe('changed=false\nrefused=false\nproblems=0\n')
    expect(fs.readFileSync(path.join(dir, 'report.md'), 'utf8')).toContain('No changes')
  })
})

describe('setOutputs', () => {
  it('is a no-op outside GitHub Actions', async () => {
    vi.stubEnv('GITHUB_OUTPUT', '')
    await expect(setOutputs({ changed: true })).resolves.toBeUndefined()
  })
})
