import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLightbox } from '../../hooks/useLightbox'

describe('useLightbox', () => {
  it('initial state: isLightboxOpen is false and lightboxIndex is null', () => {
    const { result } = renderHook(() => useLightbox(5))
    expect(result.current.isLightboxOpen).toBe(false)
    expect(result.current.lightboxIndex).toBeNull()
  })

  it('openLightbox(index) sets isLightboxOpen to true and lightboxIndex to the given index', () => {
    const { result } = renderHook(() => useLightbox(5))

    act(() => result.current.openLightbox(2))

    expect(result.current.isLightboxOpen).toBe(true)
    expect(result.current.lightboxIndex).toBe(2)
  })

  it('openLightbox(0) works correctly with index 0', () => {
    const { result } = renderHook(() => useLightbox(3))

    act(() => result.current.openLightbox(0))

    expect(result.current.isLightboxOpen).toBe(true)
    expect(result.current.lightboxIndex).toBe(0)
  })

  it('closeLightbox() sets isLightboxOpen to false and lightboxIndex to null', () => {
    const { result } = renderHook(() => useLightbox(5))

    act(() => result.current.openLightbox(1))
    expect(result.current.isLightboxOpen).toBe(true)

    act(() => result.current.closeLightbox())
    expect(result.current.isLightboxOpen).toBe(false)
    expect(result.current.lightboxIndex).toBeNull()
  })

  it('nextLightbox() increments the index', () => {
    const { result } = renderHook(() => useLightbox(5))

    act(() => result.current.openLightbox(0))
    act(() => result.current.nextLightbox())

    expect(result.current.lightboxIndex).toBe(1)
  })

  it('nextLightbox() wraps from last index back to 0', () => {
    const { result } = renderHook(() => useLightbox(3))

    act(() => result.current.openLightbox(2)) // last index (count=3 → indices 0,1,2)
    act(() => result.current.nextLightbox())

    expect(result.current.lightboxIndex).toBe(0)
  })

  it('prevLightbox() decrements the index', () => {
    const { result } = renderHook(() => useLightbox(5))

    act(() => result.current.openLightbox(3))
    act(() => result.current.prevLightbox())

    expect(result.current.lightboxIndex).toBe(2)
  })

  it('prevLightbox() wraps from 0 to the last index', () => {
    const { result } = renderHook(() => useLightbox(4))

    act(() => result.current.openLightbox(0))
    act(() => result.current.prevLightbox())

    expect(result.current.lightboxIndex).toBe(3)
  })

  it('nextLightbox() does not crash when called while closed (lightboxIndex is null)', () => {
    const { result } = renderHook(() => useLightbox(3))

    // index is null; (null + 1) % 3 is NaN in JS but should not throw
    expect(() => act(() => result.current.nextLightbox())).not.toThrow()
  })

  it('prevLightbox() does not crash when called while closed (lightboxIndex is null)', () => {
    const { result } = renderHook(() => useLightbox(3))

    expect(() => act(() => result.current.prevLightbox())).not.toThrow()
  })

  it('multiple next calls cycle correctly through all images', () => {
    const { result } = renderHook(() => useLightbox(3))

    act(() => result.current.openLightbox(0))
    act(() => result.current.nextLightbox()) // 1
    act(() => result.current.nextLightbox()) // 2
    act(() => result.current.nextLightbox()) // wraps → 0

    expect(result.current.lightboxIndex).toBe(0)
  })

  it('multiple prev calls cycle correctly in reverse', () => {
    const { result } = renderHook(() => useLightbox(3))

    act(() => result.current.openLightbox(0))
    act(() => result.current.prevLightbox()) // wraps → 2
    act(() => result.current.prevLightbox()) // 1
    act(() => result.current.prevLightbox()) // 0

    expect(result.current.lightboxIndex).toBe(0)
  })

  it('re-opening at a different index updates lightboxIndex correctly', () => {
    const { result } = renderHook(() => useLightbox(5))

    act(() => result.current.openLightbox(1))
    expect(result.current.lightboxIndex).toBe(1)

    act(() => result.current.openLightbox(4))
    expect(result.current.lightboxIndex).toBe(4)
    expect(result.current.isLightboxOpen).toBe(true)
  })
})
