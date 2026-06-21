import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Button from '../components/ui/Button'
import defaults from '../data/coming-soon.json'

/**
 * Reusable placeholder for a planned route/section that doesn't have a
 * real page built yet. Drop <Route path="/whatever" element={<ComingSoon />} />
 * wherever a future section needs one — text falls back to
 * content/shared/coming-soon.yaml, or pass props to override per use:
 * <ComingSoon title="..." message="..." />
 */
export default function ComingSoon({ badge, title, message, ctaLabel, ctaHref }) {
  const copy = {
    badge: badge ?? defaults.badge,
    title: title ?? defaults.title,
    message: message ?? defaults.message,
    ctaLabel: ctaLabel ?? defaults.ctaLabel,
    ctaHref: ctaHref ?? defaults.ctaHref,
  }

  return (
    <>
      <Helmet>
        <title>{copy.badge} — TIDE Foundation</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center bg-tide-bg px-4">
        <div className="max-w-lg w-full text-center">
          <svg width="140" height="120" viewBox="0 0 140 120" fill="none" className="mx-auto mb-6" aria-hidden="true">
            {/* Foundation blocks, stacking — "building" something */}
            <motion.rect x="35" y="80" width="70" height="18" rx="3" fill="#D4EBF8"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} />
            <motion.rect x="45" y="58" width="50" height="18" rx="3" fill="#A8D4F0"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} />
            <motion.rect x="55" y="36" width="30" height="18" rx="3" fill="#1E6BAA"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} />
            {/* Crane / flag on top, gentle sway */}
            <motion.g
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }}
              style={{ transformOrigin: '70px 36px' }}
            >
              <line x1="70" y1="36" x2="70" y2="16" stroke="#15538A" strokeWidth="2" strokeLinecap="round" />
              <motion.path
                d="M70,16 L92,22 L70,28 Z" fill="#F59E0B"
                animate={{ rotate: [0, 3, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '70px 22px' }}
              />
            </motion.g>
          </svg>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-accent-faint text-accent-dark border border-accent/20">
              {copy.badge}
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-tide-text mb-3">
              {copy.title}
            </h1>
            <p className="font-body text-tide-muted leading-relaxed mb-8 max-w-md mx-auto">
              {copy.message}
            </p>
            <Button to={copy.ctaHref} variant="accent">{copy.ctaLabel}</Button>
          </motion.div>
        </div>
      </section>
    </>
  )
}
