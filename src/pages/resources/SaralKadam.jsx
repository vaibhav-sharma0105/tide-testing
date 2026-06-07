import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Download, BookOpen } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Button from '../../components/ui/Button'
import Lightbox from '../../components/ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import data from '../../data/resources-saral-kadam.json'
import { useTranslation } from 'react-i18next'

/* Tailwind color classes per colorKey — can't be stored in JSON */
const LEVEL_COLORS = {
  blue:    { card: 'bg-blue-50 border-blue-200',     accentBg: 'bg-blue-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', accentBg: 'bg-emerald-600' },
  violet:  { card: 'bg-violet-50 border-violet-200', accentBg: 'bg-violet-600' },
  amber:   { card: 'bg-amber-50 border-amber-200',   accentBg: 'bg-amber-600' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function SaralKadam() {
  const { t } = useTranslation()
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(data.programGallery.photos.length)

  return (
    <>
      <PageHero badge={data.meta.badge} title={t('resources.saralKadam.title', data.meta.title)} subtitle={t('resources.saralKadam.tagline', data.meta.tagline)} />

      {/* About */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
            <motion.div {...fadeUp()}>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.about.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed mb-4">{t('resources.saralKadam.overview', data.about.overview)}</p>
              <p className="text-tide-muted font-body leading-relaxed mb-4">{t('resources.saralKadam.available', data.about.available)}</p>
              <p className="text-tide-muted font-body leading-relaxed mb-6">{t('resources.saralKadam.request', data.about.request)}</p>
              <Button href={data.about.ctaHref} variant="secondary">
                <Mail className="w-4 h-4" /> {data.about.ctaLabel}
              </Button>
            </motion.div>
            <motion.div {...fadeUp(0.15)} className="space-y-4">
              <div className="rounded-2xl overflow-hidden aspect-video">
                <img src={data.about.mainPhoto} alt="Saral Kadam materials" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden border border-tide-border bg-white p-3">
                <img src={data.about.diagramPhoto} alt="Saral Kadam program structure" className="w-full h-auto object-contain" />
              </div>
            </motion.div>
          </div>

          {/* Booklets grid — by level */}
          <SectionHeader
            badge={data.booklets.sectionBadge}
            title={data.booklets.sectionTitle}
            subtitle={data.booklets.sectionSubtitle}
          />

          <div className="space-y-10">
            {data.booklets.levels.map((l, li) => {
              const colors = LEVEL_COLORS[l.colorKey]
              return (
                <motion.div key={l.key} {...fadeUp(li * 0.08)}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`px-3 py-1 rounded-full text-sm font-body font-bold text-white ${colors.accentBg}`}>
                      {t(`resources.saralKadam.${l.key}`, l.title)}
                    </span>
                    <span className="text-sm font-body text-tide-muted">{l.booklets.length} booklets</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {l.booklets.map((b, bi) => (
                      <motion.a
                        key={b.title}
                        href="mailto:info@tideinternational.org?subject=Saral Kadam Booklet Request"
                        {...fadeUp(li * 0.08 + bi * 0.05)}
                        className={`group rounded-xl border ${colors.card} overflow-hidden hover:shadow-card-hover transition-all duration-300`}
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-white">
                          <img src={b.img} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-body text-tide-text font-medium leading-tight line-clamp-2">{b.title}</span>
                          <Download className="w-3.5 h-3.5 text-tide-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Download CTA */}
          <div className="mt-12 bg-primary rounded-2xl p-8 text-white text-center">
            <BookOpen className="w-10 h-10 text-white/60 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">{data.booklets.downloadCtaTitle}</h3>
            <p className="text-white/75 font-body text-sm max-w-md mx-auto mb-6">{data.booklets.downloadCtaBody}</p>
            <Button href={data.booklets.downloadCtaHref} className="bg-white text-primary hover:bg-primary-faint">
              <Mail className="w-4 h-4" /> {data.booklets.downloadCtaLabel}
            </Button>
          </div>
        </div>
      </section>

      {/* Program in action */}
      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge={data.programGallery.sectionBadge}
            title={data.programGallery.sectionTitle}
            subtitle={data.programGallery.sectionSubtitle}
          />
          <p className="text-xs font-body text-tide-muted mb-8 -mt-6 italic">Click any image to view full screen.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.programGallery.photos.map((item, i) => (
              <motion.button
                key={item.src}
                {...fadeUp(i * 0.05)}
                onClick={() => openLightbox(i)}
                className={`rounded-xl overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
              >
                <img src={item.src} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox images={data.programGallery.photos} currentIndex={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
