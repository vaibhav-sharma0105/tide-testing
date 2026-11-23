// scripts/lib/social-changemakers-images.js: photos are turned upright, fitted inside the box (never
// cropped, never enlarged) and saved as WebP.
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { renderFellowPhoto, PHOTO_BOX } from '../../../scripts/lib/social-changemakers-images.js'

const jpeg = (w, h, opts = {}) => sharp({ create: { width: w, height: h, channels: 3, background: '#3366aa' } }).jpeg().withMetadata(opts).toBuffer()

describe('renderFellowPhoto', () => {
  it('fits a large photo inside the box without cropping (keeps its shape)', async () => {
    const out = await renderFellowPhoto(await jpeg(3000, 2000))
    expect([out.width, out.height]).toEqual([PHOTO_BOX, 800])
    expect((await sharp(out.buffer).metadata()).format).toBe('webp')
  })

  it('never enlarges a small photo', async () => {
    const out = await renderFellowPhoto(await jpeg(400, 600))
    expect([out.width, out.height]).toEqual([400, 600])
  })

  it('turns a phone photo the right way up (EXIF orientation)', async () => {
    const out = await renderFellowPhoto(await jpeg(600, 400, { orientation: 6 }))
    expect([out.width, out.height]).toEqual([400, 600])
  })

  it('throws on bytes that are not an image', async () => {
    await expect(renderFellowPhoto(Buffer.from('not an image'))).rejects.toThrow()
  })
})
