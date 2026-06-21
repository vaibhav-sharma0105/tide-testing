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
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" className="mx-auto mb-6" aria-hidden="true">
            <defs>
              <linearGradient id="kiteBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4FA8DE" />
                <stop offset="55%" stopColor="#1E6BAA" />
                <stop offset="100%" stopColor="#103E63" />
              </linearGradient>
              <linearGradient id="kiteAmber" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDC768" />
                <stop offset="55%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <filter id="kiteShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#0D2137" floodOpacity="0.28" />
              </filter>
            </defs>

            {/* Dotted flight path */}
            <motion.path
              d="M10,95 Q50,90 75,70 T120,35"
              stroke="#D4EBF8" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* A kite that's flown off — kite-flying (Uttarayan) is a major
                Gujarati tradition, giving this real local resonance beyond a
                generic "lost" icon. Diamond frame centered at (118,31). The
                tail sways on its own, faster and wider than the body, for a
                layered "whipping in the wind" feel rather than one stiff,
                uniform sway. */}
            <motion.g
              initial={{ opacity: 0, y: 8, rotate: -6 }}
              animate={{ opacity: 1, y: [0, -6, 0], rotate: [-8, 8, -8] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.4 },
                y: { duration: 2.4, delay: 0.9, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 3, delay: 0.9, repeat: Infinity, ease: 'easeInOut' },
              }}
              style={{ transformOrigin: '118px 31px' }}
              filter="url(#kiteShadow)"
            >
              {/* tail, with its own independent flutter */}
              <motion.g
                initial={{ rotate: -10 }}
                animate={{ rotate: [-10, 14, -10] }}
                transition={{ duration: 1.7, delay: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '118px 49px' }}
              >
                <path d="M118,49 Q110,58 114,68 Q118,76 111,84"
                  stroke="#A8D4F0" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="113" cy="60" r="3.2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                <circle cx="116" cy="74" r="3.2" fill="#1E6BAA" stroke="#103E63" strokeWidth="1" />
              </motion.g>
              {/* diamond frame — two-tone, gradient-shaded halves */}
              <path d="M118,13 L106,31 L118,49 Z" fill="url(#kiteBlue)" stroke="#0D3A5F" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M118,13 L130,31 L118,49 Z" fill="url(#kiteAmber)" stroke="#92400E" strokeWidth="1.5" strokeLinejoin="round" />
              {/* sheen highlights */}
              <line x1="118" y1="13" x2="118" y2="49" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85" />
              <line x1="106" y1="31" x2="130" y2="31" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.6" />
              <path d="M118,16 L112,29" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
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
