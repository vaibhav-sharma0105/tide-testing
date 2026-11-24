// Screenshot baselines for a small, stable set (audit P6): header, footer, one banner per page
// family and one card of each kind. How to run and update them: e2e/visual/README.md.
// Stability: reduced motion + Playwright's `animations: 'disabled'`, fonts from other hosts stubbed
// (system fallbacks, the same on every run), fixed 1366×768 viewport, fades waited out. Cards are
// picked by a fixed id from the committed snapshot, so only an edit of THAT row changes them.
import { test, expect, go, still } from '../site/fixtures.js'
import library from '../../src/data/sheets/pramaan-library.json' with { type: 'json' }
import partners from '../../src/data/sheets/partners.json' with { type: 'json' }
import fellows from '../../src/data/sheets/social-changemakers.json' with { type: 'json' }

test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
const shot = { animations: 'disabled', maxDiffPixelRatio: 0.01 }

async function prepare(page, path) {
  await go(page, path)
  await page.evaluate(() => document.fonts.ready)
  await still(page, 'body')
}

test('header', async ({ page }) => {
  await prepare(page, '/about/why-tide')
  await expect(page.locator('header').first()).toHaveScreenshot('header.png', shot)
})

test('footer', async ({ page }) => {
  await prepare(page, '/about/why-tide')
  const footer = page.locator('footer')
  await footer.scrollIntoViewIfNeeded()
  await still(page, 'footer')
  await expect(footer).toHaveScreenshot('footer.png', shot)
})

for (const [name, path] of [
  ['hero-home', '/'],
  ['hero-inner', '/about/why-tide'],
  ['hero-pramaan', '/pramaan'],
  ['hero-publications', '/thrive/publications'],
]) {
  test(name, async ({ page }) => {
    await prepare(page, path)
    await expect(page).toHaveScreenshot(`${name}.png`, shot)
  })
}

test('card: Resource Centre', async ({ page }) => {
  const row = library.resources.find((r) => r.id === 'W1')
  test.skip(!row, 'W1 is no longer in the snapshot: pick another fixed id')
  await prepare(page, `/pramaan/resource-centre?search=${encodeURIComponent(row.name)}`)
  const card = page.locator('main a[href$="/pramaan/resource-centre/W1"]').first()
  await card.scrollIntoViewIfNeeded()
  await still(page, 'main')
  await expect(card).toHaveScreenshot('card-resource.png', shot)
})

test('card: partner', async ({ page }) => {
  const p = partners.resources.find((r) => r.website && r.name) // the first partner with a website, in Sheet order
  await prepare(page, `/about/our-partners?search=${encodeURIComponent(p.name)}`)
  const card = page.locator('main figure').first()
  await still(page, 'main')
  await expect(card).toHaveScreenshot('card-partner.png', shot)
})

test('card: Social Changemakers fellow', async ({ page }) => {
  test.skip(fellows.resources.length === 0, 'empty snapshot')
  const f = fellows.resources[0]
  await prepare(page, `/education-for-harmony/social-changemakers?search=${encodeURIComponent(f.name)}`)
  const card = page.locator('main article').first()
  await card.scrollIntoViewIfNeeded()
  await still(page, 'main')
  await expect(card).toHaveScreenshot('card-fellow.png', shot)
})
