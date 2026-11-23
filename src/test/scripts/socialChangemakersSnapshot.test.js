// Every rule in scripts/lib/social-changemakers-snapshot.js (and the ordering helpers in
// src/utils/changemakers.js it shares with the page). All rows are made up.
import { describe, it, expect } from 'vitest'
import {
  normalizeChangemakers, buildChangemakersSnapshot, validateChangemakers, planChangemakersPhotos, RESOURCE_FIELDS,
} from '../../../scripts/lib/social-changemakers-snapshot.js'
import { batchYear, orderNumber, groupByBatch } from '../../utils/changemakers.js'

const row = (o = {}) => ({
  id: 'SC-0000000001', batch: '23-24', order: '1', name: 'Example Fellow', project: 'Example Project',
  summary: 'A summary.', nextSteps: 'Next.', photoUrl: 'https://drive.google.com/open?id=photoFile0001',
  fieldPhotoUrl: 'https://drive.google.com/open?id=fieldFile0001',
  videoUrl: 'https://drive.google.com/file/d/videoFile0001/preview', testimonialUrl: null, ...o,
})
const kinds = p => p.map(x => x.kind).sort()
const ids = n => Array.from({ length: n }, (_, i) => `SC-${String(i).padStart(10, '0')}`)

describe('ordering helpers', () => {
  it('reads the first year of a batch label and the order number', () => {
    expect(['23-24', '2023-24', 'SCF 24–25', 'Batch two'].map(batchYear)).toEqual([2023, 2023, 2024, null])
    expect(['3', ' 3 ', '3.', 'first', '', '0', '2.5', 4].map(orderNumber)).toEqual([3, 3, 3, null, null, null, null, 4])
  })

  it('groups newest batch first, then by order (none last), then name', () => {
    const g = groupByBatch([
      { id: 'a', batch: '23-24', order: 2, name: 'B' }, { id: 'b', batch: '24-25', order: null, name: 'Z' },
      { id: 'c', batch: '24-25', order: 1, name: 'Y' }, { id: 'd', batch: '2023-24', order: 1, name: 'A' },
      { id: 'e', batch: 'Pilot', order: 1, name: 'P' },
    ])
    expect(g.map(x => x.label)).toEqual(['24-25', '2023-24', 'Pilot']) // "23-24" + "2023-24" = one batch; tie → A→Z
    expect(g[0].fellows.map(f => f.id)).toEqual(['c', 'b'])
    expect(g[1].fellows.map(f => f.id)).toEqual(['d', 'a'])
  })
})

describe('normalizeChangemakers', () => {
  it('keeps only allowed fields, never the photo links, and makes order a number', () => {
    const { resources, photoLinks } = normalizeChangemakers({ resources: [{ ...row(), email: 'x@example.com', secret: 'no' }] })
    expect(Object.keys(resources[0])).toEqual(RESOURCE_FIELDS)
    expect(JSON.stringify(resources)).not.toContain('drive.google.com/open')
    expect(resources[0].order).toBe(1)
    expect(photoLinks['SC-0000000001']).toEqual({ photoUrl: row().photoUrl, fieldPhotoUrl: row().fieldPhotoUrl, videoPoster: 'https://drive.google.com/file/d/videoFile0001/view' })
  })

  it('reports a missing order, a batch without a year and missing photos — and still publishes', () => {
    const { resources, problems } = normalizeChangemakers({ resources: [row({ order: '', batch: 'Pilot', photoUrl: null, fieldPhotoUrl: null })] })
    expect(resources).toHaveLength(1)
    expect(kinds(problems)).toEqual(['batch-without-year', 'missing-order', 'missing-photo'])
  })

  it('drops a video link in an unexpected shape, and scrubs email addresses from text', () => {
    const { resources, problems } = normalizeChangemakers({ resources: [row({ videoUrl: 'https://evil.example/x', summary: 'mail me at kid@example.com' })] })
    expect(resources[0].videoUrl).toBeNull()
    expect(resources[0].summary).toBeNull()
    expect(kinds(problems)).toEqual(['bad-video', 'personal-data'])
  })

  it('keeps a Drive viewer write-up link and drops any other shape', () => {
    const ok = 'https://drive.google.com/file/d/writeupFile001/preview'
    const { resources, problems } = normalizeChangemakers({ resources: [row({ writeupUrl: ok }), row({ id: 'SC-0000000002', name: 'B', writeupUrl: 'https://drive.google.com/open?id=x' })] })
    expect(resources.map(r => r.writeupUrl)).toEqual([ok, null])
    expect(kinds(problems)).toEqual(['bad-writeup'])
  })

  it('keeps paragraph breaks in the summary but collapses other spacing', () => {
    const { resources } = normalizeChangemakers({ resources: [row({ summary: 'One   line.\r\n\r\nSecond\n para.' })] })
    expect(resources[0].summary).toBe('One line.\n\nSecond para.')
  })

  it('skips rows without id, name or batch, unsafe ids and duplicates; flags a possible double submission', () => {
    const { resources, problems } = normalizeChangemakers({ resources: [
      row({ id: '' }), row({ name: '' }), row({ batch: null }), row({ id: '../x' }),
      row(), row(), row({ id: 'SC-0000000002' }),
    ] })
    expect(resources.map(r => r.id)).toEqual(['SC-0000000001', 'SC-0000000002'])
    expect(kinds(problems)).toEqual(['duplicate-id', 'missing-id', 'missing-id', 'missing-id', 'possible-duplicate', 'unsafe-id'])
  })
})

describe('snapshot + safety limits', () => {
  it('builds a stable snapshot with total and batch count', () => {
    const { resources } = normalizeChangemakers({ resources: [row(), row({ id: 'SC-0000000002', batch: '24-25', name: 'Other' })] })
    const s = buildChangemakersSnapshot(resources, null, '2026-11-23T00:00:00Z')
    expect(s).toMatchObject({ schemaVersion: 1, section: 'social-changemakers', meta: { total: 2, batches: 2 } })
    expect(buildChangemakersSnapshot(resources, s, 'later').lastUpdated).toBe('2026-11-23T00:00:00Z')
  })

  it('refuses an emptied Sheet and a removal over the limit', () => {
    const prev = { resources: ids(30).map(id => ({ id })) }
    expect(validateChangemakers({ resources: [] }, prev)[0]).toMatch(/no profiles/)
    expect(validateChangemakers({ resources: ids(15).map(id => ({ id })) }, prev)[0]).toMatch(/15 of 30 profiles would disappear \(limit 10\)/)
    expect(validateChangemakers({ resources: ids(25).map(id => ({ id })) }, prev)).toEqual([])
  })
})

describe('photo plan', () => {
  it('plans both photos per profile and deletes only those whose row or link is gone', () => {
    const links = { 'SC-1': { photoUrl: 'https://drive.google.com/open?id=photoFile0001', fieldPhotoUrl: 'https://drive.google.com/open?id=fieldFile0001' } }
    const photos = {
      'SC-1': { fileId: 'photoFile0001', modifiedTime: 't1' },
      'SC-1__field': { fileId: 'fieldFile0001', modifiedTime: 't1' },
    }
    const plan = planChangemakersPhotos(links, photos, { 'SC-gone': { thumb: 'x' }, 'SC-gone__field': { thumb: 'y' } })
    expect(plan.toFetch.map(p => p.id).sort()).toEqual(['SC-1', 'SC-1__field'])
    expect(plan.toDelete.sort()).toEqual(['SC-gone', 'SC-gone__field'])
  })

  it('plans a poster frame for each public Drive video, none for YouTube', () => {
    const { photoLinks } = normalizeChangemakers({ resources: [row({ testimonialUrl: 'https://www.youtube-nocookie.com/embed/abcdefghijk' })] })
    expect(photoLinks['SC-0000000001'].videoPoster).toBe('https://drive.google.com/file/d/videoFile0001/view')
    expect(photoLinks['SC-0000000001'].testimonialPoster).toBeUndefined()
    const plan = planChangemakersPhotos(photoLinks, {
      'SC-0000000001': { fileId: 'photoFile0001', modifiedTime: 't' }, 'SC-0000000001__field': { fileId: 'fieldFile0001', modifiedTime: 't' },
      'SC-0000000001__video': { fileId: 'videoFile0001', modifiedTime: 't' },
    }, {})
    expect(plan.toFetch.map(p => p.id).sort()).toEqual(['SC-0000000001', 'SC-0000000001__field', 'SC-0000000001__video'])
  })

  it('keeps a photo whose Drive lookup failed', () => {
    const links = { 'SC-1': { photoUrl: 'https://drive.google.com/open?id=photoFile0001' } }
    const plan = planChangemakersPhotos(links, { 'SC-1': { fileId: 'photoFile0001', error: 'boom' } }, { 'SC-1': { fileId: 'photoFile0001', modifiedTime: 't0', thumb: 'x' } })
    expect(plan.toDelete).toEqual([])
    expect(plan.problems.map(p => p.kind)).toEqual(['photo-unavailable'])
  })
})
