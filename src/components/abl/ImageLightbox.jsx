import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { getAblThumbnail } from '../../utils/ablThumbnails'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import rcData from '../../data/abl-resource-center.json'

// A see-through, blurred backdrop, and no caption under the picture.
const CLEAR = { background: 'rgba(8,16,32,0)', backdropFilter: 'blur(0px) saturate(100%)', WebkitBackdropFilter: 'blur(0px) saturate(100%)' }
const TRANSLUCENT = { background: 'rgba(8,16,32,0.66)', backdropFilter: 'blur(18px) saturate(130%)', WebkitBackdropFilter: 'blur(18px) saturate(130%)' }

export default function ImageLightbox({ id, alt, onClose }) {
  const src = getAblThumbnail(id, 'full')
  const containerRef = useFocusTrap(!!id)
  useModalBehavior({ active: id, onClose })

  return (
    <AnimatePresence>
      {id && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt || rcData.lightbox.imagePreviewFallback}
          key="lightbox-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          onClick={onClose}
        >
          {/* Backdrop: the tint and the blur ease in together */}
          <motion.div
            className="absolute inset-0"
            initial={CLEAR}
            animate={TRANSLUCENT}
            exit={{ ...CLEAR, transition: { duration: 0.16, ease: 'easeOut' } }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Close button */}
          <motion.button {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: { duration: 0.22 } }}
            onClick={onClose}
            aria-label={rcData.lightbox.closePreview}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Image container */}
          <motion.div
            key="lightbox-image"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
            className="relative z-10 max-w-5xl w-full flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            {src ? (
              <img
                src={src}
                alt={alt ?? ''}
                className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
              />
            ) : (
              <div className="w-96 h-64 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-white/50 text-sm font-body">{rcData.lightbox.noImage}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
