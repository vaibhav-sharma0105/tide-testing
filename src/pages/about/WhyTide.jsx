import { motion } from 'framer-motion'
import { CheckCircle2, Target, Eye, Lightbulb } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import data from '../../data/about-why-tide.json'
import { useTranslation } from 'react-i18next'

const ICONS = {
  Target:       <Target className="w-5 h-5" />,
  Lightbulb:    <Lightbulb className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Eye:          <Eye className="w-5 h-5" />,
}

export default function WhyTide() {
  const { t } = useTranslation()
  const pageTitle = t('about.whyTide.title', data.meta.title) + ' — TIDE Foundation'
  const pageDesc = t('about.whyTide.subtitle', data.meta.subtitle)
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://tideinternational.org/about/why-tide" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://tideinternational.org/assets/images/shared/tide-logo.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://tideinternational.org/"},
            {"@type": "ListItem", "position": 2, "name": "About Us"},
            {"@type": "ListItem", "position": 3, "name": "Why TIDE?", "item": "https://tideinternational.org/about/why-tide"}
          ]
        })}</script>
      </Helmet>
      <PageHero badge={data.meta.badge} title={t('about.whyTide.title', data.meta.title)} subtitle={t('about.whyTide.subtitle', data.meta.subtitle)} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="inline-block mb-3 px-3 py-1 text-xs font-body font-semibold rounded-full bg-primary-light text-primary border border-primary/20 tracking-widest uppercase">{data.whoWeAre.sectionBadge}</span>
              <h2 className="font-display text-3xl font-semibold text-tide-text leading-tight mb-4">{data.whoWeAre.sectionTitle}</h2>
              <p className="text-tide-muted leading-relaxed font-body">{t('about.whyTide.mission', data.whoWeAre.mission)}</p>
              <p className="mt-4 text-tide-muted leading-relaxed font-body">{t('about.whyTide.philosophy', data.whoWeAre.philosophy)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} className="relative bg-navy rounded-2xl p-8 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-25">
                <img src={data.vision.backgroundImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative">
                <Eye className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-display text-2xl font-semibold mb-3">{data.vision.title}</h3>
                <p className="text-white/80 leading-relaxed font-body">{t('about.whyTide.vision', data.vision.body)}</p>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="font-display text-lg italic text-white/90">"{data.vision.quote}"</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={data.goals.sectionBadge} title={t('about.whyTide.goals.title', data.goals.sectionTitle)} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.goals.items.map((g, i) => (
              <Card key={i} delay={i * 0.08} className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                  {ICONS[g.iconKey] || <CheckCircle2 className="w-5 h-5" />}
                </div>
                <p className="font-body text-tide-text font-medium leading-relaxed">{t(`about.whyTide.goals.g${i+1}`, g.text)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
