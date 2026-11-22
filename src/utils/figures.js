// Figures written as text ("52,500+", "12 yrs", "10,00,000 lives targeted", "2014").

const PARTS = /^(\D*?)(\d[\d,]*)(.*)$/s

/** "15,301 lives impacted" → { before: '', value: 15301, grouped: true, after: ' lives impacted' }; null without a number. */
export function splitFigure(text) {
  const m = PARTS.exec(String(text ?? ''))
  if (!m) return null
  const value = Number(m[2].replace(/,/g, ''))
  if (!Number.isFinite(value)) return null
  return { before: m[1], value, grouped: m[2].includes(','), after: m[3] }
}

/** Written with commas → Indian grouping (10,00,000); without → plain (2014). */
export const formatFigure = (n, grouped) => (grouped ? new Intl.NumberFormat('en-IN').format(n) : String(n))
