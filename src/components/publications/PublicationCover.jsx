import PublicationMedia from './PublicationMedia'
import { LINE_PATTERN } from './typeStyles'

// A TIDE report cover (the spotlighted latest report): PublicationMedia in the portrait frame
// (white mat, no spine), so every cover is the same size and lines up, and each page is shown whole.
// Without a thumbnail: a typeset stand-in on navy (period large, title small, an amber rule —
// amber is safe on navy). Text inside comes from the Sheet row.
//   size 'lg' (the spotlight; uses the full-size image) | 'md'.

export default function PublicationCover({ thumb, type, title, period, size = 'md', priority = false, className = '' }) {
  const lg = size === 'lg'
  const standin = (
    <span className={`absolute inset-0 flex flex-col text-white bg-navy ${LINE_PATTERN} ${lg ? 'p-7 md:p-9' : 'p-4'}`}>
      <span className={`block h-1 rounded-full bg-accent ${lg ? 'w-12' : 'w-7'}`} />
      {period && (
        <span className={`mt-auto font-display font-semibold leading-none tabular-nums ${lg ? 'text-5xl md:text-6xl' : 'text-2xl sm:text-[1.7rem]'}`}>{period}</span>
      )}
      <span className={`mb-10 font-body font-medium leading-snug text-white/75 break-words ${period ? 'mt-2' : 'mt-auto'} ${lg ? 'text-base line-clamp-3' : 'text-[11px] line-clamp-2'}`}>{title}</span>
    </span>
  )
  return (
    <PublicationMedia
      thumb={thumb}
      type={type}
      shape="portrait"
      src={lg ? 'full' : 'thumb'}
      priority={priority}
      standin={standin}
      className={className}
    />
  )
}
