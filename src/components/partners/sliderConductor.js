import { createContext, useCallback, useContext, useEffect, useRef } from 'react'

// One clock for every partner slider on the page, so at most ONE row moves at a time — five rows
// sliding together pulls the eye everywhere at once. Every SLIDE_INTERVAL_MS the conductor picks,
// among the sliders that may move (playing, not hovered/focused/held, cards overflow, no search),
// the one that is mostly on screen (≥ VISIBLE_SHARE) and closest to the middle of the window, and
// moves it one card. Rows off screen never move; nothing moves while the tab is hidden.
// Sliders without a conductor above them (e.g. in a unit test) simply don't move on their own.

const VISIBLE_SHARE = 0.6

export const SliderConductorContext = createContext(null)

/** Page side: returns the `register` function to put in SliderConductorContext. */
export function useSliderConductor(intervalMs) {
  const members = useRef(new Map())

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return
      const vh = window.innerHeight
      let best = null
      let bestDistance = Infinity
      for (const m of members.current.values()) {
        if (!m.el || !m.canMove()) continue
        const r = m.el.getBoundingClientRect()
        if (r.height <= 0) continue
        const visible = (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height
        if (visible < VISIBLE_SHARE) continue
        const distance = Math.abs((r.top + r.bottom) / 2 - vh / 2)
        if (distance < bestDistance) { bestDistance = distance; best = m }
      }
      best?.advance()
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return useCallback((key, member) => {
    members.current.set(key, member)
    return () => members.current.delete(key)
  }, [])
}

/** Slider side: `member` = { el, canMove(), advance() } — read through a ref, so it may change freely. */
export function useConductedSlider(key, memberRef) {
  const register = useContext(SliderConductorContext)
  useEffect(() => {
    if (!register) return undefined
    return register(key, {
      get el() { return memberRef.current?.el },
      canMove: () => !!memberRef.current?.canMove(),
      advance: () => memberRef.current?.advance(),
    })
  }, [register, key, memberRef])
}
