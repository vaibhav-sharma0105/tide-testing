// Publications pages: one Sheet, two pages (components/publications). The numbers below are code,
// not YAML: page sizes, how long "New" lasts, whether the banner shows a year chart, and which
// icon each type gets. Every list, filter and count is built from the Sheet rows.

// THRIvE archive: entries per numbered page (?page= in the address, so a position can be
// shared or bookmarked). Pagination appears only when the results don't fit on one page.
export const THRIVE_PAGE_SIZE = 12

// TIDE library ("All publications"): cards per numbered page (?page=). 12 = four rows of three.
// Pagination appears only when the results don't fit on one page.
export const TIDE_PAGE_SIZE = 12

// "New" badge: rows dated within this many days before today (worked out when the page renders,
// so the badge disappears on its own; no date is ever shown as new).
export const NEW_BADGE_DAYS = 120


// "Publications per year" chart in the hero, per page. Off on both (owner review, 2026-11-20):
// output is uneven (THRIvE: 1 in 2020, 14 in 2023) and the current year is always part-done, so
// its short bar reads as a decline — the opposite of the message. The Year filter and the year
// headings in the list already cover "show me one year". Set true to bring the chart back.
export const HERO_CHART = { TIDE: false, THRIvE: false }

// Type → icon family. Rules are checked in order; the first rule with a keyword found in the
// type (case-insensitive) wins; otherwise 'file'. Labels always come from the Sheet; only the
// icon is chosen here. iconKey values are mapped to lucide icons in components/publications/TypeIcon.
export const TYPE_ICON_RULES = [
  { iconKey: 'quote', keywords: ['published by others'] },
  { iconKey: 'megaphone', keywords: ['coverage', 'media'] },
  { iconKey: 'presentation', keywords: ['talk', 'slides', 'presentation', 'poster'] },
  { iconKey: 'newspaper', keywords: ['blog', 'magazine'] },
  { iconKey: 'book', keywords: ['book', 'chapter'] },
  { iconKey: 'article', keywords: ['article', 'journal'] },
  { iconKey: 'report', keywords: ['report'] },
]

// schema.org type used in the pages' JSON-LD, by icon family (anything else: CreativeWork).
export const SCHEMA_TYPE_BY_ICON = { article: 'ScholarlyArticle', book: 'Book' }

// Each page's address (used for SEO).
export const PUBLICATION_PAGES = {
  TIDE: { path: '/tide/publications' },
  THRIvE: { path: '/thrive/publications' },
}
