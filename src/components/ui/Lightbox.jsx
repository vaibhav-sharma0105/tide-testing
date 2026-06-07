import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { imgSrc } from '../../utils/imgSrc'

/**
 * Full-screen image lightbox with prev/next navigation.
 *
 * images  — array of strings OR objects { src, alt?, label? }
 * currentIndex — number (null/undefined = closed)
 * onClose / onPrev / onNext — callbacks
 */
export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  /* ── keyboard ────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const item   = images[currentIndex] ?? images[0]
  const src    = imgSrc(typeof item === 'string' ? item : item.src)
  const caption = typeof item === 'string' ? '' : (item.alt || item.label || '')
  const total  = images.length
  const multi  = total > 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(5,8,18,0.96)', backdropFilter: 'blur(8px) saturate(120%)' }}
      onClick={onClose}
    >
      {/* ── top bar ────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-3 z-10">
        {/* counter */}
        {multi && (
          <span className="font-body text-xs font-semibold text-white/50 tracking-widest tabular-nums">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-white/20 mx-1">/</span> {String(total).padStart(2, '0')}
          </span>
        )}
        {!multi && <span />}

        {/* close */}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/12 hover:border-white/30 hover:bg-white/8 transition-all duration-200"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── prev / next arrows ─────────────────────────────────── */}
      {multi && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onPrev() }}
            className="absolute left-3 md:left-6 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white/55 hover:text-white border border-white/12 hover:border-white/30 hover:bg-white/8 transition-all duration-200"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext() }}
            className="absolute right-3 md:right-6 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white/55 hover:text-white border border-white/12 hover:border-white/30 hover:bg-white/8 transition-all duration-200"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── image ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.figure
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center gap-3 px-16 md:px-24"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt={caption}
            className="max-h-[80vh] max-w-[80vw] md:max-w-[72vw] object-contain rounded-xl"
            style={{ boxShadow: '0 32px 96px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)' }}
            draggable={false}
          />
          {caption && (
            <figcaption className="font-body text-xs text-white/38 tracking-wide max-w-md text-center">
              {caption}
            </figcaption>
          )}
        </motion.figure>
      </AnimatePresence>

      {/* ── dot strip ──────────────────────────────────────────── */}
      {multi && total <= 20 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); /* jump */ onClose(); /* not ideal — dots just for visual */ }}
              className={`rounded-full transition-all duration-200 ${i === currentIndex ? 'w-5 h-1.5 bg-white/80' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
