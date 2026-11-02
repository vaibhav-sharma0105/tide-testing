import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import DriveImage from './DriveImage'
import ResourceTypeBadge from './ResourceTypeBadge'
import { getTypeColors } from '../../config/abl'
import { parseLanguages } from '../../utils/resourceLanguages'
import rcData from '../../data/abl-resource-center.json'

export default function ResourceCard({ resource }) {
  const grades      = resource.grades ?? []
  const shownGrades = grades.slice(0, 3)
  const extraGrades = grades.length - 3

  const languages = parseLanguages(resource.language)
  const langLabel  = languages.length > 0
    ? languages[0] + (languages.length > 1 ? ` +${languages.length - 1}` : '')
    : null

  const showConcept = resource.type !== 'Flashcards' && resource.concept
  const isOwned     = resource.ownership === 'TIDE'
  // The Sheet tab is the reliable type: a row's own `type` text is free-typed ("Kit", "Flashcard", even typos)
  const kind        = resource.tab ?? resource.type
  const colors      = getTypeColors(kind)

  return (
    <Link
      to={`/pramaan/resource-centre/${resource.id}`}
      aria-label={rcData.card.viewTemplate.replace('{name}', () => resource.name)}
      className="group/card relative w-full bg-white rounded-3xl border border-tide-border shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* the type's colour as a band along the top: read at a glance before any text */}
      <span className={`absolute inset-x-0 top-0 z-10 h-1.5 ${colors.solid} opacity-75 transition-opacity duration-300 group-hover/card:opacity-100`} aria-hidden="true" />

      {/* Image with subtle zoom on hover; the type sits on the photo, where the eye lands first */}
      <div className="relative overflow-hidden">
        <DriveImage
          id={resource.id}
          alt={resource.name ?? rcData.card.imageAltFallback}
          imgClassName="group-hover/card:scale-105"
        />
        <div className="absolute left-3 top-4">
          <ResourceTypeBadge type={kind} icon overlay />
        </div>
        {resource.videoUrl && (
          <div
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-navy/60 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            aria-label={rcData.card.videoAvailable}
          >
            <Play className="w-3 h-3 text-white fill-white translate-x-px" />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className={`font-display text-base font-semibold text-tide-text leading-snug line-clamp-2 transition-colors ${colors.titleHover.replace('group-hover:', 'group-hover/card:')}`}>
          {resource.name}
        </h3>

        {showConcept && (
          <p className="text-xs font-body text-tide-muted line-clamp-1">{resource.concept}</p>
        )}

        {grades.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {shownGrades.map(g => (
              <span key={g} className="bg-primary-light text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                {g}
              </span>
            ))}
            {extraGrades > 0 && (
              <span className="bg-tide-subtle text-tide-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-tide-border">
                {rcData.card.moreGradesTemplate.replace('{n}', () => extraGrades)}
              </span>
            )}
          </div>
        )}

        {/* footer: who it belongs to, and its language */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-tide-border/70 pt-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOwned ? 'bg-primary' : 'bg-tide-muted'}`} />
            <span className="text-xs font-body text-tide-muted">{isOwned ? rcData.card.tideResource : rcData.card.externalResource}</span>
          </span>
          {langLabel && (
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-tide-subtle text-tide-muted border-tide-border">
              {langLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
