import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

// Rounded, styled replacement for <select> (the browser's own option list cannot be styled and
// looks square and out of place). Accessible listbox pattern: the trigger opens it with
// Enter/Space/arrows; inside, ↑ ↓ Home End move, Enter/Space choose, Esc closes and returns focus.
//
// Focus note: the site-wide :focus-visible rule in src/index.css sets border-radius: 4px and
// comes after Tailwind's utilities, so a plain `rounded-full` loses on focus. The
// `focus-visible:rounded-full` class (higher specificity) keeps the pill shape.
export const FOCUS_PILL = 'focus:outline-none focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

export default function LibraryDropdown({ value, options, onChange, ariaLabel, prefix, align = 'left', triggerClassName = '' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const id = useId()
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    listRef.current?.focus()
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const openList = () => { setActive(selectedIndex); setOpen(true) }
  const close = () => { setOpen(false); buttonRef.current?.focus() }
  const choose = (i) => { onChange(options[i].value); close() }

  const onTriggerKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList() }
  }
  const onListKeyDown = (e) => {
    const last = options.length - 1
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(last, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(last) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${selected?.label ?? ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center gap-1.5 rounded-full text-sm font-body transition-colors ${FOCUS_PILL} ${triggerClassName}`}
      >
        {prefix && <span className="text-tide-muted">{prefix}</span>}
        <span className="font-semibold text-tide-text">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 text-tide-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKeyDown}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute z-30 mt-2 min-w-[13rem] origin-top rounded-2xl border border-tide-border bg-white p-1.5 shadow-xl shadow-tide-text/10 outline-none ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {options.map((o, i) => {
              const isSelected = i === selectedIndex
              return (
                <li
                  key={o.value}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-body transition-colors ${
                    i === active ? 'bg-primary-faint' : ''
                  } ${isSelected ? 'font-semibold text-primary-dark' : 'text-tide-text'}`}
                >
                  <span className="flex-1 whitespace-nowrap">{o.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
