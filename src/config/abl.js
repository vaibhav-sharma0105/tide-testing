export const ABL_API_URL          = import.meta.env.VITE_ABL_API_URL          ?? ''
export const CONTRIBUTE_FORM_URL  = import.meta.env.VITE_ABL_CONTRIBUTE_FORM_URL ?? ''
export const ABL_CACHE_TTL_MS     = 15 * 60 * 1000
export const ABL_PAGE_SIZE        = 24

export const TAB_STYLE_MAP = {
  Worksheet:  { color: 'blue',    label: 'Worksheet',  pluralLabel: 'Worksheets'  },
  Games:      { color: 'emerald', label: 'Game',       pluralLabel: 'Games'       },
  Kits:       { color: 'violet',  label: 'Kit',        pluralLabel: 'Kits'        },
  Flashcards: { color: 'amber',   label: 'Flashcard',  pluralLabel: 'Flashcards'  },
  _default:   { color: 'gray',    label: 'Resource',   pluralLabel: 'Resources'   },
}
