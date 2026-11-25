// Static class sets for the Publications thumbnails (Tailwind can't see built class names).
// Colour by type FAMILY — the same families as the icons (config TYPE_ICON_RULES →
// typeIconKey). Colour is decoration only: the type label and icon always say the same thing.
// Amber is used as the deeper/dark steps on light surfaces, never #F59E0B (that stays on dark).
//   tint: the frame's soft background (behind the blurred wash)   icon: the family icon colour
//   veil: a light brand tint laid OVER the blurred wash — keeps black-and-white covers (most annual
//   reports) on a soft tint instead of muddy grey, with enough colour that a white page still
//   stands out from it
export const FAMILY_STYLE = {
  article:      { tint: 'bg-primary-faint', veil: 'bg-primary-light/60', icon: 'text-primary-dark' },
  book:         { tint: 'bg-tide-warm',     veil: 'bg-tide-warm/80',     icon: 'text-navy' },
  presentation: { tint: 'bg-accent-faint',  veil: 'bg-accent-light/50',  icon: 'text-accent-deeper' },
  newspaper:    { tint: 'bg-primary-faint', veil: 'bg-primary-light/60', icon: 'text-primary-dark' },
  quote:        { tint: 'bg-accent-faint',  veil: 'bg-accent-light/50',  icon: 'text-accent-deeper' },
  megaphone:    { tint: 'bg-accent-faint',  veil: 'bg-accent-light/50',  icon: 'text-accent-deeper' },
  report:       { tint: 'bg-primary-faint', veil: 'bg-primary-light/60', icon: 'text-primary-dark' },
  file:         { tint: 'bg-tide-subtle',   veil: 'bg-tide-subtle/80',   icon: 'text-tide-muted' },
}

// Frame shapes. One shape per component, so every row in a list lines up whatever the upload's
// own shape (measured 2026-11-20: 0.61…2.29 wide-to-tall). The image is always shown WHOLE
// inside the frame (never cropped or zoomed to fill).
export const FRAME = {
  landscape: 'aspect-[4/3]', // THRIvE archive rows (mostly wide images: slides, articles)
  card: 'aspect-[5/6]',      // TIDE library cards (mostly tall pages: reports; wide slides keep their width)
  portrait: 'aspect-[3/4]',  // the TIDE spotlight cover
}

// A faint brand-blue dot grid laid over a tint (texture, not content).
export const DOT_PATTERN = 'bg-[radial-gradient(theme(colors.primary.DEFAULT/14%)_1px,transparent_1.5px)] bg-[length:10px_10px]'

// Fine diagonal lines for the dark typeset stand-in covers.
export const LINE_PATTERN = 'bg-[repeating-linear-gradient(135deg,theme(colors.white/5%)_0_1px,transparent_1px_9px)]'


// Organic motion: a long ease-out (fast start, very soft landing), transforms only, so nothing
// around the image moves. The image drifts a little; the blurred wash behind it drifts more
// slowly (a hint of depth). Both are static strings so Tailwind sees every class. Off under
// prefers-reduced-motion.
export const DRIFT = 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none'
export const DRIFT_SLOW = 'transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none'
