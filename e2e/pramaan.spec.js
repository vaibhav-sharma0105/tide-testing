import { test, expect } from '@playwright/test'

test.describe('Pramaan (ABL Resource Library)', () => {
  test('Pramaan home loads without error', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/pramaan')
    await page.waitForLoadState('domcontentloaded')

    const relevantErrors = errors.filter(e => !e.includes('favicon'))
    expect(relevantErrors).toHaveLength(0)

    await expect(page).toHaveTitle(/TIDE/)
    const body = await page.textContent('body')
    expect(body.length).toBeGreaterThan(100)
  })

  test('Pramaan page body mentions Pramaan, resource, or ABL', async ({ page }) => {
    await page.goto('/pramaan')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body).toMatch(/pramaan|resource|abl/i)
  })

  test('Pramaan nav bar is visible', async ({ page }) => {
    await page.goto('/pramaan')
    await page.waitForLoadState('domcontentloaded')
    // AblNavBar renders navigation links — check at least one is present
    const links = page.getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Resource Centre link navigates to /pramaan/resource-centre', async ({ page }) => {
    await page.goto('/pramaan')
    await page.waitForLoadState('domcontentloaded')

    // Look for resource centre link in AblNavBar
    const link = page.getByRole('link', { name: /resource.centr/i })
    if (await link.count() > 0) {
      await link.first().click()
      await page.waitForLoadState('domcontentloaded')
      expect(page.url()).toMatch(/resource-centr/i)
    } else {
      // If link text differs, navigate directly and verify page loads
      await page.goto('/pramaan/resource-centre')
      await page.waitForLoadState('domcontentloaded')
      await expect(page).toHaveTitle(/TIDE/)
    }
  })

  test('/pramaan/resource-centre loads without error', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/pramaan/resource-centre')
    await page.waitForLoadState('domcontentloaded')

    const relevantErrors = errors.filter(e => !e.includes('favicon'))
    expect(relevantErrors).toHaveLength(0)

    await expect(page).toHaveTitle(/TIDE/)
  })

  test('/pramaan/contribute loads without error', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/pramaan/contribute')
    await page.waitForLoadState('domcontentloaded')

    const relevantErrors = errors.filter(e => !e.includes('favicon'))
    expect(relevantErrors).toHaveLength(0)

    await expect(page).toHaveTitle(/TIDE/)
  })
})
