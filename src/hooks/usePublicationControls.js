import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  applyPublicationFilters, facetPublicationOptions, parsePublicationParams, publicationParamsToSearch, searchTerms,
} from '../utils/publicationFilters'

// Hooks and helpers for the Publications pages' controls (components/publications).

const SEARCH_DEBOUNCE_MS = 150

/**
 * Everything both Publications pages share about search + filters, kept in the URL query string
 * (?search=&type=&field=&year=&dir=&page=): the parsed params, `change` (replace the whole query),
 * `set` (patch it and go back to page 1), `clearAll`, the debounced search box state + its "/"
 * shortcut, the faceted filter options, the filtered rows, search terms, the active-filter chips,
 * and `resultsRef`, which receives focus after a page change (router state focusResults).
 *   rows: the page's rows · shortcutKey: e.g. "/" · undatedHeading: label of the no-date year value
 */
export function usePublicationQuery({ rows, shortcutKey, undatedHeading }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => parsePublicationParams(location.search), [location.search])

  // { focus: true } also scrolls to and focuses the results line (e.g. a "See all" shortcut).
  const change = useCallback((next, { focus = false } = {}) => navigate(
    { search: publicationParamsToSearch(next) },
    { replace: true, state: focus ? { focusResults: true } : undefined },
  ), [navigate])
  const set = (patch) => change({ ...params, ...patch, page: 1 })
  const clearAll = () => change({ search: '', type: '', field: '', year: '', dir: params.dir, page: 1 })

  // The search box updates at once; the URL (and so the results) after a short pause.
  const commitSearch = useCallback((search) => {
    change({ ...parsePublicationParams(window.location.search), search, page: 1 })
  }, [change])
  const [input, setInput] = useDebouncedSearch(params.search, commitSearch)
  const inputRef = useRef(null)
  useFocusShortcut(shortcutKey, inputRef)

  const options = useMemo(() => facetPublicationOptions(rows, params, undatedHeading), [rows, params, undatedHeading])
  const filtered = useMemo(() => applyPublicationFilters(rows, params), [rows, params])
  const terms = useMemo(() => searchTerms(params.search), [params.search])

  const resultsRef = useRef(null)
  const handledKey = useRef(location.key)
  useEffect(() => {
    if (handledKey.current === location.key) return
    handledKey.current = location.key
    if (location.state?.focusResults) focusResults(resultsRef.current)
  }, [location.key, location.state])

  const labelOf = (list, value) => list.find(o => o.value === value)?.label ?? value
  const chips = [
    params.search && { key: 'search', label: `“${params.search}”`, onRemove: () => set({ search: '' }) },
    params.type && { key: 'type', label: labelOf(options.types, params.type), onRemove: () => set({ type: '' }) },
    params.field && { key: 'field', label: labelOf(options.fields, params.field), onRemove: () => set({ field: '' }) },
    params.year && { key: 'year', label: labelOf(options.years, params.year), onRemove: () => set({ year: '' }) },
  ].filter(Boolean)
  const active = chips.length > 0

  return { params, change, set, clearAll, input, setInput, inputRef, options, filtered, terms, chips, active, resultsRef }
}

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
