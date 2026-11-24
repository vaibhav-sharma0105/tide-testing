import { scriptRuns } from '../../utils/scriptLang'

// Renders text from the data with each Gujarati run wrapped in <span lang="gu"> (WCAG 3.1.2;
// rules in utils/scriptLang.js). Plain English text renders as it is, with no extra element.
export default function LangText({ text }) {
  const parts = scriptRuns(text)
  if (parts.length === 1 && !parts[0].lang) return text ?? null
  return parts.map((p, i) => (p.lang ? <span key={i} lang={p.lang}>{p.text}</span> : p.text))
}
