import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/resources-annual-reports.json'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function AnnualReports() {
  return (
    <>
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge={data.section.sectionBadge}
            title={data.section.sectionTitle}
            subtitle={data.section.sectionSubtitle}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.reports.map((r, i) => (
              <motion.a
                key={r.year}
                {...fadeUp(i * 0.06)}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block rounded-2xl overflow-hidden border hover:shadow-card-hover transition-all duration-300 ${
                  r.highlight ? 'border-primary ring-2 ring-primary/20' : 'border-tide-border'
                } ${r.wide ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              >
                <div className="relative aspect-[3/4] bg-tide-subtle overflow-hidden">
                  <img
                    src={r.photo}
                    alt={`${r.year} ${r.label}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {r.highlight && (
                    <div className="absolute top-3 left-3">
                      <span className="badge-accent text-[10px]">Latest</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-float">
                      <ExternalLink className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-3 ${r.highlight ? 'bg-primary-light' : 'bg-white'}`}>
                  <h3 className={`font-display font-semibold text-sm leading-tight ${r.highlight ? 'text-primary-dark' : 'text-tide-text'}`}>
                    {r.year}
                  </h3>
                  <p className="text-xs font-body text-tide-muted mt-0.5">{r.label}</p>
                </div>
              </motion.a>
            ))}
          </div>

          <p className="mt-10 text-sm font-body text-tide-muted text-center">
            {data.section.footerNote.split('tideinternational.org')[0]}
            <a href="https://tideinternational.org/resources/annual-reports/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              tideinternational.org
            </a>
            {data.section.footerNote.split('tideinternational.org')[1]?.split('info@tideinternational.org')[0]}
            <a href="mailto:info@tideinternational.org" className="text-primary hover:underline">
              info@tideinternational.org
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
