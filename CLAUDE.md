# TIDE Foundation Website — Claude Context

## Fundamental Rule — Facts Only
**Never assume, fabricate or forge data.** Every claim, number, name, URL, quote, status or result must come from a source of truth: the code, a file, a command's real output, an official document, the live site, or the owner. Then:
- **State the source** (file:line, command, URL, or "the owner said") for anything that matters.
- **If something isn't verified, say so plainly** ("not verified", "I couldn't check this") — don't present a guess as fact, and don't fill gaps with plausible-sounding content.
- **If the information isn't available, ask** instead of inventing it — this includes content for the site (names, designations, figures, links, copy).
- **Report outcomes as they really are**: failed tests, skipped steps, partial results and errors are stated, not smoothed over.

## Project Overview
React static site rebuild of [tideinternational.org](https://tideinternational.org/) for TIDE Foundation (Together in Development and Education), an NGO in Ahmedabad, India focused on educational reform. `AGENTS.md` is the detailed reference (component/hook/utility APIs, full repo tree, §11 Gotchas, §12 tests).

## Tech Stack
- **Vite 8 + React 19** static site; **React Router v7** `BrowserRouter` (clean URLs — GitHub Pages deep links/reloads work via `public/404.html` + a restore script in `index.html`, not hash routing)
- **Tailwind CSS v3**, **Framer Motion 12**, **Lucide React**, **react-helmet-async** (always via `src/components/ui/SeoHead.jsx`)
- **English only.** The multilingual framework (i18next, `t()`, language switcher) was removed; it is preserved in the local git tag `archive/multilingual-framework` (`git show archive/multilingual-framework:<path>`).

## Deployment & CI
- `npm run build` → `dist/` → GitHub Pages at `/tide-testing/`. `vite.config.js` sets base `/tide-testing/` when `GITHUB_ACTIONS` is set, else `/` — so dev hides base-path bugs (see `imgSrc` below). The build needs no secrets.
- `.github/workflows/deploy.yml` (push to `main` / manual): `npm ci` → `npm run lint` → `npm run content:validate` → `npm test` → `npm run build` → deploy. Any failure stops the deploy. **CI does not run the Playwright e2e specs** — run them locally.
- `.github/workflows/sync-pramaan-library.yml` syncs the Resource Centre (below) and starts `deploy.yml` itself after committing. Both workflows open/close `automation-alert` Issues assigned to repo variable `ALERT_ASSIGNEE`; both pin `ubuntu-24.04` and Node 24 (bump deliberately). Mechanics: AGENTS.md §10.

## Design System
- Primary `#1E6BAA` · Background `#FDFCF9` · Text `#0D1F3C` · Accent `#F59E0B` — full token map in `tailwind.config.js` (trust it over any doc).
- **Accent as text/icon only on dark backdrops** (5.9–7.6:1). On light backgrounds use `text-accent-deeper` (`#B45309`); `#F59E0B` there is ~2.1:1 and fails WCAG AA. Same idea: `tide-muted` → `tide-mutedOnLight` on `bg-primary-light`. See AGENTS.md §3.
- Fonts: `font-display` (Playfair Display) and `font-body` (Plus Jakarta Sans), each with Noto Devanagari/Gujarati glyph fallbacks — Gujarati is needed for Pramaan resource titles; keeping Devanagari is an owner decision.
- **Accessibility:** audited against WCAG 2.2 AA (2026-06-22); lint doesn't check it. Re-scan: `npx vite --port 5175`, then `node scripts/a11y-audit.cjs` (AGENTS.md §12). The global `:focus-visible` ring (`src/index.css`) is a brand-blue outline plus a white band so it shows on navy sections — check git history around that date before changing interactive components or colour tokens.

## Repository Structure
```
src/
  components/  layout/ (Header, Footer, Layout) · ui/ (Button, PageHero, SeoHead, Lightbox, …)
               abl/ (shared Pramaan pieces: AblNavBar, Pagination, DriveImage, ImageLightbox, VideoLightbox, …)
               library/ (Resource Centre: LibraryFilters, LibraryDropdown, LibraryCard, LibraryTypeBadge) · ErrorBoundary.jsx
  pages/       Home, Contact, THRIvE, EducationForHarmony, SocialChangemakers, ComingSoon, NotFound
               about/ · get-involved/ · resources/ (AblHome, AblContribute) · library/ (PramaanLibrary, PramaanLibraryDetail, LibraryRedirect)
  hooks/ config/ (abl.js, library.js) utils/ test/   App.jsx (routes) · main.jsx · index.css
  data/        AUTO-GENERATED — never edit
content/pages/ (16 YAMLs) · content/shared/ (9 YAMLs + llms.txt template)
scripts/       yaml-to-json, siteDataPlugin, validate-content, contentConsistency, bootstrap-yaml,
               sync-pramaan-library + lib/ (library-snapshot, snapshot-core), ci/alert-issue.sh, a11y-audit.cjs
apps-script/pramaan-library/Code.gs   the Resource Centre Sheet's Apps Script (source of truth; the owner pastes it into Google)
e2e/ (Playwright, 3 specs) · docs/ (guides, playbook, architecture diagrams, specs/)
```
Full annotated tree: AGENTS.md §2.

## Pages
`src/App.jsx` registers 22 `<Route>`s (20 lazy-loaded page components): 17 primary, 2 redirects, 3 system.

| Route | Component | Data |
|-------|-----------|------|
| `/` | Home | `home.json` |
| `/about/why-tide` · `/past-programs` · `/our-team` · `/our-partners` · `/publications` | WhyTide · PastPrograms · OurTeam · OurPartners · PublicationsCombined | `about-*.json` |
| `/education-for-harmony` | EducationForHarmony | `education-for-harmony.json` |
| `/education-for-harmony/mccx` | OrganizeMCCx | `get-involved-mccx.json` |
| `/education-for-harmony/social-changemakers` | SocialChangemakers | `social-changemakers.json` (placeholder grid) |
| `/pramaan` | AblHome | `abl-home.json` + counts/types from the snapshot |
| `/pramaan/resource-centre` (+ `/:id`) | PramaanLibrary (+ PramaanLibraryDetail) | `pramaan-library.json` + snapshot `sheets/pramaan-library.json` |
| `/pramaan/contribute` | AblContribute | `abl-contribute.json` (`formUrl`) |
| `/pramaan-library` (+ `/:id`) | LibraryRedirect | → `/pramaan/resource-centre(/:id)`, keeps the query string |
| `/get-involved/volunteer` · `/get-involved/donate` | Volunteer · Donate | `get-involved-*.json` |
| `/thrive` · `/contact` | THRIvE · Contact | `thrive.json` · `contact.json` |
| `/coming-soon` · `/404` and `*` | ComingSoon · NotFound | `coming-soon.json` · `not-found.json` |

- The 16 pre-restructure routes (`/projects/*`, `/about/our-results`, `/get-involved/{work-with-us,mccx}`, `/resources/*`) were **removed with no redirects** (owner decision); they render NotFound (`src/test/routing/removedRoutes.test.jsx`). Don't re-add them.
- `/education-for-harmony/social-changemakers` is deliberately **not** in the header/footer menus or `sitemap.xml` (linked only from `/education-for-harmony`) while it is a placeholder.
- Footer has **no link columns** (owner decision): one compact row with Donate as the only coloured element. Details: AGENTS.md §4.

## CMS Pipeline
```
content/pages/*.yaml + content/shared/*.yaml  →  scripts/yaml-to-json.js (predev/prebuild)  →  src/data/*.json  →  React imports
content/shared/site.yaml + llms.txt           →  scripts/siteDataPlugin.js (Vite)  →  index.html JSON-LD/<title>/og:site_name, /llms.txt
```
- **Never edit `src/data/`** — it is regenerated (flat: one JSON per YAML basename, so never reuse a basename across `pages/` and `shared/`; stale JSON is never deleted). The Resource Centre files there (`sheets/pramaan-library.json`, `pramaan-library-photos.json`) are written by the sync bot — never hand-edit those either.
- Commands: `npm run content:sync` · `content:validate` (YAML syntax, leading-slash image paths, Resource Centre snapshot, `formUrl`, email/lives-impacted consistency) · `dev` (localhost:5173) · `build` · `lint` · `test` (Vitest, 17 files / 194 tests) · `test:e2e`.
- **No hardcoded visible text:** every visible string comes from YAML (`data.*`, `common.*`, `ui.*`), never typed into JSX. `react/jsx-no-literals` is an **error** in `src/pages/**` and `src/components/**`, but it does not see string props (`aria-label`, `alt`, `title`) — follow the convention anyway (`cms-integrity` skill). Variable text uses `{token}` placeholders filled in code.
- **Site-wide facts** (name, url, email, `livesImpacted`, `gradeRange`, `placeholderImage`, `breadcrumbs.*`, …) live only in `content/shared/site.yaml`. A page's last breadcrumb is `meta.breadcrumbName` in its own YAML.
- Icons and Tailwind classes can't live in JSON: store a key in YAML (`iconKey`, `colorKey`) and map it in the component; never build Tailwind class names dynamically.
- Guides: `CONTENT-GUIDE.md` (non-technical), `.claude/skills/content-management.md` (agent reference).

## Pramaan / Resource Centre
Pages `/pramaan`, `/pramaan/resource-centre` (+ `/:id`), `/pramaan/contribute`, each with the `AblNavBar` tab bar. **No Pramaan page calls Google at runtime.** The Resource Centre *is* the Pramaan Library (owner decision, 2026-11-19), in snapshot mode:
```
Google Sheet (private, has personal data)
  → apps-script/pramaan-library/Code.gs   token-gated; publishes a row only when consent columns Q–S are "Yes"; never outputs personal columns L–P
  → sync-pramaan-library.yml (every 6 h, on Sheet change, manually) → scripts/sync-pramaan-library.js
  → commits src/data/sheets/pramaan-library.json + src/data/pramaan-library-photos.json + public/assets/images/pramaan-library/ → deploy
```
- Safety rules: the sync refuses mass removals (> max(10, 20%) of rows) unless run with `allow_large_change` — never loosen the thresholds; it never deletes a photo because Drive failed; problems become GitHub Issues. Secrets: `PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN`.
- **Never read a Sheet live in the browser.** The former live-read Resource Centre (`useABLData`, `apps-script/abl/`, its sync, pages and docs) was retired 2026-11-19 and is only in the local tag `archive/pramaan-live-read`. Details of what was kept/left: AGENTS.md §8.
- **New Sheet integrations** copy this one: `docs/SHEET-INTEGRATION-PLAYBOOK.md` + the `sheet-integration` skill.
- Contribute form link = `content/pages/abl-contribute.yaml` → `formUrl` (not a secret; must be a Google Forms link or empty). Resource-type colours: `src/config/abl.js`; labels: `abl-home.yaml` → `resourceTypes.labels` (adding a type needs both).
- Docs: `docs/PRAMAAN-HARDENING-PLAN.md` §12–13 (status), `PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `PRAMAAN-LIBRARY-SHEET-SCHEMA.md`, `OPERATIONS-RUNBOOK.md`, `PLATFORM-LIMITS.md`, `MIGRATION-OVERVIEW.md` (handover), `ARCHITECTURE*.html` (keep both diagrams in sync).

## Known Gotchas and Open Decisions
- **`imgSrc()` is not idempotent** under `/tide-testing/`: applying it twice breaks the URL on GitHub Pages (invisible in dev). `Lightbox` applies it itself — pass raw YAML paths. Verify with a `GITHUB_ACTIONS=true` build + preview.
- **Don't write a literal `<title>` inside an HTML comment in `index.html`** — `siteDataPlugin`'s regex would replace it instead of the real one; keep the `<!-- site-jsonld -->` marker.
- **Owner-decided facts:** email `tidefoundation@gmail.com`, lives impacted `52,500+`, everywhere; `content:validate` errors on any other value in `content/`.
- **Failed images** are swapped site-wide for `site.placeholderImage` (`src/utils/imagePlaceholder.js`), which hides typos — check filenames. Opt out with `data-no-placeholder` (`DriveImage` does). `content:validate` doesn't check bare filenames (e.g. `logoGallery.images` in `about-our-partners.yaml`).
- **Deleted files are recoverable:** removed pages/images/components from 2026-10-25 via `git checkout a4126d1 -- <path>` (list in AGENTS.md §11).
- **Open (not decided):** (1) `site.yaml` `gradeRange` ("1–5") must agree with `LIBRARY_GRADES` in `src/utils/libraryFilters.js` (a unit test checks it); Foundational has no resources yet; (2) `about-publications.yaml` has an empty `research.items` and 10 entries with `link: ""` (needs owner content).

## Resuming Work
1. Read this file, then `AGENTS.md` (esp. §11 Gotchas). Before touching the Sheet / Apps Script / sync / deploy pipeline, read `docs/PRAMAAN-HARDENING-PLAN.md` §12–13 and `docs/PLATFORM-LIMITS.md`.
2. Project history lives in git and in Claude Code's auto-memory for this repo (not checked in); `docs/specs/site-restructure-plan.md` covers the route restructure.
3. `npm run dev` to work; before pushing run `npm run lint`, `npm test`, `npm run build` (and `npm run test:e2e`, which CI skips).
4. Skills: `cms-integrity` (any JSX that renders text/media), `doc-sync` (after structural changes), `sheet-integration` (new Sheet/Form).
