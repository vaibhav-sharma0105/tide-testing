import { motion } from 'framer-motion'
import { Users, BookOpen } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import data from '../../data/projects-empowered.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

const ICONS = {
  Users:    <Users className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

const COMPONENT_KEYS = [
  { title: 'component1', desc: 'component1desc' },
  { title: 'component2', desc: 'component2desc' },
]

const PHASE_KEYS = ['phase1', 'phase2', 'phase3', 'phase4']

export default function EmpowerEd() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('projects.empowered.title', data.meta.title)} subtitle={t('projects.empowered.tagline', data.meta.tagline)} gradient />

      {/* Overview */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div {...fadeUp()}>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.overview.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed mb-8">{t('projects.empowered.overview', data.overview.body)}</p>
              <div className="space-y-5">
                {data.components.map((c, i) => (
                  <Card key={c.title} delay={i * 0.12} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center shrink-0">
                        {ICONS[c.iconKey] || <Users className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-tide-text mb-2">{COMPONENT_KEYS[i] ? t(`projects.empowered.${COMPONENT_KEYS[i].title}`, c.title) : c.title}</h3>
                        <p className="text-sm font-body text-tide-muted leading-relaxed">{COMPONENT_KEYS[i] ? t(`projects.empowered.${COMPONENT_KEYS[i].desc}`, c.desc) : c.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.15)} className="flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden border border-tide-border bg-white p-6 flex items-center justify-center">
                <img src={imgSrc(data.overview.logo)} alt={data.overview.logoAlt} className="max-h-40 object-contain" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-video">
                <img src={imgSrc(data.overview.heroPhoto)} alt={data.overview.heroPhotoAlt} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Five Objectives */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.objectives.sectionBadge} title={data.objectives.sectionTitle} subtitle={data.objectives.sectionSubtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.objectives.items.map((o, i) => (
              <motion.div
                key={o.label}
                {...fadeUp(i * 0.07)}
                className="group relative overflow-hidden rounded-2xl bg-navy min-h-[200px]"
              >
                <img src={imgSrc(o.photo)} alt={o.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 photo-overlay" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-xs font-display font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display font-semibold text-white text-sm leading-tight">{o.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.timeline.sectionBadge} title={data.timeline.sectionTitle} subtitle={data.timeline.sectionSubtitle} />
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />
            <div className="space-y-6">
              {data.timeline.phases.map((phase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-6"
                >
                  <div className="relative z-10 w-12 h-12 rounded-full gradient-primary text-white font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {i + 1}
                  </div>
                  <div className="bg-white rounded-2xl p-5 flex-1 border border-tide-border">
                    <p className="font-body text-tide-text text-sm leading-relaxed">{PHASE_KEYS[i] ? t(`projects.empowered.${PHASE_KEYS[i]}`, phase) : phase}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
