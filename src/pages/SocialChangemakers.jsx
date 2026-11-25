import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowLeft, CalendarDays, GraduationCap, Leaf, Lightbulb, Pause, Play, Sprout, User, Users } from 'lucide-react'
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import Button from '../components/ui/Button'
import Highlight from '../components/ui/Highlight'
import data from '../data/social-changemakers.json'
import site from '../data/site.json'
import comingSoon from '../data/coming-soon.json'
import { fadeUp } from '../utils/motionPresets'
import TiltGlare from '../components/ui/TiltGlare'
import { tiltProps } from '../utils/tilt'
import FellowCard from '../components/changemakers/FellowCard'
import FellowProfile from '../components/changemakers/FellowProfile'
import HeroStats from '../components/ui/HeroStats'
import VideoLightbox from '../components/abl/VideoLightbox'
import withValue from '../components/ui/withValue'
import { groupByBatch, fellowsInOrder, matchesFellow } from '../utils/changemakers'
import { FELLOWS_PAGE_SIZE } from '../config/changemakers'
import { SearchBox, FilterMenu, ActiveFilters } from '../components/publications/PublicationControls'
import PublicationsPagination from '../components/publications/PublicationsPagination'
import { useDebouncedSearch } from '../hooks/usePublicationControls'
import snapshot from '../data/sheets/social-changemakers.json'
const TILT = tiltProps()

const fill = (t, vars) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, () => String(v ?? '')), t)

const SHEEN_MS = 6400
const PLACEHOLDER_COUNT = 6
// Skeleton caption widths, so the six cards don't look stamped from one mould.
const DESC_LINES = [
  ['w-full', 'w-[94%]', 'w-[88%]', 'w-[52%]'],
  ['w-full', 'w-[90%]', 'w-[96%]', 'w-[40%]'],
  ['w-full', 'w-[96%]', 'w-[84%]', 'w-[60%]'],
]

// ---- Intro: the text is the journey -------------------------------------------------------------
// The three sentences are three stops on one thread, read top to bottom: who the fellows are, what
// they did, where to look next. A dot walks the thread and rests at each stop in turn; the pin it
// rests at swells and a trail fills in behind it. Always top to bottom: after the last stop the dot
// and trail fade out and the walk starts again from the first stop (owner decision, 2026-11-23).
// The text itself never moves or dims, so nothing competes with reading. The loop runs only while
// on screen; a round pause / play button beside the heading stops and restarts it where it is
// (WCAG 2.2.2, owner decision 2026-11-25); reduced motion gets the finished thread and no button.
const STOPS = [
  { Icon: Users, color: '#1E6BAA' },
  { Icon: Leaf, color: '#15803D' },
  { Icon: Sprout, color: '#0D2137', final: true },
]
const LEG = 1.5      // seconds walking between stops
const REST = 3.4     // seconds resting at a stop: long enough to read the sentence beside it
const FORWARD = STOPS.length * REST + (STOPS.length - 1) * LEG
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

const FADE = 0.6     // seconds to fade out at the last stop, then again to fade in at the first

// Where the dot is `sec` seconds into the loop: `k` = the stop (0 to n-1, fractional while walking)
// and `alpha` = how visible the dot and trail are (they fade out at the end and back in at the top).
function walkerAt(sec) {
  let u = sec % (FORWARD + 2 * FADE)
  if (u >= FORWARD + FADE) return { k: 0, alpha: ease((u - FORWARD - FADE) / FADE) }
  if (u >= FORWARD) return { k: STOPS.length - 1, alpha: 1 - ease((u - FORWARD) / FADE) }
  for (let i = 0; i < STOPS.length; i += 1) {
    if (u < REST) return { k: i, alpha: 1 }
    u -= REST
    if (i === STOPS.length - 1) break
    if (u < LEG) return { k: i + ease(u / LEG), alpha: 1 }
    u -= LEG
  }
  return { k: STOPS.length - 1, alpha: 1 }
}

function Intro() {
  const { intro, meta } = data
  const reduce = useReducedMotion()
  const sentences = [intro.lead, ...intro.body.split(/(?<=\.)\s+/)]
  const listRef = useRef(null)
  const pinRefs = useRef([])
  const dotRef = useRef(null)
  const trailRef = useRef(null)
  const [ys, setYs] = useState(null)   // each pin's centre, measured from the top of the list
  const inView = useInView(listRef, { margin: '-80px' })
  const [playing, setPlaying] = useState(true)
  const elapsed = useRef(0)            // seconds into the loop, kept while paused

  useEffect(() => {
    const measure = () => {
      const top = listRef.current.getBoundingClientRect().top
      setYs(pinRefs.current.map((el) => { const r = el.getBoundingClientRect(); return r.top - top + r.height / 2 }))
    }
    measure()
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!ys) return undefined
    const paint = ({ k, alpha = 1 }) => {
      const i = Math.min(Math.floor(k), STOPS.length - 2)
      const y = ys[i] + (ys[i + 1] - ys[i]) * (k - i)
      dotRef.current?.style.setProperty('transform', `translateY(${(y - ys[0]).toFixed(1)}px)`)
      dotRef.current?.style.setProperty('opacity', alpha.toFixed(3))
      if (trailRef.current) { trailRef.current.style.height = `${(y - ys[0]).toFixed(1)}px`; trailRef.current.style.opacity = alpha.toFixed(3) }
      STOPS.forEach((_, n) => {
        const near = ease(Math.max(0, 1 - Math.abs(k - n) * 3)) * alpha
        const el = pinRefs.current[n]
        if (el) {
          el.style.transform = `scale(${(1 + 0.16 * near).toFixed(3)})`
          el.style.boxShadow = `0 0 0 ${(near * 7).toFixed(1)}px rgba(245,158,11,${(0.28 * near).toFixed(3)})`
        }
      })
    }
    if (reduce) { paint({ k: STOPS.length - 1 }); return undefined }
    paint(walkerAt(elapsed.current))
    if (!inView || !playing) return undefined
    let raf = 0
    const t0 = performance.now() - elapsed.current * 1000
    const frame = (now) => { elapsed.current = (now - t0) / 1000; paint(walkerAt(elapsed.current)); raf = requestAnimationFrame(frame) }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [ys, inView, reduce, playing])

  return (
    <section className="section-padding bg-tide-bg">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp()} className="mb-10 md:mb-12">
          <Link
            to={meta.backHref}
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-tide-muted underline-offset-4 transition-colors hover:text-primary-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            {meta.backLabel}
          </Link>
        </motion.div>

        <motion.header {...fadeUp()} className="mb-10 flex items-end justify-between gap-4 md:mb-12">
          <div className="min-w-0">
            <p className="mb-3 flex items-center gap-3 font-body text-xs font-bold uppercase tracking-[0.18em] text-accent-deeper">
              <span aria-hidden="true" className="h-px w-8 bg-accent-deeper" />
              {intro.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-tide-text md:text-4xl">{intro.heading}</h2>
          </div>
          {!reduce && (
            // Same look as the Partners rows' play / pause: paused = a filled blue disc that invites a
            // press; playing = a white disc with a pause icon (no spinning arc: the dot is the motion).
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? intro.motion.pause : intro.motion.play}
              className="group/play relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-out group-active/play:scale-90 ${playing
                  ? 'bg-white text-primary-dark ring-1 ring-primary/25 group-hover/play:bg-primary-faint'
                  : 'bg-primary-dark text-white shadow-[0_4px_10px_-4px_rgba(30,107,170,0.7)] group-hover/play:scale-[1.06]'}`}
              >
                <Play aria-hidden="true" fill="currentColor" className={`absolute ml-0.5 h-3.5 w-3.5 transition-all duration-300 ${playing ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                <Pause aria-hidden="true" fill="currentColor" className={`absolute h-3.5 w-3.5 transition-all duration-300 ${playing ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
              </span>
            </button>
          )}
        </motion.header>

        <ol ref={listRef} className="relative">
          {ys && (
            <>
              <span className="absolute left-[23px] w-0.5 bg-tide-border" style={{ top: ys[0], height: ys[ys.length - 1] - ys[0] }} aria-hidden="true" />
              <span ref={trailRef} className="absolute left-[23px] w-0.5 bg-accent-dark" style={{ top: ys[0], height: 0 }} aria-hidden="true" />
              <span ref={dotRef} className="absolute left-[16px] h-4 w-4 rounded-full bg-accent shadow-[0_0_0_4px_rgba(245,158,11,0.25)]" style={{ top: ys[0] - 8 }} aria-hidden="true" />
            </>
          )}
          {sentences.map((text, i) => {
            const stop = STOPS[i]
            return (
              <motion.li key={text} {...fadeUp(i * 0.08)} className="relative pb-10 pl-[4.5rem] last:pb-0 md:pl-24">
                <span
                  ref={(el) => { pinRefs.current[i] = el }}
                  className={`absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${stop.final ? 'bg-navy' : 'bg-white'}`}
                  style={{ borderColor: stop.color }}
                  aria-hidden="true"
                >
                  <stop.Icon className="h-5 w-5" style={{ color: stop.final ? '#F59E0B' : stop.color }} />
                </span>
                <p className="font-display text-xl leading-snug text-tide-text text-balance md:text-2xl md:leading-snug">
                  <Highlight text={text} words={intro.highlights} />
                </p>
                {i === sentences.length - 1 && (
                  <Button href={intro.jumpHref} variant="secondary" className="group mt-6">
                    {intro.jumpLabel}
                    <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
                  </Button>
                )}
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ---- One profile card, waiting for its student ------------------------------------------------
// It mirrors the final entry field for field: photo and batch year on top, then the name, the
// school and university graduation years, and the project description. Until the Sheet is
// connected the text is drawn as soft bars. Every few seconds one gentle light passes over the
// photos from card to card, in reading order, so the grid feels alive without competing with the
// page. A hover lifts a card a little. Reduced motion gets the still grid.
function ProfileCard({ index, beat, reduce }) {
  const sheen = useAnimation()
  const lines = DESC_LINES[index % DESC_LINES.length]

  useEffect(() => {
    if (reduce || !beat) return
    sheen.start({ x: ['-130%', '130%'], opacity: [0, 1, 0], transition: { duration: 1.5, ease: 'easeInOut', delay: index * 0.22 } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat])

  return (
    <motion.li
      {...fadeUp((index % 3) * 0.1)}
      {...TILT}
      className="group"
    >
      <div className="tilt-3d tilt-lift relative h-full overflow-hidden rounded-2xl border border-tide-border bg-white shadow-card hover:shadow-float">
      <TiltGlare />
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-light to-primary-faint">
        <User className="h-14 w-14 text-primary/40 transition-transform duration-500 group-hover:scale-105" strokeWidth={1.25} aria-hidden="true" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 shadow-sm">
          <CalendarDays className="h-3.5 w-3.5 text-accent-deeper" aria-hidden="true" />
          <span className="block h-2 w-10 rounded-full bg-tide-border" />
        </span>
        {!reduce && (
          <motion.span
            className="pointer-events-none absolute inset-y-0 -inset-x-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            initial={{ x: '-130%', opacity: 0 }}
            animate={sheen}
          />
        )}
      </div>
      <div className="space-y-3.5 p-5 md:p-6" aria-hidden="true">
        <span className="block h-4 w-3/5 rounded-full bg-tide-border" />
        <div className="flex items-center gap-2.5">
          <GraduationCap className="h-4 w-4 shrink-0 text-primary/50" />
          <span className="block h-2.5 w-4/5 rounded-full bg-tide-subtle" />
        </div>
        <div className="space-y-2 pt-1">
          {lines.map((w) => (
            <span key={w} className={`block h-2 rounded-full bg-tide-subtle ${w}`} />
          ))}
        </div>
      </div>
      </div>
    </motion.li>
  )
}

// Until the Sheet sync has published profiles, the section shows this waiting grid.
function PlaceholderProfiles() {
  const { grid } = data
  const reduce = useReducedMotion()
  const gridRef = useRef(null)
  const inView = useInView(gridRef, { margin: '-80px' })
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    // One beat, not a loop: motion that starts by itself must not go on past five seconds (WCAG 2.2.2).
    if (reduce || !inView || beat > 0) return undefined
    const id = setTimeout(() => setBeat(1), SHEEN_MS)
    return () => clearTimeout(id)
  }, [reduce, inView, beat])

  return (
    <section id="profiles" className="section-padding border-t border-tide-border bg-tide-warm">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="mb-10 text-center md:mb-12">
          <span className="mb-4 inline-block rounded-full border border-accent-dark/40 bg-accent-faint px-3 py-1 font-body text-xs font-semibold uppercase tracking-widest text-accent-deeper">
            {comingSoon.badge}
          </span>
          <p className="mx-auto max-w-xl font-body text-lg leading-relaxed text-tide-muted">{grid.note}</p>
        </motion.div>
        <ul ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
            <ProfileCard key={i} index={i} beat={beat} reduce={reduce} />
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---- The fellows, from the Sheet ----------------------------------------------------------------
// Built at build time from src/data/sheets/social-changemakers.json (written only by the sync,
// scripts/sync-social-changemakers.js). ONE list for every year, so it stays usable as batches pile
// up: a heading, then search (name / project) + a Batch filter (the Publications toolbar pieces),
// removable chips, a results line, and one grid — newest batch first, then the Sheet's "Order to
// post" (never shown) — FELLOWS_PAGE_SIZE per page with numbered pages. Everything is kept in the
// address (?search=, ?batch=, ?page=, ?fellow=), so a filtered view or a profile can be shared or
// reloaded. A card opens the fellow's profile (FellowProfile); videos open in the shared player on top.
function Profiles({ batches }) {
  const text = data.profiles
  const all = fellowsInOrder(batches)
  const [params, setParams] = useSearchParams()
  const [video, setVideo] = useState(null)
  const searchRef = useRef(null)
  const query = params.get('search') ?? ''
  const commitSearch = useCallback((q) => {
    setParams(prev => {
      const p = new URLSearchParams(prev)
      if (q.trim()) p.set('search', q)
      else p.delete('search')
      p.delete('page')
      return p
    }, { replace: true, preventScrollReset: true })
  }, [setParams])
  const [input, setInput] = useDebouncedSearch(query, commitSearch)
  if (all.length === 0) return <PlaceholderProfiles />

  const update = (changes, { replace = false } = {}) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === undefined || v === '') p.delete(k)
      else p.set(k, String(v))
    }
    setParams(p, { replace, preventScrollReset: true })
  }

  // Filters
  const batchParam = params.get('batch') ?? ''
  const batch = batches.some(g => g.label === batchParam) ? batchParam : ''
  const inBatch = batch ? batches.find(g => g.label === batch).fellows : all
  const shown = inBatch.filter(fl => matchesFellow(fl, query))
  const options = batches.map(g => ({ value: g.label, label: fill(text.batchHeading, { batch: g.label }), count: g.fellows.filter(fl => matchesFellow(fl, query)).length }))
  const pages = Math.max(1, Math.ceil(shown.length / FELLOWS_PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.get('page'))) || 1))
  const pageRows = shown.slice((page - 1) * FELLOWS_PAGE_SIZE, page * FELLOWS_PAGE_SIZE)
  const filtering = !!(batch || query.trim())
  const chips = [
    query.trim() && { key: 'search', label: fill(text.list.searchChip, { q: query.trim() }), onRemove: () => setInput('') },
    batch && { key: 'batch', label: fill(text.batchHeading, { batch }), onRemove: () => update({ batch: null, page: null }) },
  ].filter(Boolean)
  const clearAll = () => { setInput(''); update({ batch: null, page: null, search: null }); searchRef.current?.focus() }

  // Profile: previous / next follow the list being looked at.
  const openId = params.get('fellow')
  const ring = shown.some(fl => fl.id === openId) ? shown : all
  const at = ring.findIndex(fl => fl.id === openId)
  const current = at === -1 ? null : ring[at]
  const go = (id) => update({ fellow: id }, { replace: !!openId && !!id })

  const from = shown.length ? (page - 1) * FELLOWS_PAGE_SIZE + 1 : 0
  const to = Math.min(page * FELLOWS_PAGE_SIZE, shown.length)
  const resultsLine = fill(shown.length === 1 ? text.list.resultsOne : text.list.results, { from, to, count: shown.length, total: all.length })
  const pageHref = (n) => {
    const p = new URLSearchParams(params)
    p.delete('fellow')
    if (n > 1) p.set('page', String(n))
    else p.delete('page')
    const q = p.toString()
    return { search: q ? '?' + q : '', hash: '#fellows' }
  }

  return (
    <section id="profiles" className="section-padding border-t border-tide-border bg-tide-warm">
      <div className="mx-auto max-w-6xl">
        <motion.header {...fadeUp()} className="mb-8 max-w-2xl md:mb-10">
          <h2 className="font-display text-3xl font-semibold leading-tight text-tide-text md:text-4xl">{text.list.heading}</h2>
          <p className="mt-3 font-body text-base leading-relaxed text-tide-muted md:text-lg">{text.list.intro}</p>
        </motion.header>

        <div role="search" className="rounded-2xl border border-tide-border bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <SearchBox value={input} onChange={setInput} inputRef={searchRef} labels={text.list.search} className="flex-1" />
            <FilterMenu
              label={text.list.batchLabel}
              value={batch}
              onChange={(v) => update({ batch: v || null, page: null })}
              allLabel={text.list.allBatches}
              total={all.filter(fl => matchesFellow(fl, query)).length}
              options={options}
              align="right"
              className="sm:w-56"
            />
          </div>
          <ActiveFilters chips={chips} removeTemplate={text.list.removeFilter} clearAllLabel={text.list.clearAll} onClearAll={clearAll} className="mt-3" />
        </div>

        <p id="fellows" tabIndex={-1} role="status" aria-live="polite" className="mb-6 mt-6 font-body text-sm font-semibold text-tide-mutedOnLight focus:outline-none">
          {resultsLine}
        </p>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-tide-border bg-white/60 px-6 py-14 text-center">
            <p className="font-display text-xl text-tide-text">{text.list.noMatch}</p>
            {filtering && (
              <button type="button" onClick={clearAll} className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-primary-dark px-5 font-body text-sm font-semibold text-white hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {text.list.noMatchClear}
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
            {pageRows.map((fl, i) => <FellowCard key={fl.id} fellow={fl} text={text} index={i} onOpen={go} />)}
          </ul>
        )}

        <PublicationsPagination page={page} totalPages={pages} hrefFor={pageHref} labels={text.list.pagination} />
      </div>
      <FellowProfile
        fellow={current}
        prev={at > 0 ? ring[at - 1] : null}
        next={at !== -1 && at < ring.length - 1 ? ring[at + 1] : null}
        text={text}
        onClose={() => go(null)}
        onGo={go}
        onPlay={(src, title) => setVideo({ src, title })}
        videoOpen={!!video}
        position={at === -1 ? null : { at: at + 1, total: ring.length }}
      />
      <VideoLightbox src={video?.src ?? null} title={video?.title} onClose={() => setVideo(null)} translucent />
    </section>
  )
}

export default function SocialChangemakers() {
  const batches = groupByBatch(snapshot.resources)
  const total = batches.reduce((n, b) => n + b.fellows.length, 0)
  const films = batches.reduce((n, b) => n + b.fellows.filter(f => f.videoUrl).length, 0)
  const st = data.profiles.stats
  const heroItems = total > 0 ? [
    withValue(total === 1 ? st.fellowsOne : st.fellows, 'n', total),
    withValue(batches.length === 1 ? st.batchesOne : st.batches, 'n', batches.length),
    films > 0 && withValue(films === 1 ? st.filmsOne : st.films, 'n', films),
  ] : []
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/education-for-harmony/social-changemakers"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.educationForHarmony, path: '/education-for-harmony' },
          { name: data.meta.breadcrumbName, path: '/education-for-harmony/social-changemakers' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title}>
        <HeroStats items={heroItems} />
      </PageHero>
      <Intro />
      <Profiles batches={batches} />
    </>
  )
}
