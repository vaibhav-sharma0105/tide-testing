// Global setup for the dev-server e2e run (playwright.config.js).
//
// Why: a dev server can discover a dependency only when a page first imports it, re-optimise and
// RELOAD the open page; a test on that page then fails with "Execution context was destroyed". That
// is the likeliest cause of the flaky a11y `/` test seen in P4/P5 (both right after dependency
// updates). NOT reproduced in P6: one run against a cold `vite --force` passed with no reload logged.
// Opening every route once here, before any test, moves any such reload out of the tests.
// E2E_NO_WARMUP=1 skips it.
import { chromium } from '@playwright/test'
import { PRIMARY_ROUTES } from '../src/config/siteRoutes.js'

export default async function warmUp(config) {
  if (process.env.E2E_NO_WARMUP) return
  const baseURL = config.projects[0].use.baseURL
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    for (const path of [...PRIMARY_ROUTES.map((r) => r.path), '/pramaan/resource-centre/W1', '/coming-soon']) {
      await page.goto(new URL(path.replace(/^\//, ''), baseURL).href, { waitUntil: 'networkidle' })
    }
    // A reload triggered by the last page's new dependencies settles here too.
    await page.waitForLoadState('networkidle')
  } finally {
    await browser.close()
  }
}
