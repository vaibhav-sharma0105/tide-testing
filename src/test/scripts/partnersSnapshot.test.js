// Every rule in scripts/lib/partners-snapshot.js (the Partners sync's pure logic).
import { describe, it, expect } from 'vitest'
import {
  normalizePartners, buildPartnersSnapshot, validatePartners, planPartnersPhotos, knownPriority, RESOURCE_FIELDS,
  markSharedLogos, SHARED_LOGO_MIN,
} from '../../../scripts/lib/partners-snapshot.js'

const row = (o = {}) => ({
  id: 'PA-0000000001', type: 'Collaborators', priority: 'High', name: 'Example Foundation',
  website: 'https://example.org/', photoUrl: 'https://drive.google.com/open?id=logoFile00001', ...o,
})
const ids = n => Array.from({ length: n }, (_, i) => `PA-${String(i).padStart(10, '0')}`)
const kinds = problems => problems.map(p => p.kind).sort()

describe('knownPriority', () => {
  it('matches the four priorities ignoring capitals and spaces, nothing else', () => {
    expect(knownPriority(' extremely  HIGH ')).toBe('Extremely high')
    expect(knownPriority('Medium')).toBe('Medium')
    expect(knownPriority('Mediun')).toBeNull() // as in the Sheet on 2026-11-21
    expect(knownPriority(null)).toBeNull()
  })
})

describe('normalizePartners', () => {
  it('keeps only allowlisted fields and drops anything else the script returns', () => {
    const { resources, problems } = normalizePartners({ resources: [row({ notes: 'to remove?', timestamp: '8/31/2026' })] })
    expect(Object.keys(resources[0])).toEqual(RESOURCE_FIELDS)
    expect(problems).toEqual([])
  })

  it('removes an email address typed into a published field and reports it', () => {
    const { resources, problems } = normalizePartners({ resources: [row({ website: 'mailto:me@example.com' }), row({ id: 'PA-2', name: 'me@example.com' })] })
    expect(resources).toHaveLength(1)
    expect(resources[0].website).toBeNull()
    expect(kinds(problems)).toContain('personal-data')
  })

  it('skips rows without id, name or type, and unsafe or duplicate ids', () => {
    const { resources, problems } = normalizePartners({ resources: [
      row(), row({ name: 'Dup' }), row({ id: '../x' }), row({ id: 'PA-3', name: '' }), row({ id: 'PA-4', type: '  ' }),
    ] })
    expect(resources.map(r => r.name)).toEqual(['Example Foundation'])
    expect(kinds(problems)).toEqual(['duplicate-id', 'missing-id', 'missing-id', 'unsafe-id'])
  })

  it('normalises known priorities and reports unknown or empty ones without skipping the row', () => {
    const { resources, problems } = normalizePartners({ resources: [
      row({ id: 'PA-1', priority: 'extremely high' }), row({ id: 'PA-2', name: 'B', priority: 'Mediun' }), row({ id: 'PA-3', name: 'C', priority: null }),
    ] })
    expect(resources.map(r => r.priority)).toEqual(['Extremely high', 'Mediun', null])
    expect(kinds(problems)).toEqual(['unknown-priority', 'unknown-priority'])
  })

  it('removes non-web links, completes www. links, and reports a missing logo and a name that is a link', () => {
    const { resources, problems } = normalizePartners({ resources: [
      row({ id: 'PA-1', website: 'javascript:alert(1)', photoUrl: null }), row({ id: 'PA-2', name: 'https://ahduni.edu.in/', website: 'www.example.org' }),
    ] })
    expect(resources[0]).toMatchObject({ website: null, photoUrl: null })
    expect(resources[1].website).toBe('https://www.example.org')
    expect(kinds(problems)).toEqual(['bad-url', 'missing-logo', 'name-is-link'])
  })

  it('reports the same name twice in one section, but not across sections', () => {
    const { resources, problems } = normalizePartners({ resources: [
      row({ id: 'PA-1', type: 'Beneficiaries', name: 'Childrens home Paldi' }), row({ id: 'PA-2', type: 'Beneficiaries', name: 'Childrens Home Paldi' }),
      row({ id: 'PA-3', type: 'Others', name: 'Global Schools Forum' }), row({ id: 'PA-4', type: 'Knowledge, Research and Funding', name: 'Global Schools Forum' }),
    ] })
    expect(resources).toHaveLength(4)
    expect(problems.filter(p => p.kind === 'possible-duplicate').map(p => p.id)).toEqual(['PA-2'])
  })

  it('orders the snapshot by id, so it is stable', () => {
    const { resources } = normalizePartners({ resources: [row({ id: 'PA-3' }), row({ id: 'PA-1', name: 'B' }), row({ id: 'PA-2', name: 'C' })] })
    expect(resources.map(r => r.id)).toEqual(['PA-1', 'PA-2', 'PA-3'])
  })
})

describe('buildPartnersSnapshot', () => {
  it('counts rows and keeps lastUpdated when nothing changed', () => {
    const { resources } = normalizePartners({ resources: [row(), row({ id: 'PA-2', name: 'B' })] })
    const first = buildPartnersSnapshot(resources, null, '2026-11-21T00:00:00Z')
    expect(first.meta).toEqual({ total: 2 })
    expect(first.section).toBe('partners')
    expect(buildPartnersSnapshot(resources, first, '2026-11-22T00:00:00Z').lastUpdated).toBe('2026-11-21T00:00:00Z')
  })
})

describe('validatePartners', () => {
  const snap = rows => buildPartnersSnapshot(rows, null, 'now')
  it('allows the first publish and small removals', () => {
    const prev = snap(ids(20).map(id => row({ id })))
    expect(validatePartners(prev, null)).toEqual([])
    expect(validatePartners(snap(prev.resources.slice(0, 10)), prev)).toEqual([])
  })
  it('refuses when the Sheet suddenly returns nothing', () => {
    expect(validatePartners(snap([]), snap([row()]))[0]).toMatch(/no partners/)
  })
  it('refuses a mass removal beyond max(10, 20%)', () => {
    const prev = snap(ids(113).map(id => row({ id })))
    expect(validatePartners(snap(prev.resources.slice(0, 90)), prev)[0]).toMatch(/23 of 113/)
    expect(validatePartners(snap(prev.resources.slice(0, 91)), prev)).toEqual([])
  })
})

describe('planPartnersPhotos', () => {
  it('handles Google Form upload links and keeps a logo whose Drive lookup failed', () => {
    const s = buildPartnersSnapshot([
      row({ id: 'PA-1', photoUrl: 'https://drive.google.com/open?id=logoFile00001' }),
      row({ id: 'PA-2', photoUrl: 'https://drive.google.com/open?id=logoFile00002' }),
    ], null, 'now')
    const plan = planPartnersPhotos(s, {
      'PA-1': { fileId: 'logoFile00001', modifiedTime: 't1' },
      'PA-2': { fileId: 'logoFile00002', error: 'denied' },
    }, { 'PA-2': { fileId: 'logoFile00002', modifiedTime: 't0' }, 'PA-gone': { fileId: 'x', modifiedTime: 't' } })
    expect(plan.toFetch.map(p => p.id)).toEqual(['PA-1'])
    expect(plan.toDelete).toEqual(['PA-gone'])
    expect(plan.problems.map(p => p.kind)).toEqual(['photo-unavailable'])
  })
})

describe('markSharedLogos', () => {
  const entry = (hash, extra = {}) => ({ thumb: 'assets/images/partners/x-logo.webp', hash, ...extra })

  it('flags a picture used by SHARED_LOGO_MIN or more partners as a placeholder and reports it once', () => {
    expect(SHARED_LOGO_MIN).toBe(3)
    const m = { 'PA-1': entry('aaa'), 'PA-2': entry('aaa'), 'PA-3': entry('aaa'), 'PA-4': entry('bbb'), 'PA-5': entry('bbb'), 'PA-6': { thumb: 'x' } }
    const r = markSharedLogos(m, new Map([['PA-1', 'One School']]))
    expect(r.changed).toBe(true)
    expect(Object.entries(m).filter(([, e]) => e.placeholder).map(([id]) => id)).toEqual(['PA-1', 'PA-2', 'PA-3'])
    expect(r.problems).toHaveLength(1)
    expect(r.problems[0]).toMatchObject({ kind: 'shared-logo', id: 'PA-1' })
    expect(r.problems[0].message).toContain('3 partners')
    expect(r.problems[0].message).toContain('One School')
    // Two partners sharing one logo (one organisation in two sections) is left alone.
    expect(m['PA-4'].placeholder).toBeUndefined()
  })

  it('clears the flag once the picture is no longer shared, and reports no change when nothing moved', () => {
    const m = { 'PA-1': entry('aaa', { placeholder: true }), 'PA-2': entry('ccc', { placeholder: true }) }
    expect(markSharedLogos(m).changed).toBe(true)
    expect(m['PA-1'].placeholder).toBeUndefined()
    expect(markSharedLogos(m)).toEqual({ changed: false, problems: [] })
  })
})
