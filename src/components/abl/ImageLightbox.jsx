import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAblThumbnail } from '../../utils/ablThumbnails'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export default function ImageLightbox({ id, alt, onClose }) {
  const { t } = useTranslation()
  const src = getAblThumbnail(id, 'full')
  const containerRef = useFocusTrap(!!id)

  useEffect(() => {
    if (!id) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [id, onClose])

  return (
    <AnimatePresence>
      {id && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image preview'}
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label={t('common.closePreview', 'Close preview')}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image container */}
          <motion.div
            key="lightbox-image"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
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
                <span className="text-white/50 text-sm font-body">{t('abl.resourceCenter.noImage', 'No image available')}</span>
              </div>
            )}
            {alt && (
              <p className="text-center text-sm font-body text-white/60 max-w-lg leading-relaxed">
                {alt}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
