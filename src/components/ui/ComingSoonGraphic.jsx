import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The coming-soon illustration: three blocks drop in and settle (spring
 * physics), then the scene keeps gently alive for as long as the page is open.
 *
 * Two layers, both endless:
 *  - Ambient loops — clouds, rising dust motes and the flag's cloth ripple.
 *    Every loop has its own period (none divide each other evenly), so the
 *    combined picture never visibly repeats.
 *  - Random events — every few seconds a timer picks a gust of wind (the flag
 *    stretches and snaps back, a breeze streak crosses) or a nudge (one block
 *    rocks and rings down like a real stacked object). Gaps and targets are
 *    random; events are skipped while the tab is hidden.
 *
 * Visitors who ask for reduced motion get the finished, static scene.
 * Decorative only (aria-hidden), so it carries no text.
 */

const BLOCKS = [
  { x: 35, y: 80, width: 70, fill: '#D4EBF8', delay: 0 },
  { x: 45, y: 58, width: 50, fill: '#A8D4F0', delay: 0.14 },
  { x: 55, y: 36, width: 30, fill: '#1E6BAA', delay: 0.28 },
]

const FLAG_SHAPES = [
  'M70,16 C78,17 85,20 92,22 C85,24 78,27 70,28 Z',
  'M70,16 C78,14 85,22 92,20 C85,26 78,25 70,28 Z',
  'M70,16 C78,18 85,19 92,22 C85,23 78,28 70,28 Z',
  'M70,16 C78,17 85,20 92,22 C85,24 78,27 70,28 Z',
]

const MOTES = [
  { x: 48, size: 1.4, rise: 52, duration: 9.5, delay: 0.5, sway: 4 },
  { x: 92, size: 1.1, rise: 60, duration: 12.5, delay: 3.2, sway: -5 },
  { x: 72, size: 1.6, rise: 46, duration: 7.5, delay: 6, sway: 3 },
]

const CLOUDS = [
  { y: 9, scale: 1, from: -34, to: 176, duration: 47, opacity: 0.55 },
  { y: 64, scale: 0.7, from: 176, to: -34, duration: 63, opacity: 0.4 },
]

const MIN_GAP_MS = 3500
const GAP_SPREAD_MS = 5500

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const randomInt = (n) => Math.floor(Math.random() * n)

export default function ComingSoonGraphic() {
  const [reduced] = useState(prefersReducedMotion)
  const [gusting, setGusting] = useState(false)
  const [streak, setStreak] = useState(null)
  const [nudged, setNudged] = useState(null)
  const timers = useRef(new Set())
  const eventId = useRef(0)

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])

  const fireEvent = useCallback(() => {
    if (document.hidden) return
    eventId.current += 1
    if (Math.random() < 0.55) {
      setGusting(true)
      setStreak({ id: eventId.current, y: 12 + randomInt(26) })
      later(() => setGusting(false), 650)
    } else {
      setNudged(randomInt(BLOCKS.length))
      later(() => setNudged(null), 130)
    }
  }, [later])

  useEffect(() => {
    if (reduced) return undefined
    const pending = timers.current
    const schedule = () => later(() => { fireEvent(); schedule() }, MIN_GAP_MS + Math.random() * GAP_SPREAD_MS)
    schedule()
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [reduced, fireEvent, later])

  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" className="mx-auto mb-6" aria-hidden="true">
      {!reduced && CLOUDS.map((c) => (
        <motion.g
          key={c.y}
          initial={{ x: c.from }}
          animate={{ x: c.to }}
          transition={{ duration: c.duration, repeat: Infinity, ease: 'linear' }}
          opacity={c.opacity}
        >
          <g transform={`translate(0 ${c.y}) scale(${c.scale})`} fill="#D4EBF8">
            <ellipse cx="10" cy="8" rx="10" ry="4.5" />
            <ellipse cx="19" cy="5" rx="7" ry="4.5" />
            <ellipse cx="26" cy="8" rx="8" ry="3.8" />
          </g>
        </motion.g>
      ))}

      {!reduced && MOTES.map((m) => (
        <motion.circle
          key={m.x}
          cx={m.x}
          cy="100"
          r={m.size}
          fill="#A8D4F0"
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{ opacity: [0, 0.7, 0], y: -m.rise, x: [0, m.sway, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      {BLOCKS.map((b, i) => (
        <motion.rect
          key={b.x}
          x={b.x}
          y={b.y}
          width={b.width}
          height="18"
          rx="3"
          fill={b.fill}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
          initial={{ opacity: 0, y: -18, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: nudged === i ? 1.3 : 0 }}
          transition={{
            opacity: { duration: 0.3, delay: b.delay },
            y: { type: 'spring', stiffness: 180, damping: 20, mass: 0.55, delay: b.delay },
            // Quick push, then an under-damped spring back: it overshoots and rings down.
            rotate: nudged === i
              ? { duration: 0.12, ease: 'easeOut' }
              : { type: 'spring', stiffness: 260, damping: 4.5, mass: 0.5 },
          }}
        />
      ))}

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }}>
        <line x1="70" y1="36" x2="70" y2="16" stroke="#15538A" strokeWidth="2" strokeLinecap="round" />
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
          animate={gusting ? { scaleX: 1.14, rotate: -4 } : { scaleX: 1, rotate: 0 }}
          transition={gusting
            ? { duration: 0.3, ease: 'easeOut' }
            : { type: 'spring', stiffness: 150, damping: 5, mass: 0.6 }}
        >
          <motion.path
            fill="#F59E0B"
            initial={{ d: FLAG_SHAPES[0] }}
            animate={{ d: reduced ? FLAG_SHAPES[0] : FLAG_SHAPES }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.62, 1] }}
          />
        </motion.g>

        {!reduced && (
          <>
            <motion.path
              d="M100 17 C107 15 114 17 121 15"
              stroke="#A8D4F0"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: [0, 0.6, 0], x: [-3, 1, 5] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }}
            />
            <motion.path
              d="M102 28 C108 26 114 28 119 27"
              stroke="#D4EBF8"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: [0, 0.45, 0], x: [-4, 0, 4] }}
              transition={{ duration: 4.6, delay: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }}
            />
          </>
        )}

        {streak && (
          <motion.path
            key={streak.id}
            d="M92 0 C100 -2 108 2 118 0"
            stroke="#A8D4F0"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ opacity: 0, x: -14, y: streak.y }}
            animate={{ opacity: [0, 0.75, 0], x: [-14, 4, 26], y: streak.y }}
            transition={{ duration: 1.5, ease: 'easeOut', times: [0, 0.4, 1] }}
          />
        )}
      </motion.g>
    </svg>
  )
}
