import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Button from '../components/ui/Button'
import data from '../data/not-found.json'

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>{data.badge} — TIDE Foundation</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center bg-tide-bg px-4">
        <div className="max-w-lg w-full text-center">
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto mb-6" aria-hidden="true">
            {/* Dotted flight path */}
            <motion.path
              d="M10,95 Q50,90 75,70 T120,35"
              stroke="#D4EBF8" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* Paper airplane */}
            <motion.g
              initial={{ x: -8, y: 8, opacity: 0, rotate: -8 }}
              animate={{ x: 0, y: [0, -4, 0], opacity: 1, rotate: -8 }}
              transition={{
                opacity: { duration: 0.5, delay: 0.4 },
                x: { duration: 0.5, delay: 0.4 },
                y: { duration: 2.4, delay: 0.9, repeat: Infinity, ease: 'easeInOut' },
              }}
              style={{ transformOrigin: '125px 30px' }}
            >
              <path
                d="M125,18 L150,30 L132,33 L125,46 L120,32 Z"
                fill="#1E6BAA" stroke="#15538A" strokeWidth="1.5" strokeLinejoin="round"
                transform="translate(-1, 0) rotate(35 130 30)"
              />
            </motion.g>
          </svg>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-primary-light text-primary border border-primary/20">
              {data.badge}
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-tide-text mb-3">
              {data.title}
            </h1>
            <p className="font-body text-tide-muted leading-relaxed mb-8 max-w-md mx-auto">
              {data.message}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button to={data.ctaHref} variant="accent">{data.ctaLabel}</Button>
              <Button to={data.secondaryHref} variant="secondary">{data.secondaryLabel}</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
