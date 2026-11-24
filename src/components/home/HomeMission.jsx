import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../../utils/motionPresets'

// "Our Mission": the idea first, then the belief behind it as a pull quote, then where to read more.
// The two photos sit at different depths and drift at different speeds as the page scrolls (the
// large one slower, the small one faster) — depth you feel rather than see. The founding chip fades
// in once. The quote's accent bar grows as it comes into view. "Reduce motion": no drift.
// `mission` = home YAML `mission`; `founded` = { value: site.foundingYear, label }.

const B = import.meta.env.BASE_URL

export default function HomeMission({ mission, founded }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const backY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40])
  const frontY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [90, -70])

  return (
    <section ref={ref} className="section-padding overflow-hidden bg-tide-bg">
      <div className="container-wide mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div {...fadeUp(0)} className="order-2 lg:order-1">
            <span className="badge-primary mb-5 block w-fit">{mission.sectionBadge}</span>
            <h2 className="display-lg text-tide-text text-balance">{mission.title}</h2>
            <p className="body-lg mt-5">{mission.body}</p>

            <figure className="relative mt-10 pl-7">
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-0 w-1 origin-top rounded-full bg-gradient-to-b from-accent to-accent-deeper"
                style={{ height: '100%' }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '0px 0px -32px 0px' }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
              <blockquote className="font-display text-xl italic leading-snug text-tide-text md:text-[1.4rem]">
                {`“${mission.quote}”`}
              </blockquote>
            </figure>

            <Link
              to={mission.learnMoreHref}
              className="group/more mt-9 inline-flex min-h-[44px] items-center gap-2 font-body font-semibold text-primary-dark underline-offset-4 hover:underline"
            >
              {mission.learnMore}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/more:translate-x-1" aria-hidden="true" />
            </Link>
          </motion.div>

          <div className="relative order-1 lg:order-2">
            <div className="relative h-[340px] sm:h-[440px] md:h-[540px]">
              <motion.div style={{ y: backY }} className="absolute right-0 top-0 h-[85%] w-[75%] overflow-hidden rounded-3xl shadow-[0_40px_80px_-30px_rgba(13,31,60,0.45)]">
                <img src={`${B}${mission.image1}`} alt={mission.image1Alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </motion.div>
              <motion.div style={{ y: frontY }} className="absolute bottom-0 left-0 h-[55%] w-[52%] overflow-hidden rounded-2xl border-[6px] border-tide-bg shadow-[0_30px_60px_-20px_rgba(13,31,60,0.5)]">
                <img src={`${B}${mission.image2}`} alt={mission.image2Alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </motion.div>
              <motion.div
                {...fadeUp(0.3)}
                className="absolute left-4 top-6 rounded-2xl px-4 py-3 text-tide-text shadow-float gradient-accent sm:left-6"
              >
                <div className="font-display text-2xl font-bold leading-none">{founded.value}</div>
                <div className="mt-0.5 font-body text-xs text-tide-text/85">{founded.label}</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
