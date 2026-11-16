import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import DriveImage from '../abl/DriveImage'
import LibraryTypeBadge from './LibraryTypeBadge'
import { libraryTypeColors } from '../../config/library'
import { getLibraryPhoto } from '../../utils/libraryPhotos'
import { gradeLabel, sortGrades } from '../../utils/libraryFilters'
import data from '../../data/pramaan-library.json'



// One resource: photo, type, subject, name, description, grades and who owns it.
export default function LibraryCard({ resource }) {
  const colors = libraryTypeColors(resource.type)
  const grades = sortGrades(resource.grades)
  const shown = grades.slice(0, 3)
  return (
    <Link
      to={`/pramaan-library/${encodeURIComponent(resource.id)}`}
      aria-label={data.card.viewTemplate.replace('{name}', () => resource.name)}
      className="group/card relative w-full bg-white rounded-3xl border border-tide-border shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <span className={`absolute inset-x-0 top-0 z-10 h-1.5 ${colors.solid} opacity-75 transition-opacity duration-300 group-hover/card:opacity-100`} aria-hidden="true" />
      <div className="relative overflow-hidden">
        <DriveImage
          id={resource.id}
          src={getLibraryPhoto(resource.id, 'thumb')}
          alt={resource.name ?? data.card.imageAltFallback}
          imgClassName="group-hover/card:scale-105"
        />
        <div className="absolute left-3 top-4">
          <LibraryTypeBadge type={resource.type} overlay />
        </div>
        {resource.videoUrl && (
          <div
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-navy/60 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            aria-label={data.card.videoAvailable}
          >
            <Play className="w-3 h-3 text-white fill-white translate-x-px" />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        {resource.subject && (
          <p className={`text-[11px] font-body font-bold uppercase tracking-widest ${colors.eyebrow}`}>{resource.subject}</p>
        )}
        <h3 className={`font-display text-base font-semibold text-tide-text leading-snug line-clamp-2 transition-colors ${colors.titleHover.replace('group-hover:', 'group-hover/card:')}`}>
          {resource.name}
        </h3>
        {resource.description && (
          <p className="text-sm font-body text-tide-muted leading-relaxed line-clamp-3">{resource.description}</p>
        )}
        {grades.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {shown.map(g => (
              <span key={g} className="bg-primary-light text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">{gradeLabel(g)}</span>
            ))}
            {grades.length > 3 && (
              <span className="bg-tide-subtle text-tide-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-tide-border">
                {data.card.moreGradesTemplate.replace('{n}', () => grades.length - 3)}
              </span>
            )}
          </div>
        )}
        {resource.ownership && (
          <div className="mt-auto flex items-center gap-1.5 border-t border-tide-border/70 pt-3 text-xs font-body text-tide-muted">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span className="sr-only">{data.card.ownedBy}</span>
            <span className="line-clamp-1">{resource.ownership}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
