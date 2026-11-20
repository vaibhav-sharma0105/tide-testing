import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarArrowDown, CalendarArrowUp, FileText } from 'lucide-react'
import ResearchEntry from './ResearchEntry'
import PublicationsPagination from './PublicationsPagination'
import { SearchBox, FilterSelect, ActiveFilters } from './PublicationControls'
import { useDebouncedSearch, useFocusShortcut, focusResults } from '../../hooks/usePublicationControls'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { THRIVE_PAGE_SIZE } from '../../config/publications'
import { orderFilterOptions } from '../../utils/listingFilters'
import {
  applyPublicationFilters, facetPublicationOptions, groupByYear, paginate,
  parsePublicationParams, publicationParamsToSearch, searchTerms, DEFAULT_DIR,
} from '../../utils/publicationFilters'

// /thrive/publications body — a text-heavy research archive (long citations and descriptions),
// so one reading column (list, not grid), grouped under year headings.
// Toolbar: search + Type + Field + Year, each with a visible label; options show faceted counts,
// values with 0 matches are disabled (a chosen one stays visible so it can be seen and
// cleared). Active filters as removable chips + "Clear all".
// Numbered pages (THRIVE_PAGE_SIZE per page) rather than "Show more": researchers look for a
// specific item and cite/share it, so a position must survive in the address (?page=). A year
// that runs over two pages repeats its heading with "(continued)". Changing page (or choosing a
// year in the banner chart) scrolls to and focuses the results line. Everything (search, type,
// field, year, dir, page) lives in the URL query string and is read back robustly
// (parsePublicationParams; the page is clamped to the last one).
// Rows from the snapshot; labels from thrive-publications.yaml.

export default function ResearchArchive({ rows, data }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => parsePublicationParams(location.search), [location.search])
  const t = data.toolbar
  const r = data.results

  const change = useCallback((next) => {
    navigate({ search: publicationParamsToSearch(next) }, { replace: true })
  }, [navigate])
  const set = (patch) => change({ ...params, ...patch, page: 1 })
  const clearAll = () => change({ search: '', type: '', field: '', year: '', dir: params.dir, page: 1 })

  // The search box updates at once; the URL (and so the results) after a short pause.
  const commitSearch = useCallback((search) => {
    change({ ...parsePublicationParams(window.location.search), search, page: 1 })
  }, [change])
  const [input, setInput] = useDebouncedSearch(params.search, commitSearch)
  const inputRef = useRef(null)
  useFocusShortcut(t.searchShortcutKey, inputRef)

  const options = useMemo(() => facetPublicationOptions(rows, params, r.undatedHeading), [rows, params, r.undatedHeading])
  const filtered = useMemo(() => applyPublicationFilters(rows, params), [rows, params])
  const pg = paginate(filtered, params.page, THRIVE_PAGE_SIZE)
  const groups = groupByYear(pg.items, filtered[pg.start - 1] ?? null)
  const terms = useMemo(() => searchTerms(params.search), [params.search])
  const newest = params.dir !== 'asc'
  const noun = (n) => (n === 1 ? r.publicationSingular : r.publicationPlural)
  const countText = (pg.totalPages > 1 ? r.rangeTemplate : r.countTemplate)
    .replace('{from}', String(pg.from))
    .replace('{to}', String(pg.to))
    .replace('{total}', String(filtered.length))
    .replace('{publications}', () => noun(filtered.length))

  // After a page change or a chart click (router state focusResults): bring the results into
  // view and move focus to the results line, so keyboard/screen-reader users start there.
  const resultsRef = useRef(null)
  const handledKey = useRef(location.key)
  useEffect(() => {
    if (handledKey.current === location.key) return
    handledKey.current = location.key
    if (location.state?.focusResults) focusResults(resultsRef.current)
  }, [location.key, location.state])

  const labelOf = (list, value) => list.find(o => o.value === value)?.label ?? value
  const chips = [
    params.search && { key: 'search', label: `“${params.search}”`, onRemove: () => set({ search: '' }) },
    params.type && { key: 'type', label: labelOf(options.types, params.type), onRemove: () => set({ type: '' }) },
    params.field && { key: 'field', label: labelOf(options.fields, params.field), onRemove: () => set({ field: '' }) },
    params.year && { key: 'year', label: labelOf(options.years, params.year), onRemove: () => set({ year: '' }) },
  ].filter(Boolean)

  const searchLabels = { label: t.searchLabel, placeholder: t.searchPlaceholder, clearLabel: t.clearSearchLabel, shortcutKey: t.searchShortcutKey }

  return (
    <section className="bg-tide-bg px-4 pt-10 pb-20 md:px-8 md:pt-14 md:pb-28">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,9rem)]">
          <SearchBox value={input} onChange={setInput} inputRef={inputRef} labels={searchLabels} className="col-span-2 sm:col-span-3" />
          <FilterSelect
            label={t.typeLabel}
            value={params.type}
            onChange={type => set({ type })}
            allLabel={t.allTypes}
            total={options.totals.type}
            options={orderFilterOptions(options.types)}
            template={t.optionTemplate}
          />
          <FilterSelect
            label={t.fieldLabel}
            value={params.field}
            onChange={field => set({ field })}
            allLabel={t.allFields}
            total={options.totals.field}
            options={orderFilterOptions(options.fields)}
            template={t.optionTemplate}
            className="order-last col-span-2 sm:order-none sm:col-span-1"
          />
          <FilterSelect
            label={t.yearLabel}
            value={params.year}
            onChange={year => set({ year })}
            allLabel={t.allYears}
            total={options.totals.year}
            options={options.years}
            template={t.optionTemplate}
          />
        </div>

        <ActiveFilters chips={chips} removeTemplate={t.removeTemplate} clearAllLabel={t.clearAll} onClearAll={clearAll} className="mt-3" />

        <div className="mt-6 flex items-center justify-between gap-4 border-b border-tide-border pb-3">
          <p ref={resultsRef} tabIndex={-1} className="scroll-mt-28 rounded-sm font-body text-sm text-tide-muted outline-none" aria-live="polite">{countText}</p>
          <button
            type="button"
            onClick={() => change({ ...params, dir: newest ? 'asc' : DEFAULT_DIR, page: 1 })}
            aria-label={t.directionLabelTemplate.replace('{dir}', () => (newest ? t.newest : t.oldest))}
            className={`-mr-2 inline-flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-full px-2 font-body text-sm font-semibold text-tide-text hover:text-primary-dark ${FOCUS_PILL}`}
          >
            {newest ? <CalendarArrowDown className="h-4 w-4" aria-hidden="true" /> : <CalendarArrowUp className="h-4 w-4" aria-hidden="true" />}
            {newest ? t.newest : t.oldest}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <FileText className="h-10 w-10 text-tide-muted/50" aria-hidden="true" />
            <p className="font-display text-xl font-semibold text-tide-text">{r.noResults}</p>
            <p className="font-body text-sm text-tide-muted">{r.noResultsHint}</p>
          </div>
        ) : (
          groups.map(g => {
            const headingId = `year-${g.year ?? 'undated'}`
            return (
              <section key={headingId} aria-labelledby={headingId} className="border-b border-tide-border lg:grid lg:grid-cols-[7rem_minmax(0,1fr)] lg:gap-x-10">
                <div className="pt-8 lg:pt-0">
                  <h2 id={headingId} className="font-display text-2xl font-semibold text-primary-dark tabular-nums lg:sticky lg:top-28 lg:pt-7 lg:text-4xl">
                    {g.year ?? r.undatedHeading}
                    {g.continued && (
                      <span className="ml-2 font-body text-sm font-medium text-tide-muted lg:ml-0 lg:mt-1 lg:block">{`(${r.continuedLabel})`}</span>
                    )}
                  </h2>
                </div>
                <ol className="divide-y divide-tide-border/80">
                  {g.rows.map(row => (
                    <li key={row.id}>
                      <ResearchEntry row={row} data={data} terms={terms} />
                    </li>
                  ))}
                </ol>
              </section>
            )
          })
        )}

        <PublicationsPagination
          page={pg.page}
          totalPages={pg.totalPages}
          hrefFor={n => ({ search: publicationParamsToSearch({ ...params, page: n }) })}
          linkState={{ focusResults: true }}
          labels={data.pagination}
        />
      </div>
    </section>
  )
}
