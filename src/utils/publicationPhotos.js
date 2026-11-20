import manifest from '../data/publications-photos.json'
import { imgSrc } from './imgSrc'

/**
 * The thumbnail with its pixel size (for width/height attributes, so nothing shifts while it
 * loads) and the full-size file (for
 * large display, e.g. the featured TIDE cover) with its size, or null.
 */
export function getPublicationThumb(id) {
  const entry = manifest[id]
  if (!entry?.thumb) return null
  const width = Number(entry.thumbWidth) || undefined
  const height = Number(entry.thumbHeight) || undefined
  return {
    src: imgSrc(entry.thumb), width, height,
    full: entry.full ? imgSrc(entry.full) : null,
    fullWidth: Number(entry.fullWidth) || undefined,
    fullHeight: Number(entry.fullHeight) || undefined,
  }
}
