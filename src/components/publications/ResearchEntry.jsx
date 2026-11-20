import { useState, useRef, useLayoutEffect, useEffect, useId, forwardRef } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'
import TypeIcon from './TypeIcon'
import MediaPanel from './MediaPanel'
import { NewBadge, SourceLine, Highlight } from './PublicationBits'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'
import { copyText } from '../../utils/copyText'
import { getPublicationThumb } from '../../utils/publicationPhotos'
import { formatPublicationDate, safeLink } from '../../utils/publicationFilters'

// One THRIvE publication in the archive list: type (with its family icon) + date (+ "New"),
// title (links out), APA citation right under the title, description (3 lines, "Show more" only
// when it is longer), field-of-work tags, "Read", "Copy citation" and the link's source.
// Search words are highlighted in the title and citation (`terms`).
// Thumbnail: one column width, height following the image's own ratio (3:4…16:9) on a brand
// panel tinted by type family; top-left on phones, on the right from sm up. Without one, a
// stand-in page with the type's icon keeps the column aligned. Hovering or focusing anywhere in
// the entry lifts the panel and zooms the image slightly (off under reduced motion).
// Row text from the snapshot; labels from thrive-publications.yaml (`data`).

const COPIED_MS = 2200

// Thumbnail on its brand panel (MediaPanel), framed at the image's own ratio within 3:4…16:9.
// The image repeats the title link for pointer users only (out of the tab order and hidden from
// screen readers, which reach the same link through the title).
function Thumb({ row, link }) {
  const panel = <MediaPanel thumb={getPublicationThumb(row.id)} type={row.type} minRatio={3 / 4} maxRatio={16 / 9} standinRatio={4 / 3} />
  return link
    ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="block">{panel}</a>
    : <div aria-hidden="true">{panel}</div>
}

function Description({ text, data }) {
  const id = useId()
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  // Measured while clamped; once expanded the button stays so it can collapse again.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return undefined
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded, text])

  return (
    <div className="mt-4">
      <p ref={ref} id={id} className={`font-body text-[15px] leading-relaxed text-tide-text/85 break-words ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(e => !e)}
          className={`-ml-1 mt-1 inline-flex min-h-11 items-center rounded-full px-1 font-body text-sm font-semibold text-primary hover:text-primary-dark ${FOCUS_PILL}`}
        >
          {expanded ? data.entry.showLess : data.entry.showMore}
        </button>
      )}
    </div>
  )
}

function CopyCitation({ citation, title, data }) {
  const [state, setState] = useState('idle') // 'idle' | 'copied' | 'failed'
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    const ok = await copyText(citation)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), ok ? COPIED_MS : COPIED_MS * 2)
  }
  const copied = state === 'copied'
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={data.a11y.copyLabelTemplate.replace('{title}', () => title ?? '')}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-sm font-semibold transition-colors ${FOCUS_PILL} ${
          copied ? 'border-primary/30 bg-primary-faint text-primary-dark' : 'border-tide-border bg-white text-tide-text hover:border-primary/40'
        }`}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        <span aria-hidden="true">{copied ? data.entry.copied : data.entry.copyCitation}</span>
      </button>
      <span className="sr-only" aria-live="polite">{copied ? data.entry.copiedAnnouncement : state === 'failed' ? data.entry.copyFailed : ''}</span>
      {state === 'failed' && <span className="basis-full font-body text-xs text-tide-muted">{data.entry.copyFailed}</span>}
    </>
  )
}

const ResearchEntry = forwardRef(function ResearchEntry({ row, data, terms }, ref) {
  const link = safeLink(row.link)
  const date = formatPublicationDate(row.date)
  const fields = Array.isArray(row.fields) ? row.fields.filter(Boolean) : []
  const openLabel = data.a11y.openLabelTemplate.replace('{action}', () => data.entry.read).replace('{title}', () => row.title ?? '')

  return (
    <article
      ref={ref}
      tabIndex={-1}
      className="group/media grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 py-8 outline-none [grid-template-areas:'thumb_head'_'body_body'] sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-x-8 sm:[grid-template-areas:'head_thumb'_'body_thumb'] lg:grid-cols-[minmax(0,1fr)_10rem]"
    >
      <div className="[grid-area:thumb] pt-1">
        <Thumb row={row} link={link} />
      </div>

      <div className="[grid-area:head] min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[13px]">
          {row.type && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-dark">
              <TypeIcon type={row.type} />
              <span className="sr-only">{data.a11y.typeLabel}</span>
              {row.type}
            </span>
          )}
          {date && <time dateTime={row.date} className="text-tide-muted">{date}</time>}
          <NewBadge date={row.date} data={data} />
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-tide-text break-words md:text-[1.375rem]">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={`decoration-primary/40 underline-offset-4 hover:text-primary-dark hover:underline ${focusRing('focus-visible:rounded-sm')}`}>
              <Highlight text={row.title} terms={terms} />
              <span className="sr-only"> {data.a11y.newTab}</span>
            </a>
          ) : <Highlight text={row.title} terms={terms} />}
        </h3>
        {row.citation && (
          <p className="mt-3 border-l-2 border-primary-light pl-3 font-body text-sm leading-relaxed text-tide-muted [overflow-wrap:anywhere]">
            <span className="sr-only">{data.a11y.citationLabel}: </span>
            <Highlight text={row.citation} terms={terms} />
          </p>
        )}
      </div>

      <div className="[grid-area:body] min-w-0">
        {row.description && <Description text={row.description} data={data} />}
        {fields.length > 0 && (
          <div className="mt-4">
            <span className="sr-only">{data.a11y.fieldsLabel}</span>
            <ul className="flex flex-wrap gap-1.5">
              {fields.map(f => (
                <li key={f} className="max-w-full rounded-full bg-primary-faint px-2.5 py-1 font-body text-xs font-medium text-primary-dark break-words">{f}</li>
              ))}
            </ul>
          </div>
        )}
        {(link || row.citation) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-3">
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={openLabel}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-semibold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary-dark ${FOCUS_PILL}`}
              >
                {data.entry.read}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {row.citation && <CopyCitation citation={row.citation} title={row.title} data={data} />}
            <SourceLine url={link} data={data} className="sm:ml-2" />
          </div>
        )}
      </div>
    </article>
  )
})

export default ResearchEntry
