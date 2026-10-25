import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Button from '../components/ui/Button'
import ComingSoonGraphic from '../components/ui/ComingSoonGraphic'
import PageHero from '../components/ui/PageHero'
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
        <title>{defaults.seoTitleTemplate.replace('{badge}', () => copy.badge)}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* PageHero gives this page the same dark top section every other inner
          page has — the header assumes a dark hero sits behind it until the
          visitor scrolls, so a page without one renders the header invisible
          (white text on the white page background) on first load. */}
      <PageHero badge={copy.badge} title={copy.title} />

      <section className="py-16 md:py-20 bg-tide-bg px-4">
        <div className="max-w-lg w-full mx-auto text-center">
          <ComingSoonGraphic />

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
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
