// Every public address of the built site, opened directly (a deep link) and reloaded, as GitHub Pages
// serves it: right status, one <h1>, a title, and (checked by the fixture) no console error, CSP
// violation or failed request. Plus the forwarding addresses, the removed routes and the old
// "/?/path" restorer. Route list: src/config/siteRoutes.js (the same list the build prerenders).
import { test, expect, go, sitePath } from './fixtures.js'
import { PRIMARY_ROUTES } from '../../src/config/siteRoutes.js'
import library from '../../src/data/sheets/pramaan-library.json' with { type: 'json' }

import { REMOVED_PATHS as REMOVED } from '../../src/test/routing/removedPaths.js'

const resourceIds = library.resources.map((r) => r.id)


test.describe('every primary route: deep link and reload', () => {
  for (const { path } of PRIMARY_ROUTES) {
    test(path, async ({ page }) => {
      const res = await go(page, path)
      expect(res.status(), 'GitHub Pages answers with the prerendered file').toBe(200)
      await expect(page.locator('main h1')).toHaveCount(1)
      await expect(page).toHaveTitle(/TIDE/)
      const h1 = await page.locator('main h1').textContent()
      await page.reload()
      await expect(page.locator('main h1')).toHaveText(h1)
      expect(sitePath(page).replace(/\/$/, '') || '/').toBe(path)
      // No image on the first screen failed (the placeholder swap would hide it from users).
      const broken = await page.locator('img').evaluateAll((imgs) => imgs
        .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy').map((i) => i.currentSrc || i.src))
      expect(broken).toEqual([])
    })
  }
})

test('resource detail pages: first, middle and last resource deep-link', async ({ page }) => {
  expect(resourceIds.length).toBeGreaterThan(0)
  // First, middle, last, and every id that needs URL-encoding (spaces, brackets: P6 found those had no file).
  const pick = [...new Set([resourceIds[0], resourceIds[Math.floor(resourceIds.length / 2)], resourceIds.at(-1),
    ...resourceIds.filter((id) => encodeURIComponent(id) !== id)])]
  for (const id of pick) {
    const res = await go(page, `/pramaan/resource-centre/${encodeURIComponent(id)}`)
    expect(res.status(), id).toBe(200)
    await expect(page.locator('main h1')).not.toHaveText(/no resource/i)
  }
})

test.describe('forwarding addresses keep the query string', () => {
  for (const [from, to] of [
    ['/pramaan-library?type=kit', '/pramaan/resource-centre?type=kit'],
    ['/pramaan-library/W1?x=1', '/pramaan/resource-centre/W1?x=1'],
    ['/about/publications?type=book&page=2', '/tide/publications?type=book&page=2'],
  ]) {
    test(from, async ({ page, site }) => {
      site.allow(/status of 404/) // /pramaan-library/W1 has no file: GitHub Pages answers 404.html, the app forwards
      await go(page, from)
      // A path that is also a folder (pramaan/resource-centre/ holds the resource pages) may come back
      // with a trailing slash: serve-pages.mjs redirects folder-first; what GitHub Pages does is not
      // verified (AGENTS.md §11). The query string must survive either way.
      await expect.poll(() => sitePath(page).replace(/\/\?/, '?')).toBe(to)
    })
  }
})

test('the old /?/path links still restore the address', async ({ page }) => {
  await go(page, '/?/about/why-tide&x=1')
  await expect.poll(() => sitePath(page)).toBe('/about/why-tide?x=1')
  await expect(page.locator('main h1')).toBeVisible()
})

test.describe('removed routes answer 404 with the Not Found page', () => {
  for (const path of [...REMOVED, '/this-route-does-not-exist']) {
    test(path, async ({ page, site }) => {
      site.allow(/status of 404|404 \(Not Found\)/)
      const res = await go(page, path)
      expect(res.status()).toBe(404)
      await expect(page.locator('main h1')).toHaveCount(1)
      // The 404 page links home (its text comes from not-found.yaml, so match the address only).
      await expect(page.locator('main a[href="/tide-testing/"]').first()).toBeVisible()
      expect(sitePath(page)).toBe(path)
    })
  }
})
