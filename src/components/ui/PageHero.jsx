import site from '../../data/site.json'
import { imgSrc } from '../../utils/imgSrc'

// The banner is static: it is the first thing on the page, so it never waits to appear (motion
// rules in utils/motionPresets.js).
// `badgeClassName` (optional) replaces the badge's colour classes (e.g. a resource type's colour).
// `aside` (optional) sits to the right of the text on large screens and below it on small ones.
export default function PageHero({ badge, badgeClassName = 'bg-white/15 text-white/90 border-white/25', title, subtitle, children, aside }) {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-4 md:px-8 lg:px-16 bg-[#1c314d] relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: `url(${imgSrc(site.pageBannerTexture)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {/* Subtle decorative blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className={`mx-auto relative ${aside ? 'max-w-6xl grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14' : 'max-w-5xl'}`}>
        <div>
          {badge && (
            <span className={`inline-block mb-5 px-3 py-1 text-xs font-body font-semibold rounded-full tracking-widest uppercase border ${badgeClassName}`}>
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
        </div>
        {aside}
      </div>
    </section>
  )
}
