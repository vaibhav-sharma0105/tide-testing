import site from '../data/site.json'
import { imgSrc } from './imgSrc'

/**
 * Swaps any <img> that fails to load for the site placeholder image.
 *
 * Image `error` events don't bubble, so one capturing listener on the
 * document covers every image on every page. An image opts out with
 * `data-no-placeholder` (DriveImage does: it draws its own icon fallback).
 * The placeholder's own URL is skipped, so a missing placeholder can't loop.
 */
export function installImagePlaceholder(doc = document) {
  const fallback = new URL(imgSrc(site.placeholderImage), doc.baseURI).href

  const onError = (event) => {
    const img = event.target
    if (!(img instanceof HTMLImageElement)) return
    if (img.hasAttribute('data-no-placeholder') || img.src === fallback) return
    img.removeAttribute('srcset')
    img.src = fallback
  }

  doc.addEventListener('error', onError, true)
  return () => doc.removeEventListener('error', onError, true)
}
