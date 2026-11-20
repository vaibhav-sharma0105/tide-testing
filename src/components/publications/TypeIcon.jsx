import { BookOpen, File, FileBarChart, FileText, Megaphone, Newspaper, Presentation, Quote } from 'lucide-react'
import { typeIconKey } from '../../utils/publicationFilters'

// One icon per type FAMILY (rules in config/publications.js TYPE_ICON_RULES), so the same kind
// of material is recognisable at a glance on both pages. Decorative: the type's own label
// (from the Sheet) is always printed beside it. One size/stroke everywhere.
const ICONS = {
  quote: Quote,
  megaphone: Megaphone,
  presentation: Presentation,
  newspaper: Newspaper,
  book: BookOpen,
  article: FileText,
  report: FileBarChart,
  file: File,
}

export default function TypeIcon({ type, className = 'h-4 w-4' }) {
  const Icon = ICONS[typeIconKey(type)] ?? File
  return <Icon className={`flex-shrink-0 ${className}`} strokeWidth={1.75} aria-hidden="true" />
}
