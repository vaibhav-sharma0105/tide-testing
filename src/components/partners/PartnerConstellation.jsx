import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { getPartnerLogo } from '../../utils/partnerPhotos'

// The banner graphic: the highest-priority partners' logos as discs joined by faint lines — a
// network, not a list. Being up here is how the most important partners are honoured, without
// any label saying so. The biggest disc (centre) is the first partner in priority order.
// Decorative only (aria-hidden): every partner is named in the list below.
// The links are threads, not wires: each one curves gently (alternating sides), is brightest in the
// middle and fades out into the discs, and now and then a small point of light travels along it from
// the centre outwards — work passing between partners.
// Motion: discs pop in one after another, the threads draw themselves, then each disc floats gently
// on its own rhythm and the lights travel while the banner is on screen; "reduce motion" keeps
// everything still (MotionConfig in App.jsx; the travelling lights are not drawn at all).

// Disc centres (% of the box) and diameters (px at lg; scaled down on smaller screens), biggest first.
const SLOTS = [
  { x: 50, y: 50, s: 1 },
  { x: 17, y: 27, s: 0.74 },
  { x: 82, y: 24, s: 0.78 },
  { x: 85, y: 72, s: 0.7 },
  { x: 19, y: 75, s: 0.72 },
  { x: 50, y: 10, s: 0.54 },
  { x: 52, y: 91, s: 0.56 },
  { x: 3, y: 51, s: 0.46 },
  { x: 97, y: 48, s: 0.46 },
]
// The SVG uses the box's own shape (10:9), so curves are not stretched: y in SVG units = y% × 0.9.
const VB_H = 90
const pt = (slot) => ({ x: slot.x, y: slot.y * (VB_H / 100) })

/** A gentle curve from the centre disc to slot `i` (bending left / right in turn). */
function threadPath(i) {
  const a = pt(SLOTS[0])
  const b = pt(SLOTS[i])
  const dx = b.x - a.x
  const dy = b.y - a.y
  const bend = (i % 2 ? 1 : -1) * 0.22
  const cx = a.x + dx / 2 - dy * bend
  const cy = a.y + dy / 2 + dx * bend
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, a, b }
}

export default function PartnerConstellation({ partners }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' })
  const items = partners.slice(0, SLOTS.length).map((p, i) => ({ p, slot: SLOTS[i], logo: getPartnerLogo(p.id) }))
  const reduce = useReducedMotion()
  const threads = items.slice(1).map((_, k) => ({ i: k + 1, ...threadPath(k + 1) }))

  return (
    <div ref={ref} aria-hidden="true" className="relative mx-auto hidden aspect-[10/9] w-full max-w-[460px] sm:block">
      {/* Soft glow behind the centre disc. */}
      <div className="absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 100 ${VB_H}`}>
        <defs>
          {threads.map(({ i, a, b }) => (
            // Bright in the middle, gone at both ends: the thread seems to grow out of the discs.
            <linearGradient key={i} id={`partner-thread-${i}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
              <stop offset="0.12" stopColor="#D4EBF8" stopOpacity="0" />
              <stop offset="0.5" stopColor="#D4EBF8" stopOpacity="0.38" />
              <stop offset="0.88" stopColor="#D4EBF8" stopOpacity="0" />
            </linearGradient>
          ))}
          <radialGradient id="partner-spark">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.4" stopColor="#D4EBF8" stopOpacity="0.6" />
            <stop offset="1" stopColor="#D4EBF8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {threads.map(({ i, d }, n) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={`url(#partner-thread-${i})`}
            strokeWidth="0.45"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.6 + n * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        {!reduce && inView && threads.map(({ i, d }, n) => (
          // A soft point of light that travels outwards now and then (each thread on its own rhythm).
          <circle key={`spark-${i}`} r="1.6" fill="url(#partner-spark)" opacity="0">
            <animateMotion dur={`${3.2 + (n % 3) * 0.7}s`} begin={`${2 + n * 1.3}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.75;1" dur={`${3.2 + (n % 3) * 0.7}s`} begin={`${2 + n * 1.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
      {items.map(({ p, slot, logo }, i) => (
        <motion.div
          key={p.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.s * 30}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.25 + i * 0.08 }}
        >
          <motion.div
            className="relative aspect-square w-full overflow-hidden rounded-full bg-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/40"
            animate={inView ? { y: [0, i % 2 ? 7 : -7, 0] } : { y: 0 }}
            transition={{ duration: 5.5 + (i % 3) * 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
          >
            {logo && (
              <img
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt=""
                decoding="async"
                data-no-placeholder
                className="absolute inset-[16%] h-[68%] w-[68%] object-contain"
              />
            )}
          </motion.div>
          {i === 0 && (
            // A slow ring that breathes out from the centre disc.
            <motion.span
              className="absolute inset-0 rounded-full ring-2 ring-white/30"
              animate={inView ? { scale: [1, 1.35], opacity: [0.6, 0] } : { opacity: 0 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}
