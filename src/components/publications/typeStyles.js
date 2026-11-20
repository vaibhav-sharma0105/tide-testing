// Static class sets for the Publications thumbnails (Tailwind can't see built class names).
// Colour by type FAMILY — the same families as the icons (config TYPE_ICON_RULES →
// typeIconKey). Colour is decoration only: the type label and icon always say the same thing.
// Edge colours are ≥ 3:1 on white (non-text contrast); amber is used as the deeper/dark
// steps on light surfaces, never #F59E0B (that stays on dark surfaces).
//   edge: the thin coloured edge on a thumbnail panel   tint: the panel's soft background
//   icon: the family icon colour on the tint
export const FAMILY_STYLE = {
  article:      { edge: 'bg-primary',       tint: 'bg-primary-faint', icon: 'text-primary' },
  book:         { edge: 'bg-navy',          tint: 'bg-tide-warm',     icon: 'text-navy' },
  presentation: { edge: 'bg-accent-deeper', tint: 'bg-accent-faint',  icon: 'text-accent-deeper' },
  newspaper:    { edge: 'bg-primary-mid',   tint: 'bg-primary-faint', icon: 'text-primary-dark' },
  quote:        { edge: 'bg-accent-dark',   tint: 'bg-accent-faint',  icon: 'text-accent-deeper' },
  megaphone:    { edge: 'bg-accent-dark',   tint: 'bg-accent-faint',  icon: 'text-accent-deeper' },
  report:       { edge: 'bg-primary-dark',  tint: 'bg-primary-faint', icon: 'text-primary-dark' },
  file:         { edge: 'bg-tide-muted',    tint: 'bg-tide-subtle',   icon: 'text-tide-muted' },
}

// A faint brand-blue dot grid laid over a tint (texture, not content).
export const DOT_PATTERN = 'bg-[radial-gradient(theme(colors.primary.DEFAULT/14%)_1px,transparent_1.5px)] bg-[length:10px_10px]'

// Fine diagonal lines for the dark typeset stand-in covers.
export const LINE_PATTERN = 'bg-[repeating-linear-gradient(135deg,theme(colors.white/5%)_0_1px,transparent_1px_9px)]'

// Dark stand-in cover tones (light text and the amber rule are safe on all of them).
export const COVER_TONES = ['bg-navy', 'bg-primary-dark', 'bg-navy-light', 'bg-primary']

// Gentle motion, all switched off under prefers-reduced-motion. Lift = the frame; zoom = the
// image inside its (overflow-hidden) frame. Transforms only, so nothing around them moves.
export const LIFT = 'transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none'
export const ZOOM = 'transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none'

/** A thumbnail's width/height ratio, kept within [min, max] (default: none → `fallback`). */
export function ratioOf(thumb, { min = 0, max = Infinity, fallback = 3 / 4 } = {}) {
  const r = thumb?.width > 0 && thumb?.height > 0 ? thumb.width / thumb.height : fallback
  return Math.min(max, Math.max(min, r))
}
