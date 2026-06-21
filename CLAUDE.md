# TIDE Foundation Website — Claude Context

## Project Overview
React static site rebuild of [tideinternational.org](https://tideinternational.org/) for TIDE Foundation (Together in Development and Education), an NGO based in Ahmedabad, India focused on educational reform.

## Tech Stack
- **Vite 8 + React 19** — static site, `npm run build` → `dist/`
- **React Router v7** (`BrowserRouter` — clean URLs; GitHub Pages deep-link/reload support comes from `public/404.html` + a redirect-restoration script in `index.html`, not from hash routing)
- **Tailwind CSS v3** — utility-first styling
- **Framer Motion 12** — animations and page transitions
- **i18next + react-i18next** — trilingual: English (default), Hindi, Gujarati
- **Lucide React** — icons
- **react-helmet-async** — SEO meta tags

## Deployment
- `npm run build` → `dist/` → GitHub Pages at `/tide-testing/`
- CI: `.github/workflows/deploy.yml` (build → upload `dist/` → deploy pages)
- Base path toggled via `GITHUB_ACTIONS` env in `vite.config.js`
- Secrets required in GitHub: `VITE_ABL_API_URL`, `VITE_ABL_CONTRIBUTE_FORM_URL`

## Design System
- **Primary:** `#1E6BAA` (TIDE teal-blue)
- **Accent:** `#F59E0B` (amber). **Use as text/icon color only on dark backdrops** (5.9-7.6:1) — on a light background use `text-accent-deeper` instead (`#F59E0B` itself is only 2.1-2.2:1 there, failing WCAG AA). See AGENTS.md §3's accessibility note before using either color as foreground text.
- **Background:** `#FDFCF9` (warm white)
- **Text:** `#0D1F3C` (near-black navy)
- **Headings:** Playfair Display (EN) / Noto Serif Devanagari (HI) / Noto Serif Gujarati (GU)
- **Body:** Plus Jakarta Sans (EN) / Noto Sans Devanagari (HI) / Noto Sans Gujarati (GU)
- Full token map in `tailwind.config.js`
- **Accessibility:** audited end-to-end against WCAG 2.2 AA (2026-06-22) — `npm run lint` doesn't check this; run `node scripts/a11y-audit.cjs` against a running dev server to re-scan. Keyboard navigation, focus management (`src/hooks/useFocusTrap.js`), and color contrast were all verified by hand in addition to automated scanning — see git history around that date for the specific findings and reasoning if touching interactive components or color tokens.

## Repository Structure
```
src/
  components/
    layout/    # Header, Footer, Layout
    ui/        # Button, Card, Badge, SectionHeader, PageHero, AnimatedCounter,
               # Lightbox, LanguageSwitcher, SocialIcons, TodoPlaceholder
    abl/       # ResourceCard, ResourceGrid, ResourceFilters, Pagination,
               # AblNavBar, DriveImage, ResourceTypeBadge, ImageLightbox
  pages/
    Home.jsx / Contact.jsx / THRIvE.jsx
    about/         # WhyTide, OurTeam, OurPartners, OurResults
    projects/      # BlockETI, BetterED, EmpowerEd, CompletEd, SdgDrives, OtherProjects
    get-involved/  # Volunteer, Donate, WorkWithUs, OrganizeMCCx
    resources/     # SaralKadam, AnnualReports, Publications
                   # AblHome, AblResourceCenter, AblDetail, AblContribute
  hooks/
    useScrollAnimation.js   # IntersectionObserver scroll-in animations
    useLightbox.js          # Lightbox open/close/prev/next state
    useABLData.js           # Fetch + 15-min sessionStorage cache for ABL API
  config/
    abl.js                  # ABL API URL, cache TTL, tab style map
  utils/
    driveUtils.js           # Google Drive URL → thumbnail/preview/download transforms
    filterResources.js      # Pure filter function for ABL resource center
  i18n/
    index.js + locales/en|hi|gu/translation.json
  App.jsx        # BrowserRouter + all 24 routes + ErrorBoundary
  main.jsx       # Entry point, i18n init
  index.css      # Global styles + Tailwind base

content/
  pages/         # One YAML per CMS page (20 files) — edit these to change content
  shared/        # navigation.yaml, footer.yaml

src/data/        # AUTO-GENERATED JSON — never edit directly

scripts/
  yaml-to-json.js      # YAML → JSON sync engine (runs via predev/prebuild)
  validate-content.js  # Validates YAML syntax + image paths
  bootstrap-yaml.js    # Generates YAML skeletons from translation.json

docs/
  ABL-RESOURCE-LIBRARY-SPEC.md   # Full ABL feature spec + Apps Script code
  ABL-APPSCRIPT-SETUP-GUIDE.md   # GAS backend setup guide
```

## Pages (24 total)

> **Note:** the site underwent a route restructure (see `docs/specs/site-restructure-plan.md`) — current primary nav paths use `/pramaan/*` and `/education-for-harmony/*`, not the older `/resources/abl-resources/*` style. The old paths still resolve (kept live, just not linked in nav) pending a final stakeholder decision on redirect/removal — see the "Stranded routes" comment block in `src/App.jsx`.

| Route | Component | Data Source | Status |
|-------|-----------|-------------|--------|
| `/` | Home | `home.json` | ✓ |
| `/about/why-tide` | WhyTide | `about-why-tide.json` | ✓ |
| `/about/past-programs` | PastPrograms | `about-past-programs.json` | ✓ |
| `/about/our-team` | OurTeam | `about-our-team.json` | ✓ |
| `/about/our-partners` | OurPartners | `about-our-partners.json` | ✓ |
| `/about/publications` | PublicationsCombined | `about-publications.json` | ✓ |
| `/education-for-harmony` | EducationForHarmony | `education-for-harmony.json` | ✓ |
| `/education-for-harmony/mccx` | OrganizeMCCx | `get-involved-mccx.json` | TODO content |
| `/pramaan` | AblHome | Apps Script API | ✓ |
| `/pramaan/resource-centre` | AblResourceCenter | Apps Script API | ✓ |
| `/pramaan/resource-centre/:id` | AblDetail | Apps Script API | ✓ |
| `/pramaan/contribute` | AblContribute | Static + env config | ✓ |
| `/get-involved/volunteer` | Volunteer | `get-involved-volunteer.json` | ✓ |
| `/get-involved/donate` | Donate | `get-involved-donate.json` | TODO content |
| `/thrive` | THRIvE | `thrive.json` | ✓ |
| `/contact` | Contact | `contact.json` | ✓ |
| `*` (no route matched) | NotFound | `not-found.json` | ✓ |

**Stranded routes** (still resolve via direct URL, not in nav, pending stakeholder decision — see `src/App.jsx`): `/about/our-results`, `/projects/block-eti`, `/projects/bettered`, `/projects/empowered`, `/projects/completed`, `/projects/other-projects`, `/projects/sdg-drives`, `/get-involved/work-with-us`, `/get-involved/mccx`, `/resources/saral-kadam`, `/resources/annual-reports`, `/resources/publications`, `/resources/abl-resources(/resource-center(/:id)|/contribute)`.

## TODO Placeholders
Pages marked "TODO content" use `<TodoPlaceholder>` — amber banner at the bottom. Sections also marked `{/* TODO: replace with real content */}`.

## CMS Pipeline
All page content is managed through YAML files. **Never edit `src/data/` directly** — it is auto-generated.

### Pipeline
```
content/*.yaml  →  scripts/yaml-to-json.js  →  src/data/*.json  →  React imports JSON
```

### Commands
```bash
npm run content:sync       # YAML → JSON (also runs automatically via predev/prebuild)
npm run content:validate   # Check YAML syntax + image path existence
npm run content:bootstrap  # Generate shared YAML from translation.json (safe to re-run)
npm run dev                # auto-syncs then starts Vite dev server
npm run build              # auto-syncs then builds to dist/
```

### Import pattern
```jsx
// Top-level page (src/pages/PageName.jsx)
import data from '../data/page-name.json'
// Sub-directory page (src/pages/about/WhyTide.jsx)
import data from '../../data/about-why-tide.json'
```

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
See `.claude/skills/sheet-integration/SKILL.md` — invoke when bootstrapping a *new*
Google-Sheet-backed section (generalizes the ABL/Pramaan pattern, includes a security checklist).

## ABL Resource Library
The ABL (Activity-Based Learning) feature has a separate data pipeline — no YAML files.

### Data flow
```
Google Sheet (private) → Google Apps Script Web App → useABLData() → React
                                                              ↓
                                              sessionStorage cache (15-min TTL)
```

Resource **thumbnails** are a separate, one-way sync — not part of the
request above. `scripts/sync-abl-thumbnails.js` (run via
`.github/workflows/sync-abl-thumbnails.yml`, triggered automatically on
Sheet edits) downloads photos from Drive ahead of time and commits optimized
WebP files into `public/assets/images/abl/`. The React app only ever reads
`src/data/abl-thumbnails-manifest.json` — it never talks to Google for
images at runtime. See `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`.

### Configuration
```bash
# .env.development (gitignored — create locally)
VITE_ABL_API_URL=https://script.google.com/macros/s/.../exec
VITE_ABL_CONTRIBUTE_FORM_URL=https://forms.gle/...
```
Add both as GitHub Actions repository secrets for production builds.
The thumbnail sync workflow additionally needs an `ABL_SYNC_TOKEN` repo
secret — see the thumbnail sync setup guide above.

### Key files
- `src/config/abl.js` — all ABL constants and tab config
- `src/hooks/useABLData.js` — fetch + cache hook
- `src/utils/driveUtils.js` — Drive preview/download link transforms (not thumbnails)
- `src/utils/ablThumbnails.js` — resolves a resource id to its synced thumbnail path
- `src/utils/filterResources.js` — pure filter function, also sorts results by name ascending
- `src/components/abl/` — 9 UI components (incl. `VideoLightbox.jsx` — full-screen video overlay)
- `scripts/sync-abl-thumbnails.js` — thumbnail sync job (see setup guide)
- `docs/ABL-RESOURCE-LIBRARY-SPEC.md` — full spec + Apps Script code
- `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` — thumbnail sync setup procedure (fresh setup only)
- `docs/MIGRATION-OVERVIEW.md` — start here when handing the whole project (Google + GitHub) to a new owner
- `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` — moving the Sheet + Apps Script to a new Google account
- `docs/MIGRATION-GITHUB-REPOSITORY.md` — transferring the GitHub repository to a new owner
- `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` — short recurring task when the GitHub token expires
- `docs/ARCHITECTURE.html` — interactive end-to-end system diagram, organized by **who does each step** (non-technical-friendly). Open directly in a browser — standalone, not part of the build.
- `docs/ARCHITECTURE-DATAFLOW.html` — companion diagram for technical readers, organized by **system layer and direction of data flow** instead — request/response contracts, caching TTLs, trust boundaries (Google infra / GitHub infra / build-time / runtime), and a secrets/credentials reference table. Keep both diagrams in sync when the architecture changes.

## Resuming Work
1. Read this file for orientation
2. Read `AGENTS.md` for detailed component/pattern reference
3. Check `memory/project_tide_context.md` for project status
4. Check `memory/content_crawl.md` for page content reference
5. Run `npm run dev` to start the dev server
6. Run `npm run build` to verify the build
