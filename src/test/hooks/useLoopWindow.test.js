import { renderHook, act } from '@testing-library/react'
import { useLoopWindow } from '../../hooks/useLoopWindow'
import { LOOP_BUDGET_MS } from '../../utils/motionPresets'

describe('useLoopWindow (WCAG 2.2.2)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('waits for active, loops for the budget, then stops for good', () => {
    const { result, rerender } = renderHook(({ on }) => useLoopWindow(on), { initialProps: { on: false } })
    expect(result.current).toBe(false)
    rerender({ on: true })
    expect(result.current).toBe(true)
    act(() => vi.advanceTimersByTime(LOOP_BUDGET_MS - 1))
    expect(result.current).toBe(true)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(false)
    rerender({ on: false }); rerender({ on: true })
    expect(result.current).toBe(false)
  })

  it('keeps counting when the element leaves the screen', () => {
    const { result, rerender } = renderHook(({ on }) => useLoopWindow(on), { initialProps: { on: true } })
    rerender({ on: false })
    act(() => vi.advanceTimersByTime(LOOP_BUDGET_MS))
    expect(result.current).toBe(false)
  })

  it('never runs longer than five seconds', () => {
    expect(LOOP_BUDGET_MS).toBeLessThanOrEqual(5000)
  })
})
