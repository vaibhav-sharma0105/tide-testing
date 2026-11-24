import { motion } from 'framer-motion'
import { ArrowRight, Heart, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../../utils/motionPresets'
import { tiltHandler, settleTilt } from '../../utils/tilt'

// "Be part of the change": the page's closing invitation. The two ways to help are two large doors,
// not two small buttons — each a whole card that tilts with the mouse, so the choice is obvious and
// easy to hit on any screen. Donating carries the accent colour (the site's one coloured action).
// `cta` = home YAML `cta`.

const B = import.meta.env.BASE_URL
const tilt = tiltHandler(6, 5)

function Door({ to, label, icon: Icon, accent, delay }) {
  return (
    <motion.li {...fadeUp(delay)}>
      <Link
        to={to}
        onPointerMove={tilt}
        onPointerLeave={settleTilt}
        className="group block rounded-3xl focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-navy"
      >
        <div className={`tilt-3d relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] md:p-7 ${accent
          ? 'gradient-accent text-tide-text'
          : 'bg-white/[0.08] text-white ring-1 ring-white/20 transition-colors duration-300 group-hover:bg-white/[0.14]'}`}
        >
          <span className="tilt-3d-glare pointer-events-none absolute inset-0" />
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent ? 'bg-tide-text/10' : 'bg-white/15'}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="mt-6 flex items-end justify-between gap-4">
            <span className="font-display text-xl font-semibold leading-tight md:text-2xl">{label}</span>
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${accent ? 'bg-tide-text text-white' : 'bg-white text-primary-dark'}`}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        </div>
      </Link>
    </motion.li>
  )
}

export default function HomeCta({ cta }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={`${B}${cta.backgroundImage}`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

      <div className="section-padding relative z-10">
        <div className="container-wide mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div {...fadeUp()}>
            <span className="badge-white mb-5 block w-fit">{cta.badge}</span>
            <h2 className="display-md text-white text-balance">{cta.sectionTitle}</h2>
            <p className="body-lg mt-4 max-w-lg text-white/80">{cta.body}</p>
          </motion.div>
          <ul className="grid gap-4 sm:grid-cols-2">
            <Door to={cta.volunteerHref} label={cta.volunteerLabel} icon={Users} delay={0.1} />
            <Door to={cta.donateHref} label={cta.donateLabel} icon={Heart} accent delay={0.2} />
          </ul>
        </div>
      </div>
    </section>
  )
}
