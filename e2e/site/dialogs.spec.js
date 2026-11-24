// Dialogs and outbound links on the built site: the photo and video lightboxes (images and players
// must resolve under the /tide-testing/ base and pass the CSP), "Copy citation", and the Contribute
// form link (content/pages/abl-contribute.yaml → formUrl).
import { test, expect, go } from './fixtures.js'
import thriveText from '../../src/data/thrive-publications.json' with { type: 'json' }
import contribute from '../../src/data/abl-contribute.json' with { type: 'json' }

test('photo lightbox: the full photo loads under the base path; Escape closes and focus returns', async ({ page }) => {
  await go(page, '/pramaan')
  const trigger = page.locator('main [aria-haspopup="dialog"]').nth(1)
  await trigger.focus()
  const label = await trigger.getAttribute('aria-label')
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const img = dialog.locator('img').first()
  await expect(img).toHaveAttribute('src', /^\/tide-testing\/(?!tide-testing\/)/)
  await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(label)
})

test('promo video lightbox: the player frame points at the video host and the CSP allows it', async ({ page }) => {
  await go(page, '/pramaan')
  await page.locator('main button[aria-haspopup="dialog"][aria-label]').first().click()
  const frame = page.getByRole('dialog').locator('iframe')
  await expect(frame).toHaveAttribute('src', /^https:\/\/(www\.youtube(-nocookie)?\.com\/embed\/|drive\.google\.com\/file\/d\/[^/]+\/preview)/)
  // The fixture fails the test on any CSP violation (frame-src).
})

test('Copy citation copies the APA reference and says so', async ({ page, browserName, context }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await go(page, '/thrive/publications')
  const button = page.getByRole('button', { name: new RegExp(`^${thriveText.a11y.copyLabelTemplate.split('{title}')[0]}`) }).first()
  await button.click()
  await expect(button).toContainText(thriveText.entry.copied)
  await expect(page.getByText(thriveText.entry.copiedAnnouncement)).toBeAttached()
  if (browserName === 'chromium') {
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.length).toBeGreaterThan(20)
    const title = (await button.getAttribute('aria-label')).slice(thriveText.a11y.copyLabelTemplate.indexOf('{title}'))
    expect(copied).toContain(title.slice(0, 20))
  }
})

test('Contribute: the form button opens the formUrl from YAML in a new tab', async ({ page }) => {
  test.skip(!contribute.formUrl, 'formUrl is empty (allowed: the button is then hidden)')
  await go(page, '/pramaan/contribute')
  const link = page.locator(`main a[href="${contribute.formUrl}"]`)
  await expect(link).toHaveCount(1)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
})
