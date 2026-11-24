import { useEffect, useState } from 'react'
import { LOOP_BUDGET_MS } from '../utils/motionPresets'

/**
 * WCAG 2.2.2 (Pause, Stop, Hide): decorative motion that starts by itself must stop within five
 * seconds unless the visitor can pause it. This returns true from the moment `active` first becomes
 * true (e.g. the element came into view) until LOOP_BUDGET_MS later, then false for good, so a
 * looping animation plays for a few seconds and comes to rest:
 *
 *   const looping = useLoopWindow(inView)
 *   <motion.div animate={looping ? { y: [0, -6, 0] } : { y: 0 }} transition={{ repeat: Infinity, … }} />
 *
 * Reduced motion is handled by the caller as before (these loops don't start at all).
 */
export function useLoopWindow(active = true) {
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  if (active && !started) setStarted(true)   // React's "adjust state while rendering" pattern
  useEffect(() => {
    if (!started) return undefined
    const id = setTimeout(() => setDone(true), LOOP_BUDGET_MS)
    return () => clearTimeout(id)
  }, [started])
  return started && !done
}
