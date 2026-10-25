import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from './Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import { imgSrc } from '../../utils/imgSrc'

/* Full class strings (not `duration-${n}`) so Tailwind can see them. */
const HOVER_DURATION = { 500: 'duration-500', 700: 'duration-700' }

/**
 * Click-to-zoom photo grid + the lightbox it opens.
 *
 * Owns useLightbox and the <AnimatePresence><Lightbox/></AnimatePresence> pair.
 * The lightbox is rendered AFTER whatever `children` returns, so pages keep the
 * overlay as a sibling of the gallery <section> (not nested inside it).
 *
 * images         — [{ src, label }] (label doubles as the thumbnail alt)
 * gridClassName  — classes for the grid <div>
 * itemClassName  — leading classes on each button (shape: rounded/aspect/border…)
 * ringClassName  — focus-visible ring colour class
 * spanClassName  — optional (i) => trailing classes (e.g. first-tile span rule)
 * itemMotion     — (i) => motion props for each button (fade-up, scale-in…)
 * hoverDuration  — 500 | 700, zoom-on-hover duration of the thumbnail
 * children       — (grid) => element; place `grid` where the grid belongs
 */
export default function LightboxGallery({
  images,
  gridClassName,
  itemClassName,
  ringClassName,
  spanClassName,
  itemMotion,
  hoverDuration = 700,
  children,
}) {
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(images.length)

  const grid = (
    <div className={gridClassName}>
      {images.map((item, i) => (
        <motion.button
          key={item.src}
          {...itemMotion(i)}
          onClick={() => openLightbox(i)}
          className={`${itemClassName} cursor-zoom-in focus:outline-none focus-visible:ring-2 ${ringClassName}${spanClassName ? ` ${spanClassName(i)}` : ''}`}
        >
          <img src={imgSrc(item.src)} alt={item.label} loading="lazy" decoding="async" className={`w-full h-full object-cover hover:scale-105 transition-transform ${HOVER_DURATION[hoverDuration]}`} />
        </motion.button>
      ))}
    </div>
  )

  return (
    <>
      {children(grid)}
      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox images={images} currentIndex={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} onGoTo={openLightbox} />
        )}
      </AnimatePresence>
    </>
  )
}
