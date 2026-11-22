import { PRIORITY_ORDER, LAST_CATEGORIES } from '../config/partners'
import { normKey, cleanLabel } from './listingFilters'

// Ordering and search for the Partners page (/about/our-partners). Rules: docs/PARTNERS-SHEET-SCHEMA.md.

const PRIORITY_KEYS = PRIORITY_ORDER.map(normKey)
const LAST_KEYS = LAST_CATEGORIES.map(normKey)

/** 0 for the highest priority … PRIORITY_ORDER.length for an unknown or empty one. */
export function priorityRank(priority) {
  const i = PRIORITY_KEYS.indexOf(normKey(priority))
  return i === -1 ? PRIORITY_ORDER.length : i
}

const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true })

/** Highest priority first, then A→Z by name (then id, so the order never jumps). */
export function comparePartners(a, b) {
  return priorityRank(a.priority) - priorityRank(b.priority) || byName(a, b) || a.id.localeCompare(b.id)
}

/**
 * Rows → sections, one per "Type of partner" (capitals/spaces ignored), A→Z with LAST_CATEGORIES
 * last; partners inside a section in comparePartners order. The section label is the spelling
 * used by most of its rows (ties: A→Z), so one odd spelling doesn't rename the section.
 * Returns [{ key, label, partners }].
 */
export function groupPartners(rows) {
  const groups = new Map()
  for (const r of rows ?? []) {
    const key = normKey(r?.type)
    if (!key || !r?.name) continue
    if (!groups.has(key)) groups.set(key, { key, spellings: new Map(), partners: [] })
    const g = groups.get(key)
    const label = cleanLabel(r.type)
    g.spellings.set(label, (g.spellings.get(label) ?? 0) + 1)
    g.partners.push(r)
  }
  const lastRank = (key) => { const i = LAST_KEYS.indexOf(key); return i === -1 ? -1 : i }
  return [...groups.values()]
    .map(({ key, spellings, partners }) => ({
      key,
      label: [...spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      partners: partners.sort(comparePartners),
    }))
    .sort((a, b) => lastRank(a.key) - lastRank(b.key) || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
}

/** Every word of the query must appear in the partner's name (case- and accent-insensitive). */
export function matchesPartner(partner, query) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const name = fold(partner?.name)
  return words.every(w => name.includes(w))
}

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Sections with only the partners matching `query`; empty sections are dropped. */
export function filterGroups(groups, query) {
  if (!fold(query).trim()) return groups
  return groups
    .map(g => ({ ...g, partners: g.partners.filter(p => matchesPartner(p, query)) }))
    .filter(g => g.partners.length > 0)
}

// Small words skipped when picking initials ("Society for the Deaf" → "SD").
const INITIALS_SKIP = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to', '&'])

/**
 * One or two capital letters for a partner without a usable logo: the first letters of the first two
 * significant words ("Ahmedabad University" → "AU"). A web address typed as the name uses its site
 * name ("https://www.ahduni.edu.in/" → "A"). Letters only from the name itself; '' if none.
 */
export function partnerInitials(name) {
  let text = String(name ?? '').trim()
  if (/^(https?:\/\/|www\.)\S+$/i.test(text)) {
    text = text.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[./]/)[0]
  }
  const words = text.split(/[\s\-–—_/]+/).map(w => w.replace(/^[^\p{L}\p{N}]+/u, '')).filter(Boolean)
  const significant = words.filter(w => !INITIALS_SKIP.has(w.toLowerCase()))
  return (significant.length ? significant : words).slice(0, 2).map(w => Array.from(w)[0].toLocaleUpperCase('en')).join('')
}

/**
 * How much visual weight a partner's card gets, from its priority — never shown as a label:
 * 'feature' (the top priority, e.g. "Extremely high"), 'high' (the next one) or '' (the rest).
 */
export function partnerTier(priority) {
  const rank = priorityRank(priority)
  return rank === 0 ? 'feature' : rank === 1 ? 'high' : ''
}

/** "https://www.cam.ac.uk/research" → "cam.ac.uk" (shown under the name); '' if not a web link. */
export function websiteLabel(url) {
  try {
    const u = new URL(url)
    return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./i, '') : ''
  } catch {
    return ''
  }
}
