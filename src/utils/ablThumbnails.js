import manifest from '../data/abl-thumbnails-manifest.json'
import { imgSrc } from './imgSrc'

/**
 * Resolves a resource id to a self-hosted thumbnail path, synced by
 * scripts/sync-abl-thumbnails.js (see docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md).
 * Returns null if the resource has no photo or hasn't been synced yet —
 * callers should fall back to a placeholder in that case.
 */
export function getAblThumbnail(id, variant = 'thumb') {
  const entry = manifest[id]
  if (!entry) return null
  return imgSrc(entry[variant])
}
