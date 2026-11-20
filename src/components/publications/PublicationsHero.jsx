import { FileText } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { countOfTypes, publicationStats } from '../../utils/publicationFilters'

// "{n} publications" → ['', <strong>12</strong>, ' publications']: the number is set in white, the
// words stay muted. Templates come from the page's YAML (`stats`).
function withValue(template, token, value) {
  const [before, after = ''] = template.split(`{${token}}`)
  return (
    <>
      {before}
      <strong className="font-semibold text-white tabular-nums">{value}</strong>
      {after}
    </>
  )
}

// The dark navy page banner shared by both Publications pages, plus a line of figures counted
// from the snapshot rows: count, distinct types, earliest year and — when the page's YAML lists
// `socialProofTypes` and at least one row has one of them — how many pieces by others there are.
// `chart` (optional) is shown beside the text on large screens, below it on small ones.
// Nothing is shown for 0 rows.
export function PublicationsHero({ data, rows, chart }) {
  const s = publicationStats(rows)
  const t = data.stats
  const others = countOfTypes(rows, data.socialProofTypes)
  const items = s.count > 0 ? [
    withValue(s.count === 1 ? t.publicationSingular : t.publicationPlural, 'n', s.count),
    s.types > 0 && withValue(s.types === 1 ? t.typeSingular : t.typePlural, 'n', s.types),
    s.firstYear && withValue(t.since, 'year', s.firstYear),
  ].filter(Boolean) : []
  const proofTemplate = others === 1 ? t.socialProofSingular : t.socialProofTemplate
  return (
    <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle || undefined} aside={chart || undefined}>
      {items.length > 0 && (
        <ul className="mt-8 flex flex-wrap items-center gap-y-2 font-body text-sm text-white/75 md:text-base">
          {items.map((node, i) => (
            <li key={i} className={i > 0 ? 'ml-4 border-l border-white/25 pl-4' : ''}>{node}</li>
          ))}
        </ul>
      )}
      {others > 0 && proofTemplate && (
        <p className="mt-3 font-body text-sm text-white/75 md:text-base">{withValue(proofTemplate, 'n', others)}</p>
      )}
    </PageHero>
  )
}

// Shown when the page's organisation has no published row yet. Text from the page's YAML.
export function PublicationsEmpty({ meta }) {
  return (
    <section className="bg-tide-bg px-4 py-24 md:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <FileText className="h-10 w-10 text-tide-muted/50" aria-hidden="true" />
        <p className="font-display text-xl font-semibold text-tide-text">{meta.emptyTitle}</p>
        {meta.emptyHint && <p className="font-body text-sm text-tide-muted">{meta.emptyHint}</p>}
      </div>
    </section>
  )
}
