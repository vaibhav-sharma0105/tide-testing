import { lazy } from 'react'

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

/** React.lazy for a page whose code file may be gone after a deploy (see above). */
export function lazyPage(factory) {
  return lazy(() => importWithReload(factory))
}
