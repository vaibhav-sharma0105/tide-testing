import { useState, useRef, useEffect } from 'react'

/**
 * Pin a listing sidebar only while it fits in the window; a taller sidebar (e.g. a picker list
 * open on a short laptop screen) scrolls with the page instead of getting a second scrollbar.
 * `top` is the sticky offset in px (must match the `top-[…]` class used when sticky).
 * Returns [ref for the sidebar element, sticky?].
 */
export function useSidebarFits(top) {
  const ref = useRef(null)
  const [sticky, setSticky] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const check = () => setSticky(el.offsetHeight + top + 16 <= window.innerHeight)
    check()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
    ro?.observe(el)
    window.addEventListener('resize', check)
    return () => { ro?.disconnect(); window.removeEventListener('resize', check) }
  }, [top])
  return [ref, sticky]
}
