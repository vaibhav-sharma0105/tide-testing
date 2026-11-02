import { X } from 'lucide-react'
import { getTabStyle, getTypeColors } from '../../config/abl'
import { TypeIcon } from './typeIcons'
import rcData from '../../data/abl-resource-center.json'

// What is filtering the list right now, as removable chips above the results, so nobody has to
// open the sidebar (or the mobile drawer) to find out why a list is short. A type chip wears the
// type's colour; the rest are brand blue.
export default function ActiveFilters({ filters, onChange, onClear }) {
  const chips = []
  if (filters.search) chips.push({ key: 'search', label: `“${filters.search}”`, next: { ...filters, search: '' } })
  if (filters.type) {
    chips.push({
      key: 'type', label: getTabStyle(filters.type).pluralLabel, type: filters.type,
      next: { ...filters, type: '' },
    })
  }
  filters.grades.forEach(g => chips.push({
    key: `grade-${g}`, label: rcData.filters.gradeTemplate.replace('{n}', g.replace('GRADE ', '')),
    next: { ...filters, grades: filters.grades.filter(x => x !== g) },
  }))
  if (filters.language) chips.push({ key: 'language', label: filters.language, next: { ...filters, language: '' } })
  if (filters.ownership) {
    chips.push({
      key: 'ownership', label: filters.ownership === 'TIDE' ? rcData.filters.tideOwned : rcData.filters.external,
      next: { ...filters, ownership: '' },
    })
  }
  if (!chips.length) return null

  return (
    <ul className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map(c => {
        const colors = c.type ? getTypeColors(c.type) : null
        return (
          <li key={c.key}>
            <button
              type="button"
              onClick={() => onChange(c.next)}
              aria-label={rcData.filters.removeTemplate.replace('{name}', c.label)}
              className={`group inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 font-body text-xs font-semibold transition-all duration-200 hover:shadow-sm ${
                colors ? colors.badge : 'border-primary/25 bg-primary-light text-primary-dark'
              }`}
            >
              {c.type && <TypeIcon type={c.type} className="h-3.5 w-3.5" />}
              {c.label}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/5 transition-colors group-hover:bg-black/15" aria-hidden="true">
                <X className="h-3 w-3" />
              </span>
            </button>
          </li>
        )
      })}
      {chips.length > 1 && (
        <li>
          <button type="button" onClick={onClear} className="rounded-full px-3 py-1 font-body text-xs font-semibold text-tide-muted transition-colors hover:text-primary">
            {rcData.filters.clear}
          </button>
        </li>
      )}
    </ul>
  )
}
