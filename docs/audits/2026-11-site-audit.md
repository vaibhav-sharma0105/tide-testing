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

**Orchestrator check (P1):**
- Diff reviewed: no snapshot, threshold or owner-decision edits. `src/data/site.json` changed only because `content:sync` regenerated it.
- Gates re-run independently: lint pass; content:validate 0/0; 33 files / 391 tests; build pass; e2e 27 passed (18.0 s).
- Base-path preview: `/about/our-team`, `/thrive/publications` and `/contact` show the texture at `/tide-testing/assets/images/shared/page-banner-bg.png` (200 image/png), with 0 console errors.
- Guard spot check: a planted `aria-label="Planted text"` in `PageHero.jsx` fails lint with `no-restricted-syntax` (then reverted).
- Commits: `291bcae` (guards), `88166f4` (texture, docs, ledger).

## P2 — Accessibility

**Method.** (1) axe (`@axe-core/playwright`, tags wcag2a/aa, 21a/aa, 22aa, wcag2aaa, best-practice) on 20 URLs after scrolling + 1.2 s settle, then on 7 open states (header dropdown, mobile menu, fellow profile, photo lightbox + promo video, publications filter menu + an applied filter, Resource Centre drawer on a phone, Partners search). (2) Scratch Playwright probes (not committed): heading outline, landmarks, Gujarati/Devanagari text and its `lang`, every control's size, sideways overflow at 320 px, Shift+Tab through whole pages measuring focus against the fixed header and sticky bars, keyboard flows through each dialog (open, 15× Tab / Shift+Tab, Escape, focus return), text-spacing overrides (1.4.12) looking for clipped text, ambiguous link names, `aria-current`. (3) Code reading of every infinite animation and interval. Contrast ratios computed from the hex values. **Not done:** a real screen-reader session (NVDA/VoiceOver), so "what is heard" is inferred from the accessibility tree and focus; 400 % zoom covered by the 320 px reflow check only, no separate 200 % text-only zoom pass; reading level (3.1.5) not measured.

**Baseline (before P2):** AA: `/thrive` color-contrast ×4, `/pramaan/resource-centre` heading-order ×1, plus best-practice `landmark-complementary-is-top-level`; AAA `color-contrast-enhanced` on every route (4–80 nodes). Manual findings in the table.

| ID | Sev | Location | Evidence | Status |
|---|---|---|---|---|
| P2-1 | High | `src/hooks/useFocusTrap.js` (VideoLightbox, FellowProfile) | Probe: Tab left the promo video dialog through the cross-origin iframe (focus reached "About Pramaan" behind it), same on the resource video; in FellowProfile, Tab from the focused `<h2>` reached "Arth Patel: open profile" behind the dialog. The trap wrapped only when focus was exactly on the first/last item, and its list counted disabled/hidden buttons (2.1.2, 2.4.3) | Fixed: usable-only list, wrap from any element outside the list, `focusin` guard, trap stack (topmost acts). 7 unit tests; all 5 dialogs pass the e2e keyboard flow |
| P2-2 | High | `/about/our-partners`, `/thrive/publications`, `/pramaan/resource-centre` | Shift+Tab probe: Partners 29 of 106 stops entirely under `PartnerIndexBar`; THRIvE pubs 4 hidden + 10 partly under the header; Resource Centre 2 hidden + 11 partly under `AblNavBar` (2.4.11 AA / 2.4.12 AAA). No `scroll-padding` anywhere | Fixed: `scroll-padding-top` 5.5rem, 150px with `[data-sticky-subnav]`; same probe → 0 hidden, 0 partial on 5 routes; 8 redundant `scroll-mt-*` removed |
| P2-3 | Medium | `HomeHero.jsx:185`, `PartnerConstellation.jsx:104,123` + SVG lights, `WaveDivider.jsx:16`, `AblHome.jsx:113`, `Donate.jsx:118`, `OrganizeMCCx.jsx:249`, `SocialChangemakers.jsx:247`, `NotFound.jsx:59-69` | `repeat: Infinity`, `animate-ping`, `animate-bounce`, `setInterval` beats: decorative motion that starts by itself and never stops (2.2.2 AA; stopping only under OS reduce-motion is not enough) | Fixed: `useLoopWindow` (5 s, then rest), CSS loops 5 × 1 s, one beat instead of an interval, the wave drifts 5 s at its old speed |
| P2-4 | Medium | `SocialChangemakers.jsx:41-56` intro dot | Loops forever while on screen; the loop is a recorded owner decision (2026-11-23) | Owner decision (below) |
| P2-5 | Low | `ComingSoonGraphic.jsx` (`/coming-soon`) | Clouds, motes, flag and gusts loop forever (2.2.2); the page is linked from nowhere (grep) | Deferred |
| P2-6 | Medium | Resource Centre cards + detail (`LibraryCard.jsx`, `PramaanLibraryDetail.jsx`) | 165 of 241 titles in Gujarati script rendered under `lang="en"` (3.1.2). The row's `language` column describes the material, not the title (15 "English" rows have Gujarati titles), so the script is the evidence | Fixed: `LangText` / `scriptLang.js` (`<span lang="gu">` per Gujarati run, `lang` on `alt`); 7 unit tests; seen under the base path (5 / 2 `[lang=gu]` nodes) |
| P2-7 | Medium | `Layout.jsx` | After a page change focus stayed on the clicked link (or fell to `<body>`); AGENTS.md said "Does not move focus" — a screen reader announced nothing (2.4.3, 4.1.3 practice) | Fixed: focus moves to the new `<h1>`; not on first load, not on query changes (`?fellow=` keeps the dialog's focus); e2e test |
| P2-8 | Medium | `Header.jsx` desktop dropdown | `role="menu"` holding plain links (no `menuitem`, no arrow keys) + `aria-haspopup="true"`; dropdown links had no `aria-current` while the mobile menu did (1.3.1, 4.1.2) | Fixed: a disclosure list (no menu role), `aria-current="page"` on the current link incl. the nested group; Header unit tests pass; e2e test |
| P2-9 | Low | `/pramaan/resource-centre` | axe heading-order: h1 → h3 filter groups and h3 cards | Fixed: hidden `<h2>` "Filters" (existing `page.filtersButton`), card titles `<h2>` |
| P2-10 | Low | `PramaanLibrary.jsx:126` | `<aside>` inside `<main>` (best practice) | Fixed: labelled `<section>` |
| P2-11 | Low | `FellowCard.jsx:61` | 320 px: 16 px sideways scroll ("See their story" pill `whitespace-nowrap` in a 2-column grid) (1.4.10) | Fixed: wraps, keeps 36 px min; e2e checks all 20 routes at 320 px |
| P2-12 | Low | `PramaanLibrary.jsx` phone "Filters" | Opens a dialog without `aria-haspopup` / `aria-expanded` | Fixed |
| P2-13 | Info | `THRIvE.jsx:41` | axe 1.4.3: "01"–"04" at 1.32:1, `aria-hidden`, pure decoration (1.4.3 "incidental") | Pass; marked `data-a11y-decorative`, excluded by name in the axe checks |
| P2-14 | Low (AAA) | `Footer.jsx:38,79` | `text-white/55` on navy = 5.78:1, 60 nodes (3 per page) | Fixed → `text-white/70` = 8.51:1 |
| P2-15 | AAA | brand tokens, site-wide | 1.4.6: `#5A6A7E` 5.39 on `#FDFCF9` / 5.53 on white; `#1E6BAA` text 5.47 / 5.62; white on `#1E6BAA` 5.62; `#B45309` 4.89; `#4D5C6F` 6.65 (≈ 430 nodes) | Owner decision |
| P2-16 | AAA | small targets (2.5.5) | Probe: header items 36 px tall, footer links/Donate 36, Pramaan tabs 40, sort 32, Donate copy 36, THRIvE links 36; pagination 36 (2–4 px apart), grade chips 30, `Button size="sm"` 36, Contact links 28 (stacked), footer social 40 (no gap), search inputs 42. All pass 2.5.8 AA (≥ 24 px or spaced) | Fixed for the roomy ones with `.hit-44` (checked with `elementFromPoint` 21.5 px out: 38/38 ok); rest Deferred / Owner |
| P2-17 | AAA | `education-for-harmony.yaml:57,64`, `get-involved-volunteer.yaml:25,42` | 2.4.9: two "Find out more" and two "Apply via Google Form" links going to different places (2.4.4 AA passes from context) | Owner (copy) |
| P2-18 | AAA | SCF, MCCx, ABL, THRIvE | 3.1.4: whether each page expands them on first use not verified | Owner (copy) |
| P2-19 | — | YouTube/Drive videos (Pramaan promo, EFH, resource explanations, SCF films) | 1.2.2 / 1.2.3 / 1.2.5 captions and audio description: not checkable from the code (cross-origin players) | Owner / content |
| P2-20 | Low | `VideoLightbox` | Escape is not heard while focus is inside the cross-origin player (browser limit); Shift+Tab reaches Close | Deferred (documented in AGENTS.md) |
| P2-21 | Low | `LibraryCard.jsx:23,40` | The card link's `aria-label` ("View {name}") replaces its content, so the type, subject and the "video available" `aria-label` (on a role-less `<div>`) are never announced; the label mixes English and Gujarati, so it can't carry both languages | Deferred (label template = copy decision) |

**Conformance matrix (WCAG 2.2; AA hard floor, AAA target).**

| Criterion | Result | Evidence |
|---|---|---|
| 1.1.1 Non-text content | Pass | axe 0; Sheet images use the row name or YAML fallback (`card.imageAltFallback`); decorative `alt=""` |
| 1.2.1–1.2.5 Media (A/AA) | Not verified → owner | P2-19 |
| 1.2.6–1.2.9 Media (AAA) | Fail-owner | P2-19 |
| 1.3.1 Info and relationships | Fail-fixed | P2-8, P2-9 |
| 1.3.2–1.3.5 | Pass | axe 0; no orientation lock; contact/volunteer forms are external Google Forms |
| 1.3.6 Identify purpose (AAA) | Pass | landmarks probe (banner, nav, main, contentinfo) |
| 1.4.1 / 1.4.2 | Pass / N/A (no autoplaying audio) | |
| 1.4.3 Contrast | Pass | axe 0 (P2-13 incidental) |
| 1.4.4 Resize text | Pass (inferred from 1.4.10 and rem sizes; no separate 200 % pass) | |
| 1.4.5 / 1.4.9 Images of text | Pass (logos only) | |
| 1.4.6 Contrast enhanced (AAA) | Fail-owner (footer fixed) | P2-14, P2-15 |
| 1.4.7 / 1.4.8 (AAA) | N/A / Not assessed | |
| 1.4.10 Reflow | Fail-fixed | P2-11 |
| 1.4.11 Non-text contrast | Pass | focus ring blue 5.47:1 on cream, white band on navy |
| 1.4.12 Text spacing | Pass | probe: only `sr-only` text and decorative frames overflow; clamped titles link to the full text |
| 1.4.13 Content on hover/focus | Pass | FellowProfile tooltips on hover/focus only; Escape closes |
| 2.1.1 / 2.1.2 / 2.1.3 Keyboard | Fail-fixed | P2-1; e2e keyboard flows |
| 2.1.4 Character shortcuts | Pass | "/" only focuses the THRIvE search |
| 2.2.1 / 2.2.3 / 2.2.4 / 2.2.6 | N/A / Pass | no time limits or interruptions |
| 2.2.2 Pause, stop, hide | Fail-fixed; one Fail-owner; one Deferred | P2-3, P2-4, P2-5; Partners rows start paused with a pause control |
| 2.3.1 / 2.3.3 Animation from interactions (AAA) | Pass | `MotionConfig reducedMotion="user"`, CSS reduce rule; tilt, parallax, count-up off under reduce |
| 2.4.1 Bypass blocks | Pass | skip link → `<main>` (e2e) |
| 2.4.2 Page titled | Pass | Helmet titles per route |
| 2.4.3 Focus order | Fail-fixed | P2-1, P2-7 |
| 2.4.4 Link purpose (in context) | Pass | |
| 2.4.5 / 2.4.6 / 2.4.7 | Pass | menu + in-page links; global focus ring |
| 2.4.8 Location (AAA) | Pass | breadcrumbs + `aria-current` (now also in the desktop dropdown) |
| 2.4.9 Link purpose, link only (AAA) | Fail-owner | P2-17 |
| 2.4.10 Section headings (AAA) | Pass | one `<h1>` and no skipped levels on 20 routes after P2-9 |
| 2.4.11 / 2.4.12 Focus not obscured | Fail-fixed | P2-2 |
| 2.4.13 Focus appearance (AAA) | Pass | global ring 2 px outline + 2 px band, ≥ 3:1 change on cream and navy; components with their own `ring-4` spot-checked, not each measured |
| 2.5.1–2.5.4, 2.5.6, 2.5.7 | Pass | photo strip and slider also have keyboard buttons; no motion actuation; e.g. "Copy citation for …" begins with the visible label |
| 2.5.5 Target size (AAA) | Partly fixed; rest Deferred/Owner | P2-16 |
| 2.5.8 Target size (minimum) | Pass | probe: < 24 px only inline links in text and spaced links |
| 3.1.1 / 3.1.2 Language | Pass / Fail-fixed | P2-6 |
| 3.1.3 / 3.1.4 / 3.1.5 / 3.1.6 (AAA) | Not assessed / Owner / Not measured / N/A | P2-18 |
| 3.2.x / 3.3.x | Pass / N/A | forms are external Google Forms; site search fields are labelled |
| 4.1.2 Name, role, value | Fail-fixed | P2-8, P2-12 |
| 4.1.3 Status messages | Pass | result counts and copy confirmations are live regions |

**Changes:** `src/hooks/useFocusTrap.js` + `src/test/hooks/useFocusTrap.test.jsx` (P2-1) · `src/index.css`: scroll padding, `.hit-44`, no ring on `main`/`h1` with `tabindex=-1` · `AblNavBar.jsx`, `PartnerIndexBar.jsx` (`data-sticky-subnav`); `scroll-mt-*` removed from `PartnerSlider`, `PublicationControls`, `EducationForHarmony`, `Donate`, `SocialChangemakers`, `THRIvE` (P2-2) · `src/hooks/useLoopWindow.js` + test, `motionPresets.js` `LOOP_BUDGET_MS`, `HomeHero`, `PartnerConstellation`, `WaveDivider`, `AblHome`, `Donate`, `OrganizeMCCx`, `SocialChangemakers`, `NotFound` (P2-3) · `src/utils/scriptLang.js` + test, `components/ui/LangText.jsx`, `LibraryCard`, `DriveImage` (`lang` prop), `ImageLightbox`, `PramaanLibraryDetail` (P2-6) · `Layout.jsx` (P2-7) · `Header.jsx` (P2-8) · `PramaanLibrary.jsx`, `LibraryCard.jsx`, `pramaanLibrary.test.jsx` (card titles h3 → h2) (P2-9/10/12) · `FellowCard.jsx` (P2-11) · `THRIvE.jsx` (P2-13) · `Footer.jsx` (P2-14) · `.hit-44` on `Header`, `Footer`, `Donate`, `THRIvE`, `AblNavBar`, `PramaanLibrary`, `LibraryDropdown` (P2-16) · `e2e/a11y.spec.js` (new, 35 tests) · `scripts/a11y-audit.cjs` (+`/coming-soon`, `/404`; AAA/best-practice reported apart from AA; decorative exclusion) · `CLAUDE.md`, `AGENTS.md` (§3 helpers, Layout, useFocusTrap, §12 counts/specs). No YAML changes, no new visible text, no new dependency.

**Gates (2026-11-24, after the changes):** lint pass (exit 0) · content:validate 0 warnings / 0 errors · `npm test` **36 files / 408 tests** passed (P1: 33 / 391; +17: focus trap 7, loop window 3, scriptLang 7) · build pass (2.70 s; chunk sizes unchanged: vendor-react 181.90 kB, pramaan-library 147.25 kB) · base-path build pass (2.71 s) + preview on 4173: `/`, `/about/our-partners`, `/pramaan/resource-centre`, `/pramaan/resource-centre/W1`, `/get-involved/donate`, `/thrive/publications` under `/tide-testing/`: `<h1>` present, 0 broken images, 0 `tide-testing/tide-testing`, `[lang=gu]` 5 / 2 on the Resource Centre pages, scroll padding 88 px / 150 px, a keyboard page change lands on `<h1>`, 0 console errors · `node scripts/a11y-audit.cjs` (5175): **0 AA violations on all 21 URLs**; only `color-contrast-enhanced` left (owner) · e2e **62 passed** (27 + 35 new, 2.0 min; Playwright reused the dev server already on 5173, pid 67648, not started by P2).

**Notes for next phases:**
- `useFocusTrap` keeps a module-level stack and a document `focusin` guard: a new dialog must use the hook, not its own trap. Initial focus now also counts `input/select/textarea`.
- Don't add `scroll-mt-*` to sections (the html padding does it); a new sticky bar under the header needs `data-sticky-subnav`.
- `Layout` moves focus to the `<h1>` after a page change: every page needs exactly one `<h1>` (all 20 have one).
- New looping decoration must stop within 5 s (`useLoopWindow`) unless it has a pause control.
- `.hit-44` uses `::after`: not on an element that already uses `::after` or clips overflow.
- Resource Centre card titles are `<h2>` (tests query level 2).
- e2e now takes ~2 min (was ~20 s), ~1.7 min of it the a11y spec. CI still doesn't run e2e (P6 may want the a11y spec in CI).
- P3: `<html lang="en">` stays; Gujarati is marked per run, not per page.

**Orchestrator check (P2):**
- Diff reviewed: no snapshot, threshold, brand-token or YAML edits.
- Gates re-run: lint pass; content:validate 0/0; 36 files / 408 tests; build pass; e2e 62 passed (2.1 min).
- `node scripts/a11y-audit.cjs` (port 5175): 0 AA violations on all 21 URLs; AAA `color-contrast-enhanced` remains (owner question on tokens).
- Spot checks in Chrome:
  - keyboard click on header "Contact" → focus on `<h1>` "Get in Touch";
  - the Resource Centre has 5 `lang="gu"` elements on the first page;
  - fellow profile: 15 × Tab and 9 × Shift+Tab stay inside the dialog; Enter on a focused card, then Escape, returns focus to the card;
  - base-path preview `/tide-testing/pramaan/resource-centre/W1` and `/about/our-partners`: 0 broken images, no doubled base, `scroll-padding-top: 150px` on Partners, 0 console errors.
- Commits: `dd4e222` (fixes), `63cf92e` (tests, scan, docs, ledger).
- Note for the owner: P2-3 changes visible behaviour. Decorative loops (homepage scroll cue, Partners banner lights, wave divider, etc.) now rest after 5 s, because of WCAG 2.2.2 (an AA criterion).

## P3 — Technical SEO and AI discoverability

**Method.** (1) `curl` of the deployed staging site `https://vaibhav-sharma0105.github.io/tide-testing/` (status, body, headers) and of `https://tideinternational.org` (what the canonical host serves). (2) Reading `index.html`, `public/404.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `SeoHead`, `siteDataPlugin.js`, `react-helmet-async@3.0.0` and `react-dom@19.2.4` (how head tags are hoisted). (3) A real-browser check (Playwright Chromium) of the deployed site and of the new build behind a local server that mimics GitHub Pages' file rules (`x` → `x.html`, folder → 301 to `x/`, otherwise `404.html` with HTTP 404; scratch script, not committed — the slash-vs-`.html` precedence is my assumption, see P3-3). (4) Lighthouse 12.8.2 (SEO + performance, mobile + desktop) on 6 routes, before (deployed) and after (local). Not done: Google Rich Results Test / Search Console (external tools with an account), a real GitHub Pages deploy of the new build (the orchestrator doesn't push).

| ID | Sev | Location | Evidence | Status |
|---|---|---|---|---|
| P3-1 | Critical | every inner route on GitHub Pages | `curl -w %{http_code}` on staging: `/about/why-tide`, `/pramaan/resource-centre`, `/pramaan/resource-centre/W1` → **404** (505-byte `404.html`: a `<title>TIDE Foundation</title>` and a JS redirect, no text); `/nope` identical. Googlebot gets a 404 for every inner page; crawlers without JS get nothing | Fixed: build-time prerender (`scripts/prerender.mjs`) writes `about/why-tide.html` etc.; GitHub Pages serves `x.html` for `/x` with 200 (verified on the live host: `/tide-testing/404` → 200 from `404.html`, `/tide-testing/index` → 200). New build behind the emulator: every primary route + 241 resource pages 200, unknown paths 404 with the NotFound page |
| P3-2 | Critical | `/` (and all routes) | Deployed `/` = 4,779-byte shell, `<div id="root"></div>` empty; title "TIDE Foundation" on every page; no description/canonical/og/breadcrumbs/body text without JS (Helmet runs client-side only) | Fixed: each prerendered file has its own `<title>`, description, canonical, og/twitter, JSON-LD and full `<main>` text (scroll reveals played, no `opacity: 0` left); table below |
| P3-3 | Medium | `outputFiles()` | `/pramaan`, `/pramaan/resource-centre`, `/education-for-harmony`, `/thrive` are both a page and a folder of pages. Which of `x.html` / `x/` GitHub Pages picks for `/x` was **not verified** (web search unavailable; can't deploy) | Mitigated: both `x.html` and `x/index.html` are written, so either answer is 200 (the folder case via a 301 to `x/`). Verify after the first deploy: `curl -I .../tide-testing/pramaan` |
| P3-4 | High | `src/main.jsx`, React 19 + `react-helmet-async@3` | Live staging `/about/why-tide`: **two `<title>` elements** ("Why TIDE? — TIDE Foundation" owned by React, + the static "TIDE Foundation"). helmet-async v3 hands title/meta/link to React 19 hoisting; React didn't reuse the HTML's title | Fixed: `main.jsx` removes every `<title>` (and the prerender's `data-prerender` head tags) before the first render → exactly one title/description/canonical/og:image on every checked route (15 routes, incl. redirects and 404) |
| P3-5 | High | `public/robots.txt` | Crawlers read robots.txt only at a host root: `https://vaibhav-sharma0105.github.io/robots.txt` → 404, so the file at `/tide-testing/robots.txt` is ignored on staging. Its `Sitemap:` and the sitemap's URLs point to `tideinternational.org`, whose own robots.txt/sitemap.xml are WordPress's (curl) | Fixed what code can: robots.txt + sitemap.xml generated from `site.yaml` `url` (one setting) and `crawlers`; comment in the file says so. Host question → owner |
| P3-6 | High | canonical host | Every canonical/og:url/breadcrumb points to `https://tideinternational.org/...`; that host is the old WordPress site (`generator WordPress 7.1.5`): `/about/why-tide` → 301 `/why-tide/`, `/pramaan` → 404. A canonical to a URL that redirects or 404s is ignored, so Google may index staging as a duplicate | Owner decision (below); `site.yaml` `url` is the single canonical base; new `indexable: false` switch adds noindex site-wide |
| P3-7 | Medium | `public/sitemap.xml` | Hand-typed, 16 URLs, no `<lastmod>`, no resource pages | Fixed: generated at build (`siteDataPlugin`) from `src/config/siteRoutes.js` + snapshot: 16 primary pages (SCF excluded, owner decision) + 241 resource pages; `<lastmod>` = last git commit of the page's YAML/snapshot (left out in a shallow clone; `deploy.yml` checkout now `fetch-depth: 0`). Test fails if a primary route is missing |
| P3-8 | Medium | redirect routes | `/pramaan-library`, `/about/publications` were 404 + client redirect; no noindex/canonical | Fixed: forwarding files (noindex, canonical = new address, `location.replace` keeping query + hash, meta refresh fallback). Real 301s are impossible on GitHub Pages. `/pramaan-library/:id` → 404 page + the app's `Navigate` (as before) |
| P3-9 | Medium | `public/404.html` (P1-5) | typed title; redirect trick | Replaced: `dist/404.html` is the prerendered NotFound page (noindex). The app still starts on it and renders the matching route (trailing slash, `/pramaan-library/W1` checked). `index.html`'s `?/` restorer kept for old links |
| P3-10 | Medium | `SeoHead` og:image | `window.location.origin` at render: in a prerender this would bake `localhost` | Kept the runtime rule (owner-documented); the prerender loads pages at the real origin (`SITE_ORIGIN` or `https://<GITHUB_REPOSITORY_OWNER>.github.io`) via request interception, so CI output is correct. Local builds show `http://localhost:4173` (not deployed) |
| P3-11 | Low | `site.yaml` `description` (P1-8) | "since 2014" typed | Fixed → `{foundingYear}` (filled by `siteDescription()`); JSON-LD output unchanged (test) |
| P3-12 | Medium | JSON-LD | NGO had no `sameAs`/`address`; resource pages had only BreadcrumbList | Fixed: NGO `sameAs` (footer.yaml social hrefs) + `address` (contact.yaml, text — parts aren't stored); `LearningResource` on every resource page (name, description, type, subject, grades, creator, languages mapped from the Sheet's words; no image/video: no stable URL / no upload date). Existing: WebSite, BreadcrumbList (all inner pages), ItemList on both publication pages |
| P3-13 | Medium | `content/shared/llms.txt` | Hand-typed "Key Pages" list (could drift); no full-text file | Fixed: `{{pages}}` = one line per sitemap page from its YAML (breadcrumb name + `seoDescription`); `dist/llms-full.txt` (≈49 KB) = title + URL + visible `<main>` text of each sitemap page from the prerender. Hand-typed figures left as they are → owner |
| P3-14 | Medium | Resource Centre pagination | Prerendered `/pramaan/resource-centre` links only the first page's resources with `<a href>` (9 unique `/pramaan/resource-centre/<id>` hrefs); pages 2+ are buttons. THRIvE pubs use real `?page=` links (4) | Deferred (component change; the sitemap now lists all 241, which covers discovery) |
| P3-15 | Medium | Core Web Vitals (mobile) | Lighthouse: LCP element on inner pages = the banner texture `div` (CSS background, 6 % opacity); render-blocking Google Fonts CSS (8 families incl. Devanagari/Gujarati) est. 1.36 s; unused JS 211 KiB (framer-motion, react, router); `<img>` without width/height | Deferred (font loading is tied to the owner's Devanagari decision; bundle work is P5) — see numbers below |
| P3-16 | Low | og:image | default og:image is the square logo PNG with `twitter:card summary_large_image` | Owner (needs a 1200×630 image) |
| P3-17 | Info | query states | canonical = `site.url + path` (query dropped) for `?search`, `?page`, `?batch`, `?fellow`, `?type` → every filtered/paged state canonicalises to the base page; no noindex needed. Publications JSON-LD ItemList already lists every row, so page 2+ items are still described | Policy recorded (no change); `?fellow=` → owner |
| P3-18 | Info | `hreflang` | none (English only) — correct | Pass |

**Before / after per route (what a crawler without JavaScript receives).** Before = deployed staging (curl, 2026-11-24). After = the new build behind the GitHub Pages emulator. Title / description / canonical are each page's own YAML values after.

| Route | Status before → after | Title (no JS) | Description | Canonical | JSON-LD types (after) | `<h1>` without JS |
|---|---|---|---|---|---|---|
| `/` | 200 → 200 | "TIDE Foundation" → page title | none → yes | none → `/` | NGO, WebSite, BreadcrumbList | no → yes |
| `/about/why-tide`, `/about/past-programs`, `/about/our-team`, `/about/our-partners` | 404 → 200 | 404 shell → page title | none → yes | none → self | NGO, WebSite, BreadcrumbList | no → yes |
| `/tide/publications`, `/thrive/publications` | 404 → 200 | → page title | → yes | → self | + ItemList | no → yes |
| `/education-for-harmony`, `/mccx`, `/social-changemakers` | 404 → 200 | → page title | → yes | → self | NGO, WebSite, BreadcrumbList | no → yes |
| `/pramaan`, `/pramaan/resource-centre`, `/pramaan/contribute` | 404 → 200 | → page title | → yes | → self | NGO, WebSite, BreadcrumbList | no → yes |
| `/pramaan/resource-centre/:id` (241) | 404 → 200 | → resource title | → yes | → self | + LearningResource | no → yes |
| `/get-involved/volunteer`, `/get-involved/donate`, `/thrive`, `/contact` | 404 → 200 | → page title | → yes | → self | NGO, WebSite, BreadcrumbList | no → yes |
| `/pramaan-library`, `/about/publications` | 404 → 200 forwarding page | site name | — | → new address, noindex | — | — (forwards) |
| unknown path | 404 → 404 | "TIDE Foundation" → "Page Not Found — …" | — | none, noindex | NGO, WebSite | no → yes |

**Lighthouse 12.8.2 (SEO / Performance; mobile LCP, TBT).** Before = deployed staging over the internet (GitHub's CDN). After = the new build on a local server with gzip that mimics GitHub Pages (the same machine; Lighthouse's simulated throttling), so the two are close but not identical conditions.

| Route | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---|---|---|---|
| `/` | SEO 100 · Perf 76 · LCP 5.3 s · TBT 30 ms | 100 · 72 · 5.9 s · 70 ms | 100 · 97 | 100 · 96 |
| `/about/why-tide` | 100 · 71 · 5.7 s · 23 | 100 · 75 · 5.2 s · 19 | 100 · 96 | 100 · 96 |
| `/about/our-partners` | 100 · 75 · 5.6 s · 41 | 100 · 66 · 5.7 s · **298** | 100 · 96 | 100 · 96 |
| `/tide/publications` | 100 · 77 · 5.3 s · 37 | 100 · 75 · 5.3 s · 30 | 100 · 97 | 100 · 97 |
| `/thrive/publications` | 100 · 73 · 5.4 s · 47 | 100 · 74 · 5.5 s · 51 | 100 · 96 | 100 · 97 |
| `/pramaan/resource-centre` | 100 · 75 · 6.1 s · 25 | 100 · 69 · 5.9 s · 97 | 100 · 94 | 100 · 95 |

CLS ≤ 0.026 everywhere, before and after. Lighthouse's SEO score was already 100 before: it runs JavaScript and follows the 404 page's redirect, so it never saw P3-1/P3-2. Performance is about level; the one clear difference is Partners mobile TBT (298 vs 41 ms), likely the app re-rendering a large prerendered page — not investigated further (P5/P6). Without gzip the local numbers were much worse (mobile LCP 7.9–9.6 s): the uncompressed local server, not the site.

**Changes:** `scripts/prerender.mjs` + `scripts/lib/prerender-check.js` (new; `npm run build` = `vite build && node scripts/prerender.mjs`) · `src/routes.js` (new: route table + `preloadPage`, moved out of `App.jsx`), `src/App.jsx` (maps the table), `src/utils/reloadOnStaleChunk.js` (`lazyPage().preload()`; a mounted page keeps its direct/lazy form), `src/main.jsx` (title + prerender head cleanup, preload before first render) · `src/config/siteRoutes.js` (new: public addresses for prerender + sitemap) · `scripts/siteDataPlugin.js` (robots.txt, sitemap.xml with git lastmod, llms `{{pages}}`, NGO `sameAs`/`address`, `{foundingYear}`; served in dev too) · `content/shared/site.yaml` (`indexable`, `crawlers`, url comment, `{foundingYear}`), `content/shared/llms.txt` (`{{pages}}`, llms-full pointer) · `src/components/ui/SeoHead.jsx` (`indexable`) · `src/utils/libraryJsonLd.js` (new) + `PramaanLibraryDetail.jsx` (LearningResource) · removed `public/404.html`, `public/robots.txt`, `public/sitemap.xml` (now generated) · `.github/workflows/deploy.yml` (`fetch-depth: 0`; `npx playwright install --with-deps chromium` before Build) · tests: `src/test/scripts/seoBuild.test.js`, `src/test/routing/siteRoutes.test.jsx`, `src/test/utils/libraryJsonLd.test.js` (new), `siteDataPlugin.test.js` (+3) · docs: `CLAUDE.md`, `AGENTS.md` (§1 data flow, §2 public/, SeoHead, §9 new page step 6, §10 base path, §11 BrowserRouter, test counts). **No new dependency** (Playwright `@playwright/test` was already a dev dependency; Lighthouse ran via `npx`, not installed). No runtime architecture change: still `BrowserRouter` + `createRoot` (no hydration), `react-helmet-async` unchanged.

**Gates (2026-11-24, after the changes):** lint pass (exit 0) · content:validate 0 warnings / 0 errors · `npm test` **39 files / 446 tests** passed (P2: 36 / 408; +38: seoBuild 10, siteRoutes 22, libraryJsonLd 3, siteDataPlugin +3) · `npm run build` pass (vite 4.7 s + prerender 259 pages + 2 redirects in 68.5 s) · base-path build pass (prerender 63.5 s at `http://localhost:4173/tide-testing/`) + GitHub-Pages emulator check in Chromium on 15 addresses (`/`, `/about/why-tide`, `/about/why-tide/`, `/about/our-partners`, `/tide/publications`, `/thrive/publications?page=2`, `/pramaan/resource-centre?type=worksheet`, `/pramaan/resource-centre/W1`, `/pramaan-library/W1`, `/pramaan-library?type=game`, `/about/publications?type=x`, SCF, `/get-involved/donate`, `/contact`, `/nope`): right page and query string, exactly one `<title>`/description/canonical/og:image, 0 leftover `data-prerender` tags, 0 frames without an `<h1>` while the app replaces the prerendered page (one redirect case navigates, as before), no console errors or React warnings (no hydration: the app renders fresh), keyboard page change still lands on `<h1>`; 0 broken images, 0 placeholders, 0 `tide-testing/tide-testing` on `/`, `/about/our-team`, `/pramaan/resource-centre/W1`, `/thrive/publications` · `node scripts/a11y-audit.cjs` (5175): 0 AA violations on 21 URLs (AAA contrast unchanged) · e2e **62 passed** (2.2 min, dev server).

**Notes for next phases:**
- `npm run build` now needs Playwright's Chromium (CI installs it; locally `npx playwright install chromium`), takes ~65 s more (259 pages, 6 in parallel; `PRERENDER_CONCURRENCY`), and **fails** if any page has no title, ≠ 1 `<h1>`, almost no text, a wrong canonical or a page error. A page that throws in headless Chromium will now stop the deploy.
- New public page → add it to `src/config/siteRoutes.js` (the siteRoutes test fails otherwise). New route in the app → `src/routes.js`, not `App.jsx`.
- The app does **not hydrate**; it renders over the prerendered HTML. Anything that reads `document` before React mounts sees the prerendered DOM. `main.jsx` removes `<title>` and `[data-prerender]` head tags first — don't add hand-written head tags that rely on surviving that.
- `vite preview` still can't show GitHub Pages' statuses; use the scratch emulator approach (file → `.html` → folder 301 → `404.html` with 404) or the real deploy. **First deploy check (P3-3):** `curl -I` `/tide-testing/about/why-tide` (expect 200), `/tide-testing/pramaan` (200, or 301 → `/pramaan/` then 200), `/tide-testing/nope` (404).
- P4: `deploy.yml` changed (two steps); the CSP meta is unchanged and the forwarding pages use an inline script (no CSP meta in them). P5: `src/routes.js` / `lazyPage` changed. P6: e2e still runs on the dev server only — the prerendered build is covered by the prerender's own checks + unit tests; an e2e against `dist/` would be the next step.
- og:image origin comes from `SITE_ORIGIN` / `GITHUB_REPOSITORY_OWNER`: set `SITE_ORIGIN` if the site moves to its own domain.

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
- **(P2) Contrast at AAA (1.4.6, 7:1).** Brand tokens fail 7:1 for normal-size text: `tide-muted #5A6A7E` 5.39 on `#FDFCF9` (about 200 nodes), `primary #1E6BAA` as text 5.47 (white on primary buttons 5.62), `accent-deeper #B45309` 4.89, `mutedOnLight #4D5C6F` 6.65. AA (4.5) passes everywhere. Recommendation, following the `accent-deeper` / `mutedOnLight` pattern (text-only; brand hues unchanged for fills): body-size `text-primary` → the existing `primary-dark #15538A` (7.76 on cream / 7.97 on white / 7.29 on `primary-faint`); a new `tide-mutedStrong #44515F` (7.91 / 8.11 / 7.43); a new amber text token `#843A0C` (7.90 / 8.10 / 7.81 on `#FFFBEB`); white-text buttons on `primary-dark` (7.97). Trade-off: the site reads darker and less "brand blue". Large text (≥ 24 px, or 19 px bold) already passes at 4.5. Not applied.
- **(P2) SCF intro dot loops forever (2.2.2, AA).** The walk restarts at the first stop by owner decision (2026-11-23), so it is decorative motion with no stop. Recommendation: walk the three stops once or twice (≤ 5 s of motion), then rest on the finished thread (what reduced-motion visitors already see), or add a small pause button (needs copy). Trade-off: the "journey" plays only on arrival.
- **(P2) Target size 2.5.5 (AAA, 44 px) vs the button scale (2026-11-24: `sm` = 36 px).** `Button size="sm"`, pagination numbers (36 px, 2–4 px apart), Resource Centre grade chips (30 px), Contact page links (28 px, stacked) and the search fields (42 px) stay under 44 px. All pass AA 2.5.8. Recommendation: `sm` → 44 px minimum (or retire `sm`), pagination and chips 44 px tall. Trade-off: denser rows grow, and pagination wraps sooner on phones.
- **(P2) Link text (2.4.9) and abbreviations (3.1.4), AAA.** Two "Find out more" links (`education-for-harmony.yaml:57,64`) and two "Apply via Google Form" links to different forms (`get-involved-volunteer.yaml:25,42`): please supply distinct wording. Should SCF, MCCx, ABL and THRIvE be spelled out on first use on each page (wording needed)?
- **(P2) Video captions (1.2.2 / 1.2.5).** The YouTube/Drive videos (Pramaan promo, Education for Harmony, resource explanation videos, SCF films) can't be checked from the code. Do they have accurate captions (not auto-generated) and, where the speech doesn't describe the visuals, a transcript? Transcripts would be the owner's content, not written by us.
- **(P2) Devanagari text.** Only the word "भरो" appears, in three Gujarati titles (W65, W70, W72; possibly a typo for Gujarati "ભરો", a Sheet question). If stand-alone Devanagari titles appear, should they be marked Hindi (`lang="hi"`)? Without a rule they stay unmarked.

- **(P3) Canonical host and staging indexing.** Canonicals, sitemap and robots point to `https://tideinternational.org`, which still serves the old WordPress site (where `/about/why-tide` redirects to `/why-tide/` and `/pramaan` is a 404), while this build lives at `vaibhav-sharma0105.github.io/tide-testing/`. Recommendation: until the domain moves, set `site.yaml` `indexable: false` (one line; noindex on every staging page) and keep `url` = `https://tideinternational.org`; flip `indexable` back to `true` at cutover. Trade-off: staging doesn't show in Google/AI answers meanwhile, but it can't compete with the live site as a duplicate. The other option (url = staging host, indexable) builds ranking on an address that will be abandoned.
- **(P3) Old WordPress addresses at cutover.** GitHub Pages can't send 301s. When `tideinternational.org` points to this build, every WordPress URL (`/why-tide/`, its posts, `sitemap.rss` …) will 404 and lose its search history. Recommendation: export the WordPress sitemap, approve a list of old → new addresses, and the build can write a forwarding page per address (same mechanism as `REDIRECT_ROUTES` in `src/config/siteRoutes.js`). Trade-off: forwarding pages are a weaker signal than real 301s; a host with redirects (e.g. Cloudflare in front of Pages) would do better but is an infrastructure change.
- **(P3) AI training crawlers.** `robots.txt` now separates search/answer bots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot, …: allowed) from training bots (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, …). All were allowed before and still are (`site.yaml` `crawlers.allowTraining: true`). Keep or set to `false`? Trade-off: allowing training spreads TIDE's material into AI models' general knowledge; disallowing keeps control but doesn't affect being cited in AI search answers.
- **(P3) Figures in `llms.txt` that the site doesn't show.** "15,000+ students" (Education for Harmony), "100+ current volunteers", "Impact (as of 2025)" are typed only in `content/shared/llms.txt`; "12 years" / home pill "12 yrs" are typed text that goes stale each year (`foundingYear` is 2014). Also `home.yaml` `seoDescription` says "six independent projects" while llms.txt and the menus describe three pillars. Please confirm or correct each; answer engines lower trust when a site contradicts itself. (Not changed.)
- **(P3) Fellow profiles (`?fellow=`) in search.** Today they canonicalise to the Social Changemakers page and carry no `Person` markup (personal data of students). Recommendation: keep it that way; the page itself stays out of the sitemap by the existing owner decision.
- **(P3) Missing organisation facts for structured data.** Address parts (street, postal code, region — today one text line in `contact.yaml`), a phone number, registration / 80G identifiers, and a 1200×630 share image (the og:image is the square logo). Supply any you want published.
- **(P3) Fonts vs speed.** The Google Fonts request (Playfair, Plus Jakarta, Caveat, Noto Sans/Serif Devanagari, Noto Sans/Serif Gujarati, 30+ weights) blocks rendering (Lighthouse: est. 1.36 s on mobile). Recommendation: drop weights not used, load the Devanagari/Gujarati families only where needed (or self-host subsets). Trade-off: Devanagari is kept by owner decision; any change needs a visual check.

## Deferred / out of scope

- ~~P1-5/6 (→ P3)~~: done in P3 (404.html, robots.txt, sitemap.xml now generated).
- P1-7: favicon path typed in `index.html` (works under the base path; moving it into `siteDataPlugin` needs hook-order work).
- P1-8: "since 2014" fixed in P3; the `llms.txt` figures are an owner item (P3).
- P2-5: the `/coming-soon` scene loops forever (2.2.2); the page is linked from nowhere. Apply `useLoopWindow` (or the static reduced scene after 5 s) if the page is ever used.
- P2-16 (rest): pagination, grade chips, Contact links, footer social icons and search inputs are under 44 px (AAA). Fixing them is a visible size change → owner item above.
- P2-20: Escape pressed inside a cross-origin video iframe can't reach the page (browser limit).
- P2-21: the Resource Centre card link's `aria-label` hides type, subject and "video available". Rethink as `aria-labelledby` or a fuller `card.viewTemplate` (copy).
- P3-14: Resource Centre pagination is buttons, so only the first page's resources are linked in the HTML (the sitemap lists all 241). Make the page numbers `<a href="?page=n">` like THRIvE's.
- P3-15: mobile LCP (banner texture as a CSS background is the LCP element on inner pages; no `fetchpriority`/preload), render-blocking fonts (owner item), 211 KiB unused JS (P5), `<img>` without width/height.
- P3: `CollectionPage` markup on the listing pages, `VideoObject` (the Sheet has no upload dates), `DonateAction` (no facts in YAML) — not added.
- P3: no e2e runs against the prerendered `dist/` (P6); the first real deploy must be checked with `curl -I` (P3-3).
- P1-7 still open (favicon path typed in `index.html`).
- P2 not done: a screen-reader listening session (NVDA/VoiceOver), a separate 200 % text-only zoom pass, 3.1.5 reading level.

## Final gate results

_Not run yet._
