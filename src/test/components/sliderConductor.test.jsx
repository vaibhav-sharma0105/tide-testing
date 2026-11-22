// The partner sliders' shared clock: at most one row moves per tick — the eligible one that is
// mostly on screen and nearest the middle of the window (src/components/partners/sliderConductor.js).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSliderConductor } from '../../components/partners/sliderConductor'

const rect = (top, height = 200) => ({ getBoundingClientRect: () => ({ top, bottom: top + height, height }) })
const member = (el, canMove = true) => ({ el, canMove: () => canMove, advance: vi.fn() })

afterEach(() => { vi.useRealTimers() })

describe('useSliderConductor', () => {
  it('moves only the movable, visible row nearest the middle of the window', () => {
    vi.useFakeTimers()
    window.innerHeight = 800
    const { result } = renderHook(() => useSliderConductor(1000))
    const centre = member(rect(300))        // middle 400 = window middle
    const higher = member(rect(0))          // visible, further from the middle
    const paused = member(rect(310), false) // nearest, but may not move
    const offscreen = member(rect(900))     // below the window
    const half = member(rect(700))          // only half on screen
    for (const [k, m] of Object.entries({ centre, higher, paused, offscreen, half })) result.current(k, m)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(centre.advance).toHaveBeenCalledTimes(1)
    for (const m of [higher, paused, offscreen, half]) expect(m.advance).not.toHaveBeenCalled()
  })

  it('stops moving a row once it unregisters, and nothing moves while the tab is hidden', () => {
    vi.useFakeTimers()
    window.innerHeight = 800
    const { result } = renderHook(() => useSliderConductor(1000))
    const a = member(rect(300))
    const unregister = result.current('a', a)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(a.advance).not.toHaveBeenCalled()
    hidden.mockRestore()
    unregister()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(a.advance).not.toHaveBeenCalled()
  })
})
