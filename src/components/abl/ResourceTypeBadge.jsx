import { TAB_STYLE_MAP } from '../../config/abl'

const COLOR_MAP = {
  blue:    'bg-blue-50    text-blue-700    border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet:  'bg-violet-50  text-violet-700  border-violet-200',
  amber:   'bg-amber-50   text-amber-700   border-amber-200',
  gray:    'bg-gray-50    text-gray-700    border-gray-200',
}

export default function ResourceTypeBadge({ type }) {
  const style    = TAB_STYLE_MAP[type] ?? TAB_STYLE_MAP._default
  const colorCls = COLOR_MAP[style.color] ?? COLOR_MAP.gray
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${colorCls}`}>
      {style.label}
    </span>
  )
}
