import { Link } from 'react-router-dom'

const variants = {
  primary:   'bg-gradient-to-br from-primary-mid to-primary-dark text-white shadow-[0_2px_8px_rgba(30,107,170,0.32)] hover:shadow-[0_4px_18px_rgba(30,107,170,0.46)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-primary-faint text-primary border-2 border-primary/25 hover:border-primary/60 hover:bg-primary-light active:bg-primary-light',
  accent:    'bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_2px_8px_rgba(245,158,11,0.32)] hover:shadow-[0_4px_18px_rgba(245,158,11,0.46)] hover:brightness-110 active:brightness-95',
  ghost:     'text-primary hover:bg-primary-faint',
  white:     'bg-white text-primary border border-white/60 shadow-sm hover:bg-primary-faint hover:shadow-md',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
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
    'inline-flex items-center gap-2 font-body font-semibold rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>
  if (href)
    return (
      <a href={href} className={cls} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} {...props}>
        {children}
      </a>
    )
  return <button className={cls} {...props}>{children}</button>
}
