import { scriptRuns, textLang } from '../../utils/scriptLang'

describe('scriptRuns', () => {
  it('leaves English text as one unmarked part', () => {
    expect(scriptRuns('Shabd nu (Anusandhan)')).toEqual([{ text: 'Shabd nu (Anusandhan)', lang: null }])
  })
  it('marks a whole Gujarati title, brackets included', () => {
    expect(scriptRuns('સેન્ડ પેપર (અંગ્રેજી)')).toEqual([{ text: 'સેન્ડ પેપર (અંગ્રેજી)', lang: 'gu' }])
  })
  it('splits a mixed title into Gujarati and English runs', () => {
    expect(scriptRuns('પરિમિતિની area ઓળખ')).toEqual([
      { text: 'પરિમિતિની', lang: 'gu' }, { text: ' area ', lang: null }, { text: 'ઓળખ', lang: 'gu' },
    ])
  })
  it('keeps a Devanagari word inside a Gujarati run', () => {
    expect(scriptRuns('સંખ્યા પ્રમાણે રંગ भरो')).toEqual([{ text: 'સંખ્યા પ્રમાણે રંગ भरो', lang: 'gu' }])
  })
  it('does not guess a language for Devanagari on its own', () => {
    expect(scriptRuns('रंग भरो')).toEqual([{ text: 'रंग भरो', lang: null }])
  })
  it('passes through empty values', () => {
    expect(scriptRuns(undefined)).toEqual([{ text: undefined, lang: null }])
  })
})

describe('textLang', () => {
  it('is gu when Gujarati letters outnumber Latin ones', () => {
    expect(textLang('પરિમિતિની area ઓળખ')).toBe('gu')
    expect(textLang('Flashcards (English)')).toBeUndefined()
    expect(textLang(null)).toBeUndefined()
  })
})
