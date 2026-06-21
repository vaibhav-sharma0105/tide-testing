import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Button from '../components/ui/Button'
import PageHero from '../components/ui/PageHero'
import data from '../data/not-found.json'

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>{`${data.badge} — TIDE Foundation`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* PageHero gives this page the same dark top section every other inner
          page has — the header assumes a dark hero sits behind it until the
          visitor scrolls, so a page without one renders the header invisible
          (white text on the white page background) on first load. */}
      <PageHero badge={data.badge} title={data.title} />

      <section className="py-16 md:py-20 bg-tide-bg px-4">
        <div className="max-w-lg w-full mx-auto text-center">
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto mb-6" aria-hidden="true">
            {/* Dotted flight path */}
            <motion.path
              d="M10,95 Q50,90 75,70 T120,35"
              stroke="#D4EBF8" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* Paper airplane — nose at (122,32), designed pointing right at
                rest, then rotated -35deg around that same point so the nose
                ends up aimed up-and-right, matching the flight path's end. */}
            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.4 },
                y: { duration: 2.4, delay: 0.9, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <path
                d="M122,32 L104,19 L116,29 L104,46 Z"
                fill="#1E6BAA" stroke="#15538A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
                transform="rotate(-35 122 32)"
              />
            </motion.g>
          </svg>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
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
