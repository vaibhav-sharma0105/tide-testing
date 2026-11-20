import { useState, useEffect } from 'react'

// Hooks and helpers for the Publications pages' controls (components/publications).

const SEARCH_DEBOUNCE_MS = 150

/**
 * Search box state that follows the URL: the box updates at once, `commit(value)` runs after a
 * short pause in typing, and a change of the URL value from elsewhere (Clear all, a chip, Back)
 * is copied into the box. `commit` should be stable (useCallback).
 */
export function useDebouncedSearch(urlValue, commit, delay = SEARCH_DEBOUNCE_MS) {
  const [input, setInput] = useState(urlValue)
  const [seenUrl, setSeenUrl] = useState(urlValue)
  if (urlValue !== seenUrl) {
    setSeenUrl(urlValue)
    setInput(urlValue)
  }
  useEffect(() => {
    if (input === urlValue) return undefined
    const id = setTimeout(() => commit(input), delay)
    return () => clearTimeout(id)
  }, [input, urlValue, commit, delay])
  return [input, setInput]
}

/** Pressing `key` (e.g. "/") anywhere but in a form field focuses `ref`. */
export function useFocusShortcut(key, ref) {
  useEffect(() => {
    if (!key) return undefined
    const onKey = (e) => {
      if (e.key !== key || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target
      if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      e.preventDefault()
      ref.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [key, ref])
}

/** Moves the view and keyboard focus to `el` (a results line) — instant under reduced motion. */
export function focusResults(el) {
  if (!el) return
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}
