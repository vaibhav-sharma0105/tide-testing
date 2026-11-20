import { useState } from 'react'
import FadeImage from './FadeImage'
import TypeIcon from './TypeIcon'
import { DOT_PATTERN, FAMILY_STYLE, LIFT, ZOOM, ratioOf } from './typeStyles'
import { typeIconKey } from '../../utils/publicationFilters'

// A thumbnail on a small brand panel, for list entries on both Publications pages:
//   - a soft tint + faint dot texture behind the image, and a thin edge coloured by the type's
//     family (same families as the icons; colour is decoration — the label says the type);
//   - the image framed at its OWN width/height ratio from the manifest (CSS aspect-ratio, so the
//     space is reserved before it loads), clamped to [minRatio, maxRatio]; THRIvE thumbnails
//     already come within 3:4…16:9, TIDE pages are never cropped (no clamp). No letterbox bars;
//   - inside a hovered/focused `group/media` the panel lifts and the image zooms slightly inside
//     its frame; the image fades in when loaded. All motion is off under reduced motion.
//   - without a thumbnail: a stand-in page (white, the family icon, a few ruled lines).
// Decorative (the title is printed beside it), so hidden from screen readers.
//   maxHeightRem: caps the framed image's height (its width shrinks with it, keeping the ratio),
//   used for wide images that span a whole card.

export default function MediaPanel({ thumb, type, minRatio, maxRatio, standinRatio = 3 / 4, maxHeightRem, className = '' }) {
  const [failed, setFailed] = useState(false)
  const style = FAMILY_STYLE[typeIconKey(type)] ?? FAMILY_STYLE.file
  const showImage = thumb?.src && !failed
  const ratio = showImage ? ratioOf(thumb, { min: minRatio, max: maxRatio }) : standinRatio

  return (
    <span
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-xl p-2 ring-1 ring-inset ring-black/5 ${style.tint} ${LIFT} motion-safe:group-hover/media:-translate-y-0.5 motion-safe:group-focus-within/media:-translate-y-0.5 group-hover/media:shadow-card-hover ${className}`}
    >
      <span className={`pointer-events-none absolute inset-0 ${DOT_PATTERN}`} />
      <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${style.edge}`} />
      <span
        className="relative mx-auto block w-full overflow-hidden rounded-md bg-white shadow-card ring-1 ring-black/10"
        style={{ aspectRatio: ratio, maxWidth: maxHeightRem ? `${(maxHeightRem * ratio).toFixed(2)}rem` : undefined }}
      >
        {showImage ? (
          <FadeImage
            src={thumb.src}
            width={thumb.width}
            height={thumb.height}
            onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-contain ${ZOOM} motion-safe:group-hover/media:scale-[1.05] motion-safe:group-focus-within/media:scale-[1.05]`}
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <TypeIcon type={type} className={`h-6 w-6 sm:h-7 sm:w-7 ${style.icon}`} />
            <span className="flex w-3/5 flex-col items-center gap-1" >
              <span className="h-0.5 w-full rounded-full bg-tide-border" />
              <span className="h-0.5 w-4/5 rounded-full bg-tide-border" />
            </span>
          </span>
        )}
      </span>
    </span>
  )
}
