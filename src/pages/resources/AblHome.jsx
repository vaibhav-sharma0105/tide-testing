import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import SectionHeader from '../../components/ui/SectionHeader'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import Button from '../../components/ui/Button'
import ResourceTypeBadge from '../../components/abl/ResourceTypeBadge'
import { useABLData } from '../../hooks/useABLData'
import { TAB_STYLE_MAP } from '../../config/abl'
import ablData from '../../data/abl-home.json'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

export default function AblHome() {
  const { t } = useTranslation()
  const { data, loading, error } = useABLData()

  return (
    <>
      {/* Renders at the active /pramaan and a stranded duplicate
          /resources/abl-resources — canonical always points at the active
          path regardless of which URL rendered it. */}
      <SeoHead
        title={ablData.meta.seoTitle}
        description={ablData.meta.seoDescription}
        path="/pramaan"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Pramaan', path: '/pramaan' },
        ]}
      />
      <PageHero
        badge={ablData.meta.badge}
        title={t('abl.home.title', ablData.meta.title)}
        subtitle={t('abl.home.subtitle', ablData.meta.subtitle)}
        gradient
      />
      <AblNavBar />

      {/* Stats bar */}
      <section className="py-10 bg-white border-b border-tide-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col items-center gap-3">
                  <div className="h-10 w-20 bg-tide-subtle rounded" />
                  <div className="h-3 w-24 bg-tide-subtle rounded" />
                </div>
              ))
            ) : (
              <>
                <AnimatedCounter value={data?.meta?.total ?? 0}  label={t('abl.home.totalResources', ablData.stats.totalResources)} />
                <AnimatedCounter value={data?.tabs?.length ?? 0} label={t('abl.resourceCard.type', ablData.stats.resourceTypes)}  />
                <div className="text-center">
                  <div className="font-display text-4xl md:text-5xl font-bold leading-none text-primary">1–5</div>
                  <div className="mt-2.5 text-xs font-body font-semibold uppercase tracking-widest text-tide-muted">{t('abl.home.gradeCovered', ablData.stats.gradeCovered)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-body font-semibold uppercase tracking-widest text-tide-muted mb-1">{t('abl.home.lastSynced', ablData.stats.lastSynced)}</div>
                  <div className="text-xs sm:text-sm font-body text-tide-text">{formatDate(data?.lastUpdated)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* About ABL */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-primary-light text-primary-dark border border-primary/20">
              {t('abl.home.aboutBadge', ablData.about.badge)}
            </span>
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-5">{t('abl.home.aboutTitle', ablData.about.title)}</h2>
            <p className="font-body text-tide-muted leading-relaxed mb-6">
              {t('abl.home.aboutBody', ablData.about.body)}
            </p>
            <Button to="/resources/abl-resources/resource-center">
              {t('abl.home.browseButton', ablData.about.browseButton)} →
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl bg-white border border-tide-border p-8 space-y-4"
          >
            <h3 className="font-display text-lg font-semibold text-tide-text">{t('abl.home.whyTitle', ablData.about.whyTitle)}</h3>
            {ablData.about.whyPoints.map(point => (
              <div key={point} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-sm font-body text-tide-muted">{point}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Resource type cards */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge={t('abl.home.resourceTypesBadge', ablData.resourceTypes.badge)} title={t('abl.home.resourceTypesTitle', ablData.resourceTypes.title)} />

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-tide-subtle rounded-2xl h-36" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm font-body text-tide-muted text-center py-8">{error}</p>
          )}

          {!loading && !error && data && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.tabs.map((tab, i) => {
                const style = TAB_STYLE_MAP[tab] ?? TAB_STYLE_MAP._default
                return (
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <Link
                      to={`/resources/abl-resources/resource-center?type=${encodeURIComponent(tab)}`}
                      className="block bg-tide-bg rounded-2xl p-6 border border-tide-border hover:border-primary/30 hover:bg-primary-light transition-all duration-200 group"
                    >
                      <ResourceTypeBadge type={tab} />
                      <div className="mt-3 font-display text-xl font-semibold text-tide-text group-hover:text-primary transition-colors">
                        {style.pluralLabel}
                      </div>
                      <div className="text-sm font-body text-tide-muted mt-1">
                        {data.meta?.counts?.[tab] ?? 0} {t('abl.home.resourcesCount', ablData.resourceTypes.resourcesCount)}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
