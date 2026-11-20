import manifest from '../data/publications-photos.json'
import { imgSrc } from './imgSrc'
import { frameForSize } from './publicationFilters'

/**
 * Self-hosted thumbnail for a publication, written by the Publications sync (same manifest shape
 * as pramaan-library-photos.json). Returns null when the row has no photo or it hasn't been
 * synced yet. The result is already resolved with imgSrc — don't apply imgSrc to it again.
 */
export function getPublicationPhoto(id, variant = 'thumb') {
  const entry = manifest[id]
  return entry?.[variant] ? imgSrc(entry[variant]) : null
}

/**
 * The thumbnail with its pixel size (for width/height attributes, so nothing shifts while it
 * loads) and the frame that fits it ('portrait' page or 'landscape'), or null.
 */
export function getPublicationThumb(id) {
  const entry = manifest[id]
  if (!entry?.thumb) return null
  const width = Number(entry.thumbWidth) || undefined
  const height = Number(entry.thumbHeight) || undefined
  return { src: imgSrc(entry.thumb), width, height, frame: frameForSize(width, height) }
}
