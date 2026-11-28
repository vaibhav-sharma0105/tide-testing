import { useState, useRef, useLayoutEffect, useEffect, useId, useCallback } from 'react'
import { ArrowUpRight, ChevronDown, Copy, Check } from 'lucide-react'
import TypeIcon from './TypeIcon'
import PublicationMedia from './PublicationMedia'
import { NewBadge, SourceLine, Highlight } from './PublicationBits'
import { FOCUS_PILL } from '../library/LibraryDropdown'
import { focusRing } from '../../utils/focusRing'
import { copyText } from '../../utils/copyText'
import { getPublicationThumb } from '../../utils/publicationPhotos'
import { FAMILY_STYLE } from './typeStyles'
import { formatPublicationDate, highlightParts, safeLink, typeIconKey } from '../../utils/publicationFilters'

// One THRIvE publication in the archive list.
//   Left (top on phones): the thumbnail, large (19rem / 22rem: covers carry small print), in the
//   archive's one fixed 4:3 frame, 5px white padding on a softly fading mat (PublicationMedia:
//   whole image on a wash of its own colours, type badge with a name tooltip bottom-right, slow
//   drift on hover).
//   Right, kept lean: one top line of facts — type (with its family icon) · date (+ "New") ·
//   source — with the field-of-work tags right under it; the title (links out); the summary
//   ("About this work", 3 lines); then one compact action row — the Read button, named for the
//   kind of work (YAML entry.actions: "Read article", "View book"…), and "Show more", which
//   opens the full summary AND the APA reference (a tinted panel with "Copy citation") together
//   (owner request 2026-11-28: citations behind "Show more" so the list reads lighter).
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

// "About this work": 3 lines while the entry is closed, all of it once "Show more" opens it.
// Reports whether the clamped text is cut (so the entry knows whether "Show more" has a job when
// there is no citation to reveal).
function Summary({ text, data, expanded, id, onOverflow }) {
  const ref = useRef(null)
  // Measured while clamped; once expanded the last answer stands so the button can collapse again.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return undefined
    const check = () => onOverflow(el.scrollHeight > el.clientHeight + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded, text, onOverflow])

  return (
    <div className="mt-4">
      <h4 className={`${HEADING} text-tide-muted`}>{data.entry.summaryHeading}</h4>
      <p ref={ref} id={id} className={`mt-1.5 font-body text-[15px] leading-[1.65] text-tide-text/85 break-words ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
    </div>
  )
}

// The one "Show more" / "Show less" switch of an entry: opens the full summary and the APA
// reference together. A quiet text button with a chevron that turns, so it reads as "there is
// more here" without competing with the Read button beside it.
function MoreToggle({ expanded, controls, onClick, data }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={`group/more relative inline-flex min-h-9 first:-ml-3 items-center gap-1 rounded-full px-3 font-body text-[13px] font-semibold text-primary-dark transition-colors hover:bg-primary-faint hit-44 ${FOCUS_PILL}`}
    >
      {expanded ? data.entry.showLess : data.entry.showMore}
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-out ${expanded ? 'rotate-180' : 'group-hover/more:translate-y-0.5'}`} aria-hidden="true" />
    </button>
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
          copied ? 'text-primary-dark' : 'text-primary-dark hover:bg-white hover:text-primary-deeper'
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
    <figure className="mt-4 rounded-2xl border border-primary/10 border-l-[3px] border-l-primary/50 bg-primary-faint/60 px-4 py-3 sm:px-5">
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
  const familyKey = typeIconKey(row.type)
  const family = FAMILY_STYLE[familyKey] ?? FAMILY_STYLE.file
  // The button names what the visitor will do with this kind of work ("Read article", "View
  // book"…; YAML entry.actions by type family), falling back to the plain "Read".
  const action = data.entry.actions?.[familyKey] || data.entry.read
  const openLabel = data.a11y.openLabelTemplate.replace('{action}', () => action).replace('{title}', () => row.title ?? '')

  // One switch opens the full summary and the APA reference together.
  const moreId = useId()
  const summaryId = useId()
  // While a search matches words only in the citation, the entry opens by itself so the visitor
  // sees why it is listed; the visitor's own click always wins.
  const citationHit = terms?.length > 0 && highlightParts(row.citation, terms).some(p => p.match)
  const [userExpanded, setUserExpanded] = useState(null)
  const expanded = userExpanded ?? citationHit
  const setExpanded = (fn) => setUserExpanded(fn(expanded))
  const [summaryCut, setSummaryCut] = useState(false)
  const onOverflow = useCallback((cut) => setSummaryCut(cut), [])
  const hasMore = Boolean(row.citation) || summaryCut
  const controls = [row.description && summaryId, row.citation && moreId].filter(Boolean).join(' ') || undefined

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

        {row.description && (
          <Summary text={row.description} data={data} expanded={expanded} id={summaryId} onOverflow={onOverflow} />
        )}

        {/* The APA reference waits behind "Show more": it is what a citing researcher needs, not
            what a browsing reader needs first. It stays in the page (search highlights it, and it
            slides open rather than appearing), but is inert — unreachable — while closed. */}
        {row.citation && (
          <div
            id={moreId}
            inert={!expanded}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0 overflow-hidden">
              <Citation row={row} data={data} terms={terms} />
            </div>
          </div>
        )}

        {(link || hasMore) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={openLabel}
                className={`group/read relative inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-dark pl-4 pr-3 font-body text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(30,107,170,0.28)] transition-[box-shadow,filter] duration-200 hover:shadow-[0_4px_16px_rgba(30,107,170,0.4)] hover:brightness-90 hit-44 ${FOCUS_PILL}`}
              >
                {action}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/read:-translate-y-0.5 group-hover/read:translate-x-0.5" aria-hidden="true" />
              </a>
            )}
            {hasMore && <MoreToggle expanded={expanded} controls={controls} onClick={() => setExpanded(e => !e)} data={data} />}
          </div>
        )}
      </div>
    </article>
  )
}

