import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Target, Zap } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import Lightbox from '../../components/ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import data from '../../data/projects-bettered.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

export default function BetterED() {
  const { t } = useTranslation()
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(data.gallery.images.length)

  return (
    <>
      <PageHero badge={data.meta.badge} title={t('projects.bettered.title', data.meta.title)} subtitle={t('projects.bettered.tagline', data.meta.tagline)} gradient />

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
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.overview.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed">{t('projects.bettered.overview', data.overview.body)}</p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: <MapPin className="w-5 h-5" />, label: 'Reach',       value: t('projects.bettered.reach', data.overview.reach) },
                  { icon: <Zap className="w-5 h-5" />,    label: 'Focus Areas', value: t('projects.bettered.focus', data.overview.focus) },
                  { icon: <Target className="w-5 h-5" />, label: 'Goal',        value: t('projects.bettered.goal', data.overview.goal) },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-xs font-semibold text-tide-muted uppercase tracking-wider font-body mb-1">{item.label}</div>
                      <p className="text-tide-text font-body text-sm leading-relaxed">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div>
              <div className="rounded-2xl overflow-hidden aspect-video mb-6">
                <img src={imgSrc(data.overview.photo1)} alt={data.overview.photo1Alt} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-video">
                <img src={imgSrc(data.overview.photo2)} alt={data.overview.photo2Alt} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evolution */}
      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.evolution.sectionBadge} title={data.evolution.sectionTitle} subtitle={data.evolution.sectionSubtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.evolution.phases.map((e, i) => (
              <Card key={e.phase} delay={i * 0.1} className="p-6 text-center">
                <div className="text-4xl mb-4">{e.icon}</div>
                <h3 className="font-display font-semibold text-tide-text mb-2">{e.phase}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{e.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="section-padding bg-navy">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.gallery.sectionBadge} title={data.gallery.sectionTitle} light />
          <p className="text-xs font-body text-white/40 mb-8 -mt-6 italic">{t('common.clickToZoom', 'Click any image to view full screen.')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.gallery.images.map((item, i) => (
              <motion.button
                key={item.src}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                onClick={() => openLightbox(i)}
                className={`rounded-xl overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
              >
                <img src={imgSrc(item.src)} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox images={data.gallery.images} currentIndex={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
