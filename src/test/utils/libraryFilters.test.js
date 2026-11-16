import { describe, it, expect } from 'vitest'
import { applyLibraryFilters, optionsFor, linkParts, gradeLabel, sortGrades, LIBRARY_GRADES, orderFilterOptions, OWNER_PINNED, facetOptions } from '../../utils/libraryFilters'
import { getVideoEmbedUrl } from '../../utils/videoLinks'
import { libraryTypeKey } from '../../config/library'

const list = [
  { id: '1', name: 'Zebra count', subject: 'Mathematics', type: 'Worksheet', ownership: 'TIDE Foundation', grades: ['GRADE 1'], concept: 'Addition' },
  { id: '2', name: 'Alpha words', subject: 'Language ', type: 'Flashcards', ownership: 'Jodo Gyan', grades: ['FOUNDATIONAL'], description: 'Phonics cards' },
  { id: '3', name: 'Beta', subject: 'mathematics', type: 'worksheet', ownership: 'TIDE Foundation', grades: ['GRADE 2', 'GRADE 3'] },
]
const none = { search: '', subject: '', type: '', grades: [], owner: '' }

describe('Pramaan Library filters', () => {
  it('builds subject/type/owner options ignoring case and spaces, with counts', () => {
    expect(optionsFor(list, 'subject')).toEqual([
      { value: 'language', label: 'Language', count: 1 },
      { value: 'mathematics', label: 'Mathematics', count: 2 },
    ])
    expect(optionsFor(list, 'ownership').map(o => [o.label, o.count])).toEqual([['Jodo Gyan', 1], ['TIDE Foundation', 2]])
  })

  it('sorts by subject, then type, then name', () => {
    expect(applyLibraryFilters(list, none).map(r => r.id)).toEqual(['2', '3', '1'])
  })

  it('filters by subject, type, owner, grade and search (name, concept, description)', () => {
    expect(applyLibraryFilters(list, { ...none, subject: 'mathematics' }).map(r => r.id)).toEqual(['3', '1'])
    expect(applyLibraryFilters(list, { ...none, type: 'flashcards' }).map(r => r.id)).toEqual(['2'])
    expect(applyLibraryFilters(list, { ...none, owner: 'jodo gyan' }).map(r => r.id)).toEqual(['2'])
    expect(applyLibraryFilters(list, { ...none, grades: ['GRADE 3', 'FOUNDATIONAL'] }).map(r => r.id)).toEqual(['2', '3'])
    expect(applyLibraryFilters(list, { ...none, search: 'addition' }).map(r => r.id)).toEqual(['1'])
    expect(applyLibraryFilters(list, { ...none, search: 'PHONICS' }).map(r => r.id)).toEqual(['2'])
  })

  it('labels grades from YAML', () => {
    expect(gradeLabel('GRADE 4')).toBe('Grade 4')
    expect(gradeLabel('FOUNDATIONAL')).toBe('Foundational')
  })

  it('splits free text into links and text', () => {
    expect(linkParts('PDF: https://x.org/a.pdf and more')).toEqual([
      { text: 'PDF: ', href: null }, { text: 'https://x.org/a.pdf', href: 'https://x.org/a.pdf' }, { text: ' and more', href: null },
    ])
    expect(linkParts(null)).toEqual([])
  })

  it('matches free-typed types to the Pramaan colours', () => {
    expect(libraryTypeKey('worksheets')).toBe('Worksheet')
    expect(libraryTypeKey('Flashcard')).toBe('Flashcards')
    expect(libraryTypeKey('Poster')).toBeNull()
  })
})

describe('video links', () => {
  it('plays Drive and YouTube links, refuses anything else', () => {
    expect(getVideoEmbedUrl('https://drive.google.com/file/d/1Mr0VgHuNXsW-2g3/view?usp=drive_link')).toBe('https://drive.google.com/file/d/1Mr0VgHuNXsW-2g3/preview')
    expect(getVideoEmbedUrl('https://drive.google.com/open?id=1Mr0VgHuNXsW-2g3')).toBe('https://drive.google.com/file/d/1Mr0VgHuNXsW-2g3/preview')
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(getVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(getVideoEmbedUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(getVideoEmbedUrl('https://vimeo.com/123')).toBeNull()
    expect(getVideoEmbedUrl('javascript:alert(1)')).toBeNull()
  })
})

describe('grade order', () => {
  it('lists Foundational first, then Grades 1–5 (alphabetical)', () => {
    expect(LIBRARY_GRADES).toEqual(['FOUNDATIONAL', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5'])
    expect(sortGrades(['GRADE 3', 'FOUNDATIONAL', 'GRADE 1', 'BOGUS'])).toEqual(['FOUNDATIONAL', 'GRADE 1', 'GRADE 3'])
    expect(sortGrades(undefined)).toEqual([])
  })
})

describe('sorting (stakeholder: Subject, Type, Ownership)', () => {
  const rows = [
    { id: 'a', name: 'Zeta', subject: 'Science', type: 'Games', ownership: 'Beta Org' },
    { id: 'b', name: 'Alpha', subject: 'Mathematics', type: 'Worksheet', ownership: 'Alpha Org' },
    { id: 'c', name: 'Mid', subject: 'Mathematics', type: 'Flashcards', ownership: null },
  ]
  const none = { search: '', subject: '', type: '', grades: [], owner: '' }
  const ids = sort => applyLibraryFilters(rows, { ...none, sort }).map(r => r.id)
  it('defaults to subject, then type, then name', () => {
    expect(ids(undefined)).toEqual(['c', 'b', 'a'])
    expect(ids('subject')).toEqual(['c', 'b', 'a'])
    expect(ids('bogus')).toEqual(['c', 'b', 'a'])
  })
  it('sorts by type', () => expect(ids('type')).toEqual(['c', 'a', 'b']))
  it('sorts by ownership, blank owners last', () => expect(ids('owner')).toEqual(['b', 'a', 'c']))
})

describe('sort direction', () => {
  const rows = [
    { id: 'a', name: 'Zeta', subject: 'Science', type: 'Games', ownership: 'Beta Org' },
    { id: 'b', name: 'Alpha', subject: 'Mathematics', type: 'Worksheet', ownership: 'Alpha Org' },
    { id: 'c', name: 'Mid', subject: 'Mathematics', type: 'Flashcards', ownership: null },
  ]
  const none = { search: '', subject: '', type: '', grades: [], owner: '' }
  const ids = (sort, dir) => applyLibraryFilters(rows, { ...none, sort, dir }).map(r => r.id)
  it('Z → A reverses the chosen field; tie-breakers stay A → Z; blanks stay last', () => {
    expect(ids('subject', 'desc')).toEqual(['a', 'c', 'b'])
    expect(ids('type', 'desc')).toEqual(['b', 'a', 'c'])
    expect(ids('owner', 'desc')).toEqual(['a', 'b', 'c'])
    expect(ids('owner', 'asc')).toEqual(['b', 'a', 'c'])
  })
})

describe('picker order (owner rule: TIDE Foundation pinned, A→Z, Other last)', () => {
  const opt = (label) => ({ value: label.toLowerCase(), label, count: 1 })
  it('owners: TIDE Foundation first, then A→Z, Other last ("TIDE, Other" is not Other)', () => {
    const owners = ['Other', 'NEEV', 'TIDE Foundation', 'anusandhan', 'TIDE, Other', 'Jodo Gyan', 'Vikram Sarabhai'].map(opt)
    expect(orderFilterOptions(owners, OWNER_PINNED).map(o => o.label))
      .toEqual(['TIDE Foundation', 'anusandhan', 'Jodo Gyan', 'NEEV', 'TIDE, Other', 'Vikram Sarabhai', 'Other'])
  })
  it('subjects: A→Z ignoring case, Other last, nothing pinned', () => {
    const subjects = ['Science', 'Other', 'Mathematics', 'GK', 'Language- Gujarati', 'Language- English'].map(opt)
    expect(orderFilterOptions(subjects).map(o => o.label))
      .toEqual(['GK', 'Language- English', 'Language- Gujarati', 'Mathematics', 'Science', 'Other'])
  })
})

describe('facetOptions (counts follow the other filters)', () => {
  const rows = [
    { id: '1', name: 'a', subject: 'Mathematics', type: 'Worksheet', ownership: 'TIDE Foundation', grades: [] },
    { id: '2', name: 'b', subject: 'Mathematics', type: 'Games', ownership: 'NEEV', grades: [] },
    { id: '3', name: 'c', subject: 'Science', type: 'Worksheet', ownership: 'TIDE Foundation', grades: [] },
  ]
  const none = { search: '', subject: '', type: '', grades: [], owner: '' }
  it('with no filters, counts are library totals', () => {
    const f = facetOptions(rows, none)
    expect(f.totals).toEqual({ subject: 3, type: 3, owner: 3 })
    expect(f.subjects).toEqual([{ value: 'mathematics', label: 'Mathematics', count: 2 }, { value: 'science', label: 'Science', count: 1 }])
  })
  it('choosing an owner narrows subject/type counts but not the owner list itself', () => {
    const f = facetOptions(rows, { ...none, owner: 'tide foundation' })
    expect(f.totals).toEqual({ subject: 2, type: 2, owner: 3 })
    expect(f.subjects.map(o => [o.label, o.count])).toEqual([['Mathematics', 1], ['Science', 1]])
    expect(f.types.map(o => [o.label, o.count])).toEqual([['Worksheet', 2]])
    expect(f.owners.map(o => [o.label, o.count])).toEqual([['NEEV', 1], ['TIDE Foundation', 2]])
  })
  it('keeps the chosen value visible with count 0 when other filters exclude it', () => {
    const f = facetOptions(rows, { ...none, owner: 'neev', subject: 'science' })
    expect(f.subjects.find(o => o.value === 'science')).toEqual({ value: 'science', label: 'Science', count: 0 })
  })
})
