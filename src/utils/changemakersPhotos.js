import manifest from '../data/social-changemakers-photos.json'
import { imgSrc } from './imgSrc'

// A Past SCF profile's self-hosted photos (written by scripts/sync-social-changemakers.js):
// "<id>" = the fellow, "<id>__field" = the field work, "<id>__video" / "<id>__testimonial" = poster
// frames of the two videos. Each is { src, width, height } or null.
const entry = (key) => {
  const e = manifest[key]
  if (!e?.thumb) return null
  return { src: imgSrc(e.thumb), width: Number(e.width) || undefined, height: Number(e.height) || undefined }
}

export function getFellowPhotos(id) {
  return { fellow: entry(id), field: entry(`${id}__field`), video: entry(`${id}__video`), testimonial: entry(`${id}__testimonial`) }
}
