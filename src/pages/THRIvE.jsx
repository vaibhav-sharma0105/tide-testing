import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, BookOpen, TrendingUp, Lightbulb, Link2, Users } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import SectionHeader from '../components/ui/SectionHeader'
import Card from '../components/ui/Card'
import Lightbox from '../components/ui/Lightbox'
import { useLightbox } from '../hooks/useLightbox'
import data from '../data/thrive.json'

const ICONS = {
  BookOpen:   <BookOpen className="w-5 h-5" />,
  Microscope: <Microscope className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Lightbulb:  <Lightbulb className="w-5 h-5" />,
  Link2:      <Link2 className="w-5 h-5" />,
  Users:      <Users className="w-5 h-5" />,
}

/* ── Portrait card ─────────────────────────────────────────────────── */
function PersonCard({ name, role, photo, delay = 0 }) {
  const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="font-display text-white font-bold text-4xl opacity-40 select-none">{initials}</span>
          </div>
        )}
        <div
          className="absolute inset-0 flex items-end translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ background: 'linear-gradient(0deg, rgba(10,22,44,0.92) 0%, rgba(10,22,44,0.60) 50%, rgba(10,22,44,0.08) 100%)' }}
        >
          <div className="p-3 pb-4">
            <p className="font-body text-white/70 text-xs leading-relaxed">{role}</p>
          </div>
        </div>
      </div>
      <div className="px-3 pt-3 pb-4">
        <h3 className="font-display font-semibold text-tide-text text-sm leading-snug">{name}</h3>
        <p className="font-body text-[11px] text-tide-muted leading-snug mt-0.5">{role}</p>
      </div>
    </motion.div>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function THRIvE() {
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(data.conferences.images.length)

  return (
    <>
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.fullName} gradient />

      {/* Tagline band */}
      <section className="py-12 bg-primary-light border-b border-primary/10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-2xl md:text-3xl italic text-primary font-medium">"{data.meta.tagline}"</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fadeUp()}>
              <span className="badge-primary mb-4 block w-fit">{data.about.sectionBadge}</span>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.about.sectionTitle}</h2>
              <p className="text-tide-muted font-body leading-relaxed">{data.about.body}</p>
            </motion.div>
            <motion.div {...fadeUp(0.15)}>
              <span className="badge-primary mb-4 block w-fit">{data.leaders.sectionBadge}</span>
              <h2 className="font-display text-2xl font-semibold text-tide-text mb-6">{data.leaders.sectionTitle}</h2>
              <div className="grid grid-cols-3 gap-3">
                {data.leaders.members.map((l, i) => (
                  <PersonCard key={l.name} name={l.name} role={l.role} photo={l.photo} delay={i * 0.07} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Research Team */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.researchTeam.sectionBadge} title={data.researchTeam.sectionTitle} subtitle={data.researchTeam.sectionSubtitle} />
          <p className="text-xs font-body text-tide-muted mb-8 -mt-6 italic">Hover over a photo to see the role.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {data.researchTeam.members.map((m, i) => (
              <PersonCard key={m.name} name={m.name} role={m.role} photo={m.photo} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.principles.sectionBadge} title={data.principles.sectionTitle} center />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.principles.items.map((p, i) => (
              <Card key={p.title} delay={i * 0.07} className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                  {ICONS[p.iconKey] || <BookOpen className="w-5 h-5" />}
                </div>
                <h3 className="font-display font-semibold text-tide-text mb-2">{p.title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Research Projects */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.researchProjects.sectionBadge} title={data.researchProjects.sectionTitle} subtitle={data.researchProjects.sectionSubtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.researchProjects.items.map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp(i * 0.08)}
                className="group relative overflow-hidden rounded-2xl bg-navy min-h-[240px] cursor-default"
              >
                <img src={p.photo} alt={p.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 photo-overlay" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-body font-bold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm border border-white/20">
                    Research
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display font-semibold text-white text-sm leading-tight mb-1">{p.title}</h3>
                  <p className="text-white/70 text-xs font-body leading-relaxed line-clamp-2">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conferences & Publications */}
      <section className="section-padding bg-navy">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.conferences.sectionBadge} title={data.conferences.sectionTitle} subtitle={data.conferences.sectionSubtitle} light />
          <p className="text-xs font-body text-white/40 mb-8 -mt-6 italic">Click any image to view full screen.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.conferences.images.map((item, i) => (
              <motion.button
                key={item.src}
                {...fadeUp(i * 0.06)}
                onClick={() => openLightbox(i)}
                className="rounded-xl overflow-hidden aspect-video cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <img src={item.src} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox images={data.conferences.images} currentIndex={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
