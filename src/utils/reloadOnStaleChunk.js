// After every deploy, GitHub Pages stops serving the previous build's hashed code chunks. A visitor
// whose tab was opened before the deploy then fails to load the next lazily loaded page (e.g. a
// Pramaan screen) and would see the crash screen. Vite announces this as `vite:preloadError`;
// reloading fetches the new build. The timestamp guard prevents a reload loop if the failure is
// real (e.g. the visitor is offline): at most one automatic reload per RELOAD_WINDOW_MS.
const KEY = 'tide_stale_chunk_reload_at'
export const RELOAD_WINDOW_MS = 10_000

export function installStaleChunkReload(win = window) {
  win.addEventListener('vite:preloadError', event => {
    let last = 0
    try { last = Number(win.sessionStorage.getItem(KEY)) || 0 } catch { return }
    if (Date.now() - last < RELOAD_WINDOW_MS) return // already reloaded just now: let the error show
    try { win.sessionStorage.setItem(KEY, String(Date.now())) } catch { return }
    event.preventDefault()
    win.location.reload()
  })
}
