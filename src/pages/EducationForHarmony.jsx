import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, Mail } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import SectionHeader from '../components/ui/SectionHeader'
import data from '../data/education-for-harmony.json'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function EducationForHarmony() {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{data.meta.seoTitle}</title>
        <meta name="description" content={data.meta.seoDescription} />
      </Helmet>

      <PageHero
        badge={data.meta.badge}
        title={t('efh.title', data.meta.title)}
        subtitle={t('efh.tagline', data.meta.tagline)}
        gradient
      />

      {/* Intro */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fadeUp()}>
              <p className="font-body text-lg text-tide-muted leading-relaxed">
                {t('efh.intro.body', data.intro.body)}
              </p>
            </motion.div>
            <motion.div {...fadeUp(0.1)}>
              <ul className="space-y-3">
                {data.intro.aims.map((aim, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-tide-text leading-snug">{aim}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CARES Framework */}
      <section className="section-padding bg-navy">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-white/15 text-white/90 border border-white/25">
              {t('efh.cares.badge', data.cares.sectionBadge)}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
              {t('efh.cares.title', data.cares.title)}
            </h2>
            <p className="font-body text-white/70 max-w-2xl mx-auto">
              {t('efh.cares.subtitle', data.cares.subtitle)}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.cares.dimensions.map((dim, i) => (
              <motion.div key={dim.key} {...fadeUp(i * 0.08)}
                className="bg-white/8 border border-white/15 rounded-2xl p-6 flex flex-col gap-3 hover:bg-white/12 transition-colors duration-300"
              >
                <div className="font-display text-5xl font-bold text-accent leading-none">{dim.key}</div>
                <div className="font-display text-base font-semibold text-white">{dim.name}</div>
                <p className="font-body text-xs text-white/65 leading-relaxed">{dim.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section-padding bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="mb-12">
            <SectionHeader
              badge={t('efh.programs.badge', data.programs.sectionBadge)}
              title={t('efh.programs.title', data.programs.title)}
              subtitle={t('efh.programs.subtitle', data.programs.subtitle)}
            />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.programs.items.map((prog, i) => (
              <motion.div key={prog.name} {...fadeUp(i * 0.07)}
                className="bg-tide-bg rounded-2xl border border-tide-border p-6 flex flex-col gap-3"
              >
                <h3 className="font-display text-base font-semibold text-tide-text leading-snug">{prog.name}</h3>
                <p className="font-body text-sm text-tide-muted leading-relaxed flex-1">{prog.desc}</p>
                {prog.impact && (
                  <div className="mt-auto pt-3 border-t border-tide-border">
                    <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent-deeper text-[11px] font-body font-bold uppercase tracking-wide">
                      {prog.impact}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <span className="badge-primary mb-4 mx-auto">{t('efh.video.badge', data.video.sectionBadge)}</span>
            <h2 className="font-display text-2xl font-semibold text-tide-text">
              {t('efh.video.title', data.video.title)}
            </h2>
          </motion.div>
          <motion.div {...fadeUp(0.1)}
            className="relative rounded-2xl overflow-hidden border border-tide-border shadow-card"
            style={{ paddingBottom: '56.25%', height: 0 }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${data.video.youtubeId}`}
              title={data.video.caption}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      </section>

      {/* Collaborate CTA */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <span className="badge-primary mb-4 mx-auto">{t('efh.collaborate.badge', data.collaborate.sectionBadge)}</span>
            <h2 className="font-display text-2xl font-semibold text-tide-text mb-4">
              {t('efh.collaborate.title', data.collaborate.title)}
            </h2>
            <p className="font-body text-tide-muted mb-8 leading-relaxed">
              {t('efh.collaborate.body', data.collaborate.body)}
            </p>
            <a
              href={`mailto:${data.collaborate.ctaEmail}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t('efh.collaborate.ctaLabel', data.collaborate.ctaLabel)}
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}
