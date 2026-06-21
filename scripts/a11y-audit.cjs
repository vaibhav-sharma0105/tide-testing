const { chromium } = require('playwright')
const { AxeBuilder } = require('@axe-core/playwright')
const fs = require('fs')

const BASE = 'http://localhost:5175'

// Every route currently in src/App.jsx — header-reachable, stranded, and the
// 404 catch-all. Dynamic detail routes use a real resource id (W1).
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
  '/about/our-results',
  '/projects/block-eti',
  '/projects/bettered',
  '/projects/empowered',
  '/projects/completed',
  '/projects/other-projects',
  '/projects/sdg-drives',
  '/get-involved/work-with-us',
  '/get-involved/mccx',
  '/resources/saral-kadam',
  '/resources/annual-reports',
  '/resources/publications',
  '/resources/abl-resources',
  '/resources/abl-resources/resource-center',
  '/resources/abl-resources/contribute',
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

  fs.writeFileSync('a11y-report.json', JSON.stringify(report, null, 2))
  await browser.close()
})()
