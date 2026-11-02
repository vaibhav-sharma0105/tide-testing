import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { imgSrc } from '../../utils/imgSrc'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import ui from '../../data/ui.json'

/**
 * Full-screen image lightbox with prev/next navigation.
 *
 * images  — array of strings OR objects { src, alt?, label? }
 * currentIndex — number (null/undefined = closed)
 * onClose / onPrev / onNext — callbacks
 * onGoTo(i) — optional, jumps directly to image i (powers the dot strip)
 * translucent — optional, a see-through, blurred backdrop (the page stays faintly visible behind)
 *               instead of the near-opaque default
 * No caption is shown under the image; the alt text stays for screen readers.
 */
const CLEAR = { background: 'rgba(8,16,32,0)', backdropFilter: 'blur(0px) saturate(100%)', WebkitBackdropFilter: 'blur(0px) saturate(100%)' }
const TRANSLUCENT = { background: 'rgba(8,16,32,0.66)', backdropFilter: 'blur(18px) saturate(130%)', WebkitBackdropFilter: 'blur(18px) saturate(130%)' }
const OPAQUE = { background: 'rgba(5,8,18,0.96)', backdropFilter: 'blur(8px) saturate(120%)', WebkitBackdropFilter: 'blur(8px) saturate(120%)' }
const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: { duration: 0.22 } }

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext, onGoTo, translucent = false }) {
  const containerRef = useFocusTrap()

  /* ── keyboard ────────────────────────────────────────────────── */
  const onArrowKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  onPrev()
    if (e.key === 'ArrowRight') onNext()
  }, [onPrev, onNext])
  useModalBehavior({ onClose, onKeyExtra: onArrowKey, target: 'window' })

  const item   = images[currentIndex] ?? images[0]
  const src    = imgSrc(typeof item === 'string' ? item : item.src)
  const caption = typeof item === 'string' ? '' : (item.alt || item.label || '')
  const total  = images.length
  const multi  = total > 1

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={caption || ui.lightbox.viewerLabel}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      onClick={onClose}
    >
      {/* ── backdrop: the tint and the blur ease in together (fading a parent that holds a backdrop-filter pops) ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ ...CLEAR }}
        animate={translucent ? TRANSLUCENT : OPAQUE}
        exit={{ ...CLEAR, transition: { duration: 0.16, ease: 'easeOut' } }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* ── top bar ────────────────────────────────────────────── */}
      <motion.div {...FADE} className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-3 z-10">
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
          aria-label={ui.lightbox.close}
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>

      {/* ── prev / next arrows ─────────────────────────────────── */}
      {multi && (
        <>
          <motion.button
            {...FADE}
            onClick={e => { e.stopPropagation(); onPrev() }}
            className="absolute left-3 md:left-6 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white/55 hover:text-white border border-white/12 hover:border-white/30 hover:bg-white/8 transition-all duration-200"
            aria-label={ui.lightbox.previous}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            {...FADE}
            onClick={e => { e.stopPropagation(); onNext() }}
            className="absolute right-3 md:right-6 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white/55 hover:text-white border border-white/12 hover:border-white/30 hover:bg-white/8 transition-all duration-200"
            aria-label={ui.lightbox.next}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </>
      )}

      {/* ── image ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.figure
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-[1] flex flex-col items-center gap-3 px-16 md:px-24"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt={caption}
            className="max-h-[80vh] max-w-[80vw] md:max-w-[72vw] object-contain rounded-xl"
            style={{ boxShadow: '0 32px 96px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)' }}
            draggable={false}
          />
        </motion.figure>
      </AnimatePresence>

      {/* ── dot strip ──────────────────────────────────────────── */}
      {multi && total <= 20 && (
        <motion.div {...FADE} className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onGoTo ? onGoTo(i) : onClose() }}
              className={`rounded-full transition-all duration-200 ${i === currentIndex ? 'w-5 h-1.5 bg-white/80' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`}
              aria-label={ui.lightbox.goTo.replace('{n}', i + 1)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
