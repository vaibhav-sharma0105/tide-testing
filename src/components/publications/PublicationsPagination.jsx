import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { focusRing } from '../../utils/focusRing'
import { pageWindow } from '../../utils/publicationFilters'

// Numbered pages for the Publications lists. Real links (?page=n kept with the other filters),
// so a page can be opened in a new tab, shared or bookmarked, and Back returns to the previous
// page. 44px targets; the current page is aria-current; Previous/Next are left out (not just
// disabled) at the ends. Renders nothing for a single page.
//   hrefFor(n) → the location for page n; linkState → router state on each link (the list uses
//   it to scroll to and focus its results line after the change).
//   labels: the page's YAML `pagination` block (label, previous, next, pageLabelTemplate).

const ITEM = `inline-flex h-11 min-w-11 items-center justify-center rounded-full font-body text-sm font-semibold tabular-nums transition-colors ${focusRing('focus-visible:rounded-full')}`

export default function PublicationsPagination({ page, totalPages, hrefFor, linkState, labels }) {
  if (totalPages <= 1) return null
  const pageLabel = (n) => labels.pageLabelTemplate.replace('{n}', String(n))

  return (
    <nav aria-label={labels.label} className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        {page > 1 && (
          <li>
            <Link to={hrefFor(page - 1)} state={linkState} className={`${ITEM} gap-1 px-3 text-tide-text hover:bg-primary-faint hover:text-primary-dark`}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{labels.previous}</span>
            </Link>
          </li>
        )}
        {pageWindow(page, totalPages).map((n, i) => (
          <li key={n === '…' ? `gap-${i}` : n}>
            {n === '…' ? (
              <span className="inline-flex h-11 w-6 items-center justify-center font-body text-sm text-tide-muted" aria-hidden="true">{n}</span>
            ) : n === page ? (
              <span aria-current="page" className={`${ITEM} bg-primary-dark px-3 text-white shadow-sm shadow-primary/25`}>
                <span className="sr-only">{pageLabel(n)}</span>
                <span aria-hidden="true">{n}</span>
              </span>
            ) : (
              <Link to={hrefFor(n)} state={linkState} aria-label={pageLabel(n)} className={`${ITEM} px-3 text-tide-text hover:bg-primary-faint hover:text-primary-dark`}>{n}</Link>
            )}
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link to={hrefFor(page + 1)} state={linkState} className={`${ITEM} gap-1 px-3 text-tide-text hover:bg-primary-faint hover:text-primary-dark`}>
              <span className="sr-only sm:not-sr-only">{labels.next}</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
