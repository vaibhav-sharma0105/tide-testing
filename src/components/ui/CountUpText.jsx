import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { splitFigure, formatFigure } from '../../utils/figures'

// The site's ONE count-up (2026-11-24 motion rules): a figure written as text — "52,500+", "161",
// "10,00,000 lives targeted" — whose number settles into place the first time it comes into view.
// Rules (keep them; they are why it reads as polish, not as loading):
// - at most one per page, and only for the page's main figure; never a year, a phone number, a
//   small number, or a number inside a sentence — show those as plain text;
// - it counts from FROM (80%) of the value, not from 0, for about 0.9s, so the page never shows a
//   wrong figure such as "0 lives impacted";
// - the final text reserves the width, so nothing around it moves while it counts;
// - numbers below MIN are simply shown (counting 8 → 10 looks like a glitch).
// Digit grouping follows the original: written with commas → Indian grouping (10,00,000), without
// → none. Text without a number is shown unchanged. Screen readers get the final text at once;
// with "reduce motion" the final text is simply shown.

const FROM = 0.8
const MIN = 100

export default function CountUpText({ text, duration = 0.9, delay = 0.1, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -32px 0px' })
  const reduce = useReducedMotion()
  const parts = splitFigure(String(text))
  const counts = !!parts && parts.value >= MIN && !reduce
  const start = parts ? Math.round(parts.value * FROM) : 0
  const [n, setN] = useState(start)

  useEffect(() => {
    if (!counts || !inView) return undefined
    const controls = animate(start, parts.value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, counts, start, parts?.value, duration, delay])

  if (!parts) return <span className={className}>{text}</span>
  const final = `${parts.before}${formatFigure(parts.value, parts.grouped)}${parts.after}`
  if (!counts) return <span className={`tabular-nums ${className}`}>{text}</span>
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {/* The final text holds the width; the counting text sits on top of it. */}
      <span aria-hidden="true" className="relative inline-block">
        <span className="invisible">{final}</span>
        <span className="absolute inset-0 whitespace-nowrap">{parts.before}{formatFigure(n, parts.grouped)}{parts.after}</span>
      </span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
