const { chromium } = require('@playwright/test')
const { AxeBuilder } = require('@axe-core/playwright')
const fs = require('fs')
const os = require('os')
const path = require('path')

// Usage: node scripts/a11y-audit.cjs [port]   (or A11Y_PORT=5175)
// Needs a dev server already running on that port, e.g. `npx vite --port 5175`.
// The report goes to the OS temp dir (a11y-report.json is not gitignored, so
// writing it into the repo would leave an untracked file behind).
const PORT = process.argv[2] || process.env.A11Y_PORT || '5175'
const BASE = `http://localhost:${PORT}`
const REPORT_PATH = process.env.A11Y_REPORT || path.join(os.tmpdir(), 'a11y-report.json')

// Every route currently in src/App.jsx plus a deliberately unmatched path that
// exercises the 404 catch-all. Dynamic detail routes use a real resource id (W1).
const ROUTES = [
  '/',
  '/about/why-tide',
  '/about/past-programs',
  '/about/our-team',
  '/about/our-partners',
  '/about/publications',
  '/education-for-harmony',
  '/education-for-harmony/mccx',
  '/pramaan',
  '/pramaan/resource-centre',
  '/pramaan/resource-centre/W1',
  '/pramaan/contribute',
  '/get-involved/volunteer',
  '/get-involved/donate',
  '/thrive',
  '/contact',
  '/this-route-does-not-exist-404-check',
]

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const report = {}

  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 15000 })
      // Scroll through the page first so every whileInView animation has
      // actually triggered, then wait for them to finish settling — otherwise
      // axe can snapshot an element mid-fade-in and report a contrast ratio
      // that never actually exists at rest (confirmed: 2026-06-22, a false
      // positive on AblHome's "why points" list, mid-animation foreground
      // color #6a788a vs the true resting #5A6A7E once settled).
      await page.evaluate(async () => {
        const step = window.innerHeight
        const max = document.body.scrollHeight
        for (let y = 0; y < max; y += step) {
          window.scrollTo(0, y)
          await new Promise(r => setTimeout(r, 80))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(1200)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      report[route] = {
        violations: results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodeCount: v.nodes.length,
          nodes: v.nodes.slice(0, 50).map(n => ({ target: n.target, html: n.html.slice(0, 200), failureSummary: n.failureSummary })),
        })),
      }
      console.log(route, '->', results.violations.length, 'violation rule(s)')
    } catch (err) {
      report[route] = { error: err.message }
      console.log(route, '-> ERROR:', err.message)
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log('Report written to', REPORT_PATH)
  await browser.close()
})()
