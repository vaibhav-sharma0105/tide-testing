# TIDE Foundation Website — Claude Context

## Fundamental Rule — Facts Only
**Never assume, fabricate or forge data.** Every claim, number, name, URL, quote, status or result must come from a source of truth: the code, a file, a command's real output, an official document, the live site, or the owner. Then:
- **State the source** (file:line, command, URL, or "the owner said") for anything that matters.
- **If something isn't verified, say so plainly** ("not verified", "I couldn't check this") — don't present a guess as fact, and don't fill gaps with plausible-sounding content.
- **If the information isn't available, ask** instead of inventing it — this includes content for the site (names, designations, figures, links, copy).
- **Report outcomes as they really are**: failed tests, skipped steps, partial results and errors are stated, not smoothed over.

## Project Overview
React static site rebuild of [tideinternational.org](https://tideinternational.org/) for TIDE Foundation (Together in Development and Education), an NGO based in Ahmedabad, India focused on educational reform.

## Tech Stack
- **Vite 8 + React 19** — static site, `npm run build` → `dist/`
- **React Router v7** (`BrowserRouter` — clean URLs; GitHub Pages deep-link/reload support comes from `public/404.html` + a redirect-restoration script in `index.html`, not from hash routing)
- **Tailwind CSS v3** — utility-first styling
- **Framer Motion 12** — animations and page transitions
- **Lucide React** — icons
- **react-helmet-async** — SEO meta tags (via `src/components/ui/SeoHead.jsx`)

**English only.** The multilingual (EN/HI/GU) framework — i18next, `src/i18n/`, `content/locales/`, the language switcher, the `t()` convention — was removed; pages read the YAML-generated JSON directly (`data.x.y`). The old code is preserved under the local git tag `archive/multilingual-framework` (commit `a4126d1`): `git show archive/multilingual-framework:<path>` reads a file, `git checkout archive/multilingual-framework` browses it all. `docs/specs/multilingual-i18n-spec.md` has the original design.

## Deployment
- `npm run build` → `dist/` → GitHub Pages at `/tide-testing/`
- CI: `.github/workflows/deploy.yml` — on push to `main` (and manual dispatch): `npm ci` → `npm run lint` → `npm run content:validate` → `npm test` → `npm run build` → upload `dist/` → deploy pages. A failing lint/validate/unit-test step stops the deploy. **CI does not run the Playwright e2e specs** — run those locally. The thumbnail-sync workflow starts this one itself after it commits (a push made with the default token would not). The thumbnail sync also adds an empty commit when the repository has been quiet for 45+ days, because GitHub disables scheduled workflows after 60 days of inactivity (see `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`). Both workflows run on a pinned `ubuntu-24.04` (not `ubuntu-latest`) and Node 24; bump them deliberately.
- Base path toggled via `GITHUB_ACTIONS` env in `vite.config.js` (`/tide-testing/` on CI, `/` locally). Dev (`/`) hides base-path bugs — see the `imgSrc` gotcha in AGENTS.md §11.
- Secrets required in GitHub: `VITE_ABL_API_URL`, `VITE_ABL_CONTRIBUTE_FORM_URL` (+ `ABL_SYNC_TOKEN` for the sync workflow, `.github/workflows/sync-abl-thumbnails.yml`); repo variable `ALERT_ASSIGNEE` (GitHub username that failure Issues are assigned to — both workflows open an `automation-alert` Issue on failure and close it on the next success). Deploys never cancel each other and always build the newest `main`.

## Design System
- **Primary:** `#1E6BAA` (TIDE teal-blue)
- **Accent:** `#F59E0B` (amber). **Use as text/icon color only on dark backdrops** (5.9-7.6:1) — on a light background use `text-accent-deeper` instead (`#F59E0B` itself is only 2.1-2.2:1 there, failing WCAG AA). See AGENTS.md §3's accessibility note before using either color as foreground text.
- **Background:** `#FDFCF9` (warm white)
- **Text:** `#0D1F3C` (near-black navy)
- **Headings:** Playfair Display, then Noto Serif Devanagari / Noto Serif Gujarati as glyph fallbacks (one combined `font-display` stack; no per-language switching)
- **Body:** Plus Jakarta Sans, then Noto Sans Devanagari / Noto Sans Gujarati (`font-body`). `index.html` still loads the Devanagari and Gujarati families: Gujarati is needed because Pramaan resource data contains Gujarati titles; the owner chose to keep Devanagari as a fallback too.
- Full token map in `tailwind.config.js`
- **Accessibility:** audited end-to-end against WCAG 2.2 AA (2026-06-22) — `npm run lint` doesn't check this. To re-scan: start a dev server on the port the script expects (`npx vite --port 5175`), then `node scripts/a11y-audit.cjs [port]` (port also via `A11Y_PORT`, default 5175; report goes to the OS temp dir as `a11y-report.json`, or `A11Y_REPORT`). Needs `@playwright/test`, `@axe-core/playwright` and an installed Chromium. Keyboard navigation, focus management (`src/hooks/useFocusTrap.js`), and color contrast were all verified by hand in addition to automated scanning — see git history around that date for the specific findings and reasoning if touching interactive components or color tokens. The global keyboard focus ring (`:focus-visible` in `src/index.css`) is a 2px brand-blue outline (`theme('colors.primary.DEFAULT')`) with a 2px offset plus a 2px white `box-shadow` band, so it stays visible on the dark navy sections where brand blue alone is only about 2.9:1.

## Repository Structure
```
src/
  components/
    layout/    # Header, Footer, Layout
    ui/        # Button, Card, SectionHeader, PageHero, SeoHead, AnimatedCounter, Highlight,
               # Lightbox, LightboxGallery, CreativeLoader, ComingSoonGraphic, SocialIcons, WaveDivider, ArchPortrait
    ErrorBoundary.jsx  # friendly crash screen (text from error.yaml; message/stack shown only in DEV)
    abl/       # AblNavBar, ResourceCard, ResourceGrid, ResourceFilters, Pagination,
               # ResourceTypeBadge, DriveImage, ImageLightbox, VideoLightbox, PromoVideo, PhotoStrip
    library/   # LibraryFilters, LibraryDropdown, LibraryCard, LibraryTypeBadge  (/pramaan-library)
  pages/
    Home.jsx / Contact.jsx / THRIvE.jsx / EducationForHarmony.jsx / ComingSoon.jsx / NotFound.jsx
    about/         # WhyTide, PastPrograms, OurTeam, OurPartners, PublicationsCombined
    get-involved/  # Volunteer, Donate, OrganizeMCCx
    resources/     # AblHome, AblResourceCenter, AblDetail, AblContribute  (the Pramaan screens)
    library/       # PramaanLibrary, PramaanLibraryDetail  (unlinked, noindex)
  hooks/           # useABLData, useLightbox, useModalBehavior, useFocusTrap,
                   # useDelayedVisible, useScrollAnimation
  config/          # abl.js (API URL, TTL, page size, TAB_STYLE_MAP, getTabStyle, TYPE_COLORS, getTypeColors), library.js
  utils/           # imgSrc, motionPresets, ablThumbnails, driveUtils, filterResources, imagePlaceholder,
                   # libraryFilters, videoLinks, libraryPhotos (Pramaan Library)
  test/            # Vitest suite (23 files, 294 tests) — incl. test/scripts/ (snapshot rules, simulated Apps Script)
  App.jsx          # BrowserRouter + 22 <Route>s + ErrorBoundary
  main.jsx         # Entry point; calls installImagePlaceholder()
  index.css        # Global styles + Tailwind base

content/
  pages/         # One YAML per page/screen (18 files) — edit these to change content
  shared/        # 9 YAMLs: navigation, footer, common, ui, loader, error, not-found, coming-soon, site
                 # + llms.txt (template for /llms.txt — not YAML, so the sync ignores it)

src/data/        # AUTO-GENERATED JSON — never edit directly
                 # (abl-thumbnails-manifest.json and sheets/abl-resources.json are written by the Pramaan sync,
                 #  pramaan-library-photos.json and sheets/pramaan-library.json by the library sync — also never hand-edit)

scripts/
  yaml-to-json.js          # YAML → JSON (runs via predev/prebuild)
  siteDataPlugin.js        # Vite plugin: site.yaml → JSON-LD, <title>, og:site_name in index.html + /llms.txt
  contentConsistency.js    # email / lives-impacted checks used by validate-content.js
  validate-content.js      # Validates YAML syntax + image paths + site.yaml consistency (also run in CI)
  bootstrap-yaml.js        # Writes starter navigation.yaml/footer.yaml (mirroring the current ones) only if absent
  sync-abl-thumbnails.js   # Pramaan sync job (GitHub Actions): data snapshot + photos
  lib/abl-snapshot.js      # pure rules for the sync: field allowlist, safety thresholds, photo plan
  sync-pramaan-library.js  # Pramaan Library sync (GitHub Actions) + lib/library-snapshot.js (its rules)
  ci/alert-issue.sh        # opens/updates/closes the owner-alert GitHub Issues (all three workflows)
  a11y-audit.cjs           # axe-core scan of every route (manual)

e2e/             # Playwright specs (3 files, run against `npm run dev`)
apps-script/abl/ # Code.gs — the Pramaan Apps Script (source of truth; pasted into Google by the owner)
apps-script/pramaan-library/ # Code.gs — the Pramaan Library Apps Script (same idea, second Sheet)
docs/            # ABL spec/setup/migration guides, architecture diagrams, specs/
```

## Pages
`src/App.jsx` registers 22 `<Route>`s (21 lazy-loaded page components): 19 primary routes and 3 system routes (`/coming-soon`, `/404`, `*`).

> **Note:** the site underwent a route restructure (see `docs/specs/site-restructure-plan.md`) — current paths use `/pramaan/*` and `/education-for-harmony/*`. The 16 older routes (`/projects/*`, `/about/our-results`, `/get-involved/work-with-us`, `/get-involved/mccx`, `/resources/*`) were **removed outright** by owner decision, with no redirects: those URLs now fall through to the `*` route and render the NotFound page (`src/test/routing/removedRoutes.test.jsx` asserts this).

| Route | Component | Data Source |
|-------|-----------|-------------|
| `/` | Home | `home.json` |
| `/about/why-tide` | WhyTide | `about-why-tide.json` |
| `/about/past-programs` | PastPrograms | `about-past-programs.json` |
| `/about/our-team` | OurTeam | `about-our-team.json` |
| `/about/our-partners` | OurPartners | `about-our-partners.json` |
| `/about/publications` | PublicationsCombined | `about-publications.json` |
| `/education-for-harmony` | EducationForHarmony | `education-for-harmony.json` |
| `/education-for-harmony/mccx` | OrganizeMCCx | `get-involved-mccx.json` |
| `/education-for-harmony/social-changemakers` | SocialChangemakers | `social-changemakers.json` (placeholder grid until the Sheet sync is added) |
| `/pramaan` | AblHome | `abl-home.json` + Apps Script API |
| `/pramaan/resource-centre` | AblResourceCenter | `abl-resource-center.json` + API |
| `/pramaan/resource-centre/:id` | AblDetail | `abl-detail.json` + API |
| `/pramaan/contribute` | AblContribute | `abl-contribute.json` + env config |
| `/pramaan-library` + `/:id` | PramaanLibrary, PramaanLibraryDetail | `pramaan-library.json` + snapshot `sheets/pramaan-library.json` (**unlinked**, noindex — see below) |
| `/get-involved/volunteer` | Volunteer | `get-involved-volunteer.json` |
| `/get-involved/donate` | Donate | `get-involved-donate.json` |
| `/thrive` | THRIvE | `thrive.json` |
| `/contact` | Contact | `contact.json` |
| `/coming-soon` | ComingSoon | `coming-soon.json` (props can override) — reusable template, not page-specific |
| `/404` and `*` (no route matched) | NotFound | `not-found.json` |

`/education-for-harmony/social-changemakers` ("Past SCF") is deliberately **not** in the header or footer menus: it is reached only from the Social Changemakers row on `/education-for-harmony`, and is left out of `sitemap.xml` while it is a placeholder.

Footer: no link columns (removed by owner decision, 2026-11-14) — one compact row — logo, name + tagline byline on the left; email, phone, social icons and a Donate button (`donateLabel` → `donateHref`) on the right — above a thin copyright strip. Deliberately quiet: Donate is the only coloured element. The copyright line's `{year}` token is filled with the current year in the browser.

## CMS Pipeline
All page content is managed through YAML files. **Never edit `src/data/` directly** — it is auto-generated.

### Pipeline
```
content/pages/*.yaml + content/shared/*.yaml  →  scripts/yaml-to-json.js  →  src/data/*.json  →  React imports JSON
content/shared/site.yaml + llms.txt           →  scripts/siteDataPlugin.js (Vite)  →  index.html JSON-LD/<title>, /llms.txt
```
`src/data` is flat (one JSON per YAML basename — don't reuse a basename across `pages/` and `shared/`), is git-tracked, and stale JSON is never deleted when a YAML is removed.

### Commands
```bash
npm run content:sync       # YAML → JSON (also runs automatically via predev/prebuild)
npm run content:validate   # YAML syntax + image path existence (leading-slash paths only) + email / lives-impacted consistency with site.yaml (errors)
npm run content:bootstrap  # Write starter navigation.yaml/footer.yaml if missing (rarely needed)
npm run dev                # auto-syncs then starts Vite dev server (localhost:5173)
npm run build              # auto-syncs then builds to dist/
npm run lint               # ESLint — includes the no-hardcoded-text guard below
npm test                   # Vitest (23 files / 294 tests)
npm run test:e2e           # Playwright (starts/reuses `npm run dev`)
```

### Import pattern and the no-hardcoded-text convention
```jsx
import data from '../data/page-name.json'          // sub-directory page: '../../data/...'
import common from '../data/common.json'           // shared micro-copy
<h1>{data.hero.title}</h1>
<p>{common.step}</p>
```
Every visible string must come from YAML (`data.*`, `common.*`, `ui.*`) — never typed into JSX. Reusable micro-copy lives in `content/shared/common.yaml` (`step`, `viewLinkedIn`) and `content/shared/ui.yaml` (Lightbox aria-labels only); the crash-screen text is `error.yaml`. The Pramaan screens are fully YAML-backed too: `abl-resource-center.yaml` (filters, grid, pagination, card text, SEO) and `abl-detail.yaml` (SEO/title templates with `{token}` placeholders such as `{name}`, `{type}`, `{n}`, filled in code).

**Site-wide facts** live in `content/shared/site.yaml` → `site.json`: name, alternateName, url, logo, `placeholderImage`, email, `livesImpacted`, `gradeRange`, foundingYear, location, country, language, descriptions, keywords and `breadcrumbs.*` (parent steps: home, aboutUs, getInvolved, pramaan, educationForHarmony, resourceCentre). A page's last breadcrumb name is `meta.breadcrumbName` in its own YAML; `SeoHead` takes its site URL and default og:image from `site.json`. `scripts/siteDataPlugin.js` generates the two JSON-LD blocks, `<title>` and `og:site_name` into `index.html` at the `<!-- site-jsonld -->` marker, and renders `content/shared/llms.txt` (tokens `{{name}} {{url}} {{email}} {{livesImpacted}} {{foundingYear}}`) to `/llms.txt` at build and in dev. **Don't write a literal `<title>` inside an HTML comment in `index.html`** — the plugin's regex would match it.

**Lint guard:** `eslint.config.js` sets `react/jsx-no-literals` to **error** for `src/pages/**/*.jsx` and `src/components/**/*.jsx`, so text typed directly into JSX fails `npm run lint` (punctuation/glyphs like `—`, `·`, `→` are allowed). It only sees JSX text children — string props such as `aria-label="..."` and `alt="..."` are *not* caught, so still follow the convention. CI runs lint too, so a violation stops the deploy.

### Non-serializable values
Icons and Tailwind color variants cannot be stored in JSON. Keep them in component files as lookup maps:
```jsx
// YAML: iconKey: "BookOpen"   →   JSX: ICONS[item.iconKey]
// YAML: colorKey: "blue"      →   JSX: COLOR_MAP[item.colorKey]
```

See `CONTENT-GUIDE.md` for the non-technical user guide.  
See `.claude/skills/content-management.md` for the full agent skill reference.  
See `.claude/skills/cms-integrity/SKILL.md` — auto-triggers when adding/editing any page or
component that renders user-facing text/media, to catch hardcoded JSX that bypasses the CMS
before it ships, not after a full-site audit finds it later.  
See `.claude/skills/doc-sync/SKILL.md` — auto-triggers after structural changes, to keep these docs truthful.
See `.claude/skills/sheet-integration/SKILL.md` — invoke when bootstrapping a *new*
Google-Sheet-backed section (generalizes the ABL/Pramaan pattern, includes a security checklist).

## ABL Resource Library (Pramaan)
The ABL (Activity-Based Learning) *resource data* has a separate data pipeline — no YAML files for the resources themselves. The screen text around them is YAML (`abl-home`, `abl-resource-center`, `abl-detail`, `abl-contribute`).

### Data flow
```
Google Sheet (private) → Google Apps Script Web App → useABLData() → React
                                                              ↓
                                       sessionStorage cache (key abl_api_cache_v2, 15-min TTL)
```
`useABLData()` validates the payload shape, aborts a stale/in-flight request on refetch or unmount, times out after 10 s, and logs failures by kind only (never the URL). It is called independently by three pages: `AblHome`, `AblResourceCenter`, `AblDetail` (`AblContribute` doesn't use it).

Resource **photos and (from Phase 3) the data itself** come from a one-way sync:
`scripts/sync-abl-thumbnails.js` (run by `.github/workflows/sync-abl-thumbnails.yml` — every 6 h at :17,
when the Apps Script reports a Sheet change, and manually) validates the data, writes the snapshot
`src/data/sheets/abl-resources.json`, downloads changed photos as WebP into `public/assets/images/abl/`
(+ `src/data/abl-thumbnails-manifest.json`), commits both in one commit and starts the deploy. It refuses
to publish unsafe changes (mass removal, vanished tab, renamed header — rules in
`scripts/lib/abl-snapshot.js`), never deletes a photo because Drive failed, and reports problems as GitHub
Issues assigned to the repo variable `ALERT_ASSIGNEE`. **Work in progress:** the site still reads data live
through `useABLData()` until Phase 3 of `docs/PRAMAAN-HARDENING-PLAN.md` switches it to the snapshot.

### Configuration
```bash
# .env.development (gitignored — create locally; template: .env.example)
VITE_ABL_API_URL=https://script.google.com/macros/s/.../exec
VITE_ABL_CONTRIBUTE_FORM_URL=https://forms.gle/...
```
Add both as GitHub Actions repository secrets for production builds (checked 2026-11-15:
`VITE_ABL_CONTRIBUTE_FORM_URL` is **not set** — see `docs/OPERATIONS-INVENTORY.md`).
The sync workflow additionally needs an `ABL_SYNC_TOKEN` repo secret and the repo variable `ALERT_ASSIGNEE`.

### Key files
- `src/config/abl.js` — all ABL constants and tab config (`TAB_STYLE_MAP`, `getTabStyle(tab)`, and the single resource-type colour palette `TYPE_COLORS` / `getTypeColors(tab)` — one colour per type on every Pramaan screen)
- `src/hooks/useABLData.js` — fetch + cache hook
- `src/utils/driveUtils.js` — `extractDriveFileId` + `getDrivePreviewUrl` (outbound preview links only; not thumbnails)
- `src/utils/ablThumbnails.js` — resolves a resource id to its synced thumbnail path
- `src/utils/filterResources.js` — pure filter function, also sorts results by name ascending
- `src/utils/resourceLanguages.js` — `parseLanguages(cell)`: splits the Language cell and drops "No Language" (no badge for it)
- `src/components/abl/` — 12 UI components plus the `typeIcons.jsx` icon helper (incl. `ActiveFilters.jsx` — removable filter chips, `ResourceTypeBadge.jsx` — the one place a type is named, `VideoLightbox.jsx` — full-screen video overlay, `PromoVideo.jsx` — the hero promo video, `PhotoStrip.jsx` — the drifting photo strip (drag, swipe, wheel, arrows))
- `scripts/sync-abl-thumbnails.js` + `scripts/lib/abl-snapshot.js` — the sync job and its pure, tested rules
- `apps-script/abl/Code.gs` — the Apps Script (v3), tested by `src/test/scripts/appsScript.test.js` in a simulated Google environment
- `docs/PRAMAAN-HARDENING-PLAN.md` — the current work plan, design decisions and checklist
- `docs/OPERATIONS-INVENTORY.md` / `docs/OPERATIONS-RUNBOOK.md` / `docs/PLATFORM-LIMITS.md` — everything the site depends on, what to do when something breaks, free-tier limits
- `docs/ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` — owner's click-by-click Apps Script upgrade (Phase 2)
- `docs/ABL-RESOURCE-LIBRARY-SPEC.md` — full spec (the Apps Script code itself now lives only in `apps-script/abl/Code.gs`)
- `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` — thumbnail sync setup procedure (fresh setup only)
- `docs/MIGRATION-OVERVIEW.md` — start here when handing the whole project (Google + GitHub) to a new owner
- `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` — moving the Sheet + Apps Script to a new Google account
- `docs/MIGRATION-GITHUB-REPOSITORY.md` — transferring the GitHub repository to a new owner
- `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` — short recurring task when the GitHub token expires
- `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md` — step-by-step to change the Contribute form link (the `VITE_ABL_CONTRIBUTE_FORM_URL` GitHub secret + a re-run of the deploy)
- `docs/ARCHITECTURE.html` — interactive end-to-end system diagram, organized by **who does each step** (non-technical-friendly). Open directly in a browser — standalone, not part of the build.
- `docs/ARCHITECTURE-DATAFLOW.html` — companion diagram for technical readers, organized by **system layer and direction of data flow** instead — request/response contracts, caching TTLs, trust boundaries (Google infra / GitHub infra / build-time / runtime), and a secrets/credentials reference table. Keep both diagrams in sync when the architecture changes.

## Pramaan Library (second Sheet, unlinked page)
A separate form-format Sheet ("Contributing to Pramaan; Educators' Resource Bank (Responses)") feeds `/pramaan-library` — deliberately not in any menu, footer, sitemap or llms.txt, and `noindex`. Snapshot mode only (no live API): `apps-script/pramaan-library/Code.gs` (no public listing; publishes a row only when the three consent columns Q–S are "Yes"; never outputs the personal columns L–P) → `.github/workflows/sync-pramaan-library.yml` → `scripts/sync-pramaan-library.js` (+ `scripts/lib/library-snapshot.js`) → `src/data/sheets/pramaan-library.json`, `src/data/pramaan-library-photos.json`, `public/assets/images/pramaan-library/` (bot-owned, never hand-edit). Secrets `PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN`. UI: `src/pages/library/`, `src/components/library/`, `src/config/library.js`, `src/utils/libraryFilters.js`, `videoLinks.js`, `libraryPhotos.js`; text in `content/pages/pramaan-library.yaml`. Owner setup: `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`; column rules: `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`; status/checklist: `docs/PRAMAAN-HARDENING-PLAN.md` §12.

## Known Gotchas and Open Decisions
- **`imgSrc()` is not idempotent** when `BASE_URL` is `/tide-testing/`: applying it twice yields a wrong URL on GitHub Pages (invisible in dev). `Lightbox` already applies it to every image `src` itself, so don't pre-apply it. Verify with a `GITHUB_ACTIONS=true` build/preview at `/tide-testing/`.
- **Resolved content facts (owner decision):** the contact email is `tidefoundation@gmail.com` and the lives-impacted total is `52,500+` everywhere. The single source is `content/shared/site.yaml` (`email`, `livesImpacted`); `npm run content:validate` errors if any email or lives-impacted total in `content/` differs. Other metrics (e.g. "15,000+ students") are deliberately not flagged.
- **Failed images get a placeholder:** `installImagePlaceholder()` (`src/utils/imagePlaceholder.js`, called once in `src/main.jsx`) adds one capturing `error` listener on `document`; any `<img>` that fails to load is swapped for `site.placeholderImage` (`public/assets/images/shared/placeholder.svg`, set in `content/shared/site.yaml`). Opt out with the `data-no-placeholder` attribute — `abl/DriveImage.jsx` does, because it draws its own icon fallback. Tested in `src/test/utils/imagePlaceholder.test.js`. `content:validate` does not check bare filenames such as the `logoGallery.images` list in `about-our-partners.yaml` (its one nonexistent entry was removed), so verify those by eye.
- **Removed (owner decisions):** the 16 former "stranded" routes with their pages, YAMLs and generated JSON (no redirects — see the Pages note). Deleted 2026-10-25 with the owner's approval: the 97 images only the removed pages used (`projects-*`, `resources-*` folders), `Badge.jsx`, `WhatsAppIcon`, `src/App.css`, `src/assets/*`, 91 unreferenced images, `getDriveDownloadUrl` (and its tests), `public/icons.svg`, `public/favicon.svg`. Recover any of them with `git checkout a4126d1 -- <path>`. Decided: the Devanagari fonts stay loaded.
- **Open (not decided):** (1) `intro.ctaHref` in `content/pages/get-involved-volunteer.yaml` is still the placeholder `https://docs.google.com/forms` (owner: keep as is for now); (2) `content/shared/site.yaml` `gradeRange` and the `GRADES` list in `src/config/abl.js` are two places that must agree (a unit test checks it); (3) `content/pages/about-publications.yaml` has an empty `research.items` list and 10 entries with `link: ""` (needs real content from the owner).
- More in AGENTS.md §11.

## Resuming Work
1. Read this file for orientation. **Work in progress (opened 2026-11-15):** Pramaan hardening + snapshot mode — read `docs/PRAMAAN-HARDENING-PLAN.md` (self-contained plan, design decisions and done/to-do checklist) and `docs/PLATFORM-LIMITS.md` before touching the Sheet/Apps Script/sync/deploy pipeline
2. Read `AGENTS.md` for detailed component/pattern reference (and its §11 Gotchas)
3. Project status/history is kept in Claude Code's auto-memory for this repo (outside the repo, not checked in) plus git history; `docs/specs/site-restructure-plan.md` covers the route restructure
4. Run `npm run dev` to start the dev server
5. Run `npm run lint`, `npm test` and `npm run build` before pushing (CI re-runs lint, `content:validate` and the unit tests, but not e2e)
