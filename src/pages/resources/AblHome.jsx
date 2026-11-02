import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BookOpen, Brain, Eye, GraduationCap, Languages, Library, School, Shapes, Users } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import PromoVideo from '../../components/abl/PromoVideo'
import PhotoStrip from '../../components/abl/PhotoStrip'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import Button from '../../components/ui/Button'
import Highlight from '../../components/ui/Highlight'
import ResourceTypeBadge from '../../components/abl/ResourceTypeBadge'
import { TypeIcon } from '../../components/abl/typeIcons'
import { useABLData } from '../../hooks/useABLData'
import { getTabStyle, getTypeColors } from '../../config/abl'
import ablData from '../../data/abl-home.json'
import site from '../../data/site.json'
import { fadeUp } from '../../utils/motionPresets'

// Icons cannot live in YAML: one per "Why ABL works" point (in order) and one per resource type.
const WHY_ICONS = [Eye, Brain, Users, Languages]
const STAT_ICONS = [Library, Shapes, GraduationCap]
const REACH_ICONS = [School, Users]

// '' when there is no usable date, so the freshness line simply does not render
function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch { return '' }
}

export default function AblHome() {
  const { data, loading, error } = useABLData()
  // the first sentence is the idea; the others (library, reach, ongoing work) follow beneath it
  const [lead, ...others] = ablData.about.body.split(/(?<=[.!?])\s+/)
  const rest = others.join(' ')

  return (
    <>
      <SeoHead
        title={ablData.meta.seoTitle}
        description={ablData.meta.seoDescription}
        path="/pramaan"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: ablData.meta.breadcrumbName, path: '/pramaan' },
        ]}
      />
      <PageHero
        badge={ablData.meta.badge}
        title={(
          <>
            {ablData.meta.title}
            <span className="mt-3 block font-display text-xl font-medium text-accent md:text-2xl lg:text-3xl">{ablData.meta.descriptor}</span>
          </>
        )}
        subtitle={ablData.meta.subtitle}
        aside={<PromoVideo />}
      />
      <AblNavBar />

      {/* Stats bar */}
      <section className="py-10 bg-white border-b border-tide-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center md:gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col items-center gap-3">
                  <div className="h-10 w-20 bg-tide-subtle rounded" />
                  <div className="h-3 w-24 bg-tide-subtle rounded" />
                </div>
              ))
            ) : (
              [
                <AnimatedCounter key="t" value={data?.meta?.total ?? 0} label={ablData.stats.totalResources} />,
                <AnimatedCounter key="r" value={data?.tabs?.length ?? 0} label={ablData.stats.resourceTypes} />,
                <div key="g" className="text-center">
                  <div className="font-display text-4xl md:text-5xl font-bold leading-none text-primary">{ablData.stats.gradeRange}</div>
                  <div className="mt-2.5 text-xs font-body font-semibold uppercase tracking-widest text-tide-muted">{ablData.stats.gradeCovered}</div>
                </div>,
              ].map((cell, i) => {
                const Icon = STAT_ICONS[i]
                return (
                  <motion.div key={cell.key} {...fadeUp(i * 0.08)} className="flex flex-col items-center">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    {cell}
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Freshness is reassurance, not a headline number: a quiet chip under the stats */}
          {!loading && formatDate(data?.lastUpdated) && (
            <motion.p {...fadeUp(0.3)} className="mt-8 flex items-center justify-center gap-2 text-center font-body text-xs text-tide-muted">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span>{ablData.stats.lastSynced} {formatDate(data?.lastUpdated)}</span>
            </motion.p>
          )}
        </div>
      </section>

      {/* About ABL: the idea first, then the reach, with the reasons beside it */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-6xl mx-auto grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <motion.div {...fadeUp()}>
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-primary-light text-primary-dark border border-primary/20">
              {ablData.about.badge}
            </span>
            <h2 className="mb-6 font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl">{ablData.about.title}</h2>
            {/* one block, one voice: the idea in full colour, the rest softer, same size and measure */}
            <div className="mb-9 max-w-prose space-y-4 border-l-2 border-accent pl-6 font-body text-base leading-relaxed md:text-lg">
              <p className="text-tide-text">
                <Highlight text={lead} words={ablData.about.highlights} />
              </p>
              <p className="text-tide-muted">{rest}</p>
            </div>

            <Button to="/pramaan/resource-centre" size="lg">
              {ablData.about.browseButton}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </motion.div>

          <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {ablData.about.reach.map((r, i) => {
              const Icon = REACH_ICONS[i] || School
              return (
                <motion.div key={r.label} {...fadeUp(0.1 + i * 0.08)} className="flex flex-col items-center rounded-3xl border border-tide-border bg-white p-5 text-center shadow-card">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <AnimatedCounter value={r.value} numClassName="font-display text-3xl md:text-4xl font-bold leading-none text-primary" />
                  <div className="mt-2 font-body text-sm font-medium text-tide-muted">{r.label}</div>
                </motion.div>
              )
            })}
          </div>

          <motion.div {...fadeUp(0.2)} className="rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8">
            <h3 className="mb-2 font-display text-xl font-semibold text-tide-text">{ablData.about.whyTitle}</h3>
            <span className="mb-4 block h-0.5 w-10 bg-accent" aria-hidden="true" />
            <ul>
              {ablData.about.whyPoints.map((point, i) => {
                const Icon = WHY_ICONS[i] || BookOpen
                return (
                  <li key={point} className="group flex items-start gap-4 border-b border-tide-border py-4 last:border-b-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="pt-1.5 font-body text-[15px] leading-snug text-tide-text transition-transform duration-300 group-hover:translate-x-1">{point}</p>
                  </li>
                )
              })}
            </ul>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery: a slow strip of sessions and materials, the proof between the idea and the action */}
      <section className="overflow-hidden border-t border-tide-border bg-tide-warm py-16 md:py-20">
        <motion.div {...fadeUp()} className="mx-auto mb-10 max-w-3xl px-4 text-center md:mb-12">
          <span className="mx-auto mb-5 block h-0.5 w-10 bg-accent" aria-hidden="true" />
          <h2 className="font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl">{ablData.gallery.title}</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-base leading-relaxed text-tide-muted md:text-lg">{ablData.gallery.subtitle}</p>
        </motion.div>
        <PhotoStrip />
      </section>

      {/* Resource type cards: where it all leads */}
      <section className="section-padding bg-white border-t border-tide-border">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="mb-12 text-center md:mb-14">
            <span className="inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-primary-light text-primary-dark border border-primary/20">
              {ablData.resourceTypes.badge}
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl lg:text-5xl">{ablData.resourceTypes.title}</h2>
          </motion.div>

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-tide-subtle rounded-2xl h-44" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm font-body text-tide-muted text-center py-8">{error}</p>
          )}

          {!loading && !error && data && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.tabs.map((tab, i) => {
                const style = getTabStyle(tab)
                const colors = getTypeColors(tab)
                return (
                  <motion.div key={tab} {...fadeUp(i * 0.08)}>
                    <Link
                      to={`/pramaan/resource-centre?type=${encodeURIComponent(tab)}`}
                      className={`group relative block h-full rounded-3xl border border-tide-border bg-tide-bg p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover ${colors.cardHover}`}
                    >
                      <ArrowUpRight className={`absolute right-5 top-5 h-5 w-5 ${colors.eyebrow} opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100`} aria-hidden="true" />
                      <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 ${colors.badge} ${colors.tileHover}`}>
                        <TypeIcon type={tab} className="h-6 w-6" />
                      </span>
                      <ResourceTypeBadge type={tab} />
                      <div className={`mt-3 font-display text-xl font-semibold text-tide-text transition-colors ${colors.titleHover}`}>
                        {style.pluralLabel}
                      </div>
                      <div className="mt-1 font-body text-sm text-tide-muted">
                        <span className="font-semibold text-tide-text">{data.meta?.counts?.[tab] ?? 0}</span> {ablData.resourceTypes.resourcesCount}
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
