// Turns one uploaded partner logo into the WebP file the Partners page uses.
// Used by scripts/sync-partners.js; tested in src/test/scripts/partnersImages.test.js.
//
// Logos must never be cropped (a cut-off name or emblem is worse than a small one), so:
//   1. trim uniform margins (white or transparent) — never fails the logo if trimming can't
//      (same step as the Publications thumbnails, scripts/lib/publications-images.js);
//   2. fit inside LOGO_BOX × LOGO_BOX, never enlarged, transparency kept.
// The page shows each logo whole inside a fixed frame (object-contain).
import sharp from 'sharp'
import { trimBorders } from './publications-images.js'
import { assertSafeImage } from './image-safety.js'

export const LOGO_BOX = 400

/** Returns the logo as a WebP Buffer. Throws only if the image can't be decoded at all. */
export async function renderPartnerLogo(raw) {
  await assertSafeImage(raw) // allowed format (by its bytes) and pixel limit, before anything decodes it
  const trimmed = await trimBorders(raw)
  return sharp(trimmed)
    .resize({ width: LOGO_BOX, height: LOGO_BOX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer()
}
