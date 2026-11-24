import { createElement, lazy, useState } from 'react'

// After every deploy, GitHub Pages stops serving the previous build's hashed code files. A visitor
// whose tab was opened before the deploy (or whose browser kept the old index.html) then fails to
// load the next page they open: the import of that page's file is rejected ("Failed to fetch
// dynamically imported module", or Vite's preload of one of its files fails — `vite:preloadError`,
// which is left to reject the same import). Without this, React's error boundary showed the crash
// screen ("Something went wrong" + two buttons), at least for a moment.
//
// lazyPage(() => import('./pages/X')) is React.lazy plus: when the import fails, reload the page
// ONCE (which fetches the new build) and keep the Suspense loading screen up meanwhile (the
// promise never settles), so the crash screen is never shown for a stale build. A real failure
// (offline, a genuinely missing file) is not hidden: a second failure within RELOAD_WINDOW_MS of
// the automatic reload is re-thrown and the crash screen appears as before. Reproduced and verified
// against a local production build on 2026-11-21 (see src/test/utils/reloadOnStaleChunk.test.js).
const KEY = 'tide_stale_chunk_reload_at'
export const RELOAD_WINDOW_MS = 10_000

/** True if an automatic reload may happen now (none in the last RELOAD_WINDOW_MS); records it. */
export function claimReload(win = window, now = Date.now()) {
  try {
    const last = Number(win.sessionStorage.getItem(KEY)) || 0
    if (now - last < RELOAD_WINDOW_MS) return false
    win.sessionStorage.setItem(KEY, String(now))
    return true
  } catch {
    return false // storage blocked: no automatic reload (it could not be guarded against a loop)
  }
}

/** Runs `factory` (a dynamic import); on failure reloads once and never settles, else re-throws. */
export function importWithReload(factory, win = window) {
  return factory().catch(error => {
    if (!claimReload(win)) throw error
    win.location.reload()
    return new Promise(() => {})
  })
}

/**
 * React.lazy for a page whose code file may be gone after a deploy (see above), plus `preload()`.
 *
 * The build writes each page's HTML in advance (scripts/prerender.mjs). When the app starts on such
 * a page, main.jsx calls preload() first, so the page renders at once instead of suspending — the
 * pre-written HTML is then replaced by the same page, with no blank loading moment in between.
 * Each mounted page keeps the form it started with (direct or lazy), so a later re-render never
 * swaps the component type (which would remount the page and lose its state).
 */
export function lazyPage(factory) {
  let loaded = null
  const load = () => importWithReload(factory).then(mod => { loaded = mod; return mod })
  const Lazy = lazy(load)
  function Page(props) {
    const [Direct] = useState(() => loaded?.default ?? null)
    return createElement(Direct ?? Lazy, props)
  }
  Page.preload = load
  return Page
}
