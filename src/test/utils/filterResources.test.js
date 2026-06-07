import { describe, it, expect } from 'vitest'
import { applyResourceFilters } from '../../utils/filterResources'

// Sample fixture data
const makeResource = (overrides = {}) => ({
  name: 'Test Resource',
  tab: 'Worksheet',
  type: 'Worksheet',
  grades: ['1', '2'],
  language: 'English',
  ownership: 'TIDE',
  ...overrides,
})

describe('applyResourceFilters', () => {
  it('returns empty array for empty resources', () => {
    expect(applyResourceFilters([], {})).toEqual([])
  })

  it('returns all resources when filters are empty object', () => {
    const resources = [makeResource(), makeResource({ name: 'Another' })]
    expect(applyResourceFilters(resources, {})).toHaveLength(2)
  })

  it('returns all resources when filters have no set values', () => {
    const resources = [makeResource(), makeResource({ name: 'B' })]
    const result = applyResourceFilters(resources, {
      type: '',
      grades: [],
      language: '',
      ownership: '',
      search: '',
    })
    expect(result).toHaveLength(2)
  })

  // --- type / tab filter ---
  it('filters by type (tab) correctly', () => {
    const resources = [
      makeResource({ tab: 'Worksheet', name: 'W1' }),
      makeResource({ tab: 'Games', name: 'G1' }),
      makeResource({ tab: 'Kits', name: 'K1' }),
    ]
    const result = applyResourceFilters(resources, { type: 'Games' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('G1')
  })

  it('also matches via r.type when tab differs', () => {
    const resources = [
      makeResource({ tab: 'Games', type: 'Worksheet', name: 'Mixed' }),
    ]
    // should match on type
    const result = applyResourceFilters(resources, { type: 'Worksheet' })
    expect(result).toHaveLength(1)
  })

  // --- grade filter ---
  it('filters by single grade', () => {
    const resources = [
      makeResource({ grades: ['1', '2'], name: 'Grade1-2' }),
      makeResource({ grades: ['3', '4'], name: 'Grade3-4' }),
    ]
    const result = applyResourceFilters(resources, { grades: ['1'] })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Grade1-2')
  })

  it('filters by multiple grades (union — any match passes)', () => {
    const resources = [
      makeResource({ grades: ['1'], name: 'R1' }),
      makeResource({ grades: ['3'], name: 'R3' }),
      makeResource({ grades: ['5'], name: 'R5' }),
    ]
    const result = applyResourceFilters(resources, { grades: ['1', '3'] })
    expect(result).toHaveLength(2)
  })

  it('returns empty array when no resources match grades', () => {
    const resources = [makeResource({ grades: ['2'] })]
    expect(applyResourceFilters(resources, { grades: ['5'] })).toHaveLength(0)
  })

  // --- language filter ---
  it('filters by language (case-insensitive)', () => {
    const resources = [
      makeResource({ language: 'English', name: 'EN' }),
      makeResource({ language: 'Gujarati', name: 'GU' }),
    ]
    const result = applyResourceFilters(resources, { language: 'english' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('EN')
  })

  it('language filter does partial match (includes)', () => {
    const resources = [
      makeResource({ language: 'English & Hindi', name: 'Bilingual' }),
      makeResource({ language: 'Gujarati', name: 'GU' }),
    ]
    const result = applyResourceFilters(resources, { language: 'Hindi' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bilingual')
  })

  // --- ownership filter ---
  it('filters ownership === TIDE', () => {
    const resources = [
      makeResource({ ownership: 'TIDE', name: 'TIDEOwned' }),
      makeResource({ ownership: 'External Org', name: 'ExtOwned' }),
    ]
    const result = applyResourceFilters(resources, { ownership: 'TIDE' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('TIDEOwned')
  })

  it('filters ownership === external (non-TIDE)', () => {
    const resources = [
      makeResource({ ownership: 'TIDE', name: 'TIDEOwned' }),
      makeResource({ ownership: 'External Org', name: 'ExtOwned' }),
    ]
    const result = applyResourceFilters(resources, { ownership: 'external' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('ExtOwned')
  })

  it('returns all when ownership is neither TIDE nor external', () => {
    const resources = [
      makeResource({ ownership: 'TIDE' }),
      makeResource({ ownership: 'External Org' }),
    ]
    const result = applyResourceFilters(resources, { ownership: 'any' })
    expect(result).toHaveLength(2)
  })

  // --- search filter ---
  it('filters by search query (case-insensitive name match)', () => {
    const resources = [
      makeResource({ name: 'Addition Worksheet' }),
      makeResource({ name: 'Subtraction Game' }),
    ]
    const result = applyResourceFilters(resources, { search: 'addition' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Addition Worksheet')
  })

  it('search filter is case-insensitive', () => {
    const resources = [makeResource({ name: 'Phonics Flash Cards' })]
    expect(applyResourceFilters(resources, { search: 'PHONICS' })).toHaveLength(1)
    expect(applyResourceFilters(resources, { search: 'phonics' })).toHaveLength(1)
    expect(applyResourceFilters(resources, { search: 'Phonics' })).toHaveLength(1)
  })

  it('search with no match returns empty array', () => {
    const resources = [makeResource({ name: 'Math Game' })]
    expect(applyResourceFilters(resources, { search: 'zzznomatch' })).toHaveLength(0)
  })

  // --- combined filters ---
  it('combined: type + grade + search all applied together', () => {
    const resources = [
      makeResource({ tab: 'Worksheet', type: 'Worksheet', grades: ['1'], name: 'Phonics Grade 1' }),
      makeResource({ tab: 'Worksheet', type: 'Worksheet', grades: ['3'], name: 'Phonics Grade 3' }),
      makeResource({ tab: 'Games',     type: 'Games',     grades: ['1'], name: 'Phonics Game' }),
    ]
    const result = applyResourceFilters(resources, {
      type: 'Worksheet',
      grades: ['1'],
      search: 'phonics',
    })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Phonics Grade 1')
  })

  // --- edge cases: undefined/null fields ---
  it('does not crash when resource name is undefined', () => {
    const resources = [makeResource({ name: undefined })]
    expect(() => applyResourceFilters(resources, { search: 'test' })).not.toThrow()
    expect(applyResourceFilters(resources, { search: 'test' })).toHaveLength(0)
  })

  it('does not crash when resource grades is undefined', () => {
    const resources = [makeResource({ grades: undefined })]
    expect(() => applyResourceFilters(resources, { grades: ['1'] })).not.toThrow()
    expect(applyResourceFilters(resources, { grades: ['1'] })).toHaveLength(0)
  })

  it('does not crash when resource language is undefined', () => {
    const resources = [makeResource({ language: undefined })]
    expect(() => applyResourceFilters(resources, { language: 'English' })).not.toThrow()
    expect(applyResourceFilters(resources, { language: 'English' })).toHaveLength(0)
  })

  it('does not crash when resource ownership is undefined', () => {
    const resources = [makeResource({ ownership: undefined })]
    expect(() => applyResourceFilters(resources, { ownership: 'TIDE' })).not.toThrow()
    // undefined !== 'TIDE' so it should be excluded
    expect(applyResourceFilters(resources, { ownership: 'TIDE' })).toHaveLength(0)
  })

  it('does not crash on null resource fields with all filters active', () => {
    const resources = [{
      name: null,
      tab: null,
      type: null,
      grades: null,
      language: null,
      ownership: null,
    }]
    expect(() =>
      applyResourceFilters(resources, {
        type: 'Worksheet',
        grades: ['1'],
        language: 'English',
        ownership: 'TIDE',
        search: 'test',
      })
    ).not.toThrow()
  })
})
