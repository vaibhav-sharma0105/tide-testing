import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle2, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import { CONTRIBUTE_FORM_URL } from '../../config/abl'
import ablContributeData from '../../data/abl-contribute.json'

const formReady = CONTRIBUTE_FORM_URL && CONTRIBUTE_FORM_URL !== 'REPLACE_WITH_GOOGLE_FORM_URL'

const STEP_ICONS = [ClipboardList, CheckCircle2, BookOpen]

export default function AblContribute() {
  const { t } = useTranslation()

  const STEPS = ablContributeData.steps.map((s, i) => ({
    step: i + 1,
    icon: STEP_ICONS[i],
    title: s.title,
    desc: s.desc,
  }))

  return (
    <>
      {/* Renders at the active /pramaan/contribute and a stranded duplicate
          /resources/abl-resources/contribute — canonical always points at
          the active path. */}
      <SeoHead
        title={ablContributeData.meta.seoTitle}
        description={ablContributeData.meta.seoDescription}
        path="/pramaan/contribute"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Pramaan', path: '/pramaan' },
          { name: 'Contribute', path: '/pramaan/contribute' },
        ]}
      />
      <PageHero
        badge={ablContributeData.meta.badge}
        title={t('abl.contribute.title', ablContributeData.meta.title)}
        subtitle={t('abl.contribute.subtitle', ablContributeData.meta.subtitle)}
        gradient
      />
      <AblNavBar />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-4">{t('abl.contribute.shareTitle', ablContributeData.shareSection.title)}</h2>
            <p className="font-body text-tide-muted leading-relaxed">
              {t('abl.contribute.shareBody', ablContributeData.shareSection.body)}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {STEPS.map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-tide-border text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <h3 className="font-display text-base font-semibold text-tide-text mb-2">{title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            {formReady ? (
              <Button href={CONTRIBUTE_FORM_URL} external size="lg">
                {t('abl.contribute.cta', ablContributeData.cta)} ↗
              </Button>
            ) : (
              <div className="inline-flex flex-col items-center gap-2">
                <span className="px-5 py-3 rounded-full bg-tide-subtle text-tide-muted text-sm font-body font-semibold border border-tide-border cursor-not-allowed">
                  {t('abl.contribute.cta', ablContributeData.cta)} ↗
                </span>
                <span className="text-xs font-body text-accent-deeper font-semibold">{t('abl.contribute.ctaPending', ablContributeData.ctaPending)}</span>
              </div>
            )}
            <p className="text-xs font-body text-tide-muted mt-3">{t('abl.contribute.disclaimer', ablContributeData.disclaimer)}</p>
          </motion.div>

        </div>
      </section>
    </>
  )
}
