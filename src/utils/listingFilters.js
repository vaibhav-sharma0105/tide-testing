/**
 * Generic helpers for listing pages built from a Sheet snapshot (the Pramaan Resource Centre,
 * the Publications pages). Pure functions. Values come from free-typed Sheet cells, so matching
 * ignores case and extra spaces ("Mathematics " and "mathematics" are one value).
 */

/** Normalised key for matching: trimmed, single spaces, lower case ('' for non-strings). */
export const normKey = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').toLowerCase() : '')

/** The value as shown: trimmed, single spaces. */
export const cleanLabel = (v) => v.trim().replace(/\s+/g, ' ')

/** [{ value, label, count }] for one single-valued field, sorted by label; value is the normalised key. */
export function optionsFor(resources, field) {
  const map = new Map()
  for (const r of resources) {
    const key = normKey(r[field])
    if (!key) continue
    const entry = map.get(key) ?? { value: key, label: cleanLabel(r[field]), count: 0 }
    entry.count++
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Same as optionsFor, for a field holding a list of values (e.g. ['A', 'B']). A resource counts
 * once per distinct value it has.
 */
export function optionsForMany(resources, field) {
  const map = new Map()
  for (const r of resources) {
    const values = Array.isArray(r[field]) ? r[field] : []
    const seen = new Set()
    for (const v of values) {
      const key = normKey(v)
      if (!key || seen.has(key)) continue
      seen.add(key)
      const entry = map.get(key) ?? { value: key, label: cleanLabel(v), count: 0 }
      entry.count++
      map.set(key, entry)
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Option order for filter pickers (owner's rule): pinned values in the given order, then A→Z
 * ignoring case, and "Other" always last. The UI adds the "All …" choice on top.
 */
export function orderFilterOptions(options, pinned = []) {
  const rank = (o) => (o.value === 'other' ? 2 : pinned.includes(o.value) ? 0 : 1)
  return [...options].sort((a, b) =>
    rank(a) - rank(b)
    || (rank(a) === 0 ? pinned.indexOf(a.value) - pinned.indexOf(b.value) : 0)
    || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
    || a.value.localeCompare(b.value))
}
