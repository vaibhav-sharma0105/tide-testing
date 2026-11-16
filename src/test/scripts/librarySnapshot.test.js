import { describe, it, expect } from 'vitest'
import {
  normalizeLibrary, buildLibrarySnapshot, validateLibrary, planLibraryPhotos, extractDriveFileId, RESOURCE_FIELDS,
} from '../../../scripts/lib/library-snapshot.js'

const res = (id, extra = {}) => ({ id, name: `Res ${id}`, subject: 'Mathematics', type: 'Worksheet', grades: ['GRADE 1'], chapters: { 'GRADE 1': ['ch 1'] }, ...extra })
const snap = (n, prefix = 'W') => buildLibrarySnapshot(Array.from({ length: n }, (_, i) => normalizeLibrary({ resources: [res(`${prefix}${i + 1}`)] }).resources[0]), null, '2026-11-16T00:00:00.000Z')

describe('library snapshot — normalise', () => {
  it('keeps only allowlisted fields, so a new private column can never be published', () => {
    const { resources } = normalizeLibrary({ resources: [res('W1', { email: 'a@b.co', timestamp: 'x', institution: 'School' })] })
    expect(Object.keys(resources[0])).toEqual(RESOURCE_FIELDS)
  })

  it('drops a field that contains an email address and reports it', () => {
    const { resources, problems } = normalizeLibrary({ resources: [res('W1', { additionalInfo: 'write to me at someone@example.org' })] })
    expect(resources[0].additionalInfo).toBeNull()
    expect(problems[0].kind).toBe('personal-data')
    expect(JSON.stringify(problems)).not.toContain('someone@example.org')
  })

  it('skips unsafe and duplicate ids, removes non-web links, drops unknown grades', () => {
    const { resources, problems } = normalizeLibrary({ resources: [
      res('../etc'), res('W1', { photoUrl: 'javascript:alert(1)', grades: ['GRADE 1', 'GRADE 9'] }), res('W1'),
    ] })
    expect(resources.map(r => r.id)).toEqual(['W1'])
    expect(resources[0].photoUrl).toBeNull()
    expect(resources[0].grades).toEqual(['GRADE 1'])
    expect(problems.map(p => p.kind).sort()).toEqual(['bad-url', 'duplicate-id', 'unsafe-id'])
  })

  it('passes through the problems the Apps Script reported', () => {
    const { problems } = normalizeLibrary({ resources: [], problems: [{ kind: 'missing-id', message: 'row 5 has no ID' }] })
    expect(problems).toEqual([{ kind: 'missing-id', message: 'row 5 has no ID' }])
  })

  it('keeps lastUpdated when nothing changed (no commit, no deploy)', () => {
    const first = snap(3)
    const again = buildLibrarySnapshot(first.resources, first, '2027-01-01T00:00:00.000Z')
    expect(again.lastUpdated).toBe(first.lastUpdated)
  })
})

describe('library snapshot — safety checks', () => {
  it('allows an empty library before anything was ever published', () => {
    expect(validateLibrary(snap(0), null)).toEqual([])
    expect(validateLibrary(snap(0), snap(0))).toEqual([])
  })

  it('refuses to empty a library that had resources (e.g. consent column changed)', () => {
    expect(validateLibrary(snap(0), snap(20))[0]).toMatch(/no publishable resources/)
  })

  it('refuses removing more than max(10, 20%) of resources', () => {
    expect(validateLibrary(snap(90), snap(100))).toEqual([])
    expect(validateLibrary(snap(70), snap(100))[0]).toMatch(/30 of 100/)
  })
})

describe('library snapshot — photos', () => {
  it('reads both Drive link styles', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/1zSvZJbSpbCAJk4p/view?usp=sharing')).toBe('1zSvZJbSpbCAJk4p')
    expect(extractDriveFileId('https://drive.google.com/open?id=1zSvZJbSpbCAJk4p')).toBe('1zSvZJbSpbCAJk4p')
    expect(extractDriveFileId('https://example.com/x')).toBeNull()
  })

  it('plans form-upload photos and keeps a photo when Drive fails', () => {
    const s = buildLibrarySnapshot(normalizeLibrary({ resources: [
      res('W1', { photoUrl: 'https://drive.google.com/open?id=photoFile0001' }),
      res('W2', { photoUrl: 'https://drive.google.com/file/d/photoFile0002/view' }),
    ] }).resources, null, 'now')
    const plan = planLibraryPhotos(s, {
      W1: { fileId: 'photoFile0001', modifiedTime: 't1' },
      W2: { fileId: 'photoFile0002', error: 'boom' },
    }, { W2: { fileId: 'photoFile0002', modifiedTime: 't0' }, GONE: { fileId: 'x', modifiedTime: 't' } })
    expect(plan.toFetch).toEqual([{ id: 'W1', fileId: 'photoFile0001', modifiedTime: 't1' }])
    expect(plan.toDelete).toEqual(['GONE'])
    expect(plan.problems[0].kind).toBe('photo-unavailable')
  })
})

describe('library snapshot — review fixes (2026-11-16)', () => {
  it('drops a chapter entry holding an email address, before the snapshot is written', () => {
    const { resources, problems } = normalizeLibrary({ resources: [res('W1', { chapters: { 'GRADE 1': ['ch 1', 'ask teacher@school.org'] } })] })
    expect(resources[0].chapters).toEqual({ 'GRADE 1': ['ch 1'] })
    expect(problems.map(p => p.kind)).toContain('personal-data')
    expect(JSON.stringify(resources)).not.toMatch(/@/)
  })
  it('reports two IDs whose photos would share one file name, and keeps only the first photo', () => {
    const photo = 'https://drive.google.com/file/d/abcdefghij123/view'
    const { resources, problems } = normalizeLibrary({ resources: [res('K 31', { photoUrl: photo }), res('K_31', { photoUrl: photo })] })
    expect(resources.map(r => [r.id, Boolean(r.photoUrl)])).toEqual([['K 31', true], ['K_31', false]])
    expect(problems).toEqual([expect.objectContaining({ kind: 'photo-name-clash', id: 'K_31' })])
  })
})
