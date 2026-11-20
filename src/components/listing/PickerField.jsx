import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Check } from 'lucide-react'
import { focusRing } from '../../utils/focusRing'

// Picker field for a listing filter: one rounded field showing only the current choice; tapping
// it opens the full ordered list inline (no inner scrollbar; the page scrolls), and choosing
// closes it. Calm at rest: one line per filter until you choose.
// Keyboard: Enter/Space/↑/↓ open; ↑ ↓ Home End move; a letter jumps; Enter/Space choose;
// Esc closes. Order is the caller's (orderFilterOptions); the "All …" choice is added on top.
// Text comes from the caller's YAML: allLabel, removeTemplate ("… {name}"),
// optionCountTemplate ("{name}, {n} …").
export default function PickerField({ labelId, options, value, onSelect, allLabel, total, open, onOpenChange, removeTemplate, optionCountTemplate }) {
  const id = useId()
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const rootRef = useRef(null)
  const items = [{ value: '', label: allLabel, count: total }, ...options]
  const selectedIndex = Math.max(0, items.findIndex(o => o.value === value))
  const selected = items[selectedIndex]
  const [active, setActive] = useState(selectedIndex)
  const chosen = Boolean(value)

  useEffect(() => {
    if (!open) return undefined
    listRef.current?.focus()
    const onPointerDown = (e) => { if (!rootRef.current?.contains(e.target)) onOpenChange(false) }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onOpenChange])
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const openList = () => { setActive(selectedIndex); onOpenChange(true) }
  const close = () => { onOpenChange(false); buttonRef.current?.focus() }
  const choose = (i) => { onSelect(items[i].value); close() }
  const onTriggerKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList() }
  }
  const onListKeyDown = (e) => {
    const last = items.length - 1
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(last, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(last) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') onOpenChange(false)
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase()
      const order = [...items.keys()].map(n => (active + 1 + n) % items.length)
      const hit = order.find(n => items[n].label.toLowerCase().startsWith(k))
      if (hit !== undefined) setActive(hit)
    }
  }

  return (
    <div ref={rootRef}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-labelledby={`${labelId} ${id}-value`}
          onClick={() => (open ? onOpenChange(false) : openList())}
          onKeyDown={onTriggerKeyDown}
          className={`flex w-full min-h-11 items-center gap-2 rounded-2xl border px-3.5 text-sm font-body transition-colors duration-150 ${focusRing('focus-visible:rounded-2xl')} ${chosen ? 'pr-[4.5rem]' : 'pr-10'} ${
            chosen ? 'border-primary/30 bg-primary-faint font-semibold text-primary-dark' : 'border-tide-border bg-white text-tide-text hover:border-primary/40 hover:bg-tide-subtle'
          } ${open ? 'rounded-b-none focus-visible:rounded-b-none border-b-transparent' : ''}`}
        >
          <span id={`${id}-value`} className="flex-1 min-w-0 truncate text-left">{selected.label}</span>
          <span className={`text-xs tabular-nums ${chosen ? 'text-primary-dark/80' : 'text-tide-muted'}`}>{selected.count}</span>
          <ChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 -mt-2 h-4 w-4 text-tide-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {chosen && (
          <button
            type="button"
            onClick={() => onSelect('')}
            aria-label={removeTemplate.replace('{name}', () => selected.label)}
            className={`absolute right-9 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-primary-dark hover:bg-primary-light transition-colors ${focusRing('focus-visible:rounded-full')}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onListKeyDown}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-b-2xl border border-t-0 border-primary/30 bg-white p-1.5 outline-none"
          >
            {items.map((o, i) => {
              const isSelected = i === selectedIndex
              return (
                <li
                  key={o.value || '__all'}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={optionCountTemplate.replace('{name}', () => o.label).replace('{n}', String(o.count))}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-body transition-colors ${
                    i === active ? 'bg-primary-faint' : ''
                  } ${isSelected ? 'font-semibold text-primary-dark' : 'text-tide-text'}`}
                >
                  <span className="flex-1 min-w-0 break-words">{o.label}</span>
                  <span className="text-xs tabular-nums text-tide-muted">{o.count}</span>
                  <span className="flex w-4 justify-center" aria-hidden="true">{isSelected && <Check className="h-4 w-4 text-primary" />}</span>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
