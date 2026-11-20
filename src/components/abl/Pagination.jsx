import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LIBRARY_PAGE_SIZE } from '../../config/library'
import data from '../../data/pramaan-library.json'

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

// `labels` (optional) replaces the Resource Centre's pagination text (pramaan-library.yaml
// `pagination`) with another page's YAML block of the same shape.
export default function Pagination({ total, page, perPage = LIBRARY_PAGE_SIZE, onChange, labels = data.pagination }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const startItem = (page - 1) * perPage + 1
  const endItem   = Math.min(page * perPage, total)
  const pages     = pageRange(page, totalPages)

  return (
    <nav className="mt-10 flex flex-col items-center gap-4" aria-label={labels.ariaLabel}>
      <p className="text-sm font-body text-tide-muted">
        {labels.showing} {startItem}–{endItem} {labels.of} {total} {labels.resources}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
        <button
          onClick={() => page > 1 && onChange(page - 1)}
          aria-disabled={page === 1}
          aria-label={labels.previousLabel}
          className={`flex items-center gap-1 px-2 sm:px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
            page === 1 ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-white hover:text-primary hover:shadow-sm'
          }`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">{labels.previousShort}</span>
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 sm:px-3 py-2 text-sm text-tide-muted select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-body font-medium transition-all ${
                p === page
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_2px_8px_rgba(30,107,170,0.32)]'
                  : 'text-tide-muted hover:bg-white hover:text-primary hover:shadow-sm'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => page < totalPages && onChange(page + 1)}
          aria-disabled={page === totalPages}
          aria-label={labels.next}
          className={`flex items-center gap-1 px-2 sm:px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
            page === totalPages ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-white hover:text-primary hover:shadow-sm'
          }`}
        >
          <span className="hidden sm:inline">{labels.next}</span> <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
