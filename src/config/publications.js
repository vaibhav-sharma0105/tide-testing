// Publications pages: one Sheet, two pages (components/publications). The numbers below decide
// when each page adds a control. The data grows and shrinks with the Sheet, so every control
// appears only when the number of rows makes it useful, and goes away again when it doesn't.

// THRIvE archive: entries per numbered page (?page= in the address, so a position can be
// shared or bookmarked). Pagination appears only when the results don't fit on one page.
export const THRIVE_PAGE_SIZE = 20

// TIDE annual-report shelf: covers shown before a "Show all {n} annual reports" toggle.
// 6 = one row at the widest layout (6 per row from xl up).
export const TIDE_SHELF_VISIBLE = 6

// TIDE "Reports, talks & more": cards per page. Numbered pages appear only above this many.
export const TIDE_OTHERS_PAGE_SIZE = 12

// TIDE search box: appears automatically only when the TIDE collection has MORE rows than this.
// Below it, everything is visible on the page and a search box would only add a control.
export const TIDE_SEARCH_MIN_ITEMS = 24

// "New" badge: rows dated within this many days before today (worked out when the page renders,
// so the badge disappears on its own; no date is ever shown as new).
export const NEW_BADGE_DAYS = 120

// A thumbnail wider than this ratio (width / height) gets a landscape frame (16:10) instead of
// the portrait page frame (3:4), so wide images are never squeezed into a tall box.
export const LANDSCAPE_RATIO = 1.2

// "Publications per year" chart in the hero, per page. THRIvE: on (49 rows over 7 years; each
// bar filters the archive by that year). TIDE: off — 16 rows, 1–3 a year, mostly one annual
// report a year, which the shelf already shows; the chart would add ink without a decision.
export const HERO_CHART = { TIDE: false, THRIvE: true }

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
  TIDE: { path: '/about/publications' },
  THRIvE: { path: '/thrive/publications' },
}
