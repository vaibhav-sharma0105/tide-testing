// The header menus on the built site: the 3-level desktop menu (About Us → Our Publications → …),
// the THRIvE dropdown, the phone menu, and the Resource Centre menu link clearing filters (P5-1).
// Labels come from content/shared/navigation.yaml (read here, never typed).
import { test, expect, go, sitePath, ready } from './fixtures.js'
import nav from '../../src/data/navigation.json' with { type: 'json' }

const top = (label) => nav.items.find((i) => i.label === label)
const about = top('About Us')
const pubs = about.children.find((c) => c.subItems)
const [tidePubs, thrivePubs] = pubs.subItems
const pramaan = nav.items.find((i) => i.children?.some((c) => c.to === '/pramaan/resource-centre'))
const rcLink = pramaan.children.find((c) => c.to === '/pramaan/resource-centre')
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test.describe('desktop menu (1366 px)', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('About Us → Our Publications → TIDE Publications, by mouse', async ({ page }) => {
    await go(page, '/')
    const desktop = page.getByRole('navigation', { name: nav.ariaMain })
    // The dropdown and the nested group open on hover (a click after the hover would toggle it shut
    // again). The mouse starts from outside the header each try, and the hover is re-tried until the
    // menu shows (under load a hover sometimes landed while the dropdown was re-rendering).
    const group = page.getByRole('button', { name: new RegExp(`^${esc(pubs.label)}`) })
    const openGroup = () => expect(async () => {
      await page.mouse.move(683, 600)
      await desktop.getByRole('button', { name: about.label }).hover()
      await group.hover({ force: true, timeout: 2000 }) // no scroll-into-view / stability wait: a mouse just moves there
      await expect(group).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 })
    }).toPass({ timeout: 20_000 })
    await openGroup()
    await page.getByRole('menuitem', { name: new RegExp(`^${esc(tidePubs.label)}`) }).click()
    await expect.poll(() => sitePath(page)).toBe(tidePubs.to)
    await ready(page)
    // The new page is marked as current inside the menu.
    await openGroup()
    await expect(page.getByRole('menuitem', { name: new RegExp(`^${esc(tidePubs.label)}`) })).toHaveAttribute('aria-current', 'page')
  })

  test('the same path by keyboard only', async ({ page }) => {
    await go(page, '/')
    const trigger = page.getByRole('navigation', { name: nav.ariaMain }).getByRole('button', { name: about.label })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const group = page.getByRole('button', { name: new RegExp(`^${esc(pubs.label)}`) })
    await group.focus()
    await page.keyboard.press('Enter')
    await expect(group).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: new RegExp(`^${esc(thrivePubs.label)}`) })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect.poll(() => sitePath(page)).toBe(thrivePubs.to)
  })

  test('every top-level dropdown opens and each of its links is a live page', async ({ page }) => {
    await go(page, '/')
    const desktop = page.getByRole('navigation', { name: nav.ariaMain })
    for (const item of nav.items.filter((i) => i.children)) {
      await desktop.getByRole('button', { name: item.label, exact: true }).hover()
      for (const child of item.children.filter((c) => c.to)) {
        await expect(page.locator(`header a[href="/tide-testing${child.to}"]`).first()).toBeVisible()
      }
    }
  })

  test('the Resource Centre menu link clears the filters (P5-1)', async ({ page }) => {
    await go(page, '/pramaan/resource-centre?type=games&page=2')
    await expect(page.getByText(/^Showing/).first()).toBeVisible()
    const desktop = page.getByRole('navigation', { name: nav.ariaMain })
    await desktop.getByRole('button', { name: pramaan.label, exact: true }).hover()
    await page.locator(`header a[href="/tide-testing${rcLink.to}"]`).first().click()
    await expect.poll(() => sitePath(page)).toBe(rcLink.to)
    await expect(page.getByRole('button', { name: /^All types/ })).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('phone menu (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('opens, expands the nested group, navigates and closes', async ({ page }) => {
    await go(page, '/')
    const toggle = page.getByRole('button', { name: nav.menuToggleLabel })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const menu = page.locator('#mobile-menu')
    await menu.getByRole('button', { name: about.label, exact: true }).click()
    await menu.getByRole('button', { name: pubs.label, exact: true }).click()
    await menu.getByRole('link', { name: thrivePubs.label, exact: true }).click()
    await expect.poll(() => sitePath(page)).toBe(thrivePubs.to)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await ready(page)
  })
})
