import { useId } from 'react'

// "Publications per year" — a single-series column chart for the dark page banner, counted from
// the snapshot rows (yearCounts: every year from the first to the last, 0 included, so the time
// axis is even). One series, so no legend: the title names it.
// Marks (dataviz spec): columns ≤ 24px wide, 4px rounded top, square on one hairline baseline;
// colour accent-dark (#D97706, passes the palette validator on the banner navy, 3:1+), the
// hovered/focused/selected column accent (#F59E0B). Text stays in white text tokens, never the
// series colour. Only the tallest column (and the hovered/selected one) carries its number;
// every column's number is in its accessible label.
// With onSelect, each column is a toggle button (aria-pressed) that filters the list by year;
// years with 0 are not buttons. Text from the page's YAML (`labels` = data.chart, `noun(n)`).

const MAX_YEAR_LABELS = 8

export default function YearChart({ counts, selected = '', onSelect, labels, noun }) {
  const titleId = useId()
  if (!counts.length) return null
  const max = Math.max(...counts.map(c => c.count), 1)
  const every = Math.ceil(counts.length / MAX_YEAR_LABELS)
  const barLabel = (c) => labels.barLabelTemplate
    .replace('{year}', String(c.year)).replace('{n}', String(c.count)).replace('{publications}', () => noun(c.count))
  const anySelected = counts.some(c => String(c.year) === selected)

  return (
    <figure className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-5 md:p-6">
      <figcaption>
        <span id={titleId} className="block font-body text-sm font-semibold text-white">{labels.title}</span>
        {onSelect && labels.hint && <span className="mt-1 block font-body text-xs text-white/70">{labels.hint}</span>}
      </figcaption>
      <div role="group" aria-labelledby={titleId} className="mt-5">
        <ol className="flex h-36 items-stretch gap-0.5 border-b border-white/25 pt-6 md:h-40">
          {counts.map(c => {
            const isSel = String(c.year) === selected
            const isMax = c.count === max
            const h = `${(c.count / max) * 100}%`
            const bar = (
              <>
                {c.count > 0 && (
                  <span
                    className={`absolute bottom-0 left-1/2 w-[min(24px,70%)] -translate-x-1/2 rounded-t-[4px] transition-[background-color,opacity] duration-150 motion-reduce:transition-none ${
                      isSel ? 'bg-accent' : 'bg-accent-dark group-hover:bg-accent group-focus-visible:bg-accent'
                    } ${anySelected && !isSel ? 'opacity-45' : ''}`}
                    style={{ height: h }}
                  />
                )}
                <span
                  className={`absolute left-1/2 -translate-x-1/2 font-body text-xs font-semibold tabular-nums text-white ${
                    isSel || (isMax && !anySelected) ? '' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                  style={{ bottom: `calc(${h} + 4px)` }}
                  aria-hidden="true"
                >
                  {c.count}
                </span>
              </>
            )
            return (
              <li key={c.year} className="relative min-w-0 flex-1">
                {onSelect && c.count > 0 ? (
                  <button
                    type="button"
                    aria-pressed={isSel}
                    aria-label={`${barLabel(c)}. ${labels.filterAction}`}
                    onClick={() => onSelect(isSel ? '' : String(c.year))}
                    className="group absolute inset-0 -bottom-px cursor-pointer rounded-t-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {bar}
                  </button>
                ) : (
                  <span className="group absolute inset-0" role="img" aria-label={barLabel(c)}>{bar}</span>
                )}
              </li>
            )
          })}
        </ol>
        <ol className="mt-2 flex gap-0.5" aria-hidden="true">
          {counts.map((c, i) => (
            <li key={c.year} className="min-w-0 flex-1 text-center font-body text-[11px] tabular-nums text-white/70">
              {(i % every === 0 || i === counts.length - 1) && (counts.length <= MAX_YEAR_LABELS ? c.year : `’${String(c.year).slice(2)}`)}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  )
}
