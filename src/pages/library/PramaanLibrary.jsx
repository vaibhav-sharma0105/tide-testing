import { useState, useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, BookOpen, ArrowUpDown, ArrowDownAZ, ArrowUpZA } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import LibraryFilters from '../../components/library/LibraryFilters'
import LibraryCard from '../../components/library/LibraryCard'
import LibraryDropdown, { FOCUS_PILL } from '../../components/library/LibraryDropdown'
import Pagination from '../../components/abl/Pagination'
import SearchField from '../../components/listing/SearchField'
import FilterChips from '../../components/listing/FilterChips'
import FilterDrawer from '../../components/listing/FilterDrawer'
import { LIBRARY_PAGE_SIZE } from '../../config/library'
import { useSidebarFits } from '../../hooks/useSidebarFits'
import { paginate } from '../../utils/publicationFilters'
import { applyLibraryFilters, facetOptions, gradeLabel, typeParamKey, LIBRARY_SORTS, DEFAULT_SORT } from '../../utils/libraryFilters'
import snapshot from '../../data/sheets/pramaan-library.json'
import data from '../../data/pramaan-library.json'
import site from '../../data/site.json'

// The Pramaan Resource Centre: /pramaan/resource-centre (the old /pramaan-library address redirects here).
// Data is the snapshot the sync writes from the form-format Sheet — no live request.

const DEFAULT_FILTERS = { search: '', subject: '', type: '', grades: [], owner: '', sort: DEFAULT_SORT, dir: 'asc' }

const resources = Array.isArray(snapshot.resources) ? snapshot.resources : []

function paramsToFilters(p) {
  return {
    search: p.get('search') ?? '',
    subject: p.get('subject') ?? '',
    type: typeParamKey(p.get('type'), resources),
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

// Router state on the navigations this page makes itself (see seenKey below).
const OWN = 'resourceCentreOwn'
const OWN_STATE = { [OWN]: true }

const STICKY_TOP = 130 // px, matches top-[130px] (below the fixed header and the Pramaan tab bar)

export default function PramaanLibrary() {
  const location = useLocation()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const params = new URLSearchParams(location.search)
  const [filters, setFilters] = useState(() => paramsToFilters(params))
  const [page, setPage] = useState(() => parseInt(params.get('page') ?? '1', 10) || 1)
  // The address is the source of truth. This page writes it itself (marked OWN, replace) and keeps
  // its own state meanwhile; any other navigation to this page — the header or tab-bar link without
  // a query, Back/Forward — re-reads filters and page from it (React's "adjust state while
  // rendering" pattern). Without this, the menu link cleared the address but left the old filters.
  const [seenKey, setSeenKey] = useState(location.key)
  if (location.key !== seenKey) {
    setSeenKey(location.key)
    if (!location.state?.[OWN]) {
      setFilters(paramsToFilters(params))
      setPage(parseInt(params.get('page') ?? '1', 10) || 1)
    }
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Counts follow the other active filters (see facetOptions).
  const options = useMemo(() => facetOptions(resources, filters), [filters])
  const [sidebarRef, sidebarSticky] = useSidebarFits(STICKY_TOP)

  const change = useCallback((next) => {
    setFilters(next)
    setPage(1)
    navigate({ search: filtersToSearch(next, 1) }, { replace: true, state: OWN_STATE })
  }, [navigate])
  const clear = useCallback(() => change({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir }), [change, filters.sort, filters.dir])
  const changePage = useCallback((p) => {
    setPage(p)
    navigate({ search: filtersToSearch(filters, p) }, { replace: true, state: OWN_STATE })
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [navigate, filters])

  const filtered = applyLibraryFilters(resources, filters)
  // Clamped to 1…last page: ?page=99 shows the last page, ?page=-2 the first (was: an empty list,
  // or rows from the end of the list for a negative number).
  const { page: currentPage, items: pageItems } = paginate(filtered, page, LIBRARY_PAGE_SIZE)
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
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/pramaan/resource-centre"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.pramaan, path: '/pramaan' },
          { name: data.meta.breadcrumbName, path: '/pramaan/resource-centre' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle} />
      <AblNavBar />

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
              {/* A labelled section, not an <aside>: a complementary landmark must not sit inside <main>.
                  Outline: h1 page > h2 Filters (hidden) > h3 filter groups; each resource card is an h2. */}
              <section aria-labelledby="library-filters-heading" className="hidden lg:block w-72 flex-shrink-0">
                <h2 id="library-filters-heading" className="sr-only">{data.page.filtersButton}</h2>
                {/* No inner scroll box: pinned while it fits the screen, otherwise it scrolls with the page. */}
                <div ref={sidebarRef} className={sidebarSticky ? 'sticky top-[130px]' : ''}>
                  <LibraryFilters {...filterProps} />
                </div>
              </section>

              <div className="flex-1 min-w-0">
                {/* Toolbar: find (search) and order (sort) sit right above what they act on. Phone: search on its own row, Filters + Sort below. Tablet: one row. Laptop with sidebar (lg): search row, sort below on the right. Wide (xl): one row. */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={drawerOpen}
                      className={`order-2 sm:order-1 lg:hidden inline-flex min-h-11 flex-shrink-0 items-center gap-2 px-4 py-2.5 rounded-full border border-tide-border bg-white text-sm font-body font-semibold text-tide-text hover:border-primary/40 transition-colors shadow-sm ${FOCUS_PILL}`}
                    >
                      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                      {data.page.filtersButton}
                      {activeCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
                      )}
                    </button>
                    <SearchField
                      value={filters.search}
                      onChange={search => change({ ...filters, search })}
                      placeholder={data.filters.searchPlaceholder}
                      label={data.filters.searchLabel}
                      clearLabel={data.filters.clearSearchLabel}
                      className="order-1 basis-full sm:order-2 sm:basis-0 sm:flex-1 lg:basis-full xl:basis-0"
                    />
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
                      className={`hit-44 relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-body font-semibold text-tide-text hover:bg-tide-subtle transition-colors ${FOCUS_PILL}`}
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

                <FilterChips chips={chips.map(c => ({ key: c.key, label: c.label, onRemove: () => change(c.next) }))} removeTemplate={data.filters.removeTemplate} />

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

                <Pagination total={filtered.length} page={currentPage} perPage={LIBRARY_PAGE_SIZE} onChange={changePage} hrefFor={p => ({ search: filtersToSearch(filters, p) })} />
              </div>
            </div>
          )}
        </div>
      </section>

      <FilterDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={data.page.filtersButton}
        closeLabel={data.page.closeFiltersLabel}
        clearLabel={data.filters.clear}
        activeCount={activeCount}
        onClear={clear}
        showResultsLabel={data.page.showResultsTemplate.replace('{n}', String(filtered.length)).replace('{resources}', () => (filtered.length === 1 ? data.page.resourceSingular : data.page.resourcePlural))}
        idPrefix="library"
      >
        <LibraryFilters {...filterProps} variant="drawer" />
      </FilterDrawer>
    </>
  )
}
