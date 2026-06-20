import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BookOpen, Users, Heart, Lightbulb, GraduationCap, Globe, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import Button from '../components/ui/Button'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import data from '../data/home.json'

/* ── Icon + color map (visual config, not content) ─────────────────── */
const ICON_MAP = { Globe, BookOpen, GraduationCap, Heart, Lightbulb, Users }
const B = import.meta.env.BASE_URL  // '/tide-testing/' on GitHub Pages, '/' locally
const PROGRAM_COLORS = [
  'from-blue-600 to-primary',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-purple-600',
]

/* ── Motion presets ───────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, delay, ease: [0.4, 0, 0.2, 1] },
})
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
})

/* ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { t } = useTranslation()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <>
      <Helmet>
        <title>{data.meta.seoTitle}</title>
        <meta name="description" content={data.meta.seoDescription} />
        <meta property="og:title" content={data.meta.seoTitle} />
        <meta property="og:description" content={data.meta.seoDescription} />
        <meta property="og:url" content="https://tideinternational.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://tideinternational.org/assets/images/shared/tide-logo.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://tideinternational.org/"}
          ]
        })}</script>
      </Helmet>

      {/* ══════════════════════════════════════════════════════════════
          HERO — full-viewport photo with parallax
      ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background photo with parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 -top-[10%] -bottom-[10%]">
          <img src={`${B}assets/images/home/slider-1.jpg`} alt="" className="w-full h-full object-cover object-center" />
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
              <span className="badge-white">{t('home.hero.badge', data.hero.badge)}</span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.2)}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[5.25rem] font-bold text-white leading-[1.05] tracking-tight text-balance"
            >
              {t('home.hero.tagline', data.hero.tagline)}{' '}
              <em className="not-italic text-accent">{t('home.hero.taglineHighlight', data.hero.taglineHighlight)}</em>
            </motion.h1>

            <motion.p {...fadeUp(0.3)} className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
              {t('home.hero.description', data.hero.description)}
            </motion.p>

            <motion.div {...fadeUp(0.4)} className="mt-10 flex flex-wrap gap-4">
              <Button to="/about/why-tide" size="lg"
                className="bg-white text-primary hover:bg-primary-faint font-semibold shadow-float px-8 py-4"
              >
                {t('home.hero.cta', data.hero.ctaLabel)} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button to="/get-involved/volunteer" size="lg"
                className="gradient-accent text-white border-none shadow-float px-8 py-4"
              >
                {t('home.hero.ctaSecondary', data.hero.ctaSecondaryLabel)}
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
                <img src={`${B}assets/images/projects-bettered/gallery-07.jpg`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 photo-overlay rounded-2xl" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-0 left-0 w-44 h-56 rounded-2xl overflow-hidden shadow-float border-2 border-white/20"
                style={{ animationDelay: '2s' }}
              >
                <img src={`${B}assets/images/get-involved-volunteer/gallery-04.jpg`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 photo-overlay rounded-2xl" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute bottom-24 right-4 glass rounded-2xl px-4 py-3 shadow-float"
              >
                <div className="font-display font-bold text-primary text-xl leading-none">6</div>
                <div className="text-xs text-tide-muted font-body mt-0.5">{t('home.hero.floatProjects', data.hero.floatProjects)}</div>
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
          <span className="text-white/50 text-xs font-body tracking-widest uppercase">{t('home.hero.scroll', data.hero.scroll)}</span>
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
              <span className="badge-primary mb-5 block w-fit">{t('home.mission.badge', data.mission.sectionBadge)}</span>
              <h2 className="display-lg text-tide-text">{t('home.mission.title', data.mission.title)}</h2>
              <p className="body-lg mt-5">{t('home.mission.body', data.mission.body)}</p>
              <blockquote className="mt-8 pl-6 border-l-4 border-accent relative">
                <Quote className="absolute -top-1 -left-1 w-5 h-5 text-accent opacity-60" />
                <p className="font-display text-xl italic text-tide-text leading-snug">
                  "{t('home.mission.quote', data.mission.quote)}"
                </p>
              </blockquote>
              <div className="mt-8">
                <Button to="/about/why-tide" variant="ghost"
                  className="text-primary hover:bg-primary-faint px-0 font-semibold"
                >
                  {t('home.mission.learnMore', data.mission.learnMore)} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeIn(0.15)} className="order-1 lg:order-2 relative">
              <div className="relative h-[340px] sm:h-[420px] md:h-[540px]">
                <div className="absolute right-0 top-0 w-[75%] h-[85%] rounded-3xl overflow-hidden shadow-float">
                  <img src={`${B}assets/images/home/why-tide.jpg`} alt={data.mission.image1Alt} className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-0 bottom-0 w-[52%] h-[55%] rounded-2xl overflow-hidden shadow-float border-4 border-tide-bg">
                  <img src={`${B}assets/images/home/join-us.jpg`} alt={data.mission.image2Alt} className="w-full h-full object-cover" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute top-6 left-6 gradient-accent text-white rounded-2xl px-4 py-3 shadow-float"
                >
                  <div className="font-display font-bold text-2xl leading-none">2014</div>
                  <div className="text-xs font-body mt-0.5 text-white/80">{t('home.hero.floatFounded', data.hero.floatFounded)}</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          IMPACT METRICS
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${B}assets/images/home/bg-counter.jpg`} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,33,55,0.93) 0%, rgba(13,33,55,0.82) 100%)' }} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #F59E0B 30%, #F59E0B 70%, transparent 100%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-[10px] font-body font-bold uppercase tracking-[0.22em] text-accent">
              <span className="h-px w-8 bg-accent/60 inline-block" />
              {t('home.impact.sectionLabel', data.impact.sectionLabel)}
              <span className="h-px w-8 bg-accent/60 inline-block" />
            </span>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {data.impact.stats.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.1)} className="text-center px-3 sm:px-6 py-6 md:py-2 group">
                <AnimatedCounter value={s.value} label="" light numClassName="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-none text-white mb-2" />
                <div className="h-[2px] w-10 mx-auto mb-3 rounded-full bg-accent opacity-70 group-hover:w-16 group-hover:opacity-100 transition-all duration-400" />
                <div className="font-body font-semibold text-sm text-white/90 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="font-body text-xs text-white/45 leading-relaxed">{s.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          JOURNEY TIMELINE
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-white">
        <div className="max-w-5xl mx-auto container-wide">
          <motion.div {...fadeUp()} className="mb-12">
            <span className="badge-primary mb-4 block w-fit">{t('home.journey.badge', data.journey.sectionBadge)}</span>
            <p className="body-lg max-w-2xl">{t('home.journey.intro', data.journey.intro)}</p>
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
          PROGRAMS
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-7xl mx-auto container-wide">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <span className="badge-primary mb-4 mx-auto">{t('home.programs.badge', data.programs.sectionBadge)}</span>
            <h2 className="display-md text-tide-text mt-3">{t('home.programs.title', data.programs.sectionTitle)}</h2>
            <p className="body-md max-w-xl mx-auto mt-4">{t('home.programs.subtitle', data.programs.sectionSubtitle)}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.programs.items.map((p, i) => {
              const Icon  = ICON_MAP[p.iconKey] || Globe
              const color = PROGRAM_COLORS[i] || 'from-primary to-primary'
              return (
                <motion.div key={p.to} {...fadeUp(i * 0.07)}>
                  <Link to={p.to} className="card-photo group block h-full min-h-[320px]">
                    <img src={`${B}${p.photo}`} alt={p.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 photo-overlay transition-opacity duration-300 group-hover:opacity-90" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-body font-bold uppercase tracking-[0.14em] text-white border border-accent/40 backdrop-blur-sm" style={{ background: 'rgba(245,158,11,0.82)' }}>{p.badge}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${color} mb-3`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white leading-tight">{p.title}</h3>
                      <p className="text-sm text-white/75 font-body mt-1.5 leading-relaxed line-clamp-2">{p.desc}</p>
                      <div className="mt-3 flex items-center gap-1 text-accent text-sm font-semibold font-body translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {t('home.programs.explore', data.programs.explore)} <ArrowRight className="w-3.5 h-3.5" />
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
          STUDENT WORK PADLET
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-7xl mx-auto container-wide">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <span className="badge-primary mb-4 mx-auto">{t('home.padlet.badge', data.padlet.sectionBadge)}</span>
            <h2 className="display-md text-tide-text">{t('home.padlet.title', data.padlet.title)}</h2>
          </motion.div>
          <motion.div {...fadeUp(0.1)} className="relative rounded-2xl overflow-hidden border border-tide-border shadow-card"
            style={{ paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={data.padlet.url}
              title={data.padlet.iframeTitle}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="camera;microphone;geolocation"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-32 px-4 md:px-8 lg:px-16">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #FEF9EF 0%, #FDF3DC 45%, #F9E8C4 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 55%, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
        <div
          className="absolute -top-6 right-4 md:right-12 leading-none text-amber-400/[0.09] pointer-events-none select-none font-display"
          style={{ fontSize: 'clamp(18rem, 28vw, 32rem)', lineHeight: 0.82, fontFamily: '"Playfair Display", serif' }}
        >
          "
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div {...fadeUp()}>
            <div
              className="rounded-3xl p-8 md:p-12 border border-amber-200/70"
              style={{
                background: 'rgba(255,255,255,0.52)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 48px rgba(180,120,20,0.10), 0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.45))' }} />
                <span className="text-[10px] font-body font-bold uppercase tracking-[0.22em] text-amber-600/80">{t('home.testimonial.sectionLabel', data.testimonial.sectionLabel)}</span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(245,158,11,0.45))' }} />
              </div>

              <blockquote className="font-display text-xl md:text-2xl font-normal leading-[1.72] italic mb-10" style={{ color: '#3D2200', letterSpacing: '0.01em' }}>
                "{t('home.testimonial.quote', data.testimonial.quote)}"
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border-2 border-white">
                    <img src={`${B}assets/images/home/testimonial-quote.png`} alt={data.testimonial.author} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full gradient-accent flex items-center justify-center shadow-sm">
                    <Quote className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="font-display font-bold text-base leading-tight" style={{ color: '#2C1800' }}>
                    {t('home.testimonial.name', data.testimonial.author)}
                  </div>
                  <div className="font-body text-sm mt-0.5" style={{ color: '#8B5E1A' }}>
                    {t('home.testimonial.role', data.testimonial.role)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          JOIN CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[420px] flex items-center">
        <div className="absolute inset-0">
          <img src={`${B}assets/images/home/bg-contact-strip.jpg`} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/50" />
        </div>

        <div className="relative z-10 w-full section-padding">
          <div className="max-w-7xl mx-auto container-wide">
            <div className="max-w-xl">
              <motion.div {...fadeUp()}>
                <span className="badge-white mb-5 block w-fit">{t('home.cta.badge', data.cta.badge)}</span>
                <h2 className="display-md text-white">{t('home.cta.title', data.cta.sectionTitle)}</h2>
                <p className="body-lg mt-4 text-white/75">{t('home.cta.body', data.cta.body)}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button to="/get-involved/volunteer" size="lg"
                    className="bg-white text-primary hover:bg-primary-faint font-semibold shadow-float"
                  >
                    {t('home.cta.volunteer', data.cta.volunteerLabel)} <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button to="/get-involved/donate" size="lg"
                    className="gradient-accent text-white border-none shadow-float"
                  >
                    <Heart className="w-4 h-4" /> {t('home.cta.donate', data.cta.donateLabel)}
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
