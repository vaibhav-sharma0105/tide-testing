import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { installStaleChunkReload, RELOAD_WINDOW_MS } from '../../utils/reloadOnStaleChunk'

function fakeWindow() {
  const target = new EventTarget()
  const store = new Map()
  return {
    addEventListener: target.addEventListener.bind(target),
    dispatch: () => { const e = new Event('vite:preloadError', { cancelable: true }); target.dispatchEvent(e); return e },
    sessionStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    location: { reload: vi.fn() },
  }
}

describe('installStaleChunkReload', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-15T10:00:00Z')) })
  afterEach(() => vi.useRealTimers())

  it('reloads once on a stale-chunk error and prevents the default error', () => {
    const win = fakeWindow()
    installStaleChunkReload(win)
    const e = win.dispatch()
    expect(win.location.reload).toHaveBeenCalledTimes(1)
    expect(e.defaultPrevented).toBe(true)
  })

  it('does not loop: a second failure right after the reload is left to show', () => {
    const win = fakeWindow()
    installStaleChunkReload(win)
    win.dispatch()
    const second = win.dispatch()
    expect(win.location.reload).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(false)
  })

  it('allows another automatic reload after the window (a later deploy)', () => {
    const win = fakeWindow()
    installStaleChunkReload(win)
    win.dispatch()
    vi.advanceTimersByTime(RELOAD_WINDOW_MS + 1)
    win.dispatch()
    expect(win.location.reload).toHaveBeenCalledTimes(2)
  })

  it('does nothing if sessionStorage is unavailable', () => {
    const win = fakeWindow()
    win.sessionStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => {} }
    installStaleChunkReload(win)
    win.dispatch()
    expect(win.location.reload).not.toHaveBeenCalled()
  })
})
