/**
 * Filters and option lists for the Pramaan Library page (/pramaan-library).
 * Pure functions — no side effects. Values come from free-typed Sheet cells, so matching
 * ignores case and extra spaces ("Mathematics " and "mathematics" are one subject).
 */

import data from '../data/pramaan-library.json'

// Alphabetical order ("Foundational" before "Grade 1"), used everywhere a list of grades is shown.
export const LIBRARY_GRADES = ['FOUNDATIONAL', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

/** A resource's grades in LIBRARY_GRADES order (unknown values dropped). */
export const sortGrades = (grades) => LIBRARY_GRADES.filter(g => (grades ?? []).includes(g))

/** 'GRADE 3' → 'Grade 3', 'FOUNDATIONAL' → 'Foundational' (labels from pramaan-library.yaml). */
export const gradeLabel = (g) => g === 'FOUNDATIONAL' ? data.filters.foundational : data.filters.gradeTemplate.replace('{n}', g.replace('GRADE ', ''))

export const normKey = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').toLowerCase() : '')

/** [{ value, label, count }] for one field, sorted by label; value is the normalised key. */
export function optionsFor(resources, field) {
  const map = new Map()
  for (const r of resources) {
    const key = normKey(r[field])
    if (!key) continue
    const entry = map.get(key) ?? { value: key, label: r[field].trim().replace(/\s+/g, ' '), count: 0 }
    entry.count++
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

const byText = (a, b) => (a ?? '').localeCompare(b ?? '')

// Sort options, per the stakeholder: Subject (B), Type (E), Ownership (K).
// Each sorts by its field first, then the listed tie-breakers. Labels: pramaan-library.yaml sort.options.
const SORT_KEYS = {
  subject: ['subject', 'type', 'name'],
  type: ['type', 'subject', 'name'],
  owner: ['ownership', 'subject', 'name'],
}
export const LIBRARY_SORTS = Object.keys(SORT_KEYS)
export const DEFAULT_SORT = 'subject'
const compareBy = (field) => field === 'name' ? (a, b) => byText(a.name, b.name) : (a, b) => byText(normKey(a[field]), normKey(b[field]))

/**
 * @param {object[]} resources snapshot resources
 * @param {{search:string, subject:string, type:string, grades:string[], owner:string, sort?:string, dir?:string}} filters
 *   subject/type/owner hold normalised keys (see optionsFor); sort is one of LIBRARY_SORTS
 *   (unknown or missing → DEFAULT_SORT); dir 'desc' reverses the chosen field (Z → A), anything
 *   else is ascending. Tie-breakers stay A → Z. Rows with an empty sort field always go last.
 */
export function applyLibraryFilters(resources, filters) {
  let result = resources
  if (filters.subject) result = result.filter(r => normKey(r.subject) === filters.subject)
  if (filters.type) result = result.filter(r => normKey(r.type) === filters.type)
  if (filters.owner) result = result.filter(r => normKey(r.ownership) === filters.owner)
  if (filters.grades?.length) result = result.filter(r => filters.grades.some(g => r.grades?.includes(g)))
  if (filters.search) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter(r => [r.name, r.concept, r.description].some(t => t?.toLowerCase().includes(q)))
  }
  const keys = SORT_KEYS[filters.sort] ?? SORT_KEYS[DEFAULT_SORT]
  const blankLast = (a, b) => Number(!normKey(a[keys[0]])) - Number(!normKey(b[keys[0]]))
  const sign = filters.dir === 'desc' ? -1 : 1
  return result.slice().sort((a, b) =>
    blankLast(a, b) || sign * compareBy(keys[0])(a, b) || keys.slice(1).reduce((r, k) => r || compareBy(k)(a, b), 0))
}

/** Splits free text into plain and link parts, for "Any additional link/information". */
export function linkParts(text) {
  if (!text) return []
  return text.split(/(https?:\/\/[^\s,]+)/g).filter(Boolean).map(part => ({ text: part, href: /^https?:\/\//.test(part) ? part : null }))
}

/** Normalised owner keys shown right after "All owners" (owner's rule: TIDE Foundation first). */
export const OWNER_PINNED = ['tide foundation']

/**
 * Order for the Subject and Ownership pickers (owner's rule): pinned values in the given order,
 * then A→Z ignoring case, and "Other" always last. The UI adds the "All …" choice on top.
 */
export function orderFilterOptions(options, pinned = []) {
  const rank = (o) => (o.value === 'other' ? 2 : pinned.includes(o.value) ? 0 : 1)
  return [...options].sort((a, b) =>
    rank(a) - rank(b)
    || (rank(a) === 0 ? pinned.indexOf(a.value) - pinned.indexOf(b.value) : 0)
    || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
    || a.value.localeCompare(b.value))
}

/**
 * Filter options whose counts follow the other active filters (faceted counts): each filter
 * counts the resources that match every *other* filter, so the numbers always match what
 * choosing that value would show. Values with no match are left out, except the one currently
 * chosen (kept with count 0 so the picker still shows it). totals = the "All …" count per filter.
 */
export function facetOptions(resources, filters) {
  const facet = (key, field) => {
    const pool = applyLibraryFilters(resources, { ...filters, [key]: '' })
    const opts = optionsFor(pool, field)
    const chosen = filters[key]
    if (chosen && !opts.some(o => o.value === chosen)) {
      const sample = resources.find(r => normKey(r[field]) === chosen)
      opts.push({ value: chosen, label: sample ? sample[field].trim().replace(/\s+/g, ' ') : chosen, count: 0 })
    }
    return { opts, total: pool.length }
  }
  const subject = facet('subject', 'subject')
  const type = facet('type', 'type')
  const owner = facet('owner', 'ownership')
  return {
    subjects: subject.opts, types: type.opts, owners: owner.opts,
    totals: { subject: subject.total, type: type.total, owner: owner.total },
  }
}
