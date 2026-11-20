import { describe, it, expect } from 'vitest'
import {
  serializeSnapshot, planPhotos, photoDeletionError, photosFromExport, contentHash, isHttpUrl,
  extractDriveFileId, isSafeId, extractDriveFileIdAnyLink, photoFileBase, cleanString, cleanStringCollapseSpaces,
  planListPhotos,
} from '../../../scripts/lib/snapshot-core.js'

// Shared snapshot rules (scripts/lib/snapshot-core.js). Ported from the former Pramaan sync's tests
// when that sync was retired (git tag archive/pramaan-live-read); the cases are unchanged.
const drive = id => `https://drive.google.com/file/d/${id}/view`
const row = (id, extra = {}) => ({ id, name: `Name ${id}`, photoUrl: drive(`f${id}`), ...extra })
// planPhotos reads the tab-shaped snapshot ({ tabs, resources: { tab: [...] } })
const tabs = (rows) => ({ tabs: ['T'], resources: { T: rows } })

describe('contentHash / serializeSnapshot', () => {
  it('hash ignores object key order', () => {
    const a = { tabs: ['T'], resources: { T: [{ id: '1', name: 'a' }] } }
    const b = { tabs: ['T'], resources: { T: [{ name: 'a', id: '1' }] } }
    expect(contentHash(a)).toBe(contentHash(b))
  })
  it('serializes with 2-space indent and a trailing newline', () => {
    expect(serializeSnapshot({ a: 1 })).toBe('{\n  "a": 1\n}\n')
  })
})

describe('planPhotos', () => {
  const s = tabs([row('W1'), row('W2'), row('W3', { photoUrl: null })])

  it('fetches new photos and photos whose file or timestamp changed', () => {
    const photos = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fNEW', modifiedTime: 't1' } }
    const local = { W1: { fileId: 'fW1', modifiedTime: 't0', thumb: 'a', full: 'b' }, W2: { fileId: 'fW2', modifiedTime: 't1', thumb: 'a', full: 'b' } }
    expect(planPhotos(s, photos, local).toFetch.map(p => p.id).sort()).toEqual(['W1', 'W2'])
  })

  it('skips unchanged photos', () => {
    const photos = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fW2', modifiedTime: 't1' } }
    const local = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fW2', modifiedTime: 't1' } }
    expect(planPhotos(s, photos, local).toFetch).toEqual([])
  })

  it('back-fills fileId for legacy entries instead of re-downloading', () => {
    const photos = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fW2', modifiedTime: 't1' } }
    const local = { W1: { modifiedTime: 't1', thumb: 'a', full: 'b' }, W2: { fileId: 'fW2', modifiedTime: 't1' } }
    const plan = planPhotos(s, photos, local)
    expect(plan.toFetch).toEqual([])
    expect(plan.toBackfill).toEqual([{ id: 'W1', fileId: 'fW1' }])
  })

  it('NEVER deletes a photo because Drive failed — keeps it and reports', () => {
    const photos = { W1: { fileId: 'fW1', error: 'Drive quota' } } // W2 missing entirely
    const local = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fW2', modifiedTime: 't1' } }
    const plan = planPhotos(s, photos, local)
    expect(plan.toDelete).toEqual([])
    expect(plan.toFetch).toEqual([])
    expect(plan.problems.filter(p => p.kind === 'photo-unavailable')).toHaveLength(2)
  })

  it('deletes photos only when the row is gone or has no photo link', () => {
    const local = { W1: { fileId: 'fW1', modifiedTime: 't' }, W3: { fileId: 'old', modifiedTime: 't' }, GONE: { fileId: 'g', modifiedTime: 't' } }
    const photos = { W1: { fileId: 'fW1', modifiedTime: 't' }, W2: { fileId: 'fW2', modifiedTime: 't' } }
    expect(planPhotos(s, photos, local).toDelete.sort()).toEqual(['GONE', 'W3'])
  })

  it('publishes rows with unsafe ids but without a photo', () => {
    const plan = planPhotos(tabs([row('../etc')]), { '../etc': { fileId: 'x', modifiedTime: 't' } }, {})
    expect(plan.toFetch).toEqual([])
    expect(plan.problems[0].kind).toBe('unsafe-id')
  })
})

describe('photo deletion cap', () => {
  it('allows up to max(10, 20%)', () => {
    expect(photoDeletionError(10, 20)).toBeNull()
    expect(photoDeletionError(32, 160)).toBeNull()
  })
  it('refuses beyond it', () => {
    expect(photoDeletionError(11, 20)).toMatch(/would be deleted/)
    expect(photoDeletionError(160, 160)).toMatch(/limit 32/)
  })
})

describe('photosFromExport', () => {
  it('maps the export list to id -> photo, keeping errors', () => {
    const photos = photosFromExport([{ id: 'W1', fileId: 'f', modifiedTime: 't' }, { id: 'W2', fileId: 'g', error: 'boom' }, null])
    expect(photos.W1).toEqual({ fileId: 'f', modifiedTime: 't' })
    expect(photos.W2).toEqual({ fileId: 'g', error: 'boom' })
  })
})

describe('helpers', () => {
  it('isHttpUrl', () => {
    expect(isHttpUrl('https://a.b/c')).toBe(true)
    expect(isHttpUrl('http://a.b')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('ftp://a')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
  })
  it('extractDriveFileId', () => {
    expect(extractDriveFileId(drive('abc_D-9'))).toBe('abc_D-9')
    expect(extractDriveFileId('https://example.com')).toBeNull()
  })
  it('isSafeId', () => {
    expect(isSafeId('K32 (26 in Gujarati)')).toBe(true)
    expect(isSafeId('../etc')).toBe(false)
    expect(isSafeId('')).toBe(false)
  })
})

describe('helpers shared by the one-list Sheets (library, publications)', () => {
  it('extractDriveFileIdAnyLink reads /d/ and ?id= links (10+ chars); extractDriveFileId reads /d/ only', () => {
    expect(extractDriveFileIdAnyLink('https://drive.google.com/open?id=photoFile0001')).toBe('photoFile0001')
    expect(extractDriveFileIdAnyLink(drive('photoFile0002'))).toBe('photoFile0002')
    expect(extractDriveFileIdAnyLink(drive('short'))).toBeNull()
    expect(extractDriveFileIdAnyLink(null)).toBeNull()
    expect(extractDriveFileId('https://drive.google.com/open?id=photoFile0001')).toBeNull()
    expect(extractDriveFileId(drive('short'))).toBe('short')
  })
  it('photoFileBase makes a URL-safe file name', () => {
    expect(photoFileBase('K32 (26 in Gujarati)')).toBe('K32__26_in_Gujarati_')
  })
  it('cleanString trims; cleanStringCollapseSpaces also squeezes inner whitespace', () => {
    expect(cleanString('  a \n b  ')).toBe('a \n b')
    expect(cleanStringCollapseSpaces('  a \n b  ')).toBe('a b')
    for (const f of [cleanString, cleanStringCollapseSpaces]) {
      expect(f('   ')).toBeNull()
      expect(f(null)).toBeNull()
      expect(f(undefined)).toBeNull()
      expect(f(5)).toBe('5')
    }
  })
  it('planListPhotos plans form-upload links like /d/ links', () => {
    const resources = [{ id: 'A1', photoUrl: 'https://drive.google.com/open?id=photoFile0001' }, { id: 'A2', photoUrl: null }]
    const photos = { A1: { fileId: 'photoFile0001', modifiedTime: 't1' } }
    const plan = planListPhotos('T', resources, photos, { A2: { fileId: 'old', modifiedTime: 't0' } })
    expect(plan.toFetch).toEqual([{ id: 'A1', fileId: 'photoFile0001', modifiedTime: 't1' }])
    expect(plan.toDelete).toEqual(['A2'])
  })
})
