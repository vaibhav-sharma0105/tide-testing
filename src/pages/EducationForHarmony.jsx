import { Fragment, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ExternalLink, Mail, Maximize2, Play, Sprout } from 'lucide-react'
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import Button from '../components/ui/Button'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import data from '../data/education-for-harmony.json'
import site from '../data/site.json'
import { imgSrc } from '../utils/imgSrc'
import { fadeUp } from '../utils/motionPresets'

const PIN_SHADOW = 'shadow-[0_2px_3px_rgba(0,0,0,0.35)]'

// Underlines the listed words in amber, like a highlighter pass over the lead sentence.
function Highlight({ text, words }) {
  const parts = text.split(new RegExp(`\\b(${words.join('|')})\\b`, 'i'))
  return parts.map((part, i) =>
    words.some((w) => w.toLowerCase() === part.toLowerCase())
      ? <mark key={i} className="bg-transparent text-inherit font-semibold [background:linear-gradient(transparent_62%,rgba(245,158,11,0.38)_62%)]">{part}</mark>
      : <Fragment key={i}>{part}</Fragment>
  )
}

// The six aims continue the lead sentence, so a thread runs down through them, pinned at each one.
// Hovering a row (or tapping it on a phone) puts it in focus: its pin grows, the row shifts a
// little toward the reader, and the others soften, so the eye can rest on one idea at a time.
function AimRow({ aim, first, last, active, dimmed, onEnter, onLeave, onTap }) {
  const [seen, setSeen] = useState(false)
  return (
    <motion.li
      {...fadeUp()}
      onViewportEnter={() => setSeen(true)}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={onTap}
      className={`relative cursor-default pl-8 transition-opacity duration-300 motion-reduce:transition-none ${dimmed ? 'opacity-[0.72]' : ''}`}
    >
      <motion.span
        className={`absolute left-[4px] w-0.5 bg-accent-dark/55 ${first ? 'top-[1.65rem] bottom-0' : last ? 'top-0 h-[1.65rem]' : 'inset-y-0'}`}
        aria-hidden="true"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        animate={{ clipPath: seen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      <span
        className={`absolute left-0 top-[1.4rem] h-2.5 w-2.5 rounded-full bg-accent transition-transform duration-300 motion-reduce:transition-none ${
          active ? 'scale-[1.7] ring-4 ring-accent/25' : ''
        }`}
        aria-hidden="true"
      />
      <div className={`py-3.5 ${last ? '' : 'border-b border-tide-border'}`}>
        <span className={`block font-body text-[15px] leading-relaxed text-tide-text transition-transform duration-300 motion-reduce:transition-none ${active ? 'translate-x-1' : ''}`}>{aim}</span>
      </div>
    </motion.li>
  )
}

function Aims({ aims }) {
  const [active, setActive] = useState(null)
  return (
    <ul className="border-t border-tide-border">
      {aims.map((aim, i) => (
        <AimRow
          key={aim}
          aim={aim}
          first={i === 0}
          last={i === aims.length - 1}
          active={active === i}
          dimmed={active !== null && active !== i}
          onEnter={(e) => { if (e.pointerType === 'mouse') setActive(i) }}
          onLeave={(e) => { if (e.pointerType === 'mouse') setActive(null) }}
          onTap={(e) => { if (e.pointerType !== 'mouse') setActive(active === i ? null : i) }}
        />
      ))}
    </ul>
  )
}

// ---- Intro: a photo panel and the aims, side by side -------------------------------------
function Intro() {
  const { intro } = data
  return (
    <section className="section-padding bg-tide-bg">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-14 items-stretch">
        <motion.div {...fadeUp()} className="relative self-center">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl shadow-card">
            <img src={imgSrc(intro.image)} alt="" aria-hidden="true" className="h-full w-full object-cover object-[74%_center]" />
          </div>
          {/* a light card layered over the photo's lower edge, like a print laid on a print */}
          <div className="relative z-10 mx-4 -mt-14 space-y-4 rounded-2xl border border-tide-border bg-white p-7 shadow-float md:mx-8 md:p-8">
            <span className="block h-0.5 w-10 bg-accent" aria-hidden="true" />
            {intro.paragraphs.map((para) => (
              <p key={para} className="font-body text-[15px] leading-relaxed text-tide-text md:text-base">{para}</p>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="flex flex-col justify-center">
          <p className="font-display text-2xl md:text-3xl leading-snug text-tide-text text-balance mb-6">
            <Highlight text={intro.lead} words={intro.leadHighlights} />
          </p>
          <Aims aims={intro.aims} />
        </motion.div>
      </div>
    </section>
  )
}

// ---- CARES: five dimensions beside the framework figure ----------------------------------
// The figure is the stakeholders' own image. A row lifts on hover, or on tap (tap again to let go).
function Cares() {
  const { cares } = data
  const [active, setActive] = useState(null)
  const pointer = useRef('mouse')
  const on = {
    hover: (i) => setActive(i),
    press: (e) => { pointer.current = e.pointerType },
    tap: (i) => setActive(pointer.current !== 'mouse' && active === i ? null : i),
  }

  return (
    <section className="section-padding bg-navy">
      <div className="max-w-6xl mx-auto">
        <motion.h2 {...fadeUp()} className="font-display text-3xl md:text-4xl font-semibold leading-tight text-white text-balance max-w-3xl mb-12 md:mb-14">
          {cares.title}
        </motion.h2>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-14 items-center">
          <ol className="order-2 lg:order-1">
            {cares.dimensions.map((d, i) => {
              const lit = active === i
              return (
                <motion.li
                  key={d.key}
                  {...fadeUp(i * 0.06)}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') on.hover(i) }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') on.hover(null) }}
                  onPointerDown={on.press}
                  onClick={() => on.tap(i)}
                  className={`flex items-start gap-5 border-t border-white/15 py-5 transition-colors duration-300 last:border-b ${lit ? 'bg-white/[0.06]' : ''}`}
                >
                  <span className={`w-12 shrink-0 text-center font-display text-5xl font-bold leading-none transition-colors duration-300 ${lit ? 'text-accent' : 'text-accent/60'}`}>{d.key}</span>
                  <span className="block">
                    <span className="block font-display text-lg font-semibold text-white">{d.name}</span>
                    <span className="mt-1 block font-body text-sm leading-relaxed text-white/70">{d.desc}</span>
                  </span>
                </motion.li>
              )
            })}
          </ol>

          <motion.figure
            {...fadeUp(0.1)}
            className="order-1 lg:order-2 mx-auto w-full max-w-[520px] lg:max-w-none rounded-3xl bg-white p-5 md:p-7 shadow-float ring-1 ring-white/20"
          >
            <img
              src={imgSrc(cares.image)}
              alt={cares.imageAlt}
              width="610"
              height="590"
              loading="lazy"
              className="h-auto w-full"
            />
          </motion.figure>
        </div>
      </div>
    </section>
  )
}

// ---- Ecosystem: one idea per row, number first, one primary action -----------------------
// An amber thread runs down the left, pinned at each intervention. The last one is still being
// developed, so its thread is dashed and its pin hollow.
function EcoRow({ item, last, index, reduce }) {
  const cta = item.cta?.label && (item.cta.to || item.cta.href) ? item.cta : null
  const links = (item.links || []).filter((l) => l.href)
  const external = cta?.href && !cta.href.startsWith('#')
  const [seen, setSeen] = useState(false)
  const [focus, setFocus] = useState(false)
  return (
    <motion.li
      {...fadeUp()}
      onViewportEnter={() => setSeen(true)}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(true) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setFocus(false) }}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') setFocus((f) => !f) }}
      className="relative pl-10 md:pl-14"
    >
      {/* thread to the next pin (or a dashed stub where the ecosystem is still growing) */}
      {last ? (
        <span className="absolute left-[7px] top-[2.9rem] h-14 border-l-2 border-dashed border-accent-dark/60" aria-hidden="true" />
      ) : (
        <motion.span
          className="absolute left-[7px] top-[2.9rem] bottom-0 w-0.5 bg-accent-dark"
          aria-hidden="true"
          initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: seen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      )}
      <span
        className={`absolute left-0 top-[2.4rem] h-4 w-4 rounded-full ${
          last ? 'border-2 border-accent-dark bg-white' : `${index % 2 ? 'bg-accent' : 'bg-primary'} ${PIN_SHADOW}`
        }`}
        aria-hidden="true"
      />

      <span className={`pointer-events-none absolute inset-y-2 -inset-x-2 left-8 rounded-2xl bg-primary-faint/60 transition-opacity duration-300 md:left-12 ${focus ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      <div className={`relative px-2 py-9 md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-x-10 ${last ? '' : 'border-b border-tide-border'}`}>
        <div className="mb-4 md:mb-0">
          {item.stat ? (
            <>
              <div className="w-fit">
                <AnimatedCounter value={item.stat} numClassName="font-display text-5xl md:text-6xl font-bold leading-none text-primary" />
              </div>
              <p className="mt-2.5 max-w-[14rem] font-body text-sm font-medium leading-snug text-tide-muted">{item.statLabel}</p>
            </>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-accent-dark/60 text-accent-deeper" aria-hidden="true">
              <Sprout className="h-7 w-7" />
            </span>
          )}
        </div>

        <div>
          <h3 className="font-display text-2xl font-semibold leading-snug text-tide-text">{item.name}</h3>
          <p className="mt-2 max-w-prose font-body leading-relaxed text-tide-muted">{item.desc}</p>
          {(cta || links.length > 0) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              {cta && (
                <Button to={cta.to} href={cta.href} external={external} variant="secondary">
                  {cta.label}
                  {external ? <ExternalLink className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              )}
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  {...(l.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {l.label}
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  )
}

function Ecosystem() {
  const { ecosystem } = data
  const reduce = useReducedMotion()
  return (
    <section className="section-padding bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp()} className="mb-8 md:mb-10">
          <span className="block h-0.5 w-10 bg-accent mb-5" aria-hidden="true" />
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-tide-text text-balance">
            {ecosystem.title}
          </h2>
        </motion.div>
        <ol>
          {ecosystem.items.map((item, i) => (
            <EcoRow key={item.name} item={item} index={i} last={i === ecosystem.items.length - 1} reduce={reduce} />
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---- Video: a pinned print; the player loads only when asked ----------------------------
function Video() {
  const { video } = data
  const [playing, setPlaying] = useState(false)
  return (
    <section id="glimpses" className="section-padding scroll-mt-20 bg-tide-warm">
      <div className="max-w-4xl mx-auto">
        <motion.h2 {...fadeUp()} className="mb-10 text-center font-display text-3xl md:text-4xl font-semibold leading-tight text-tide-text text-balance">
          {video.title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: -0.8 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="relative rounded-md bg-white p-2 md:p-3 shadow-float"
        >
          <span className={`absolute left-1/2 -top-2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-primary ${PIN_SHADOW}`} aria-hidden="true" />
          <div className="relative aspect-video overflow-hidden rounded-sm bg-navy">
            {playing ? (
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                title={video.title}
                className="absolute inset-0 h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={video.playLabel}
                className="group absolute inset-0 block w-full cursor-pointer"
              >
                <img src={imgSrc(video.poster)} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-navy/35 transition-colors duration-300 group-hover:bg-navy/20" aria-hidden="true" />
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-navy shadow-float transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-1 h-8 w-8 fill-current" aria-hidden="true" />
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---- Dashboard ---------------------------------------------------------------------------------
// The dashboard sits in the page on every screen. It doesn't scroll, so it never fights the page.
// Over it, a translucent veil with a link to the full dashboard in a new tab: shown on hover with a
// mouse, always shown on touch (there is no hover).
const BARS = [38, 62, 48, 80, 58, 92, 72]
const HOVER_QUERY = '(hover: hover)'
const useCanHover = () => {
  const [canHover, setCanHover] = useState(() => typeof window !== 'undefined' && window.matchMedia(HOVER_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(HOVER_QUERY)
    const update = () => setCanHover(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return canHover
}

function Screen({ url, title, reduce, still }) {
  if (url) {
    // the frame is a scrollbar's width too wide, so the bar sits outside the clipped box
    return <iframe src={url} title={title} scrolling="no" className="h-full w-[calc(100%+24px)] max-w-none border-0" loading="lazy" />
  }
  return (
    <div className="grid h-full grid-cols-3 content-start gap-3 bg-tide-bg p-4 md:p-6" aria-hidden="true">
      {[0, 1, 2].map((k) => (
        <div key={k} className="rounded-lg bg-white p-3 shadow-sm md:p-4">
          <span className="block h-2 w-8 rounded-full bg-tide-border" />
          <span className={`mt-3 block h-4 rounded-full ${k === 1 ? 'w-14 bg-accent' : 'w-12 bg-primary'}`} />
        </div>
      ))}
      <div className="col-span-3 rounded-lg bg-white p-4 shadow-sm md:p-6">
        <div className="flex h-40 items-end gap-2 md:h-64 md:gap-4">
          {BARS.map((h, i) => (
            <motion.span
              key={i}
              className={`flex-1 origin-bottom rounded-t ${i === BARS.length - 2 ? 'bg-accent' : 'bg-primary/70'}`}
              style={{ height: `${h}%` }}
              initial={reduce || still ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.2 + i * 0.08 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { dashboard } = data
  const reduce = useReducedMotion()
  const canHover = useCanHover()
  return (
    <section className="section-padding border-t border-tide-border bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="mb-8 md:mb-10">
          <div className="max-w-xl">
            <span className="block h-0.5 w-10 bg-accent mb-5" aria-hidden="true" />
            <h2 className="mb-3 font-display text-3xl md:text-4xl font-semibold leading-tight text-tide-text text-balance">{dashboard.title}</h2>
            <p className="font-body text-lg leading-relaxed text-tide-muted">{dashboard.body}</p>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="relative h-[520px] overflow-hidden sm:h-[580px]">
          <Screen url={dashboard.embedUrl} title={dashboard.title} reduce={reduce} />
          <a
            href={dashboard.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={dashboard.ctaLabel}
            className={`absolute inset-0 flex items-center justify-center bg-white/50 ${
              canHover ? 'opacity-0 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100' : ''
            }`}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 font-body text-sm font-semibold text-white shadow-float">
              {canHover ? dashboard.ctaLabel : dashboard.fullScreenLabel}
              {canHover ? <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ---- Collaborate: three overlapping shapes floating on water -----------------------------------
// A touch (hover on desktop, tap on a phone) is a drop on the surface, and the ripple is not drawn
// on top of the shapes: it moves them. A circular wavefront leaves the point of contact at one
// speed. Behind the front the surface oscillates, the amplitude falls as the wave spreads
// (energy over a growing circumference, ~1/sqrt(r)) and as it loses energy over time. Every point
// on each shape's outline is pushed in or out by the wave height where that point sits, so the
// outlines really wobble, and the wave carries on through them. Each shape also gets a small
// shove away from the drop as the front reaches it, then rocks back on a damped spring, so the
// overlap between the shapes shifts. The shapes appear the same way, as drops landing.
const VIEW = 300
const SHAPES = [
  { cx: 87, cy: 123, r: 87, stroke: '#1E6BAA', fill: 'rgba(30,107,170,0.10)', land: 0.1 },
  { cx: 213, cy: 123, r: 87, stroke: '#D97706', fill: 'rgba(245,158,11,0.15)', land: 0.3 },
  { cx: 150, cy: 201, r: 87, stroke: '#1E3A5F', fill: 'rgba(13,33,55,0.08)', land: 0.5 },
]
const SIM = {
  speed: 105,        // wavefront speed, viewBox units per second
  wavelength: 40,
  amp: 5.5,            // outline displacement near the drop
  decay: 2.2,        // seconds for the wave to lose most of its energy
  tail: 2.1,         // wavelengths of oscillation trailing the front
  shove: 24,         // velocity given to a shape as the front reaches it
  stiffness: 70,     // spring pulling a shape back to rest
  damping: 5,        // lets it rock back a couple of times, then settle
  points: 144,
  life: 4.5,         // seconds before a wave is dropped from the simulation
}

const smooth = (x) => (x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x))

// Surface height at distance d from the drop, `age` seconds after it landed.
function waveHeight(d, age) {
  const u = SIM.speed * age - d              // how far behind the front this point is
  if (u <= 0) return 0
  const k = (2 * Math.PI) / SIM.wavelength
  const edge = smooth(u / (SIM.wavelength * 0.6))                  // the front rises smoothly
  const tail = Math.exp(-u / (SIM.wavelength * SIM.tail))          // the wake dies away behind it
  const spread = Math.sqrt(20 / Math.max(d, 20))                   // energy spreading round the circle
  return SIM.amp * spread * Math.exp(-age / SIM.decay) * edge * tail * Math.sin(k * u)
}

function outline(shape, off, waves, now) {
  let d = ''
  for (let n = 0; n < SIM.points; n++) {
    const th = (n / SIM.points) * 2 * Math.PI
    const nx = Math.cos(th), ny = Math.sin(th)
    let x = shape.cx + off.x + shape.r * nx
    let y = shape.cy + off.y + shape.r * ny
    let h = 0
    for (const w of waves) h += w.gain * waveHeight(Math.hypot(x - w.x, y - w.y), (now - w.t0) / 1000)
    x += nx * h
    y += ny * h
    d += `${n ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return `${d}Z`
}

const REST_PATHS = SHAPES.map((s) => outline(s, { x: 0, y: 0 }, [], 0))

function Rings({ reduce }) {
  const boxRef = useRef(null)
  const pathRefs = useRef([])
  const last = useRef({ x: -999, y: -999, t: 0 })
  const sim = useRef({ waves: [], body: SHAPES.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })), raf: 0, prev: 0 })
  const timers = useRef([])

  const frame = (now) => {
    const st = sim.current
    const dt = Math.min(0.033, (now - st.prev) / 1000 || 0.016)
    st.prev = now
    st.waves = st.waves.filter((w) => (now - w.t0) / 1000 < SIM.life)

    SHAPES.forEach((s, i) => {
      const b = st.body[i]
      // the shove: once, as each wavefront arrives at the shape, away from the drop
      for (const w of st.waves) {
        if (w.hit[i]) continue
        const dist = Math.hypot(s.cx - w.x, s.cy - w.y)
        const age = (now - w.t0) / 1000
        if (SIM.speed * age >= Math.max(0, dist - s.r)) {
          w.hit[i] = true
          const spread = Math.sqrt(20 / Math.max(dist, 20))
          const push = SIM.shove * w.gain * spread * Math.exp(-age / SIM.decay)
          if (dist > 1) { b.vx += ((s.cx - w.x) / dist) * push; b.vy += ((s.cy - w.y) / dist) * push }
        }
      }
      // damped spring back to rest
      b.vx += (-SIM.stiffness * b.x - SIM.damping * b.vx) * dt
      b.vy += (-SIM.stiffness * b.y - SIM.damping * b.vy) * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
    })

    const busy = st.waves.length > 0 || st.body.some((b) => Math.abs(b.x) + Math.abs(b.y) + Math.abs(b.vx) + Math.abs(b.vy) > 0.02)
    SHAPES.forEach((s, i) => {
      const el = pathRefs.current[i]
      if (el) el.setAttribute('d', busy ? outline(s, st.body[i], st.waves, now) : REST_PATHS[i])
    })
    if (busy) st.raf = requestAnimationFrame(frame)
    else { st.raf = 0; st.body.forEach((b) => { b.x = b.y = b.vx = b.vy = 0 }) }
  }

  const drop = (x, y, gain = 1, delay = 0) => {
    if (reduce) return
    const start = () => {
      const st = sim.current
      st.waves = [...st.waves.slice(-7), { x, y, gain, t0: performance.now(), hit: [false, false, false] }]
      if (!st.raf) { st.prev = performance.now(); st.raf = requestAnimationFrame(frame) }
    }
    if (delay) timers.current.push(setTimeout(start, delay * 1000))
    else start()
  }

  useEffect(() => () => { timers.current.forEach(clearTimeout); cancelAnimationFrame(sim.current.raf) }, [])

  const touch = (e, force) => {
    const r = boxRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * VIEW
    const y = ((e.clientY - r.top) / r.height) * VIEW
    const now = performance.now()
    if (force || (Math.hypot(x - last.current.x, y - last.current.y) > 70 && now - last.current.t > 420)) {
      last.current = { x, y, t: now }
      drop(x, y)
    }
  }

  return (
    <motion.div
      ref={boxRef}
      className="relative mx-auto aspect-square w-full max-w-[300px] touch-manipulation select-none"
      onPointerEnter={(e) => touch(e, true)}
      onPointerMove={(e) => touch(e, false)}
      onPointerDown={(e) => touch(e, true)}
      onViewportEnter={() => SHAPES.forEach((sh) => drop(sh.cx, sh.cy, 0.6, sh.land + 0.35))}
      viewport={{ once: true, margin: '-60px' }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full overflow-visible">
        {SHAPES.map((sh, i) => (
          <motion.g
            key={sh.stroke}
            style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
            initial={reduce ? false : { opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ type: 'spring', stiffness: 120, damping: 11, delay: sh.land }}
          >
            <path
              ref={(el) => { pathRefs.current[i] = el }}
              d={REST_PATHS[i]}
              fill={sh.fill}
              stroke={sh.stroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  )
}

function Collaborate() {
  const { collaborate } = data
  const reduce = useReducedMotion()
  return (
    <section className="section-padding border-t border-tide-border bg-tide-bg">
      <div className="max-w-5xl mx-auto grid items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        <motion.div {...fadeUp()}>
          <span className="block h-0.5 w-10 bg-accent mb-5" aria-hidden="true" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-tide-text text-balance mb-5">
            {collaborate.title}
          </h2>
          <p className="mb-8 max-w-prose font-body text-lg leading-relaxed text-tide-muted">{collaborate.body}</p>
          <Button href={`mailto:${collaborate.ctaEmail}`} size="lg">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {collaborate.ctaLabel}
          </Button>
        </motion.div>
        <Rings reduce={reduce} />
      </div>
    </section>
  )
}

export default function EducationForHarmony() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/education-for-harmony"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: data.meta.breadcrumbName, path: '/education-for-harmony' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />
      <Intro />
      <Cares />
      <Ecosystem />
      <Video />
      <Collaborate />
      <Dashboard />
    </>
  )
}
