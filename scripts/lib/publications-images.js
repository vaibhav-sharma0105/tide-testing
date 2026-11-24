// Turns one uploaded thumbnail into the two WebP files the Publications pages use.
// Used by scripts/sync-publications.js; tested in src/test/scripts/publicationsImages.test.js.
//
// Why this is not a plain resize (measured on the real uploads, 2026-11-20): the "thumbnails" are
// screenshots — annual-report covers (portrait, ~0.67–0.79 wide per tall), slides with black bars
// above and below, a logo on a wide white margin, tall phone screenshots of blog pages, a two-page
// textbook spread. So:
//   1. trim uniform borders (black bars, white margins) — never fails the photo if trimming can't;
//   2. TIDE (document covers): keep the whole page, never crop — the page shows it whole;
//   3. THRIvE (mixed screenshots): the thumbnail keeps its own shape between 3:4 and 16:9 (the page
//      frames it to that shape, so there are no bars). Taller images are cropped to 3:4 around their
//      most interesting region (sharp's "attention" strategy) so a browser bar doesn't fill the box;
//      wider ones are cropped to 16:9. Slides and spreads fall in between and are never cropped,
//      so no words are cut off. The full-size file is never cropped.
import sharp from 'sharp'
import { assertSafeImage } from './image-safety.js'

// clamp = [narrowest, widest] width÷height kept as-is (THRIvE): 3:4 … 16:9.
export const THUMB = { TIDE: { width: 480 }, THRIvE: { width: 480, clamp: [3 / 4, 16 / 9] } }
export const FULL_WIDTH = 1200
const TRIM_THRESHOLD = 12

/** Raw bytes → trimmed PNG buffer (unchanged bytes if trimming isn't possible). */
export async function trimBorders(raw) {
  try {
    const { data, info } = await sharp(raw).trim({ threshold: TRIM_THRESHOLD }).png().toBuffer({ resolveWithObject: true })
    // A "trim" that leaves almost nothing (a nearly blank image) is worse than none.
    return info.width >= 40 && info.height >= 40 ? data : raw
  } catch {
    return raw
  }
}

/** Returns { thumb: Buffer, full: Buffer } as WebP. Throws only if the image can't be decoded at all. */
export async function renderPublicationImages(raw, org) {
  await assertSafeImage(raw) // allowed format (by its bytes) and pixel limit, before anything decodes it
  const trimmed = await trimBorders(raw)
  const box = THUMB[org] ?? THUMB.TIDE
  let thumb
  if (!box.clamp) {
    thumb = sharp(trimmed).resize({ width: box.width, withoutEnlargement: true })
  } else {
    // Keep each image's own shape (the page frames it to fit — no bars), within limits so one
    // extreme screenshot can't dominate the list:
    //   taller than 3:4 (phone screenshots of web pages) → cropped to 3:4 around the most
    //     interesting part (the photo, not the browser bar);
    //   wider than 16:9 (logo strips, wide banners) → cropped to 16:9 from the centre;
    //   anything in between (slides 16:10, spreads 3:2, 4:3 photos) → whole, never cropped.
    const { width, height } = await sharp(trimmed).metadata()
    const ratio = width / height
    const [min, max] = box.clamp
    if (ratio < min) {
      thumb = sharp(trimmed).resize({ width: box.width, height: Math.round(box.width / min), fit: 'cover', position: sharp.strategy.attention })
    } else if (ratio > max) {
      thumb = sharp(trimmed).resize({ width: box.width, height: Math.round(box.width / max), fit: 'cover', position: 'centre' })
    } else {
      thumb = sharp(trimmed).resize({ width: box.width, withoutEnlargement: true })
    }
  }
  return {
    thumb: await thumb.webp({ quality: 80 }).toBuffer(),
    full: await sharp(trimmed).resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
  }
}
