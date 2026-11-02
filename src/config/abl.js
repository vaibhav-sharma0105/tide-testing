import ablHome from '../data/abl-home.json'

export const ABL_API_URL          = import.meta.env.VITE_ABL_API_URL          ?? ''
export const CONTRIBUTE_FORM_URL  = import.meta.env.VITE_ABL_CONTRIBUTE_FORM_URL ?? ''
export const ABL_CACHE_TTL_MS     = 15 * 60 * 1000
export const ABL_PAGE_SIZE        = 24

// Grade labels exactly as the Sheet writes them (also the keys of resource.chapters).
// Single source for the filter sidebar and the detail page; add a grade here and both pick it up.
export const GRADES = ['GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

// Colour per resource type stays in code (maps to Tailwind class lookups in the
// consuming components). The visible label/pluralLabel text lives in
// content/pages/abl-home.yaml → resourceTypes.labels.<Tab>.
const TAB_COLORS = {
  Worksheet:  'blue',
  Games:      'emerald',
  Kits:       'violet',
  Flashcards: 'amber',
  _default:   'gray',
}

export const TAB_STYLE_MAP = Object.fromEntries(
  Object.entries(TAB_COLORS).map(([tab, color]) => [
    tab,
    { color, label: ablHome.resourceTypes.labels[tab].label, pluralLabel: ablHome.resourceTypes.labels[tab].pluralLabel },
  ])
)

// The one palette for resource types. Every place that colours a type (badges, the type cards on
// /pramaan, the filter list, card hover bars, the detail page) reads from here through its colour
// name, so a type is the same colour on every screen. Class names are written out in full so
// Tailwind can see them; solid fills carry white text or icons, so they are the -600/-700 shades.
export const TYPE_COLORS = {
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200', eyebrow: 'text-blue-700', solid: 'bg-blue-600',
    soft: 'bg-blue-50 text-blue-700', tint: 'bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-800 border-blue-200',
    selectedTile: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30',
    poster: 'from-blue-50 via-white to-blue-100', heroBadge: 'bg-blue-400/20 text-blue-100 border-blue-300/50',
    tileHover: 'group-hover:bg-blue-600 group-hover:text-white', cardHover: 'hover:border-blue-300 hover:bg-blue-50/40',
    titleHover: 'group-hover:text-blue-700',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', eyebrow: 'text-emerald-700', solid: 'bg-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700', tint: 'bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-200',
    selectedTile: 'bg-emerald-700 text-white border-emerald-700 shadow-lg shadow-emerald-700/30',
    poster: 'from-emerald-50 via-white to-emerald-100', heroBadge: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/50',
    tileHover: 'group-hover:bg-emerald-700 group-hover:text-white', cardHover: 'hover:border-emerald-300 hover:bg-emerald-50/40',
    titleHover: 'group-hover:text-emerald-700',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200', eyebrow: 'text-violet-700', solid: 'bg-violet-600',
    soft: 'bg-violet-50 text-violet-700', tint: 'bg-gradient-to-br from-violet-50 to-violet-100/70 text-violet-800 border-violet-200',
    selectedTile: 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/30',
    poster: 'from-violet-50 via-white to-violet-100', heroBadge: 'bg-violet-400/20 text-violet-100 border-violet-300/50',
    tileHover: 'group-hover:bg-violet-600 group-hover:text-white', cardHover: 'hover:border-violet-300 hover:bg-violet-50/40',
    titleHover: 'group-hover:text-violet-700',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200', eyebrow: 'text-amber-700', solid: 'bg-amber-700',
    soft: 'bg-amber-50 text-amber-700', tint: 'bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-800 border-amber-200',
    selectedTile: 'bg-amber-700 text-white border-amber-700 shadow-lg shadow-amber-700/30',
    poster: 'from-amber-50 via-white to-amber-100', heroBadge: 'bg-amber-400/20 text-amber-100 border-amber-300/50',
    tileHover: 'group-hover:bg-amber-700 group-hover:text-white', cardHover: 'hover:border-amber-300 hover:bg-amber-50/40',
    titleHover: 'group-hover:text-amber-700',
  },
  gray: {
    badge: 'bg-tide-subtle text-tide-muted border-tide-border', eyebrow: 'text-tide-muted', solid: 'bg-tide-muted',
    soft: 'bg-tide-subtle text-tide-muted', tint: 'bg-tide-subtle text-tide-text border-tide-border',
    selectedTile: 'bg-tide-muted text-white border-tide-muted shadow-lg shadow-tide-muted/30',
    poster: 'from-tide-subtle via-white to-tide-subtle', heroBadge: 'bg-white/15 text-white/90 border-white/25',
    tileHover: 'group-hover:bg-tide-muted group-hover:text-white', cardHover: 'hover:border-primary/40 hover:bg-primary-faint',
    titleHover: 'group-hover:text-primary',
  },
}

// Colour classes for a resource type, falling back to gray for an unknown colour name.
export const getTypeColors = (tab) => TYPE_COLORS[getTabStyle(tab).color] ?? TYPE_COLORS.gray

// Style entry for a resource type, falling back to the neutral `_default`
// entry for any tab name the Sheet adds that isn't listed above.
export const getTabStyle = (tab) => TAB_STYLE_MAP[tab] ?? TAB_STYLE_MAP._default
