import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ExternalLink, FileText } from 'lucide-react'
import PublicationCover from './PublicationCover'
import MediaPanel from './MediaPanel'
import TypeIcon from './TypeIcon'
import PublicationsPagination from './PublicationsPagination'
import { NewBadge, SourceLine, Highlight } from './PublicationBits'
import { SearchBox } from './PublicationControls'
import { DOT_PATTERN } from './typeStyles'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'
import { useDebouncedSearch, useFocusShortcut, focusResults } from '../../hooks/usePublicationControls'
import { getPublicationThumb } from '../../utils/publicationPhotos'
import { TIDE_OTHERS_PAGE_SIZE, TIDE_SEARCH_MIN_ITEMS, TIDE_SHELF_VISIBLE } from '../../config/publications'
import {
  applyPublicationFilters, formatPeriod, formatPublicationDate, paginate, parsePublicationParams,
  publicationParamsToSearch, reportPeriod, safeLink, searchTerms, splitShelf,
} from '../../utils/publicationFilters'
import { normKey, optionsFor, orderFilterOptions } from '../../utils/listingFilters'

// /about/publications body — a small collection today (16 rows) that must stay good at 5 or 500:
//   1. Featured: the latest report of `data.featuredType` (default "Annual report"), as a large
//      cover on a stack of paper.
//   2. Shelf: the other reports of that type, latest period first. Annual-report covers look
//      alike, so each carries its PERIOD (e.g. "2024–25", read from the title) as the main label.
//      The first TIDE_SHELF_VISIBLE, then "Show all {n} annual reports".
//   3. Everything else: type buttons with counts (only with 2+ types), numbered pages only above
//      TIDE_OTHERS_PAGE_SIZE.
//   A search box appears only above TIDE_SEARCH_MIN_ITEMS rows; while searching, one result list
//   replaces sections 1–3. Sections with no rows are not rendered.
// type / page / search live in the URL (an unknown type is ignored; the page is clamped).
// Rows from the snapshot; labels from about-publications.yaml (`data`).

const openLabel = (data, action, title) =>
  data.a11y.openLabelTemplate.replace('{action}', () => action).replace('{title}', () => title ?? '')

function MetaLine({ row, data, className = '' }) {
  const date = formatPublicationDate(row.date)
  return (
    <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 font-body text-xs ${className}`}>
      {row.type && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary-dark">
          <TypeIcon type={row.type} className="h-3.5 w-3.5" />
          <span className="sr-only">{data.a11y.typeLabel}</span>
          {row.type}
        </span>
      )}
      {date && (
        <span className="text-tide-muted">
          <span className="sr-only">{data.a11y.dateLabel}</span>
          <time dateTime={row.date}>{date}</time>
        </span>
      )}
      <NewBadge date={row.date} data={data} />
    </p>
  )
}

function Featured({ row, data }) {
  const link = safeLink(row.link)
  const date = formatPublicationDate(row.date)
  const reduce = useReducedMotion()
  const cover = (
    <PublicationCover
      thumb={getPublicationThumb(row.id)}
      title={row.title}
      period={formatPeriod(reportPeriod(row))}
      size="lg"
      stack={2}
      priority
    />
  )
  return (
    <section aria-labelledby="featured-title" className="overflow-hidden bg-tide-bg px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-16 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-56 sm:w-64 md:w-full"
        >
          {/* Brand backdrop behind the cover (decorative). */}
          <span aria-hidden="true" className={`absolute -inset-x-6 inset-y-8 rounded-3xl bg-primary-faint ${DOT_PATTERN} md:-inset-x-10`} />
          <div className="relative px-2">
            {link
              ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="group block">{cover}</a>
              : <div className="group">{cover}</div>}
          </div>
        </motion.div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-3 font-body text-sm font-semibold text-accent-deeper">
            {data.featured.eyebrow}
            <NewBadge date={row.date} data={data} />
          </p>
          <h2 id="featured-title" className="mt-3 font-display text-3xl font-semibold leading-tight text-tide-text text-balance break-words md:text-5xl">
            {row.title}
          </h2>
          {date && (
            <p className="mt-4 font-body text-sm text-tide-muted">
              <span className="sr-only">{data.a11y.dateLabel}</span>
              <time dateTime={row.date}>{date}</time>
            </p>
          )}
          {row.description && (
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-tide-muted break-words">{row.description}</p>
          )}
          {link && (
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={openLabel(data, data.featured.read, row.title)}
                className={`inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-body text-base font-semibold text-white shadow-md shadow-primary/25 transition-colors hover:bg-primary-dark ${FOCUS_PILL}`}
              >
                {data.featured.read}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <SourceLine url={link} data={data} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ShelfTile({ row, index, data, tileRef }) {
  const link = safeLink(row.link)
  const period = formatPeriod(reportPeriod(row))
  const body = (
    <>
      <PublicationCover thumb={getPublicationThumb(row.id)} title={row.title} period={period} size="md" tone={index} stack={1} />
      {period && (
        <span className="mt-4 block font-display text-xl font-semibold leading-none tabular-nums text-tide-text group-hover:text-primary-dark md:text-2xl">
          <span className="sr-only">{data.a11y.periodLabel}: </span>
          {period}
        </span>
      )}
      <span className={`block font-body text-[13px] leading-snug text-tide-muted break-words line-clamp-2 ${period ? 'mt-1.5' : 'mt-4 font-semibold text-tide-text'}`}>{row.title}</span>
    </>
  )
  return (
    <li className="w-[40%] flex-shrink-0 snap-start sm:w-[27%] md:w-auto">
      {link ? (
        <a ref={tileRef} href={link} target="_blank" rel="noopener noreferrer" className={`group block rounded-md pb-1 ${focusRing('focus-visible:rounded-md')}`}>
          {body}
          <span className="sr-only">{data.a11y.newTab}</span>
        </a>
      ) : (
        <div ref={tileRef} tabIndex={-1} className="group pb-1 outline-none">{body}</div>
      )}
    </li>
  )
}

function Shelf({ rows, data }) {
  const [expanded, setExpanded] = useState(false)
  const firstHidden = useRef(null)
  const canToggle = rows.length > TIDE_SHELF_VISIBLE
  const shown = expanded || !canToggle ? rows : rows.slice(0, TIDE_SHELF_VISIBLE)
  const toggle = () => {
    setExpanded(e => !e)
    // After "Show all", keyboard focus moves to the first newly shown report.
    if (!expanded) requestAnimationFrame(() => firstHidden.current?.focus())
  }
  return (
    <section aria-labelledby="shelf-heading" className="border-t border-tide-border bg-white px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline gap-3">
          <h2 id="shelf-heading" className="font-display text-2xl font-semibold text-tide-text md:text-3xl">{data.shelf.heading}</h2>
          <span className="font-body text-sm tabular-nums text-tide-muted">{rows.length}</span>
        </div>
        {/* Phones: one sideways row (scroll-snap, the next cover peeks in). md and up: a grid. */}
        <ul id="shelf-list" className="relative -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 pt-3 md:mx-0 md:grid md:snap-none md:grid-cols-4 md:gap-x-8 md:gap-y-12 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6">
          {shown.map((r, i) => (
            <ShelfTile key={r.id} row={r} index={i} data={data} tileRef={i === TIDE_SHELF_VISIBLE ? firstHidden : undefined} />
          ))}
        </ul>
        {canToggle && (
          <div className="mt-8 flex justify-center md:mt-12">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="shelf-list"
              onClick={toggle}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-tide-border bg-white px-5 font-body text-sm font-semibold text-tide-text shadow-sm transition-colors hover:border-primary/40 hover:text-primary-dark ${FOCUS_PILL}`}
            >
              {expanded ? data.shelf.showFewer : data.shelf.showAllTemplate.replace('{n}', String(rows.length))}
              <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function OtherCard({ row, data, terms }) {
  const link = safeLink(row.link)
  const thumb = getPublicationThumb(row.id)
  const wide = thumb?.frame === 'landscape'
  // Wide images get the card's full width on top (never squeezed into a narrow column); pages
  // and stand-ins sit in a narrow column on the left.
  const media = wide
    ? <MediaPanel thumb={thumb} type={row.type} maxHeightRem={11} className="mb-4 w-full" />
    : <MediaPanel thumb={thumb} type={row.type} className="w-24 flex-shrink-0 self-start sm:w-28" />
  return (
    <article className={`group/media flex h-full rounded-2xl border border-tide-border bg-white p-4 shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5 ${wide ? 'flex-col' : 'gap-5'}`}>
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className={wide ? 'block' : 'block self-start'}>{media}</a>
        : media}
      <div className="flex min-w-0 flex-1 flex-col">
        <MetaLine row={row} data={data} />
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-tide-text break-words">
          <Highlight text={row.title} terms={terms} />
        </h3>
        {row.description && (
          <p className="mt-2 font-body text-sm leading-relaxed text-tide-muted line-clamp-4 break-words">{row.description}</p>
        )}
        {link && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 pt-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openLabel(data, data.others.open, row.title)}
              className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 font-body text-sm font-semibold text-primary hover:text-primary-dark ${FOCUS_PILL}`}
            >
              {data.others.open}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <SourceLine url={link} data={data} />
          </div>
        )}
      </div>
    </article>
  )
}

// A grid of cards with numbered pages above TIDE_OTHERS_PAGE_SIZE; the range line is announced
// and receives focus after a page change.
function CardList({ rows, page, data, terms, hrefFor }) {
  const pg = paginate(rows, page, TIDE_OTHERS_PAGE_SIZE)
  const location = useLocation()
  const rangeRef = useRef(null)
  const handledKey = useRef(location.key)
  useEffect(() => {
    if (handledKey.current === location.key) return
    handledKey.current = location.key
    if (location.state?.focusResults) focusResults(rangeRef.current)
  }, [location.key, location.state])
  return (
    <>
      {pg.totalPages > 1 && (
        <p ref={rangeRef} tabIndex={-1} aria-live="polite" className="mt-6 scroll-mt-28 rounded-sm font-body text-sm text-tide-muted outline-none">
          {data.pagination.rangeTemplate.replace('{from}', String(pg.from)).replace('{to}', String(pg.to)).replace('{total}', String(pg.total))}
        </p>
      )}
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {pg.items.map(r => <li key={r.id} className="min-w-0"><OtherCard row={r} data={data} terms={terms} /></li>)}
      </ul>
      <PublicationsPagination page={pg.page} totalPages={pg.totalPages} hrefFor={hrefFor} linkState={{ focusResults: true }} labels={data.pagination} />
    </>
  )
}

function Others({ rows, data, params, onChange }) {
  const options = useMemo(() => orderFilterOptions(optionsFor(rows, 'type')), [rows])
  const type = options.some(o => o.value === params.type) ? params.type : ''
  const shown = type ? rows.filter(r => normKey(r.type) === type) : rows
  const segments = [{ value: '', label: data.others.allTypes, count: rows.length }, ...options]

  return (
    <section aria-labelledby="others-heading" className="border-t border-tide-border bg-tide-bg px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 id="others-heading" className="font-display text-2xl font-semibold text-tide-text md:text-3xl">{data.others.heading}</h2>
        {options.length >= 2 && (
          <div role="group" aria-label={data.others.filterLabel} className="mt-6 flex flex-wrap gap-2">
            {segments.map(s => {
              const on = s.value === type
              return (
                <button
                  key={s.value || '__all'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...params, type: s.value, page: 1 })}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-sm transition-colors ${FOCUS_PILL} ${
                    on ? 'border-primary bg-primary font-semibold text-white' : 'border-tide-border bg-white text-tide-text hover:border-primary/40'
                  }`}
                >
                  {s.value && <TypeIcon type={s.label} className="h-4 w-4" />}
                  {s.label}
                  <span className={`tabular-nums text-xs ${on ? 'text-white/80' : 'text-tide-muted'}`}>{s.count}</span>
                </button>
              )
            })}
          </div>
        )}
        <CardList
          rows={shown}
          page={params.page}
          data={data}
          terms={[]}
          hrefFor={n => ({ search: publicationParamsToSearch({ ...params, type, page: n }) })}
        />
      </div>
    </section>
  )
}

function SearchResults({ rows, data, params }) {
  const terms = searchTerms(params.search)
  const found = applyPublicationFilters(rows, { search: params.search })
  const s = data.search
  return (
    <section aria-labelledby="search-heading" className="bg-tide-bg px-4 pt-8 pb-16 md:px-8 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 id="search-heading" className="font-display text-2xl font-semibold text-tide-text md:text-3xl">{s.resultsHeading}</h2>
        <p aria-live="polite" className="mt-2 font-body text-sm text-tide-muted">
          {s.countTemplate.replace('{total}', String(found.length)).replace('{publications}', () => (found.length === 1 ? s.publicationSingular : s.publicationPlural))}
        </p>
        {found.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-tide-muted/50" aria-hidden="true" />
            <p className="font-display text-xl font-semibold text-tide-text">{s.noResults}</p>
            <p className="font-body text-sm text-tide-muted">{s.noResultsHint}</p>
          </div>
        ) : (
          <CardList rows={found} page={params.page} data={data} terms={terms} hrefFor={n => ({ search: publicationParamsToSearch({ ...params, page: n }) })} />
        )}
      </div>
    </section>
  )
}

export default function TideCollection({ rows, data }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => parsePublicationParams(location.search), [location.search])
  const { featured, shelf, others } = useMemo(() => splitShelf(rows, data.featuredType), [rows, data.featuredType])
  const change = useCallback((next) => navigate({ search: publicationParamsToSearch(next) }, { replace: true }), [navigate])

  const searchable = rows.length > TIDE_SEARCH_MIN_ITEMS && Boolean(data.search)
  const commitSearch = useCallback((search) => {
    change({ ...parsePublicationParams(window.location.search), search, page: 1 })
  }, [change])
  const [input, setInput] = useDebouncedSearch(params.search, commitSearch)
  const inputRef = useRef(null)
  useFocusShortcut(searchable ? data.search?.shortcutKey : '', inputRef)
  const searching = searchable && params.search.trim() !== ''

  return (
    <>
      {searchable && (
        <div className="bg-tide-bg px-4 pt-10 md:px-8 md:pt-12">
          <div className="mx-auto max-w-6xl">
            <SearchBox value={input} onChange={setInput} inputRef={inputRef} labels={data.search} className="max-w-xl" />
          </div>
        </div>
      )}
      {searching ? (
        <SearchResults rows={rows} data={data} params={params} />
      ) : (
        <>
          {featured && <Featured row={featured} data={data} />}
          {shelf.length > 0 && <Shelf rows={shelf} data={data} />}
          {others.length > 0 && <Others rows={others} data={data} params={params} onChange={change} />}
        </>
      )}
    </>
  )
}
