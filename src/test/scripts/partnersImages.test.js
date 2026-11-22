// scripts/lib/partners-images.js — logos are trimmed, kept whole (never cropped) and keep transparency.
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { renderPartnerLogo, LOGO_BOX } from '../../../scripts/lib/partners-images.js'

const meta = buf => sharp(buf).metadata()

async function logoOn({ width, height, background, inner, channels = 3 }) {
  const content = await sharp({ create: { width: inner[0], height: inner[1], channels: 3, background: '#1E6BAA' } }).png().toBuffer()
  return sharp({ create: { width, height, channels, background } })
    .composite([{ input: content, top: Math.round((height - inner[1]) / 2), left: Math.round((width - inner[0]) / 2) }])
    .png().toBuffer()
}

describe('partner logos', () => {
  it('trims a white margin and fits a wide logo inside the box without cropping', async () => {
    const wide = await logoOn({ width: 2400, height: 800, background: '#ffffff', inner: [2000, 500] })
    const m = await meta(await renderPartnerLogo(wide))
    expect(m.format).toBe('webp')
    expect([m.width, m.height]).toEqual([LOGO_BOX, 100]) // 2000×500 trimmed → 4:1, whole
  })

  it('keeps a transparent background transparent', async () => {
    // Two blue blocks with a transparent gap between them: the gap must survive trimming and WebP.
    const block = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#1E6BAA' } }).png().toBuffer()
    const clear = await sharp({ create: { width: 600, height: 300, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: block, top: 100, left: 100 }, { input: block, top: 100, left: 400 }]).png().toBuffer()
    const out = await renderPartnerLogo(clear)
    expect((await meta(out)).hasAlpha).toBe(true)
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
    const centre = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels
    expect(data[centre + 3]).toBe(0) // the gap in the middle is still see-through
  })

  it('does not enlarge a small logo', async () => {
    const small = await sharp({ create: { width: 120, height: 60, channels: 3, background: '#1E6BAA' } }).png().toBuffer()
    const m = await meta(await renderPartnerLogo(small))
    expect([m.width, m.height]).toEqual([120, 60])
  })

  it('throws for bytes that are not an image', async () => {
    await expect(renderPartnerLogo(Buffer.from('not an image'))).rejects.toThrow()
  })
})
