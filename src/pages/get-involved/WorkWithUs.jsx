import { motion } from 'framer-motion'
import { Briefcase, Mail, ArrowRight } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import TodoPlaceholder from '../../components/ui/TodoPlaceholder'
import data from '../../data/get-involved-work-with-us.json'
import { useTranslation } from 'react-i18next'

export default function WorkWithUs() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('getInvolved.work.title', data.meta.title)} subtitle={t('getInvolved.work.tagline', data.meta.tagline)} gradient />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.intro.title}</h2>
            <p className="text-tide-muted font-body leading-relaxed mb-8 text-lg">{data.intro.body}</p>
            <p className="text-tide-muted font-body leading-relaxed mb-8">{data.intro.contactBody}</p>
            <Button href={`mailto:${data.intro.contactEmail}`} size="lg">
              <Mail className="w-4 h-4" /> {data.intro.contactEmail} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <TodoPlaceholder message="Work With Us page content (open positions, roles, JDs, application process) not available from source site. Please add current openings here." />
    </>
  )
}
