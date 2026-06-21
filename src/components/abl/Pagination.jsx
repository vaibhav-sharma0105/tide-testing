import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ABL_PAGE_SIZE } from '../../config/abl'

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Pagination({ total, page, perPage = ABL_PAGE_SIZE, onChange }) {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const startItem = (page - 1) * perPage + 1
  const endItem   = Math.min(page * perPage, total)
  const pages     = pageRange(page, totalPages)

  return (
    <nav className="mt-10 flex flex-col items-center gap-4" aria-label="Pagination">
      <p className="text-sm font-body text-tide-muted">
        {t('abl.resourceCenter.showing', 'Showing')} {startItem}–{endItem} {t('abl.pagination.of', 'of')} {total} {t('abl.resourceCenter.resources', 'resources')}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => page > 1 && onChange(page - 1)}
          aria-disabled={page === 1}
          aria-label={t('abl.pagination.previous', 'Previous')}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
            page === 1 ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> {t('abl.pagination.previous', 'Prev')}
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-3 py-2 text-sm text-tide-muted select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-9 h-9 rounded-lg text-sm font-body font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => page < totalPages && onChange(page + 1)}
          aria-disabled={page === totalPages}
          aria-label={t('abl.pagination.next', 'Next')}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
            page === totalPages ? 'text-tide-border cursor-not-allowed' : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
          }`}
        >
          {t('abl.pagination.next', 'Next')} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
