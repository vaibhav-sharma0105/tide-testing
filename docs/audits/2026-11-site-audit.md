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
- **(P2) Contrast at AAA (1.4.6, 7:1).** Brand tokens fail 7:1 for normal-size text: `tide-muted #5A6A7E` 5.39 on `#FDFCF9` (about 200 nodes), `primary #1E6BAA` as text 5.47 (white on primary buttons 5.62), `accent-deeper #B45309` 4.89, `mutedOnLight #4D5C6F` 6.65. AA (4.5) passes everywhere. Recommendation, following the `accent-deeper` / `mutedOnLight` pattern (text-only; brand hues unchanged for fills): body-size `text-primary` → the existing `primary-dark #15538A` (7.76 on cream / 7.97 on white / 7.29 on `primary-faint`); a new `tide-mutedStrong #44515F` (7.91 / 8.11 / 7.43); a new amber text token `#843A0C` (7.90 / 8.10 / 7.81 on `#FFFBEB`); white-text buttons on `primary-dark` (7.97). Trade-off: the site reads darker and less "brand blue". Large text (≥ 24 px, or 19 px bold) already passes at 4.5. Not applied.
- **(P2) SCF intro dot loops forever (2.2.2, AA).** The walk restarts at the first stop by owner decision (2026-11-23), so it is decorative motion with no stop. Recommendation: walk the three stops once or twice (≤ 5 s of motion), then rest on the finished thread (what reduced-motion visitors already see), or add a small pause button (needs copy). Trade-off: the "journey" plays only on arrival.
- **(P2) Target size 2.5.5 (AAA, 44 px) vs the button scale (2026-11-24: `sm` = 36 px).** `Button size="sm"`, pagination numbers (36 px, 2–4 px apart), Resource Centre grade chips (30 px), Contact page links (28 px, stacked) and the search fields (42 px) stay under 44 px. All pass AA 2.5.8. Recommendation: `sm` → 44 px minimum (or retire `sm`), pagination and chips 44 px tall. Trade-off: denser rows grow, and pagination wraps sooner on phones.
- **(P2) Link text (2.4.9) and abbreviations (3.1.4), AAA.** Two "Find out more" links (`education-for-harmony.yaml:57,64`) and two "Apply via Google Form" links to different forms (`get-involved-volunteer.yaml:25,42`): please supply distinct wording. Should SCF, MCCx, ABL and THRIvE be spelled out on first use on each page (wording needed)?
- **(P2) Video captions (1.2.2 / 1.2.5).** The YouTube/Drive videos (Pramaan promo, Education for Harmony, resource explanation videos, SCF films) can't be checked from the code. Do they have accurate captions (not auto-generated) and, where the speech doesn't describe the visuals, a transcript? Transcripts would be the owner's content, not written by us.
- **(P2) Devanagari text.** Only the word "भरो" appears, in three Gujarati titles (W65, W70, W72; possibly a typo for Gujarati "ભરો", a Sheet question). If stand-alone Devanagari titles appear, should they be marked Hindi (`lang="hi"`)? Without a rule they stay unmarked.

## Deferred / out of scope

- P1-5/6 (→ P3): `public/404.html` `<title>`, `robots.txt` and `sitemap.xml` repeat the site name / domain from `site.yaml` by hand; generating them from `site.yaml` is an SEO-phase call.
- P1-7: favicon path typed in `index.html` (works under the base path; moving it into `siteDataPlugin` needs hook-order work).
- P1-8 (→ P3): `site.yaml` `description` says "since 2014" in text; `llms.txt` hand-typed figures ("100+ partner organisations", "12 years", "as of 2025", "15,000+ students") may drift from the pages/snapshots.
- P2-5: the `/coming-soon` scene loops forever (2.2.2); the page is linked from nowhere. Apply `useLoopWindow` (or the static reduced scene after 5 s) if the page is ever used.
- P2-16 (rest): pagination, grade chips, Contact links, footer social icons and search inputs are under 44 px (AAA). Fixing them is a visible size change → owner item above.
- P2-20: Escape pressed inside a cross-origin video iframe can't reach the page (browser limit).
- P2-21: the Resource Centre card link's `aria-label` hides type, subject and "video available". Rethink as `aria-labelledby` or a fuller `card.viewTemplate` (copy).
- P2 not done: a screen-reader listening session (NVDA/VoiceOver), a separate 200 % text-only zoom pass, 3.1.5 reading level.

## Final gate results

_Not run yet._
