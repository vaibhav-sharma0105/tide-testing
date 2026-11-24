import { Link } from 'react-router-dom'
import TiltGlare from './TiltGlare'
import { tiltProps } from '../../utils/tilt'

const variants = {
  // Gradient stops chosen so white text clears 4.5:1 at BOTH ends, not just
  // the darker one — a gradient's lighter corner is exactly where automated
  // contrast checkers tend to under-sample, so this was verified by hand
  // (white on primary: 5.62:1, white on primary-dark: 7.97:1).
  primary:   'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_2px_8px_rgba(30,107,170,0.32)] hover:shadow-[0_4px_18px_rgba(30,107,170,0.46)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-primary-faint text-primary border-2 border-primary/25 hover:border-primary/60 hover:bg-primary-light active:bg-primary-light',
  // Dark text instead of white — amber/orange is a light-to-mid luminance
  // color, so white text never reliably clears 4.5:1 against it (was
  // 2.15:1-3.19:1 across this gradient's two stops). Dark navy text clears
  // 7.65:1 / 5.16:1 at the two stops instead, comfortably.
  accent:    'bg-gradient-to-br from-accent to-accent-dark text-tide-text shadow-[0_2px_8px_rgba(245,158,11,0.32)] hover:shadow-[0_4px_18px_rgba(245,158,11,0.46)] hover:brightness-95 active:brightness-90',
  ghost:     'text-primary hover:bg-primary-faint',
  white:     'bg-white text-primary border border-white/60 shadow-sm hover:bg-primary-faint hover:shadow-md',
}

// Medium and large buttons are tactile like the site's tiles: they tilt towards the mouse, a glare
// follows the pointer and they rise a little (src/utils/tilt.js, .tilt-3d in src/index.css). Small
// ones stay flat. No tilt on touch or under "reduce motion".
const TILT_SIZES = new Set(['md', 'lg'])
const tilt = tiltProps(6, 8)

// The site's one button scale (2026-11-24). Heights are minimums, so a bordered button (secondary)
// is exactly as tall as a filled one beside it, and a long label can still wrap on a phone.
//   lg — a section's main call to action: 48px, 15px text
//   md — everything else (default): 44px (the touch-target size), 14px text
//   sm — compact, inside dense UI: 36px
// Hand-made pill buttons elsewhere (TideCollection, ErrorBoundary, …) follow the same numbers; don't
// add size overrides (px-8 py-4 …) in className.
const sizes = {
  sm: 'min-h-9 px-4 py-1.5 text-sm',
  md: 'min-h-11 px-5 py-2 text-sm',
  lg: 'min-h-12 px-6 py-2.5 text-[15px]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  external,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-body font-semibold leading-tight rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  const tilts = TILT_SIZES.has(size)
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${tilts ? 'tilt-3d tilt-lift relative overflow-hidden' : ''} ${className}`
  const extra = tilts ? tilt : {}
  const content = tilts ? <>{children}<TiltGlare /></> : children

  if (to) return <Link to={to} className={cls} {...extra} {...props}>{content}</Link>
  if (href)
    return (
      <a href={href} className={cls} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} {...extra} {...props}>
        {content}
      </a>
    )
  return <button className={cls} {...extra} {...props}>{content}</button>
}
