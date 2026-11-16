import manifest from '../data/pramaan-library-photos.json'
import { imgSrc } from './imgSrc'

/**
 * Self-hosted photo for a Pramaan Library resource, written by scripts/sync-pramaan-library.js.
 * Returns null when the resource has no photo or it hasn't been synced yet.
 */
export function getLibraryPhoto(id, variant = 'thumb') {
  const entry = manifest[id]
  return entry?.[variant] ? imgSrc(entry[variant]) : null
}
