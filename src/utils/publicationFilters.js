/**
 * Filters, search, order, paging and small derived facts for the Publications pages
 * (/tide/publications for TIDE, /thrive/publications for THRIvE). Pure functions over the
 * snapshot rows (src/data/sheets/publications.json). Matching ignores case and extra spaces.
 * Nothing here invents data: every value is read or counted from the rows (or the row's URL).
 */

import { normKey, cleanLabel, optionsFor, optionsForMany } from './listingFilters'
import { TYPE_ICON_RULES, SCHEMA_TYPE_BY_ICON } from '../config/publications'
import { safeHttpUrl } from './safeUrl'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const hasDate = (r) => typeof r?.date === 'string' && ISO_DATE.test(r.date)

/** The order shown by default: newest first. 'asc' = oldest first. */
export const DEFAULT_DIR = 'desc'

/** Year-filter value for rows without a date. */
export const UNDATED = 'undated'

/** Snapshot rows for one organisation ('TIDE' | 'THRIvE'). */
export function rowsForOrg(resources, org) {
  return (Array.isArray(resources) ? resources : []).filter(r => r && r.org === org)
}

/** The year of a 'YYYY-MM-DD' date as a number, or null. */
export const yearOf = (date) => (typeof date === 'string' && ISO_DATE.test(date) ? Number(date.slice(0, 4)) : null)

const byTitle = (a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'en', { sensitivity: 'base' })

/**
 * Row order: by date (dir 'asc' oldest first, anything else newest first); rows on the same date
 * by title A→Z; rows without a date always last (title A→Z among themselves).
 */
export function comparePublications(dir = DEFAULT_DIR) {
  const sign = dir === 'asc' ? 1 : -1
  return (a, b) => {
    const da = hasDate(a)
    const db = hasDate(b)
    if (da !== db) return da ? -1 : 1
    if (da && a.date !== b.date) return sign * (a.date < b.date ? -1 : 1)
    return byTitle(a, b)
  }
}

/** Search words: normalised, split on spaces. '' → []. */
export const searchTerms = (q) => normKey(q).split(' ').filter(Boolean)

/** True when every search word appears in the row's title, citation, description, type or fields. */
export function matchesSearch(row, terms) {
  if (!terms.length) return true
  const hay = [row.title, row.citation, row.description, row.type, ...(row.fields ?? [])].map(normKey).join('\n')
  return terms.every(t => hay.includes(t))
}

const yearKey = (r) => (hasDate(r) ? r.date.slice(0, 4) : UNDATED)

/**
 * A filter value as a list of normalised keys: type and field can hold several choices (the
 * THRIvE page's menus are multi-select; a single-select menu passes one string). '' / null → [].
 */
export const filterList = (v) => (Array.isArray(v) ? v : [v]).map(normKey).filter(Boolean)

/**
 * @param {object[]} rows one organisation's rows
 * @param {{search?:string, type?:string|string[], field?:string|string[], year?:string, dir?:string}} filters
 *   type/field hold normalised keys (see optionsFor/optionsForMany), one or several; year is
 *   'YYYY' or UNDATED. Several values of one filter widen it (any of them); different filters
 *   narrow each other. A row matches `field` if any of its fields is chosen.
 *   Order: comparePublications(dir).
 */
export function applyPublicationFilters(rows, filters = {}) {
  const terms = searchTerms(filters.search)
  const types = filterList(filters.type)
  const fields = filterList(filters.field)
  return rows
    .filter(r => !types.length || types.includes(normKey(r.type)))
    .filter(r => !fields.length || (r.fields ?? []).some(f => fields.includes(normKey(f))))
    .filter(r => !filters.year || yearKey(r) === filters.year)
    .filter(r => matchesSearch(r, terms))
    .sort(comparePublications(filters.dir))
}

/** [{ value, label, count }] of years, newest first, "Undated" (label given) last. */
function yearOptionsFor(rows, undatedLabel) {
  const map = new Map()
  for (const r of rows) {
    const key = yearKey(r)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, label: value === UNDATED ? undatedLabel : value, count }))
    .sort((a, b) => (a.value === UNDATED) - (b.value === UNDATED) || b.value.localeCompare(a.value))
}

/** Every value of the full list, with its count from `pool` (0 when it has none there). */
function withCounts(all, pool) {
  const counts = new Map(pool.map(o => [o.value, o.count]))
  return all.map(o => ({ ...o, count: counts.get(o.value) ?? 0 }))
}

/**
 * Filter options with faceted counts: each filter counts the rows that match every *other*
 * filter (and the search). Every value present in the rows is listed — with count 0 when the
 * other filters exclude it (the UI disables those). A chosen value that no row has any more
 * (e.g. an old shared link after the row was removed) is added with count 0 and its raw value
 * as label, so the page shows it and it can be cleared. totals = the "All …" count per filter.
 */
export function facetPublicationOptions(rows, filters = {}, undatedLabel = 'Undated') {
  const typePool = applyPublicationFilters(rows, { ...filters, type: [] })
  const fieldPool = applyPublicationFilters(rows, { ...filters, field: [] })
  const yearPool = applyPublicationFilters(rows, { ...filters, year: '' })
  const types = withCounts(optionsFor(rows, 'type'), optionsFor(typePool, 'type'))
  const fields = withCounts(optionsForMany(rows, 'fields'), optionsForMany(fieldPool, 'fields'))
  const years = withCounts(yearOptionsFor(rows, undatedLabel), yearOptionsFor(yearPool, undatedLabel))
  const keep = (list, value) => {
    for (const v of filterList(value)) {
      if (!list.some(o => o.value === v)) list.push({ value: v, label: v, count: 0, missing: true })
    }
  }
  keep(types, filters.type)
  keep(fields, filters.field)
  keep(years, filters.year)
  return { types, fields, years, totals: { type: typePool.length, field: fieldPool.length, year: yearPool.length } }
}

const YEAR_PARAM = /^(\d{4}|undated)$/

/**
 * Reads the page's filters from a query string. Robust to old or hand-edited links: values are
 * normalised; an impossible year (not 4 digits / 'undated') and unknown params are ignored;
 * page is a whole number ≥ 1 (anything else → 1; the caller clamps it to the last page).
 * type and field are lists (repeated params: ?type=book&type=blog; duplicates dropped), so a
 * one-value link from before multi-select reads the same.
 */
export function parsePublicationParams(search) {
  const p = new URLSearchParams(search)
  const year = normKey(p.get('year'))
  const page = Number.parseInt(p.get('page') ?? '', 10)
  return {
    search: p.get('search') ?? '',
    type: [...new Set(filterList(p.getAll('type')))],
    field: [...new Set(filterList(p.getAll('field')))],
    year: YEAR_PARAM.test(year) ? year : '',
    dir: p.get('dir') === 'asc' ? 'asc' : DEFAULT_DIR,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  }
}

/** The reverse of parsePublicationParams: '?…' with only non-default values, or ''. */
export function publicationParamsToSearch(f) {
  const p = new URLSearchParams()
  if (f.search) p.set('search', f.search)
  for (const v of filterList(f.type)) p.append('type', v)
  for (const v of filterList(f.field)) p.append('field', v)
  if (f.year) p.set('year', f.year)
  if (f.dir && f.dir !== DEFAULT_DIR) p.set('dir', f.dir)
  if (f.page && f.page > 1) p.set('page', String(f.page))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/**
 * One page of `items`. The page is clamped to 1…totalPages (a link to page 9 of a list that now
 * has 3 pages shows page 3). from/to are 1-based positions for "Showing {from}–{to} of {total}".
 */
export function paginate(items, page, perPage) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), totalPages)
  const start = (current - 1) * perPage
  const pageItems = items.slice(start, start + perPage)
  return { page: current, totalPages, start, from: total ? start + 1 : 0, to: start + pageItems.length, total, items: pageItems }
}

/** Page numbers to show (with '…' gaps): all when ≤ 7 pages, otherwise first, last and a window. */
export function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

/** 'YYYY-MM-DD' → '5 March 2024' (en-IN, read as a calendar date so no time zone can shift it). */
export function formatPublicationDate(date) {
  if (typeof date !== 'string' || !ISO_DATE.test(date)) return null
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Consecutive rows with the same year as [{ year, rows, continued }] (year null = undated). Rows
 * must already be in order. `before` is the row just before this slice (the previous page's last
 * row): when it has the same year as the first group, that group is marked `continued`.
 */
export function groupByYear(rows, before = null) {
  const groups = []
  for (const r of rows) {
    const year = yearOf(r.date)
    const last = groups[groups.length - 1]
    if (last && last.year === year) last.rows.push(r)
    else groups.push({ year, rows: [r], continued: false })
  }
  if (groups.length && before && yearOf(before.date) === groups[0].year) groups[0].continued = true
  return groups
}

/**
 * Bars for "publications per year": one entry per year from the earliest to the latest dated
 * row — years with none included as 0, so the time axis stays even. Undated rows are left out.
 */
export function yearCounts(rows) {
  const years = rows.map(r => yearOf(r.date)).filter(y => y !== null)
  if (!years.length) return []
  const min = Math.min(...years)
  const max = Math.max(...years)
  const counts = new Map()
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1)
  return Array.from({ length: max - min + 1 }, (_, i) => ({ year: min + i, count: counts.get(min + i) ?? 0 }))
}

/** Figures for the page hero: number of rows, number of distinct types, earliest year (or null). */
export function publicationStats(rows) {
  const years = rows.map(r => yearOf(r.date)).filter(y => y !== null)
  return {
    count: rows.length,
    types: new Set(rows.map(r => normKey(r.type)).filter(Boolean)).size,
    firstYear: years.length ? Math.min(...years) : null,
  }
}

/** Number of rows whose type is one of `types` (exact names; case and spaces ignored). */
export function countOfTypes(rows, types) {
  const keys = new Set((Array.isArray(types) ? types : []).map(normKey).filter(Boolean))
  return keys.size ? rows.filter(r => keys.has(normKey(r.type))).length : 0
}

const fullYear = (s, ref) => {
  if (s.length === 4) return Number(s)
  // Two digits: same century as the 4-digit year next to it, else 2000s ("24-25" → 2024–2025).
  const century = ref ? Math.floor(ref / 100) * 100 : 2000
  return century + Number(s)
}

/**
 * The period a report covers, read from its title when it names one — "2025-2026",
 * "2025 - 2026", "2024–25", "24-25", "2014-2019" — otherwise the year of its date.
 * → { start, end } or null (no period in the title and no date). Two-digit years are read in the
 * 2000s (or the century of the 4-digit year beside them). A pair that is not a forward span of at
 * most 10 years (e.g. "2025-2019") is not treated as a period. A 4-digit start must be 19xx/20xx;
 * two 2-digit numbers count only as consecutive years ("24-25"), so page or day ranges in a title
 * ("pages 10-15", "10-12 March") are not mistaken for years.
 */
export function reportPeriod(row) {
  const m = typeof row?.title === 'string' && row.title.match(/(?<!\d)(\d{4}|\d{2})\s*[-–—/]\s*(\d{4}|\d{2})(?!\d)/)
  if (m) {
    const start = fullYear(m[1], null)
    const end = fullYear(m[2], start)
    const plausible = m[1].length === 4 ? /^(19|20)/.test(m[1]) : m[2].length === 2 && end === start + 1
    if (plausible && end > start && end - start <= 10) return { start, end }
  }
  const y = yearOf(row?.date)
  return y === null ? null : { start: y, end: y }
}

/** { start: 2025, end: 2026 } → '2025–26'; 2014–2019 → '2014–19'; one year → '2025'; null → null. */
export function formatPeriod(period) {
  if (!period) return null
  const { start, end } = period
  if (start === end) return String(start)
  if (Math.floor(start / 100) === Math.floor(end / 100)) return `${start}–${String(end).slice(2)}`
  return `${start}–${end}`
}

/**
 * The latest row of `type` (case/space-insensitive) for the TIDE page's spotlight: the one whose
 * report period ends latest — the period named in its title (e.g. "2025-26"), or, when the title
 * names none, the year of its date of publication (reportPeriod) — then the newest date, then
 * title A→Z. Runs on every build, so it follows the Sheet with no code change.
 * null when there is no row of that type.
 */
export function latestOfType(rows, type) {
  const key = normKey(type)
  if (!key) return null
  const end = (r) => reportPeriod(r)?.end ?? -Infinity
  return [...rows]
    .sort(comparePublications(DEFAULT_DIR))
    .filter(r => normKey(r.type) === key)
    .map((r, i) => ({ r, i }))
    .sort((a, b) => end(b.r) - end(a.r) || a.i - b.i)[0]?.r ?? null
}

/**
 * True when the row's date is within `days` days before `now` (today counts; future dates
 * don't — a date ahead of today is more likely a typo than news).
 */
export function isNew(date, now, days) {
  if (typeof date !== 'string' || !ISO_DATE.test(date)) return false
  const t = Date.parse(`${date}T00:00:00Z`)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const age = (today - t) / 86400000
  return age >= 0 && age <= days
}

/** Only http(s) links are rendered (the sync already enforces this; checked again here). */
export const safeLink = safeHttpUrl

/**
 * Where a link goes, read from the URL alone (a credibility cue, never a guess about content):
 *   { kind: 'doi' }          doi.org / dx.doi.org links
 *   { kind: 'driveFile' }    a Google Drive file (/file/…); the file type is not in the URL
 *   { kind: 'driveFolder' }  a Google Drive folder
 *   { kind: 'host', host }   anything else: the host without "www."
 * null for no / unsafe link.
 */
export function sourceOf(url) {
  const safe = safeLink(url)
  if (!safe) return null
  let u
  try { u = new URL(safe) } catch { return null }
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'doi.org' || host === 'dx.doi.org') return { kind: 'doi' }
  if (host === 'drive.google.com') {
    if (/\/folders\//.test(u.pathname)) return { kind: 'driveFolder' }
    if (/\/file\//.test(u.pathname) || u.searchParams.has('id')) return { kind: 'driveFile' }
  }
  return { kind: 'host', host }
}

/**
 * The display name for a web address from `names` ({ 'example.org': 'Example' }, from YAML): the
 * address itself or its closest listed parent (news.cam.ac.uk → cam.ac.uk), else the address.
 */
export function sourceName(host, names) {
  if (!host) return host
  const map = names && typeof names === 'object' ? names : {}
  const labels = host.toLowerCase().split('.')
  for (let i = 0; i < labels.length - 1; i++) {
    const name = map[labels.slice(i).join('.')]
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return host
}

/** Icon family for a type (TYPE_ICON_RULES in config): 'article', 'book', … or 'file'. */
export function typeIconKey(type, rules = TYPE_ICON_RULES) {
  const t = normKey(type)
  if (!t) return 'file'
  return rules.find(rule => rule.keywords.some(k => t.includes(k)))?.iconKey ?? 'file'
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * `text` split into [{ text, match }] where each search word occurs (case-insensitive), for
 * <mark> highlighting. Adjacent matches (also across spaces only) are merged. No words → one
 * unmatched part.
 */
export function highlightParts(text, terms) {
  if (typeof text !== 'string' || !text) return []
  const words = (terms ?? []).filter(Boolean).sort((a, b) => b.length - a.length)
  if (!words.length) return [{ text, match: false }]
  // Whitespace in the text may be several spaces where the search word has one.
  const re = new RegExp(words.map(w => escapeRe(w).replace(/ /g, '\\s+')).join('|'), 'gi')
  const parts = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (!m[0]) continue
    if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false })
    parts.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false })
  // Words separated only by spaces ("teacher agency") read as one highlight.
  const joined = parts.map((p, i) => (!p.match && /^\s+$/.test(p.text) && parts[i - 1]?.match && parts[i + 1]?.match ? { ...p, match: true } : p))
  return joined.reduce((acc, p) => {
    const prev = acc[acc.length - 1]
    if (prev && prev.match === p.match) prev.text += p.text
    else acc.push({ ...p })
    return acc
  }, [])
}

/**
 * schema.org ItemList for a page's rows (JSON-LD): name, datePublished and url only when the
 * row has them; @type ScholarlyArticle / Book / CreativeWork by the type's icon family.
 */
export function publicationsJsonLd(rows, { name, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => {
      const link = safeLink(r.link)
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': SCHEMA_TYPE_BY_ICON[typeIconKey(r.type)] ?? 'CreativeWork',
          name: r.title ? cleanLabel(r.title) : undefined,
          ...(hasDate(r) ? { datePublished: r.date } : {}),
          ...(link ? { url: link } : {}),
        },
      }
    }),
  }
}
