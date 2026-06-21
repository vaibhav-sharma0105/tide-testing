import { motion } from 'framer-motion'

export default function SectionHeader({ badge, title, subtitle, center = false, light = false, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`mb-12 md:mb-16 ${center ? 'text-center' : ''} ${className}`}
    >
      {badge && (
        <span className={`inline-block mb-4 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase ${light ? 'bg-white/20 text-white border border-white/30' : 'bg-primary-light text-primary-dark border border-primary/20'}`}>
          {badge}
        </span>
      )}
      <h2 className={`font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-balance ${light ? 'text-white' : 'text-tide-text'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg leading-relaxed max-w-2xl ${center ? 'mx-auto' : ''} ${light ? 'text-white/80' : 'text-tide-muted'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
