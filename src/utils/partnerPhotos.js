import manifest from '../data/partners-photos.json'
import { imgSrc } from './imgSrc'

/**
 * A partner's self-hosted logo with its pixel size (so nothing shifts while it loads), or null —
 * also null for a `placeholder` (one picture uploaded for many partners, e.g. "No Logo Available";
 * flagged by the sync, scripts/lib/partners-snapshot.js markSharedLogos): the card shows initials.
 */
export function getPartnerLogo(id) {
  const entry = manifest[id]
  if (!entry?.thumb || entry.placeholder) return null
  return {
    src: imgSrc(entry.thumb),
    width: Number(entry.thumbWidth) || undefined,
    height: Number(entry.thumbHeight) || undefined,
  }
}
