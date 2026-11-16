import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, BookOpen, ArrowUpDown, ArrowDownAZ, ArrowUpZA, Search } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import LibraryFilters from '../../components/library/LibraryFilters'
import LibraryCard from '../../components/library/LibraryCard'
import LibraryDropdown, { FOCUS_PILL } from '../../components/library/LibraryDropdown'
import Pagination from '../../components/abl/Pagination'
import { LIBRARY_PAGE_SIZE } from '../../config/library'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import { applyLibraryFilters, facetOptions, gradeLabel, LIBRARY_SORTS, DEFAULT_SORT } from '../../utils/libraryFilters'
import snapshot from '../../data/sheets/pramaan-library.json'
import data from '../../data/pramaan-library.json'

// Unlinked page (no menu, footer or sitemap entry; noindex): /pramaan-library.
// Data is the snapshot the sync writes from the form-format Sheet — no live request.

const DEFAULT_FILTERS = { search: '', subject: '', type: '', grades: [], owner: '', sort: DEFAULT_SORT, dir: 'asc' }

function paramsToFilters(p) {
  return {
    search: p.get('search') ?? '',
    subject: p.get('subject') ?? '',
    type: p.get('type') ?? '',
    grades: p.get('grade') ? p.get('grade').split(',').filter(Boolean) : [],
    owner: p.get('owner') ?? '',
    sort: LIBRARY_SORTS.includes(p.get('sort')) ? p.get('sort') : DEFAULT_SORT,
    dir: p.get('dir') === 'desc' ? 'desc' : 'asc',
  }
}

function filtersToSearch(f, page) {
  const p = new URLSearchParams()
  if (f.search) p.set('search', f.search)
  if (f.subject) p.set('subject', f.subject)
  if (f.type) p.set('type', f.type)
  if (f.grades.length) p.set('grade', f.grades.join(','))
  if (f.owner) p.set('owner', f.owner)
  if (f.sort && f.sort !== DEFAULT_SORT) p.set('sort', f.sort)
  if (f.dir === 'desc') p.set('dir', 'desc')
  if (page > 1) p.set('page', String(page))
  const s = p.toString()
  return s ? `?${s}` : ''
}

const resources = Array.isArray(snapshot.resources) ? snapshot.resources : []
const STICKY_TOP = 110 // px, matches top-[110px] (below the fixed header)

// Pin the sidebar only while it fits in the window; a taller sidebar (e.g. a picker list open on
// a short laptop screen) scrolls with the page instead of getting a second scrollbar.
function useSidebarFits() {
  const ref = useRef(null)
  const [sticky, setSticky] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const check = () => setSticky(el.offsetHeight + STICKY_TOP + 16 <= window.innerHeight)
    check()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
    ro?.observe(el)
    window.addEventListener('resize', check)
    return () => { ro?.disconnect(); window.removeEventListener('resize', check) }
  }, [])
  return [ref, sticky]
}

export default function PramaanLibrary() {
  const location = useLocation()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const params = new URLSearchParams(location.search)
  const [filters, setFilters] = useState(() => paramsToFilters(params))
  const [page, setPage] = useState(() => parseInt(params.get('page') ?? '1', 10) || 1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const drawerRef = useFocusTrap(drawerOpen)
  useModalBehavior({ active: drawerOpen, onClose: closeDrawer })

  // Counts follow the other active filters (see facetOptions).
  const options = useMemo(() => facetOptions(resources, filters), [filters])
  const [sidebarRef, sidebarSticky] = useSidebarFits()

  const change = useCallback((next) => {
    setFilters(next)
    setPage(1)
    navigate({ search: filtersToSearch(next, 1) }, { replace: true })
  }, [navigate])
  const clear = useCallback(() => change({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir }), [change, filters.sort, filters.dir])
  const changePage = useCallback((p) => {
    setPage(p)
    navigate({ search: filtersToSearch(filters, p) }, { replace: true })
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [navigate, filters])

  const filtered = applyLibraryFilters(resources, filters)
  const pageItems = filtered.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE)
  const activeCount = [filters.search, filters.subject, filters.type, ...filters.grades, filters.owner].filter(Boolean).length

  const labelOf = (list, value) => list.find(o => o.value === value)?.label ?? value
  const chips = [
    filters.search && { key: 'search', label: `“${filters.search}”`, next: { ...filters, search: '' } },
    filters.subject && { key: 'subject', label: labelOf(options.subjects, filters.subject), next: { ...filters, subject: '' } },
    filters.type && { key: 'type', label: labelOf(options.types, filters.type), next: { ...filters, type: '' } },
    ...filters.grades.map(g => ({ key: g, label: gradeLabel(g), next: { ...filters, grades: filters.grades.filter(x => x !== g) } })),
    filters.owner && { key: 'owner', label: labelOf(options.owners, filters.owner), next: { ...filters, owner: '' } },
  ].filter(Boolean)

  const filterProps = { options, filters, onChange: change, onClear: clear, activeCount }
  const lastUpdated = snapshot.lastUpdated
    ? new Date(snapshot.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <SeoHead title={data.meta.seoTitle} description={data.meta.seoDescription} path="/pramaan-library" noindex />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <BookOpen className="w-10 h-10 text-tide-muted/40" />
              <p className="font-display text-xl font-semibold text-tide-text">{data.meta.emptyTitle}</p>
              <p className="max-w-md text-sm font-body text-tide-muted">{data.meta.emptyHint}</p>
            </div>
          ) : (
            <div className="flex gap-7">
              <aside className="hidden lg:block w-72 flex-shrink-0">
                {/* No inner scroll box: pinned while it fits the screen, otherwise it scrolls with the page. */}
                <div ref={sidebarRef} className={sidebarSticky ? 'sticky top-[110px]' : ''}>
                  <LibraryFilters {...filterProps} />
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                {/* Toolbar: find (search) and order (sort) sit right above what they act on. Phone: search on its own row, Filters + Sort below. Tablet: one row. Laptop with sidebar (lg): search row, sort below on the right. Wide (xl): one row. */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className={`order-2 sm:order-1 lg:hidden inline-flex flex-shrink-0 items-center gap-2 px-4 py-2.5 rounded-full border border-tide-border bg-white text-sm font-body font-semibold text-tide-text hover:border-primary/40 transition-colors shadow-sm ${FOCUS_PILL}`}
                    >
                      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                      {data.page.filtersButton}
                      {activeCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
                      )}
                    </button>
                    <div className="relative order-1 min-w-0 basis-full sm:order-2 sm:basis-0 sm:flex-1 lg:basis-full xl:basis-0">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted pointer-events-none" aria-hidden="true" />
                      <input
                        type="search"
                        value={filters.search}
                        onChange={e => change({ ...filters, search: e.target.value })}
                        placeholder={data.filters.searchPlaceholder}
                        aria-label={data.filters.searchLabel}
                        className="w-full rounded-full border border-tide-border bg-white py-2.5 pl-11 pr-10 text-sm font-body text-tide-text shadow-sm placeholder:text-tide-muted transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus-visible:outline-none focus-visible:rounded-full focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:appearance-none"
                      />
                      {filters.search && (
                        <button
                          type="button"
                          onClick={() => change({ ...filters, search: '' })}
                          aria-label={data.filters.clearSearchLabel}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-tide-muted hover:bg-tide-subtle hover:text-tide-text transition-colors ${FOCUS_PILL}`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  <div className="order-3 ml-auto flex flex-shrink-0 items-center rounded-full border border-tide-border bg-white p-1 shadow-sm">
                    <LibraryDropdown
                      value={filters.sort}
                      options={LIBRARY_SORTS.map(v => ({ value: v, label: data.sort.options[v] }))}
                      onChange={sort => change({ ...filters, sort })}
                      ariaLabel={data.sort.label}
                      prefix={<><ArrowUpDown className="mr-0.5 inline h-4 w-4 align-[-3px]" aria-hidden="true" /><span className="hidden sm:inline">{data.sort.label}</span></>}
                      align="right"
                      triggerClassName="px-3 py-1.5 hover:bg-tide-subtle"
                    />
                    <span className="mx-0.5 h-5 w-px bg-tide-border" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => change({ ...filters, dir: filters.dir === 'desc' ? 'asc' : 'desc' })}
                      aria-label={data.sort.directionLabelTemplate.replace('{dir}', () => (filters.dir === 'desc' ? data.sort.descending : data.sort.ascending))}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-body font-semibold text-tide-text hover:bg-tide-subtle transition-colors ${FOCUS_PILL}`}
                    >
                      {filters.dir === 'desc' ? <ArrowUpZA className="w-4 h-4" aria-hidden="true" /> : <ArrowDownAZ className="w-4 h-4" aria-hidden="true" />}
                      <span className="hidden sm:inline">{filters.dir === 'desc' ? data.sort.descending : data.sort.ascending}</span>
                    </button>
                  </div>
                </div>
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
                  <p className="text-sm font-body text-tide-muted" aria-live="polite">
                    {`${data.page.showing} ${pageItems.length} ${data.page.of} ${filtered.length} ${filtered.length === 1 ? data.page.resourceSingular : data.page.resourcePlural}`}
                  </p>
                  {lastUpdated && (
                    <p className="text-xs font-body text-tide-muted">{data.meta.lastUpdatedTemplate.replace('{date}', () => lastUpdated)}</p>
                  )}
                </div>

                {chips.length > 0 && (
                  <ul className="mb-5 flex flex-wrap items-center gap-2">
                    {chips.map(c => (
                      <li key={c.key}>
                        <button
                          type="button"
                          onClick={() => change(c.next)}
                          aria-label={data.filters.removeTemplate.replace('{name}', () => c.label)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-light py-1 pl-3 pr-2 font-body text-xs font-semibold text-primary-dark transition-all duration-200 hover:shadow-sm"
                        >
                          {c.label}
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/5 group-hover:bg-black/15" aria-hidden="true">
                            <X className="h-3 w-3" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div ref={gridRef}>
                  {pageItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                      <BookOpen className="w-10 h-10 text-tide-muted/40" />
                      <p className="font-display text-xl font-semibold text-tide-text">{data.grid.noResults}</p>
                      <p className="text-sm font-body text-tide-muted">{data.grid.noResultsHint}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {pageItems.map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.4, 0, 0.2, 1] }}
                          className="flex"
                        >
                          <LibraryCard resource={r} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <Pagination total={filtered.length} page={page} perPage={LIBRARY_PAGE_SIZE} onChange={changePage} />
              </div>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="library-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={closeDrawer}
            />
            <motion.div
              key="library-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={data.page.filtersButton}
              className="fixed left-0 top-0 bottom-0 z-50 flex w-[22rem] max-w-[90vw] flex-col bg-white shadow-2xl lg:hidden"
            >
              {/* One header (title, Clear, close), the filters, and a sticky button that shows the result. */}
              <div className="flex items-center gap-2 border-b border-tide-border px-5 py-3.5">
                <span className="flex-1 font-display text-lg font-semibold text-tide-text">{data.page.filtersButton}</span>
                {activeCount > 0 && (
                  <button type="button" onClick={clear} className={`rounded-full px-3 py-1.5 text-xs font-body font-semibold text-primary hover:bg-primary-faint transition-colors ${FOCUS_PILL}`}>
                    {data.filters.clear} ({activeCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label={data.page.closeFiltersLabel}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-tide-muted hover:bg-tide-subtle hover:text-tide-text transition-colors ${FOCUS_PILL}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <LibraryFilters {...filterProps} variant="drawer" />
              </div>
              <div className="border-t border-tide-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className={`w-full rounded-full bg-primary px-5 py-3 text-sm font-body font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors ${FOCUS_PILL}`}
                >
                  {data.page.showResultsTemplate.replace('{n}', String(filtered.length)).replace('{resources}', () => (filtered.length === 1 ? data.page.resourceSingular : data.page.resourcePlural))}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
