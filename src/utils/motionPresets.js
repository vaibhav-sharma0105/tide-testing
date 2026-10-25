/* Shared scroll-in animation presets for page sections.
   makeFadeUp() returns a (delay) => motion props function; spread the result
   onto a motion.* element: <motion.div {...fadeUp(0.1)}>.
   Pages that need a different offset/duration/margin build their own with makeFadeUp. */

const EASE = [0.4, 0, 0.2, 1]

export const makeFadeUp = ({ y = 24, duration = 0.6, margin } = {}) => (delay = 0) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: margin === undefined ? { once: true } : { once: true, margin },
  transition: { duration, delay, ease: EASE },
})

/* Default variant: 24px rise over 0.6s, no viewport margin. */
export const fadeUp = makeFadeUp()
