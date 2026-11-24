// Responsive matrix on the built site: every primary route at phone, tablet, laptop and desktop sizes.
// Checks per page: no sideways scrolling, the header and its menu work, the fixed header doesn't cover
// the page heading, no image is stretched out of its shape, no heading or button text overflows its
// box, and controls are at least 24 × 24 px (WCAG 2.5.8 AA; under 44 px is reported, not failed —
// the 44 px AAA size is an open owner decision, ledger P2).
//
// Four sizes run on every CI build; the full matrix carries @matrix (nightly / --grep @matrix).
import { test, expect, go } from './fixtures.js'
import { PRIMARY_ROUTES } from '../../src/config/siteRoutes.js'
import nav from '../../src/data/navigation.json' with { type: 'json' }

const MUST = new Set(['320x640', '390x844', '768x1024', '1366x768'])
const VIEWPORTS = [
  [320, 640], [360, 740], [375, 667], [390, 844], [414, 896], [768, 1024], [820, 1180], [1024, 768],
  [1280, 800], [1366, 768], [1440, 900], [1920, 1080],
  [844, 390], // phone, landscape
  [1180, 820], // tablet, landscape
]
const DESKTOP_NAV = 1024 // Tailwind lg: the header shows the full menu from here (Header.jsx `hidden lg:flex`)

for (const [width, height] of VIEWPORTS) {
  const key = `${width}x${height}`
  const tag = MUST.has(key) ? '' : ' @matrix'
  test.describe(`${key}${tag}`, () => {
    test.use({ viewport: { width, height }, hasTouch: width < DESKTOP_NAV })

    for (const { path } of PRIMARY_ROUTES) {
      test(path, async ({ page }, testInfo) => {
        await go(page, path)
        const r = await page.evaluate(() => {
          const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 2 && b.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 }
          const header = document.querySelector('header')
          const h1 = document.querySelector('main h1')
          const stretched = [...document.querySelectorAll('main img')].filter((img) => {
            if (!img.complete || !img.naturalWidth || !vis(img)) return false
            if (getComputedStyle(img).objectFit !== 'fill') return false
            const b = img.getBoundingClientRect()
            return Math.abs(b.width / b.height - img.naturalWidth / img.naturalHeight) / (img.naturalWidth / img.naturalHeight) > 0.03
          }).map((img) => img.currentSrc.split('/').pop())
          const overflowing = [...document.querySelectorAll('main h1, main h2, main h3, main button, header button, header a')]
            // Headings: content wider than the box is cut by some ancestor even when the heading itself
            // doesn't clip (found 2026-11-24: the home headline at 320 px). Controls: only when they clip.
            .filter((el) => vis(el) && el.scrollWidth > el.clientWidth + 1 && (/^H[1-3]$/.test(el.tagName) || getComputedStyle(el).overflowX !== 'visible'))
            .map((el) => `${el.tagName} "${el.textContent.trim().slice(0, 40)}"`)
          const controls = [...document.querySelectorAll('button, input, select, [role="button"], [role="tab"], [role="option"]')]
            .filter((el) => vis(el) && !el.closest('[aria-hidden="true"], [hidden]'))
            .map((el) => ({ el, b: el.getBoundingClientRect() }))
            .filter(({ b }) => b.bottom > 0 && b.top < innerHeight * 3)
          const tiny = controls.filter(({ b }) => b.width < 24 || b.height < 24)
            .map(({ el, b }) => `${el.tagName}[${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30)}] ${Math.round(b.width)}×${Math.round(b.height)}`)
          const under44 = controls.filter(({ b }) => b.width < 44 || b.height < 44).length
          return {
            over: document.documentElement.scrollWidth - innerWidth,
            headerBottom: header?.getBoundingClientRect().bottom ?? 0,
            h1Top: h1?.getBoundingClientRect().top ?? -1,
            stretched, overflowing, tiny, under44,
          }
        })
        if (r.under44) testInfo.annotations.push({ type: 'controls under 44 px (AAA, owner item)', description: String(r.under44) })

        expect(r.over, 'no sideways scrolling').toBeLessThanOrEqual(0)
        expect(r.h1Top, 'the page heading starts below the fixed header').toBeGreaterThanOrEqual(r.headerBottom - 1)
        expect(r.stretched, 'images keep their shape').toEqual([])
        expect(r.overflowing, 'text fits its box').toEqual([])
        expect(r.tiny, 'controls at least 24 × 24 px (WCAG 2.5.8)').toEqual([])

        // Decided by the browser's own media query, not the window width: with a classic (Windows)
        // scrollbar WebKit's layout width at 1024 is 1009 px, so the phone menu there is correct.
        if (await page.evaluate((w) => matchMedia(`(min-width: ${w}px)`).matches, DESKTOP_NAV)) {
          await expect(page.getByRole('navigation', { name: nav.ariaMain })).toBeVisible()
        } else {
          const toggle = page.getByRole('button', { name: nav.menuToggleLabel })
          await expect(toggle).toBeVisible()
          if (path === '/') {
            await toggle.click()
            const menu = page.locator('#mobile-menu')
            await expect(menu).toBeVisible()
            // The open menu fits the screen and can reach its last entry.
            const last = menu.getByRole('link').last()
            await last.scrollIntoViewIfNeeded()
            await expect(last).toBeInViewport()
          }
        }
      })
    }
  })
}
