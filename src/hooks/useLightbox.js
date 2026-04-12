import { useState, useCallback } from 'react'

/**
 * Manages lightbox open/close/navigation state.
 * @param {number} count  total number of images in the gallery
 */
export function useLightbox(count) {
  const [index, setIndex] = useState(null)

  const openLightbox  = useCallback((i) => setIndex(i), [])
  const closeLightbox = useCallback(() => setIndex(null), [])
  const prevLightbox  = useCallback(() => setIndex(i => (i - 1 + count) % count), [count])
  const nextLightbox  = useCallback(() => setIndex(i => (i + 1) % count), [count])

  return {
    lightboxIndex:  index,
    isLightboxOpen: index !== null,
    openLightbox,
    closeLightbox,
    prevLightbox,
    nextLightbox,
  }
}
