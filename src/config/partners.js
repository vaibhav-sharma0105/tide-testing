// Rules for the Partners page (/about/our-partners) and its Sheet sync. Plain constants, no imports:
// the sync's rules (scripts/lib/partners-snapshot.js) import this file too, so the page and the
// "needs attention" report always agree. Column rules: docs/PARTNERS-SHEET-SCHEMA.md.

// "Priority" values, highest first (owner decision, 2026-11-21). Matched ignoring capitals and extra
// spaces. Any other value is listed after the last one and reported by the sync.
export const PRIORITY_ORDER = ['Extremely high', 'High', 'Medium', 'Low']

// "Type of partner" values whose section goes last; every other section is A→Z (owner decision,
// 2026-11-21). Matched ignoring capitals and extra spaces.
export const LAST_CATEGORIES = ['Others', 'Other']

// Sliders start paused: a moving logo wall competes with reading, so motion is the visitor's choice
// (Play). Then: time between automatic steps (one row moves per step — the one on screen nearest the
// middle, components/partners/sliderConductor.js), and how long a slider waits after a person scrolled
// or pressed previous/next before it moves on its own again.
export const SLIDES_START_PAUSED = true
export const SLIDE_INTERVAL_MS = 4500
export const SLIDE_RESUME_MS = 8000

// The banner shows up to this many logos of the highest-priority partners (only real logos; the
// banner graphic is left out when fewer than CONSTELLATION_MIN are available).
export const CONSTELLATION_MAX = 9
export const CONSTELLATION_MIN = 3
