// Every rule in scripts/lib/publications-snapshot.js (the Publications sync's pure logic).
import { describe, it, expect } from 'vitest'
import {
  normalizePublications, buildPublicationsSnapshot, validatePublications, planPublicationsPhotos,
  splitFields, RESOURCE_FIELDS,
} from '../../../scripts/lib/publications-snapshot.js'

const row = (o = {}) => ({
  id: 'P-0000000001', org: 'THRIvE', date: '2026-03-23', title: 'A title', type: 'Blog', fields: 'Holistic Education',
  description: 'About it', citation: 'Author, A. (2026).', link: 'https://example.org/a', photoUrl: null, ...o,
})
const ids = n => Array.from({ length: n }, (_, i) => `P-${String(i).padStart(10, '0')}`)

describe('splitFields', () => {
  it('splits checkbox answers on commas but keeps known comma-containing options whole', () => {
    expect(splitFields('Holistic Education, Teacher agency, wellbeing, motivation, and professional development'))
      .toEqual(['Teacher agency, wellbeing, motivation, and professional development', 'Holistic Education'])
    expect(splitFields('Teacher agency, wellbeing, motivation, and professional development'))
      .toEqual(['Teacher agency, wellbeing, motivation, and professional development'])
    expect(splitFields('Social emotional learning,  Research methods')).toEqual(['Social emotional learning', 'Research methods'])
    expect(splitFields('')).toEqual([])
    expect(splitFields(null)).toEqual([])
  })
})

describe('normalizePublications', () => {
  it('keeps only allowlisted fields and drops anything else the script returns', () => {
    const { resources } = normalizePublications({ resources: [row({ email: 'x@example.com', timestamp: '19/06/2026' })] })
    expect(Object.keys(resources[0])).toEqual(RESOURCE_FIELDS)
    expect(resources[0].fields).toEqual(['Holistic Education'])
  })

  it('removes an email address typed into a published field and reports it', () => {
    const { resources, problems } = normalizePublications({ resources: [row({ description: 'Write to me@example.com' })] })
    expect(resources[0].description).toBeNull()
    expect(problems.map(p => p.kind)).toContain('personal-data')
  })

  it('skips rows with an unknown org, unsafe or duplicate ids, or no title', () => {
    const { resources, problems } = normalizePublications({ resources: [
      row(), row({ id: 'P-0000000001', title: 'Dup' }), row({ id: '../x', title: 'Bad' }), row({ id: 'P-2', org: 'Other' }), row({ id: 'P-3', title: '' }),
    ] })
    expect(resources.map(r => r.title)).toEqual(['A title'])
    expect(problems.map(p => p.kind).sort()).toEqual(['bad-org', 'duplicate-id', 'missing-id', 'unsafe-id'])
  })

  it('normalises the org spelling to TIDE / THRIvE', () => {
    const { resources } = normalizePublications({ resources: [row({ org: 'thrive' }), row({ id: 'P-2', org: 'tide' })] })
    expect(resources.map(r => r.org).sort()).toEqual(['THRIvE', 'TIDE'])
  })

  it('removes non-web links and reports missing links and unreadable dates', () => {
    const { resources, problems } = normalizePublications({ resources: [
      row({ link: 'javascript:alert(1)', date: '23 March' }), row({ id: 'P-2', title: 'Second', link: null, date: null }),
    ] })
    expect(resources.every(r => r.link === null && r.date === null)).toBe(true)
    expect(problems.map(p => p.kind).sort()).toEqual(['bad-date', 'bad-url', 'missing-date', 'missing-link', 'missing-link'])
  })

  it('completes www./doi.org links and reports possible double submissions without skipping them', () => {
    const { resources, problems } = normalizePublications({ resources: [
      row({ id: 'P-1', link: 'www.inee.org/resources/x' }), row({ id: 'P-2', title: 'A  title!' }), row({ id: 'P-3', org: 'TIDE', title: 'A title' }),
    ] })
    expect(resources.find(r => r.id === 'P-1').link).toBe('https://www.inee.org/resources/x')
    expect(resources).toHaveLength(3)
    expect(problems.filter(p => p.kind === 'possible-duplicate').map(p => p.id)).toEqual(['P-2'])
  })

  it('orders newest first, undated last, then by id', () => {
    const { resources } = normalizePublications({ resources: [
      row({ id: 'P-1', date: '2021-11-10' }), row({ id: 'P-2', date: null }), row({ id: 'P-3', date: '2026-03-23' }), row({ id: 'P-4', date: '2026-03-23' }),
    ] })
    expect(resources.map(r => r.id)).toEqual(['P-3', 'P-4', 'P-1', 'P-2'])
  })
})

describe('buildPublicationsSnapshot', () => {
  it('counts each page and keeps lastUpdated when nothing changed', () => {
    const { resources } = normalizePublications({ resources: [row(), row({ id: 'P-2', org: 'TIDE', fields: '' })] })
    const first = buildPublicationsSnapshot(resources, null, '2026-11-20T00:00:00Z')
    expect(first.meta).toEqual({ total: 2, counts: { TIDE: 1, THRIvE: 1 } })
    expect(buildPublicationsSnapshot(resources, first, '2026-11-21T00:00:00Z').lastUpdated).toBe('2026-11-20T00:00:00Z')
  })
})

describe('validatePublications', () => {
  const snap = rows => buildPublicationsSnapshot(rows, null, 'now')
  it('allows the first publish and small removals', () => {
    const prev = snap(ids(20).map(id => row({ id })))
    expect(validatePublications(prev, null)).toEqual([])
    expect(validatePublications(snap(prev.resources.slice(0, 10)), prev)).toEqual([])
  })
  it('refuses when one page would empty while the other still has rows', () => {
    const prev = snap([row({ id: 'P-1', org: 'TIDE' }), row({ id: 'P-2' })])
    expect(validatePublications(snap([row({ id: 'P-2' })]), prev)[0]).toMatch(/no TIDE publications/)
  })
  it('refuses a mass removal beyond max(10, 20%)', () => {
    const prev = snap(ids(100).map(id => row({ id })))
    expect(validatePublications(snap(prev.resources.slice(0, 79)), prev)[0]).toMatch(/21 of 100/)
    expect(validatePublications(snap(prev.resources.slice(0, 80)), prev)).toEqual([])
  })
})

describe('planPublicationsPhotos', () => {
  it('handles Google Form upload links and keeps a photo whose Drive lookup failed', () => {
    const s = buildPublicationsSnapshot([
      row({ id: 'P-1', photoUrl: 'https://drive.google.com/open?id=photoFile0001' }),
      row({ id: 'P-2', photoUrl: 'https://drive.google.com/open?id=photoFile0002' }),
    ], null, 'now')
    const plan = planPublicationsPhotos(s, {
      'P-1': { fileId: 'photoFile0001', modifiedTime: 't1' },
      'P-2': { fileId: 'photoFile0002', error: 'denied' },
    }, { 'P-2': { fileId: 'photoFile0002', modifiedTime: 't0' }, 'P-gone': { fileId: 'x', modifiedTime: 't' } })
    expect(plan.toFetch.map(p => p.id)).toEqual(['P-1'])
    expect(plan.toDelete).toEqual(['P-gone'])
    expect(plan.problems.map(p => p.kind)).toEqual(['photo-unavailable'])
  })
})
