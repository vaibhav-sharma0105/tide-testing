import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useScroll } from 'framer-motion'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import HeroStats from '../../components/ui/HeroStats'
import withValue from '../../components/ui/withValue'
import CountUp from '../../components/ui/CountUp'
import SectionHeader from '../../components/ui/SectionHeader'
import Button from '../../components/ui/Button'
import PartnerSlider from '../../components/partners/PartnerSlider'
import PartnerCard from '../../components/partners/PartnerCard'
import PartnerIndexBar from '../../components/partners/PartnerIndexBar'
import PartnerConstellation from '../../components/partners/PartnerConstellation'
import { SliderConductorContext, useSliderConductor } from '../../components/partners/sliderConductor'
import { useDebouncedSearch } from '../../hooks/usePublicationControls'
import { groupPartners, filterGroups, comparePartners, partnerTier } from '../../utils/partnerFilters'
import { getPartnerLogo } from '../../utils/partnerPhotos'
import { SLIDE_INTERVAL_MS, CONSTELLATION_MAX, CONSTELLATION_MIN } from '../../config/partners'
import data from '../../data/about-our-partners.json'
import site from '../../data/site.json'
import snapshot from '../../data/sheets/partners.json'

// /about/our-partners — built at build time from the Sheet snapshot (src/data/sheets/partners.json,
// written only by the partners sync). Top to bottom:
//   1. banner: title, the figures (counting up) and — beside it — the highest-priority partners'
//      logos as a floating network (PartnerConstellation);
//   2. a bar that sticks under the site header: one tab per section (the one being read is marked)
//      + the name search (PartnerIndexBar);
//   3. the sections as numbered chapters on a spine that fills as you scroll (wide screens), one
//      PartnerSlider each (A→Z, "Others" last; partners by priority, then A→Z); one conductor moves
//      at most one slider at a time, and only after the visitor pressed Play;
//      while searching: one flat grid of matches, each card naming its section;
//   4. an invitation band (YAML `cta`).
// The search is kept in the address (?search=), so a link or reload keeps it.

const PATH = '/about/our-partners'
// Header (70px) + index bar (64px) + breathing room: where a section counts as "being read".
const READ_LINE = 170

export default function OurPartners() {
  const text = data.directory
  const stats = data.meta.stats
  const location = useLocation()
  const navigate = useNavigate()
  const groups = useMemo(() => groupPartners(snapshot.resources), [])
  const total = groups.reduce((n, g) => n + g.partners.length, 0)
  const headingId = useCallback((key) => `partners-section-${groups.findIndex(x => x.key === key)}`, [groups])
  const conductor = useSliderConductor(SLIDE_INTERVAL_MS)

  // The banner network: highest priority first, real logos only.
  const constellation = useMemo(() => {
    const top = [...(snapshot.resources ?? [])].filter(r => r?.name && getPartnerLogo(r.id)).sort(comparePartners).slice(0, CONSTELLATION_MAX)
    return top.length >= CONSTELLATION_MIN ? top : []
  }, [])

  const query = new URLSearchParams(location.search).get('search') ?? ''
  const commit = useCallback((q) => {
    const params = new URLSearchParams(window.location.search)
    if (q.trim()) params.set('search', q)
    else params.delete('search')
    const s = params.toString()
    navigate({ search: s ? `?${s}` : '' }, { replace: true })
  }, [navigate])
  const [input, setInput] = useDebouncedSearch(query, commit)
  const inputRef = useRef(null)
  // "Clear search" in the no-match state disappears once used; keyboard focus goes back to the box.
  const clearAndFocus = () => { setInput(''); inputRef.current?.focus() }

  const searching = query.trim() !== ''
  const shown = useMemo(() => filterGroups(groups, query), [groups, query])
  const matches = shown.reduce((n, g) => n + g.partners.length, 0)
  const resultLine = searching
    ? (matches === 1 ? text.resultCountOne : text.resultCount).replace('{count}', String(matches)).replace('{total}', String(total))
    : ''

  // Which section is being read: the last heading above the read line.
  const [activeKey, setActiveKey] = useState(groups[0]?.key ?? null)
  useEffect(() => {
    if (searching || groups.length === 0) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      let current = groups[0].key
      for (const g of groups) {
        const el = document.getElementById(headingId(g.key))
        if (el && el.getBoundingClientRect().top <= READ_LINE) current = g.key
      }
      setActiveKey(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [groups, headingId, searching])

  // The spine fills from the first section to the last as the page scrolls.
  const listRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: [`start ${READ_LINE}px`, 'end 60%'] })

  // Tabs: smooth scroll (instant under reduced motion) and keyboard focus to the section heading.
  const jumpTo = (e, key) => {
    const heading = document.getElementById(headingId(key))
    if (!heading) return
    e.preventDefault()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
    setActiveKey(key)
  }

  const heroItems = total > 0 ? [
    withValue(total === 1 ? stats.partnersOne : stats.partners, 'n', <CountUp value={total} />),
    withValue(groups.length === 1 ? stats.groupsOne : stats.groups, 'n', <CountUp value={groups.length} delay={0.35} duration={0.8} />),
  ] : []

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path={PATH}
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.aboutUs },
          { name: data.meta.breadcrumbName, path: PATH },
        ]}
      />
      <PageHero
        badge={data.meta.badge}
        title={data.meta.title}
        subtitle={data.meta.subtitle}
        aside={constellation.length ? <PartnerConstellation partners={constellation} /> : undefined}
      >
        <HeroStats items={heroItems} />
      </PageHero>

      <section className="relative bg-tide-bg">
        {/* A faint dot grid that fades out below the bar: texture, not something to read. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(theme(colors.primary.DEFAULT/0.10)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />

        {total === 0 ? (
          <p className="relative px-4 py-24 text-center font-body text-tide-muted">{text.empty}</p>
        ) : (
          <>
            <PartnerIndexBar
              groups={groups}
              activeKey={activeKey}
              onJump={jumpTo}
              headingId={headingId}
              search={{ input, setInput, inputRef }}
              text={text}
              searching={searching}
            />

            <div className="relative px-4 pb-20 pt-10 md:px-8 md:pb-28 md:pt-14 lg:px-16">
              <div className="mx-auto max-w-6xl">
                <p className={searching ? 'mb-6 font-body text-sm font-semibold text-tide-text' : 'sr-only'} role="status" aria-live="polite">{resultLine}</p>

                {searching && shown.length === 0 && (
                  <div className="py-10 text-center font-body text-tide-muted">
                    <p>{text.noMatch.replace('{query}', () => query.trim())}</p>
                    <button
                      type="button"
                      onClick={clearAndFocus}
                      className="mt-4 min-h-[44px] rounded-full border border-tide-border bg-white px-5 text-sm font-semibold text-primary-dark hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-full"
                    >
                      {text.noMatchClear}
                    </button>
                  </div>
                )}

                {searching && shown.length > 0 && (
                  <ul aria-label={resultLine} className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                    {shown.flatMap(g => g.partners.map((p, i) => (
                      <motion.li
                        key={p.id}
                        className="relative"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <PartnerCard partner={p} text={text} caption={g.label} tier={partnerTier(p.priority)} />
                      </motion.li>
                    )))}
                  </ul>
                )}

                {!searching && (
                  <SliderConductorContext.Provider value={conductor}>
                    <div ref={listRef} className="relative lg:pl-[4.75rem]">
                      {/* The spine (wide screens): a line through the section numbers that fills as you read. */}
                      <div aria-hidden="true" className="absolute bottom-6 left-6 top-6 hidden w-px bg-tide-border lg:block">
                        <motion.div className="absolute inset-0 origin-top bg-gradient-to-b from-primary via-primary-mid to-primary/30" style={{ scaleY: scrollYProgress }} />
                      </div>
                      <div className="space-y-16 md:space-y-20">
                        {groups.map((g, i) => (
                          // Index-based id: two type names can reduce to the same slug ("A & B" / "A / B").
                          <PartnerSlider key={g.key} group={g} index={i} text={text} headingId={headingId(g.key)} active={g.key === activeKey} />
                        ))}
                      </div>
                    </div>
                  </SliderConductorContext.Provider>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="relative overflow-hidden bg-navy px-4 py-16 md:px-8 md:py-20 lg:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SectionHeader light center title={data.cta.title} subtitle={data.cta.subtitle} className="!mb-8" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button to={data.cta.primary.to}>{data.cta.primary.label}</Button>
            <Button to={data.cta.secondary.to} variant="white">{data.cta.secondary.label}</Button>
          </div>
        </div>
      </section>
    </>
  )
}
