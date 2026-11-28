// Order and grouping for the Past SCF profiles (/education-for-harmony/social-changemakers).
// Plain functions, no React: scripts/lib/social-changemakers-snapshot.js imports them too, so the
// page and the sync's report agree. Rules: docs/SOCIAL-CHANGEMAKERS-SHEET-SCHEMA.md "Order on the page".

/**
 * The first year written in a batch label, as a full year: "23-24" → 2023, "2023-24" → 2023,
 * "SCF 24–25" → 2024. Null when there is no year in it.
 */
export function batchYear(batch) {
  const s = String(batch ?? '')
  // A range's first year ("2023-24", "23-24", "2023/2024"), else a 4-digit year, else the first 2-digit
  // number — so "Batch 12 (2023-24)" is 2023, not 2012 (audit P5-12).
  const m = /(\d{4}|\d{2})\s*[-–/]\s*\d{2,4}/.exec(s) || /\b((?:19|20)\d{2})\b/.exec(s) || /(\d{4}|\d{2})/.exec(s)
  if (!m) return null
  const y = Number(m[1])
  return m[1].length === 2 ? 2000 + y : y
}

/** "3", "3.", " 3 " → 3; anything else (empty, "first", 0, -1, 2.5) → null. */
export function orderNumber(order) {
  if (typeof order === 'number') return Number.isInteger(order) && order > 0 ? order : null
  const m = /^\s*(\d+)\s*\.?\s*$/.exec(String(order ?? ''))
  const n = m ? Number(m[1]) : null
  return n && n > 0 ? n : null
}

const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'en', { sensitivity: 'base' })

/** Inside a batch: the "Order to post" number, smallest first (none = last), then name A→Z, then id. */
export function compareFellows(a, b) {
  const oa = orderNumber(a.order)
  const ob = orderNumber(b.order)
  if (oa !== ob) return oa === null ? 1 : ob === null ? -1 : oa - ob
  return byName(a, b) || String(a.id).localeCompare(String(b.id))
}

/**
 * Rows → [{ key, label, year, fellows }], newest batch first (a batch without a readable year last),
 * fellows in compareFellows order. Rows with the same year are one batch ("23-24" and "2023-24");
 * its label is the spelling most of its rows use.
 */
export function groupByBatch(rows) {
  const groups = new Map()
  for (const r of rows ?? []) {
    if (!r?.name || !r?.batch) continue
    const year = batchYear(r.batch)
    const key = year === null ? `text:${String(r.batch).trim().toLowerCase()}` : `year:${year}`
    if (!groups.has(key)) groups.set(key, { key, year, spellings: new Map(), fellows: [] })
    const g = groups.get(key)
    const label = String(r.batch).trim()
    g.spellings.set(label, (g.spellings.get(label) ?? 0) + 1)
    g.fellows.push(r)
  }
  return [...groups.values()]
    .map(g => ({
      key: g.key,
      year: g.year,
      label: [...g.spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      fellows: g.fellows.sort(compareFellows),
    }))
    .sort((a, b) => (a.year === null) - (b.year === null) || (b.year ?? 0) - (a.year ?? 0) || a.label.localeCompare(b.label))
}

/** "Mohammed Aamir Khan" → "MK" (first and last word); one word → its first letter; '' if none. */
export function personInitials(name) {
  const words = String(name ?? '').trim().split(/\s+/).map(w => w.replace(/^[^\p{L}\p{N}]+/u, '')).filter(Boolean)
  if (!words.length) return ''
  const first = Array.from(words[0])[0]
  const last = words.length > 1 ? Array.from(words.at(-1))[0] : ''
  return (first + last).toLocaleUpperCase('en')
}

/** "Asha Patel" → "Asha". */
export const firstName = (name) => String(name ?? '').trim().split(/\s+/)[0] ?? ''

/** A stable number 0…n-1 from an id (picks one of the fixed poster gradients). */
export function posterIndex(id, n = 4) {
  let h = 0
  for (const ch of String(id ?? '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % n
}

/** Fellows in page order (batches newest first, then the Sheet order) — for previous / next. */
export const fellowsInOrder = (batches) => batches.flatMap(b => b.fellows)

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Every word of the query appears in the fellow's name or project (capitals and accents ignored). */
export function matchesFellow(fellow, query) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = fold(`${fellow.name} ${fellow.project ?? ''}`)
  return words.every(w => hay.includes(w))
}
