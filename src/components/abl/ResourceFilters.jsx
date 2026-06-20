import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TAB_STYLE_MAP } from '../../config/abl'

const GRADES = ['GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

function FilterSection({ title, children, open, onToggle }) {
  return (
    <div className="border-b border-tide-border last:border-b-0">
      <button
        onClick={onToggle}
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
  const { t } = useTranslation()
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

  const inputCls = 'w-full pl-3 pr-8 py-2 rounded-lg border border-tide-border bg-tide-subtle text-sm font-body text-tide-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

  return (
    <div className="bg-white rounded-2xl border border-tide-border overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-tide-border">
        <span className="font-display text-sm font-semibold text-tide-text">{t('abl.resourceCenter.filterType', 'Filters')}</span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-body text-tide-muted hover:text-primary transition-colors duration-150"
          >
            <X className="w-3 h-3" />
            {t('abl.resourceCenter.clearFilters', 'Clear')} ({activeCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-tide-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tide-muted pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder={t('abl.resourceCenter.searchPlaceholder', 'Search resources…')}
            aria-label={t('abl.resourceCenter.searchPlaceholder', 'Search resources')}

            className="w-full pl-8 pr-3 py-2 rounded-lg border border-tide-border bg-tide-subtle text-sm font-body placeholder:text-tide-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Resource Type */}
      <FilterSection title={t('abl.resourceCenter.filterType', 'Resource Type')} open={open.type} onToggle={() => toggle('type')}>
        <div className="space-y-0.5">
          {/* All */}
          <RadioRow
            label={t('abl.resourceCenter.filterAll', 'All types')}
            count={allResources.length}
            active={!filters.type}
            onClick={() => onChange({ ...filters, type: '' })}
          />
          {tabs
            .slice()
            .sort((a, b) => {
              const labelA = (TAB_STYLE_MAP[a] ?? TAB_STYLE_MAP._default).pluralLabel
              const labelB = (TAB_STYLE_MAP[b] ?? TAB_STYLE_MAP._default).pluralLabel
              return labelA.localeCompare(labelB)
            })
            .map(tab => {
            const style = TAB_STYLE_MAP[tab] ?? TAB_STYLE_MAP._default
            const count = data?.meta?.counts?.[tab] ?? allResources.filter(r => r.tab === tab).length
            return (
              <RadioRow
                key={tab}
                label={style.pluralLabel}
                count={count}
                active={filters.type === tab}
                onClick={() => onChange({ ...filters, type: filters.type === tab ? '' : tab })}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* Grades */}
      <FilterSection title={t('abl.resourceCenter.filterGrade', 'Grades')} open={open.grades} onToggle={() => toggle('grades')}>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold border transition-all duration-150 ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-tide-subtle text-tide-muted border-tide-border hover:border-primary/40 hover:text-primary hover:bg-primary-light'
                }`}
              >
                {g.replace('GRADE ', 'Grade ')}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Language */}
      {languages.length > 1 && (
        <FilterSection title={t('abl.resourceCenter.filterLanguage', 'Language')} open={open.language} onToggle={() => toggle('language')}>
          <select
            value={filters.language}
            onChange={e => onChange({ ...filters, language: e.target.value })}
            aria-label={t('abl.resourceCenter.filterLanguage', 'Filter by language')}
            className={inputCls}
          >
            <option value="">{t('abl.resourceCenter.filterAll', 'All Languages')}</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FilterSection>
      )}

      {/* Ownership */}
      <FilterSection title={t('abl.resourceCenter.filterOwnership', 'Ownership')} open={open.ownership} onToggle={() => toggle('ownership')}>
        <select
          value={filters.ownership}
          onChange={e => onChange({ ...filters, ownership: e.target.value })}
          aria-label={t('abl.resourceCenter.filterOwnership', 'Filter by ownership')}
          className={inputCls}
        >
          <option value="">{t('abl.resourceCenter.filterAll', 'All Resources')}</option>
          <option value="TIDE">{t('abl.resourceCenter.filterTide', 'TIDE Owned')}</option>
          {hasExternal && <option value="external">{t('abl.resourceCenter.filterExternal', 'External')}</option>}
        </select>
      </FilterSection>
    </div>
  )
}

function RadioRow({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body transition-colors duration-150 ${
        active ? 'bg-primary-light text-primary font-semibold' : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        active ? 'border-primary bg-primary' : 'border-tide-border'
      }`}>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span className="text-xs text-tide-muted font-normal tabular-nums">{count}</span>
    </button>
  )
}
