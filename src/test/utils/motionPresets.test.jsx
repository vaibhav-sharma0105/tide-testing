// The site's one motion system (src/utils/motionPresets.js, 2026-11-24) and the one count-up
// (src/components/ui/CountUpText.jsx).
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { fadeUp, revealDelay, REVEAL, EASE_OUT } from '../../utils/motionPresets'
import CountUpText from '../../components/ui/CountUpText'

describe('fadeUp', () => {
  it('is a short rise and a quick fade on the fast-start curve, once, starting as it reaches the window', () => {
    expect(fadeUp()).toEqual({
      initial: { opacity: 0, y: REVEAL.y },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: REVEAL.margin },
      transition: { duration: REVEAL.duration, delay: 0, ease: EASE_OUT },
    })
    expect(REVEAL.y).toBeLessThanOrEqual(12)
    expect(REVEAL.duration).toBeLessThanOrEqual(0.5)
  })

  it('scales old delays down and never waits longer than REVEAL.maxDelay', () => {
    expect(fadeUp(0.1).transition.delay).toBeCloseTo(0.04)
    expect(fadeUp(0.1 + 5 * 0.15).transition.delay).toBe(REVEAL.maxDelay)
    expect(fadeUp(-1).transition.delay).toBe(0)
  })
})

describe('revealDelay', () => {
  it('staggers a row by REVEAL.stagger and caps the whole row', () => {
    expect(revealDelay(0)).toBe(0)
    expect(revealDelay(2)).toBeCloseTo(2 * REVEAL.stagger)
    expect(revealDelay(40)).toBe(REVEAL.maxDelay)
  })
})

describe('CountUpText', () => {
  it('reserves the final width and gives screen readers the final text', () => {
    const { container } = render(<CountUpText text="52,500+" />)
    expect(container.querySelector('.invisible').textContent).toBe('52,500+')
    expect(container.querySelector('.sr-only').textContent).toBe('52,500+')
  })

  it('never shows a figure far from the real one (counts from 80%, not 0)', () => {
    const { container } = render(<CountUpText text="1000" />)
    const shown = Number(container.querySelector('.absolute').textContent)
    expect(shown).toBeGreaterThanOrEqual(800)
  })

  it('shows small numbers and text as they are, without counting', () => {
    const { container: small } = render(<CountUpText text="12 yrs" />)
    expect(small.textContent).toBe('12 yrs')
    expect(small.querySelector('.invisible')).toBeNull()
    const { container: words } = render(<CountUpText text="Grades 1–5" />)
    expect(words.textContent).toBe('Grades 1–5')
  })
})
