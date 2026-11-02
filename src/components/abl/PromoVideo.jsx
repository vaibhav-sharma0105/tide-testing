import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import VideoLightbox from './VideoLightbox'
import ablData from '../../data/abl-home.json'

// The promo video on the blue banner: a straight, pinned print (no tilt, so the picture stays square
// to the reader) that fades in and lifts slightly under a mouse. Pressing play opens the video in a
// large modal over a translucent, blurred backdrop; the YouTube player is not loaded until then.
//
// The poster is drawn, not a photo, and kept quiet to sit in the blue banner: deep navy
// and white, a short hook, and one true fact about the programme (the reach figures that are
// already on the page). It makes no claim about what is in the video beyond "watch".
export default function PromoVideo() {
  const { promo } = ablData
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  return (
    <>
      <motion.figure
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileHover={reduce ? undefined : { y: -4, transition: { type: 'spring', stiffness: 90, damping: 14 } }}
        className="relative mx-auto w-full max-w-xl rounded-md bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] md:p-3 lg:max-w-none"
      >
        <span className="absolute left-1/2 -top-2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-primary shadow-[0_2px_3px_rgba(0,0,0,0.35)]" aria-hidden="true" />
        <div className="relative aspect-video overflow-hidden rounded-sm bg-navy">
          <button type="button" onClick={() => setOpen(true)} aria-label={promo.playLabel} aria-haspopup="dialog" className="group absolute inset-0 block w-full cursor-pointer overflow-hidden text-left">
            <span className="absolute inset-0 bg-gradient-to-br from-navy via-[#12304f] to-primary-dark" aria-hidden="true" />
            {/* navy council circles, the site's motif, large and quiet behind the play button */}
            <svg viewBox="0 0 400 225" fill="none" className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <circle cx="290" cy="96" r="84" fill="rgba(255,255,255,0.03)" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
              <circle cx="350" cy="96" r="84" fill="rgba(255,255,255,0.05)" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5" />
              <circle cx="320" cy="150" r="84" fill="rgba(255,255,255,0.03)" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
            </svg>

            <span className="relative flex h-full flex-col justify-between p-4 md:p-6">
              <span className="max-w-[62%]">
                <span className="block font-display text-2xl font-semibold leading-[1.05] text-white md:text-4xl lg:text-[2.6rem]">{promo.posterTitle}</span>
                <span className="mt-2 block font-body text-xs font-medium leading-snug text-white/70 md:mt-3 md:text-base">{promo.posterSub}</span>
              </span>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 font-body text-xs font-semibold text-white ring-1 ring-white/25 transition-colors duration-300 group-hover:bg-white/20 md:px-4 md:text-sm">
                {promo.playText}
              </span>
            </span>

            {/* the play button, with a slow ring that invites the press */}
            <span className="absolute right-[11%] top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center md:h-24 md:w-24">
                            <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 fill-current md:h-10 md:w-10" aria-hidden="true" />
              </span>
            </span>
          </button>
        </div>
      </motion.figure>

      <VideoLightbox
        src={open ? `https://www.youtube.com/embed/${promo.youtubeId}?autoplay=1&rel=0` : null}
        title={promo.title}
        onClose={() => setOpen(false)}
        translucent
      />
    </>
  )
}
