import { Search, X } from 'lucide-react'
import { FOCUS_PILL } from '../library/LibraryDropdown'

// Rounded search box for a listing toolbar, with a clear (×) button once something is typed.
// placeholder / label / clearLabel come from the caller's YAML; className positions the wrapper.
export default function SearchField({ value, onChange, placeholder, label, clearLabel, className = '' }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-full border border-tide-border bg-white py-2.5 pl-11 pr-10 text-sm font-body text-tide-text shadow-sm placeholder:text-tide-muted transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus-visible:outline-none focus-visible:rounded-full focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-tide-muted hover:bg-tide-subtle hover:text-tide-text transition-colors ${FOCUS_PILL}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
