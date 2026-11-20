import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'

// Phone/tablet filter panel for a listing page (hidden from lg up, where the sidebar shows):
// slides in from the left as a modal dialog (focus trapped, Esc and the backdrop close it,
// page scroll locked). One header (title, "Clear (n)", close), the filters (children), and a
// sticky button that closes it to show the result. All text comes from the caller's YAML.
// `onClose` should be stable (useCallback): a new identity re-arms the Escape listener.
export default function FilterDrawer({ open, onClose, title, closeLabel, clearLabel, activeCount, onClear, showResultsLabel, idPrefix = 'listing', children }) {
  const drawerRef = useFocusTrap(open)
  useModalBehavior({ active: open, onClose })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key={`${idPrefix}-backdrop`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            key={`${idPrefix}-drawer`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed left-0 top-0 bottom-0 z-50 flex w-[22rem] max-w-[90vw] flex-col bg-white shadow-2xl lg:hidden"
          >
            <div className="flex items-center gap-2 border-b border-tide-border px-5 py-3.5">
              <span className="flex-1 font-display text-lg font-semibold text-tide-text">{title}</span>
              {activeCount > 0 && (
                <button type="button" onClick={onClear} className={`rounded-full px-3 py-1.5 text-xs font-body font-semibold text-primary hover:bg-primary-faint transition-colors ${FOCUS_PILL}`}>
                  {clearLabel} ({activeCount})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-tide-muted hover:bg-tide-subtle hover:text-tide-text transition-colors ${FOCUS_PILL}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
            <div className="border-t border-tide-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className={`w-full rounded-full bg-primary px-5 py-3 text-sm font-body font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors ${FOCUS_PILL}`}
              >
                {showResultsLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
