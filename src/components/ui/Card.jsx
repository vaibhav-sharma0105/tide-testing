import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = true, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`${className.includes('bg-') ? '' : 'bg-tide-surface'} rounded-2xl shadow-card ${hover ? 'hover:shadow-card-hover transition-shadow duration-300' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
