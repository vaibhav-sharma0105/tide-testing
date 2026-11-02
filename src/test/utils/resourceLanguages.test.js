import { describe, it, expect } from 'vitest'
import { parseLanguages } from '../../utils/resourceLanguages'

describe('parseLanguages', () => {
  it('splits and trims a comma-separated cell', () => {
    expect(parseLanguages('English, Gujarati')).toEqual(['English', 'Gujarati'])
  })
  it('drops "No Language" in any case, so no badge is shown', () => {
    expect(parseLanguages('No Language')).toEqual([])
    expect(parseLanguages('no language')).toEqual([])
    expect(parseLanguages('English, No Language')).toEqual(['English'])
  })
  it('handles an empty or missing cell', () => {
    expect(parseLanguages('')).toEqual([])
    expect(parseLanguages(undefined)).toEqual([])
    expect(parseLanguages(null)).toEqual([])
  })
})
