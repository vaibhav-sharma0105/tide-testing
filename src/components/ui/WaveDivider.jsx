import { motion, useReducedMotion } from 'framer-motion'

// A soft wave that curves the section above into the one below it.
// Colour comes from the text colour (`text-tide-bg` = the section above).
// The wave drifts by exactly one period, so the loop never shows a seam.
export default function WaveDivider({ className = '' }) {
  const reduce = useReducedMotion()
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-5 overflow-hidden ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 1600 20"
        preserveAspectRatio="none"
        className="block h-5 fill-current"
        style={{ width: '200%' }}
        animate={reduce ? undefined : { x: ['0%', '-25%'] }}
        transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
      >
        <path d="M0 10 Q100 0 200 10 T400 10 T600 10 T800 10 T1000 10 T1200 10 T1400 10 T1600 10 V0 H0 Z" />
      </motion.svg>
    </div>
  )
}
