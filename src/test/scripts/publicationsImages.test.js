// scripts/lib/publications-images.js — synthetic images that reproduce the real upload problems
// (a 16:10 slide screenshot with black bars, a portrait cover on a white margin).
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { renderPublicationImages, trimBorders } from '../../../scripts/lib/publications-images.js'

const size = async buf => { const m = await sharp(buf).metadata(); return [m.width, m.height] }

// A coloured content block inside uniform borders.
async function framed({ width, height, border, inner, top = 0, left = 0 }) {
  const content = await sharp({ create: { width: inner[0], height: inner[1], channels: 3, background: '#1E6BAA' } }).png().toBuffer()
  return sharp({ create: { width, height, channels: 3, background: border } })
    .composite([{ input: content, top: top || Math.round((height - inner[1]) / 2), left: left || Math.round((width - inner[0]) / 2) }])
    .png().toBuffer()
}

describe('publication images', () => {
  it('trims black bars from a slide screenshot', async () => {
    const slide = await framed({ width: 1600, height: 1000, border: '#000000', inner: [1600, 860] })
    expect(await size(await trimBorders(slide))).toEqual([1600, 860])
  })

  it('keeps a TIDE cover whole, and crops a tall THRIvE screenshot to exactly 3:4', async () => {
    const cover = await framed({ width: 800, height: 1200, border: '#ffffff', inner: [600, 900] })
    const tide = await renderPublicationImages(cover, 'TIDE')
    const [tw, th] = await size(tide.thumb)
    expect(tw).toBe(480)
    expect(th / tw).toBeCloseTo(900 / 600, 1) // the page's own shape, not a crop
    const thrive = await renderPublicationImages(cover, 'THRIvE')
    expect(await size(thrive.thumb)).toEqual([480, 640])
    expect((await size(thrive.full))[0]).toBeLessThanOrEqual(1200)
  })

  it('keeps a 16:10 THRIvE slide in its own shape (bars trimmed, no crop)', async () => {
    const slide = await framed({ width: 1600, height: 1140, border: '#000000', inner: [1600, 1000] })
    const { thumb } = await renderPublicationImages(slide, 'THRIvE')
    expect(await size(thumb)).toEqual([480, 300])
  })

  it('crops a very wide THRIvE logo strip to 16:9', async () => {
    const strip = await framed({ width: 1400, height: 300, border: '#ffffff', inner: [1400, 300] })
    const { thumb } = await renderPublicationImages(strip, 'THRIvE')
    expect(await size(thumb)).toEqual([480, 270])
  })

  it('leaves an image that is all border unchanged rather than trimming it to nothing', async () => {
    const blank = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#ffffff' } }).png().toBuffer()
    expect(await size(await trimBorders(blank))).toEqual([300, 200])
  })

  it('throws for bytes that are not an image', async () => {
    await expect(renderPublicationImages(Buffer.from('not an image'), 'TIDE')).rejects.toThrow()
  })
})
