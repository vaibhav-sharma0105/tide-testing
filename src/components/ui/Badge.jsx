const variants = {
  primary: 'bg-primary-light text-primary-dark border border-primary/20',
  accent: 'bg-accent-light text-accent-dark border border-accent/20',
  subtle: 'bg-tide-subtle text-tide-muted border border-tide-border',
  white: 'bg-white/20 text-white border border-white/30',
}

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-body font-semibold rounded-full tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
