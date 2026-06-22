import { motion, AnimatePresence } from 'framer-motion'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import Lightbox from '../../components/ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import data from '../../data/projects-completed.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

const PROGRAM_COLORS = {
  violet: { bg: 'bg-violet-50', accent: 'from-violet-600 to-purple-700' },
  emerald: { bg: 'bg-emerald-50', accent: 'from-emerald-600 to-teal-700' },
  blue:   { bg: 'bg-blue-50',   accent: 'from-blue-600 to-sky-700' },
  amber:  { bg: 'bg-amber-50',  accent: 'from-amber-500 to-orange-600' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function CompletEd() {
  const { t } = useTranslation()
  const brochure = useLightbox(data.moiBrochure.pages.length)
  const fellows  = useLightbox(data.scfProgram.fellows.length)

  return (
    <>
      <SeoHead title={data.meta.seoTitle} description={data.meta.seoDescription} path="/projects/completed" noindex />
      <PageHero badge={data.meta.badge} title={t('projects.completed.title', data.meta.title)} subtitle={t('projects.completed.tagline', data.meta.tagline)} gradient />

      {/* Stats */}
      <section className="py-14 bg-white border-b border-tide-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {data.stats.map((s) => (
              <AnimatedCounter key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="max-w-2xl mb-16">
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.overview.title}</h2>
            <p className="text-tide-muted font-body leading-relaxed">{t('projects.completed.overview', data.overview.body)}</p>
          </motion.div>

          <SectionHeader badge={data.programs.sectionBadge} title={data.programs.sectionTitle} />
          <div className="grid sm:grid-cols-2 gap-6">
            {data.programs.items.map((p, i) => {
              const colors = PROGRAM_COLORS[p.colorKey] || { bg: 'bg-tide-subtle', accent: 'from-primary to-primary' }
              return (
                <motion.div
                  key={p.key}
                  {...fadeUp(i * 0.1)}
                  className={`group ${colors.bg} rounded-2xl p-7 border border-white/60 hover:shadow-card-hover transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-white/80 max-w-[120px]">
                      <img src={imgSrc(p.logo)} alt={p.title} className="h-12 w-auto object-contain" />
                    </div>
                    <div className={`w-2 h-12 rounded-full bg-gradient-to-b ${colors.accent} opacity-60`} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-tide-text mb-2">{t(`projects.completed.${p.key}`, p.title)}</h3>
                  <p className="text-sm font-body text-tide-muted leading-relaxed">{t(`projects.completed.${p.key}Desc`, p.desc)}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* MOI 2023 Brochure */}
      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.moiBrochure.sectionBadge} title={data.moiBrochure.sectionTitle} subtitle={data.moiBrochure.sectionSubtitle} />
          <p className="text-xs font-body text-tide-muted mb-8 -mt-6 italic">Click any page to view full screen.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {data.moiBrochure.pages.map((item, i) => (
              <motion.button
                key={item.src}
                {...fadeUp(i * 0.1)}
                onClick={() => brochure.openLightbox(i)}
                className="rounded-xl overflow-hidden shadow-sm border border-tide-border aspect-[3/4] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <img src={imgSrc(item.src)} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* SCF — Timeline & Areas of Work */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.scfProgram.sectionBadge} title={data.scfProgram.sectionTitle} subtitle={data.scfProgram.sectionSubtitle} />
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            {data.scfProgram.diagrams.map((item, i) => (
              <motion.div key={item.src} {...fadeUp(i * 0.1)} className="rounded-2xl overflow-hidden border border-tide-border shadow-sm bg-tide-subtle p-3">
                <img src={imgSrc(item.src)} alt={item.label} className="w-full h-auto object-contain rounded-xl" />
                <p className="text-xs font-body text-tide-muted text-center mt-2">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <SectionHeader badge={data.scfProgram.fellowsBadge} title={data.scfProgram.fellowsTitle} subtitle={data.scfProgram.fellowsSubtitle} />
          <p className="text-xs font-body text-tide-muted mb-8 -mt-6 italic">Click any portrait to view full screen.</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-4">
            {data.scfProgram.fellows.map((item, i) => (
              <motion.button
                key={item.name}
                {...fadeUp(i * 0.04)}
                onClick={() => fellows.openLightbox(i)}
                className="group relative rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={imgSrc(item.photo)} alt={item.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]" />
                  <div
                    className="absolute inset-0 flex items-end translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ background: 'linear-gradient(0deg, rgba(10,22,44,0.92) 0%, rgba(10,22,44,0.55) 55%, rgba(10,22,44,0.08) 100%)' }}
                  >
                    <div className="p-2 pb-3">
                      <p className="font-body text-white/90 text-[10px] font-semibold leading-tight">{item.name}</p>
                    </div>
                  </div>
                </div>
                <div className="px-2 pt-2 pb-3">
                  <p className="font-body text-[10px] text-tide-muted leading-tight text-center">{item.name.split(' ')[0]}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* MOI 2024 */}
      <section className="section-padding bg-navy">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.moi2024.sectionBadge} title={data.moi2024.sectionTitle} subtitle={data.moi2024.sectionSubtitle} light />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {data.moi2024.highlights.map((item, i) => (
              <motion.div
                key={item.src}
                {...fadeUp(i * 0.08)}
                className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors duration-200"
              >
                <img src={imgSrc(item.src)} alt={item.label} className="w-12 h-12 object-contain mx-auto mb-3" />
                <p className="text-sm font-body text-white/80 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp(0.2)} className="rounded-2xl overflow-hidden max-w-sm mx-auto">
            <img src={imgSrc(data.moi2024.poster)} alt={data.moi2024.posterAlt} className="w-full h-auto object-contain" />
          </motion.div>
        </div>
      </section>

      {/* Lightboxes */}
      <AnimatePresence>
        {brochure.isLightboxOpen && (
          <Lightbox images={data.moiBrochure.pages} currentIndex={brochure.lightboxIndex} onClose={brochure.closeLightbox} onPrev={brochure.prevLightbox} onNext={brochure.nextLightbox} onGoTo={brochure.openLightbox} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {fellows.isLightboxOpen && (
          <Lightbox images={data.scfProgram.fellows.map(f => ({ src: imgSrc(f.photo), label: f.name }))} currentIndex={fellows.lightboxIndex} onClose={fellows.closeLightbox} onPrev={fellows.prevLightbox} onNext={fellows.nextLightbox} onGoTo={fellows.openLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
