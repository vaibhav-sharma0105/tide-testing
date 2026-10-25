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

// Style entry for a resource type, falling back to the neutral `_default`
// entry for any tab name the Sheet adds that isn't listed above.
export const getTabStyle = (tab) => TAB_STYLE_MAP[tab] ?? TAB_STYLE_MAP._default
