import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarArrowDown, CalendarArrowUp, Check, ChevronDown, FileText, Search, X } from 'lucide-react'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'
import { orderFilterOptions } from '../../utils/listingFilters'
import { DEFAULT_DIR } from '../../utils/publicationFilters'

// Controls shared by both Publications pages. Every control has a visible label (never a
// placeholder alone); 44px targets; all text is passed in from the page's YAML.

const FIELD_LABEL = 'mb-1.5 block font-body text-xs font-semibold text-tide-text'

// Search box: visible label, clear (×) button, and the shortcut key shown on wide screens
// (announced through aria-keyshortcuts). labels: { label, placeholder, clearLabel, shortcutKey }.
export function SearchBox({ value, onChange, inputRef, labels, className = '' }) {
  const id = useId()
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={FIELD_LABEL}>{labels.label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tide-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={labels.placeholder}
          aria-keyshortcuts={labels.shortcutKey || undefined}
          autoComplete="off"
          className="w-full min-h-11 rounded-full border border-tide-border bg-white py-2.5 pl-11 pr-12 font-body text-sm text-tide-text shadow-sm transition-colors placeholder:text-tide-muted hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => { onChange(''); inputRef?.current?.focus() }}
            aria-label={labels.clearLabel}
            className={`absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-tide-muted transition-colors hover:text-tide-text ${FOCUS_PILL}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : labels.shortcutKey && (
          <kbd aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-md border border-tide-border bg-tide-bg px-1.5 font-body text-xs text-tide-muted md:flex">
            {labels.shortcutKey}
          </kbd>
        )}
      </div>
    </div>
  )
}

// Filter menu: a visible label above a pill button; the list opens below it. Each option shows
// its name on the LEFT and its count in a pill pinned to the RIGHT (same width, number centred,
// tabular figures), so names
// and numbers each read as one straight line. The list has two parts: the "all" row, then —
// under the filter's own name as a small heading — the options, with a hairline between rows;
// the chosen one is ticked. An option with 0 matches is greyed and can't be chosen, unless it is
// the current choice (a choice from an old link stays visible and can be cleared). Listbox
// pattern (as LibraryDropdown): the button opens it with Enter/Space/arrows; ↑ ↓ Home End move
// (skipping greyed rows), Enter/Space choose, Esc closes and returns focus.
// All text from the page's YAML; counts from the data.
//   options: [{ value, label, count }] · align: 'left' | 'right' (which edge the list hangs from)
export function FilterMenu({ label, value, onChange, allLabel, total, options, align = 'left', className = '' }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const rows = [{ value: '', label: allLabel, count: total }, ...options]
  const selectedIndex = Math.max(0, rows.findIndex(o => o.value === value))
  const selected = rows[selectedIndex]
  const enabled = (i) => Boolean(rows[i]) && (i === 0 || rows[i].count > 0 || rows[i].value === value)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    listRef.current?.focus()
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])
  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active, id])

  const openList = () => { setActive(selectedIndex); setOpen(true) }
  const close = () => { setOpen(false); buttonRef.current?.focus() }
  const choose = (i) => { if (!enabled(i)) return; onChange(rows[i].value); close() }
  const step = (from, dir) => {
    for (let i = from + dir; i >= 0 && i < rows.length; i += dir) if (enabled(i)) return i
    return from
  }
  const onTriggerKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList() }
  }
  const onListKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => step(i, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => step(i, -1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(step(rows.length, -1)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') setOpen(false)
  }

  const option = (o, i) => {
    const isSelected = i === selectedIndex
    const isEnabled = enabled(i)
    return (
      <li
        key={o.value || '__all'}
        id={`${id}-opt-${i}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={isEnabled ? undefined : true}
        onPointerEnter={() => isEnabled && setActive(i)}
        onClick={() => choose(i)}
        className={`grid grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-xl px-3 py-2.5 font-body text-sm leading-snug transition-colors ${
          isEnabled ? 'cursor-pointer' : 'cursor-not-allowed text-tide-muted/70'
        } ${i === active && isEnabled ? 'bg-primary-faint' : ''} ${isSelected ? 'font-semibold text-primary-dark' : isEnabled ? 'text-tide-text' : ''}`}
      >
        <span className="flex h-5 items-center">{isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}</span>
        <span className="min-w-0 break-words text-left">{o.label}</span>
        <span className={`min-w-[2.5rem] justify-self-end rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${
          isSelected ? 'bg-primary text-white' : isEnabled ? 'bg-tide-subtle text-tide-text/80' : ''
        }`}>
          {o.count}
        </span>
      </li>
    )
  }

  return (
    <div
      ref={rootRef}
      // Close when focus leaves the menu by any route (Tab, the "/" search shortcut, a script…),
      // not only by Tab or a click outside.
      onBlur={(e) => { if (open && !rootRef.current?.contains(e.relatedTarget)) setOpen(false) }}
      className={`relative min-w-0 ${className}`}
    >
      <span id={`${id}-label`} className={FIELD_LABEL}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full min-h-11 items-center gap-2 rounded-full border bg-white py-2 pl-4 pr-3 text-left font-body text-sm shadow-sm transition-colors hover:border-primary/40 ${FOCUS_PILL} ${
          open ? 'border-primary ring-2 ring-primary/20' : value ? 'border-primary/40' : 'border-tide-border'
        } ${value ? 'text-primary-dark' : 'text-tide-text'}`}
      >
        <span id={`${id}-value`} className={`min-w-0 flex-1 truncate ${value ? 'font-semibold' : ''}`}>{selected.label}</span>
        <span aria-hidden="true" className={`min-w-[2.5rem] flex-shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${value ? 'bg-primary-faint text-primary-dark' : 'bg-tide-subtle text-tide-muted'}`}>
          {selected.count}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-tide-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top rounded-2xl border border-tide-border bg-white shadow-xl shadow-tide-text/10 ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            <ul
              ref={listRef}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={`${id}-label`}
              aria-activedescendant={`${id}-opt-${active}`}
              onKeyDown={onListKeyDown}
              className="max-h-[min(32rem,70vh)] overflow-y-auto overscroll-contain p-1.5 outline-none"
            >
              {option(rows[0], 0)}
              <li role="presentation" aria-hidden="true" className="mx-3 mb-1 mt-1.5 border-t border-tide-border pt-3 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-tide-muted">
                {label}
              </li>
              {rows.slice(1).map((o, k) => (
                <Fragment key={o.value}>
                  {k > 0 && <li role="presentation" aria-hidden="true" className="mx-3 border-t border-tide-border/60" />}
                  {option(o, k + 1)}
                </Fragment>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Active filters as removable chips (a compact pill inside a 44px-tall hit area), then
// "Clear all". chips: [{ key, label, onRemove }].
export function ActiveFilters({ chips, removeTemplate, clearAllLabel, onClearAll, className = '' }) {
  if (!chips.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-x-2 ${className}`}>
      <ul className="flex flex-wrap items-center gap-x-2">
        {chips.map(c => (
          <li key={c.key} className="min-w-0 max-w-full">
            <button
              type="button"
              onClick={c.onRemove}
              aria-label={removeTemplate.replace('{name}', () => c.label)}
              className={`group inline-flex min-h-11 max-w-full items-center rounded-full ${focusRing('focus-visible:rounded-full')}`}
            >
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary-light py-1.5 pl-3 pr-2 font-body text-xs font-semibold text-primary-dark transition-shadow group-hover:shadow-sm">
                <span className="min-w-0 truncate">{c.label}</span>
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-black/5 group-hover:bg-black/15" aria-hidden="true">
                  <X className="h-3 w-3" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className={`min-h-11 rounded-full px-2 font-body text-sm font-semibold text-primary hover:text-primary-dark ${FOCUS_PILL}`}
      >
        {clearAllLabel}
      </button>
    </div>
  )
}

// The whole search + filter bar, shared by both pages (state from usePublicationQuery as `q`):
// a full-width search box, then one FilterMenu per entry in `filters` ('type' | 'field' |
// 'year', in that order), then the active-filter chips. t = the page's YAML `toolbar`.
const GRID = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,11rem)]',
}
export function PublicationToolbar({ q, t, filters = ['type', 'field', 'year'], className = '' }) {
  const { params, set, clearAll, input, setInput, inputRef, options, chips } = q
  const menus = {
    type: { label: t.typeLabel, allLabel: t.allTypes, total: options.totals.type, options: orderFilterOptions(options.types) },
    field: { label: t.fieldLabel, allLabel: t.allFields, total: options.totals.field, options: orderFilterOptions(options.fields) },
    year: { label: t.yearLabel, allLabel: t.allYears, total: options.totals.year, options: options.years },
  }
  const shown = filters.filter(k => menus[k])
  const searchLabels = { label: t.searchLabel, placeholder: t.searchPlaceholder, clearLabel: t.clearSearchLabel, shortcutKey: t.searchShortcutKey }
  return (
    <div className={className}>
      <div className={`grid gap-x-3 gap-y-4 ${GRID[shown.length] ?? 'grid-cols-1'}`}>
        <SearchBox value={input} onChange={setInput} inputRef={inputRef} labels={searchLabels} className={shown.length === 3 ? 'col-span-2 sm:col-span-3' : shown.length === 2 ? 'col-span-2' : ''} />
        {shown.map((key, i) => (
          <FilterMenu
            key={key}
            {...menus[key]}
            value={params[key]}
            onChange={value => set({ [key]: value })}
            align={i === shown.length - 1 && i > 0 ? 'right' : 'left'}
            // Three menus on a phone: Type | Year on one row, the (long) Field list under them.
            className={shown.length === 3 && key === 'field' ? 'order-last col-span-2 sm:order-none sm:col-span-1' : ''}
          />
        ))}
      </div>
      <ActiveFilters chips={chips} removeTemplate={t.removeTemplate} clearAllLabel={t.clearAll} onClearAll={clearAll} className="mt-3" />
    </div>
  )
}

// The line above a result list: "{n} publications" / "Showing {from}–{to} of {total} …"
// (announced, receives focus after a page change) and the newest/oldest switch.
// pg = paginate(...) result; t = YAML `toolbar`, r = YAML `results`.
export function ResultsBar({ q, pg, t, r, className = '' }) {
  const { params, change, filtered, resultsRef } = q
  const newest = params.dir !== 'asc'
  const noun = filtered.length === 1 ? r.publicationSingular : r.publicationPlural
  const text = (pg.totalPages > 1 ? r.rangeTemplate : r.countTemplate)
    .replace('{from}', String(pg.from))
    .replace('{to}', String(pg.to))
    .replace('{total}', String(filtered.length))
    .replace('{publications}', () => noun)
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-tide-border pb-3 ${className}`}>
      <p ref={resultsRef} tabIndex={-1} className="rounded-sm font-body text-sm text-tide-muted outline-none" aria-live="polite">{text}</p>
      <button
        type="button"
        onClick={() => change({ ...params, dir: newest ? 'asc' : DEFAULT_DIR, page: 1 })}
        aria-label={t.directionLabelTemplate.replace('{dir}', () => (newest ? t.newest : t.oldest))}
        className={`-mr-2 inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-full px-2 font-body text-sm font-semibold text-tide-text hover:text-primary-dark ${FOCUS_PILL}`}
      >
        {newest ? <CalendarArrowDown className="h-4 w-4" aria-hidden="true" /> : <CalendarArrowUp className="h-4 w-4" aria-hidden="true" />}
        {newest ? t.newest : t.oldest}
      </button>
    </div>
  )
}

// Shown when nothing matches. r = YAML `results`.
export function NoResults({ r }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <FileText className="h-10 w-10 text-tide-muted/50" aria-hidden="true" />
      <p className="font-display text-xl font-semibold text-tide-text">{r.noResults}</p>
      <p className="font-body text-sm text-tide-muted">{r.noResultsHint}</p>
    </div>
  )
}
