import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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

function Collage({ images, stat, statLabel }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative aspect-[5/6] w-full max-w-md mx-auto md:max-w-none">
      {images.slice(0, PRINTS.length).map((item, i) => {
        const p = PRINTS[i]
        return (
          <motion.figure
            key={item.src}
            className={`absolute ${p.box} bg-white p-2 pb-2 rounded-md shadow-float`}
            style={{ zIndex: i + 1 }}
            initial={reduce ? { rotate: p.tilt } : { opacity: 0, y: 36, rotate: p.tilt * 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: p.tilt }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={imgSrc(item.src)} alt={item.label} className={`w-full ${p.ratio} object-cover rounded-sm`} />
          </motion.figure>
        )
      })}
      <motion.div
        className="absolute right-[2%] top-[-3%] z-10 rounded-full bg-accent text-tide-text px-5 py-3 text-center shadow-float rotate-6"
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.9, type: 'spring', stiffness: 220, damping: 16 }}
      >
        <p className="font-display text-2xl font-bold leading-none">{stat}</p>
        <p className="text-[11px] font-body font-semibold leading-tight mt-1 max-w-[7rem]">{statLabel}</p>
      </motion.div>
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

function PhotoWall({ images }) {
  const reduce = useReducedMotion()
  const wallRef = useRef(null)
  const pinRefs = useRef([])
  const [pts, setPts] = useState(null)

  useEffect(() => {
    const wall = wallRef.current
    if (!wall) return undefined
    const measure = () => {
      const origin = wall.getBoundingClientRect()
      const list = pinRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top }
      })
      setPts(list)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(wall)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wallRef} className="relative grid grid-cols-2 gap-x-5 gap-y-9 md:gap-x-6 md:gap-y-10 max-w-md mx-auto w-full md:max-w-none">
      {images.slice(0, WALL_PRINTS.length).map((item, i) => {
        const p = WALL_PRINTS[i]
        const motionProps = p.pinned
          ? {
              style: { transformOrigin: '50% 0' },
              initial: reduce ? { rotate: p.tilt } : { opacity: 0, rotate: p.tilt + (i % 2 ? -16 : 16) },
              whileInView: { opacity: 1, rotate: p.tilt },
              viewport: { once: true, margin: '-60px' },
              transition: reduce ? undefined : { ...PENDULUM, delay: 0.1 + i * 0.2, opacity: { duration: 0.2, delay: 0.1 + i * 0.2 } },
              whileHover: reduce ? undefined : { rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 9 } },
            }
          : {
              // Taped: fixed in place, only fades in.
              style: { rotate: p.tilt },
              initial: reduce ? false : { opacity: 0 },
              whileInView: { opacity: 1 },
              viewport: { once: true, margin: '-60px' },
              transition: { duration: 0.5, delay: 0.1 + i * 0.2 },
            }
        return (
          <motion.figure
            key={item.src}
            className={`relative bg-white p-2 rounded-md shadow-float ${p.drop}`}
            {...motionProps}
          >
            <img src={imgSrc(item.src)} alt={item.label} className="w-full aspect-square object-cover object-top rounded-sm" />
            {p.pinned ? (
              <span
                ref={(el) => { pinRefs.current[i] = el }}
                className={`absolute left-1/2 -top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${p.pin} ${PIN_SHADOW}`}
                aria-hidden="true"
              />
            ) : (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-[-3deg] w-14 h-5 bg-amber-200/80 border-x border-dashed border-amber-300/70 shadow-sm" aria-hidden="true" />
            )}
          </motion.figure>
        )
      })}

      {pts && pts.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 10 }} aria-hidden="true">
          <motion.path
            d={threadPath(pts[0], pts[1], 1)}
            fill="none"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 2px 1.5px rgba(13,31,60,0.3))' }}
            initial={reduce ? false : { d: threadPath(pts[0], pts[1], SAG_SETTLE[0]), opacity: 0 }}
            whileInView={{ d: SAG_SETTLE.map((v) => threadPath(pts[0], pts[1], v)), opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ d: { duration: 2.2, delay: 0.7, times: SAG_TIMES, ease: 'easeInOut' }, opacity: { duration: 0.2, delay: 0.7 } }}
          />
        </svg>
      )}
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
