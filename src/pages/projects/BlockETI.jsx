import { motion } from 'framer-motion'
import { BookOpen, Users, Heart } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import TodoPlaceholder from '../../components/ui/TodoPlaceholder'
import { Link } from 'react-router-dom'
import data from '../../data/projects-block-eti.json'
import { useTranslation } from 'react-i18next'

const ICONS = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Heart:    <Heart className="w-6 h-6" />,
  Users:    <Users className="w-6 h-6" />,
}

export default function BlockETI() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('projects.blockETI.title', data.meta.title)} subtitle={t('projects.blockETI.tagline', data.meta.tagline)} gradient />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl mb-16">
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{data.overview.title}</h2>
            <p className="text-tide-muted font-body leading-relaxed">{t('projects.blockETI.overview', data.overview.body)}</p>
          </motion.div>
          <SectionHeader badge={data.subPrograms.sectionBadge} title={data.subPrograms.sectionTitle} subtitle={data.subPrograms.sectionSubtitle} />
          <div className="grid sm:grid-cols-3 gap-6">
            {data.subPrograms.items.map((p, i) => (
              <Card key={p.name} delay={i * 0.1} className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-5">
                  {ICONS[p.iconKey] || <BookOpen className="w-6 h-6" />}
                </div>
                <h3 className="font-display text-lg font-semibold text-tide-text mb-2">{p.name}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{p.desc}</p>
                {p.to && (
                  <Link to={p.to} className="mt-3 inline-flex items-center text-xs font-body font-semibold text-primary hover:underline">
                    Learn more →
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TodoPlaceholder message="Full Block ETI content could not be retrieved from the source website. Please add detailed program statistics, partner schools, and impact numbers here." />
    </>
  )
}
