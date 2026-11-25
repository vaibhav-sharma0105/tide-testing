import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LIBRARY_PAGE_SIZE } from '../../config/library'
import data from '../../data/pramaan-library.json'

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

// A button, or (with hrefFor and a target page) a link that behaves like the button on a plain
// click. Module level, so its elements keep their identity (and focus) across renders.
function Control({ hrefFor, to, onActivate, ...rest }) {
  if (!hrefFor || to === null) return <button type="button" onClick={onActivate} {...rest} />
  const onClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // new tab / window
    e.preventDefault()
    onActivate()
  }
  return <Link to={hrefFor(to)} onClick={onClick} {...rest} />
}

// `labels` (optional) replaces the Resource Centre's pagination text (pramaan-library.yaml
// `pagination`) with another page's YAML block of the same shape.
// `hrefFor(n)` (optional) → the router location of page n: the page numbers and Previous / Next
// are then real links (?page=n), so crawlers can reach every page and a page opens in a new tab
// with Ctrl/⌘-click; a plain click still calls onChange (no new history entry, focus stays put).
export default function Pagination({ total, page, perPage = LIBRARY_PAGE_SIZE, onChange, labels = data.pagination, hrefFor }) {
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
      <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-2.5">
        <Control
          hrefFor={hrefFor}
          to={page > 1 ? page - 1 : null}
          onActivate={() => page > 1 && onChange(page - 1)}
          aria-disabled={page === 1 || undefined}
          aria-label={labels.previousLabel}
          className={`sm:hit-44 relative flex items-center gap-1 px-2 sm:px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
            page === 1 ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-white hover:text-primary-dark hover:shadow-sm'
          }`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">{labels.previousShort}</span>
        </Control>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 sm:px-3 py-2 text-sm text-tide-muted select-none">…</span>
          ) : (
            <Control
              hrefFor={hrefFor}
              key={p}
              to={p}
              onActivate={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`sm:hit-44 relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-body font-medium transition-all ${
                p === page
                  ? 'bg-primary-dark text-white shadow-[0_2px_8px_rgba(30,107,170,0.32)]'
                  : 'text-tide-muted hover:bg-white hover:text-primary-dark hover:shadow-sm'
              }`}
            >
              {p}
            </Control>
          )
        )}

        <Control
          hrefFor={hrefFor}
          to={page < totalPages ? page + 1 : null}
          onActivate={() => page < totalPages && onChange(page + 1)}
          aria-disabled={page === totalPages || undefined}
          aria-label={labels.next}
          className={`sm:hit-44 relative flex items-center gap-1 px-2 sm:px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
            page === totalPages ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-white hover:text-primary-dark hover:shadow-sm'
          }`}
        >
          <span className="hidden sm:inline">{labels.next}</span> <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Control>
      </div>
    </nav>
  )
}
