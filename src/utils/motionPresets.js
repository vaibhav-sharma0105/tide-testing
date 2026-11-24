/* The site's one motion system (2026-11-24). Every scroll reveal uses these values, so the rhythm is
   the same on every page:
   - a short rise (10px) and a quick fade (0.45s) on a curve that starts fast and settles gently
     (things coming in should never seem to hesitate);
   - it starts as soon as the element reaches the window (32px in), so a fast scroller, the Back
     button or a link to a section never shows an empty area for long;
   - items in a row follow each other by a few hundredths of a second, and the whole row is done
     within REVEAL.maxDelay, however many items it has.
   Nothing on the first screen of a page waits to appear (banners are static; see PageHero).
   "Reduce motion": <MotionConfig reducedMotion="user"> in App.jsx drops the movement (fade only).

   fadeUp(delay) returns motion props: <motion.div {...fadeUp(0.1)}>. Older call sites pass delays
   written for slower timings (0.1 + i * 0.15 …); they are scaled down and capped here, so callers
   don't each need their own numbers. For a row, revealDelay(i) gives the stagger directly. */

export const EASE_OUT = [0.22, 1, 0.36, 1]

/* Decorative loops (a floating logo, a bouncing cue, a drifting wave) start by themselves, so WCAG
   2.2.2 wants them to stop within five seconds: they run for LOOP_BUDGET_MS and then rest
   (hooks/useLoopWindow.js; CSS loops use 5 iterations of a 1 s animation). */
export const LOOP_BUDGET_MS = 5000

export const REVEAL = {
  y: 10,
  duration: 0.45,
  stagger: 0.05,
  maxDelay: 0.2,
  margin: '0px 0px -32px 0px',
}

/** The delay of item `i` in a row: 0.05s apart, never more than REVEAL.maxDelay. */
export const revealDelay = (i) => Math.min(Math.max(i, 0) * REVEAL.stagger, REVEAL.maxDelay)

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: REVEAL.y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: REVEAL.margin },
  transition: { duration: REVEAL.duration, delay: Math.min(Math.max(delay, 0) * 0.4, REVEAL.maxDelay), ease: EASE_OUT },
})
