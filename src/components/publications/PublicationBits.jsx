import { NEW_BADGE_DAYS } from '../../config/publications'
import { highlightParts, isNew, sourceOf } from '../../utils/publicationFilters'

// Small shared pieces of a publication entry on both pages. All text comes from the page's
// YAML (`data`) or the Sheet row.

// "New" for rows dated within NEW_BADGE_DAYS before today (worked out at render time).
// Light background, so accent-deeper text (4.5:1 on accent-light), never the bright accent.
export function NewBadge({ date, data, now = new Date() }) {
  if (!data.newBadge || !isNew(date, now, NEW_BADGE_DAYS)) return null
  return (
    <span className="inline-flex items-center rounded-full bg-accent-light px-2 py-0.5 font-body text-[11px] font-semibold leading-4 text-accent-deeper">
      {data.newBadge}
      {data.a11y?.newLabelTemplate && (
        <span className="sr-only">{`, ${data.a11y.newLabelTemplate.replace('{days}', String(NEW_BADGE_DAYS))}`}</span>
      )}
    </span>
  )
}

// "Source: tandfonline.com" / "Source: DOI" / "Source: Google Drive folder" — read from the
// link's address only (sourceOf), so it is always factual.
export function SourceLine({ url, data, className = '' }) {
  const src = sourceOf(url)
  if (!src || !data.source) return null
  const name = src.kind === 'host' ? src.host : data.source[src.kind]
  if (!name) return null
  return (
    <span className={`font-body text-xs text-tide-muted ${className}`}>
      {data.source.label}
      {': '}
      <span className="font-semibold text-tide-text/80">{name}</span>
    </span>
  )
}

// Text with the search words wrapped in <mark>. Without words, the plain text.
export function Highlight({ text, terms }) {
  if (!terms?.length) return text ?? null
  return highlightParts(text, terms).map((p, i) =>
    p.match
      ? <mark key={i} className="rounded-sm bg-accent-light px-0.5 text-inherit [box-decoration-break:clone]">{p.text}</mark>
      : <span key={i}>{p.text}</span>)
}
