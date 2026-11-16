import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { TypeIcon } from '../abl/typeIcons'
import { libraryTypeColors, libraryTypeKey } from '../../config/library'
import { LIBRARY_GRADES, gradeLabel, orderFilterOptions, OWNER_PINNED } from '../../utils/libraryFilters'
import data from '../../data/pramaan-library.json'

const f = data.filters
// Keyboard focus keeps each control's own shape (see FOCUS_PILL in LibraryDropdown.jsx).
const focusRing = (radius) => `focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${radius}`

function FilterSection({ title, children, open, onToggle, labelId }) {
  if (labelId) {
    return (
      <div className="border-b border-tide-border last:border-b-0">
        <h3 id={labelId} className="px-5 pt-3.5 pb-2 text-[11px] font-body font-bold uppercase tracking-widest text-tide-muted">{title}</h3>
        <div className="px-3 pb-4">{children}</div>
      </div>
    )
  }
  return (
    <div className="border-b border-tide-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-body font-bold uppercase tracking-widest text-tide-muted hover:text-tide-text transition-colors duration-150 ${focusRing('focus-visible:rounded-xl')}`}
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Picker field (Subject, Ownership): one rounded field showing only the current choice; tapping
// it opens the full ordered list inline (no inner scrollbar; the page scrolls), and choosing
// closes it. Calm at rest: one line per filter until you choose.
// Keyboard: Enter/Space/↑/↓ open; ↑ ↓ Home End move; a letter jumps; Enter/Space choose;
// Esc closes. Order: "All …", pinned values, A→Z, "Other" last (orderFilterOptions).
function PickerField({ labelId, options, value, onSelect, allLabel, total, open, onOpenChange }) {
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
            aria-label={f.removeTemplate.replace('{name}', () => selected.label)}
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
                  aria-label={f.optionCountTemplate.replace('{name}', () => o.label).replace('{n}', String(o.count))}
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

const pill = (active) => `px-3.5 py-1.5 rounded-full text-xs font-body font-semibold border transition-all duration-150 ${focusRing('focus-visible:rounded-full')} ${
  active ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' : 'bg-primary-faint text-primary-dark border-primary/20 hover:border-primary/50 hover:bg-primary-light'
}`

// Sidebar filters, broadest first: who made it (ownership), what it is (type of material), then
// subject and grade. Search and sorting live in the toolbar above the cards. Language is
// deliberately not a filter (stakeholder decision).
// variant 'card' (desktop sidebar: own card + heading) or 'drawer' (phone panel: the drawer
// already has the heading, Clear and close, so the filters sit flat inside it).
export default function LibraryFilters({ options, filters, onChange, onClear, activeCount, variant = 'card' }) {
  const [open, setOpen] = useState({ type: true, grades: true })
  const [picker, setPicker] = useState(null) // which picker is open: 'owner' | 'subject' | null
  const ownerLabelId = useId()
  const subjectLabelId = useId()
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className={variant === 'drawer' ? 'bg-white' : 'bg-white rounded-3xl border border-tide-border shadow-card overflow-hidden'}>
      {variant !== 'drawer' && (
      <div className="flex items-center justify-between px-5 py-3 border-b border-tide-border">
        <span className="relative font-display text-base font-semibold text-tide-text after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-6 after:bg-accent">{f.heading}</span>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className={`flex items-center gap-1.5 text-xs font-body text-tide-muted hover:text-primary transition-colors duration-150 ${focusRing('focus-visible:rounded-md')}`}>
            <X className="w-3 h-3" aria-hidden="true" />
            {f.clear} ({activeCount})
          </button>
        )}
      </div>
      )}

      {options.owners.length > 0 && (
        <FilterSection title={f.ownershipTitle} labelId={ownerLabelId}>
          <PickerField
            labelId={ownerLabelId}
            options={orderFilterOptions(options.owners, OWNER_PINNED)}
            value={filters.owner}
            onSelect={owner => set({ owner })}
            allLabel={f.allOwners}
            total={options.totals.owner}
            open={picker === 'owner'}
            onOpenChange={o => setPicker(o ? 'owner' : null)}
          />
        </FilterSection>
      )}

      {options.types.length > 0 && (
        <FilterSection title={f.typeTitle} open={open.type} onToggle={() => toggle('type')}>
          <div className="space-y-2 px-1">
            <button
              type="button"
              onClick={() => set({ type: '' })}
              aria-pressed={!filters.type}
              className={`flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 font-body text-sm font-semibold transition-all duration-200 ${focusRing('focus-visible:rounded-2xl')} ${
                !filters.type ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25' : 'border-tide-border bg-white text-tide-muted hover:border-primary/40 hover:text-primary'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1 text-left">{f.allTypes}</span>
              <span className={`text-xs font-medium tabular-nums ${!filters.type ? 'text-white/80' : 'text-tide-muted'}`}>{options.totals.type}</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {options.types.map(o => {
                const colors = libraryTypeColors(o.label)
                const active = filters.type === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set({ type: active ? '' : o.value })}
                    aria-pressed={active}
                    className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left font-body transition-all duration-200 ${focusRing('focus-visible:rounded-2xl')} ${
                      active ? `${colors.selectedTile} -translate-y-0.5` : `${colors.tint} hover:-translate-y-0.5 hover:shadow-card`
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-white/80'}`}>
                      <TypeIcon type={libraryTypeKey(o.label)} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight break-words">{o.label}</span>
                      <span className={`block text-xs font-medium tabular-nums ${active ? 'text-white/85' : 'opacity-70'}`}>{o.count}</span>
                    </span>
                    {active && (
                      <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/25" aria-hidden="true">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </FilterSection>
      )}

      {options.subjects.length > 0 && (
        <FilterSection title={f.subjectTitle} labelId={subjectLabelId}>
          <PickerField
            labelId={subjectLabelId}
            options={orderFilterOptions(options.subjects)}
            value={filters.subject}
            onSelect={subject => set({ subject })}
            allLabel={f.allSubjects}
            total={options.totals.subject}
            open={picker === 'subject'}
            onOpenChange={o => setPicker(o ? 'subject' : null)}
          />
        </FilterSection>
      )}

      <FilterSection title={f.gradesTitle} open={open.grades} onToggle={() => toggle('grades')}>
        <div className="flex flex-wrap gap-2 px-1">
          {LIBRARY_GRADES.map(g => {
            const active = filters.grades.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => set({ grades: active ? filters.grades.filter(x => x !== g) : [...filters.grades, g] })}
                aria-pressed={active}
                className={pill(active)}
              >
                {gradeLabel(g)}
              </button>
            )
          })}
        </div>
      </FilterSection>
    </div>
  )
}
