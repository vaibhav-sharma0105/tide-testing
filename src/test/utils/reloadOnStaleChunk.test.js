import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { importWithReload, claimReload, RELOAD_WINDOW_MS } from '../../utils/reloadOnStaleChunk'

// A page's code file missing after a deploy must reload the page once (keeping the loader up),
// never show the crash screen; a real, repeated failure must still surface.
function fakeWindow({ storageBlocked = false } = {}) {
  const store = new Map()
  return {
    sessionStorage: storageBlocked
      ? { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
      : { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    location: { reload: vi.fn() },
  }
}
const failing = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module'))
const settled = (p) => Promise.race([p.then(() => 'resolved', () => 'rejected'), new Promise(r => setTimeout(() => r('pending'), 0))])

describe('importWithReload / lazyPage', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-21T10:00:00Z')) })
  afterEach(() => vi.useRealTimers())

  it('passes a successful import through untouched', async () => {
    const win = fakeWindow()
    await expect(importWithReload(() => Promise.resolve({ default: 'Page' }), win)).resolves.toEqual({ default: 'Page' })
    expect(win.location.reload).not.toHaveBeenCalled()
  })

  it('on a failed import: reloads once and never settles (Suspense keeps the loader; no crash screen)', async () => {
    const win = fakeWindow()
    const p = importWithReload(failing, win)
    expect(await settled(p)).toBe('pending')
    expect(win.location.reload).toHaveBeenCalledTimes(1)
  })

  it('does not loop: a second failure right after the reload is re-thrown (the crash screen shows)', async () => {
    const win = fakeWindow()
    importWithReload(failing, win)
    await Promise.resolve(); await Promise.resolve()
    await expect(importWithReload(failing, win)).rejects.toThrow('Failed to fetch')
    expect(win.location.reload).toHaveBeenCalledTimes(1)
  })

  it('allows another automatic reload after the window (a later deploy)', () => {
    const win = fakeWindow()
    expect(claimReload(win)).toBe(true)
    expect(claimReload(win)).toBe(false)
    vi.setSystemTime(Date.now() + RELOAD_WINDOW_MS + 1)
    expect(claimReload(win)).toBe(true)
  })

  it('with storage blocked, does not reload (could loop) and re-throws', async () => {
    const win = fakeWindow({ storageBlocked: true })
    await expect(importWithReload(failing, win)).rejects.toThrow()
    expect(win.location.reload).not.toHaveBeenCalled()
  })
})
