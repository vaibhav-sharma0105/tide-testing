import { ArrowUpRight } from 'lucide-react'
import { NEW_BADGE_DAYS } from '../../config/publications'
import { highlightParts, isNew, sourceName, sourceOf } from '../../utils/publicationFilters'

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
// A web address is shown by its name from the page's YAML (`source.names`) when listed, else as
// the address itself.
// compact (the top line of a THRIvE entry, as research indexes show a source): the name with an
// "opens elsewhere" arrow, or an outlined "DOI" tag for a DOI link. Hovering the arrow/tag shows
// the word "Source" in a tooltip; screen readers hear "Source: …".
export function SourceLine({ url, data, compact = false, className = '' }) {
  const src = sourceOf(url)
  if (!src || !data.source) return null
  const name = src.kind === 'host' ? sourceName(src.host, data.source.names) : data.source[src.kind]
  if (!name) return null
  if (compact) {
    // Tooltip text is drawn by CSS (::before from data-tip), so it is never copied with the line.
    const tip = (
      <span className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 translate-y-1 rounded-lg bg-tide-text/90 px-2 py-1 font-body text-[11px] font-medium leading-none text-white opacity-0 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out group-hover/src:visible group-hover/src:translate-y-0 group-hover/src:opacity-100 motion-reduce:transition-none before:content-[attr(data-tip)]" data-tip={data.source.label} aria-hidden="true" />
    )
    return (
      <span className={`inline-flex min-w-0 items-center gap-1 font-body text-tide-muted ${className}`}>
        <span className="sr-only">{data.source.label}{': '}</span>
        {src.kind === 'doi' ? (
          <span className="group/src relative inline-flex items-center rounded border border-tide-border px-1.5 text-[11px] font-semibold uppercase leading-[18px] tracking-wide text-tide-text/75">
            {name}
            {tip}
          </span>
        ) : (
          <>
            <span className="group/src relative inline-flex">
              <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
              {tip}
            </span>
            <span className="truncate">{name}</span>
          </>
        )}
      </span>
    )
  }
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
