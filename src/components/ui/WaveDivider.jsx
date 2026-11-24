import { motion, useReducedMotion } from 'framer-motion'
import { LOOP_BUDGET_MS } from '../../utils/motionPresets'

// One period (25% of the doubled width) took 16 s; at the same speed the wave drifts for 5 s and stops
// (WCAG 2.2.2: motion that starts by itself stops within five seconds).
const DRIFT = `-${(25 * LOOP_BUDGET_MS / 16000).toFixed(3)}%`

// A soft wave that curves the section above into the one below it.
// Colour comes from the text colour (`text-tide-bg` = the section above).
// The wave drifts briefly when the page opens, then rests.
export default function WaveDivider({ className = '' }) {
  const reduce = useReducedMotion()
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-5 overflow-hidden ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 1600 20"
        preserveAspectRatio="none"
        className="block h-5 fill-current"
        style={{ width: '200%' }}
        animate={reduce ? undefined : { x: ['0%', DRIFT] }}
        transition={{ duration: LOOP_BUDGET_MS / 1000, ease: 'linear' }}
      >
        <path d="M0 10 Q100 0 200 10 T400 10 T600 10 T800 10 T1000 10 T1200 10 T1400 10 T1600 10 V0 H0 Z" />
      </motion.svg>
    </div>
  )
}
