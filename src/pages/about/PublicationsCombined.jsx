import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SeoHead from '../../components/ui/SeoHead'
import { FileText, Video, Image, Download, ExternalLink } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import data from '../../data/about-publications.json'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

const TYPE_ICON = { video: Video, photo: Image }

export default function PublicationsCombined() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('annualReports')

  const tabs = [
    { key: 'annualReports', label: t('pubs.tabs.annualReports', data.tabs.annualReports) },
    { key: 'events',        label: t('pubs.tabs.events',        data.tabs.events) },
    { key: 'research',      label: t('pubs.tabs.research',      data.tabs.research) },
  ]

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/about/publications"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About Us' },
          { name: 'Publications', path: '/about/publications' },
        ]}
      />
      <PageHero
        badge={data.meta.badge}
        title={t('pubs.title', data.meta.title)}
        subtitle={t('pubs.tagline', data.meta.tagline)}
        gradient
      />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">

          {/* Tab pills */}
          <motion.div {...fadeUp()} className="flex flex-wrap gap-2 mb-10">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full font-body text-sm font-semibold transition-colors duration-200 border ${
                  activeTab === tab.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-tide-muted border-tide-border hover:border-primary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Annual Reports tab */}
          {activeTab === 'annualReports' && (
            <motion.div key="annualReports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="font-body text-tide-muted mb-8">{t('pubs.ar.desc', data.annualReports.description)}</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.annualReports.items.map((item, i) => (
                  <motion.div key={item.year} {...fadeUp(i * 0.07)}
                    className="bg-white rounded-2xl border border-tide-border p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                      <FileText className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold text-primary mb-1">{item.year}</div>
                      <p className="font-body text-sm text-tide-text leading-snug">{item.title}</p>
                    </div>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-body font-semibold hover:bg-primary/90 transition-colors w-fit">
                        <Download className="w-3.5 h-3.5" /> {t('pubs.ar.download', 'Download')}
                      </a>
                    ) : (
                      <span className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tide-border text-tide-mutedOnLight text-xs font-body font-semibold cursor-not-allowed w-fit">
                        <Download className="w-3.5 h-3.5" /> {t('pubs.ar.comingSoon', 'Coming soon')}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Public Events tab */}
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="font-body text-tide-muted mb-8">{t('pubs.events.desc', data.events.description)}</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.events.items.map((item, i) => {
                  const TypeIcon = TYPE_ICON[item.type] || FileText
                  return (
                    <motion.div key={item.title} {...fadeUp(i * 0.06)}
                      className="bg-white rounded-2xl border border-tide-border p-6 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${item.type === 'video' ? 'bg-red-50' : 'bg-blue-50'}`}>
                          <TypeIcon className={`w-4 h-4 ${item.type === 'video' ? 'text-red-500' : 'text-blue-500'}`} />
                        </div>
                        <span className={`text-[10px] font-body font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.type === 'video' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="font-body text-sm font-semibold text-tide-text leading-snug">{item.title}</p>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center gap-2 text-xs font-body font-semibold text-primary hover:underline w-fit">
                          <ExternalLink className="w-3 h-3" /> {t('pubs.events.view', 'View')}
                        </a>
                      ) : (
                        <span className="mt-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-body font-bold uppercase tracking-wider w-fit">
                          {t('pubs.events.comingSoon', 'Coming soon')}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Research tab */}
          {activeTab === 'research' && (
            <motion.div key="research" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="font-body text-tide-muted mb-8">{t('pubs.research.desc', data.research.description)}</p>
              {data.research.items.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-12 h-12 text-tide-border mx-auto mb-4" />
                  <p className="font-body text-tide-muted">{t('pubs.research.placeholder', data.research.placeholder)}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {data.research.items.map((item, i) => (
                    <motion.div key={item.title} {...fadeUp(i * 0.07)}
                      className="bg-white rounded-2xl border border-tide-border p-6"
                    >
                      <p className="font-body text-sm font-semibold text-tide-text">{item.title}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </section>
    </>
  )
}
