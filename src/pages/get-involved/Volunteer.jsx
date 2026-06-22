import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, FileEdit, Users, Building2, Briefcase, ArrowRight } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Lightbox from '../../components/ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import data from '../../data/get-involved-volunteer.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

const ICONS = {
  BookOpen:  <BookOpen className="w-6 h-6" />,
  FileEdit:  <FileEdit className="w-6 h-6" />,
  Users:     <Users className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function Volunteer() {
  const { t } = useTranslation()
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(data.gallery.images.length)

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/get-involved/volunteer"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Get Involved' },
          { name: 'Volunteer', path: '/get-involved/volunteer' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={t('getInvolved.volunteer.title', data.meta.title)} subtitle={t('getInvolved.volunteer.tagline', data.meta.tagline)} gradient />

      {/* Hero section */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div {...fadeUp()}>
              <p className="text-tide-muted font-body leading-relaxed text-lg mb-6">{t('getInvolved.volunteer.body', data.intro.body)}</p>
              <blockquote className="pl-5 border-l-4 border-accent mb-8">
                <p className="font-display text-xl italic text-tide-text">"{t('getInvolved.volunteer.equation', data.intro.quote)}"</p>
              </blockquote>
              <Button href={data.intro.ctaHref} external size="lg">
                {t('getInvolved.volunteer.cta', data.intro.ctaLabel)} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div {...fadeUp(0.15)}>
              <div className="grid grid-cols-2 gap-3">
                {data.gallery.images.slice(0, 4).map((item, i) => (
                  <div key={item.src} className={`rounded-xl overflow-hidden ${i === 0 ? 'aspect-video col-span-2' : 'aspect-square'}`}>
                    <img src={imgSrc(item.src)} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Opportunities */}
          <SectionHeader badge={data.opportunities.sectionBadge} title={data.opportunities.sectionTitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {data.opportunities.items.map((o, i) => (
              <Card key={o.title} delay={i * 0.08} className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                  {ICONS[o.iconKey] || <Users className="w-6 h-6" />}
                </div>
                <h3 className="font-display font-semibold text-tide-text mb-2">{o.title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{o.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Full gallery */}
      <section className="section-padding bg-navy">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.gallery.sectionBadge} title={data.gallery.sectionTitle} light />
          <p className="text-xs font-body text-white/50 mb-8 -mt-6 italic">{t('common.clickToZoom', 'Click any image to view full screen.')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.gallery.images.map((item, i) => (
              <motion.button
                key={item.src}
                {...fadeUp(i * 0.05)}
                onClick={() => openLightbox(i)}
                className={`rounded-xl overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${i === 0 || i === 4 ? 'sm:col-span-2 aspect-video' : 'aspect-square'}`}
              >
                <img src={imgSrc(item.src)} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox images={data.gallery.images} currentIndex={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} onGoTo={openLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
