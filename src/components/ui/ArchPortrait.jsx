import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import common from '../../data/common.json'
import { imgSrc } from '../../utils/imgSrc'
import { fadeUp } from '../../utils/motionPresets'
import TiltGlare from './TiltGlare'
import { tiltProps } from '../../utils/tilt'
const TILT = tiltProps(8, 8)

// The team-portrait style used on /about/our-team: an arched photo on a tilted colour frame.
// `layout="card"` stacks the portrait over the text; `layout="row"` puts them side by side.
// `size="lg"` enlarges the name and text for featured people (the co-directors).
// With `linkedin` the whole portrait is a link (opens in a new tab) with the same hover badge as /about/our-team.
// A person with no photo gets their initials on the brand gradient.
const FRAME_TONES = [
  'bg-accent-light rotate-3',
  'bg-primary-light -rotate-3',
  'bg-accent-light -rotate-2',
  'bg-primary-light rotate-2',
]

const getInitials = name => name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()

export default function ArchPortrait({ name, role, suffix, photo, linkedin, index = 0, layout = 'card', size = 'md', delay = 0, className = '' }) {
  const row = layout === 'row'
  const large = size === 'lg'
  const arch = row ? 'rounded-b-[2rem] rounded-t-[999px]' : 'rounded-b-[4rem] rounded-t-[999px]'

  const Wrapper = linkedin ? motion.a : motion.div
  const linkProps = linkedin
    ? { href: linkedin, target: '_blank', rel: 'noopener noreferrer', 'aria-label': common.viewLinkedIn.replace('{name}', name) }
    : {}

  return (
    <Wrapper
      {...fadeUp(delay)}
      {...linkProps}
      {...TILT}
      className={`group ${row ? 'flex items-center gap-5' : 'block'} ${className}`}
    >
      <div className={`relative shrink-0 ${row ? 'w-24 sm:w-28' : ''}`}>
        <div
          aria-hidden="true"
          className={`absolute inset-0 translate-x-1.5 translate-y-1.5 ${arch} transition-transform duration-500 motion-safe:group-hover:rotate-0 ${FRAME_TONES[index % FRAME_TONES.length]}`}
        />
        <div className={`tilt-3d tilt-lift relative aspect-square overflow-hidden bg-primary-light shadow-card group-hover:shadow-card-hover ${arch}`}>
          <TiltGlare />
          {photo ? (
            <img
              src={imgSrc(photo)}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top transition-transform duration-700 motion-safe:group-hover:scale-[1.05]"
            />
          ) : (
            <div className="gradient-primary flex h-full w-full items-center justify-center">
              <span className={`font-display font-bold text-white/60 select-none ${row ? 'text-3xl' : 'text-6xl'}`}>{getInitials(name)}</span>
            </div>
          )}
        </div>
        {linkedin && (
          <span
            aria-hidden="true"
            className={`absolute z-10 flex items-center justify-center rounded-full bg-primary-dark text-white shadow-float transition duration-300 [@media(hover:hover)]:scale-75 [@media(hover:hover)]:opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${row ? 'bottom-1 right-1 h-7 w-7' : 'bottom-3 right-3 h-9 w-9'}`}
          >
            <ArrowUpRight size={row ? 14 : 18} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div className={row ? 'min-w-0' : large ? 'px-1 pt-6' : 'px-1 pt-5'}>
        <h3 className={`font-display font-semibold leading-snug text-tide-text ${row ? 'text-lg' : large ? 'text-2xl' : 'text-xl'}`}>{name}</h3>
        <p className={`mt-1 font-body font-bold text-primary-dark ${large ? 'text-base' : 'text-sm'}`}>{role}</p>
        {suffix && <p className={`mt-0.5 font-body leading-relaxed text-tide-muted ${large ? 'text-sm' : 'text-xs'}`}>{suffix}</p>}
      </div>
    </Wrapper>
  )
}
