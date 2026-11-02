import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion'
import { Mail, ArrowUpRight, Users, Vote, Lightbulb, Globe, MessagesSquare, Leaf, Landmark } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/get-involved-mccx.json'
import site from '../../data/site.json'
import common from '../../data/common.json'
import comingSoon from '../../data/coming-soon.json'
import { imgSrc } from '../../utils/imgSrc'
import { fadeUp } from '../../utils/motionPresets'

const STEP_ICONS = { Mail, Users, Lightbulb, Vote }
const HIGHLIGHT_ICONS = { MessagesSquare, Leaf, Landmark }

const PIN_SHADOW = 'shadow-[0_2px_3px_rgba(0,0,0,0.35)]'

// Where each print sits on the board, so the three overlap like photos laid on a table.
// `fit` re-centres the crop on the part of the photo that matters.
const PRINTS = [
  { pos: 'left-0 top-0 w-[64%] z-10', tilt: -2.2, aspect: 'aspect-[3/2]', fit: 'object-[45%_60%]', pin: 'bg-primary' },
  { pos: 'right-0 top-[24%] w-[44%] z-20', tilt: 3, aspect: 'aspect-square', fit: 'object-center', pin: 'bg-accent' },
  { pos: 'left-[9%] bottom-0 w-[52%] z-[15]', tilt: 1.6, aspect: 'aspect-[3/2]', fit: 'object-[78%_72%]', pin: 'bg-primary' },
]

// ---- What is MCC: the sentence, its three verbs, two actions, and a pinned photo board -------
// Same pin-and-swing as the Volunteer collage, only softer: a smaller kick and a springier,
// better-damped pendulum, so each print drifts to rest instead of rocking. It swings in once on
// scroll, straightens gently under a mouse, and swings again on a touch tap.
const SOFT_SWING = { type: 'spring', stiffness: 55, damping: 9, mass: 1 }
const SOFT_STRAIGHTEN = { type: 'spring', stiffness: 90, damping: 14 }

function PinnedPrint({ photo, spec, index, reduce }) {
  const controls = useAnimation()
  const kick = index % 2 ? -7 : 7
  const swing = (e) => {
    if (reduce || e?.pointerType === 'mouse') return
    controls.start({ rotate: [spec.tilt + kick, spec.tilt], transition: SOFT_SWING })
  }
  return (
    <motion.figure
      style={{ transformOrigin: '50% 0' }}
      initial={reduce ? { rotate: spec.tilt } : { opacity: 0, rotate: spec.tilt + kick }}
      whileInView={{ opacity: 1, rotate: spec.tilt }}
      viewport={{ once: true, margin: '-60px' }}
      transition={reduce ? undefined : { ...SOFT_SWING, delay: 0.1 + index * 0.2, opacity: { duration: 0.5, delay: 0.1 + index * 0.2 } }}
      animate={controls}
      onTap={(e) => swing(e)}
      whileHover={reduce ? undefined : { rotate: 0, transition: SOFT_STRAIGHTEN }}
      className={`absolute rounded-md bg-white p-1.5 pb-0 shadow-float md:p-2 md:pb-0 ${spec.pos}`}
    >
      <span className={`absolute left-1/2 -top-2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full ${spec.pin} ${PIN_SHADOW}`} aria-hidden="true" />
      <div className={`overflow-hidden rounded-sm ${spec.aspect}`}>
        <img src={imgSrc(photo.src)} alt="" aria-hidden="true" loading="lazy" className={`h-full w-full object-cover ${spec.fit}`} />
      </div>
      <figcaption className="py-1.5 text-center font-hand text-lg leading-none text-tide-text md:py-2 md:text-xl">{photo.label}</figcaption>
    </motion.figure>
  )
}

function WhatIs() {
  const { whatIs } = data
  const reduce = useReducedMotion()
  return (
    <section className="section-padding bg-tide-bg">
      <div className="max-w-6xl mx-auto grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div {...fadeUp()}>
          <span className="mb-5 block h-0.5 w-10 bg-accent" aria-hidden="true" />
          <h2 className="mb-5 font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl lg:text-5xl">{whatIs.title}</h2>
          <p className="mb-8 max-w-prose font-body text-lg leading-relaxed text-tide-muted">{whatIs.body1}</p>

          <ul className="mb-9 grid gap-3 sm:grid-cols-3">
            {whatIs.highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[h.iconKey] || Globe
              return (
                <motion.li
                  key={h.label}
                  {...fadeUp(0.1 + i * 0.08)}
                  className="group flex items-center gap-3 rounded-2xl border border-tide-border bg-white p-4 transition-colors duration-300 hover:border-primary/40 hover:bg-primary-faint sm:flex-col sm:items-start sm:gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-body text-sm font-semibold leading-snug text-tide-text">{h.label}</span>
                </motion.li>
              )
            })}
          </ul>

          <p className="mb-5 max-w-prose font-body text-base font-medium leading-relaxed text-tide-text">{whatIs.body2}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button href={whatIs.ctaHref} size="lg">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {whatIs.ctaLabel}
            </Button>
            <Button href={whatIs.learnMoreHref} external variant="secondary" size="lg" aria-label={whatIs.learnMoreAriaLabel}>
              {whatIs.learnMoreLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>

        <div className="relative mx-auto aspect-square w-full max-w-[34rem] lg:max-w-none">
          {whatIs.photos.map((p, i) => (
            <PinnedPrint key={p.src} photo={p} spec={PRINTS[i]} index={i} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- How to organise: one thread, four pins, read in order --------------------------------
// A thread runs between the steps (down the left on a phone, across on a desktop) and draws
// itself as it scrolls into view. Hovering a step, or tapping it on a phone, lights its pin.
function Step({ step, index, lit, onLight }) {
  const Icon = STEP_ICONS[step.iconKey] || Globe
  return (
    <motion.li
      {...fadeUp(index * 0.1)}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') onLight(index) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') onLight(null) }}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') onLight(lit ? null : index) }}
      className="relative pl-16 lg:pl-0 lg:pt-16"
    >
      <span
        className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold text-navy transition-all duration-300 lg:left-1/2 lg:-translate-x-1/2 ${
          lit ? 'scale-110 bg-accent ring-4 ring-accent/30' : 'bg-accent/90'
        } ${PIN_SHADOW}`}
      >
        <span className="sr-only">{common.step}</span>
        {index + 1}
      </span>

      <div className={`h-full rounded-2xl border bg-white p-6 transition-all duration-300 ${lit ? '-translate-y-1 border-primary/40 shadow-card' : 'border-tide-border'}`}>
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="mb-2 font-display text-xl font-semibold text-tide-text">{step.title}</h3>
        <p className="font-body text-sm leading-relaxed text-tide-muted">{step.desc}</p>
      </div>
    </motion.li>
  )
}

function Steps() {
  const { steps } = data
  const [lit, setLit] = useState(null)
  return (
    <section className="section-padding border-t border-tide-border bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader badge={steps.sectionBadge} title={steps.sectionTitle} subtitle={steps.sectionSubtitle} center />
        <div className="relative">
          <motion.span
            className="absolute bottom-8 left-[21px] top-5 w-0.5 bg-accent-dark/60 lg:hidden"
            aria-hidden="true"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute left-[12.5%] right-[12.5%] top-[21px] hidden h-0.5 bg-accent-dark/60 lg:block"
            aria-hidden="true"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
          <ol className="relative grid gap-6 lg:grid-cols-4 lg:gap-5">
            {steps.items.map((s, i) => (
              <Step key={s.title} step={s} index={i} lit={lit === i} onLight={setLit} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

// ---- Past sessions: a placeholder until the Sheet is connected ------------------------------------
// A preview of what will live here: a row of pinned prints on a thread, still waiting for their
// photos. Each carries a pictogram of a council moment and a caption to come, and swings from its
// pin exactly like the photos above, only softer. One gentle pluck runs along the thread every few
// seconds, so the prints sway one after another and settle; a hover straightens one, a tap swings
// it. The pluck runs only while the section is on screen. Reduced motion gets the still row.
const SESSION_PRINTS = [
  { Icon: Landmark, tilt: -2.2, pin: 'bg-primary', className: '' },
  { Icon: MessagesSquare, tilt: 1.8, pin: 'bg-accent', className: '' },
  { Icon: Vote, tilt: -1.4, pin: 'bg-primary', className: '' },
  { Icon: Users, tilt: 2.2, pin: 'bg-accent', className: 'hidden md:block' },
]
const PLUCK_MS = 6400

function SessionPrint({ spec, index, beat, reduce }) {
  const controls = useAnimation()
  const kick = index % 2 ? -5 : 5
  const swing = (extra = {}) => controls.start({ rotate: [spec.tilt + kick, spec.tilt], transition: { ...SOFT_SWING, ...extra } })

  useEffect(() => {
    if (!reduce && beat) swing({ delay: index * 0.32 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat])

  return (
    <motion.figure
      style={{ transformOrigin: '50% 0' }}
      initial={reduce ? { rotate: spec.tilt } : { opacity: 0, rotate: spec.tilt + kick }}
      whileInView={{ opacity: 1, rotate: spec.tilt }}
      viewport={{ once: true, margin: '-60px' }}
      transition={reduce ? undefined : { ...SOFT_SWING, delay: 0.2 + index * 0.2, opacity: { duration: 0.5, delay: 0.2 + index * 0.2 } }}
      animate={controls}
      tabIndex={-1}   // a tap handler makes the figure focusable, and the whole row is aria-hidden
      onTap={(e) => { if (!reduce && e?.pointerType !== 'mouse') swing() }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6, scale: 1.025, transition: SOFT_STRAIGHTEN }}
      className={`group relative rounded-md bg-white p-1.5 shadow-float transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(13,33,55,0.16)] md:p-2 ${spec.className}`}
    >
      <span className={`absolute left-1/2 -top-2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full ${spec.pin} ${PIN_SHADOW}`} aria-hidden="true" />
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-primary-light to-primary-faint">
        <spec.Icon className="h-8 w-8 text-primary/55 transition-all duration-500 group-hover:scale-110 group-hover:text-primary/80 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden="true" />
      </div>
      {/* the caption to come: a school, a year */}
      <div className="space-y-1.5 px-1 py-2.5 md:py-3.5" aria-hidden="true">
        <span className="mx-auto block h-2 w-3/4 rounded-full bg-tide-border" />
        <span className="mx-auto block h-1.5 w-2/5 rounded-full bg-tide-subtle" />
      </div>
    </motion.figure>
  )
}

function PastSessions() {
  const { past } = data
  const reduce = useReducedMotion()
  const rowRef = useRef(null)
  const inView = useInView(rowRef, { margin: '-80px' })
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    if (reduce || !inView) return undefined
    const id = setInterval(() => setBeat((b) => b + 1), PLUCK_MS)
    return () => clearInterval(id)
  }, [reduce, inView])

  return (
    <section className="section-padding overflow-hidden border-t border-tide-border bg-tide-warm">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div {...fadeUp()} className="mb-12 md:mb-16">
          <span className="mx-auto mb-5 block h-0.5 w-10 bg-accent" aria-hidden="true" />
          <span className="mb-4 inline-block rounded-full border border-accent-dark/40 bg-accent-faint px-3 py-1 font-body text-xs font-semibold uppercase tracking-widest text-accent-deeper">
            {comingSoon.badge}
          </span>
          <h2 className="mb-4 font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl lg:text-5xl">{past.title}</h2>
          <p className="mx-auto max-w-xl font-body text-lg leading-relaxed text-tide-muted">{past.body}</p>
        </motion.div>

        <div ref={rowRef} className="relative mx-auto max-w-4xl pt-2" aria-hidden="true">
          {/* the thread the prints hang from; it draws itself once */}
          <motion.span
            className="absolute -inset-x-3 top-[7px] h-0.5 bg-accent-dark/60"
            initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
          <div className="relative grid grid-cols-3 gap-4 md:grid-cols-4 md:gap-8">
            {SESSION_PRINTS.map((p, i) => (
              <SessionPrint key={p.pin + i} spec={p} index={i} beat={beat} reduce={reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function OrganizeMCCx() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/education-for-harmony/mccx"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.educationForHarmony, path: '/education-for-harmony' },
          { name: data.meta.breadcrumbName, path: '/education-for-harmony/mccx' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />
      <WhatIs />
      <Steps />
      <PastSessions />
    </>
  )
}
