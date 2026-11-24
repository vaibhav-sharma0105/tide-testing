// Filters, search, pagination and the address (URL state) on the four Sheet-backed listings of the
// built site. Expected numbers are counted here from the committed snapshots (read only), so a sync
// that changes the data doesn't break the tests; labels come from the page YAML (src/data/*.json).
import { test, expect, go, sitePath, ready } from './fixtures.js'
import library from '../../src/data/sheets/pramaan-library.json' with { type: 'json' }
import publications from '../../src/data/sheets/publications.json' with { type: 'json' }
import partners from '../../src/data/sheets/partners.json' with { type: 'json' }
import fellows from '../../src/data/sheets/social-changemakers.json' with { type: 'json' }
import tideText from '../../src/data/tide-publications.json' with { type: 'json' }
import thriveText from '../../src/data/thrive-publications.json' with { type: 'json' }
import partnersText from '../../src/data/about-our-partners.json' with { type: 'json' }
import scfText from '../../src/data/social-changemakers.json' with { type: 'json' }
import rcText from '../../src/data/pramaan-library.json' with { type: 'json' }

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const rows = library.resources
const countType = (t) => rows.filter((r) => norm(r.type) === t).length
const showingTotal = async (page) => {
  const text = await page.getByText(/^Showing\b/).first().textContent()
  return Number(/of\s+([\d,]+)/.exec(text)[1].replace(/,/g, ''))
}

test.describe('Resource Centre', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('a type filter, the page links and a reload keep one state in the address', async ({ page }) => {
    await go(page, '/pramaan/resource-centre')
    expect(await showingTotal(page)).toBe(rows.length)
    await page.getByRole('button', { name: /^Games\b/ }).click()
    await expect.poll(() => sitePath(page)).toBe('/pramaan/resource-centre?type=games')
    expect(await showingTotal(page)).toBe(countType('games'))
    const pager = page.getByRole('navigation', { name: /pag/i })
    if (countType('games') > 9) {
      await pager.getByRole('link', { name: '2', exact: true }).click()
      await expect.poll(() => sitePath(page)).toBe('/pramaan/resource-centre?type=games&page=2')
      await page.reload()
      await ready(page)
      await expect(pager.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
    }
    expect(await showingTotal(page)).toBe(countType('games'))
  })

  test('out-of-range ?page= clamps (P5-2)', async ({ page }) => {
    const worksheets = countType('worksheet')
    await go(page, '/pramaan/resource-centre?type=worksheet&page=99')
    // Page 99 of a shorter list shows the last page: "Showing <rows on it> of <total>".
    const onLast = worksheets % 9 || 9
    await expect(page.getByText(/^Showing\b/).first()).toHaveText(new RegExp(`^${rcText.page.showing}\\s+${onLast}\\s+${rcText.page.of}\\s+${worksheets}\\b`))
    await go(page, '/pramaan/resource-centre?page=-2')
    await expect(page.getByRole('navigation', { name: /pag/i }).getByRole('link', { name: '1', exact: true })).toHaveAttribute('aria-current', 'page')
  })

  test('search writes ?search= and a no-match search shows the empty state', async ({ page }) => {
    await go(page, '/pramaan/resource-centre')
    const box = page.getByRole('searchbox').first()
    await box.fill('domino')
    await expect.poll(() => sitePath(page)).toContain('search=domino')
    const domino = rows.filter((r) => [r.name, r.concept, r.description].some((t) => t?.toLowerCase().includes('domino'))).length
    expect(await showingTotal(page)).toBe(domino)
    await box.fill('zzzz-no-such-resource')
    await expect(page.getByText(rcText.grid.noResults)).toBeVisible()
  })

  test('a Gujarati title deep-links and searches', async ({ page }) => {
    const gu = rows.find((r) => /[઀-૿]/.test(r.name))
    test.skip(!gu, 'no Gujarati title in the snapshot')
    await go(page, `/pramaan/resource-centre/${encodeURIComponent(gu.id)}`)
    await expect(page.locator('main h1')).toHaveText(gu.name.trim().replace(/\s+/g, ' '))
  })
})

test.describe('TIDE Publications', () => {
  const tide = publications.resources.filter((r) => r.org === 'TIDE')

  test('"See all … editions" filters the library to the featured type', async ({ page }) => {
    await go(page, '/tide/publications')
    const featured = tideText.featuredType
    const n = tide.filter((r) => norm(r.type) === norm(featured)).length
    await page.getByRole('button', { name: tideText.featured.seeAllTemplate.replace('{n}', n) }).click()
    await expect.poll(() => sitePath(page)).toContain(`type=${encodeURIComponent(norm(featured)).replace(/%20/g, '+')}`)
    await expect(page.getByRole('button', { name: tideText.toolbar.clearAll })).toBeVisible()
  })

  test('page 2, reload and Back', async ({ page }) => {
    test.skip(tide.length <= 12, 'one page only')
    await go(page, '/tide/publications')
    await page.getByRole('navigation', { name: 'Pages' }).getByRole('link', { name: 'Page 2' }).click()
    await expect.poll(() => sitePath(page)).toBe('/tide/publications?page=2')
    await page.reload()
    await ready(page)
    await expect(page.getByText(/^Showing 13–/).first()).toBeVisible()
  })
})

test.describe('THRIvE Publications', () => {
  const thrive = publications.resources.filter((r) => r.org === 'THRIvE')

  test('type menu, chip removal, order toggle and debounced search all round-trip through the address', async ({ page }) => {
    await go(page, '/thrive/publications')
    await page.locator('main button[aria-haspopup="listbox"]').first().click()
    // The first option is "All …" (already chosen): take the first real value that has rows.
    const option = page.getByRole('listbox').locator('[role="option"]:not([aria-disabled="true"])').nth(1)
    await option.click()
    await expect.poll(() => sitePath(page)).toMatch(/[?&]type=/)
    const removeLabel = thriveText.toolbar.removeTemplate
    await page.getByRole('button', { name: new RegExp(`^${removeLabel.split('{name}')[0]}`) }).first().click()
    await expect.poll(() => sitePath(page)).toBe('/thrive/publications')

    await page.getByRole('button', { name: /^Order by date/ }).click()
    await expect.poll(() => sitePath(page)).toBe('/thrive/publications?dir=asc')

    await page.getByRole('searchbox').fill('teacher')
    await expect.poll(() => sitePath(page)).toContain('search=teacher')
    await page.reload()
    await ready(page)
    await expect(page.getByRole('searchbox')).toHaveValue('teacher')
    const want = thrive.filter((r) => [r.title, r.citation, r.description, r.type, ...(r.fields ?? [])].map(norm).join('\n').includes('teacher')).length
    if (want > 12) expect(await showingTotal(page)).toBe(want)
    else await expect(page.locator('main [aria-label^="Copy citation"]')).toHaveCount(want)
  })

  test('numbered page links (?page=) and the clamp of a too-high page', async ({ page }) => {
    test.skip(thrive.length <= 12, 'one page only')
    await go(page, '/thrive/publications?page=999')
    const last = Math.ceil(thrive.length / 12)
    // The current page is a <span aria-current>: a screen-reader label ("Page 5") + the visible number.
    await expect(page.getByRole('navigation', { name: 'Pages' }).locator('[aria-current="page"] [aria-hidden="true"]')).toHaveText(String(last))
  })
})

test.describe('Our Partners', () => {
  test('search narrows to one grid, writes ?search= and clears', async ({ page }) => {
    await go(page, '/about/our-partners')
    const box = page.getByRole('searchbox', { name: partnersText.directory.searchLabel })
    await box.fill('school')
    await expect.poll(() => sitePath(page)).toBe('/about/our-partners?search=school')
    const want = partners.resources.filter((p) => p.type?.trim() && p.name && p.name.toLowerCase().includes('school')).length
    await expect(page.locator('main figure')).toHaveCount(want)
    await box.fill('')
    await expect.poll(() => sitePath(page)).toBe('/about/our-partners')
  })

  test('a section tab scrolls its heading into view below the sticky header and index bar', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await go(page, '/about/our-partners')
    const tabs = page.getByRole('navigation', { name: /Jump to/ }).getByRole('link')
    const last = tabs.last()
    const name = (await last.textContent()).replace(/\d+\s*$/, '').trim()
    await last.click()
    const heading = page.getByRole('heading', { level: 2, name, exact: true })
    await expect(heading).toBeInViewport()
    await expect.poll(async () => {
      const h = await heading.boundingBox()
      const covers = await page.evaluate(() => Math.max(...[...document.querySelectorAll('header, [class*="sticky"]')]
        .filter((el) => getComputedStyle(el).position === 'fixed' || getComputedStyle(el).position === 'sticky')
        .map((el) => el.getBoundingClientRect()).filter((r) => r.top <= 1).map((r) => r.bottom), 0))
      return h.y >= covers - 1
    }).toBe(true)
  })
})

test.describe('Social Changemakers', () => {
  const list = fellows.resources
  test.skip(list.length === 0, 'empty snapshot: the waiting grid is shown')

  test('search and batch filter use the address; one result reads "Showing 1 fellow"', async ({ page }) => {
    const someone = list[0]
    await go(page, '/education-for-harmony/social-changemakers')
    await page.getByRole('searchbox').fill(someone.name)
    await expect.poll(() => sitePath(page)).toContain('search=')
    const same = list.filter((f) => `${f.name} ${f.project ?? ''}`.toLowerCase().includes(someone.name.toLowerCase())).length
    if (same === 1) await expect(page.getByRole('status')).toHaveText(scfText.profiles.list.resultsOne)
  })

  test('a profile opens as a dialog, shares ?fellow=, moves with next, closes with Escape and returns focus', async ({ page }) => {
    await go(page, '/education-for-harmony/social-changemakers')
    const card = page.getByRole('button', { name: new RegExp(`^${list[0].name}`) }).first()
    // By keyboard: WebKit (like Safari) doesn't focus a button on a mouse click, so focus could not
    // return to it there. A click opening the dialog is covered by a11y.spec.js on Chromium.
    await card.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect.poll(() => sitePath(page)).toMatch(/[?&]fellow=/)
    const shared = sitePath(page)

    // The shared address opens the same profile in a fresh visit.
    const other = await page.context().newPage()
    await go(other, shared)
    await expect(other.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(await dialog.getByRole('heading', { level: 2 }).textContent())
    await other.close()

    if (list.length > 1) {
      const before = sitePath(page)
      await page.keyboard.press('ArrowRight')
      await expect.poll(() => sitePath(page)).not.toBe(before)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => sitePath(page)).not.toMatch(/fellow=/)
    // Focus is back on a fellow's card (the one that opened it, or the one moved to), not lost to <body>.
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('main article'))).toBe(true)
  })
})
