import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Globe, Heart } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import Card from '../../components/ui/Card'
import SectionHeader from '../../components/ui/SectionHeader'
import Lightbox from '../../components/ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import data from '../../data/projects-other.json'

const ICONS = {
  GraduationCap: <GraduationCap className="w-6 h-6" />,
  Heart:         <Heart className="w-6 h-6" />,
  Globe:         <Globe className="w-6 h-6" />,
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function OtherProjects() {
  const disha = useLightbox(data.disha.photos.length)
  const moi   = useLightbox(data.moi.photos.length)

  return (
    <>
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <p className="text-tide-muted font-body leading-relaxed max-w-2xl mb-12">{data.intro}</p>

          <div className="grid sm:grid-cols-3 gap-6 mb-20">
            {data.knownProjects.items.map((p, i) => (
              <Card key={p.name} delay={i * 0.1} className="overflow-hidden">
                {p.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-0.5">
                    {p.photos.slice(0, 4).map((src, pi) => (
                      <div key={src} className="overflow-hidden aspect-square">
                        <img src={src} alt={`${p.name} ${pi + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                      {ICONS[p.iconKey] || <Globe className="w-6 h-6" />}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-tide-text">{p.name}</h3>
                  </div>
                  <p className="text-sm font-body text-tide-muted leading-relaxed mb-4">{p.desc}</p>
                  <span className="inline-block px-3 py-1 text-xs font-body font-semibold rounded-full bg-primary-light text-primary border border-primary/20">
                    {p.stats}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Disha */}
          <div className="mb-20">
            <SectionHeader badge={data.disha.sectionBadge} title={data.disha.sectionTitle} subtitle={data.disha.sectionSubtitle} />
            <div className="bg-white rounded-2xl p-6 border border-tide-border mb-6">
              <p className="text-tide-muted font-body leading-relaxed">{data.disha.body}</p>
            </div>
            <p className="text-xs font-body text-tide-muted mb-5 italic">Click any image to view full screen.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.disha.photos.map((item, i) => (
                <motion.button
                  key={item.src}
                  {...fadeUp(i * 0.07)}
                  onClick={() => disha.openLightbox(i)}
                  className="rounded-xl overflow-hidden aspect-video cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <img src={item.src} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Miracle of Ideas */}
          <div className="mb-20">
            <SectionHeader badge={data.moi.sectionBadge} title={data.moi.sectionTitle} subtitle={data.moi.sectionSubtitle} />
            <p className="text-xs font-body text-tide-muted mb-5 italic">Click any image to view full screen.</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {data.moi.photos.map((item, i) => (
                <motion.button
                  key={item.src}
                  {...fadeUp(i * 0.1)}
                  onClick={() => moi.openLightbox(i)}
                  className="rounded-xl overflow-hidden aspect-video cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <img src={item.src} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prabhav / Schools2030 */}
          <div>
            <SectionHeader badge={data.prabhav.sectionBadge} title={data.prabhav.sectionTitle} subtitle={data.prabhav.sectionSubtitle} />
            <div className="grid sm:grid-cols-2 gap-8 items-start">
              <motion.div {...fadeUp(0)} className="rounded-2xl overflow-hidden border border-tide-border shadow-sm bg-white p-3">
                <img src={data.prabhav.poster} alt="Schools2030 Poster" className="w-full h-auto object-contain rounded-xl" />
              </motion.div>
              <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-6 border border-tide-border">
                <p className="text-tide-muted font-body leading-relaxed">{data.prabhav.body}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {disha.isLightboxOpen && (
          <Lightbox images={data.disha.photos} currentIndex={disha.lightboxIndex} onClose={disha.closeLightbox} onPrev={disha.prevLightbox} onNext={disha.nextLightbox} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {moi.isLightboxOpen && (
          <Lightbox images={data.moi.photos} currentIndex={moi.lightboxIndex} onClose={moi.closeLightbox} onPrev={moi.prevLightbox} onNext={moi.nextLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
