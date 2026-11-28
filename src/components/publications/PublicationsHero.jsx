import { FileText } from 'lucide-react'
import PageHero from '../ui/PageHero'
import HeroStats from '../ui/HeroStats'
import withValue from '../ui/withValue'
import { countOfTypes, publicationStats } from '../../utils/publicationFilters'

// The dark navy page banner shared by both Publications pages, plus a line of figures counted
// from the snapshot rows: count, distinct types, earliest year and — when the page's YAML lists
// `socialProofTypes` and at least one row has one of them — how many pieces by others there are.
// `chart` (optional) is shown beside the text on large screens, below it on small ones.
// Each optional figure shows only when the page's YAML has its text: the types figure needs
// `stats.typePlural` (THRIvE dropped it, owner request 2026-11-28), the social-proof line needs
// `socialProofTypes` + `stats.socialProofTemplate` (THRIvE dropped it too).
// Nothing is shown for 0 rows.
export function PublicationsHero({ data, rows, chart }) {
  const s = publicationStats(rows)
  const t = data.stats
  const others = countOfTypes(rows, data.socialProofTypes)
  const typeTemplate = s.types === 1 ? t.typeSingular : t.typePlural
  const items = s.count > 0 ? [
    withValue(s.count === 1 ? t.publicationSingular : t.publicationPlural, 'n', s.count),
    s.types > 0 && typeTemplate && withValue(typeTemplate, 'n', s.types),
    s.firstYear && withValue(t.since, 'year', s.firstYear),
  ].filter(Boolean) : []
  const proofTemplate = others === 1 ? t.socialProofSingular : t.socialProofTemplate
  return (
    <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle || undefined} aside={chart || undefined}>
      <HeroStats items={items} />
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
