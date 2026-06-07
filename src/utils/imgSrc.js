const B = import.meta.env.BASE_URL

/**
 * Resolves a data-sourced image path to an absolute URL that works on
 * any deployment base (dev "/" or GitHub Pages "/tide-testing/").
 *
 * Handles three formats stored in YAML/JSON:
 *   "/assets/images/foo.jpg"  → strips leading slash, prepends BASE_URL
 *   "assets/images/foo.jpg"   → prepends BASE_URL directly
 *   "https://..."             → returned as-is (external URL)
 *   null / undefined / ""     → returns ""
 */
export function imgSrc(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  return `${B}${path.replace(/^\//, '')}`
}
