import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import loaderData from '../../data/loader.json'

const MESSAGE_INTERVAL_MS = 3200

/**
 * An open book with a sprout growing from its spine — education and growth,
 * literally TIDE's mission ("Together in Development & Education") rather
 * than a generic spinner. Draws itself in once, then holds a gentle,
 * looping sway so it reads as "working," not "stuck."
 *
 * Callers should gate this behind useDelayedVisible — it's deliberately
 * not self-throttling, so it can be reused anywhere a "still loading"
 * state needs a visual without every caller re-implementing the delay.
 */
export default function CreativeLoader({ className = '' }) {
  const messages = loaderData?.messages?.length ? loaderData.messages : ['Loading…']
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (messages.length <= 1) return
    const id = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), MESSAGE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [messages.length])

  return (
    <div className={`flex flex-col items-center gap-5 ${className}`} role="status" aria-live="polite">
      <svg width="96" height="96" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        {/* Left page */}
        <motion.rect
          x="20" y="40" width="34" height="46" rx="3"
          transform="rotate(-8 54 40)"
          stroke="#1E6BAA" strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Right page */}
        <motion.rect
          x="66" y="40" width="34" height="46" rx="3"
          transform="rotate(8 66 40)"
          stroke="#1E6BAA" strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
        {/* Spine */}
        <motion.line
          x1="60" y1="38" x2="60" y2="87"
          stroke="#15538A" strokeWidth="2.5" strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
        {/* Sprout stem */}
        <motion.path
          d="M60,38 C60,28 60,22 60,16"
          stroke="#5FA777" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
        />
        {/* Leaves */}
        <motion.ellipse
          cx="52" cy="22" rx="7" ry="4" fill="#5FA777"
          transform="rotate(-30 52 22)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: [-30, -22, -30] }}
          transition={{
            scale: { duration: 0.3, delay: 1.0 },
            opacity: { duration: 0.3, delay: 1.0 },
            rotate: { duration: 2.4, delay: 1.3, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '60px 18px' }}
        />
        <motion.ellipse
          cx="68" cy="18" rx="7" ry="4" fill="#7FBF94"
          transform="rotate(28 68 18)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: [28, 20, 28] }}
          transition={{
            scale: { duration: 0.3, delay: 1.15 },
            opacity: { duration: 0.3, delay: 1.15 },
            rotate: { duration: 2.4, delay: 1.45, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '60px 16px' }}
        />
      </svg>

      <div className="h-5 px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="font-body text-sm text-tide-muted"
          >
            {messages[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
