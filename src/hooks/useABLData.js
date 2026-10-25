import { useState, useEffect, useCallback, useRef } from 'react'
import { ABL_API_URL, ABL_CACHE_TTL_MS } from '../config/abl'
import ablHome from '../data/abl-home.json'

const STORAGE_KEY = 'abl_api_cache_v2'

// Failures are logged by kind only. Never log the request URL, a thrown
// message, or anything from the response body — those can carry the API URL
// or other values that must not reach the console.
function loadFailure(kind) {
  const err = new Error(kind)
  err.kind = kind
  return err
}

/**
 * Shape contract for the Apps Script payload: `success` truthy, `tabs` an
 * array, `resources` a plain object whose per-tab entries are arrays (or
 * absent — a tab with no rows is treated as empty). Anything else would crash
 * `allResources` below, so it is rejected before it is cached or stored.
 */
function isValidPayload(json) {
  if (!json || !json.success) return false
  if (!Array.isArray(json.tabs)) return false
  const { resources } = json
  if (!resources || typeof resources !== 'object' || Array.isArray(resources)) return false
  return json.tabs.every(tab => resources[tab] == null || Array.isArray(resources[tab]))
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { payload, timestamp } = JSON.parse(raw)
    if (typeof timestamp !== 'number' || Date.now() - timestamp > ABL_CACHE_TTL_MS) return null
    // A cache entry written by an older/buggier build must not poison the page.
    return isValidPayload(payload) ? payload : null
  } catch { return null }
}

function writeCache(payload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ payload, timestamp: Date.now() }))
  } catch { /* sessionStorage unavailable — degrade gracefully */ }
}

export function useABLData() {
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Every call to fetchData takes a new request id; only the call holding the
  // latest id may touch state. Unmount and refetch both retire the previous id
  // (and abort its in-flight fetch), so late or out-of-order responses are
  // dropped instead of overwriting newer data.
  const latestRequest = useRef(0)
  const inFlight      = useRef(null)

  const cancelInFlight = useCallback(() => {
    latestRequest.current += 1
    inFlight.current?.abort()
    inFlight.current = null
  }, [])

  const fetchData = useCallback(async (bypassCache = false) => {
    cancelInFlight()
    const requestId = latestRequest.current
    const isCurrent = () => requestId === latestRequest.current

    if (!ABL_API_URL) {
      console.warn('[ABL] VITE_ABL_API_URL is not set. Add it to .env.development — see docs/ABL-APPSCRIPT-SETUP-GUIDE.md')
      setError(ablHome.errors.notConfigured)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (!bypassCache) {
      const cached = readCache()
      if (cached) {
        setData(cached)
        setLastUpdated(cached.lastUpdated)
        setLoading(false)
        return
      }
    }

    const controller = new AbortController()
    inFlight.current = controller
    try {
      const timeout = setTimeout(() => controller.abort(), 10_000)
      let res
      try {
        res = await fetch(ABL_API_URL, { signal: controller.signal })
      } finally {
        // Cleared on rejection too; body reading below is not under the timeout.
        clearTimeout(timeout)
      }

      if (!res.ok) throw loadFailure(`http-${res.status}`)
      const json = await res.json()

      if (!isCurrent()) return
      if (!json || !json.success) throw loadFailure('api-error')
      if (!isValidPayload(json)) throw loadFailure('malformed-response')

      writeCache(json)
      setData(json)
      setLastUpdated(json.lastUpdated)
    } catch (err) {
      if (!isCurrent()) return
      const timedOut = err.name === 'AbortError'
      console.warn('[ABL] Resource load failed:', timedOut ? 'timeout' : (err.kind ?? err.name))
      setError(timedOut ? ablHome.errors.timeout : ablHome.errors.generic)
    } finally {
      if (isCurrent()) {
        inFlight.current = null
        setLoading(false)
      }
    }
  }, [cancelInFlight])

  useEffect(() => {
    fetchData()
    return cancelInFlight
  }, [fetchData, cancelInFlight])

  const refetch = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* sessionStorage unavailable */ }
    fetchData(true)
  }, [fetchData])

  const allResources = data
    ? data.tabs.flatMap(tab => (data.resources[tab] || []).map(r => ({ ...r, tab })))
    : []

  return { data, allResources, loading, error, lastUpdated, refetch }
}
