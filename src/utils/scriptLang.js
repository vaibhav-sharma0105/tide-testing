// Language of parts (WCAG 3.1.2). The site is English (<html lang="en">), but Resource Centre titles
// typed in the Sheet are often in Gujarati script. The script itself is the evidence: a run of
// Gujarati letters is marked lang="gu", so screen readers switch to a Gujarati voice for it.
// The resource's `language` column describes the material, not its title (an "English" worksheet can
// have a Gujarati title), so it is not used. Devanagari letters inside a Gujarati run (a word such as
// "भरो" in a Gujarati title) stay part of that run; a run with no Gujarati letter is left unmarked,
// because Devanagari alone could be Hindi, Marathi or Sanskrit and nothing in the data says which.
const GU = '઀-૿'
const DEVA = 'ऀ-ॿ'
const INDIC = `${GU}${DEVA}`
// An Indic letter, then optionally anything that can sit inside a phrase (spaces, digits, punctuation)
// up to the last Indic letter: "સેન્ડ પેપર (અંગ્રેજી)" stays one run, "પરિમિતિની area ઓળખ" is two.
const RUN = new RegExp(String.raw`[${INDIC}](?:[${INDIC}\s\d.,:;!?()'"/&\-\u2013\u2014]*[${INDIC}])?\)?`, 'g')
const HAS_GU = new RegExp(`[${GU}]`)

/** Splits text into [{ text, lang }] parts; lang is 'gu' for a Gujarati run, otherwise null. */
export function scriptRuns(text) {
  if (typeof text !== 'string' || !HAS_GU.test(text)) return [{ text, lang: null }]
  const parts = []
  let at = 0
  for (const m of text.matchAll(RUN)) {
    if (!HAS_GU.test(m[0])) continue
    if (m.index > at) parts.push({ text: text.slice(at, m.index), lang: null })
    parts.push({ text: m[0], lang: 'gu' })
    at = m.index + m[0].length
  }
  if (at < text.length) parts.push({ text: text.slice(at), lang: null })
  return parts
}

/** One language for a whole string (for attributes such as alt, which can't be split):
 *  'gu' when it has more Gujarati letters than Latin ones, otherwise undefined (stays English). */
export function textLang(text) {
  if (typeof text !== 'string') return undefined
  const gu = (text.match(new RegExp(`[${GU}]`, 'g')) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length
  return gu > latin ? 'gu' : undefined
}
