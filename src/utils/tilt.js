// Pointer-following 3D tilt for cards (styles: .tilt-3d / .tilt-3d-glare in src/index.css).
// Put the handlers on the card's outer element (the hover area); they move that element itself when
// it has the `.tilt-3d` class, otherwise its `.tilt-3d` child, by writing CSS variables straight
// onto it — no React re-render per mouse move. `tiltProps()` gives both handlers at once. Mouse only (no tilt
// on touch, where it would fight scrolling) and never under "reduce motion".

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const target = (e) => (e.currentTarget.classList.contains('tilt-3d') ? e.currentTarget : e.currentTarget.querySelector('.tilt-3d'))

/** onPointerMove handler; `maxY` / `maxX` = most degrees of tilt sideways / up-down. */
export function tiltHandler(maxY = 9, maxX = 7) {
  return (e) => {
    const el = target(e)
    if (!el || e.pointerType !== 'mouse' || reducedMotion()) return
    const r = el.getBoundingClientRect()
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * maxY).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * maxX).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    el.classList.add('is-tilting')
  }
}

/** onPointerLeave handler: the card settles back. */
export function settleTilt(e) {
  const el = target(e)
  if (!el) return
  for (const v of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(v)
  el.classList.remove('is-tilting')
}

/** Both handlers, to spread onto the hover area: <Link {...tiltProps()} className="tilt-3d …">. */
export function tiltProps(maxY = 6, maxX = 5) {
  return { onPointerMove: tiltHandler(maxY, maxX), onPointerLeave: settleTilt }
}
