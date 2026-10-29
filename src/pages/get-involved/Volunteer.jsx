import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Briefcase, ArrowRight, ArrowUpRight, ExternalLink, Mail } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import data from '../../data/get-involved-volunteer.json'
import site from '../../data/site.json'
import { imgSrc } from '../../utils/imgSrc'
import { makeFadeUp } from '../../utils/motionPresets'

const ICONS = {
  BookOpen:  <BookOpen className="w-5 h-5" />,
  Users:     <Users className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
}

const fadeUp = makeFadeUp({ y: 20, duration: 0.55 })

// Resting position of each print in the collage: width, placement (% of the frame) and tilt.
const PRINTS = [
  { box: 'left-0 top-0 w-[76%]', tilt: -2.5, ratio: 'aspect-[4/3]' },
  { box: 'right-0 top-[38%] w-[50%]', tilt: 3, ratio: 'aspect-square' },
  { box: 'left-[4%] bottom-0 w-[44%]', tilt: -4, ratio: 'aspect-square' },
]

// Real pendulum: released off-angle, it overshoots and rings down (low damping).
const PENDULUM = { type: 'spring', stiffness: 90, damping: 5.5, mass: 1 }

const PIN_SHADOW = 'shadow-[0_2px_3px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(0,0,0,0.25),inset_1px_1px_2px_rgba(255,255,255,0.5)]'

// Hangs under gravity: the curve sags by `sag` x 18% of the span.
function threadPath(a, b, sag) {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  return `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag * len * 0.18} ${b.x} ${b.y}`
}

// Thrown over the pins taut, then drops and bobs as it settles (damped oscillation).
const SAG_SETTLE = [0.15, 1.5, 0.75, 1.2, 0.95, 1.05, 1]
const SAG_TIMES = [0, 0.3, 0.5, 0.68, 0.82, 0.92, 1]

// Measures each pin's centre inside `wallRef` so the thread follows the layout.
function usePinPoints() {
  const wallRef = useRef(null)
  const pinRefs = useRef([])
  const [pts, setPts] = useState(null)

  useEffect(() => {
    const wall = wallRef.current
    if (!wall) return undefined
    const measure = () => {
      const origin = wall.getBoundingClientRect()
      setPts(pinRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top }
      }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(wall)
    return () => ro.disconnect()
  }, [])

  return { wallRef, pinRefs, pts }
}

// Amber thread strung pin to pin, always above the prints so hovering never hides it.
function PinThread({ pts, reduce }) {
  if (!pts || pts.length < 2) return null
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 10 }} aria-hidden="true">
      {pts.slice(1).map((b, i) => {
        const a = pts[i]
        const move = {
          fill: 'none',
          strokeWidth: 2,
          strokeLinecap: 'round',
          initial: reduce ? false : { d: threadPath(a, b, SAG_SETTLE[0]), opacity: 0 },
          whileInView: { d: SAG_SETTLE.map((v) => threadPath(a, b, v)), opacity: 1 },
          viewport: { once: true, margin: '-60px' },
          transition: { d: { duration: 2.2, delay: 0.7 + i * 0.25, times: SAG_TIMES, ease: 'easeInOut' }, opacity: { duration: 0.2, delay: 0.7 + i * 0.25 } },
        }
        // The shadow is a second, offset stroke: far cheaper to repaint than a CSS filter on a moving path.
        return (
          <g key={i}>
            <motion.path {...move} stroke="rgba(13,31,60,0.22)" style={{ transform: 'translateY(2.5px)' }} />
            <motion.path {...move} stroke="#D97706" />
          </g>
        )
      })}
    </svg>
  )
}

function Pin({ color, pinRef }) {
  return (
    <span
      ref={pinRef}
      className={`absolute left-1/2 -top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${color} ${PIN_SHADOW}`}
      aria-hidden="true"
    />
  )
}

// A print or tag hanging from a pin. It swings in once on scroll, straightens under a mouse
// hover, and swings again on a touch tap (a finger can't hover).
function Swing({ as = 'div', tilt, kick, delay, reduce, className, style, children }) {
  const controls = useAnimation()
  const Tag = motion[as]
  const swing = (e) => {
    if (reduce || e?.pointerType === 'mouse') return
    controls.start({ rotate: [tilt + kick, tilt], transition: PENDULUM })
  }
  return (
    <Tag
      className={className}
      style={{ ...style, transformOrigin: '50% 0' }}
      initial={reduce ? { rotate: tilt } : { opacity: 0, rotate: tilt + kick }}
      whileInView={{ opacity: 1, rotate: tilt }}
      viewport={{ once: true, margin: '-60px' }}
      transition={reduce ? undefined : { ...PENDULUM, delay, opacity: { duration: 0.2, delay } }}
      animate={controls}
      onTap={(e) => swing(e)}
      whileHover={reduce ? undefined : { rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 9 } }}
    >
      {children}
    </Tag>
  )
}

function Collage({ images, stat, statLabel }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative aspect-[5/6] w-full max-w-md mx-auto md:max-w-none">
      {images.slice(0, PRINTS.length).map((item, i) => {
        const p = PRINTS[i]
        return (
          <Swing
            as="figure"
            key={item.src}
            tilt={p.tilt}
            kick={i % 2 ? -16 : 16}
            delay={0.1 + i * 0.2}
            reduce={reduce}
            className={`absolute ${p.box} bg-white p-2 pb-2 rounded-md shadow-float`}
            style={{ zIndex: i + 1 }}
          >
            <img src={imgSrc(item.src)} alt={item.label} className={`w-full ${p.ratio} object-cover rounded-sm`} />
            <Pin color={i === 1 ? 'bg-accent' : 'bg-primary'} />
          </Swing>
        )
      })}
      {/* Paper tag: threaded through a punched hole on a pin, swings like the prints */}
      <Swing tilt={4} kick={-20} delay={0.9} reduce={reduce} className="absolute right-[3%] -top-[4%] z-20 w-36">
        <Pin color="bg-primary" />
        <span className="absolute left-1/2 top-[7px] h-[29px] w-0.5 -translate-x-1/2 bg-accent-dark" aria-hidden="true" />
        <div className="mt-[22px]" style={{ filter: 'drop-shadow(0 6px 8px rgba(13,31,60,0.22))' }}>
          <div
            className="relative bg-accent text-tide-text text-center px-4 pt-7 pb-4"
            style={{ clipPath: 'polygon(14% 0, 86% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)' }}
          >
            <span className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-tide-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]" aria-hidden="true" />
            <p className="font-hand text-4xl font-bold leading-none">{stat}</p>
            <p className="font-hand text-xl font-semibold leading-[1.1] mt-1">{statLabel}</p>
          </div>
        </div>
      </Swing>
    </div>
  )
}

function RoleRow({ role }) {
  const inner = (
    <>
      <span className="w-11 h-11 shrink-0 rounded-full bg-primary text-white flex items-center justify-center">
        {ICONS[role.iconKey] || <Users className="w-5 h-5" />}
      </span>
      <span className="flex-1">
        <span className="block font-display text-xl font-semibold text-tide-text">{role.title}</span>
        <span className="block text-sm font-body text-tide-muted leading-relaxed mt-1">{role.desc}</span>
        {role.linkLabel && (
          <span className="inline-block mt-2 text-sm font-body font-semibold text-primary">{role.linkLabel}</span>
        )}
      </span>
      {role.to && (
        <ArrowUpRight className="w-5 h-5 mt-1 text-primary shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      )}
    </>
  )
  const cls = 'group flex items-start gap-4 py-6'
  return role.to
    ? <Link to={role.to} className={`${cls} -mx-3 px-3 rounded-xl hover:bg-primary-faint transition-colors`}>{inner}</Link>
    : <div className={cls}>{inner}</div>
}

// ---- Join the team ---------------------------------------------------------------------
// Text leads (it is the point of the section); the photos are a small pinned-and-taped collage,
// styled like the one in the volunteer section above. Two prints hang from pins and swing about
// the pin on hover; the two taped prints are fixed and never move. One amber thread joins the
// pinned pair and always sits above the photos, so hovering never hides it.

// pinned: hangs from a pin (swings). Otherwise taped: static.
const WALL_PRINTS = [
  { tilt: -3,   drop: 'md:mt-0',  pinned: true, pin: 'bg-primary' },
  { tilt: 2.5,  drop: 'md:mt-8',  pinned: true, pin: 'bg-accent' },
  { tilt: 2,    drop: 'md:-mt-1', pinned: false },
  { tilt: -2.5, drop: 'md:mt-7',  pinned: false },
]

function PhotoWall({ images }) {
  const reduce = useReducedMotion()
  const { wallRef, pinRefs, pts } = usePinPoints()

  return (
    <div ref={wallRef} className="relative grid grid-cols-2 gap-x-5 gap-y-9 md:gap-x-6 md:gap-y-10 max-w-md mx-auto w-full md:max-w-none">
      {images.slice(0, WALL_PRINTS.length).map((item, i) => {
        const p = WALL_PRINTS[i]
        const className = `relative bg-white p-2 rounded-md shadow-float ${p.drop}`
        const img = <img src={imgSrc(item.src)} alt={item.label} className="w-full aspect-square object-cover object-top rounded-sm" />
        if (p.pinned) {
          return (
            <Swing as="figure" key={item.src} tilt={p.tilt} kick={i % 2 ? -16 : 16} delay={0.1 + i * 0.2} reduce={reduce} className={className}>
              {img}
              <Pin color={p.pin} pinRef={(el) => { pinRefs.current[i] = el }} />
            </Swing>
          )
        }
        // Taped: fixed in place, only fades in.
        return (
          <motion.figure
            key={item.src}
            className={className}
            style={{ rotate: p.tilt }}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.2 }}
          >
            {img}
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-[-3deg] w-14 h-5 bg-amber-200/80 border-x border-dashed border-amber-300/70 shadow-sm" aria-hidden="true" />
          </motion.figure>
        )
      })}

      <PinThread pts={pts} reduce={reduce} />
    </div>
  )
}

export default function Volunteer() {
  const { volunteer, join } = data

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/get-involved/volunteer"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.getInvolved },
          { name: data.meta.breadcrumbName, path: '/get-involved/volunteer' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      {/* Section 1: volunteer / intern — warm, photo-led */}
      <section className="section-padding bg-tide-bg overflow-x-clip">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-20 items-center">
          <motion.div {...fadeUp()}>
            <p className="flex items-center gap-3 text-sm font-body font-semibold text-primary-dark mb-4">
              <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
              {volunteer.sectionBadge}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-tide-text text-balance mb-8">
              {volunteer.sectionTitle}
            </h2>
            <div className="divide-y divide-tide-border border-y border-tide-border mb-9">
              {volunteer.items.map((role) => <RoleRow key={role.title} role={role} />)}
            </div>
            <Button href={volunteer.ctaHref} external size="lg">
              {volunteer.ctaLabel} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <Collage images={volunteer.images} stat={site.livesImpacted} statLabel={volunteer.statLabel} />
        </div>
      </section>

      {/* Section 2: join the team */}
      <section className="section-padding bg-tide-warm overflow-x-clip">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-14 lg:gap-20 items-center">
          <motion.div {...fadeUp()}>
            <p className="flex items-center gap-3 text-sm font-body font-semibold text-primary-dark mb-4">
              <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
              {join.sectionBadge}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-tide-text text-balance mb-6">
              {join.sectionTitle}
            </h2>
            <p className="text-tide-muted font-body leading-relaxed text-lg mb-4 max-w-prose">{join.body}</p>
            <p className="text-tide-muted font-body leading-relaxed mb-8 max-w-prose">{join.jdIntro}</p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button href={join.ctaHref} external size="lg">
                {join.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href={join.jdHref} external variant="secondary" size="lg">
                {join.jdLabel} <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 text-sm font-body text-tide-muted">
              <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{join.contactLabel}</span>
              <a href={`mailto:${join.contactEmail}`} className="font-semibold text-primary hover:underline">{join.contactEmail}</a>
            </p>
          </motion.div>

          <div className="md:order-first">
            <PhotoWall images={join.images} />
          </div>
        </div>
      </section>
    </>
  )
}
