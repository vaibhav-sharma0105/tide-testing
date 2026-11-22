import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { splitFigure, formatFigure } from '../../utils/figures'

// A figure written as text — "52,500+", "12 yrs", "10,00,000 lives targeted", "2014" — whose number
// counts up the first time it comes into view; the words around it stay as they are. Digit grouping
// follows the original: written with commas → Indian grouping (10,00,000), without → none (2014).
// Text without a number is shown unchanged. Screen readers get the final text at once; with
// "reduce motion" the final text is simply shown.

export default function CountUpText({ text, duration = 1.6, delay = 0.15, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const parts = splitFigure(text)
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!parts || reduce || !inView) return undefined
    const controls = animate(0, parts.value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduce, parts?.value, duration, delay]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!parts) return <span className={className}>{text}</span>
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <span aria-hidden="true">{parts.before}{formatFigure(reduce ? parts.value : n, parts.grouped)}{parts.after}</span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
