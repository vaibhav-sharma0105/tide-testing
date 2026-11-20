import { useId } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'

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

// Native select with a visible label and "{name} ({n})" options (template from YAML). An option
// with 0 matches is disabled unless it is the current choice (so a choice from an old link stays
// visible and can be cleared).
export function FilterSelect({ label, value, onChange, allLabel, total, options, template, className = '' }) {
  const id = useId()
  const fmt = (name, n) => template.replace('{name}', () => name).replace('{n}', String(n))
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={FIELD_LABEL}>{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full min-h-11 cursor-pointer appearance-none truncate rounded-full border bg-white py-2.5 pl-4 pr-10 font-body text-sm shadow-sm transition-colors hover:border-primary/40 ${focusRing('focus-visible:rounded-full')} ${
            value ? 'border-primary/40 font-semibold text-primary-dark' : 'border-tide-border text-tide-text'
          }`}
        >
          <option value="">{fmt(allLabel, total)}</option>
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.count === 0 && o.value !== value}>{fmt(o.label, o.count)}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tide-muted" aria-hidden="true" />
      </div>
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
