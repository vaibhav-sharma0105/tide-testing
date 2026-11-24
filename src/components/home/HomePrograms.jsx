import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Globe, GraduationCap, Heart, Lightbulb, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../../utils/motionPresets'
import { tiltHandler, settleTilt } from '../../utils/tilt'

// "Three approaches. One vision." — three doors into the work.
//   - The three cards are numbered and joined by one line that draws itself across them: three
//     approaches, visibly one vision.
//   - Each card is a 3D object: it tilts towards the mouse, a glare follows the pointer, the photo
//     sits deeper than the text (they shift against each other) and zooms gently on hover.
//   - "Explore" is always visible (a hover-only call to action is invisible on touch screens).
// Icons and colours are visual config keyed from YAML (`iconKey`), not content.
// `programs` = home YAML `programs`.

const B = import.meta.env.BASE_URL
const ICONS = { Globe, BookOpen, GraduationCap, Heart, Lightbulb, Users }
const ACCENTS = ['from-sky-500 to-primary', 'from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600']
const tilt = tiltHandler(6, 5)

export default function HomePrograms({ programs }) {
  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(theme(colors.primary.DEFAULT/0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
      <div className="container-wide relative mx-auto max-w-7xl">
        <motion.div {...fadeUp()} className="mx-auto mb-16 max-w-2xl text-center">
          <span className="badge-primary mx-auto mb-4">{programs.sectionBadge}</span>
          <h2 className="display-md mt-3 text-tide-text text-balance">{programs.sectionTitle}</h2>
          <p className="body-md mx-auto mt-4 max-w-xl">{programs.sectionSubtitle}</p>
        </motion.div>

        <div className="relative">
          {/* One line through the three numbers (wide screens). */}
          <motion.div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-0 hidden h-px origin-left bg-gradient-to-r from-sky-400 via-emerald-400 to-violet-400 md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -32px 0px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            {programs.items.map((p, i) => {
              const Icon = ICONS[p.iconKey] || Globe
              return (
                <motion.li key={p.to} {...fadeUp(0)} className="relative flex flex-col items-center">
                  <span aria-hidden="true" className="relative z-10 mb-6 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-tide-border bg-white font-display text-sm font-semibold tabular-nums text-tide-text shadow-sm max-md:hidden">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link
                    to={p.to}
                    onPointerMove={tilt}
                    onPointerLeave={settleTilt}
                    className="group block w-full rounded-3xl focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                  >
                    <div className="tilt-3d relative aspect-[4/5] w-full rounded-3xl shadow-[0_2px_4px_rgba(13,31,60,0.06),0_30px_60px_-30px_rgba(13,31,60,0.55)] transition-shadow duration-500 group-hover:shadow-[0_4px_8px_rgba(13,31,60,0.08),0_44px_80px_-30px_rgba(13,31,60,0.6)] md:aspect-[3/4]">
                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <img src={`${B}${p.photo}`} alt="" loading="lazy" decoding="async" className="h-full w-full scale-105 object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/0" />
                        <span className="tilt-3d-glare absolute inset-0" />
                      </div>
                      {/* The text layer floats above the photo (moves against it when tilted). */}
                      <div className="absolute inset-x-0 bottom-0 p-6 [transform:translateZ(30px)] md:p-7">
                        <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENTS[i] ?? ACCENTS[0]} shadow-lg`}>
                          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                        <h3 className="font-display text-xl font-bold leading-tight text-white md:text-[1.4rem]">{p.title}</h3>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/80">{p.desc}</p>
                        <span className="mt-5 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-4 font-body text-sm font-semibold text-white ring-1 ring-white/20 transition-colors duration-300 group-hover:bg-white group-hover:text-primary-dark">
                          {programs.explore}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
