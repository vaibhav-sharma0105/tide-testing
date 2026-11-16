import { TypeIcon } from '../abl/typeIcons'
import { libraryTypeColors, libraryTypeKey } from '../../config/library'

// A library resource's type, written exactly as the Sheet has it, in the matching Pramaan colour.
export default function LibraryTypeBadge({ type, overlay = false, className = '' }) {
  if (!type) return null
  const colors = libraryTypeColors(type)
  const look = overlay ? `bg-white/95 ${colors.eyebrow} border-white shadow-sm backdrop-blur-sm` : colors.badge
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${look} ${className}`}>
      <TypeIcon type={libraryTypeKey(type)} className="h-3.5 w-3.5" />
      {type}
    </span>
  )
}
