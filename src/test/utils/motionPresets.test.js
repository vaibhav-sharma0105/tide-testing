import { describe, it, expect } from 'vitest'
import { fadeUp, makeFadeUp } from '../../utils/motionPresets'

// Expected values are the literal objects each page used to define locally,
// so these tests pin the refactor to zero change in the motion props.
const EASE = [0.4, 0, 0.2, 1]

describe('fadeUp (default preset)', () => {
  it('matches the old 24px / 0.6s literal at delay 0', () => {
    expect(fadeUp()).toEqual({
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.6, delay: 0, ease: [0.4, 0, 0.2, 1] },
    })
  })

  it('passes the delay through to transition', () => {
    expect(fadeUp(0.15)).toEqual({
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] },
    })
  })

  it('has no margin key on viewport', () => {
    expect(Object.keys(fadeUp().viewport)).toEqual(['once'])
  })
})

describe('makeFadeUp variants', () => {
  const cases = [
    ['OurPartners', { y: 16, duration: 0.45 }, {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.45, delay: 0.3, ease: EASE },
    }],
    ['y 12 / 0.35s', { y: 12, duration: 0.35 }, {
      initial: { opacity: 0, y: 12 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.35, delay: 0.3, ease: EASE },
    }],
    ['Volunteer', { y: 20, duration: 0.55 }, {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.55, delay: 0.3, ease: EASE },
    }],
    ['default y / 0.55s', { duration: 0.55 }, {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.55, delay: 0.3, ease: EASE },
    }],
    ['Home', { y: 28, duration: 0.65, margin: '-60px' }, {
      initial: { opacity: 0, y: 28 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-60px' },
      transition: { duration: 0.65, delay: 0.3, ease: EASE },
    }],
  ]

  it.each(cases)('%s', (_name, args, expected) => {
    expect(makeFadeUp(args)(0.3)).toEqual(expected)
  })

  it('defaults delay to 0', () => {
    expect(makeFadeUp({ y: 16, duration: 0.45 })().transition.delay).toBe(0)
  })

  it('makeFadeUp() with no args equals the default fadeUp', () => {
    expect(makeFadeUp()(0.2)).toEqual(fadeUp(0.2))
  })
})
