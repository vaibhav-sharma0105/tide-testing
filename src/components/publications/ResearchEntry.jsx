import { useState, useRef, useLayoutEffect, useEffect, useId } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'
import TypeIcon from './TypeIcon'
import PublicationMedia from './PublicationMedia'
import { NewBadge, SourceLine, Highlight } from './PublicationBits'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'
import { copyText } from '../../utils/copyText'
import { getPublicationThumb } from '../../utils/publicationPhotos'
import { FAMILY_STYLE } from './typeStyles'
import { formatPublicationDate, safeLink, typeIconKey } from '../../utils/publicationFilters'

// One THRIvE publication in the archive list.
//   Left (top on phones): the thumbnail, large (19rem / 22rem: covers carry small print), in the
//   archive's one fixed 4:3 frame, 5px white padding on a softly fading mat (PublicationMedia:
//   whole image on a wash of its own colours, type badge with a name tooltip bottom-right, slow
//   drift on hover).
//   Right, kept lean: one top line of facts — type (with its family icon) · date (+ "New") ·
//   source — with the field-of-work tags right under it; the title (links out); then two clearly
//   separate blocks — the APA reference (what to cite: a quiet tinted panel with its own heading
//   and the "Copy citation" button) and the summary (what it is about: plain reading text with
//   its own heading, 3 lines, "Show more" only when longer) — and "Read".
// Search words are highlighted in the title and citation (`terms`).
// Row text from the snapshot; labels from thrive-publications.yaml (`data`).

const COPIED_MS = 2200
// Display width of the thumbnail column (matches the grid below), so high-resolution screens
// load the full-size file when the thumbnail would be too soft.
const THUMB_SIZES = '(min-width: 1024px) 22rem, (min-width: 640px) 19rem, 24rem'
const HEADING = 'font-body text-[11px] font-semibold uppercase tracking-[0.14em]'

// A quiet separator between the facts in the top line (decorative).
const Dot = () => <span aria-hidden="true" className="font-semibold text-tide-muted/60">·</span>

// The image repeats the title link for pointer users only (out of the tab order and hidden from
// screen readers, which reach the same link through the title).
function Thumb({ row, link }) {
  const media = <PublicationMedia thumb={getPublicationThumb(row.id)} type={row.type} shape="landscape" sizes={THUMB_SIZES} />
  return link
    ? <a href={link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="block">{media}</a>
    : media
}

function Summary({ text, data }) {
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
      <h4 className={`${HEADING} text-tide-muted`}>{data.entry.summaryHeading}</h4>
      <p ref={ref} id={id} className={`mt-1.5 font-body text-[15px] leading-[1.65] text-tide-text/85 break-words ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(e => !e)}
          className={`-ml-1 mt-0.5 inline-flex min-h-11 items-center rounded-full px-1 font-body text-sm font-semibold text-primary hover:text-primary-dark ${FOCUS_PILL}`}
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
        className={`-my-2 -mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-body text-xs font-semibold transition-colors ${FOCUS_PILL} ${
          copied ? 'text-primary-dark' : 'text-primary hover:bg-white hover:text-primary-dark'
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
        <span aria-hidden="true">{copied ? data.entry.copied : data.entry.copyCitation}</span>
      </button>
      <span className="sr-only" aria-live="polite">{copied ? data.entry.copiedAnnouncement : state === 'failed' ? data.entry.copyFailed : ''}</span>
      {state === 'failed' && <span className="basis-full font-body text-xs text-tide-muted">{data.entry.copyFailed}</span>}
    </>
  )
}

function Citation({ row, data, terms }) {
  return (
    <figure className="mt-4 rounded-2xl border border-primary/10 bg-primary-faint/60 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h4 className={`${HEADING} text-primary-dark`}>{data.entry.citationHeading}</h4>
        <CopyCitation citation={row.citation} title={row.title} data={data} />
      </div>
      <blockquote className="mt-2 font-body text-sm leading-relaxed text-tide-text/80 [overflow-wrap:anywhere]">
        <span className="sr-only">{data.a11y.citationLabel}: </span>
        <Highlight text={row.citation} terms={terms} />
      </blockquote>
    </figure>
  )
}

export default function ResearchEntry({ row, data, terms }) {
  const link = safeLink(row.link)
  const date = formatPublicationDate(row.date)
  const fields = Array.isArray(row.fields) ? row.fields.filter(Boolean) : []
  // One colour per type family (as the image badge): the type label, its icon and the tags share it.
  const family = FAMILY_STYLE[typeIconKey(row.type)] ?? FAMILY_STYLE.file
  const openLabel = data.a11y.openLabelTemplate.replace('{action}', () => data.entry.read).replace('{title}', () => row.title ?? '')

  return (
    <article
      className="group/media grid gap-x-8 gap-y-4 py-8 outline-none sm:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-x-10"
    >
      <div className="max-w-sm sm:sticky sm:top-28 sm:max-w-none sm:self-start">
        <Thumb row={row} link={link} />
      </div>

      <div className="min-w-0">
        {/* Everything ABOUT the publication sits together above the title: type · date (+ New) ·
            source, then its field-of-work tags. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[13px]">
          {row.type && (
            <span className={`inline-flex items-center gap-1.5 font-semibold ${family.icon}`}>
              <TypeIcon type={row.type} />
              <span className="sr-only">{data.a11y.typeLabel}</span>
              {row.type}
            </span>
          )}
          {date && <><Dot /><time dateTime={row.date} className="text-tide-muted">{date}</time></>}
          <NewBadge date={row.date} data={data} />
          {link && <><Dot /><SourceLine url={link} data={data} compact /></>}
        </p>
        {fields.length > 0 && (
          <div className="mt-2">
            <span className="sr-only">{data.a11y.fieldsLabel}</span>
            <ul className="flex flex-wrap gap-1.5">
              {fields.map(f => (
                <li key={f} className={`max-w-full rounded-full px-2.5 py-0.5 font-body text-xs font-medium break-words ${family.tint} ${family.icon}`}>{f}</li>
              ))}
            </ul>
          </div>
        )}
        <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-tide-text text-pretty break-words md:text-2xl">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={`decoration-primary/40 underline-offset-4 hover:text-primary-dark hover:underline ${focusRing('focus-visible:rounded-sm')}`}>
              <Highlight text={row.title} terms={terms} />
              <span className="sr-only"> {data.a11y.newTab}</span>
            </a>
          ) : <Highlight text={row.title} terms={terms} />}
        </h3>

        {row.citation && <Citation row={row} data={data} terms={terms} />}
        {row.description && <Summary text={row.description} data={data} />}

        {link && (
          <div className="mt-4">
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
          </div>
        )}
      </div>
    </article>
  )
}

