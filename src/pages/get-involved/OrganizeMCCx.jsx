import { motion } from 'framer-motion'
import { Mail, ArrowRight, Users, Vote, Lightbulb, Globe } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/get-involved-mccx.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

const ICONS = {
  Mail:     <Mail className="w-5 h-5" />,
  Users:    <Users className="w-5 h-5" />,
  Lightbulb: <Lightbulb className="w-5 h-5" />,
  Vote:     <Vote className="w-5 h-5" />,
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function OrganizeMCCx() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('getInvolved.mccx.title', data.meta.title)} subtitle={t('getInvolved.mccx.tagline', data.meta.tagline)} gradient />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div {...fadeUp()}>
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-sm">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-4">{data.whatIs.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed mb-4 text-base">{data.whatIs.body1}</p>
              <p className="text-tide-muted font-body leading-relaxed mb-8">{data.whatIs.body2}</p>
              <Button href={data.whatIs.ctaHref} size="lg">
                <Mail className="w-4 h-4" /> {data.whatIs.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div {...fadeUp(0.15)}>
              <div className="grid grid-cols-2 gap-3">
                {data.whatIs.photos.map((p, i) => (
                  <div key={p.src} className="rounded-xl overflow-hidden aspect-video">
                    <img src={imgSrc(p.src)} alt={p.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <SectionHeader badge={data.steps.sectionBadge} title={data.steps.sectionTitle} subtitle={data.steps.sectionSubtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.steps.items.map((s, i) => (
              <motion.div key={s.title} {...fadeUp(i * 0.09)} className="bg-white rounded-2xl p-6 border border-tide-border">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                  {ICONS[s.iconKey] || <Globe className="w-5 h-5" />}
                </div>
                <div className="text-xs font-body font-semibold text-tide-muted uppercase tracking-widest mb-2">Step {i + 1}</div>
                <h3 className="font-display font-semibold text-tide-text mb-2">{s.title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
