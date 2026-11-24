# TIDE site — seven-phase audit-and-fix ledger (2026-11)

Branch `audit/2026-11-site-hardening`, created from `main` at `7998b1d` (the motion refactor of 2026-11-24, committed on `main` before the audit started, at the owner's request). One commit (or a few) per phase. Nothing is pushed until the owner has reviewed the branch.

This file is the only shared memory between the phase subagents: read it first, add to it last.

## Baseline (2026-11-24, at `7998b1d`)

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | pass (exit 0, no output) |
| Content | `npm run content:validate` | pass: 0 warnings, 0 errors (~1 s) |
| Unit | `npm test` | 32 files / 369 tests passed (13.13 s) |
| Build | `npm run build` | pass (built in 3.01 s); biggest chunks vendor-react 181.90 kB (57.21 gz), vendor-motion 149.52 kB (49.38 gz), pramaan-library 147.25 kB (31.37 gz) |
| Base-path build | `$env:GITHUB_ACTIONS='true'; npm run build` | pass (2.87 s); `dist/index.html` references `/tide-testing/assets/…` |
| Base-path preview | see note below | `/`, `/about/why-tide`, `/about/our-partners`, `/pramaan/resource-centre?type=worksheet`, `/tide/publications` render under `/tide-testing/`: `<h1>` present, 0 broken images, 0 `tide-testing/tide-testing` URLs, 0 console errors (Chrome) |
| E2E | `npm run test:e2e` | 27 passed (chromium, 20.8 s) |

**Pre-existing failures:** none.

**Gate note (important for every phase):** `npx vite preview` must run with `GITHUB_ACTIONS=true` set too (PowerShell: `$env:GITHUB_ACTIONS='true'; npx vite preview`). Without it, the preview serves with base `/` and answers every `/tide-testing/*` request with the index HTML, so the JS files load as HTML and the page is blank. This looks like a site bug but isn't one. In Git Bash, `--base /tide-testing/` is rewritten into a Windows path (`/Program Files/Git/tide-testing/`), so use the env var instead. Also note that `vite preview` falls back to `index.html` for every path (HTTP 200), so it can't show GitHub Pages' real 404 status for deep links.

**Observed during baseline (not yet triaged):** on `/pramaan/resource-centre` the `<h1>` reads "Resource Center" while the `<title>` reads "Resource Centre — Pramaan — TIDE Foundation" (copy inconsistency; both from YAML, not verified which is intended → owner).

## P1 — CMS integrity

**Method.** (1) An AST scan (`@babel/parser`, scratch script, not committed) of every string literal, template-literal part and JSX text in `src/pages`, `src/components`, `src/utils`, `src/config`, `src/hooks`, `App.jsx`, `main.jsx`, skipping only imports, object keys and non-text props (`className`, `href`, `role`, …): 178 hits with an uppercase letter, ~430 lowercase ones, each read and classified below. (2) The cms-integrity greps (text props, image paths, breadcrumb names): 0 hits in `src/pages` / `src/components` apart from the PageHero texture. (3) Every `<SeoHead>` call (21 pages + NotFound/ComingSoon Helmet): titles, descriptions and breadcrumb names all from YAML (`data.meta.*`, `site.breadcrumbs.*`) or Sheet row names. (4) `index.html`, `public/404.html`, `robots.txt`, `sitemap.xml`, `siteDataPlugin.js`, `content/shared/llms.txt`, `ErrorBoundary` (it imports `error.json` statically, so its text is bundled and available before any page loads). (5) Every image path in YAML (75 values): all exist on disk, none is a bare file name. (6) YAML keys never named in code: none, apart from the domain keys of `thrive-publications.yaml` `source.names` (a lookup map, read dynamically).

**Result: the code was already clean of visible text.** The one real gap in JSX was an image path; the others are in static public files.

| ID | Sev | Location | Evidence | Status |
|---|---|---|---|---|
| P1-1 | Low | `src/components/ui/PageHero.jsx:11` | Banner texture path `assets/images/shared/page-banner-bg.png` typed in code (on every inner page) | Fixed → `site.yaml` `pageBannerTexture` via `imgSrc()` |
| P1-2 | Medium | `scripts/validate-content.js:19-42` | Image check only covered 12 key names with a leading `/`: `home.yaml` `mission.image1/image2`, `pramaan-library.yaml` `detail.videoLogo` and the 4 slash-less `home.yaml` `programs.items[].photo` were unchecked; a typo there would show the placeholder silently | Fixed: any value that is a local file path (`/assets/`, `assets/` or a media extension), any key, objects and lists; missing file or bare file name → warning. Proved with a temporary typo (2 warnings), reverted |
| P1-3 | Medium | `eslint.config.js` | `react/jsx-no-literals` (`ignoreProps: true`) ignored words in `alt` / `aria-label` / `title` / … and `{'…'}` / template text in JSX | Fixed: `no-restricted-syntax` guard (`CMS_TEXT_SELECTORS`), 0 hits on current code, 22 tests in `src/test/scripts/cmsGuard.test.js` (fires on 14 bad patterns, passes 8 good ones) |
| P1-4 | Low | `content/shared/site.yaml:15` | Comment said gradeRange must match "the GRADES list in src/config/abl.js"; the test checks `LIBRARY_GRADES` in `src/utils/libraryFilters.js` (`src/test/utils/siteDataPlugin.test.js:111-114`) | Fixed (comment only) |
| P1-5 | Low | `public/404.html:5` | `<title>TIDE Foundation</title>` typed in (site name; shown only during the redirect) | Deferred → P3 (static public files) |
| P1-6 | Low | `public/robots.txt:4`, `public/sitemap.xml` | Domain `https://tideinternational.org` typed in (= `site.yaml` `url`) | Deferred → P3 (generate from `site.yaml` + routes if wanted) |
| P1-7 | Low | `index.html:13` | Favicon `/assets/images/shared/tide-logo.png` typed in (= `site.yaml` `logo`); Vite base-rewrites it correctly (`dist/index.html` → `/tide-testing/assets/…`). Injecting it from `siteDataPlugin` would run after Vite's HTML URL rewrite and lose the base | Deferred (structural; would need the plugin's hook order changed and re-verified) |
| P1-8 | Low | `content/shared/site.yaml` `description`; `content/shared/llms.txt` | "since 2014" typed in `description` (not the `foundingYear` token; `siteDescription()` only fills `{livesImpacted}`); llms.txt states "100+ partner organisations", "12 years", "(as of 2025)", "15,000+ students" as plain text — all editable in `content/`, but can drift (Partners preview has 113) | Deferred → P3 (llms.txt accuracy is its area) |
| P1-9 | Info | `pramaan-library.yaml:11` `meta.title` "Resource Center" (the `<h1>`), `:76` `detail.backLabel` "Back to Resource Center"; `:13` `meta.seoTitle` "Resource Centre — …", `:20` `breadcrumbName`, `site.yaml:34` `breadcrumbs.resourceCentre`, `abl-home.yaml:15` `nav.resourceCenter`, `navigation.yaml:59` all "Resource Centre" | Source of the baseline spelling question; the YAML comment at `:8` says the badge/titles/back label were kept from the former Resource Centre by owner decision 2026-11-19 | Owner decision (existing item) |

**On-purpose code-side text (for P7 to document; leave as is):**
- Sheet *values* matched in code, not display text: `src/config/partners.js` `PRIORITY_ORDER` ("Extremely high"…"Low"), `LAST_CATEGORIES` ("Others", "Other"); `src/config/publications.js` `TYPE_ICON_RULES` match words ("report", "talk", "published by others", …); `src/utils/libraryFilters.js` `LIBRARY_GRADES` ("FOUNDATIONAL", "GRADE 1"…, Sheet values; their labels come from `pramaan-library.yaml` `filters.foundational` / `gradeTemplate` and `detail.shortFoundational` / `shortGradeTemplate`) and `OWNER_PINNED` ("tide foundation"); `TidePublications.jsx:16` / `ThrivePublications.jsx:21` org filters "TIDE" / "THRIvE".
- schema.org type names (`BreadcrumbList`, `ListItem`, `ItemList`, `ScholarlyArticle`, `Book`, `CreativeWork`), keyboard key names, Framer easing names, CSS/SVG values, DOM selectors, `{token}` placeholder names in `.replace()` calls, `partnerFilters.js:68` stop-words for initials.
- Locale `en-IN` for number and date formatting (`figures.js:15`, `publicationFilters.js:174` → "5 March 2024", `PramaanLibrary.jsx:98`, `AblHome.jsx:34`): month names come from the browser locale, not YAML. Fine while the site is English only.
- Punctuation joining YAML text in code: `` `${gradeLabel(g)}: ${n}` `` (`PramaanLibraryDetail.jsx:53`), `` `${ariaLabel}: ${label}` `` (`LibraryDropdown.jsx:57`), `` `${barLabel(c)}. ${filterAction}` `` (`YearChart.jsx:64`).
- Defensive fallbacks that only show when the YAML is empty: `CreativeLoader.jsx:18` "Loading…" (only if `loader.yaml` `messages` is empty, so the editor still controls it); `publicationFilters.js:98` default `'Undated'` (never used: the only caller passes `thrive-publications.yaml` `results.undatedHeading`).
- Structural: `lang="en"`, `theme-color` `#1E6BAA` (brand token) in `index.html`.

**On-purpose Sheet-side text:** row data from `src/data/sheets/{pramaan-library,publications,partners,social-changemakers}.json` (names, titles, summaries, types, fields, batches, owners, partner names/sites, fellow profiles), including resource names used as the last breadcrumb and SEO title on `/pramaan/resource-centre/:id` (via `detail.titleTemplate`).

**Round trip (step 6), dev server:** `navigation.yaml` "Why TIDE?" label, `navigation.yaml` `ariaMain` (`<nav aria-label>`), `site.yaml` `alternateName` (NGO JSON-LD in `index.html`, via `siteDataPlugin`) and `breadcrumbs.home` (BreadcrumbList JSON-LD via Helmet) were each edited, synced, and seen changed on `/about/our-team` in Chrome; all four reverted and re-synced (`git diff content/shared/navigation.yaml` empty).

**Changes:** `eslint.config.js` + `src/test/scripts/cmsGuard.test.js` (guard + its tests) · `scripts/validate-content.js` (image check on every file path) · `content/shared/site.yaml` (`pageBannerTexture`, stale comment) + regenerated `src/data/site.json` · `src/components/ui/PageHero.jsx` (texture from YAML) · docs kept true: `CLAUDE.md`, `AGENTS.md` §7/§11/test counts, `.claude/skills/cms-integrity/SKILL.md`, `.claude/skills/content-management.md`.

**Gates (2026-11-24, after the changes):** lint pass (exit 0) · content:validate 0 warnings / 0 errors · `npm test` 33 files / 391 tests passed (baseline 32 / 369; +22 guard tests) · build pass (3.17 s; chunk sizes unchanged) · base-path build pass (2.91 s) + preview on port 4174: `/`, `/about/why-tide`, `/pramaan/resource-centre?type=worksheet`, `/tide/publications` under `/tide-testing/`: `<h1>` present, 0 broken images, 0 `tide-testing/tide-testing`, banner texture served from `/tide-testing/assets/images/shared/page-banner-bg.png` (HTTP 200, image/png), 0 console errors (console read after the last route only) · e2e 27 passed (21.2 s; Playwright reused an already-running dev server on 5173 from this repo, pid 67648, not started by P1).

**Notes for next phases:** the new lint guard flags any string with a letter in the listed text props, so a P2 fix that adds an `aria-label` must take it from YAML (that is the point). A string *lookup key* inside a text prop's ternary (`label={t[a ? 'x' : 'y']}`) would be a false positive: compute the key outside the JSX. A missing image is still only a **warning** in `content:validate` (unchanged policy); promoting it to an error would stop a deploy on a broken path — P6 may want to propose that. `validate-content.js` has no unit tests (verified manually here) — P6. If P2/P3 add a `<noscript>` or any `index.html` text, take it from `site.yaml` through `siteDataPlugin`.

## P2 — Accessibility

_Not started._

## P3 — Technical SEO and AI discoverability

_Not started._

## P4 — Security

_Not started._

## P5 — Code review and architecture

_Not started._

## P6 — Quality engineering

_Not started._

## P7 — Documentation sync

_Not started._

## Owner decisions needed

- **Resource Centre spelling:** `<h1>` "Resource Center" vs `<title>` "Resource Centre" (baseline observation). Which spelling?

## Deferred / out of scope

- P1-5/6 (→ P3): `public/404.html` `<title>`, `robots.txt` and `sitemap.xml` repeat the site name / domain from `site.yaml` by hand; generating them from `site.yaml` is an SEO-phase call.
- P1-7: favicon path typed in `index.html` (works under the base path; moving it into `siteDataPlugin` needs hook-order work).
- P1-8 (→ P3): `site.yaml` `description` says "since 2014" in text; `llms.txt` hand-typed figures ("100+ partner organisations", "12 years", "as of 2025", "15,000+ students") may drift from the pages/snapshots.

## Final gate results

_Not run yet._
