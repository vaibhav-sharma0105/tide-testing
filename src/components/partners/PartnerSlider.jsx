import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import PartnerCard from './PartnerCard'
import { useConductedSlider } from './sliderConductor'
import { fadeUp as reveal } from '../../utils/motionPresets'
import { partnerTier } from '../../utils/partnerFilters'
import { SLIDE_RESUME_MS, SLIDES_START_PAUSED } from '../../config/partners'

// One "Type of partner" section: a numbered heading (a chapter of the page; on wide screens its
// number sits on the page's spine, filled while you read it), the count, one control pill and a
// row of partner cards that scrolls sideways.
//
// The row:
//   - cards slide in from the right as they come into view — it shows the row runs sideways
//     without any motion the visitor didn't cause; the most important partners come first;
//   - the native scrollbar is replaced by a slim track whose thumb shows which part of the row is
//     on screen; drag or click it to move;
//   - edges fade where more cards are hidden;
//   - starts paused (SLIDES_START_PAUSED); Play hands it to the page's conductor, which moves one
//     row at a time, one card per step, while it is on screen (sliderConductor.js).
// The control pill: previous · "1–5 of 23" · next · play/pause. Previous / next move by a screenful
// and stop at the ends. Moving content can always be stopped (WCAG 2.2.2): Pause, and it holds
// while hovered, focused, for SLIDE_RESUME_MS after a manual move, and while `suspended`; under
// "reduce motion" it never starts by itself and scrolls without animation.
// `text` = the page YAML's `directory` block; {group} in its slider labels is the section name.

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const EASE_OUT = [0.16, 1, 0.3, 1]

// Fixed class strings (Tailwind can't see class names built at runtime).
// Phones fade 20px (so the peeking third card stays visible), wider screens 56px.
const FADE = {
  both: '[mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%_-_20px),transparent)] sm:[mask-image:linear-gradient(to_right,transparent,#000_56px,#000_calc(100%_-_56px),transparent)]',
  right: '[mask-image:linear-gradient(to_right,#000_calc(100%_-_20px),transparent)] sm:[mask-image:linear-gradient(to_right,#000_calc(100%_-_56px),transparent)]',
  left: '[mask-image:linear-gradient(to_right,transparent,#000_20px)] sm:[mask-image:linear-gradient(to_right,transparent,#000_56px)]',
}

/** First and last card (1-based) fully or mostly on screen. */
function visibleRange(el) {
  const items = el.querySelectorAll(':scope > li')
  const box = el.getBoundingClientRect()
  let first = 0
  let last = 0
  items.forEach((li, i) => {
    const r = li.getBoundingClientRect()
    const shown = Math.min(r.right, box.right) - Math.max(r.left, box.left)
    if (r.width > 0 && shown >= r.width * 0.6) { if (!first) first = i + 1; last = i + 1 }
  })
  return { first, last }
}

export default function PartnerSlider({ group, index, text, suspended = false, headingId, active = false }) {
  const trackRef = useRef(null)
  // Logos of this category load only once the row is within 400px of the screen (Partners page speed,
  // owner decision 2026-11-27); until then the cards show their frame and name.
  const sectionRef = useRef(null)
  const nearScreen = useInView(sectionRef, { once: true, margin: '400px 0px' })
  const holdUntil = useRef(0)
  const [playing, setPlaying] = useState(() => !SLIDES_START_PAUSED && !prefersReducedMotion())
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [m, setM] = useState({ overflows: false, start: true, end: false, ratio: 1, progress: 0, first: 1, last: 1 })

  const fill = (template) => template.replace('{group}', () => group.label)
  const count = group.partners.length
  const number = String(index + 1).padStart(2, '0')

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const { first, last } = visibleRange(el)
    const next = {
      overflows: max > 1,
      start: el.scrollLeft <= 2,
      end: el.scrollLeft >= max - 2,
      ratio: el.scrollWidth ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
      progress: max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0,
      first: first || 1,
      last: last || 1,
    }
    setM(prev => (Object.keys(next).every(k => prev[k] === next[k]) ? prev : next))
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [count, measure])

  const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')

  /** Automatic step: one card forward, back to the start after the last. */
  const advance = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (el.scrollLeft >= max - 2) { el.scrollTo({ left: 0, behavior: behavior() }); return }
    const card = el.querySelector(':scope > li')
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: (card ? card.getBoundingClientRect().width : 160) + gap, behavior: behavior() })
  }, [])

  const hold = () => { holdUntil.current = Date.now() + SLIDE_RESUME_MS }
  /** Previous / next: a screenful (less a little, so one card stays for context); snapping aligns it. */
  const page = (dir) => {
    const el = trackRef.current
    if (!el) return
    hold()
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.85), behavior: behavior() })
  }

  // What the conductor reads each tick (a ref, so it always sees the latest state).
  const member = useRef(null)
  useEffect(() => {
    member.current = {
      el: trackRef.current,
      canMove: () => playing && !hovered && !focused && !suspended && m.overflows && Date.now() >= holdUntil.current,
      advance,
    }
  })
  useConductedSlider(group.key, member)

  // The custom track: click or drag moves the row to that point.
  const railRef = useRef(null)
  const dragging = useRef(false)
  const seek = (clientX) => {
    const el = trackRef.current
    const rail = railRef.current
    if (!el || !rail) return
    const r = rail.getBoundingClientRect()
    const thumb = r.width * m.ratio
    const share = Math.min(1, Math.max(0, (clientX - r.left - thumb / 2) / Math.max(1, r.width - thumb)))
    el.scrollTo({ left: share * (el.scrollWidth - el.clientWidth), behavior: dragging.current ? 'auto' : behavior() })
  }

  const fade = !m.overflows || focused ? '' : m.start ? FADE.right : m.end ? FADE.left : FADE.both
  const position = text.slider.position
    .replace('{from}', String(m.first))
    .replace('{to}', String(m.last))
    .replace('{total}', String(count))
  const btn = 'group/btn flex h-11 w-11 items-center justify-center rounded-full text-tide-text transition duration-200 hover:bg-primary-faint hover:text-primary-dark active:scale-90 disabled:pointer-events-none disabled:opacity-30 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'

  return (
    <motion.section ref={sectionRef} aria-labelledby={headingId} className="partner-row relative" {...reveal()}>
      {/* The spine node (wide screens): this section's number, filled while it is the one being read. */}
      <span
        aria-hidden="true"
        className={`absolute -left-[4.75rem] top-0 hidden h-12 w-12 items-center justify-center rounded-full font-display text-base font-semibold tabular-nums transition-all duration-500 lg:flex ${active ? 'bg-primary-dark text-white shadow-[0_8px_20px_-6px_rgba(30,107,170,0.6)] ring-4 ring-primary-faint' : 'border border-tide-border bg-white text-tide-muted'}`}
      >
        {number}
      </span>

      {/* Wraps: on a narrow phone the controls move under a long heading instead of covering it
          (P6, 320 px: the pill hid the end of "Collaborators"). */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="max-w-full break-words">
          <p aria-hidden="true" className="mb-1 font-body text-xs font-bold tabular-nums tracking-[0.2em] text-accent-deeper lg:hidden">{number}</p>
          <h2 id={headingId} tabIndex={-1} className="font-display text-2xl font-semibold leading-tight text-tide-text focus:outline-none md:text-[1.75rem]">
            {group.label}
          </h2>
          <p className="mt-1 font-body text-sm text-tide-muted">
            {(count === 1 ? text.sectionCountOne : text.sectionCount).replace('{count}', String(count))}
          </p>
        </div>

        {m.overflows && (
          <div className="flex flex-none items-center rounded-full border border-tide-border/80 bg-white p-1 shadow-[0_1px_2px_rgba(13,31,60,0.06),0_6px_16px_-8px_rgba(13,31,60,0.18)]">
            <button type="button" className={btn} onClick={() => page(-1)} disabled={m.start} aria-label={fill(text.slider.previous)}>
              <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover/btn:-translate-x-0.5" aria-hidden="true" />
            </button>
            <span className="hidden min-w-[4.75rem] px-1 text-center font-body text-xs font-semibold tabular-nums text-tide-mutedOnLight sm:block">{position}</span>
            <button type="button" className={btn} onClick={() => page(1)} disabled={m.end} aria-label={fill(text.slider.next)}>
              <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-tide-border" />
            {/* Play / pause: its own look, not the arrows' (a 44px target around a 36px disc).
                Paused = a filled blue disc that invites a press (grows and glows on hover);
                playing = a white disc with a slowly circling blue arc ("live"), tinted on hover.
                The two icons cross-fade and turn into each other. */}
            <button
              type="button"
              onClick={() => { holdUntil.current = 0; setPlaying(p => !p) }}
              aria-label={fill(playing ? text.slider.pause : text.slider.play)}
              className="group/play relative flex h-11 w-11 items-center justify-center rounded-full focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-out group-active/play:scale-90 ${playing
                  ? 'bg-white text-primary-dark ring-1 ring-primary/25 group-hover/play:bg-primary-faint'
                  : 'bg-primary-dark text-white shadow-[0_4px_10px_-4px_rgba(30,107,170,0.7)] group-hover/play:scale-[1.06] group-hover/play:shadow-[0_8px_18px_-6px_rgba(30,107,170,0.75)]'}`}
              >
                {playing && (
                  // "Live" arc: circles the disc while the row plays.
                  <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] animate-spin [animation-duration:2.4s] motion-reduce:hidden">
                    <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="26 90" />
                  </svg>
                )}
                <Play aria-hidden="true" fill="currentColor" className={`absolute ml-0.5 h-3.5 w-3.5 transition-all duration-300 ${playing ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                <Pause aria-hidden="true" fill="currentColor" className={`absolute h-3.5 w-3.5 transition-all duration-300 ${playing ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
              </span>
            </button>
          </div>
        )}
      </div>

      <ul
        ref={trackRef}
        // Focusable so the row can be scrolled with the arrow keys even where no card has a link.
        tabIndex={m.overflows ? 0 : undefined}
        aria-label={fill(text.slider.listLabel)}
        onScroll={measure}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false) }}
        onPointerDown={hold}
        onWheel={hold}
        onTouchStart={hold}
        className={`-mx-2 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-2 px-2 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-2xl ${fade}`}
      >
        {group.partners.map((p, i) => (
          // `relative`: keeps the card's screen-reader-only text and its whole-card link inside the
          // scrolling row — without it, off-screen cards widened the whole page.
          // Phone width: 40% so a third card peeks in and the row reads as swipeable.
          // The slide-in moves an inner wrapper, never the <li>: a transformed <li> would shift its snap
          // point and leave the row scrolled a little on load.
          <li key={p.id} className="relative w-[40%] flex-none snap-start sm:w-44 lg:w-[11.5rem]">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: Math.min(i, 4) * 0.05 }}
            >
              <PartnerCard partner={p} text={text} tier={partnerTier(p.priority)} order={i} showLogo={nearScreen} />
            </motion.div>
          </li>
        ))}
      </ul>

      {m.overflows && (
        <div
          ref={railRef}
          aria-hidden="true"
          className="group/rail relative mt-1 flex h-4 cursor-pointer touch-none items-center"
          onPointerDown={(e) => { hold(); dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); seek(e.clientX) }}
          onPointerMove={(e) => { if (dragging.current) seek(e.clientX) }}
          onPointerUp={() => { dragging.current = false }}
          onPointerCancel={() => { dragging.current = false }}
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-tide-border/70 transition-[height] duration-200 group-hover/rail:h-1.5">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-primary to-primary-mid transition-[left] duration-150 ease-out"
              style={{ width: `${m.ratio * 100}%`, left: `${m.progress * (1 - m.ratio) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.section>
  )
}
