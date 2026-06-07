import { motion } from 'framer-motion'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import data from '../../data/about-our-results.json'
import { useTranslation } from 'react-i18next'

const COLOR_MAP = {
  blue:    'bg-blue-50 border-blue-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  violet:  'bg-violet-50 border-violet-200',
  rose:    'bg-rose-50 border-rose-200',
  amber:   'bg-amber-50 border-amber-200',
  sky:     'bg-sky-50 border-sky-200',
  orange:  'bg-orange-50 border-orange-200',
}

const PROGRAM_KEYS = {
  'Saral Kadam': 'saralKadam',
  'Prerak': 'prerak',
  'BetterED': 'bettered',
  'Disha': 'disha',
  'CollegeDev': 'collegedev',
  'CompletEd': 'completed',
  'RefugEd': 'refuged',
}

export default function OurResults() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('about.results.title', data.meta.title)} subtitle={t('about.results.subtitle', data.meta.subtitle)} />

      <section className="py-16 bg-white border-b border-tide-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {data.topStats.map((s) => (
              <AnimatedCounter key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.programImpact.sectionBadge} title={data.programImpact.sectionTitle} />
          <div className="space-y-4">
            {data.programImpact.programs.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`rounded-2xl p-6 border ${COLOR_MAP[p.colorKey] || 'bg-tide-subtle border-tide-border'} flex flex-col sm:flex-row sm:items-center gap-4`}
              >
                <div className="sm:w-1/3">
                  <h3 className="font-display text-lg font-semibold text-tide-text">{PROGRAM_KEYS[p.name] ? t(`about.results.${PROGRAM_KEYS[p.name]}`, p.name) : p.name}</h3>
                </div>
                <div className="sm:w-2/3">
                  <p className="font-body text-tide-muted text-sm leading-relaxed">{PROGRAM_KEYS[p.name] ? t(`about.results.${PROGRAM_KEYS[p.name]}Stats`, p.stats) : p.stats}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
