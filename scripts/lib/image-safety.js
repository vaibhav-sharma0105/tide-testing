// The first check every downloaded Sheet image passes before any image code decodes it.
// Used by the four image pipelines (scripts/sync-pramaan-library.js, scripts/lib/publications-images.js,
// partners-images.js, social-changemakers-images.js); tested in src/test/scripts/imageSafety.test.js.
//
// Why: the pictures come from Form uploads, so anyone can choose their bytes, and the sync decodes
// them on a runner that holds a token able to push to the repository. So:
//   1. the format is read from the file's own first bytes (never the name or the declared type) and
//      only JPEG, PNG, WebP and GIF go on — SVG, HEIF/AVIF, TIFF, PDF and the rest never reach a
//      decoder (those are where image libraries have had their worst bugs; Drive's thumbnail renderer
//      already turns phone HEIC photos and other formats into JPEG/PNG before we get them);
//   2. a picture of more than MAX_INPUT_PIXELS is refused before it is decoded (a "decompression
//      bomb": a small file that expands to gigabytes of pixels), and sharp gets the same limit.
// Metadata (EXIF, including any GPS position) is never copied to the WebP files: sharp drops it
// unless asked to keep it, and no pipeline asks (imageSafety.test.js checks the output).
import sharp from 'sharp'

export const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'gif']
// 100 megapixels — e.g. 12,000 × 8,000 — above any photo a phone or camera saves today.
export const MAX_INPUT_PIXELS = 100_000_000
export const SHARP_INPUT = { limitInputPixels: MAX_INPUT_PIXELS }

/** The format named by the file's first bytes, or null for anything that is not an allowed raster image. */
export function sniffImageFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  const gif = buf.toString('latin1', 0, 6)
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'gif'
  return null
}

/**
 * Throws unless `raw` is an allowed raster image within the pixel limit; returns its sharp metadata.
 * Call it before any other sharp() call on downloaded bytes.
 */
export async function assertSafeImage(raw) {
  const sniffed = sniffImageFormat(raw)
  if (!sniffed) throw new Error('not a JPEG, PNG, WebP or GIF image (other formats are not accepted)')
  const meta = await sharp(raw, SHARP_INPUT).metadata()
  if (meta.format !== sniffed) throw new Error(`the file says ${sniffed} but decodes as ${meta.format}`)
  if (!(meta.width > 0 && meta.height > 0)) throw new Error('the image has no size')
  if (meta.width * meta.height > MAX_INPUT_PIXELS) {
    throw new Error(`the image is too large (${meta.width} × ${meta.height} pixels; limit ${MAX_INPUT_PIXELS / 1e6} megapixels)`)
  }
  return meta
}
