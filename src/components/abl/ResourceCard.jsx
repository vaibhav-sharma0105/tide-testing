import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import DriveImage from './DriveImage'
import ResourceTypeBadge from './ResourceTypeBadge'

export default function ResourceCard({ resource }) {
  const { t } = useTranslation()
  const grades      = resource.grades ?? []
  const shownGrades = grades.slice(0, 3)
  const extraGrades = grades.length - 3

  const languages = resource.language?.split(',').map(l => l.trim()).filter(Boolean) ?? []
  const langLabel  = languages.length > 0
    ? languages[0] + (languages.length > 1 ? ` +${languages.length - 1}` : '')
    : null

  const showConcept = resource.type !== 'Flashcards' && resource.concept
  const isOwned     = resource.ownership === 'TIDE'

  return (
    <Link
      to={`/resources/abl-resources/resource-center/${resource.id}`}
      aria-label={`View ${resource.name}`}
      className="group/card bg-white rounded-2xl border border-tide-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image with subtle zoom on hover */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <DriveImage
          id={resource.id}
          alt={resource.name ?? 'Resource'}
          imgClassName="group-hover/card:scale-105"
        />
        {resource.videoUrl && (
          <div
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            aria-label="Video available"
          >
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <ResourceTypeBadge type={resource.type} />
          {langLabel && (
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-tide-subtle text-tide-muted border-tide-border">
              {langLabel}
            </span>
          )}
        </div>

        <h3 className="font-display text-base font-semibold text-tide-text leading-snug line-clamp-2 group-hover/card:text-primary transition-colors">
          {resource.name}
        </h3>

        {showConcept && (
          <p className="text-xs font-body text-tide-muted line-clamp-1">{resource.concept}</p>
        )}

        {grades.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {shownGrades.map(g => (
              <span key={g} className="bg-primary-light text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                {g}
              </span>
            ))}
            {extraGrades > 0 && (
              <span className="bg-tide-subtle text-tide-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-tide-border">
                +{extraGrades} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOwned ? 'bg-primary' : 'bg-tide-muted'}`} />
          <span className="text-xs font-body text-tide-muted">{isOwned ? t('abl.resourceCard.tideResource', 'TIDE Resource') : t('abl.resourceCard.externalResource', 'External Resource')}</span>
        </div>
      </div>
    </Link>
  )
}
