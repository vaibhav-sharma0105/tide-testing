// Turns one uploaded Past SCF photo (a fellow's portrait or a field-work photo) into the WebP file
// the page uses. Used by scripts/sync-social-changemakers.js; tested in
// src/test/scripts/socialChangemakersImages.test.js.
//
// People's photos are never cropped here (a cut-off face is worse than a framed one): the photo is
// turned the right way up (phone photos carry an orientation tag), resized to fit inside
// PHOTO_BOX × PHOTO_BOX (never enlarged) and saved as WebP. The page frames it (object-cover, the
// portrait aligned to its upper part, where faces usually are).
import sharp from 'sharp'
import { assertSafeImage } from './image-safety.js'

export const PHOTO_BOX = 1200

/** Returns { buffer, width, height }. Throws only if the image can't be decoded at all. */
export async function renderFellowPhoto(raw) {
  await assertSafeImage(raw) // allowed format (by its bytes) and pixel limit, before anything decodes it
  const { data, info } = await sharp(raw)
    .rotate()
    .resize({ width: PHOTO_BOX, height: PHOTO_BOX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true })
  return { buffer: data, width: info.width, height: info.height }
}
