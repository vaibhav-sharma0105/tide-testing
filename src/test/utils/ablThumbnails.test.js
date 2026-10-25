import { describe, it, expect } from 'vitest'
import { getAblThumbnail } from '../../utils/ablThumbnails'
import manifest from '../../data/abl-thumbnails-manifest.json'

// Test BASE_URL is '/' (see setup.js), so imgSrc resolves manifest paths to
// '/assets/images/abl/...'. Uses a real manifest entry so a renamed file shape
// in the sync script is caught here.
const [KNOWN_ID, KNOWN_ENTRY] = Object.entries(manifest)[0]

describe('getAblThumbnail', () => {
  it('returns the thumb path (default variant) for a synced resource', () => {
    expect(getAblThumbnail(KNOWN_ID)).toBe('/' + KNOWN_ENTRY.thumb)
  })

  it('returns the full-size path when asked for the "full" variant', () => {
    expect(getAblThumbnail(KNOWN_ID, 'full')).toBe('/' + KNOWN_ENTRY.full)
  })

  it('resolves explicit "thumb" the same as the default', () => {
    expect(getAblThumbnail(KNOWN_ID, 'thumb')).toBe(getAblThumbnail(KNOWN_ID))
  })

  it('returns null for an id that is not in the manifest', () => {
    expect(getAblThumbnail('NOT-A-REAL-ID')).toBeNull()
    expect(getAblThumbnail(undefined)).toBeNull()
  })

  it('returns "" (imgSrc of undefined) for an unknown variant on a known id', () => {
    expect(getAblThumbnail(KNOWN_ID, 'huge')).toBe('')
  })

  it('manifest entries follow the thumb/full naming the sync script writes', () => {
    expect(KNOWN_ENTRY.thumb).toBe(`assets/images/abl/${KNOWN_ID}-thumb.webp`)
    expect(KNOWN_ENTRY.full).toBe(`assets/images/abl/${KNOWN_ID}-full.webp`)
  })
})
