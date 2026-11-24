// Accessibility regression suite (audit P2, 2026-11-24).
// - axe on every route and on the interactive states (open dialogs, menus, filters): WCAG 2.x A/AA
//   must have zero violations; AAA and best-practice results are reported as annotations, not failures.
// - keyboard: skip link, focus after a page change, each dialog (focus in, Tab stays in, Escape,
//   focus back on the trigger), the header dropdown, no sideways scrolling at 320 px.
import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

const AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const ROUTES = [
  '/', '/about/why-tide', '/about/past-programs', '/about/our-team', '/about/our-partners',
  '/tide/publications', '/education-for-harmony', '/education-for-harmony/mccx',
  '/education-for-harmony/social-changemakers', '/pramaan', '/pramaan/resource-centre',
  '/pramaan/resource-centre/W1', '/pramaan/contribute', '/get-involved/volunteer',
  '/get-involved/donate', '/thrive', '/thrive/publications', '/contact', '/coming-soon',
  '/this-route-does-not-exist-404-check',
]

// Scroll through so every scroll reveal has run, then let them settle (a mid-fade colour is not the
// resting one; see scripts/a11y-audit.cjs).
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1200)
}

// [data-a11y-decorative] = text that is pure decoration and aria-hidden (WCAG 1.4.3 "incidental"),
// e.g. the big faint "01"–"04" on /thrive. Keep this list short and explained where it is used.
const axe = (page) => new AxeBuilder({ page }).exclude('[data-a11y-decorative]')

async function expectNoAA(page, testInfo) {
  const aa = await axe(page).withTags(AA).analyze()
  const extra = await axe(page).withTags(['wcag2aaa', 'best-practice']).analyze()
  const aaaIds = extra.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
  if (aaaIds) testInfo.annotations.push({ type: 'AAA / best practice (report only)', description: aaaIds })
  const summary = aa.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
  expect(summary, 'WCAG A/AA violations').toEqual([])
}

test.describe('axe: WCAG A/AA on every route', () => {
  for (const route of ROUTES) {
    test(route, async ({ page }, testInfo) => {
      await page.goto(route)
      await settle(page)
      await expectNoAA(page, testInfo)
    })
  }
})

test.describe('axe: interactive states', () => {
  test('header dropdown open', async ({ page }, testInfo) => {
    await page.goto('/about/our-team')
    await page.waitForTimeout(1000)   // the header's own entrance has to finish, or axe reads a mid-fade colour
    // (a mouse click would hover first, which already opens it, and then toggle it shut)
    await page.locator('header nav button[aria-controls="dropdown-0"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#dropdown-0')).toBeVisible()
    await expectNoAA(page, testInfo)
  })

  test('mobile menu open', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('header button[aria-expanded]').last().click()
    await page.waitForTimeout(500)
    await expectNoAA(page, testInfo)
  })

  test('fellow profile dialog', async ({ page }, testInfo) => {
    await page.goto('/education-for-harmony/social-changemakers')
    await page.locator('main article button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(600)
    await expectNoAA(page, testInfo)
  })

  test('photo lightbox and promo video', async ({ page }, testInfo) => {
    await page.goto('/pramaan')
    // the photo strip drifts, so open a photo with the keyboard rather than a click
    await page.locator('main [aria-haspopup="dialog"]').nth(1).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(600)
    await expectNoAA(page, testInfo)
    await page.keyboard.press('Escape')
    await page.locator('main button[aria-haspopup="dialog"][aria-label]').first().focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(600)
    await expectNoAA(page, testInfo)
  })

  test('publications filter menu open and a filter applied', async ({ page }, testInfo) => {
    await page.goto('/thrive/publications')
    await page.locator('main button[aria-haspopup="listbox"]').first().click()
    await expect(page.getByRole('listbox').first()).toBeVisible()
    await expectNoAA(page, testInfo)
    await page.getByRole('listbox').first().getByRole('option').first().click()
    await page.waitForTimeout(400)
    await expectNoAA(page, testInfo)
  })

  test('resource centre filter drawer (phone)', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/pramaan/resource-centre')
    await page.locator('main button.order-2').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(500)
    await expectNoAA(page, testInfo)
  })

  test('partners search with results', async ({ page }, testInfo) => {
    await page.goto('/about/our-partners?search=school')
    await settle(page)
    await expectNoAA(page, testInfo)
  })
})

// ---- Keyboard ---------------------------------------------------------------------------------

const active = (page) => page.evaluate(() => {
  const a = document.activeElement
  return { tag: a?.tagName, name: (a?.getAttribute('aria-label') || a?.textContent || '').trim(), inDialog: !!a?.closest('[role="dialog"]') }
})

async function dialogFlow(page, trigger) {
  await trigger.focus()
  const before = await active(page)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(500)
  expect((await active(page)).inDialog, 'focus moves into the dialog').toBe(true)
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Tab')
    expect((await active(page)).inDialog, `Tab ${i + 1} stays in the dialog`).toBe(true)
  }
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Shift+Tab')
    expect((await active(page)).inDialog, `Shift+Tab ${i + 1} stays in the dialog`).toBe(true)
  }
  // Escape is heard by the page only while focus is outside a cross-origin player, so go to Close first.
  await page.getByRole('dialog').getByRole('button').first().focus()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await active(page)).name, 'focus returns to the trigger').toBe(before.name)
}

test.describe('keyboard', () => {
  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/about/why-tide')
    await page.keyboard.press('Tab')
    expect((await active(page)).tag).toBe('A')
    await page.keyboard.press('Enter')
    expect((await active(page)).tag).toBe('MAIN')
  })

  test('after a page change focus is on the new page heading; not on the first page', async ({ page }) => {
    await page.goto('/')
    expect((await active(page)).tag).toBe('BODY')
    await page.locator('header a[href="/contact"]').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/contact$/)
    await expect.poll(async () => (await active(page)).tag).toBe('H1')
  })

  test('photo lightbox', async ({ page }) => {
    await page.goto('/pramaan')
    await dialogFlow(page, page.locator('main [aria-haspopup="dialog"]').nth(1))
  })

  test('video lightbox (focus cannot leave through the player iframe)', async ({ page }) => {
    await page.goto('/pramaan')
    await dialogFlow(page, page.locator('main button[aria-haspopup="dialog"][aria-label]').first())
  })

  test('fellow profile', async ({ page }) => {
    await page.goto('/education-for-harmony/social-changemakers')
    await dialogFlow(page, page.locator('main article button').first())
  })

  test('resource centre filter drawer (phone)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/pramaan/resource-centre')
    await dialogFlow(page, page.locator('main button.order-2'))
  })

  test('header dropdown: Enter opens, the current page is marked, Escape closes and returns focus', async ({ page }) => {
    await page.goto('/about/our-team')
    const trigger = page.locator('header nav button[aria-controls="dropdown-0"]')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#dropdown-0 a[aria-current="page"]')).toHaveAttribute('href', '/about/our-team')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement.closest('#dropdown-0'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('no sideways scrolling at 320 px (WCAG 1.4.10)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    for (const route of ROUTES) {
      await page.goto(route)
      await page.waitForTimeout(300)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(over, route).toBeLessThanOrEqual(0)
    }
  })
})
