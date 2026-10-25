import { motion } from 'framer-motion'
import SeoHead from '../../components/ui/SeoHead'
import { Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import data from '../../data/about-past-programs.json'
import site from '../../data/site.json'
import { fadeUp } from '../../utils/motionPresets'

export default function PastPrograms() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/about/past-programs"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.aboutUs },
          { name: data.meta.breadcrumbName, path: '/about/past-programs' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <motion.p {...fadeUp()} className="text-lg font-body text-tide-muted leading-relaxed mb-16 max-w-3xl">
            {data.intro}
          </motion.p>

          <div className="space-y-12">
            {data.programs.map((prog, i) => (
              <motion.div key={prog.id} {...fadeUp(i * 0.08)}
                className="bg-white rounded-2xl border border-tide-border p-5 md:p-8 lg:p-10"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-tide-text mb-1">{prog.name}</h2>
                    <p className="font-body text-sm text-primary font-semibold">{prog.tagline}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {prog.stats.map(s => (
                      <div key={s.label} className="text-center px-4 py-2 bg-primary-light rounded-xl border border-primary/10">
                        <div className="font-display font-bold text-primary text-sm leading-tight">{s.value}</div>
                        <div className="text-[10px] font-body text-tide-mutedOnLight uppercase tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="font-body text-tide-muted leading-relaxed">{prog.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <h2 className="font-display text-2xl font-semibold text-tide-text mb-4">{data.cta.title}</h2>
            <p className="font-body text-tide-muted mb-8">{data.cta.body}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/education-for-harmony"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-body font-semibold text-sm hover:bg-primary/90 transition-colors">
                {data.cta.efhLabel} →
              </Link>
              <Link to="/pramaan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-body font-semibold text-sm hover:bg-primary-light transition-colors">
                {data.cta.pramaanLabel} →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
