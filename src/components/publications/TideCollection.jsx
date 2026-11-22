import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ExternalLink } from 'lucide-react'
import PublicationCover from './PublicationCover'
import PublicationMedia from './PublicationMedia'
import TypeIcon from './TypeIcon'
import PublicationsPagination from './PublicationsPagination'
import { NewBadge, Highlight } from './PublicationBits'
import { PublicationToolbar, ResultsBar, NoResults } from './PublicationControls'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { usePublicationQuery } from '../../hooks/usePublicationControls'
import { getPublicationThumb } from '../../utils/publicationPhotos'
import { TIDE_PAGE_SIZE } from '../../config/publications'
import {
  formatPeriod, formatPublicationDate, paginate, publicationParamsToSearch, reportPeriod, safeLink, latestOfType,
} from '../../utils/publicationFilters'
import { normKey } from '../../utils/listingFilters'
import TiltGlare from '../ui/TiltGlare'
import { tiltProps } from '../../utils/tilt'
const TILT = tiltProps(5, 4)

// /tide/publications body — a small collection today (16 rows) that must stay good at 5 or 500.
// Two jobs, two parts, one layout that never changes while filtering:
//   1. Spotlight (accountability): the latest report of data.featuredType (default "Annual
//      report"; latest = the period named in its title), large, with its period set big and faint
//      behind the section, and "See all {n} editions", which filters the library below to that
//      type and moves focus to its results line. It stays in place while the library is filtered.
//   2. Library (the record): EVERY TIDE row — annual reports included — as identical cards (one
//      5:6 frame, PublicationMedia), under the same search + Type + Year bar as THRIvE's
//      (PublicationToolbar; no Field of work, TIDE rows don't have it), with the results line,
//      newest/oldest switch and numbered pages of TIDE_PAGE_SIZE. Filters only narrow this grid.
// Nothing here names a type: every heading, filter and count comes from the rows + YAML templates.
// No "Source" line on this page (owner decision 2026-11-20; every TIDE link was a Google Drive link).
// search / type / year / dir / page live in the URL (unknown values show as removable chips; the
// page is clamped). Rows from the snapshot; labels from tide-publications.yaml (data).

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

function Spotlight({ row, data, sameType, onSeeAll }) {
  const link = safeLink(row.link)
  const period = formatPeriod(reportPeriod(row))
  const reduce = useReducedMotion()
  const cover = (
    <PublicationCover thumb={getPublicationThumb(row.id)} type={row.type} title={row.title} period={period} size="lg" priority />
  )
  return (
    <section aria-labelledby="featured-title" className="relative overflow-hidden bg-tide-bg px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
      {/* The report's period, set very large and faint behind the section (decorative). */}
      {period && (
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-4 hidden select-none font-display text-[11rem] font-semibold leading-none tabular-nums text-primary/[0.05] lg:block xl:text-[14rem]">
          {period}
        </span>
      )}
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-16 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-64 sm:w-72 md:w-full"
        >
          {link
            ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="group/media block">{cover}</a>
            : <div className="group/media">{cover}</div>}
        </motion.div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-3 font-body text-sm font-semibold text-accent-deeper">
            <span className="h-px w-8 bg-accent-deeper/60" aria-hidden="true" />
            {data.featured.eyebrow}
          </p>
          <h2 id="featured-title" className="mt-4 font-display text-3xl font-semibold leading-tight text-tide-text text-balance break-words md:text-5xl">
            {row.title}
          </h2>
          <MetaLine row={row} data={data} className="mt-5 text-sm" />
          {row.description && (
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-tide-muted break-words">{row.description}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">
            {link && (
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
            )}
            {sameType > 1 && data.featured.seeAllTemplate && (
              <button
                type="button"
                onClick={onSeeAll}
                className={`inline-flex min-h-12 items-center gap-2 rounded-full border border-tide-border bg-white px-5 font-body text-base font-semibold text-tide-text transition-colors hover:border-primary/40 hover:text-primary-dark ${FOCUS_PILL}`}
              >
                {data.featured.seeAllTemplate.replace('{n}', String(sameType))}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Every card has the same shape: the thumbnail in a slightly tall 5:6 frame on top (most TIDE uploads
// are tall pages, shown much larger than in a wide frame; wide slides keep their width) —
// then type + date, title, 3 lines of description and "Open" pinned to the bottom, so a row of
// cards lines up whatever the uploads look like.
function PublicationCard({ row, data, terms }) {
  const link = safeLink(row.link)
  const media = <PublicationMedia thumb={getPublicationThumb(row.id)} type={row.type} shape="card" className="rounded-xl" />
  return (
    <article {...TILT} className="tilt-3d tilt-lift group/media relative flex h-full flex-col rounded-3xl border border-tide-border bg-white p-3 shadow-card hover:shadow-card-hover">
      <TiltGlare />
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="block">{media}</a>
        : media}
      <div className="flex min-w-0 flex-1 flex-col px-2 pb-1 pt-4">
        <MetaLine row={row} data={data} />
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-tide-text text-pretty break-words">
          <Highlight text={row.title} terms={terms} />
        </h3>
        {row.description && (
          <p className="mt-2 font-body text-sm leading-relaxed text-tide-muted line-clamp-3 break-words">
            <Highlight text={row.description} terms={terms} />
          </p>
        )}
        {link && (
          <div className="mt-auto pt-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openLabel(data, data.library.open, row.title)}
              className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 font-body text-sm font-semibold text-primary hover:text-primary-dark ${FOCUS_PILL}`}
            >
              {data.library.open}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </article>
  )
}

function Library({ q, rows, data }) {
  const { params, filtered, terms } = q
  const pg = paginate(filtered, params.page, TIDE_PAGE_SIZE)
  return (
    <section aria-labelledby="library-heading" className="border-t border-tide-border bg-white px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="flex items-baseline gap-3">
            <h2 id="library-heading" className="font-display text-2xl font-semibold text-tide-text md:text-3xl">{data.library.heading}</h2>
            <span className="rounded-full bg-tide-subtle px-2.5 py-0.5 font-body text-xs font-semibold tabular-nums text-tide-muted">{rows.length}</span>
          </div>
          {data.library.intro && <p className="mt-2 font-body text-[15px] leading-relaxed text-tide-muted">{data.library.intro}</p>}
        </div>
        <PublicationToolbar q={q} t={data.toolbar} filters={['type', 'year']} className="mt-8" />
        <ResultsBar q={q} pg={pg} t={data.toolbar} r={data.results} className="mt-6" />
        {filtered.length === 0 ? <NoResults r={data.results} /> : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pg.items.map(r => <li key={r.id} className="min-w-0"><PublicationCard row={r} data={data} terms={terms} /></li>)}
          </ul>
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

export default function TideCollection({ rows, data }) {
  const featured = useMemo(() => latestOfType(rows, data.featuredType), [rows, data.featuredType])
  const q = usePublicationQuery({ rows, shortcutKey: data.toolbar.searchShortcutKey, undatedHeading: data.results.undatedHeading, searchChipTemplate: data.toolbar.searchChipTemplate })
  const featuredKey = normKey(featured?.type)
  const sameType = featured ? rows.filter(r => normKey(r.type) === featuredKey).length : 0
  // "See all editions": the library shows only that type (other filters cleared), focus moves there.
  const seeAll = () => q.change({ search: '', type: featuredKey, field: '', year: '', dir: q.params.dir, page: 1 }, { focus: true })

  return (
    <>
      {featured && <Spotlight row={featured} data={data} sameType={sameType} onSeeAll={seeAll} />}
      <Library q={q} rows={rows} data={data} />
    </>
  )
}
