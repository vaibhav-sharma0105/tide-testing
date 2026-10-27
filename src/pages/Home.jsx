import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BookOpen, Users, Heart, Lightbulb, GraduationCap, Globe, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import SeoHead from '../components/ui/SeoHead'
import Button from '../components/ui/Button'
import data from '../data/home.json'
import site from '../data/site.json'
import { makeFadeUp } from '../utils/motionPresets'

/* ── Icon + color map (visual config, not content) ─────────────────── */
const ICON_MAP = { Globe, BookOpen, GraduationCap, Heart, Lightbulb, Users }
const B = import.meta.env.BASE_URL  // '/tide-testing/' on GitHub Pages, '/' locally
const PROGRAM_COLORS = [
  'from-blue-600 to-primary',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-purple-600',
]

/* ── Motion presets ───────────────────────────────────────────────── */
const fadeUp = makeFadeUp({ y: 28, duration: 0.65, margin: '-60px' })
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
})

/* ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/"
        breadcrumbs={[{ name: site.breadcrumbs.home, path: '/' }]}
      />

      {/* ══════════════════════════════════════════════════════════════
          HERO — full-viewport photo with parallax
      ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background photo with parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 -top-[10%] -bottom-[10%]">
          <img src={`${B}${data.hero.backgroundImage}`} alt="" fetchPriority="high" className="w-full h-full object-cover object-center" />
        </motion.div>

        {/* Overlay */}
        <div className="absolute inset-0 photo-overlay-hero" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 pt-32 pb-24 md:pt-40 md:pb-32"
        >
          <div className="max-w-3xl">
            <motion.div {...fadeUp(0.1)} className="mb-6">
              <span className="badge-white">{data.hero.badge}</span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.2)}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[5.25rem] font-bold text-white leading-[1.05] tracking-tight text-balance"
            >
              {data.hero.tagline}{' '}
              <em className="not-italic text-accent">{data.hero.taglineHighlight}</em>
            </motion.h1>

            <motion.p {...fadeUp(0.3)} className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
              {data.hero.description}
            </motion.p>

            <motion.div {...fadeUp(0.4)} className="mt-10 flex flex-wrap gap-4">
              <Button to={data.hero.ctaHref} size="lg"
                className="bg-white text-primary hover:bg-primary-faint font-semibold shadow-float px-8 py-4"
              >
                {data.hero.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button to={data.hero.ctaSecondaryHref} size="lg"
                className="gradient-accent text-tide-text border-none shadow-float px-8 py-4"
              >
                {data.hero.ctaSecondaryLabel}
              </Button>
            </motion.div>

            <motion.div {...fadeUp(0.5)} className="mt-12 flex flex-wrap gap-3">
              {data.hero.pills.map((s) => (
                <div key={s.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/12 border border-white/20 backdrop-blur-sm"
                >
                  <span className="font-display font-bold text-white text-sm">{s.value}</span>
                  <span className="text-white/60 text-xs font-body">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Floating photo cards — right side on large screens */}
          <div className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2">
            <div className="relative w-[280px] h-[400px]">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="animate-float absolute top-0 right-0 w-52 h-64 rounded-2xl overflow-hidden shadow-float border-2 border-white/20"
              >
                <img src={`${B}${data.hero.floatPhotos[0].src}`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 photo-overlay rounded-2xl" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-0 left-0 w-44 h-56 rounded-2xl overflow-hidden shadow-float border-2 border-white/20"
                style={{ animationDelay: '2s' }}
              >
                <img src={`${B}${data.hero.floatPhotos[1].src}`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 photo-overlay rounded-2xl" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute bottom-24 right-4 glass rounded-2xl px-4 py-3 shadow-float"
              >
                <div className="font-display font-bold text-primary text-xl leading-none">{data.hero.floatLivesValue}</div>
                <div className="text-xs text-tide-muted font-body mt-0.5">{data.hero.floatLives}</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-xs font-body tracking-widest uppercase">{data.hero.scroll}</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-0.5 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-full"
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MISSION
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-tide-bg overflow-hidden">
        <div className="max-w-7xl mx-auto container-wide">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div {...fadeUp(0)} className="order-2 lg:order-1">
              <span className="badge-primary mb-5 block w-fit">{data.mission.sectionBadge}</span>
              <h2 className="display-lg text-tide-text">{data.mission.title}</h2>
              <p className="body-lg mt-5">{data.mission.body}</p>
              <blockquote className="mt-8 pl-6 border-l-4 border-accent relative">
                <Quote aria-hidden="true" className="absolute -top-1 -left-1 w-5 h-5 text-accent-deeper opacity-60" />
                <p className="font-display text-xl italic text-tide-text leading-snug">
                  "{data.mission.quote}"
                </p>
              </blockquote>
              <div className="mt-8">
                <Button to={data.mission.learnMoreHref} variant="ghost"
                  className="text-primary hover:bg-primary-faint px-0 font-semibold"
                >
                  {data.mission.learnMore} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeIn(0.15)} className="order-1 lg:order-2 relative">
              <div className="relative h-[340px] sm:h-[420px] md:h-[540px]">
                <div className="absolute right-0 top-0 w-[75%] h-[85%] rounded-3xl overflow-hidden shadow-float">
                  <img src={`${B}${data.mission.image1}`} alt={data.mission.image1Alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-0 bottom-0 w-[52%] h-[55%] rounded-2xl overflow-hidden shadow-float border-4 border-tide-bg">
                  <img src={`${B}${data.mission.image2}`} alt={data.mission.image2Alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute top-6 left-6 gradient-accent text-tide-text rounded-2xl px-4 py-3 shadow-float"
                >
                  <div className="font-display font-bold text-2xl leading-none">{data.hero.floatFoundedValue}</div>
                  <div className="text-xs font-body mt-0.5 text-tide-text/85">{data.hero.floatFounded}</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROGRAMS
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-wide">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <span className="badge-primary mb-4 mx-auto">{data.programs.sectionBadge}</span>
            <h2 className="display-md text-tide-text mt-3">{data.programs.sectionTitle}</h2>
            <p className="body-md max-w-xl mx-auto mt-4">{data.programs.sectionSubtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.programs.items.map((p, i) => {
              const Icon  = ICON_MAP[p.iconKey] || Globe
              const color = PROGRAM_COLORS[i] || 'from-primary to-primary'
              return (
                <motion.div key={p.to} {...fadeUp(i * 0.07)}>
                  <Link to={p.to} className="card-photo group block h-full min-h-[320px]">
                    <img src={`${B}${p.photo}`} alt={p.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 photo-overlay transition-opacity duration-300 group-hover:opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${color} mb-3`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white leading-tight">{p.title}</h3>
                      <p className="text-sm text-white/75 font-body mt-1.5 leading-relaxed">{p.desc}</p>
                      <div className="mt-3 flex items-center gap-1 text-accent text-sm font-semibold font-body translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {data.programs.explore} <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          JOURNEY TIMELINE
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto container-wide">
          <motion.div {...fadeUp()} className="mb-12">
            <span className="badge-primary mb-4 block w-fit">{data.journey.sectionBadge}</span>
            <p className="body-lg max-w-2xl">{data.journey.intro}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {data.journey.phases.map((phase, i) => (
              <motion.div key={phase.phase} {...fadeUp(i * 0.1)}
                className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors duration-300"
              >
                <div className="text-xs font-body font-bold uppercase tracking-widest text-primary mb-2">{phase.phase} · {phase.period}</div>
                <div className="font-display text-xl font-semibold text-tide-text mb-2">{phase.lives}</div>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{phase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          JOIN CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[420px] flex items-center">
        <div className="absolute inset-0">
          <img src={`${B}${data.cta.backgroundImage}`} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/50" />
        </div>

        <div className="relative z-10 w-full section-padding">
          <div className="max-w-7xl mx-auto container-wide">
            <div className="max-w-xl">
              <motion.div {...fadeUp()}>
                <span className="badge-white mb-5 block w-fit">{data.cta.badge}</span>
                <h2 className="display-md text-white">{data.cta.sectionTitle}</h2>
                <p className="body-lg mt-4 text-white/75">{data.cta.body}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button to={data.cta.volunteerHref} size="lg"
                    className="bg-white text-primary hover:bg-primary-faint font-semibold shadow-float"
                  >
                    {data.cta.volunteerLabel} <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button to={data.cta.donateHref} size="lg"
                    className="gradient-accent text-tide-text border-none shadow-float"
                  >
                    <Heart className="w-4 h-4" /> {data.cta.donateLabel}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
