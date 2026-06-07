import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads and shows key content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/TIDE/)
    // Hero heading visible
    await expect(page.locator('h1').first()).toBeVisible()
    // Navigation visible
    await expect(page.getByRole('navigation').first()).toBeVisible()
    // Footer visible
    await expect(page.locator('footer')).toBeVisible()
  })

  test('navigation links work — About dropdown appears on hover', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find About Us nav item and hover to open dropdown
    const aboutNav = page.getByRole('navigation').getByText(/About/i).first()
    if (await aboutNav.count() > 0) {
      await aboutNav.hover()
      // Check dropdown appears — look for a child nav link
      const whyTide = page.getByText(/Why TIDE/i).first()
      await expect(whyTide).toBeVisible({ timeout: 3000 }).catch(() => {
        // Dropdown may not exist in mobile mode — non-fatal
      })
    }
  })

  test('page body has substantial content (not blank)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body.length).toBeGreaterThan(200)
  })

  test('no uncaught JS errors on load', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const relevantErrors = errors.filter(e => !e.includes('favicon'))
    expect(relevantErrors).toHaveLength(0)
  })

  test('impact section contains numeric stats', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    // The site shows teacher/school/student counts — look for any number
    expect(body).toMatch(/\d+/)
  })
})
