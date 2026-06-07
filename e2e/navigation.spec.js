import { test, expect } from '@playwright/test'

const routes = [
  { path: '/',                   title: 'TIDE' },
  { path: '/about/why-tide',     title: 'TIDE' },
  { path: '/about/past-programs', title: 'TIDE' },
  { path: '/about/our-team',     title: 'TIDE' },
  { path: '/about/our-partners', title: 'TIDE' },
  { path: '/education-for-harmony', title: 'TIDE' },
  { path: '/pramaan',            title: 'TIDE' },
  { path: '/thrive',             title: 'TIDE' },
  { path: '/contact',            title: 'TIDE' },
  { path: '/get-involved/volunteer', title: 'TIDE' },
  { path: '/get-involved/donate',    title: 'TIDE' },
]

routes.forEach(({ path, title }) => {
  test(`${path} loads without JS error`, async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')

    // No JS errors
    const relevantErrors = errors.filter(e => !e.includes('favicon'))
    expect(relevantErrors).toHaveLength(0)

    // Title contains TIDE
    await expect(page).toHaveTitle(new RegExp(title))

    // Page has content
    const body = await page.textContent('body')
    expect(body.length).toBeGreaterThan(100)
  })
})

test('navigating between pages does not cause errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  await page.goto('/about/why-tide')
  await page.waitForLoadState('domcontentloaded')

  await page.goto('/contact')
  await page.waitForLoadState('domcontentloaded')

  const relevantErrors = errors.filter(e => !e.includes('favicon'))
  expect(relevantErrors).toHaveLength(0)
})
