import { useEffect, useRef } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Lightbox from '../ui/Lightbox'
import { useLightbox } from '../../hooks/useLightbox'
import ablData from '../../data/abl-home.json'
import { imgSrc } from '../../utils/imgSrc'

// A photo strip that drifts on its own and can always be taken over, moved by one transform so the
// motion is sub-pixel smooth (native scrolling snaps to whole pixels, which shows as judder at a
// slow drift). Everything feeds one position:
//  - the drift eases up to speed and eases off when paused, so nothing starts or stops abruptly;
//  - a mouse drag, a touch swipe or a sideways wheel moves it directly, and on release it keeps its
//    momentum and slows to a stop;
//  - the arrow buttons give it a flick of fixed size, which glides the same way.
// A tap (a press that barely moves) opens that photo in a translucent full-screen viewer, with
// previous/next. Each photo is also a button, so the keyboard can reach it: focusing one slides it
// to the middle. The strip stays still while the viewer is open and for a few seconds after any
// manual move. The photos are laid out twice and the position wraps by one copy, so there is no end.
// Reduced motion: no drift.
const SPEED = 45            // drift, px per second
const FRICTION = 3.2        // how quickly momentum dies away (per second)
const EASE = 2.5            // how quickly the drift eases in and out (per second)
const IDLE_MS = 3000        // pause after a manual move before drifting on
const GAP = 20
const TAP_SLOP = 6          // px of movement that still counts as a tap

export default function PhotoStrip() {
  const { gallery } = ablData
  const reduce = useReducedMotion()
  const box = useRef(null)
  const track = useRef(null)
  const s = useRef({ x: 0, v: 0, drift: 0, width: 1, until: 0, hover: false, viewing: false, drag: null })
  const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(gallery.items.length)

  // the viewer holds the strip still, and lets it go a moment after it closes
  useEffect(() => {
    s.current.viewing = isLightboxOpen
    if (!isLightboxOpen) s.current.until = performance.now() + IDLE_MS
  }, [isLightboxOpen])

  useEffect(() => {
    const el = box.current
    const tr = track.current
    const st = s.current
    const measure = () => { st.width = tr.scrollWidth / 2 }
    measure()
    window.addEventListener('resize', measure)

    const wrap = (x) => ((x % st.width) + st.width) % st.width - st.width     // keep in [-width, 0)

    // a sideways wheel or trackpad swipe moves the strip; a plain vertical wheel still scrolls the page
    const onWheel = (e) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return
      e.preventDefault()
      st.x -= dx
      st.until = performance.now() + IDLE_MS
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    let raf = 0
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!st.drag) {
        const drifting = !reduce && !st.hover && !st.viewing && now > st.until && !document.hidden
        st.drift += ((drifting ? -SPEED : 0) - st.drift) * Math.min(1, dt * EASE)
        st.x += (st.v + st.drift) * dt
        st.v *= Math.exp(-FRICTION * dt)
        if (Math.abs(st.v) < 0.5) st.v = 0
      }
      st.x = wrap(st.x)
      tr.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      el.removeEventListener('wheel', onWheel)
    }
  }, [reduce])

  const down = (e) => {
    const st = s.current
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const tile = e.target.closest?.('li[data-i]')
    st.drag = { id: e.pointerId, lastX: e.clientX, lastT: performance.now(), v: 0, moved: 0, tile: tile ? Number(tile.dataset.i) : null }
    st.v = 0
    box.current.setPointerCapture(e.pointerId)
    st.until = Infinity
  }
  const move = (e) => {
    const st = s.current
    const d = st.drag
    if (!d || d.id !== e.pointerId) return
    const now = performance.now()
    const dx = e.clientX - d.lastX
    st.x += dx
    d.moved += Math.abs(dx)
    const dt = Math.max(1, now - d.lastT) / 1000
    d.v = d.v * 0.6 + (dx / dt) * 0.4              // smoothed release velocity
    d.lastX = e.clientX
    d.lastT = now
  }
  const up = (e) => {
    const st = s.current
    const d = st.drag
    if (!d || d.id !== e.pointerId) return
    st.drag = null
    st.until = performance.now() + IDLE_MS
    if (e.type === 'pointerup' && d.moved < TAP_SLOP && d.tile !== null) {
      st.v = 0
      openLightbox(d.tile)
      return
    }
    st.v = Math.abs(d.v) > 60 && performance.now() - d.lastT < 120 ? d.v : 0     // a pause before release means no flick
  }

  // a flick of one photo's width: with friction k, a start speed of k * distance travels that far
  const step = (dir) => {
    const st = s.current
    const tile = track.current.querySelector('li')
    st.v = -dir * (tile.offsetWidth + GAP) * FRICTION
    st.until = performance.now() + IDLE_MS
  }

  // keyboard focus on a photo: slide it to the middle (the browser would otherwise scroll the clipped box)
  // (only for keyboard focus: a mouse or touch press also focuses the button, and sliding the photo
  // under the pointer just before the viewer opens looks like a jump)
  const centre = (e) => {
    if (!e.currentTarget.matches(':focus-visible')) return
    const st = s.current
    const r = e.currentTarget.getBoundingClientRect()
    const b = box.current.getBoundingClientRect()
    st.x += b.left + b.width / 2 - (r.left + r.width / 2)
    st.v = 0
    st.until = performance.now() + IDLE_MS
    box.current.scrollLeft = 0
  }

  const arrow = 'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-float transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white sm:flex'

  return (
    <div className="relative">
      <button type="button" onClick={() => step(-1)} aria-label={gallery.prevLabel} className={`${arrow} left-4 md:left-8`}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => step(1)} aria-label={gallery.nextLabel} className={`${arrow} right-4 md:right-8`}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div
        ref={box}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') s.current.hover = true }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') s.current.hover = false }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="cursor-grab select-none overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      >
        <div ref={track} className="flex w-max will-change-transform">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 gap-5 pr-5" aria-hidden={copy === 1 ? 'true' : undefined}>
              {gallery.items.map((item, i) => (
                <li
                  key={item.src}
                  data-i={i}
                  className={`group w-64 shrink-0 overflow-hidden rounded-2xl shadow-card md:w-80 ${i % 2 ? 'mt-6' : 'mb-6'}`}
                >
                  {/* the second copy is only there to make the loop seamless; the first is the real, focusable one */}
                  <button
                    type="button"
                    tabIndex={copy === 0 ? 0 : -1}
                    aria-label={copy === 0 ? item.alt : undefined}
                    aria-haspopup="dialog"
                    onClick={() => openLightbox(i)}
                    onFocus={centre}
                    className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <img src={imgSrc(item.src)} alt="" loading="lazy" draggable="false" className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isLightboxOpen && (
          <Lightbox
            images={gallery.items}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevLightbox}
            onNext={nextLightbox}
            onGoTo={openLightbox}
            translucent
          />
        )}
      </AnimatePresence>
    </div>
  )
}
