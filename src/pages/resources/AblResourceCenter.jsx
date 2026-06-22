import { useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import ResourceFilters from '../../components/abl/ResourceFilters'
import ResourceGrid from '../../components/abl/ResourceGrid'
import Pagination from '../../components/abl/Pagination'
import { useABLData } from '../../hooks/useABLData'
import { ABL_PAGE_SIZE } from '../../config/abl'
import { applyResourceFilters } from '../../utils/filterResources'

const DEFAULT_FILTERS = { search: '', type: '', grades: [], language: '', ownership: '' }

function paramsToFilters(params) {
  return {
    search:    params.get('search') ?? '',
    type:      params.get('type')   ?? '',
    grades:    params.get('grade')  ? params.get('grade').split(',').filter(Boolean) : [],
    language:  params.get('lang')   ?? '',
    ownership: params.get('own')    ?? '',
  }
}

function filtersToSearch(filters, page) {
  const p = new URLSearchParams()
  if (filters.search)        p.set('search', filters.search)
  if (filters.type)          p.set('type', filters.type)
  if (filters.grades.length) p.set('grade', filters.grades.join(','))
  if (filters.language)      p.set('lang', filters.language)
  if (filters.ownership)     p.set('own', filters.ownership)
  if (page > 1)              p.set('page', String(page))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export default function AblResourceCenter() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const gridRef  = useRef(null)

  const params = new URLSearchParams(location.search)
  const [filters,          setFilters]          = useState(() => paramsToFilters(params))
  const [page,             setPage]             = useState(() => parseInt(params.get('page') ?? '1', 10) || 1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { allResources, loading, error, refetch, data } = useABLData()
  const tabs = data?.tabs ?? []

  const handleFilterChange = useCallback((next) => {
    setFilters(next)
    setPage(1)
    navigate({ search: filtersToSearch(next, 1) }, { replace: true })
  }, [navigate])

  const handleClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    navigate({ search: '' }, { replace: true })
  }, [navigate])

  const handlePageChange = useCallback((p) => {
    setPage(p)
    navigate({ search: filtersToSearch(filters, p) }, { replace: true })
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [navigate, filters])

  // Active filter count for the mobile button badge
  const activeFilterCount = [
    filters.search, filters.type, ...filters.grades, filters.language, filters.ownership,
  ].filter(Boolean).length

  const filtered = applyResourceFilters(allResources, filters)

  const startIdx  = (page - 1) * ABL_PAGE_SIZE
  const pageItems = filtered.slice(startIdx, startIdx + ABL_PAGE_SIZE)

  const filterProps = {
    allResources,
    filters,
    onChange: handleFilterChange,
    onClear:  handleClear,
    tabs,
    data,
  }

  return (
    <>
      {/* Renders at the active /pramaan/resource-centre and a stranded
          duplicate /resources/abl-resources/resource-center — canonical
          always points at the active path. This page has no page-specific
          YAML/JSON file (all its copy is inline t() fallback strings), so
          the SEO title/description match that same pattern rather than
          introducing a YAML file just for this. */}
      <SeoHead
        title="Resource Centre — TIDE Foundation"
        description="Browse and download 150+ free Activity-Based Learning resources for Grades 1-5 — worksheets, games, kits, and flashcards, filterable by type, grade, and language."
        path="/pramaan/resource-centre"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Pramaan', path: '/pramaan' },
          { name: 'Resource Centre', path: '/pramaan/resource-centre' },
        ]}
      />
      <PageHero
        badge="Resources · ABL"
        title={t('abl.resourceCenter.title', 'Resource Center')}
        subtitle={t('abl.resourceCenter.subtitle', 'Browse all Activity-Based Learning resources. Filter by type, grade, language, and more.')}
        gradient
      />
      <AblNavBar />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-7">

            {/* ── Desktop sidebar ─────────────────────────────── */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div
                className="sticky top-[130px] overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 136px)' }}
              >
                <ResourceFilters {...filterProps} />
              </div>
            </aside>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Mobile: filter toggle + count */}
              <div className="flex items-center justify-between mb-5 lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tide-border bg-white text-sm font-body font-semibold text-tide-text hover:border-primary/40 transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('abl.resourceCenter.filterType', 'Filters')}
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <p className="text-sm font-body text-tide-muted">
                  {loading ? t('abl.resourceCenter.loading', 'Loading…') : `${filtered.length} ${filtered.length !== 1 ? t('abl.resourceCenter.resources', 'resources') : t('abl.resourceCenter.resources', 'resource')}`}
                </p>
              </div>

              {/* Desktop result count */}
              <p className="hidden lg:block text-sm font-body text-tide-muted mb-5">
                {loading
                  ? t('abl.resourceCenter.loading', 'Loading…')
                  : `${t('abl.resourceCenter.showing', 'Showing')} ${pageItems.length} ${t('abl.pagination.of', 'of')} ${filtered.length} ${t('abl.resourceCenter.resources', 'resources')}`
                }
              </p>

              <div ref={gridRef}>
                <ResourceGrid
                  resources={pageItems}
                  loading={loading}
                  error={error}
                  onRetry={refetch}
                  colsClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                />
              </div>

              {!loading && !error && (
                <Pagination total={filtered.length} page={page} onChange={handlePageChange} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile filter drawer ─────────────────────────────── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              key="filter-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-tide-bg z-50 overflow-y-auto lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-tide-border bg-white">
                <span className="font-display font-semibold text-tide-text">{t('abl.resourceCenter.filterType', 'Filters')}</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-tide-muted hover:bg-tide-subtle hover:text-tide-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <ResourceFilters {...filterProps} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  )
}
