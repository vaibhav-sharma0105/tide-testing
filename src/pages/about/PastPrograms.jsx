import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import { Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import data from '../../data/about-past-programs.json'
import site from '../../data/site.json'
import { fadeUp } from '../../utils/motionPresets'
import { imgSrc } from '../../utils/imgSrc'

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
                className="bg-white rounded-2xl border border-tide-border p-5 md:p-8 grid md:grid-cols-[1fr_19rem] md:grid-rows-[auto_1fr] gap-x-10 gap-y-5"
              >
                <div className="md:col-start-1 md:row-start-1">
                  <h2 className="font-display text-2xl font-semibold text-tide-text">{prog.name}</h2>
                  <p className="mt-1 font-body text-sm text-primary font-semibold">{prog.tagline}</p>
                </div>

                <div className="md:col-start-2 md:row-start-1 md:row-span-2 self-start md:sticky md:top-28 rounded-2xl bg-navy text-white px-6 pt-5 pb-2">
                  <div className="h-1 w-10 rounded-full bg-accent" />
                  <ul className="mt-3">
                    {prog.stats.map(stat => (
                      <li key={stat.label} className="flex items-baseline gap-4 py-3 border-b border-white/15 last:border-b-0">
                        <span className="font-display text-lg font-semibold leading-none w-20 shrink-0">{stat.value}</span>
                        <span className="font-body text-sm text-white/90 leading-snug">{stat.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-start-1 md:row-start-2 space-y-4 font-body text-tide-muted leading-relaxed">
                  {prog.description.map(para => <p key={para}>{para}</p>)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-4">{data.cta.title}</h2>
            <p className="font-body text-tide-muted leading-relaxed">{data.cta.body}</p>
          </motion.div>
          <ul className="mt-10 grid sm:grid-cols-3 gap-4 md:gap-5">
            {data.cta.links.map(link => (
              <li key={link.to}>
                <Link to={link.to} className="group relative block overflow-hidden rounded-2xl bg-navy aspect-[4/3] sm:aspect-[3/4]">
                  <img src={imgSrc(link.image)} alt="" loading="lazy" decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white leading-tight">{link.label}</h3>
                      <p className="mt-1 font-body text-sm text-white/85">{link.note}</p>
                    </div>
                    <span aria-hidden="true" className="shrink-0 w-10 h-10 rounded-full bg-accent text-navy flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
