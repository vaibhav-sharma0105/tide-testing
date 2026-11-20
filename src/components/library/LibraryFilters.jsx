import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { TypeIcon } from '../abl/typeIcons'
// The Subject / Ownership picker and the focus-ring helper are shared with other listing pages.
import PickerField from '../listing/PickerField'
import { focusRing } from '../../utils/focusRing'
import { libraryTypeColors, libraryTypeKey } from '../../config/library'
import { LIBRARY_GRADES, gradeLabel, orderFilterOptions, OWNER_PINNED } from '../../utils/libraryFilters'
import data from '../../data/pramaan-library.json'

const f = data.filters

function FilterSection({ title, children, open, onToggle, labelId }) {
  if (labelId) {
    return (
      <div className="border-b border-tide-border last:border-b-0">
        <h3 id={labelId} className="px-5 pt-3.5 pb-2 text-[11px] font-body font-bold uppercase tracking-widest text-tide-muted">{title}</h3>
        <div className="px-3 pb-4">{children}</div>
      </div>
    )
  }
  return (
    <div className="border-b border-tide-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-body font-bold uppercase tracking-widest text-tide-muted hover:text-tide-text transition-colors duration-150 ${focusRing('focus-visible:rounded-xl')}`}
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
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
            <div className="px-3 pb-4 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const pill = (active) => `px-3.5 py-1.5 rounded-full text-xs font-body font-semibold border transition-all duration-150 ${focusRing('focus-visible:rounded-full')} ${
  active ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' : 'bg-primary-faint text-primary-dark border-primary/20 hover:border-primary/50 hover:bg-primary-light'
}`

// Sidebar filters, broadest first: who made it (ownership), what it is (type of material), then
// subject and grade. Search and sorting live in the toolbar above the cards. Language is
// deliberately not a filter (stakeholder decision).
// variant 'card' (desktop sidebar: own card + heading) or 'drawer' (phone panel: the drawer
// already has the heading, Clear and close, so the filters sit flat inside it).
export default function LibraryFilters({ options, filters, onChange, onClear, activeCount, variant = 'card' }) {
  const [open, setOpen] = useState({ type: true, grades: true })
  const [picker, setPicker] = useState(null) // which picker is open: 'owner' | 'subject' | null
  const ownerLabelId = useId()
  const subjectLabelId = useId()
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className={variant === 'drawer' ? 'bg-white' : 'bg-white rounded-3xl border border-tide-border shadow-card overflow-hidden'}>
      {variant !== 'drawer' && (
      <div className="flex items-center justify-between px-5 py-3 border-b border-tide-border">
        <span className="relative font-display text-base font-semibold text-tide-text after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-6 after:bg-accent">{f.heading}</span>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className={`flex items-center gap-1.5 text-xs font-body text-tide-muted hover:text-primary transition-colors duration-150 ${focusRing('focus-visible:rounded-md')}`}>
            <X className="w-3 h-3" aria-hidden="true" />
            {f.clear} ({activeCount})
          </button>
        )}
      </div>
      )}

      {options.owners.length > 0 && (
        <FilterSection title={f.ownershipTitle} labelId={ownerLabelId}>
          <PickerField
            labelId={ownerLabelId}
            options={orderFilterOptions(options.owners, OWNER_PINNED)}
            value={filters.owner}
            onSelect={owner => set({ owner })}
            allLabel={f.allOwners}
            total={options.totals.owner}
            open={picker === 'owner'}
            onOpenChange={o => setPicker(o ? 'owner' : null)}
            removeTemplate={f.removeTemplate}
            optionCountTemplate={f.optionCountTemplate}
          />
        </FilterSection>
      )}

      {options.types.length > 0 && (
        <FilterSection title={f.typeTitle} open={open.type} onToggle={() => toggle('type')}>
          <div className="space-y-2 px-1">
            <button
              type="button"
              onClick={() => set({ type: '' })}
              aria-pressed={!filters.type}
              className={`flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 font-body text-sm font-semibold transition-all duration-200 ${focusRing('focus-visible:rounded-2xl')} ${
                !filters.type ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25' : 'border-tide-border bg-white text-tide-muted hover:border-primary/40 hover:text-primary'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1 text-left">{f.allTypes}</span>
              <span className={`text-xs font-medium tabular-nums ${!filters.type ? 'text-white' : 'text-tide-muted'}`}>{options.totals.type}</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {options.types.map(o => {
                const colors = libraryTypeColors(o.label)
                const active = filters.type === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set({ type: active ? '' : o.value })}
                    aria-pressed={active}
                    className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left font-body transition-all duration-200 ${focusRing('focus-visible:rounded-2xl')} ${
                      active ? `${colors.selectedTile} -translate-y-0.5` : `${colors.tint} hover:-translate-y-0.5 hover:shadow-card`
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-white/80'}`}>
                      <TypeIcon type={libraryTypeKey(o.label)} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight break-words">{o.label}</span>
                      <span className={`block text-xs font-medium tabular-nums ${active ? 'text-white' : ''}`}>{o.count}</span>
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
      )}

      {options.subjects.length > 0 && (
        <FilterSection title={f.subjectTitle} labelId={subjectLabelId}>
          <PickerField
            labelId={subjectLabelId}
            options={orderFilterOptions(options.subjects)}
            value={filters.subject}
            onSelect={subject => set({ subject })}
            allLabel={f.allSubjects}
            total={options.totals.subject}
            open={picker === 'subject'}
            onOpenChange={o => setPicker(o ? 'subject' : null)}
            removeTemplate={f.removeTemplate}
            optionCountTemplate={f.optionCountTemplate}
          />
        </FilterSection>
      )}

      <FilterSection title={f.gradesTitle} open={open.grades} onToggle={() => toggle('grades')}>
        <div className="flex flex-wrap gap-2 px-1">
          {LIBRARY_GRADES.map(g => {
            const active = filters.grades.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => set({ grades: active ? filters.grades.filter(x => x !== g) : [...filters.grades, g] })}
                aria-pressed={active}
                className={pill(active)}
              >
                {gradeLabel(g)}
              </button>
            )
          })}
        </div>
      </FilterSection>
    </div>
  )
}
