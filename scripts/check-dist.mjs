// scripts/check-dist.mjs — checks on the built site in dist/ (audit P6), no browser, no network.
//
//   node scripts/check-dist.mjs            # after `npm run build` (run in CI after the build)
//
// 1. Links and assets: every href / src / srcset / poster in every built HTML page, and every <loc>
//    in sitemap.xml, that points into the site must resolve to a file the way GitHub Pages resolves
//    it (x, x.html, x/index.html). Outside links (https://other.host, mailto:, tel:) are not fetched.
// 2. Bundle budget: the JavaScript every page loads first (the entry chunk and the vendor chunks it
//    imports, gzip) and the largest single chunk stay under BUDGET. Raise a number only on purpose,
//    with the reason in the commit (P5-8/P5-14 in docs/audits/2026-11-site-audit.md).
//
// Exit 1 with a list on any problem.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Measured 2026-11-24 (P6, base-path build): first-load JS 163.9 kB gz (the entry chunk + the chunks
// index.html preloads), largest chunk vendor-react 55.2 kB gz. Budgets leave ~10 % headroom.
export const BUDGET = { firstLoadGzKb: 180, largestChunkGzKb: 61 }

const DIST = path.resolve(process.argv[2] || 'dist')
const isFile = (f) => { try { return fs.statSync(f).isFile() } catch { return false } }

/** The base path the build used, read from dist/index.html ('/tide-testing/' or '/'). */
export function detectBase(indexHtml) {
  const m = /src="(\/[^"]*?)assets\/index-[\w-]+\.js"/.exec(indexHtml)
  return m ? m[1] : '/'
}

/** GitHub Pages resolution of a site path (base removed, no query/hash) inside `dist`. */
export function resolves(dist, rel) {
  const clean = decodeURIComponent(rel).replace(/^\/+/, '')
  const p = path.join(dist, clean)
  if (!p.startsWith(dist)) return false
  if (clean === '' || clean.endsWith('/')) return isFile(path.join(p, 'index.html')) || isFile(`${p.replace(/[\\/]+$/, '')}.html`)
  return isFile(p) || isFile(`${p}.html`) || isFile(path.join(p, 'index.html'))
}

/** URLs referenced by one HTML document (href, src, srcset candidates, poster). */
export function referencedUrls(html) {
  const out = []
  for (const m of html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)) out.push(m[1])
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u) out.push(u) }
  }
  return out.map((u) => u.replace(/&amp;/g, '&'))
}

function walkHtml(dir, list = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name)
    if (e.isDirectory()) walkHtml(f, list)
    else if (e.name.endsWith('.html')) list.push(f)
  }
  return list
}

export function checkLinks(dist) {
  const base = detectBase(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'))
  const problems = []
  const pages = walkHtml(dist)
  const seen = new Map()
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8')
    for (const raw of referencedUrls(html)) {
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(raw) || raw.startsWith('//')) continue
      const url = raw.split(/[?#]/)[0]
      if (!url) continue
      if (!url.startsWith(base)) { problems.push(`${path.relative(dist, file)}: "${raw}" is outside the base ${base}`); continue }
      if (!seen.has(url)) seen.set(url, resolves(dist, url.slice(base.length)))
      if (!seen.get(url)) problems.push(`${path.relative(dist, file)}: "${raw}" has no file in dist/`)
    }
  }
  const sitemapFile = path.join(dist, 'sitemap.xml')
  let sitemapCount = 0
  if (isFile(sitemapFile)) {
    for (const m of fs.readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapCount += 1
      // site.yaml url is the production host without the staging base; strip the base if a build adds it.
      let pathname = new URL(m[1]).pathname
      if (base !== '/' && pathname.startsWith(base)) pathname = pathname.slice(base.length - 1)
      const rel = pathname.replace(/^\/+/, '')
      if (!resolves(dist, rel)) problems.push(`sitemap.xml: ${m[1]} has no page in dist/`)
    }
  } else problems.push('sitemap.xml is missing')
  return { problems, pages: pages.length, urls: seen.size, sitemapCount, base }
}

const gzKb = (file) => zlib.gzipSync(fs.readFileSync(file)).length / 1024

export function checkBudget(dist, budget = BUDGET) {
  const assets = path.join(dist, 'assets')
  const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  const first = new Set()
  for (const m of index.matchAll(/(?:src|href)="[^"]*assets\/([\w.-]+\.js)"/g)) first.add(m[1])
  const firstLoad = [...first].reduce((s, f) => s + gzKb(path.join(assets, f)), 0)
  const chunks = fs.readdirSync(assets).filter((f) => f.endsWith('.js')).map((f) => [f, gzKb(path.join(assets, f))])
  const [largestName, largest] = chunks.sort((a, b) => b[1] - a[1])[0]
  const problems = []
  if (firstLoad > budget.firstLoadGzKb) problems.push(`first-load JS ${firstLoad.toFixed(1)} kB gz > budget ${budget.firstLoadGzKb} kB (${[...first].join(', ')})`)
  if (largest > budget.largestChunkGzKb) problems.push(`largest chunk ${largestName} ${largest.toFixed(1)} kB gz > budget ${budget.largestChunkGzKb} kB`)
  return { problems, firstLoad, firstFiles: [...first], largestName, largest }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/').replace(/^\//, '')}`) {
  if (!isFile(path.join(DIST, 'index.html'))) { console.error(`check-dist: ${DIST}/index.html not found — run npm run build first`); process.exit(1) }
  const links = checkLinks(DIST)
  const budget = checkBudget(DIST)
  console.log(`check-dist: ${links.pages} pages, ${links.urls} site URLs, ${links.sitemapCount} sitemap entries (base ${links.base})`)
  console.log(`check-dist: first-load JS ${budget.firstLoad.toFixed(1)} kB gz (budget ${BUDGET.firstLoadGzKb}); largest chunk ${budget.largestName} ${budget.largest.toFixed(1)} kB gz (budget ${BUDGET.largestChunkGzKb})`)
  const all = [...links.problems, ...budget.problems]
  if (all.length) {
    console.error(`check-dist: ${all.length} problem(s):\n  - ${all.slice(0, 50).join('\n  - ')}${all.length > 50 ? `\n  … and ${all.length - 50} more` : ''}`)
    process.exit(1)
  }
  console.log('check-dist: OK')
}
