// Pure rules for scripts/prerender.mjs (unit-tested in src/test/scripts/prerender.test.js).

/** Output file(s) for a route path. A path that is also a folder of other routes gets both forms. */
export function outputFiles(routePath, allPaths) {
  if (routePath === '/') return ['index.html']
  if (routePath === '/404') return ['404.html']
  const rel = routePath.replace(/^\/+/, '')
  const files = [`${rel}.html`]
  // GitHub Pages serves /x from x.html; if a folder x/ exists too it may answer /x with a redirect to
  // /x/ instead (not verified which wins), so the folder gets the same page as x/index.html.
  if (allPaths.some((p) => p.startsWith(`${routePath}/`))) files.push(`${rel}/index.html`)
  return files
}

/**
 * What a crawler needs from a written page: a title, exactly one <h1> with text, real body text,
 * and (unless the page is noindex) a canonical link to the site address + the route's path.
 * Returns a list of problems (empty = fine).
 */
export function checkPage(info, { path, siteUrl }) {
  const problems = []
  if (!info.title || !info.title.trim()) problems.push('no <title>')
  if (info.h1Count !== 1) problems.push(`${info.h1Count} <h1> elements (expected 1)`)
  if (!info.h1Text || !info.h1Text.trim()) problems.push('empty <h1>')
  if (!info.mainTextLength || info.mainTextLength < 40) problems.push('almost no text in <main>')
  if (!info.noindex) {
    const want = `${siteUrl.replace(/\/+$/, '')}${path}`
    if (info.canonical !== want) problems.push(`canonical ${info.canonical || '(none)'} — expected ${want}`)
  }
  if (info.errors && info.errors.length) problems.push(`page errors: ${info.errors.join(' | ')}`)
  return problems
}

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const text = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * A forwarding page for an old address (GitHub Pages can't send a 301): noindex, canonical = the new
 * address, and an immediate forward that keeps the query string and #hash (meta refresh without JS).
 */
export function redirectHtml({ to, base, siteUrl, siteName }) {
  const target = `${base.replace(/\/+$/, '')}${to}`
  const canonical = `${siteUrl.replace(/\/+$/, '')}${to}`
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${text(siteName)}</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${attr(canonical)}">
  <script>location.replace(${JSON.stringify(target).replace(/</g, '\\u003c')} + location.search + location.hash)</script>
  <meta http-equiv="refresh" content="0; url=${attr(target)}">
</head>
<body></body>
</html>
`
}
