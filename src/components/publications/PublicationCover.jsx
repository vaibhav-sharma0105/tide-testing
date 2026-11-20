import { useState } from 'react'
import FadeImage from './FadeImage'
import { COVER_TONES, LINE_PATTERN, LIFT, ZOOM, ratioOf } from './typeStyles'

// A TIDE report cover as a stack of paper (annual reports: the featured one and the shelf).
// The slot has a fixed 3:4 box (no layout shift, covers line up on one baseline); the cover inside
// takes the slot's full height and its OWN width/height ratio from the manifest, so the page is
// shown whole with no letterbox (TIDE thumbnails are whole pages, never cropped). Behind it,
// `stack` sheets of paper give depth; inside a hovered/focused `group` the cover lifts, the
// sheets fan out a little and the image zooms slightly (all off under reduced motion).
// Without a thumbnail: a typeset stand-in on a dark brand tone (period large, title small, an
// amber rule — amber is safe on these dark tones). Decorative — the title and period are always
// printed next to it — so hidden from screen readers. Text inside comes from the Sheet row.
//   size 'lg' (featured) | 'md' (shelf); tone: index into COVER_TONES; priority: main image.

const STANDIN_RATIO = 0.7
const SHEETS = [
  'translate-x-1 -translate-y-1 rotate-[2deg] motion-safe:group-hover:rotate-[3.5deg]',
  'translate-x-2 -translate-y-2 rotate-[4deg] motion-safe:group-hover:rotate-[6.5deg]',
]

export default function PublicationCover({ thumb, title, period, size = 'md', tone = 0, stack = 1, priority = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = thumb?.src && !failed
  const ratio = showImage ? ratioOf(thumb, { min: 0.5, max: 0.85 }) : STANDIN_RATIO
  const toneClass = COVER_TONES[((tone % COVER_TONES.length) + COVER_TONES.length) % COVER_TONES.length]
  const lg = size === 'lg'

  return (
    <div aria-hidden="true" className={`relative flex aspect-[3/4] w-full items-end justify-center ${className}`}>
      <div className={`relative isolate h-full max-w-full ${LIFT} motion-safe:group-hover:-translate-y-1`} style={{ aspectRatio: ratio }}>
        {SHEETS.slice(0, stack).map((cls, i) => (
          <span
            key={i}
            className={`absolute inset-0 rounded-[3px] bg-white ring-1 ring-tide-border shadow-card transition-transform duration-300 ease-out motion-reduce:transition-none ${cls}`}
            style={{ zIndex: -1 - i }}
          />
        ))}
        <div className={`absolute inset-0 overflow-hidden rounded-[3px] ${showImage ? 'bg-white' : toneClass} ${lg ? 'shadow-float' : 'shadow-card'} transition-shadow duration-300 group-hover:shadow-card-hover`}>
          {showImage ? (
            <FadeImage
              src={thumb.src}
              width={thumb.width}
              height={thumb.height}
              priority={priority}
              onError={() => setFailed(true)}
              className={`h-full w-full object-contain ${ZOOM} motion-safe:group-hover:scale-[1.03]`}
            />
          ) : (
            <div className={`absolute inset-0 flex flex-col text-white ${LINE_PATTERN} ${lg ? 'p-6 md:p-8' : 'p-3 sm:p-4'}`}>
              <span className={`block h-1 rounded-full bg-accent ${lg ? 'w-12' : 'w-7'}`} />
              {period && (
                <span className={`mt-auto font-display font-semibold leading-none tabular-nums ${lg ? 'text-5xl md:text-6xl' : 'text-2xl sm:text-[1.7rem]'}`}>{period}</span>
              )}
              <span className={`font-body font-medium leading-snug text-white/75 break-words ${period ? 'mt-2' : 'mt-auto'} ${lg ? 'text-base line-clamp-3' : 'text-[11px] line-clamp-2'}`}>{title}</span>
            </div>
          )}
          {/* Bound edge + hairline, so every cover reads as a printed document. */}
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/15 to-transparent" />
          <span className="pointer-events-none absolute inset-0 rounded-[3px] ring-1 ring-inset ring-black/10" />
        </div>
      </div>
    </div>
  )
}
