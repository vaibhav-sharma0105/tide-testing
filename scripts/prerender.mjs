// scripts/prerender.mjs — runs after `vite build` (npm run build).
//
// Why: GitHub Pages has no server. Before this step every address except "/" was answered with
// HTTP 404 + an empty redirect page (public/404.html), and "/" itself with an empty <div id="root">.
// Crawlers that don't run JavaScript (most AI crawlers, social previews) saw no title, description,
// canonical link, structured data or text, and Google saw a 404 for every inner page.
//
// What: opens every public page of the built site in headless Chromium (Playwright, already a dev
// dependency for the e2e tests), lets the app render it, and saves the result as a real HTML file:
//   /                      → dist/index.html
//   /about/why-tide        → dist/about/why-tide.html (GitHub Pages serves it at /about/why-tide, HTTP 200)
//   /pramaan/resource-centre/<id>  one file per row of the Resource Centre snapshot
//   /404                   → dist/404.html: what GitHub Pages sends (HTTP 404) for an unknown address;
//                            the app still starts there and shows the right page for addresses the
//                            server doesn't know (e.g. /pramaan-library/W1, a trailing slash)
// plus a forwarding page per old address (REDIRECT_ROUTES) and dist/llms-full.txt (the text of every
// sitemap page). No request leaves the machine: files are served from dist/ by request interception,
// at the real site origin so absolute URLs that use window.location (og:image) come out right.
// The app does not hydrate this HTML — src/main.jsx renders the page fresh over it (see there).
//
// Fails the build if a page has no title, not exactly one <h1>, almost no text, a wrong canonical,
// or throws an error (scripts/lib/prerender-check.js).

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { loadSite, loadResources } from './siteDataPlugin.js'
import { PRIMARY_ROUTES, REDIRECT_ROUTES, resourcePath } from '../src/config/siteRoutes.js'
import { checkPage, outputFiles, redirectHtml, relativePreloads } from './lib/prerender-check.js'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const BASE = process.env.GITHUB_ACTIONS ? '/tide-testing/' : '/' // same rule as vite.config.js
const ORIGIN = (process.env.SITE_ORIGIN
  || (process.env.GITHUB_REPOSITORY_OWNER ? `https://${process.env.GITHUB_REPOSITORY_OWNER.toLowerCase()}.github.io` : 'http://localhost:4173'))
  .replace(/\/+$/, '')
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY) || 6
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf',
}

const site = loadSite(ROOT)
const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8') // the app shell, before it is overwritten
const prefix = `${ORIGIN}${BASE}`

const resources = loadResources(ROOT)
const routes = [
  ...PRIMARY_ROUTES.map((r) => ({ path: r.path, text: r.sitemap !== false })),
  ...resources.map((r) => ({ path: resourcePath(r.id) })),
  { path: '/404' },
]
const allPaths = routes.map((r) => r.path)

async function serve(route) {
  const url = route.request().url()
  if (!url.startsWith(prefix)) return route.abort() // fonts, video hosts…: not needed for the HTML
  const rel = decodeURIComponent(new URL(url).pathname.slice(BASE.length))
  const file = path.join(DIST, rel)
  if (rel && file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    return route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' })
  }
  return route.fulfill({ status: 200, body: shell, contentType: 'text/html' })
}

async function render(context, routePath) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  // Aborted outside requests (fonts, video hosts) log "Failed to load resource"; anything else counts.
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(m.text()) })
  try {
    await page.goto(`${ORIGIN}${BASE.replace(/\/$/, '')}${routePath}`, { waitUntil: 'load' })
    await page.waitForSelector('main#main-content h1', { timeout: 20000 })
    // Scroll through once so every scroll reveal has played (the saved text is then visible, not opacity 0).
    await page.evaluate(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms))
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.7)) {
        window.scrollTo(0, y)
        await pause(60)
      }
      window.scrollTo(0, 0)
      await pause(700)
    })
    const info = await page.evaluate(() => {
      // Head tags the app put there (React owns them): marked, so main.jsx can remove them before the app starts.
      for (const el of document.head.querySelectorAll('meta, link')) {
        if (Object.keys(el).some((k) => k.startsWith('__react'))) el.setAttribute('data-prerender', '')
      }
      const main = document.querySelector('main#main-content')
      const h1s = main ? main.querySelectorAll('h1') : []
      return {
        html: `<!doctype html>\n${document.documentElement.outerHTML}\n`,
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
        noindex: /noindex/.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') || ''),
        h1Count: h1s.length,
        h1Text: h1s[0]?.textContent || '',
        mainText: main ? main.innerText : '',
        mainTextLength: main ? main.innerText.trim().length : 0,
      }
    })
    // Code preloads point at this origin; make them work on any host (see relativePreloads).
    return { ...info, html: relativePreloads(info.html, ORIGIN), errors }
  } finally {
    await page.close()
  }
}

async function main() {
  const started = Date.now()
  const browser = await chromium.launch()
  const results = new Map()
  const failures = []
  try {
    const queue = [...routes]
    const worker = async () => {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      await context.route('**/*', serve)
      try {
        for (let r = queue.shift(); r; r = queue.shift()) {
          let info
          try {
            info = await render(context, r.path)
          } catch (e) {
            failures.push(`${r.path}: ${e.message.split('\n')[0]}`)
            continue
          }
          const problems = checkPage(info, { path: r.path, siteUrl: site.url })
          if (problems.length) failures.push(`${r.path}: ${problems.join('; ')}`)
          results.set(r.path, info)
        }
      } finally {
        await context.close()
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  } finally {
    await browser.close()
  }

  if (failures.length) {
    console.error(`prerender: ${failures.length} page(s) failed:\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }

  for (const r of routes) {
    for (const rel of outputFiles(r.path, allPaths)) {
      const file = path.join(DIST, rel)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, results.get(r.path).html)
    }
  }
  for (const r of REDIRECT_ROUTES) {
    const file = path.join(DIST, `${r.from.replace(/^\/+/, '')}.html`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, redirectHtml({ to: r.to, base: BASE, siteUrl: site.url, siteName: site.name }))
  }

  // llms-full.txt: each sitemap page's title, address and visible main text, as the site shows it.
  const full = [`# ${site.name}`, '']
  for (const r of routes.filter((x) => x.text)) {
    const info = results.get(r.path)
    full.push(`## ${info.title}`, '', `URL: ${info.canonical || `${site.url}${r.path}`}`, '', info.mainText.replace(/\n{3,}/g, '\n\n').trim(), '')
  }
  fs.writeFileSync(path.join(DIST, 'llms-full.txt'), `${full.join('\n')}\n`)

  console.log(`prerender: ${routes.length} pages + ${REDIRECT_ROUTES.length} redirects written at ${prefix} in ${((Date.now() - started) / 1000).toFixed(1)} s`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
