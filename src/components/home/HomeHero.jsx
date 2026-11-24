import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import CountUpText from '../ui/CountUpText'

// Homepage banner. Reading order is the story in five seconds: who (badge) → what (headline, with
// "holistic education" underlined by a stroke that draws itself) → how (one line) → what to do
// (two buttons) → proof (one strip of figures: lives, years, partners, founding year). The text is
// visible at once (nothing on the first screen waits to appear — motion rules in utils/motionPresets.js);
// the underline is the one flourish, and only the lives figure counts (CountUpText rules).
// Depth: the photo drifts slower than the page (parallax); on wide screens two photos of the work
// float beside the text and shift with the mouse at different depths, like layers. The photo is
// revealed only once fully decoded (never painted in strips). "Reduce motion": no parallax, no
// drift, no counting.
// `hero` = home YAML `hero`; `site` = site.yaml (single source of the lives figure and founding year).

const B = import.meta.env.BASE_URL
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

export default function HomeHero({ hero, site }) {
  const heroRef = useRef(null)
  const heroImgRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '22%'])
  // The copy stays fully opaque for the first stretch of scroll, so a small nudge doesn't dim it.
  const copyOpacity = useTransform(scrollYProgress, [0.15, 0.75], [1, 0])

  // Mouse depth for the floating photos (springy, so it feels physical, never jittery).
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })
  const nearX = useTransform(sx, v => v * 22)
  const nearY = useTransform(sy, v => v * 16)
  const farX = useTransform(sx, v => v * -12)
  const farY = useTransform(sy, v => v * -9)
  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => { mx.set(0); my.set(0) }

  const [ready, setReady] = useState(false)
  useEffect(() => {
    const img = heroImgRef.current
    if (!img) return undefined
    let live = true
    const reveal = () => { if (live) setReady(true) }
    const decodeThenReveal = () => (img.decode ? img.decode().then(reveal, reveal) : reveal())
    if (img.complete && img.naturalWidth) decodeThenReveal()
    else {
      img.addEventListener('load', decodeThenReveal, { once: true })
      img.addEventListener('error', reveal, { once: true }) // the placeholder swap takes over
    }
    return () => {
      live = false
      img.removeEventListener('load', decodeThenReveal)
      img.removeEventListener('error', reveal)
    }
  }, [])

  const figures = [
    { value: site.livesImpacted, label: hero.floatLives },
    ...hero.pills.map(p => ({ value: p.value, label: p.label })),
    { value: site.foundingYear, label: hero.floatFounded },
  ]

  return (
    // bg-navy matches the overlay's darkest tone: before the photo arrives the banner is a deliberate dark stage.
    <section ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy">
      <motion.div style={{ y: photoY }} className="absolute inset-0 -bottom-[12%] -top-[12%] will-change-transform">
        <motion.img
          ref={heroImgRef}
          src={`${B}${hero.backgroundImage}`}
          alt=""
          fetchPriority="high"
          decoding="async"
          initial={false}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 1.06 }}
          transition={{ duration: reduce ? 0.3 : 0.9, ease: EASE_OUT_EXPO }}
          className="h-full w-full object-cover object-center"
        />
      </motion.div>
      <div className="absolute inset-0 photo-overlay-hero" />
      {/* A slow light from the top left, so the photo reads as lit, not just darkened. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-primary/30 blur-[120px]" />

      <motion.div style={{ opacity: copyOpacity }} className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-32 md:px-8 md:pb-32 md:pt-40 lg:px-16">
        <div className="max-w-3xl">
          <div className="mb-6">
            <span className="badge-white">{hero.badge}</span>
          </div>

          <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white text-balance sm:text-6xl lg:text-[5.25rem]">
            {hero.tagline}{' '}
            <span className="relative inline-block whitespace-nowrap text-accent">
              {hero.taglineHighlight}
              {/* A hand-drawn stroke under the key words, drawing itself once. */}
              <svg aria-hidden="true" viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute -bottom-[0.32em] left-0 h-[0.28em] w-full overflow-visible">
                <motion.path
                  d="M3 12 C 60 4, 120 3, 180 7 S 270 13, 297 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
                />
              </svg>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            {hero.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button to={hero.ctaHref} size="lg" variant="white" className="group/cta shadow-float">
              {hero.ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
            </Button>
            <Button to={hero.ctaSecondaryHref} size="lg" className="gradient-accent border-none text-tide-text shadow-float">
              {hero.ctaSecondaryLabel}
            </Button>
          </div>
        </div>

        {/* Proof: one strip of figures (only the lives figure counts). Solid tint (no backdrop blur over the moving photo). */}
        <ul className="mt-14 grid max-w-3xl grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-navy/45 sm:grid-cols-4">
          {figures.map((f, i) => (
            <li key={f.label} className={`px-5 py-4 md:px-6 md:py-5 ${i % 2 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t border-white/10 sm:border-t-0' : ''} ${i > 0 ? 'sm:border-l sm:border-white/10' : ''}`}>
              {/* Only the lives figure (the main proof) counts; the others are shown as they are. */}
              {i === 0
                ? <CountUpText text={f.value} delay={0.2} className="block font-display text-2xl font-bold leading-none text-white md:text-3xl" />
                : <span className="block font-display text-2xl font-bold leading-none text-white md:text-3xl">{f.value}</span>}
              <span className="mt-1.5 block font-body text-xs leading-snug text-white/65 md:text-[13px]">{f.label}</span>
            </li>
          ))}
        </ul>

        {/* Floating photos of the work (wide screens), moving with the mouse at two depths. */}
        <div aria-hidden="true" className="absolute right-16 top-1/2 hidden -translate-y-1/2 xl:block">
          <div className="relative h-[420px] w-[300px]">
            <motion.div style={{ x: farX, y: farY }} className="absolute right-0 top-0 h-64 w-52">
              <motion.div
                initial={{ opacity: 0, x: 12, rotate: 3 }}
                animate={{ opacity: 1, x: 0, rotate: 3 }}
                transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT_EXPO }}
                className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-white/25 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
              >
                <img src={`${B}${hero.floatPhotos[0].src}`} alt="" className="h-full w-full object-cover" />
              </motion.div>
            </motion.div>
            <motion.div style={{ x: nearX, y: nearY }} className="absolute bottom-0 left-0 h-56 w-44">
              <motion.div
                initial={{ opacity: 0, x: -10, rotate: -4 }}
                animate={{ opacity: 1, x: 0, rotate: -4 }}
                transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT_EXPO }}
                className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-white/25 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]"
              >
                <img src={`${B}${hero.floatPhotos[1].src}`} alt="" className="h-full w-full object-cover" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue: a small capsule with a dot that slides down. */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="flex h-9 w-5 justify-center rounded-full border border-white/35 pt-1.5">
          <motion.span
            className="h-1.5 w-1 rounded-full bg-white/80"
            animate={reduce ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        </span>
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-white/50">{hero.scroll}</span>
      </motion.div>
    </section>
  )
}
