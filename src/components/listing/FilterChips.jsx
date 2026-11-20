import { X } from 'lucide-react'

// The active filters as removable chips above the results. chips: [{ key, label, onRemove }];
// removeTemplate ("Remove filter: {name}") comes from the caller's YAML.
export default function FilterChips({ chips, removeTemplate }) {
  if (!chips.length) return null
  return (
    <ul className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map(c => (
        <li key={c.key} className="min-w-0 max-w-full">
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={removeTemplate.replace('{name}', () => c.label)}
            className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary-light py-1 pl-3 pr-2 font-body text-xs font-semibold text-primary-dark transition-all duration-200 hover:shadow-sm"
          >
            <span className="min-w-0 truncate">{c.label}</span>
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-black/5 group-hover:bg-black/15" aria-hidden="true">
              <X className="h-3 w-3" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
