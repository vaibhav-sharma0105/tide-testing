import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import rcData from '../../data/abl-resource-center.json'

const CLEAR = { background: 'rgba(8,16,32,0)', backdropFilter: 'blur(0px) saturate(100%)', WebkitBackdropFilter: 'blur(0px) saturate(100%)' }
const TRANSLUCENT = { background: 'rgba(8,16,32,0.66)', backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)' }
const DARK = { background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }

// translucent: a see-through, blurred backdrop and a larger player (the promo video on /pramaan)
export default function VideoLightbox({ src, title, onClose, translucent = false }) {
  const containerRef = useFocusTrap(!!src)
  useModalBehavior({ active: src, onClose })

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={title || rcData.lightbox.videoFallback}
          key="video-lightbox-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          onClick={onClose}
        >
          {/* Backdrop: the tint and the blur ease in together (fading a parent that holds a backdrop-filter pops) */}
          <motion.div
            className="absolute inset-0"
            initial={CLEAR}
            animate={translucent ? TRANSLUCENT : DARK}
            exit={{ ...CLEAR, transition: { duration: 0.16, ease: 'easeOut' } }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Close button */}
          <motion.button {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: { duration: 0.22 } }}
            onClick={onClose}
            aria-label={rcData.lightbox.closeVideo}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Video frame */}
          <motion.div
            key="video-lightbox-frame"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
            className={`relative z-10 w-full ${translucent ? 'max-w-6xl' : 'max-w-4xl'}`}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black"
              style={{ paddingBottom: '56.25%', height: 0 }}
            >
              <iframe
                src={src}
                title={title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
