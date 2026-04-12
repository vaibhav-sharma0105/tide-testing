import { useEffect, useRef, useState } from 'react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

function parseValue(val) {
  const str = String(val)
  const suffix = str.replace(/[0-9,]/g, '')
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10)
  return { num, suffix }
}

export default function AnimatedCounter({ value, label, duration = 2000, light = false, numClassName = '' }) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.3 })
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)
  const { num, suffix } = parseValue(value)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const end = num
    const increment = end / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, num, duration])

  const defaultNumCls = `font-display text-4xl md:text-5xl font-bold leading-none ${light ? 'text-white' : 'text-primary'}`

  return (
    <div ref={ref} className="text-center group">
      <div className={numClassName || defaultNumCls}>
        {isVisible ? count.toLocaleString() : '0'}{suffix}
      </div>
      {label && (
        <div className={`mt-2.5 text-xs font-body font-semibold uppercase tracking-widest ${light ? 'text-white/80' : 'text-tide-muted'}`}>
          {label}
        </div>
      )}
    </div>
  )
}
