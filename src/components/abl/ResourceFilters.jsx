import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { GRADES, getTabStyle, getTypeColors } from '../../config/abl'
import { TypeIcon } from './typeIcons'
import rcData from '../../data/abl-resource-center.json'

function FilterSection({ title, children, open, onToggle }) {
  return (
    <div className="border-b border-tide-border last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-body font-bold uppercase tracking-widest text-tide-muted hover:text-tide-text transition-colors duration-150"
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ResourceFilters({ allResources, filters, onChange, onClear, tabs, data }) {
  const [open, setOpen] = useState({ type: true, grades: true, language: false, ownership: false })
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  const languages = [...new Set(
    allResources.flatMap(r => r.language?.split(',').map(s => s.trim()) ?? [])
  )].filter(Boolean).sort()

  const hasExternal = allResources.some(r => r.ownership !== 'TIDE')

  const activeCount = [
    filters.search,
    filters.type,
    ...filters.grades,
    filters.language,
    filters.ownership,
  ].filter(Boolean).length

  const inputCls = 'w-full pl-3 pr-8 py-2 rounded-xl border border-tide-border bg-white text-sm font-body text-tide-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

  const sortedTabs = tabs.slice().sort((a, b) => getTabStyle(a).pluralLabel.localeCompare(getTabStyle(b).pluralLabel))
  const allActive = !filters.type

  return (
    <div className="bg-white rounded-3xl border border-tide-border shadow-card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-tide-border">
        <span className="relative font-display text-base font-semibold text-tide-text after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-6 after:bg-accent">{rcData.filters.heading}</span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-body text-tide-muted hover:text-primary transition-colors duration-150"
          >
            <X className="w-3 h-3" />
            {rcData.filters.clear} ({activeCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-tide-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tide-muted pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder={rcData.filters.searchPlaceholder}
            aria-label={rcData.filters.searchLabel}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-tide-border bg-white text-sm font-body placeholder:text-tide-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Resource Type: four colour-coded tiles (the same colours and icons as the badges on the cards) */}
      <FilterSection title={rcData.filters.typeTitle} open={open.type} onToggle={() => toggle('type')}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, type: '' })}
            aria-pressed={allActive}
            className={`flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 font-body text-sm font-semibold transition-all duration-200 ${
              allActive
                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                : 'border-tide-border bg-white text-tide-muted hover:border-primary/40 hover:text-primary'
            }`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1 text-left">{rcData.filters.allTypes}</span>
            <span className={`text-xs font-medium tabular-nums ${allActive ? 'text-white/80' : 'text-tide-muted'}`}>{allResources.length}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {sortedTabs.map(tab => {
              const style = getTabStyle(tab)
              const colors = getTypeColors(tab)
              const active = filters.type === tab
              const count = data?.meta?.counts?.[tab] ?? allResources.filter(r => r.tab === tab).length
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onChange({ ...filters, type: active ? '' : tab })}
                  aria-pressed={active}
                  className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left font-body transition-all duration-200 ${
                    active ? `${colors.selectedTile} -translate-y-0.5` : `${colors.tint} hover:-translate-y-0.5 hover:shadow-card`
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-white/80'}`}>
                    <TypeIcon type={tab} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{style.pluralLabel}</span>
                    <span className={`block text-xs font-medium tabular-nums ${active ? 'text-white/85' : 'opacity-70'}`}>{count}</span>
                  </span>
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/25" aria-hidden="true">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </FilterSection>

      {/* Grades */}
      <FilterSection title={rcData.filters.gradesTitle} open={open.grades} onToggle={() => toggle('grades')}>
        <div className="flex flex-wrap gap-2">
          {GRADES.map(g => {
            const active = filters.grades.includes(g)
            return (
              <button
                key={g}
                onClick={() => {
                  const next = active
                    ? filters.grades.filter(x => x !== g)
                    : [...filters.grades, g]
                  onChange({ ...filters, grades: next })
                }}
                aria-pressed={active}
                className={`px-3.5 py-1.5 rounded-full text-xs font-body font-semibold border transition-all duration-150 ${
                  active
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                    : 'bg-primary-faint text-primary-dark border-primary/20 hover:border-primary/50 hover:bg-primary-light'
                }`}
              >
                {rcData.filters.gradeTemplate.replace('{n}', g.replace('GRADE ', ''))}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Language */}
      {languages.length > 1 && (
        <FilterSection title={rcData.filters.languageTitle} open={open.language} onToggle={() => toggle('language')}>
          <select
            value={filters.language}
            onChange={e => onChange({ ...filters, language: e.target.value })}
            aria-label={rcData.filters.languageLabel}
            className={inputCls}
          >
            <option value="">{rcData.filters.allLanguages}</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FilterSection>
      )}

      {/* Ownership */}
      <FilterSection title={rcData.filters.ownershipTitle} open={open.ownership} onToggle={() => toggle('ownership')}>
        <select
          value={filters.ownership}
          onChange={e => onChange({ ...filters, ownership: e.target.value })}
          aria-label={rcData.filters.ownershipLabel}
          className={inputCls}
        >
          <option value="">{rcData.filters.allResources}</option>
          <option value="TIDE">{rcData.filters.tideOwned}</option>
          {hasExternal && <option value="external">{rcData.filters.external}</option>}
        </select>
      </FilterSection>
    </div>
  )
}
