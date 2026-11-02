import { createElement } from 'react'
import { BookOpen, FileText, Gamepad2, Layers, Package } from 'lucide-react'

// Icons cannot live in YAML or JSON: one per resource type (by Sheet tab), used by the type badge,
// the /pramaan type cards and the Resource Centre filter, so a type wears the same icon everywhere.
const TYPE_ICONS = { Worksheet: FileText, Games: Gamepad2, Kits: Package, Flashcards: Layers }

export function TypeIcon({ type, className }) {
  return createElement(TYPE_ICONS[type] ?? BookOpen, { className, 'aria-hidden': true })
}
