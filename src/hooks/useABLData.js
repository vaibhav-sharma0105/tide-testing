import { useState, useEffect, useCallback } from 'react'
import { ABL_API_URL, ABL_CACHE_TTL_MS } from '../config/abl'

if (!ABL_API_URL) {
  console.error('[ABL] VITE_ABL_API_URL is not set. Add it to .env.development — see docs/ABL-APPSCRIPT-SETUP-GUIDE.md')
}

const STORAGE_KEY = 'abl_api_cache_v2'

function readCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { payload, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > ABL_CACHE_TTL_MS) return null
    return payload
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

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!ABL_API_URL) {
      setError('API not configured. Add VITE_ABL_API_URL to your .env.development file.')
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

    try {
      const controller = new AbortController()
      const timeout    = setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(ABL_API_URL, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      if (!json.success) throw new Error(json.error || 'API returned success: false')

      writeCache(json)
      setData(json)
      setLastUpdated(json.lastUpdated)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError('Failed to load resources. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const refetch = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    fetchData(true)
  }, [fetchData])

  const allResources = data
    ? data.tabs.flatMap(tab => (data.resources[tab] || []).map(r => ({ ...r, tab })))
    : []

  return { data, allResources, loading, error, lastUpdated, refetch }
}
