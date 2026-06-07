import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Users, Heart, BookOpen, Lightbulb, ExternalLink, Download, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import data from '../../data/projects-sdg-drives.json'
import { useTranslation } from 'react-i18next'

const ICONS = {
  Globe:     <Globe className="w-6 h-6" />,
  Users:     <Users className="w-6 h-6" />,
  Heart:     <Heart className="w-6 h-6" />,
  BookOpen:  <BookOpen className="w-6 h-6" />,
  Lightbulb: <Lightbulb className="w-6 h-6" />,
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function SdgDrives() {
  const { t } = useTranslation()
  const [padletLoaded, setPadletLoaded] = useState(false)

  return (
    <>
      <PageHero badge={data.meta.badge} title={t('projects.sdgDrives.title', data.meta.title)} subtitle={t('projects.sdgDrives.tagline', data.meta.tagline)} gradient />

      {/* Overview + The Idea */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">

          {/* Overview — text left, SDG image right */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-14">
            <motion.div {...fadeUp()}>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.overview.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed">{t('projects.sdgDrives.overview', data.overview.body)}</p>
            </motion.div>
            <motion.div {...fadeUp(0.15)} className="flex justify-center">
              <img
                src={data.overview.image}
                alt={data.overview.imageAlt}
                className="w-full max-w-sm"
              />
            </motion.div>
          </div>

          {/* The Idea */}
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-8 border border-tide-border">
            <h2 className="font-display text-2xl font-semibold text-tide-text mb-4">{data.idea.title}</h2>
            <p className="text-tide-muted font-body leading-relaxed mb-5">{data.idea.body}</p>
            <div className="bg-primary-light rounded-xl px-5 py-4 mb-5">
              <p className="text-sm font-body font-semibold text-primary leading-relaxed">{data.idea.sdgList}</p>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm font-body text-tide-muted">{data.idea.contactNote}</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Objectives */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.objectives.sectionBadge} title={data.objectives.sectionTitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.objectives.items.map((obj, i) => (
              <Card key={obj.title} delay={i * 0.08} className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-5">
                  {ICONS[obj.iconKey] || <Globe className="w-6 h-6" />}
                </div>
                <h3 className="font-display text-lg font-semibold text-tide-text mb-2">{obj.title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{obj.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Execution Plan */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.execution.sectionBadge} title={data.execution.sectionTitle} />

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div {...fadeUp()} className="bg-white rounded-2xl p-7 border border-tide-border">
              <h3 className="font-display text-xl font-semibold text-tide-text mb-2">{data.execution.ambassadorTitle}</h3>
              <p className="text-xs font-body text-tide-muted italic mb-5">{data.execution.ambassadorNote}</p>
              <ul className="space-y-3">
                {data.execution.ambassadorRoles.map((role) => (
                  <li key={role} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-body text-sm text-tide-text">{role}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-7 border border-tide-border">
              <h3 className="font-display text-xl font-semibold text-tide-text mb-4">{data.execution.independentTitle}</h3>
              <p className="text-sm font-body text-tide-muted leading-relaxed">{data.execution.independentBody}</p>
            </motion.div>
          </div>

          {/* Timeline Table */}
          <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl overflow-hidden border border-tide-border">
            <div className="px-6 py-4 border-b border-tide-border bg-primary-light">
              <h3 className="font-display text-lg font-semibold text-primary">Execution Timeline</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-tide-subtle">
                    <th className="px-6 py-3 text-left text-xs font-body font-bold text-tide-muted uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-body font-bold text-tide-muted uppercase tracking-widest">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-body font-bold text-tide-muted uppercase tracking-widest">SDGs Covered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.execution.timeline.map((row, i) => (
                    <tr key={row.duration} className={i % 2 === 0 ? 'bg-white' : 'bg-tide-subtle/40'}>
                      <td className="px-6 py-4 font-body text-sm font-semibold text-tide-text">{row.duration}</td>
                      <td className="px-6 py-4 font-body text-sm text-tide-muted">{row.frequency}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-body font-semibold rounded-full bg-primary-light text-primary border border-primary/20">
                          {row.sdgs}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Padlet — full-width, seamless, with loading skeleton */}
      <section
        className="bg-tide-bg border-t border-tide-border"
        aria-labelledby="padlet-heading"
      >
        {/* Constrained header */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16 pt-20 md:pt-28 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-primary-light text-primary border border-primary/20">
              {data.padlet.sectionBadge}
            </span>
            <h2 id="padlet-heading" className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-tide-text">
              {data.padlet.title}
            </h2>
            {data.padlet.subtitle && (
              <p className="mt-4 text-lg leading-relaxed max-w-2xl text-tide-muted">{data.padlet.subtitle}</p>
            )}
          </motion.div>
        </div>

        {/* Full-width iframe */}
        <div className="relative w-full" style={{ height: '700px' }}>
          {/* Loading skeleton */}
          {!padletLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-tide-subtle z-10">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm font-body text-tide-muted">Loading board…</p>
            </div>
          )}
          <motion.iframe
            src={data.padlet.url}
            title={data.padlet.iframeTitle}
            loading="lazy"
            allowFullScreen
            allow="camera; microphone; geolocation"
            onLoad={() => setPadletLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: padletLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Fallback link */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16 pb-20 md:pb-28 pt-4">
          <p className="padlet-fallback text-sm font-body text-tide-muted text-center">
            Can't see the board?{' '}
            <a
              href={data.padlet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
            >
              {data.padlet.fallbackLabel} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
      </section>

      {/* Register + Downloads */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            <motion.div {...fadeUp()} className="bg-tide-bg rounded-2xl p-8 border border-tide-border text-center flex flex-col items-center">
              <span className="inline-block px-3 py-1 text-xs font-body font-bold uppercase tracking-widest text-primary bg-primary-light rounded-full mb-4 border border-primary/20">
                {data.register.sectionBadge}
              </span>
              <h2 className="font-display text-2xl font-semibold text-tide-text mb-3">{data.register.title}</h2>
              <p className="text-sm font-body text-tide-muted mb-8">{data.register.subtitle}</p>
              <Button href={data.register.formUrl} external size="lg">
                {data.register.formLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="bg-tide-bg rounded-2xl p-8 border border-tide-border">
              <span className="inline-block px-3 py-1 text-xs font-body font-bold uppercase tracking-widest text-primary bg-primary-light rounded-full mb-4 border border-primary/20">
                {data.downloads.sectionBadge}
              </span>
              <h2 className="font-display text-2xl font-semibold text-tide-text mb-6">{data.downloads.title}</h2>
              <div className="space-y-4">
                {data.downloads.items.map((dl) => (
                  <a
                    key={dl.href}
                    href={dl.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-tide-border bg-white hover:border-primary hover:bg-primary-light transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      <Download className="w-5 h-5" />
                    </div>
                    <span className="font-body text-sm font-semibold text-tide-text group-hover:text-primary transition-colors duration-150">{dl.label}</span>
                  </a>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </>
  )
}
