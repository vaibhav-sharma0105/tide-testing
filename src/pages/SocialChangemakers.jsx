import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowLeft, CalendarDays, GraduationCap, Leaf, Lightbulb, Sprout, User, Users } from 'lucide-react'
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import Button from '../components/ui/Button'
import data from '../data/social-changemakers.json'
import site from '../data/site.json'
import comingSoon from '../data/coming-soon.json'
import { fadeUp } from '../utils/motionPresets'

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
// rests at swells and a trail fills in behind it. At the end it walks back, so the loop never jumps.
// The text itself never moves or dims, so nothing competes with reading. The loop runs only while
// on screen; reduced motion gets the finished thread.
const STOPS = [
  { Icon: Users, color: '#1E6BAA' },
  { Icon: Leaf, color: '#15803D' },
  { Icon: Sprout, color: '#0D2137', final: true },
]
const LEG = 1.5      // seconds walking between stops
const REST = 3.4     // seconds resting at a stop: long enough to read the sentence beside it
const FORWARD = STOPS.length * REST + (STOPS.length - 1) * LEG
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

// Which stop the dot is at (0 to n-1, fractional while walking), `sec` seconds into the loop.
function walkerAt(sec) {
  let u = sec % (2 * FORWARD)
  if (u > FORWARD) u = 2 * FORWARD - u
  for (let i = 0; i < STOPS.length; i += 1) {
    if (u < REST) return i
    u -= REST
    if (i === STOPS.length - 1) break
    if (u < LEG) return i + ease(u / LEG)
    u -= LEG
  }
  return STOPS.length - 1
}

function Highlight({ text, words }) {
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'i'))
  return parts.map((part, i) =>
    words.some((w) => w.toLowerCase() === part.toLowerCase())
      ? <mark key={i} className="bg-transparent text-inherit font-semibold [background:linear-gradient(transparent_62%,rgba(245,158,11,0.38)_62%)]">{part}</mark>
      : <Fragment key={i}>{part}</Fragment>
  )
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
    const paint = (k) => {
      const i = Math.min(Math.floor(k), STOPS.length - 2)
      const y = ys[i] + (ys[i + 1] - ys[i]) * (k - i)
      dotRef.current?.style.setProperty('transform', `translateY(${(y - ys[0]).toFixed(1)}px)`)
      if (trailRef.current) trailRef.current.style.height = `${(y - ys[0]).toFixed(1)}px`
      STOPS.forEach((_, n) => {
        const near = ease(Math.max(0, 1 - Math.abs(k - n) * 3))
        const el = pinRefs.current[n]
        if (el) {
          el.style.transform = `scale(${(1 + 0.16 * near).toFixed(3)})`
          el.style.boxShadow = `0 0 0 ${(near * 7).toFixed(1)}px rgba(245,158,11,${(0.28 * near).toFixed(3)})`
        }
      })
    }
    if (reduce) { paint(STOPS.length - 1); return undefined }
    if (!inView) return undefined
    let raf = 0
    const t0 = performance.now()
    const frame = (now) => { paint(walkerAt((now - t0) / 1000)); raf = requestAnimationFrame(frame) }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [ys, inView, reduce])

  return (
    <section className="section-padding bg-tide-bg">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp()} className="mb-10 md:mb-12">
          <Link
            to={meta.backHref}
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-tide-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            {meta.backLabel}
          </Link>
        </motion.div>

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
      whileHover={reduce ? undefined : { y: -5, transition: { type: 'spring', stiffness: 160, damping: 16 } }}
      className="group overflow-hidden rounded-2xl border border-tide-border bg-white shadow-card transition-shadow duration-300 hover:shadow-float"
    >
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
    </motion.li>
  )
}

function Profiles() {
  const { grid } = data
  const reduce = useReducedMotion()
  const gridRef = useRef(null)
  const inView = useInView(gridRef, { margin: '-80px' })
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    if (reduce || !inView) return undefined
    const id = setInterval(() => setBeat((b) => b + 1), SHEEN_MS)
    return () => clearInterval(id)
  }, [reduce, inView])

  return (
    <section id="profiles" className="section-padding scroll-mt-16 border-t border-tide-border bg-tide-warm">
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

export default function SocialChangemakers() {
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
      <PageHero badge={data.meta.badge} title={data.meta.title} />
      <Intro />
      <Profiles />
    </>
  )
}
