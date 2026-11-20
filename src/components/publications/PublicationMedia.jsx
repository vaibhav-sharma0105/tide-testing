import { useState } from 'react'
import FadeImage from './FadeImage'
import TypeIcon from './TypeIcon'
import { DOT_PATTERN, DRIFT, DRIFT_SLOW, FAMILY_STYLE, FRAME } from './typeStyles'
import { typeIconKey } from '../../utils/publicationFilters'

// A publication's thumbnail in a FIXED frame (`shape`: a FRAME key), used by every list on both
// Publications pages:
//   - behind: the type family's tint + a blurred, enlarged copy of the same image, so each frame
//     takes its colour from its own cover (no letterbox bars, no grey boxes);
//   - front: the image itself, WHOLE (never cropped), with 5px white padding on the <img>, on a
//     white mat that fades out over 24px into the wash (no hard edge), set 24px in from the
//     frame's edges — so the picture never touches the frame or the text beside it. On hover the
//     fade narrows while the white grows into a crisp 8px frame, in one motion (.pub-mat);
//   - bottom-right: a small badge with the type family's icon (decorative — the type label is
//     printed beside every thumbnail);
//   - inside a hovered/focused `group/media`, the image drifts up and grows ~3% while the wash
//     drifts more slowly (DRIFT / DRIFT_SLOW; off under reduced motion);
//   - no thumbnail (or it fails to load): `standin` if given, else the family icon on the tint.
// Decorative (the title is printed beside it), so hidden from screen readers.
//   src: 'thumb' (lists) | 'full' (large featured cover) · priority: above-the-fold image.
//   sizes: the frame's display width (CSS sizes syntax); when
//   given, high-resolution screens may load the full-size file instead of the thumbnail — only
//   when both files have the same shape (THRIvE thumbnails outside 3:4…16:9 are cropped, the full
//   file never is), so the picture never changes crop.

// Shape of the frame (the 24px INSET is the same on every side), to decide which side limits.
const INNER_RATIO = { landscape: 4 / 3, card: 5 / 6, portrait: 3 / 4 }
// The gap between the frame and the image holds the mat's fade (--mat-fade in index.css, 24px).
const INSET = 'p-6'
const sameShape = (t) => t?.full && t.width > 0 && t.height > 0 && t.fullWidth > 0 && t.fullHeight > 0 &&
  Math.abs(t.width / t.height - t.fullWidth / t.fullHeight) < 0.02
// The white mat behind the image (soft fade at rest, morphing into a crisp 8px frame on
// hover/focus) is the .pub-mat / .pub-mat-shadow classes in src/index.css: the animation needs
// registered CSS properties (@property), which Tailwind classes cannot declare.
const HOVER_IMAGE = 'motion-safe:group-hover/media:-translate-y-1 motion-safe:group-hover/media:scale-[1.03] motion-safe:group-focus-within/media:-translate-y-1 motion-safe:group-focus-within/media:scale-[1.03]'
const HOVER_WASH = 'motion-safe:group-hover/media:scale-[1.4] motion-safe:group-focus-within/media:scale-[1.4]'

export default function PublicationMedia({ thumb, type, shape = 'landscape', src = 'thumb', sizes, priority = false, standin, className = '' }) {
  const [failed, setFailed] = useState(false)
  const style = FAMILY_STYLE[typeIconKey(type)] ?? FAMILY_STYLE.file
  const full = src === 'full' && thumb?.full
  const url = full ? thumb.full : thumb?.src
  const showImage = Boolean(url) && !failed
  // The image box takes the image's own ratio and fills the frame's inner area along its limiting
  // side (wider than the frame → full width, else full height), so it is never cropped.
  const ratio = thumb?.width > 0 && thumb?.height > 0 ? thumb.width / thumb.height : INNER_RATIO[shape]
  const fit = ratio > (INNER_RATIO[shape] ?? INNER_RATIO.landscape) ? 'w-full' : 'h-full'
  const srcSet = !full && sizes && sameShape(thumb) ? `${thumb.src} ${thumb.width}w, ${thumb.full} ${thumb.fullWidth}w` : undefined

  return (
    <span aria-hidden="true" className={`relative isolate block overflow-hidden rounded-2xl ring-1 ring-inset ring-black/[0.06] ${style.tint} ${FRAME[shape] ?? FRAME.landscape} ${className}`}>
      {showImage ? (
        <>
          <img
            src={thumb.src}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            data-no-placeholder
            className={`pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl brightness-125 saturate-150 ${DRIFT_SLOW} ${HOVER_WASH}`}
          />
          {/* A light veil, never a dark one: a black-and-white cover (most annual reports) blurs to
              grey, so the wash is kept faint and bright under the type family's light brand veil. */}
          <span className={`pointer-events-none absolute inset-0 ${style.veil}`} />
          <span className={`absolute inset-0 flex items-center justify-center ${INSET}`}>
            <span className={`relative block max-h-full max-w-full ${fit} ${DRIFT} ${HOVER_IMAGE}`} style={{ aspectRatio: ratio }}>
              <span aria-hidden="true" className="pub-mat-shadow" />
              <span aria-hidden="true" className="pub-mat" />
              <FadeImage
                src={url}
                srcSet={srcSet}
                sizes={sizes}
                width={full ? thumb.fullWidth : thumb.width}
                height={full ? thumb.fullHeight : thumb.height}
                priority={priority}
                onError={() => setFailed(true)}
                className="relative block h-full w-full object-contain p-[5px]"
              />
            </span>
          </span>
        </>
      ) : (
        standin ?? (
          <span className={`absolute inset-0 flex items-center justify-center ${DOT_PATTERN}`}>
            <TypeIcon type={type} className={`h-10 w-10 opacity-70 ${style.icon}`} />
          </span>
        )
      )}
      {/* Type badge; hovering it shows the type's name in a small tooltip to its left (inside
          the frame, so it is never clipped; drawn by CSS from data-tip, so it is never copied). Visual only — the type is printed beside every image. */}
      <span className="group/badge absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_12px_-4px_rgba(13,31,60,0.35)] ring-1 ring-black/5 backdrop-blur-sm">
        <TypeIcon type={type} className={`h-[18px] w-[18px] ${style.icon}`} />
        {type && (
          <span className="pointer-events-none absolute right-full top-1/2 mr-2 w-max max-w-[13rem] -translate-y-1/2 translate-x-1 rounded-lg bg-tide-text/90 px-2.5 py-1.5 font-body text-xs font-medium leading-snug text-white opacity-0 shadow-lg transition duration-200 ease-out group-hover/badge:translate-x-0 group-hover/badge:opacity-100 motion-reduce:transition-none before:content-[attr(data-tip)]" data-tip={type} />
        )}
      </span>
    </span>
  )
}
