import { getTabStyle, getTypeColors } from '../../config/abl'
import { TypeIcon } from './typeIcons'

// The one place a resource's type is named. `icon` adds the type's icon; `overlay` is the white
// chip that sits on a photo (the type colour on white keeps it readable on any picture).
export default function ResourceTypeBadge({ type, icon = false, overlay = false, className = '' }) {
  const style = getTabStyle(type)
  const colors = getTypeColors(type)
  const look = overlay
    ? `bg-white/95 ${colors.eyebrow} border-white shadow-sm backdrop-blur-sm`
    : colors.badge
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${look} ${className}`}>
      {icon && <TypeIcon type={type} className="h-3.5 w-3.5" />}
      {style.label}
    </span>
  )
}
