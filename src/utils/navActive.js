// Header menu active state (src/components/layout/Header.jsx). Menu entries are
// content/shared/navigation.yaml items: { to } links, { children } dropdowns, { subItems } nested groups.

// A link is "current" when the path is its address or below it. Where several links match
// (e.g. /thrive and /thrive/publications), only the longest — the most specific — counts.
const matchLength = (to, path) => (to && (path === to || path.startsWith(`${to.replace(/\/$/, '')}/`)) ? to.length : -1)

// Best match inside a menu entry: { len, depth } (len -1 = no match). Nested groups count too.
function bestMatch(item, path, depth = 0) {
  if (item.to) return { len: matchLength(item.to, path), depth }
  let best = { len: -1, depth: Infinity }
  for (const c of item.children ?? item.subItems ?? []) {
    const m = bestMatch(c, path, depth + 1)
    if (m.len > best.len || (m.len === best.len && m.depth < best.depth)) best = m
  }
  return best
}

// The one top-level entry to highlight: the most specific match; on a tie (a page listed in two
// menus, like THRIvE Publications) the menu where it sits least deep, then the first.
export function activeTopIndex(items, path) {
  let idx = -1
  let best = { len: -1, depth: Infinity }
  items.forEach((item, i) => {
    const m = bestMatch(item, path)
    if (m.len >= 0 && (m.len > best.len || (m.len === best.len && m.depth < best.depth))) { idx = i; best = m }
  })
  return idx
}

// The address of the most specific matching link anywhere in the menu (for the mobile list).
export function activeLeaf(items, path) {
  let found = null
  const walk = (list) => list.forEach(it => {
    if (it.to && matchLength(it.to, path) > (found ? found.length : -1)) found = it.to
    walk(it.children ?? it.subItems ?? [])
  })
  walk(items)
  return found
}
