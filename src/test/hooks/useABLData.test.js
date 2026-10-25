import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import ablHome from '../../data/abl-home.json'

// The real config reads import.meta.env at import time; swap in a mutable stub
// so each test can set (or clear) the API URL.
const cfg = vi.hoisted(() => ({ url: 'https://api.example.test/exec' }))
vi.mock('../../config/abl', () => ({
  get ABL_API_URL() { return cfg.url },
  ABL_CACHE_TTL_MS: 15 * 60 * 1000,
}))

import { useABLData } from '../../hooks/useABLData'

const CACHE_KEY = 'abl_api_cache_v2'
const TTL = 15 * 60 * 1000

const PAYLOAD = {
  success: true,
  lastUpdated: '2026-10-01T00:00:00Z',
  tabs: ['Worksheet', 'Games'],
  resources: {
    Worksheet: [{ id: 'W1', name: 'Fractions' }],
    Games: [{ id: 'G1', name: 'Dice' }, { id: 'G2', name: 'Cards' }],
  },
  meta: { total: 3, counts: { Worksheet: 1, Games: 2 } },
}

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body })

const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' })

// fetch stand-in that never resolves on its own but rejects with an
// AbortError when the caller's signal aborts — like the real thing.
function hangingFetch() {
  return vi.fn((url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(abortError()))
  }))
}

// Manually-resolved fetch so a test controls response order. Like the real
// fetch it rejects on abort, but a test can still call resolve() afterwards to
// simulate a response that raced the abort.
function deferredFetch() {
  const calls = []
  const fn = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
    calls.push({ signal, resolve, reject })
    signal.addEventListener('abort', () => reject(abortError()))
  }))
  fn.calls = calls
  return fn
}

const writeCache = (payload, ageMs = 0) =>
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ payload, timestamp: Date.now() - ageMs }))

let warnSpy

beforeEach(() => {
  sessionStorage.clear()
  cfg.url = 'https://api.example.test/exec'
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useABLData', () => {
  it('fetches, stores and caches a valid response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(cfg.url)
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual(PAYLOAD)
    expect(result.current.lastUpdated).toBe(PAYLOAD.lastUpdated)
    expect(result.current.allResources.map(r => [r.id, r.tab])).toEqual([
      ['W1', 'Worksheet'], ['G1', 'Games'], ['G2', 'Games'],
    ])
    const stored = JSON.parse(sessionStorage.getItem(CACHE_KEY))
    expect(stored.payload).toEqual(PAYLOAD)
    expect(typeof stored.timestamp).toBe('number')
  })

  it('returns the documented shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(PAYLOAD)))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Object.keys(result.current).sort()).toEqual(
      ['allResources', 'data', 'error', 'lastUpdated', 'loading', 'refetch']
    )
    expect(typeof result.current.refetch).toBe('function')
  })

  it('serves a fresh cache entry without calling fetch', async () => {
    writeCache(PAYLOAD, 60 * 1000)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual(PAYLOAD)
    expect(result.current.lastUpdated).toBe(PAYLOAD.lastUpdated)
  })

  it('ignores an expired cache entry and refetches', async () => {
    writeCache({ ...PAYLOAD, lastUpdated: 'old' }, TTL + 1000)
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.lastUpdated).toBe(PAYLOAD.lastUpdated)
  })

  it('discards a malformed cache entry and refetches', async () => {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ payload: { success: true, tabs: 'nope' }, timestamp: Date.now() })
    )
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(PAYLOAD)
  })

  it('discards unparsable or timestamp-less cache entries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    sessionStorage.setItem(CACHE_KEY, '{not json')
    const first = renderHook(() => useABLData())
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    first.unmount()

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ payload: PAYLOAD }))
    const second = renderHook(() => useABLData())
    await waitFor(() => expect(second.result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports the timeout error when the request is aborted after 10s', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', hangingFetch())

    const { result } = renderHook(() => useABLData())
    expect(result.current.loading).toBe(true)

    await act(async () => { await vi.advanceTimersByTimeAsync(9_999) })
    expect(result.current.loading).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(2) })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(ablHome.errors.timeout)
    expect(result.current.data).toBeNull()
    expect(sessionStorage.getItem(CACHE_KEY)).toBeNull()
  })

  it('clears the timeout when fetch rejects', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const { result } = renderHook(() => useABLData())
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })

    expect(result.current.error).toBe(ablHome.errors.generic)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports the generic error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(ablHome.errors.generic)
    expect(result.current.data).toBeNull()
  })

  it('reports the generic error on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(ablHome.errors.generic)
  })

  it('reports the generic error for { success: false } and does not cache it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ success: false, error: 'boom' })))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(ablHome.errors.generic)
    expect(result.current.data).toBeNull()
    expect(sessionStorage.getItem(CACHE_KEY)).toBeNull()
  })

  it.each([
    ['tabs missing', { success: true, resources: {} }],
    ['tabs not an array', { success: true, tabs: 'Worksheet', resources: {} }],
    ['resources missing', { success: true, tabs: ['Worksheet'] }],
    ['resources is an array', { success: true, tabs: [], resources: [] }],
    ['a tab holds a non-array', { success: true, tabs: ['Worksheet'], resources: { Worksheet: 'x' } }],
    ['body is null', null],
  ])('treats a malformed success response (%s) as the generic load error', async (_label, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(body)))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(ablHome.errors.generic)
    expect(result.current.data).toBeNull()
    expect(result.current.allResources).toEqual([])
    expect(sessionStorage.getItem(CACHE_KEY)).toBeNull()
  })

  it('treats a tab with no entry in resources as empty', async () => {
    const body = { ...PAYLOAD, tabs: ['Worksheet', 'Kits'], resources: { Worksheet: PAYLOAD.resources.Worksheet } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(body)))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.allResources.map(r => r.id)).toEqual(['W1'])
  })

  it('reports the not-configured error without calling fetch', async () => {
    cfg.url = ''
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.error).toBe(ablHome.errors.notConfigured)
  })

  it('logs only on failure and never includes the API URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(PAYLOAD)))
    const ok = renderHook(() => useABLData())
    await waitFor(() => expect(ok.result.current.loading).toBe(false))
    expect(warnSpy).not.toHaveBeenCalled()
    ok.unmount()

    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError(`Failed to fetch ${cfg.url}`)))
    const bad = renderHook(() => useABLData())
    await waitFor(() => expect(bad.result.current.loading).toBe(false))
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('api.example.test')
  })

  it('still works when sessionStorage throws', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(PAYLOAD)))
    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(PAYLOAD)
  })

  it('does not update state or cache when the response arrives after unmount', async () => {
    const fetchMock = deferredFetch()
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result, unmount } = renderHook(() => useABLData())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const { signal, resolve } = fetchMock.calls[0]

    unmount()
    expect(signal.aborted).toBe(true)

    // A response that raced the abort: nothing may be written or logged.
    resolve(okResponse(PAYLOAD))
    await act(async () => { await Promise.resolve() })

    expect(sessionStorage.getItem(CACHE_KEY)).toBeNull()
    expect(result.current.data).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('refetch bypasses a fresh cache and reloads', async () => {
    writeCache({ ...PAYLOAD, lastUpdated: 'cached' })
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.lastUpdated).toBe('cached')
    expect(fetchMock).not.toHaveBeenCalled()

    act(() => { result.current.refetch() })
    await waitFor(() => expect(result.current.lastUpdated).toBe(PAYLOAD.lastUpdated))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.loading).toBe(false)
  })

  it('refetch recovers from an error', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse(PAYLOAD))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    await waitFor(() => expect(result.current.error).toBe(ablHome.errors.generic))

    act(() => { result.current.refetch() })
    await waitFor(() => expect(result.current.data).toEqual(PAYLOAD))
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('ignores a stale response that resolves after a newer refetch', async () => {
    const fetchMock = deferredFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    const first = fetchMock.calls[0]

    act(() => { result.current.refetch() })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(first.signal.aborted).toBe(true)
    const second = fetchMock.calls[1]

    await act(async () => { second.resolve(okResponse({ ...PAYLOAD, lastUpdated: 'newer' })) })
    await waitFor(() => expect(result.current.lastUpdated).toBe('newer'))

    // The superseded request answering late (even successfully) must not win.
    await act(async () => { first.resolve(okResponse({ ...PAYLOAD, lastUpdated: 'older' })) })
    expect(result.current.lastUpdated).toBe('newer')
    expect(JSON.parse(sessionStorage.getItem(CACHE_KEY)).payload.lastUpdated).toBe('newer')
    expect(result.current.loading).toBe(false)
  })

  it('a superseded request failing does not clobber the newer request state', async () => {
    const fetchMock = deferredFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useABLData())
    act(() => { result.current.refetch() })
    // The first request was aborted by the refetch; its rejection must be silent
    // and must not flip loading off while the second is still pending.
    await act(async () => { await Promise.resolve() })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()

    await act(async () => { fetchMock.calls[1].resolve(okResponse(PAYLOAD)) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(PAYLOAD)
    expect(result.current.error).toBeNull()
  })
})
