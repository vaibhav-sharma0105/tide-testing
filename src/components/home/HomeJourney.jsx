import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { fadeUp } from '../../utils/motionPresets'

// "Our Journey": the phases as one timeline instead of three loose columns.
//   - A track runs through the phase markers and fills as the visitor scrolls through the section
//     (horizontal on wide screens, vertical on phones) — progress you can feel.
//   - Each phase's lives figure is shown as it is (the filling track is the motion here).
//   - The last phase is a plan, not a result: its marker is hollow and dashed and its figure lighter,
//     so a target never reads as an achievement. Which phase is "the plan" is the last one in YAML.
// `journey` = home YAML `journey`.


export default function HomeJourney({ journey }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 })
  const phases = journey.phases
  const last = phases.length - 1

  return (
    <section ref={ref} className="section-padding relative overflow-hidden bg-tide-bg">
      <div className="container-wide mx-auto max-w-6xl">
        <motion.div {...fadeUp()} className="mb-14 max-w-2xl md:mb-20">
          <span className="badge-primary mb-4 block w-fit">{journey.sectionBadge}</span>
          <p className="font-display text-2xl leading-snug text-tide-text text-balance md:text-[2rem]">{journey.intro}</p>
        </motion.div>

        <div className="relative">
          {/* Track: wide screens run left → right through the markers, phones top → bottom. */}
          <div aria-hidden="true" className="absolute left-[19px] top-2 bottom-2 w-px bg-tide-border md:bottom-auto md:left-0 md:right-0 md:top-[19px] md:h-px md:w-auto">
            <motion.div className="absolute inset-0 hidden origin-left bg-gradient-to-r from-primary via-primary-mid to-primary/40 md:block" style={{ scaleX: fill }} />
            <motion.div className="absolute inset-0 origin-top bg-gradient-to-b from-primary via-primary-mid to-primary/40 md:hidden" style={{ scaleY: fill }} />
          </div>

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {phases.map((ph, i) => {
              const plan = i === last && phases.length > 1
              return (
                <motion.li key={ph.phase} {...fadeUp(0.1 + i * 0.15)} className="relative pl-14 md:pl-0 md:pt-16">
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full ${plan
                      ? 'border-2 border-dashed border-primary/50 bg-tide-bg'
                      : 'bg-primary shadow-[0_8px_20px_-6px_rgba(30,107,170,0.6)] ring-4 ring-primary-faint'}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${plan ? 'bg-primary/50' : 'bg-white'}`} />
                  </span>
                  <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-primary-dark">
                    {ph.phase}
                    <span className="mx-2 text-tide-border" aria-hidden="true">{'/'}</span>
                    <span className="text-tide-mutedOnLight">{ph.period}</span>
                  </p>
                  {/* Shown as they are: the timeline filling on scroll is the motion here. */}
                  <span className={`mt-3 block font-display text-2xl font-semibold leading-tight tabular-nums md:text-[1.7rem] ${plan ? 'text-tide-text/70' : 'text-tide-text'}`}>{ph.lives}</span>
                  <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-tide-muted">{ph.desc}</p>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
