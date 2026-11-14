import { describe, it, expect } from 'vitest'
import {
  normalizeResources, buildSnapshot, serializeSnapshot, validateStructure, planPhotos,
  photoDeletionError, photosFromLegacyManifest, photosFromExport, contentHash, isHttpUrl,
  extractDriveFileId,
} from '../../../scripts/lib/abl-snapshot.js'

const NOW = '2026-11-15T10:00:00.000Z'
const LATER = '2026-11-16T10:00:00.000Z'
const drive = id => `https://drive.google.com/file/d/${id}/view`

function row(id, extra = {}) {
  return { id, name: `Name ${id}`, type: 'Worksheet', photoUrl: drive(`f${id}`), grades: ['GRADE 1'], chapters: { 'GRADE 1': ['Ch 1'] }, quantity: 2, ...extra }
}
function payload(tabs) {
  return { success: true, tabs: Object.keys(tabs), resources: tabs }
}
function snap(tabs, prev = null, now = NOW) {
  const n = normalizeResources(payload(tabs))
  return { snapshot: buildSnapshot(n, prev, now), problems: n.problems }
}
const many = (prefix, n, extra) => Array.from({ length: n }, (_, i) => row(`${prefix}${i + 1}`, extra))

describe('normalizeResources', () => {
  it('keeps only allowlisted fields, in a fixed order', () => {
    const { resources } = normalizeResources(payload({ Worksheet: [row('W1', { secretNotes: 'private', email: 'x@y.z' })] }))
    const r = resources.Worksheet[0]
    expect(r).not.toHaveProperty('secretNotes')
    expect(r).not.toHaveProperty('email')
    expect(Object.keys(r)[0]).toBe('id')
    expect(r.quantity).toBe(2)
  })

  it('drops rows without id or name and reports them', () => {
    const { resources, problems } = normalizeResources(payload({ Games: [row('G1'), { name: 'no id' }, { id: 'G3', name: '  ' }] }))
    expect(resources.Games.map(r => r.id)).toEqual(['G1'])
    expect(problems.map(p => p.kind).sort()).toEqual(['missing-id', 'missing-name'])
  })

  it('keeps the first of duplicate ids, across tabs too', () => {
    const { resources, problems } = normalizeResources(payload({ Kits: [row('K1')], Games: [row('K1'), row('G2')] }))
    expect(resources.Kits.map(r => r.id)).toEqual(['K1'])
    expect(resources.Games.map(r => r.id)).toEqual(['G2'])
    expect(problems).toHaveLength(1)
    expect(problems[0].kind).toBe('duplicate-id')
  })

  it('removes non-web links (e.g. javascript:) and reports them', () => {
    const { resources, problems } = normalizeResources(payload({ Kits: [row('K1', { referenceLink: 'javascript:alert(1)', videoUrl: 'not a url' })] }))
    expect(resources.Kits[0].referenceLink).toBeNull()
    expect(resources.Kits[0].videoUrl).toBeNull()
    expect(problems.filter(p => p.kind === 'bad-url')).toHaveLength(2)
  })

  it('omits empty tabs and tolerates junk input', () => {
    expect(normalizeResources(payload({ Empty: [] })).tabs).toEqual([])
    expect(normalizeResources(null).tabs).toEqual([])
  })
})

describe('buildSnapshot', () => {
  it('keeps the payload shape the pages read (success, tabs, resources, meta.counts, meta.total)', () => {
    const { snapshot } = snap({ Worksheet: many('W', 3), Games: many('G', 2) })
    expect(snapshot.success).toBe(true)
    expect(snapshot.tabs).toEqual(['Worksheet', 'Games'])
    expect(snapshot.meta).toEqual({ counts: { Worksheet: 3, Games: 2 }, total: 5 })
    expect(snapshot.schemaVersion).toBe(1)
  })

  it('is idempotent: same content keeps lastUpdated and serializes byte-identically', () => {
    const first = snap({ Worksheet: many('W', 3) }).snapshot
    const second = snap({ Worksheet: many('W', 3) }, first, LATER).snapshot
    expect(second.lastUpdated).toBe(NOW)
    expect(serializeSnapshot(second)).toBe(serializeSnapshot(first))
  })

  it('moves lastUpdated when content changes', () => {
    const first = snap({ Worksheet: many('W', 3) }).snapshot
    const second = snap({ Worksheet: [...many('W', 3), row('W9')] }, first, LATER).snapshot
    expect(second.lastUpdated).toBe(LATER)
    expect(second.contentHash).not.toBe(first.contentHash)
  })

  it('hash ignores object key order', () => {
    const a = { tabs: ['T'], resources: { T: [{ id: '1', name: 'a' }] } }
    const b = { tabs: ['T'], resources: { T: [{ name: 'a', id: '1' }] } }
    expect(contentHash(a)).toBe(contentHash(b))
  })
})

describe('validateStructure', () => {
  it('refuses an empty result', () => {
    const { snapshot } = snap({})
    expect(validateStructure(snapshot, null)).toHaveLength(1)
  })

  it('allows the first run with no previous snapshot', () => {
    const { snapshot } = snap({ Worksheet: many('W', 3) })
    expect(validateStructure(snapshot, null)).toEqual([])
  })

  it('allows removing up to 10 rows even from a small library', () => {
    const prev = snap({ Worksheet: many('W', 30) }).snapshot
    const next = snap({ Worksheet: many('W', 30).slice(10) }, prev).snapshot
    // 20 left in a tab of 30: drop is 33% (< 50%), removal 10 (= abs limit)
    expect(validateStructure(next, prev)).toEqual([])
  })

  it('refuses removing more than max(10, 20%) of rows', () => {
    const prev = snap({ Worksheet: many('W', 100), Games: many('G', 100) }).snapshot
    const next = snap({ Worksheet: many('W', 100), Games: many('G', 100).slice(41) }, prev).snapshot
    const errors = validateStructure(next, prev)
    expect(errors.some(e => e.includes('would disappear'))).toBe(true)
  })

  it('refuses when a tab with 5+ rows vanishes', () => {
    const prev = snap({ Worksheet: many('W', 50), Kits: many('K', 6) }).snapshot
    const next = snap({ Worksheet: many('W', 50) }, prev).snapshot
    expect(validateStructure(next, prev).some(e => e.includes('"Kits"'))).toBe(true)
  })

  it('refuses when a tab drops by more than half', () => {
    const prev = snap({ Worksheet: many('W', 100), Kits: many('K', 10) }).snapshot
    const next = snap({ Worksheet: many('W', 100), Kits: many('K', 4) }, prev).snapshot
    expect(validateStructure(next, prev).some(e => e.includes('dropped from 10 to 4'))).toBe(true)
  })

  it('ignores small tabs (<5 rows) disappearing', () => {
    const prev = snap({ Worksheet: many('W', 50), Kits: many('K', 3) }).snapshot
    const next = snap({ Worksheet: many('W', 50) }, prev).snapshot
    expect(validateStructure(next, prev)).toEqual([])
  })

  it('refuses when more than 10% of rows lost their name (renamed header)', () => {
    const tabs = { Worksheet: [...many('W', 8), ...many('X', 2, { name: '' })] }
    const { snapshot, problems } = snap(tabs)
    expect(validateStructure(snapshot, null, problems).some(e => e.includes('no name'))).toBe(true)
  })

  it('refuses an oversized snapshot', () => {
    const { snapshot } = snap({ Worksheet: [row('W1', { description: 'x'.repeat(2.1 * 1024 * 1024) })] })
    expect(validateStructure(snapshot, null).some(e => e.includes('safety limit'))).toBe(true)
  })
})

describe('planPhotos', () => {
  const s = snap({ Worksheet: [row('W1'), row('W2'), row('W3', { photoUrl: null })] }).snapshot

  it('fetches new photos and photos whose file or timestamp changed', () => {
    const photos = { W1: { fileId: 'fW1', modifiedTime: 't1' }, W2: { fileId: 'fNEW', modifiedTime: 't1' } }
    const local = { W1: { fileId: 'fW1', modifiedTime: 't0', thumb: 'a', full: 'b' }, W2: { fileId: 'fW2', modifiedTime: 't1', thumb: 'a', full: 'b' } }
    const plan = planPhotos(s, photos, local)
    expect(plan.toFetch.map(p => p.id).sort()).toEqual(['W1', 'W2'])
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
    const bad = snap({ Worksheet: [row('../etc')] }).snapshot
    const plan = planPhotos(bad, { '../etc': { fileId: 'x', modifiedTime: 't' } }, {})
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

describe('photo sources', () => {
  const s = snap({ Worksheet: [row('W1'), row('W2'), row('W3', { photoUrl: null })] }).snapshot

  it('legacy manifest: a row with a Drive link missing from the manifest becomes an error (kept)', () => {
    const photos = photosFromLegacyManifest(s, [{ id: 'W1', fileId: 'fW1', modifiedTime: 't' }])
    expect(photos.W1).toEqual({ fileId: 'fW1', modifiedTime: 't' })
    expect(photos.W2.error).toBeTruthy()
    expect(photos).not.toHaveProperty('W3')
  })

  it('v3 export list maps to the same shape', () => {
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
})
