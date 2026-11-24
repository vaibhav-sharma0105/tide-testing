// Robustness checks on the built site: a page file that fails to load (stale deploy / offline),
// "reduce motion", forced colours (Windows high contrast) and 200 % zoom.
import { test, expect, go, sitePath, ready } from './fixtures.js'
import site from '../../src/data/site.json' with { type: 'json' }
import nav from '../../src/data/navigation.json' with { type: 'json' }
import errorText from '../../src/data/error.json' with { type: 'json' }

const contactLink = (page) => page.locator('header nav a[href="/tide-testing/contact"]').first()

test.describe('lazy page files (src/utils/reloadOnStaleChunk.js)', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('a page file gone after a deploy: the app reloads once and the page opens', async ({ page, site: s }) => {
    // The simulated failure itself (the browsers word it differently).
    s.allow(/Contact-[\w-]+\.js|net::ERR_FAILED|Failed to load resource|dynamically imported module|Importing a module script failed/)
    await go(page, '/')
    let requests = 0
    await page.route(/\/assets\/Contact-[\w-]+\.js$/, (route) => (requests++ === 0 ? route.abort('failed') : route.continue()))
    const reloaded = page.waitForEvent('load')
    await contactLink(page).click()
    await reloaded // the automatic reload (the old page's heading would satisfy ready() before it)
    await ready(page)
    expect(sitePath(page)).toBe('/contact')
    // The failed request, then (Chromium/Firefox) the request after the reload. WebKit loaded the file
    // after the reload without it passing through the route again (seen in P6), so ≥ 1 there.
    expect(requests).toBeGreaterThanOrEqual(1)
    await expect(page.locator('main h1')).toBeVisible()
  })

  test('a page file that keeps failing (offline): the error shows inside the page, header kept', async ({ page, site: s }) => {
    s.allow(/./) // the failure and the error boundary's log are the point of this test
    await go(page, '/')
    await page.route(/\/assets\/Contact-[\w-]+\.js$/, (route) => route.abort('internetdisconnected'))
    await contactLink(page).click()
    await expect(page.locator('main').getByText(errorText.heading)).toBeVisible()
    await expect(page.getByRole('navigation', { name: nav.ariaMain })).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })
})

test('reduce motion: the headline figure is final at once and nothing waits on the first screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await go(page, '/')
  await expect(page.locator('main').getByText(site.livesImpacted).first()).toBeVisible()
  const opacity = await page.locator('main h1').evaluate((el) => getComputedStyle(el).opacity)
  expect(opacity).toBe('1')
})

test('forced colours: pages render and the keyboard focus stays visible', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors emulation is Chromium-only')
  await page.emulateMedia({ forcedColors: 'active' })
  for (const path of ['/', '/pramaan/resource-centre', '/about/our-partners']) {
    await go(page, path)
    await expect(page.locator('main h1')).toBeVisible()
  }
  await page.keyboard.press('Tab')
  const outline = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}` })
  expect(outline).not.toMatch(/^none|\s0px$/)
})

test.describe('200 % zoom (1366 px screen → 683 CSS px)', () => {
  test.use({ viewport: { width: 683, height: 384 } })
  for (const path of ['/', '/tide/publications', '/education-for-harmony/social-changemakers']) {
    test(path, async ({ page }) => {
      await go(page, path)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(over).toBeLessThanOrEqual(0)
      await expect(page.getByRole('button', { name: nav.menuToggleLabel })).toBeVisible()
    })
  }
})
