import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

// A number that counts up from 0 the first time it comes into view (ease-out, so it settles
// rather than stops). Screen readers get the final number at once (the moving digits are hidden
// from them); with "reduce motion" the final number is simply shown.
export default function CountUp({ value, duration = 1.2, delay = 0.2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (reduce || !inView) return undefined
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduce, value, duration, delay])

  return (
    <span ref={ref} className="relative inline-block tabular-nums">
      <span aria-hidden="true">{reduce ? value : shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
