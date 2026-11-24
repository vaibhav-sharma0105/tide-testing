import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import FellowPhotos from './FellowPhotos'
import TiltGlare from '../ui/TiltGlare'
import { getFellowPhotos } from '../../utils/changemakersPhotos'
import { tiltProps } from '../../utils/tilt'
import { REVEAL, EASE_OUT, revealDelay } from '../../utils/motionPresets'

// One fellow in the Past SCF list. The person leads: the photo (a still picture — switching to the
// field-work photo is in the profile), a small batch label on the photo, then the NAME as the card's
// heading (E), the project under it (F, two lines always reserved so a row lines up), and one
// highlighted "See their story" cue.
// Opening the profile: a click anywhere on the card (a plain click handler on the card), or the
// name's button with the keyboard. Site tilt + glare + lift.
// `text` = the page YAML's `profiles` block; `onOpen(id)` opens the profile.

const TILT = tiltProps(7, 6)
const fill = (t, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, () => v ?? ''), t)

export default function FellowCard({ fellow, text, index = 0, onOpen }) {
  const photos = getFellowPhotos(fellow.id)
  // The name's own button already opens the profile; don't open it twice.
  // Focus the name first, so closing the profile returns focus to this card (the focus trap
  // restores whatever was focused when it opened).
  const openFromCard = (e) => {
    if (e.target.closest('button')) return
    e.currentTarget.querySelector('h3 button')?.focus({ preventScroll: true })
    onOpen(fellow.id)
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: REVEAL.y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: REVEAL.margin }}
      transition={{ duration: REVEAL.duration, delay: revealDelay(index % 4), ease: EASE_OUT }}
      {...TILT}
      className="group"
    >
      <article onClick={openFromCard} className="tilt-3d tilt-lift relative h-full cursor-pointer rounded-[1.25rem] border border-tide-border bg-white p-2 shadow-card hover:shadow-card-hover has-[:focus-visible]:shadow-card-hover sm:p-2.5">
        <TiltGlare />
        <div className="relative">
          <FellowPhotos fellow={fellow} photos={photos} text={text} frameClass="rounded-2xl" />
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-accent-deeper shadow-sm backdrop-blur">
            {fill(text.eyebrow, { batch: fellow.batch })}
          </span>
        </div>
        <div className="px-1.5 pb-1.5 pt-3.5 sm:px-2">
          <h3 className="font-display text-lg font-semibold leading-snug text-tide-text sm:text-xl">
            <button
              type="button"
              onClick={() => onOpen(fellow.id)}
              aria-label={fill(text.openProfile, { name: fellow.name })}
              title={fellow.name}
              className="line-clamp-2 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group-hover:text-primary-dark"
            >
              {fellow.name}
            </button>
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 font-body text-sm leading-5 text-tide-muted">{fellow.project}</p>
          <span aria-hidden="true" className="mt-3 inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-primary-faint px-4 py-1.5 font-body text-sm font-semibold text-primary-dark ring-1 ring-primary/15 transition-colors duration-300 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-has-[:focus-visible]:bg-primary group-has-[:focus-visible]:text-white">
            {text.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </motion.li>
  )
}
