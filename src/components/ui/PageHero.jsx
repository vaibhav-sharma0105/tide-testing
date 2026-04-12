import { motion } from 'framer-motion'

export default function PageHero({ badge, title, subtitle, children, gradient = false }) {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-4 md:px-8 lg:px-16 bg-[#1c314d] relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url(/assets/images/shared/page-banner-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {/* Subtle decorative blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {badge && (
            <span className="inline-block mb-5 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase bg-white/15 text-white/90 border border-white/25">
              {badge}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-balance text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 text-lg md:text-xl leading-relaxed max-w-2xl text-white/75">
              {subtitle}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
