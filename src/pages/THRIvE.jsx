import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Microscope, BookOpen, TrendingUp, Lightbulb, Link2, Users, ArrowRight } from 'lucide-react'
import SeoHead from '../components/ui/SeoHead'
import Button from '../components/ui/Button'
import { safeHttpUrl } from '../utils/safeUrl'
import PageHero from '../components/ui/PageHero'
import SectionHeader from '../components/ui/SectionHeader'
import ArchPortrait from '../components/ui/ArchPortrait'
import data from '../data/thrive.json'
import site from '../data/site.json'
import { imgSrc } from '../utils/imgSrc'
import { fadeUp } from '../utils/motionPresets'

const ICONS = {
  BookOpen,
  Microscope,
  TrendingUp,
  Lightbulb,
  Link2,
  Users,
}

const AREA_ID = i => `area-${i + 1}`
const pad = i => String(i + 1).padStart(2, '0')

/* ── "Read more" under a research area. YAML readMoreUrl: a page of this site ("/…", in-app
   link) or an http(s) address (new tab, through safeHttpUrl); empty or anything else → no button.
   aria-label names the area, so four "Read more" buttons are still told apart. ── */
function ReadMore({ url, label, aria }) {
  const internal = typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
  const external = internal ? null : safeHttpUrl(url)
  if (!internal && !external) return null
  const content = (
    <>
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/rm:translate-x-1" aria-hidden="true" />
    </>
  )
  return (
    <div className="pt-2">
      {internal
        ? <Button to={url} variant="secondary" aria-label={aria} className="group/rm">{content}</Button>
        : <Button href={external} external variant="secondary" aria-label={aria} className="group/rm">{content}</Button>}
    </div>
  )
}

/* ── One research area: its own full-width band, numeral, organic photo with gentle parallax ── */
function ResearchArea({ area, index, readMore }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const tinted = index % 2 === 1

  return (
    <section
      ref={ref}
      id={AREA_ID(index)}
      className={`px-4 py-16 md:px-8 md:py-24 lg:px-16 ${tinted ? 'bg-white' : 'bg-tide-bg'}`}
    >
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div {...fadeUp()} className="self-start lg:sticky lg:top-40">
          <span className="block font-display text-6xl font-semibold leading-none text-primary/20" aria-hidden="true" data-a11y-decorative>{pad(index)}</span>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-tide-text md:text-3xl">{area.title}</h3>
          <div className="mt-4 mb-5 h-1 w-12 rounded-full bg-accent" aria-hidden="true" />
          <p className="font-body text-lg leading-relaxed text-primary-dark">{area.overview}</p>
          <div className="relative mt-8">
            <div className="absolute -bottom-3 -right-3 h-3/4 w-3/4 rounded-[2.5rem] bg-primary-light" aria-hidden="true" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl border border-tide-border bg-primary-light">
              <motion.img
                src={imgSrc(area.photo)}
                alt={area.title}
                loading="lazy"
                decoding="async"
                style={reduce ? undefined : { y: imgY, scale: 1.14 }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
        <motion.div {...fadeUp(0.1)} className="space-y-5 lg:pt-[4.5rem]">
          {area.paragraphs.map((para, j) => (
            <p
              key={para}
              className={j === 0
                ? 'border-l-2 border-accent pl-5 font-body leading-relaxed text-tide-text'
                : 'font-body leading-relaxed text-tide-muted'}
            >
              {para}
            </p>
          ))}
          <ReadMore url={area.readMoreUrl} label={readMore.label} aria={readMore.template.replace('{title}', () => area.title)} />
        </motion.div>
      </div>
    </section>
  )
}

/* ── Sticky sub-navigation: jump to an area; the pill for the one being read is filled ── */
function AreaNav({ items, label, heading }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setActive(Number(e.target.id.replace('area-', '')) - 1)
      }),
      { rootMargin: '-35% 0px -55% 0px' },
    )
    items.forEach((_, i) => {
      const el = document.getElementById(AREA_ID(i))
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [items])

  const current = items[active] || items[0]

  return (
    <nav aria-label={label} className="sticky top-[68px] z-20 border-y border-tide-border bg-white/90 px-4 backdrop-blur-md md:px-8 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-1.5 py-2.5 md:flex-row md:items-center md:gap-5">
        <p className="shrink-0 font-body text-[11px] font-semibold uppercase tracking-widest text-primary-dark md:text-xs" aria-hidden="true">{heading}</p>
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <ol className="flex shrink-0 gap-2">
            {items.map((area, i) => (
              <li key={area.title}>
                <a
                  href={`#${AREA_ID(i)}`}
                  aria-label={area.title}
                  title={area.title}
                  aria-current={active === i ? 'true' : undefined}
                  className={`hit-44 relative flex h-9 w-9 items-center justify-center rounded-full border font-body text-xs font-semibold transition-colors ${active === i ? 'border-primary bg-primary-dark text-white' : 'border-tide-border bg-white text-primary-dark hover:border-primary'}`}
                >
                  {pad(i)}
                </a>
              </li>
            ))}
          </ol>
          <p className="min-w-0 truncate font-body text-sm font-semibold text-tide-text" aria-hidden="true">{current.title}</p>
        </div>
      </div>
    </nav>
  )
}

/* ── Core principles: the original layout (3-column grid, a rule above each item, icon tile,
   title, line), on a light band now that it follows "About THRIvE" (2026-11-28). The rule carries
   a short amber segment and the icon sits on a brand-blue tile, so the band keeps colour without
   the old navy. ── */
function Principles({ principles }) {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 md:px-8 md:py-24 lg:px-16">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary-light/50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent-light/50 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <SectionHeader badge={principles.sectionBadge} title={principles.sectionTitle} className="!mb-12 md:!mb-16" />
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {principles.items.map((p, i) => {
            const Icon = ICONS[p.iconKey] || BookOpen
            return (
              <motion.div key={p.title} {...fadeUp(i * 0.06)} className="relative border-t border-tide-border pt-6">
                <span className="absolute -top-px left-0 h-0.5 w-10 rounded-full bg-accent" aria-hidden="true" />
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-faint text-primary-dark ring-1 ring-primary/10">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-semibold text-tide-text">{p.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-tide-muted">{p.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function THRIvE() {
  const blob = 'pointer-events-none absolute rounded-full blur-3xl'
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/thrive"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: data.meta.breadcrumbName, path: '/thrive' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.fullName} />

      {/* Statement — a quiet line under the banner, never louder than it (owner request
          2026-11-28): modest serif italic, a narrow measure, amber hanging quotes. */}
      <section className="relative overflow-hidden bg-primary-faint px-4 py-12 md:px-8 md:py-16">
        <div className={`${blob} -left-24 -top-32 h-72 w-72 bg-white/80`} aria-hidden="true" />
        <div className={`${blob} -bottom-32 -right-24 h-72 w-72 bg-accent/10`} aria-hidden="true" />
        <motion.p
          {...fadeUp()}
          className="relative mx-auto max-w-xl text-center font-display text-xl font-normal italic leading-relaxed tracking-[-0.005em] text-primary-dark text-balance md:text-2xl"
        >
          <span className="font-semibold not-italic text-accent-deeper" aria-hidden="true">“</span>
          {data.meta.tagline}
          <span className="font-semibold not-italic text-accent-deeper" aria-hidden="true">”</span>
        </motion.p>
      </section>

      {/* About */}
      <section className="bg-tide-bg px-4 py-16 md:px-8 md:py-24">
        <motion.div {...fadeUp()} className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block badge-primary">{data.about.sectionBadge}</span>
          <h2 className="font-display text-3xl font-semibold leading-tight text-tide-text md:text-4xl">{data.about.sectionTitle}</h2>
          <div className="mx-auto mt-4 mb-6 h-1 w-12 rounded-full bg-accent" aria-hidden="true" />
          <p className="font-body text-lg leading-relaxed text-tide-muted md:text-xl">{data.about.body}</p>
        </motion.div>
      </section>

      {/* Core principles — how THRIvE works, read before meeting the people who do it */}
      <Principles principles={data.principles} />

      {/* Leadership — the people come first, so the portraits are big */}
      <section className="relative overflow-hidden bg-tide-bg px-4 pt-16 pb-10 md:px-8 md:pt-24 md:pb-12 lg:px-16">
        <div className={`${blob} -left-24 top-10 h-96 w-96 bg-accent/10`} aria-hidden="true" />
        <div className={`${blob} -right-24 bottom-0 h-96 w-96 bg-primary-light`} aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <SectionHeader title={data.leaders.sectionTitle} center className="!mb-12 md:!mb-16" />
          <div className="mx-auto grid max-w-[22rem] gap-12 sm:max-w-none sm:grid-cols-3 sm:gap-x-8 md:gap-x-12">
            {data.leaders.members.map((l, i) => (
              <ArchPortrait key={l.name} size="lg" index={i} delay={i * 0.08} {...l} />
            ))}
          </div>
        </div>
      </section>

      {/* Research Associates */}
      <section className="relative overflow-hidden bg-tide-bg px-4 pt-6 pb-16 md:px-8 md:pt-8 md:pb-24 lg:px-16">
        <div className="relative mx-auto max-w-5xl">
          <h2 className="sr-only">{data.researchTeam.sectionBadge}</h2>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 md:gap-x-8">
            {data.researchTeam.members.map((m, i) => (
              <ArchPortrait
                key={m.name}
                index={i}
                delay={(i % 4) * 0.07}
                {...m}
                className="w-[calc(50%-0.75rem)] md:w-[calc(25%-1.5rem)]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Research areas — each a full-width band */}
      <section className="bg-white px-4 pt-16 pb-10 md:px-8 md:pt-24 md:pb-12 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeader badge={data.researchAreas.sectionBadge} title={data.researchAreas.sectionTitle} className="!mb-0" />
        </div>
      </section>
      <AreaNav items={data.researchAreas.items} label={data.researchAreas.navLabel} heading={data.researchAreas.sectionTitle} />
      {data.researchAreas.items.map((area, i) => (
        <ResearchArea
          key={area.title}
          area={area}
          index={i}
          readMore={{ label: data.researchAreas.readMore, template: data.researchAreas.readMoreLabelTemplate ?? '{title}' }}
        />
      ))}
    </>
  )
}
