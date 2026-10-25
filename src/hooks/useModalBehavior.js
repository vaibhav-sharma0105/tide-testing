import { useEffect } from 'react'

/**
 * Shared keyboard + scroll-lock behavior for full-screen overlays.
 *
 * While `active` is truthy (any value — a changing id/src re-arms it, as the
 * old per-component effects did): Escape calls `onClose`, any other keydown is
 * forwarded to `onKeyExtra(e)` (e.g. Lightbox's arrow-key navigation), and
 * `document.body` scrolling is locked. Cleanup removes the listener and
 * resets `body.style.overflow` to '' (not to its previous value — the three
 * overlays that use this have always behaved that way).
 *
 * `target` picks where the keydown listener lives, because the overlays
 * differ: Lightbox listens on `window`, the ABL image/video overlays on
 * `document`. Listener order relative to other handlers depends on this, so
 * it is an option rather than unified. `onKeyExtra` should be stable (wrap in
 * useCallback) — like `onClose`, a new identity re-registers the listener.
 *
 * Focus trapping is separate: pair this with `useFocusTrap`, declared first.
 */
export function useModalBehavior({ active = true, onClose, onKeyExtra, target = 'document' }) {
  useEffect(() => {
    if (!active) return undefined
    const el = target === 'window' ? window : document
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (onKeyExtra) onKeyExtra(e)
    }
    el.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      el.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [active, onClose, onKeyExtra, target])
}
