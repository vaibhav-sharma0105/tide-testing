// Pure rules for scripts/prerender.mjs (unit-tested in src/test/scripts/seoBuild.test.js).
import { createHash } from 'node:crypto'

const scriptSha = (js) => createHash('sha256').update(js, 'utf8').digest('base64')

/** Output file(s) for a route path. A path that is also a folder of other routes gets both forms. */
export function outputFiles(routePath, allPaths) {
  if (routePath === '/') return ['index.html']
  if (routePath === '/404') return ['404.html']
  // The route is URL-encoded (resourcePath: "K 31" → "K%2031"); a static host decodes a request
  // before looking for the file, so the file gets the decoded name ("K 31.html").
  const rel = decodeURIComponent(routePath.replace(/^\/+/, ''))
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
  // The page's one script, allowed by its hash alone (CSP): nothing else can run or load here.
  const script = `location.replace(${JSON.stringify(target).replace(/</g, '\\u003c')} + location.search + location.hash)`
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${text(siteName)}</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${attr(canonical)}">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${scriptSha(script)}'; base-uri 'none'; form-action 'none'">
  <script>${script}</script>
  <meta http-equiv="refresh" content="0; url=${attr(target)}">
</head>
<body></body>
</html>
`
}

/**
 * Vite's runtime loader adds <link rel="modulepreload"> tags for a page's code with ABSOLUTE
 * addresses (the prerender's origin, e.g. http://localhost:4173/assets/…). Saved as they are, a
 * page served from any other origin (a custom domain, another port) asks for its code from the
 * wrong host, and the CSP (script-src 'self') blocks it with console errors. This turns those
 * same-origin preload addresses into root-relative ones (/tide-testing/assets/…), which work on
 * any host. Other absolute URLs (og:image, canonical) are left alone: they must stay absolute.
 */
export function relativePreloads(html, origin) {
  const prefix = `href="${origin.replace(/\/+$/, '')}/`
  return html.replace(/<link [^>]*rel="modulepreload"[^>]*>/g, (tag) => tag.split(prefix).join('href="/'))
}
