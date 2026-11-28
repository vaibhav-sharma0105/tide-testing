// Edge cases for the listing helpers shared by the four Sheet-backed pages (audit P6): empty, one
// and 500 rows, very long titles, Gujarati and Devanagari text, duplicate titles, odd URL values.
// Fixtures are made up here (never the bot-owned snapshots); text fixtures are not site copy.
import { describe, it, expect } from 'vitest'
import {
  applyPublicationFilters, facetPublicationOptions, parsePublicationParams, publicationParamsToSearch,
  paginate, pageWindow, highlightParts, searchTerms, groupByYear,
} from '../../utils/publicationFilters'
import { groupPartners, filterGroups, partnerInitials, matchesPartner } from '../../utils/partnerFilters'
import { groupByBatch, matchesFellow, personInitials, fellowsInOrder } from '../../utils/changemakers'
import { applyLibraryFilters, facetOptions } from '../../utils/libraryFilters'
import { splitFigure, formatFigure } from '../../utils/figures'
import { activeLeaf, activeTopIndex } from '../../utils/navActive'
import navData from '../../data/navigation.json'
import { PRIMARY_ROUTES } from '../../config/siteRoutes'

const GU = 'ગણિત પ્રવૃત્તિ'      // Gujarati fixture text
const HI = 'गणित गतिविधि'        // Devanagari fixture text
const LONG = 'A very long title '.repeat(40).trim()

const pub = (i, extra = {}) => ({
  id: `P${i}`, org: 'THRIvE', title: `Title ${i}`, type: i % 2 ? 'Journal article' : 'Book',
  fields: [i % 3 ? 'Education' : 'Policy'], date: `20${String(10 + (i % 15)).padStart(2, '0')}-0${1 + (i % 9)}-15`, ...extra,
})
const many = (n, f = pub) => Array.from({ length: n }, (_, i) => f(i))

describe('paginate / pageWindow over many sizes', () => {
  it('every row appears on exactly one page, in order, for 0, 1, 12, 13 and 500 rows', () => {
    for (const n of [0, 1, 12, 13, 500]) {
      const rows = many(n)
      const { totalPages } = paginate(rows, 1, 12)
      const seen = []
      for (let p = 1; p <= totalPages; p += 1) seen.push(...paginate(rows, p, 12).items)
      expect(seen).toEqual(rows)
      expect(totalPages).toBe(Math.max(1, Math.ceil(n / 12)))
    }
  })

  it('clamps any odd page value to a real page', () => {
    const rows = many(500)
    for (const [input, want] of [[0, 1], [-3, 1], ['abc', 1], [NaN, 1], [2.9, 2], ['7', 7], [999, 42], [Infinity, 42]]) {
      expect(paginate(rows, input, 12).page, String(input)).toBe(want)
    }
    expect(paginate([], 5, 12)).toMatchObject({ page: 1, totalPages: 1, from: 0, to: 0, total: 0, items: [] })
    expect(paginate(rows, 42, 12)).toMatchObject({ from: 493, to: 500 })
  })

  it('pageWindow always shows the first, last and current page, never more than 7 entries', () => {
    for (let total = 1; total <= 60; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        const w = pageWindow(current, total)
        expect(w.length).toBeLessThanOrEqual(7)
        expect(w).toContain(1)
        expect(w).toContain(total)
        expect(w).toContain(current)
        const nums = w.filter((x) => x !== '…')
        expect([...nums].sort((a, b) => a - b)).toEqual(nums)
        expect(new Set(nums).size).toBe(nums.length)
      }
    }
  })
})

describe('Publications URL state', () => {
  it('round-trips search text with Gujarati, Devanagari, spaces and symbols', () => {
    for (const search of [GU, HI, 'teacher & agency', 'a+b=c?', '100% "quoted"']) {
      const f = { search, type: ['book', 'blog'], field: ['education'], year: '2024', dir: 'asc', page: 3 }
      expect(parsePublicationParams(publicationParamsToSearch(f))).toEqual(f)
    }
  })

  it('ignores hand-edited nonsense and leaves defaults out of the address', () => {
    expect(parsePublicationParams('?year=24&page=-1&dir=sideways&type=%20BOOK%20&utm=x')).toEqual({
      search: '', type: ['book'], field: [], year: '', dir: 'desc', page: 1,
    })
    expect(publicationParamsToSearch(parsePublicationParams(''))).toBe('')
  })
})

describe('Publications filters with unusual rows', () => {
  it('searches Gujarati and Devanagari titles, ignoring extra spaces and case', () => {
    const rows = [pub(1, { title: `${GU} 2024` }), pub(2, { title: HI }), pub(3, { title: 'English only' })]
    expect(applyPublicationFilters(rows, { search: '  ગણિત   પ્રવૃત્તિ ' }).map((r) => r.id)).toEqual(['P1'])
    expect(applyPublicationFilters(rows, { search: 'गणित' }).map((r) => r.id)).toEqual(['P2'])
    expect(searchTerms('   ')).toEqual([])
  })

  it('keeps duplicate titles (both shown) in a stable order', () => {
    const rows = [pub(1, { id: 'B', title: 'Same', date: '2024-01-01' }), pub(2, { id: 'A', title: 'Same', date: '2024-01-01' })]
    const once = applyPublicationFilters(rows, {}).map((r) => r.id)
    expect(once).toHaveLength(2)
    expect(applyPublicationFilters([...rows].reverse(), {}).map((r) => r.id)).toHaveLength(2)
  })

  it('handles rows with missing optional fields (no date, type, fields, citation)', () => {
    const rows = [{ id: 'X', org: 'THRIvE', title: 'Bare' }, pub(1)]
    expect(applyPublicationFilters(rows, { dir: 'desc' }).at(-1).id).toBe('X')
    const facets = facetPublicationOptions(rows, {}, 'Undated')
    expect(facets.years.at(-1)).toMatchObject({ value: 'undated', label: 'Undated', count: 1 })
    expect(groupByYear(applyPublicationFilters(rows, {})).length).toBeGreaterThan(0)
  })

  it('500 rows: facet counts add up to the total for single-valued filters', () => {
    const rows = many(500)
    const f = facetPublicationOptions(rows, {})
    expect(f.types.reduce((s, o) => s + o.count, 0)).toBe(500)
    expect(f.years.reduce((s, o) => s + o.count, 0)).toBe(500)
    expect(f.totals).toEqual({ type: 500, field: 500, year: 500 })
  })

  it('highlights inside a very long title and with regex characters in the query', () => {
    const parts = highlightParts(LONG, ['long'])
    expect(parts.filter((p) => p.match)).toHaveLength(40)
    expect(parts.map((p) => p.text).join('')).toBe(LONG)
    expect(highlightParts('Cost (in ₹) per child', ['(in']).some((p) => p.match && p.text === '(in')).toBe(true)
  })
})

describe('Partners with unusual rows', () => {
  it('groups 500 partners, keeps all, drops rows without a type or name', () => {
    const rows = many(500, (i) => ({ id: `p${i}`, name: `Partner ${i}`, type: i % 2 ? 'School ' : ' school', priority: '' }))
    rows.push({ id: 'x', name: '', type: 'School' }, { id: 'y', name: 'No type', type: '  ' })
    const groups = groupPartners(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0].partners).toHaveLength(500)
    expect(groupPartners([])).toEqual([])
  })

  it('searches and makes initials for Gujarati / Devanagari names', () => {
    const p = { id: 'g', name: 'ગ્રામ શાળા ટ્રસ્ટ', type: 'NGO' }
    expect(matchesPartner(p, 'શાળા')).toBe(true)
    expect(matchesPartner({ name: 'Café Éducation' }, 'cafe education')).toBe(true)
    expect(partnerInitials(p.name)).toHaveLength(2)
    expect(partnerInitials('विद्या भवन')).toBe('विभ'.slice(0, 1) + 'भ')
    expect(partnerInitials('')).toBe('')
    expect(filterGroups(groupPartners([p]), 'zzz')).toEqual([])
  })
})

describe('Social Changemakers with unusual rows', () => {
  it('orders 500 fellows across batches, newest first, and keeps every one', () => {
    const rows = many(500, (i) => ({ id: `f${i}`, name: `Fellow ${i}`, batch: `${20 + (i % 5)}-${21 + (i % 5)}`, order: i % 7 ? String(i % 7) : '' }))
    const batches = groupByBatch(rows)
    expect(batches.map((b) => b.year)).toEqual([2024, 2023, 2022, 2021, 2020])
    expect(fellowsInOrder(batches)).toHaveLength(500)
    expect(groupByBatch([])).toEqual([])
  })

  it('matches Devanagari names and projects; initials from non-Latin names', () => {
    const f = { name: 'अनीता शर्मा', project: `${GU} project` }
    expect(matchesFellow(f, 'शर्मा')).toBe(true)
    expect(matchesFellow(f, 'પ્રવૃત્તિ')).toBe(true)
    expect(matchesFellow(f, 'nobody')).toBe(false)
    expect(personInitials(f.name)).toBe('अश')
  })
})

describe('Resource Centre with unusual rows', () => {
  const res = (i, extra = {}) => ({ id: `W${i}`, name: `Resource ${i}`, subject: 'Maths', type: 'Worksheet', grades: ['GRADE 1'], ownership: 'TIDE Foundation', ...extra })
  it('searches Gujarati names and survives missing fields', () => {
    const rows = [res(1, { name: GU }), res(2, { name: undefined, concept: null, subject: '' }), res(3)]
    expect(applyLibraryFilters(rows, { search: 'ગણિત' }).map((r) => r.id)).toEqual(['W1'])
    expect(applyLibraryFilters(rows, {}).at(-1).id).toBe('W2') // blank sort field last
    expect(() => facetOptions(rows, {})).not.toThrow()
  })

  it('500 rows: filtering by a grade never loses or duplicates a row', () => {
    const rows = many(500, (i) => res(i, { grades: [`GRADE ${1 + (i % 5)}`] }))
    const total = [1, 2, 3, 4, 5].reduce((s, g) => s + applyLibraryFilters(rows, { grades: [`GRADE ${g}`] }).length, 0)
    expect(total).toBe(500)
    expect(applyLibraryFilters(rows, { grades: ['GRADE 1', 'GRADE 2'] })).toHaveLength(200)
  })
})

describe('figures (Indian grouping)', () => {
  it('splits and regroups figures the way they are written', () => {
    expect(splitFigure('52,500+')).toEqual({ before: '', value: 52500, grouped: true, after: '+' })
    expect(formatFigure(52500, true)).toBe('52,500')
    expect(formatFigure(10000000, true)).toBe('1,00,00,000')
    expect(formatFigure(2014, false)).toBe('2014')
    expect(splitFigure('Since 2014')).toEqual({ before: 'Since ', value: 2014, grouped: false, after: '' })
    expect(splitFigure('no number')).toBeNull()
    expect(splitFigure(null)).toBeNull()
    expect(splitFigure('0 left').value).toBe(0)
  })
})

describe('navigation menu vs routes', () => {
  const links = []
  const walk = (items) => items.forEach((it) => { if (it.to) links.push(it.to); walk(it.children ?? it.subItems ?? []) })
  walk(navData.items)
  const routes = new Set(PRIMARY_ROUTES.map((r) => r.path))

  it('every menu link is a live route, and Social Changemakers is not in the menu (owner decision)', () => {
    expect(links.length).toBeGreaterThan(10)
    for (const to of links) expect(routes.has(to), to).toBe(true)
    expect(links).not.toContain('/education-for-harmony/social-changemakers')
  })

  it('each menu link marks itself as the current page, also from a page below it', () => {
    for (const to of links) {
      expect(activeLeaf(navData.items, to)).toBe(to)
      expect(activeTopIndex(navData.items, to)).toBeGreaterThanOrEqual(0)
    }
    expect(activeLeaf(navData.items, '/pramaan/resource-centre/W1')).toBe('/pramaan/resource-centre')
    expect(activeTopIndex(navData.items, '/nowhere')).toBe(-1)
  })
})
