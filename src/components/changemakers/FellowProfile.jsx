import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, Play, RefreshCcw, Sprout, X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import { getFellowPhotos } from '../../utils/changemakersPhotos'
import { firstName, personInitials, posterIndex } from '../../utils/changemakers'

// A fellow's full profile, opened from the grid (the address keeps ?fellow=<id>, so a profile can be
// shared or reloaded; Escape / Back / the close button shut it and focus returns to the card).
// The window, by design: a navy identity band on top (batch, NAME = h2 and the dialog's label, project,
// previous / "3 of 10" / next, close), then a two-part body:
//   PHOTO — a full-height panel on the left edge that stretches with the text, so the window never
//           shows a hole under a short photo column. The photo itself is shown whole at its own shape
//           over a blurred copy of itself (never cropped or stretched, however tall the text makes the
//           panel); round 44px switch fellow ↔ field work with a tooltip when both exist; an initials
//           poster as a fixed 4:5 card when there are none.
//   TEXT  — one reading column: "About the project" (G) → "Their work" (film + testimonial with
//           their poster frames → the shared video player via onPlay; the write-up opens straight in
//           a new tab) → "What's next" (L) in a warm panel, cut to 3 lines with "Read more".
// Every part is optional and simply absent when empty; short content is centred beside the photo,
// so a sparse profile still looks composed. Nothing but a name → one quiet line (`profile.empty`).
// Phones: a full-screen sheet, the photo full width on top, the body scrolls under the band.
// Sized so the longest answers the form allows fit 1440×900 … 768×1024 without scrolling.
// Focus starts on the name (not on a button, so no tooltip pops up on open). Moving between fellows
// (buttons or ← / →) is a shared-axis slide in that direction; reduced motion: fades only.
// `text` = YAML `profiles`.

const POSTERS = ['from-navy to-primary', 'from-primary to-primary-mid', 'from-navy to-teal-600', 'from-primary-dark to-navy']
const fill = (t, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, () => v ?? ''), t ?? '')
const headingClass = 'flex items-center gap-2.5 font-display text-lg font-semibold text-tide-text'
const paragraphs = (t) => String(t ?? '').split(/\n\s*\n/).filter(Boolean)

// Material 3 emphasized easing.
const EMPHASIZED_DECEL = [0.05, 0.7, 0.1, 1]
const EMPHASIZED_ACCEL = [0.3, 0, 0.8, 0.15]

// A small tooltip shown only while its button (the `peer` just before it) is hovered with a mouse or
// has keyboard focus (:focus-visible) — never because focus landed there programmatically on open.
const tipBase = 'pointer-events-none absolute z-30 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 font-body text-xs font-semibold text-tide-text opacity-0 shadow-float ring-1 ring-black/5 transition duration-150 peer-focus-visible:opacity-100 [@media(hover:hover)]:peer-hover:opacity-100'

// The photo panel. A photo is shown WHOLE at its own shape (never cropped, never stretched): it sits
// over a blurred, enlarged copy of itself that fills the panel, so the panel can be as tall as the
// text makes it (long answers, "Read more") without distorting or over-cropping the picture. The
// photo is sticky, so it stays in view while an expanded profile scrolls. No photo → an initials
// poster fills the panel.
function Portrait({ fellow, photos, text }) {
  const [swap, setSwap] = useState(false)
  const both = photos.fellow && photos.field
  const main = both ? (swap ? photos.field : photos.fellow) : photos.fellow ?? photos.field
  const altFor = (p) => (p === photos.fellow ? fill(text.photoAlt, { name: fellow.name }) : fill(text.fieldAlt, { project: fellow.project ?? fellow.name }))
  const label = swap ? text.flipToFellow : text.flipToField

  // No photo yet: the initials poster as a fixed 4:5 portrait card (the listing card's shape) on a light
  // surface (a dark panel would merge with the navy band), placed like a photo — centred in view,
  // sticky in a long profile — so it never stretches with the text.
  if (!main) {
    return (
      <div className="relative w-full bg-primary-faint md:h-full md:min-h-[20rem]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_45%,rgba(255,255,255,0.9),transparent_75%)]" />
        <div className="relative flex justify-center p-4 md:sticky md:top-0 md:h-full md:max-h-[calc(100dvh-10rem)] md:min-h-[20rem] md:items-center md:p-5">
          <div aria-hidden="true" className={`relative flex aspect-[4/5] w-full max-w-[10rem] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-[0_20px_40px_-18px_rgba(13,31,60,0.45)] ring-1 ring-black/5 md:max-w-none ${POSTERS[posterIndex(fellow.id)]}`}>
            <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <span className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/5" />
            <span className="relative font-display text-5xl font-semibold tracking-wide text-white md:text-6xl">{personInitials(fellow.name)}</span>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="relative w-full bg-navy md:h-full md:min-h-[20rem]">
      {/* The ambient backdrop: the same picture, blurred and enlarged, under a navy veil. */}
      {/* Clipped in its own layer: an overflow-hidden panel would stop the photo from being sticky. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.img key={main.src} src={main.src} alt=""
          initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl saturate-150" />
      </AnimatePresence>
      <span className="absolute inset-0 bg-gradient-to-b from-navy/20 via-navy/30 to-navy/50" />
      </div>
      {/* The photo itself, whole. Sticky: centred in a short panel, kept in view in a tall one. */}
      <div className="relative flex justify-center p-4 md:sticky md:top-0 md:h-full md:max-h-[calc(100dvh-10rem)] md:min-h-[20rem] md:items-center md:p-5">
        <div className="relative max-w-full">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={main.src}
              src={main.src}
              width={main.width}
              height={main.height}
              alt={altFor(main)}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EMPHASIZED_DECEL }}
              className="block h-auto max-h-[50vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/15 md:max-h-[min(30rem,calc(100dvh-14rem))]"
            />
          </AnimatePresence>
          {both && (
            <div className="absolute bottom-3 left-3 z-10">
              <button
                type="button"
                onClick={() => setSwap(v => !v)}
                aria-pressed={swap}
                aria-label={label}
                className="peer flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-tide-text shadow-md backdrop-blur transition hover:bg-white hover:text-primary-dark active:scale-90"
              >
                <RefreshCcw className={`h-4 w-4 transition-transform duration-500 ${swap ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <span aria-hidden="true" className={`${tipBase} bottom-full left-0 mb-2`}>{label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// "Their work": one tile per piece — a small poster that always fills the tile's full height (so a
// label running to several lines never leaves it short) (the video's own frame when the sync saved
// one, else a navy gradient) with a play button, or a document mark for the write-up, and beside it
// the label and a quiet verb. The verb is decorative (aria-hidden): accessible names stay the labels
// (+ "opens in a new tab" for the link).
const tileClass = 'group/tile flex min-h-[3.75rem] w-full items-stretch gap-3 rounded-2xl bg-white p-2 pr-3 text-left ring-1 ring-tide-border transition duration-200 hover:bg-primary-faint hover:ring-primary/25 active:bg-primary-light/60'
// Fixed class strings for 1–3 tiles in a row (Tailwind can't see class names built at runtime).
// Three in a row only from laptop width; narrower, they stack (three side by side cramp the labels).
const WORK_COLS = ['', 'sm:max-w-sm', 'sm:grid-cols-2', 'lg:grid-cols-3']

function WorkTile({ label, verb, poster, onClick, href, sr }) {
  const inner = (
    <>
      <span className={`relative flex min-h-[2.75rem] w-16 flex-none self-stretch [@media(min-width:1280px)_and_(min-height:860px)]:w-[5.5rem] items-center justify-center overflow-hidden rounded-xl ${href ? 'bg-primary-faint ring-1 ring-inset ring-primary-light' : 'bg-gradient-to-br from-navy to-primary-dark'}`}>
        {poster && <img src={poster.src} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-105" />}
        {poster && <span aria-hidden="true" className="absolute inset-0 bg-navy/30" />}
        {href
          ? <FileText className="h-5 w-5 text-primary-dark" aria-hidden="true" />
          : (
            <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary-dark shadow transition-transform duration-300 group-hover/tile:scale-110">
              <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
            </span>
          )}
      </span>
      <span className="min-w-0 flex-1 self-center py-0.5">
        <span title={label} className="line-clamp-3 block break-words lg:line-clamp-2 font-body text-sm font-semibold leading-snug text-tide-text">{label}</span>
        {verb && (
          <span aria-hidden="true" className="mt-0.5 flex items-center gap-1 font-body text-xs font-medium text-primary-dark">
            {verb}
            {href && <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" />}
          </span>
        )}
      </span>
      {sr && <span className="sr-only">{` ${sr}`}</span>}
    </>
  )
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={tileClass}>{inner}</a>
    : <button type="button" onClick={onClick} className={tileClass}>{inner}</button>
}

// "What's next": a few lines, then "Read more" (only when the text is really cut).
function NextSteps({ text, body }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [cut, setCut] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || open) return undefined
    const check = () => setCut(el.scrollHeight > el.clientHeight + 2)
    check()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, body])
  return (
    <>
      <div ref={ref} id="fellow-next-body" className={`mt-1.5 max-w-[62ch] space-y-2 font-body text-sm leading-[1.6] text-tide-mutedOnLight ${open ? '' : 'line-clamp-3'}`}>
        {paragraphs(body).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {(cut || open) && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="fellow-next-body"
          className="mt-1 inline-flex min-h-[32px] items-center gap-1 rounded-full font-body text-sm font-semibold text-primary-dark underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {open ? text.profile.readLess : text.profile.readMore}
        </button>
      )}
    </>
  )
}

// A round 44px button on the navy band. `tip` (optional) = tooltip (hover / keyboard focus only).
// Without an onClick it is shown disabled (the first / last fellow).
function BandButton({ onClick, label, tip, children }) {
  return (
    <span className="relative flex">
      <button type="button" onClick={onClick ?? undefined} disabled={!onClick} aria-label={label}
        className="peer flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/15 active:bg-white/25 disabled:cursor-default disabled:text-white/30 disabled:hover:bg-transparent">
        {children}
      </button>
      {tip && <span aria-hidden="true" className={`${tipBase} right-0 top-full mt-2`}>{tip}</span>}
    </span>
  )
}

// `position` (optional) = { at, total } — where this fellow is in the list being looked at ("3 of 10").
export default function FellowProfile({ fellow, prev, next, text, onClose, onGo, onPlay, videoOpen, position }) {
  const reduce = useReducedMotion()
  const open = !!fellow
  const ref = useFocusTrap(open)
  const headingRef = useRef(null)
  const [dir, setDir] = useState(0)
  const go = useCallback((target, d) => { if (target) { setDir(d); onGo(target.id) } }, [onGo])
  const onKey = useCallback((e) => {
    if (e.key === 'ArrowLeft') go(prev, -1)
    if (e.key === 'ArrowRight') go(next, 1)
  }, [prev, next, go])
  // While a video plays on top, Escape belongs to the player.
  useModalBehavior({ active: open && !videoOpen ? fellow.id : null, onClose, onKeyExtra: onKey })

  // The focus trap focuses the first button; start on the name instead (it is what the dialog is
  // about, and a focused Previous button would show its tooltip the moment the window opens).
  useEffect(() => { if (open) headingRef.current?.focus({ preventScroll: true }) }, [open])
  // At the first / last fellow the button just used becomes disabled and drops focus: keep it inside.
  const id = fellow?.id
  useEffect(() => {
    const el = document.activeElement
    if (id && ref.current && (!ref.current.contains(el) || el?.disabled)) headingRef.current?.focus({ preventScroll: true })
  }, [id, prev, next, ref])

  const photos = fellow ? getFellowPhotos(fellow.id) : null
  const titleId = 'fellow-profile-title'
  const workCount = fellow ? [fellow.videoUrl, fellow.testimonialUrl, fellow.writeupUrl].filter(Boolean).length : 0
  const hasWork = workCount > 0

  const sheet = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.2 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }
    : {
        initial: { opacity: 0, y: 32, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: EMPHASIZED_DECEL } },
        exit: { opacity: 0, y: 16, scale: 0.99, transition: { duration: 0.2, ease: EMPHASIZED_ACCEL } },
      }
  // Shared axis X between fellows: out towards the old side, in from the new one.
  const axis = {
    initial: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 28 }),
    animate: { opacity: 1, x: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: EMPHASIZED_DECEL } },
    exit: (d) => (reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, x: d * -28, transition: { duration: 0.14, ease: EMPHASIZED_ACCEL } }),
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="backdrop" className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/70 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...sheet}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]"
          >
            {/* WHO — the navy identity band. */}
            {/* Compact: eyebrow + controls on one row, the name and project full width below.
                Medium and up: the name block on the left, the controls top right. */}
            <header className="relative grid flex-none grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 overflow-hidden bg-navy px-4 pb-5 pt-3 text-white sm:px-8 md:pb-4 md:pt-4 lg:px-10 xl:pb-5">
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(46,133,199,0.38),transparent_55%)]" />
              <p className="relative col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 self-center font-body text-[11px] font-bold uppercase tracking-[0.18em] text-accent md:mt-1.5 md:self-start">
                <span aria-hidden="true" className="h-px w-6 flex-none bg-accent" />
                {fill(text.eyebrow, { batch: fellow.batch })}
              </p>
              <div className="relative col-start-2 row-start-1 flex items-center gap-2 md:row-span-3">
                {/* Previous / next fellow (also ← / →), then close. */}
                <nav aria-label={text.profile.navLabel} className="flex flex-none items-center rounded-full bg-white/10 p-0.5 ring-1 ring-white/10">
                  <BandButton onClick={prev ? () => go(prev, -1) : null} label={prev ? `${text.profile.prev}: ${prev.name}` : text.profile.prev} tip={prev?.name}>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </BandButton>
                  {position && position.total > 1 && (
                    <span className="min-w-[3.25rem] px-1 text-center font-body text-xs font-semibold tabular-nums text-white/80">
                      {text.profile.position.replace('{at}', String(position.at)).replace('{total}', String(position.total))}
                    </span>
                  )}
                  <BandButton onClick={next ? () => go(next, 1) : null} label={next ? `${text.profile.next}: ${next.name}` : text.profile.next} tip={next?.name}>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </BandButton>
                </nav>
                <BandButton onClick={onClose} label={text.profile.close}><X className="h-5 w-5" aria-hidden="true" /></BandButton>
              </div>
              <h2 id={titleId} ref={headingRef} tabIndex={-1} className="relative col-span-2 row-start-2 mt-1 font-display text-[1.75rem] font-semibold leading-tight outline-none focus-visible:shadow-none focus-visible:outline-none sm:text-3xl md:col-span-1 lg:text-[2.125rem]">
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.span key={fellow.id} custom={dir} variants={axis} initial="initial" animate="animate" exit="exit" className="block">
                    {fellow.name}
                  </motion.span>
                </AnimatePresence>
              </h2>
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                {fellow.project && (
                  <motion.p key={fellow.id} custom={dir} variants={axis} initial="initial" animate="animate" exit="exit"
                    className="relative col-span-2 row-start-3 mt-1 max-w-3xl font-body text-base leading-snug text-white/80 sm:text-[1.0625rem] md:col-span-1">
                    {fellow.project}
                  </motion.p>
                )}
              </AnimatePresence>
            </header>

            {/* overflow-x: clip — the sideways slide between fellows must never flash a scrollbar. */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" data-profile-body>
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div key={fellow.id} custom={dir} variants={axis} initial="initial" animate="animate" exit="exit"
                  className="md:grid md:min-h-full md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[13.5rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
                  <Portrait fellow={fellow} photos={photos} text={text} />

                  <div className="flex min-w-0 flex-col justify-center gap-5 px-4 py-6 sm:px-8 md:py-4 lg:px-10 [@media(min-width:1280px)_and_(min-height:860px)]:gap-6 [@media(min-width:1280px)_and_(min-height:860px)]:py-7">
                    {/* STORY */}
                    {fellow.summary && (
                      <section className="min-w-0">
                        <h3 className={headingClass}>
                          <span aria-hidden="true" className="h-5 w-1 rounded-full bg-primary" />
                          {text.profile.aboutHeading}
                        </h3>
                        <div className="mt-2 max-w-[80ch] space-y-2.5 font-body text-[0.9375rem] leading-[1.65] text-tide-text/85 md:text-sm md:leading-[1.6] [@media(min-width:1280px)_and_(min-height:860px)]:text-[0.9375rem] [@media(min-width:1280px)_and_(min-height:860px)]:leading-[1.65]">
                          {paragraphs(fellow.summary).map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                      </section>
                    )}

                    {/* WORK */}
                    {hasWork && (
                      <section aria-labelledby="fellow-work-heading" className="min-w-0">
                        <h3 id="fellow-work-heading" className={headingClass}>
                          <span aria-hidden="true" className="h-5 w-1 rounded-full bg-accent-dark" />
                          {text.work.heading}
                        </h3>
                        <div className={`mt-2.5 grid gap-2.5 ${WORK_COLS[workCount]}`}>
                          {fellow.videoUrl && <WorkTile poster={photos.video} label={text.work.videoLabel} verb={text.work.watch} onClick={() => onPlay(fellow.videoUrl, fill(text.videoTitle, { project: fellow.project ?? fellow.name }))} />}
                          {fellow.testimonialUrl && <WorkTile poster={photos.testimonial} label={fill(text.work.testimonialLabel, { firstName: firstName(fellow.name) })} verb={text.work.watch} onClick={() => onPlay(fellow.testimonialUrl, fill(text.testimonialTitle, { name: fellow.name }))} />}
                          {/* The write-up opens straight in a new tab (Drive's own viewer). */}
                          {fellow.writeupUrl && <WorkTile label={text.work.writeupLabel} verb={text.work.read} href={fellow.writeupUrl.replace(/\/preview$/, '/view')} sr={text.work.opensInNewTab} />}
                        </div>
                      </section>
                    )}

                    {/* NEXT — a few lines + Read more. */}
                    {fellow.nextSteps && (
                      <section className="min-w-0 rounded-[20px] bg-tide-warm px-5 py-4 md:py-3.5">
                        <h3 className={headingClass}>
                          <span aria-hidden="true" className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-accent-deeper"><Sprout className="h-4 w-4" /></span>
                          {text.nextSteps}
                        </h3>
                        <NextSteps text={text} body={fellow.nextSteps} />
                      </section>
                    )}

                    {/* Nothing but the name and project yet. */}
                    {!fellow.summary && !fellow.nextSteps && !hasWork && (
                      <p className="font-display text-lg italic text-tide-mutedOnLight md:max-w-md">{text.profile.empty}</p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
