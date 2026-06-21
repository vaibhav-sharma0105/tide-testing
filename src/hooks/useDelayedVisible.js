import { useEffect, useState } from 'react'

/**
 * Returns true only if `active` has stayed true for longer than `delayMs`.
 * Use this to gate a loading animation so it never flashes on a load that
 * resolves quickly — showing a rich animation for 50ms reads as jank, not
 * polish. If `active` becomes false before the delay elapses, this never
 * flips to true at all.
 */
export function useDelayedVisible(active, delayMs = 200) {
  const [visible, setVisible] = useState(false)
  const [prevActive, setPrevActive] = useState(active)

  // Reset during render when `active` flips false, not inside the effect
  // below — avoids a synchronous setState-in-effect (which would otherwise
  // trigger a cascading extra render on every transition to inactive).
  if (active !== prevActive) {
    setPrevActive(active)
    if (!active) setVisible(false)
  }

  useEffect(() => {
    if (!active) return undefined
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  return active && visible
}
