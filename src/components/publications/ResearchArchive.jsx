import ResearchEntry from './ResearchEntry'
import PublicationsPagination from './PublicationsPagination'
import { PublicationToolbar, ResultsBar, NoResults } from './PublicationControls'
import { usePublicationQuery } from '../../hooks/usePublicationControls'
import { THRIVE_PAGE_SIZE } from '../../config/publications'
import { groupByYear, paginate, publicationParamsToSearch } from '../../utils/publicationFilters'

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
  const t = data.toolbar
  const r = data.results
  const q = usePublicationQuery({ rows, shortcutKey: t.searchShortcutKey, undatedHeading: r.undatedHeading })
  const { params, filtered, terms } = q
  const pg = paginate(filtered, params.page, THRIVE_PAGE_SIZE)
  const groups = groupByYear(pg.items, filtered[pg.start - 1] ?? null)

  return (
    <section className="bg-tide-bg px-4 pt-10 pb-20 md:px-8 md:pt-14 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <PublicationToolbar q={q} t={t} filters={['type', 'field', 'year']} />
        <ResultsBar q={q} pg={pg} t={t} r={r} className="mt-6" />

        {filtered.length === 0 ? <NoResults r={r} /> : (
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
