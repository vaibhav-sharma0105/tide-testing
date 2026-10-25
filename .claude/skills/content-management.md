---
name: content-management
description: TIDE Foundation website content management — YAML CMS workflow, data pipeline, site-wide facts (site.yaml), and page architecture
---

# TIDE Foundation — Content Management Skill

## Project Overview

This is a **Vite 8 + React 19** static site for the TIDE Foundation NGO. All visible content is managed through a YAML-based CMS. The site is **English only**: the multilingual (Hindi/Gujarati, i18next) framework was removed entirely and is preserved only in the local git tag `archive/multilingual-framework` (commit `a4126d1`). There is no `src/i18n/`, no `content/locales/`, no language switcher, no `t()` helper and no `useTranslation`.

## CRITICAL ARCHITECTURAL RULE — YAML Is the Source of Truth

**Visible text and image paths come from YAML data, never from a literal typed into JSX.** A page imports its generated JSON and reads it directly:

```jsx
import data from '../data/page-name.json'
<h1>{data.hero.title}</h1>
```

Reusable micro-copy follows the same rule, read from the shared JSON:
```jsx
import common from '../../data/common.json'
<p>{common.clickToZoom}</p>
```

`eslint.config.js` enforces `react/jsx-no-literals` as an **error** for `src/pages/**/*.jsx` and `src/components/**/*.jsx` (only punctuation/glyphs are allowed as bare text), so visible text typed into JSX fails `npm run lint`. CI runs lint too (a failure stops the deploy) — still run it locally. The rule does **not** see string props (`aria-label`, `alt`, `title`, `placeholder`), template literals, JSON-LD, or other string attributes; see the `cms-integrity` skill for the checklist that covers those.

## Content Pipelines

There are THREE distinct data flows:

### Pipeline A — Page and shared content (YAML → src/data/)
```
content/pages/*.yaml    ─┐
content/shared/*.yaml   ─┤  scripts/yaml-to-json.js  →  src/data/*.json  →  React component imports
```
Behaviour of `scripts/yaml-to-json.js` worth knowing:
- Walks `content/pages/` and `content/shared/` recursively, but output is **flat**: `src/data/<file-basename>.json`. Two YAML files with the same basename (in different folders) silently overwrite each other.
- It **never deletes** JSON for a YAML file you removed or renamed — the stale JSON stays importable. Delete it by hand.
- Any string value that starts with `/assets/` has the leading `/` stripped (deep, including arrays). Other values (routes like `/about/…`, `mailto:`) are untouched.
- There is no locale-merge step any more. It handles only `*.yaml` / `*.yml`, so `content/shared/llms.txt` is **not** synced to JSON.
- Run it from the repo root (`path.resolve('content')`). Invalid YAML throws and blocks `npm run dev` / `build`.
- `src/data/*.json` is committed to git but regenerated on every dev/build (`predev` / `prebuild`). Never hand-edit it.

### Pipeline B — Site-wide facts (site.yaml → HTML head, llms.txt, SEO)
```
content/shared/site.yaml       ─┐
content/shared/llms.txt (tmpl) ─┤  scripts/siteDataPlugin.js (Vite plugin)  →  index.html <title>, og:site_name, JSON-LD (NGO + WebSite)
                                └──────────────────────────────────────────→  /llms.txt (served in dev, emitted into dist/ on build)
content/shared/site.yaml       ──  scripts/yaml-to-json.js  →  src/data/site.json  →  SeoHead + page breadcrumbs
```
`content/shared/site.yaml` is the single source for site-wide facts: `name`, `alternateName`, `url`, `logo`, `email`, `livesImpacted`, `gradeRange`, `foundingYear`, `location`, `country`, `language`, `description` (may contain `{livesImpacted}`), `websiteDescription`, `keywords`, and `breadcrumbs.*` (names of the parent steps: `home`, `aboutUs`, `getInvolved`, `pramaan`, `educationForHarmony`, `resourceCentre`). The plugin reads the YAML directly, so it does not depend on `content:sync` having run.

`public/llms.txt` no longer exists. The editable template is `content/shared/llms.txt`; `siteDataPlugin.js` `renderLlms()` replaces `{{name}}`, `{{url}}`, `{{email}}`, `{{livesImpacted}}`, `{{gradeRange}}`, `{{foundingYear}}` and `{{location}}` (an unknown token throws). The page list inside the template is hand-maintained — review it, `public/sitemap.xml` and `public/robots.txt` when pages are added or removed.

Each page's **last breadcrumb name** is its own `meta.breadcrumbName` in the page YAML; the parent steps come from `site.json` `breadcrumbs.*`:
```jsx
breadcrumbs={[
  { name: site.breadcrumbs.home, path: '/' },
  { name: site.breadcrumbs.aboutUs },
  { name: data.meta.breadcrumbName, path: '/about/our-partners' },
]}
```
Fourteen of the 16 page YAMLs carry `meta.breadcrumbName` (every page except `home` and `abl-detail`); `Home.jsx` uses only `site.breadcrumbs.home`, and `AblDetail.jsx` builds its last step from the resource name.

**Consistency guard.** The contact email and the lives-impacted total must be identical everywhere. `npm run content:validate` (`scripts/validate-content.js` + `scripts/contentConsistency.js`) **errors** (exit 1) if any e-mail address in `content/` (YAML values and the `llms.txt` template) differs from `site.yaml` `email`, or if a 5-digit total such as `40,000+` that sits in a sentence with the words lives/people/impacted/changed differs from `livesImpacted`. Owner decisions: e-mail `tidefoundation@gmail.com`, lives impacted `50,500+`, everywhere. To change either, edit `site.yaml` **and** every page that states it — the validator prints which files and fields.

### Pipeline C — ABL / Pramaan (Google Sheets API)
```
Google Sheet  →  Apps Script Web App  →  useABLData() hook  →  ABL page components
```
The **resource data** (title, description, grades…) comes from Google Sheets, not YAML. The **Pramaan UI chrome** (labels, headings, filter text, SEO titles) is YAML-backed in `abl-home`, `abl-resource-center`, `abl-detail` and `abl-contribute`. Thumbnails are a separate one-way sync into `public/assets/images/abl/`. Google Fonts still loads the Devanagari and Gujarati families because Pramaan resource titles from the Sheet can contain Gujarati.

## File Naming Convention

### Page YAML → JSON
16 files in `content/pages/` (one per routed page; `src/App.jsx` registers 19 `<Route>`s: these 16 pages plus the 3 system routes `/coming-soon`, `/404` and `*`):

| Content file | Generated JSON (in `src/data/`) | Component |
|---|---|---|
| `home.yaml` | `home.json` | `src/pages/Home.jsx` |
| `about-why-tide.yaml` | `about-why-tide.json` | `about/WhyTide.jsx` |
| `about-past-programs.yaml` | `about-past-programs.json` | `about/PastPrograms.jsx` |
| `about-our-team.yaml` | `about-our-team.json` | `about/OurTeam.jsx` |
| `about-our-partners.yaml` | `about-our-partners.json` | `about/OurPartners.jsx` |
| `about-publications.yaml` | `about-publications.json` | `about/PublicationsCombined.jsx` |
| `education-for-harmony.yaml` | `education-for-harmony.json` | `src/pages/EducationForHarmony.jsx` |
| `get-involved-mccx.yaml` | `get-involved-mccx.json` | `get-involved/OrganizeMCCx.jsx` |
| `get-involved-volunteer.yaml` | `get-involved-volunteer.json` | `get-involved/Volunteer.jsx` |
| `get-involved-donate.yaml` | `get-involved-donate.json` | `get-involved/Donate.jsx` |
| `thrive.yaml` | `thrive.json` | `src/pages/THRIvE.jsx` |
| `contact.yaml` | `contact.json` | `src/pages/Contact.jsx` |
| `abl-home.yaml` | `abl-home.json` | `resources/AblHome.jsx` |
| `abl-resource-center.yaml` | `abl-resource-center.json` | `resources/AblResourceCenter.jsx` + `components/abl/*` |
| `abl-detail.yaml` | `abl-detail.json` | `resources/AblDetail.jsx` |
| `abl-contribute.yaml` | `abl-contribute.json` | `resources/AblContribute.jsx` |

The former "stranded" pages (Our Results, the six `projects-*` pages, Work With Us, Saral Kadam, the older Annual Reports / Publications pages and the duplicate `/get-involved/mccx` and `/resources/abl-resources/*` routes) were removed entirely, with no redirects: those URLs now show the NotFound page (`src/test/routing/removedRoutes.test.jsx`). Their YAML, generated JSON and page components are gone; `ui.yaml` no longer has a `todo:` block. Recover anything from git history (`git checkout a4126d1 -- <path>`).

`abl-resource-center.yaml` / `abl-detail.yaml` hold Pramaan chrome: titles, filter/pagination/card labels, SEO strings. Strings with `{token}` placeholders (`{n}`, `{name}`, `{type}`, `{grades}`, `{id}`, `{quantity}` …) are filled in by code (`.replace('{token}', …)`, or the `fill()` helper in `AblDetail.jsx`) — keep the token names when editing and do not rename them without changing the component.

### Shared YAML → JSON
9 YAML files in `content/shared/` (plus the `llms.txt` template, which is not synced):

| Content file | Generated JSON | Consumed by |
|---|---|---|
| `navigation.yaml` | `navigation.json` | `layout/Header.jsx`, `layout/Layout.jsx` (also skip-link, aria labels, Donate CTA labels) |
| `footer.yaml` | `footer.json` | `layout/Footer.jsx` (plus `contact.json` for email/phone). Three link columns: About, Get Involved, Resources; each link is `label` + `to` |
| `common.yaml` | `common.json` | Reused micro-copy: keys `clickToZoom`, `hoverForRole`, `hoverForBio`, `step` (OurTeam, THRIvE, Volunteer, OrganizeMCCx) |
| `ui.yaml` | `ui.json` | `ui/Lightbox.jsx` (`lightbox.*` aria-labels; `goTo` has an `{n}` token) |
| `loader.yaml` | `loader.json` | `ui/CreativeLoader.jsx` (rotating `messages`) |
| `not-found.yaml` | `not-found.json` | `NotFound.jsx` (`/404` and unmatched URLs) |
| `coming-soon.yaml` | `coming-soon.json` | `ComingSoon.jsx` (`/coming-soon`; props can override) |
| `error.yaml` | `error.json` | `components/ErrorBoundary.jsx` (keys `heading`, `body`, `reloadLabel`, `homeLabel`) |
| `site.yaml` | `site.json` | `ui/SeoHead.jsx`, the 16 page files that build breadcrumbs (`site.breadcrumbs.*`) and `src/utils/imagePlaceholder.js` (`placeholderImage`); also read directly by `scripts/siteDataPlugin.js` |
| `llms.txt` | — (not synced) | Template rendered by `siteDataPlugin.js` into `/llms.txt` |

`src/data/` also holds `abl-thumbnails-manifest.json`, which is **not** produced by this pipeline (it comes from `sync-abl-thumbnails`): 25 generated JSON files (16 + 9) plus that manifest = 26 files.

## React Component Import Pattern

Pages import their data file and use the shared `SeoHead` (not raw `<Helmet>`) with `PageHero` first:

```jsx
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import data from '../data/page-name.json'
import site from '../data/site.json'

export default function PageName() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/page-name"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: data.meta.breadcrumbName, path: '/page-name' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />
      ...
    </>
  )
}
```
(Adjust `../` depth for sub-directory pages. Which `meta` field holds the subtitle varies per page: `tagline` on some, `subtitle` on others — check the YAML.) `ComingSoon` and `NotFound` use `Helmet` directly instead of `SeoHead`. `PageHero` only accepts `badge`, `title`, `subtitle`, `children`; ten pages pass a `gradient` prop that it silently ignores (listed in `WHATS-NEXT.md`).

Header and Footer use shared data:
```jsx
import navData from '../../data/navigation.json'     // layout/Header.jsx, layout/Layout.jsx
import footerData from '../../data/footer.json'      // layout/Footer.jsx
```

## YAML Structure Conventions

```yaml
# Every primary page YAML starts with meta:
meta:
  breadcrumbName: "Page Name"     # last breadcrumb step (JSON-LD)
  badge: "Section · Sub"          # small chip above hero title
  title: "Page Title"
  tagline: "Short subtitle."      # some pages call this `subtitle`
  seoTitle: "Page Title — TIDE Foundation"    # browser tab + OG title
  seoDescription: "Search engine description (150 chars)."

# Sections use sectionBadge / sectionTitle / sectionSubtitle:
impact:
  sectionLabel: "Our Impact"
  stats:
    - value: "50500+"
      label: "Lives Impacted"

# Image lists: pages read `src` + `label` (label doubles as the alt text):
gallery:
  sectionTitle: "Moments from the field"
  images:
    - src: "/assets/images/get-involved-volunteer/gallery-01.jpg"
      label: "TIDE volunteer 1"

# iconKey maps to a lookup table in the component (never store React components in YAML):
programs:
  items:
    - iconKey: "BookOpen"   # ICON_MAP['BookOpen'] in component
      colorKey: "blue"      # COLOR_MAP['blue'] in component
      title: "Programme Title"
```
Field names differ per page (e.g. `gallery.images[].label` vs `alt` elsewhere) — copy the shape of the existing YAML and the component that reads it rather than assuming. If a YAML states the contact e-mail or the lives-impacted total, it must match `site.yaml` (see Pipeline B).

## Image Paths

Images live in `public/assets/images/<page-or-section>/`. The convention in YAML is a leading slash: `/assets/images/…`. `yaml-to-json.js` strips that leading `/` from any value starting `/assets/`, so both of these end up the same in JSON, and both work at runtime:

```yaml
photo: /assets/images/about-our-team/jane-smith.jpg   # convention; slash stripped by the script
photo: assets/images/about-our-team/jane-smith.jpg    # works, but `content:validate` will not check it
```

`scripts/validate-content.js` only checks values that start with `/` and sit under these key names: `photo, src, logo, coverImage, image, poster, img, heroPhoto, mainPhoto, diagramPhoto, backgroundImage, donorPoster`. Other keys (e.g. `photo1`), bare-filename lists and slash-less paths are not validated, and a missing image is only a warning. CI runs it before the build, so an error stops the deploy.

In components, resolve a data image with `imgSrc(path)` from `src/utils/imgSrc.js` (handles `BASE_URL` on GitHub Pages). `imgSrc` is not idempotent under `/tide-testing/`, and `Lightbox` already applies it to every `src` it receives, so never pre-apply it to lightbox images. A few spots build `${import.meta.env.BASE_URL}…` by hand (Header, Footer, `PageHero` banner texture, `SeoHead` default OG image, `OurPartners`, `Donate`, `Home`) — that works because the leading slash was stripped.

**Missing-image fallback.** `src/utils/imagePlaceholder.js` (installed once in `src/main.jsx`) listens for failed `<img>` loads site-wide and swaps the source for the `placeholderImage` in `content/shared/site.yaml` (`public/assets/images/shared/placeholder.svg`). So a missing or mistyped file shows a grey placeholder rather than a broken icon, which hides the mistake: still check the filename. An `<img>` opts out with the `data-no-placeholder` attribute (`DriveImage.jsx` does, because it draws its own icon). Bare-filename lists like `logoGallery.images` are not covered by `content:validate`.

## Non-Serializable Values (YAML Workaround)

React components and Tailwind variant classes cannot be stored in JSON:

```jsx
// YAML: iconKey: "BookOpen"
const ICON_MAP = { Globe, BookOpen, GraduationCap, Heart, Lightbulb, Users }
// Usage: const Icon = ICON_MAP[item.iconKey] ?? Globe

// YAML: colorKey: "blue"
const COLOR_MAP = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
// Usage: <div className={COLOR_MAP[item.colorKey]}>
```

## Running the Pipeline

```bash
# Sync page + shared YAML → src/data/
npm run content:sync

# Validate YAML syntax, check (some) image paths, enforce site.yaml email / lives-total consistency
npm run content:validate

# Visible-text guard (react/jsx-no-literals) + other lint rules — also run in CI
npm run lint

# Unit tests (15 files / 189 tests as of 2026-10-25) and Playwright e2e (3 specs)
npm test
npm run test:e2e

# Start dev server (auto-syncs first)
npm run dev

# Production build (auto-syncs first)
npm run build
```
`npm run content:bootstrap` only writes two hard-coded starter templates (`navigation.yaml`, `footer.yaml`) if they are missing; it does not touch pages. It never overwrites an existing file, but its embedded starter templates mirror the current `navigation.yaml` and `footer.yaml`.

## Adding a New Page

1. Create `content/pages/new-page.yaml` with all visible text (heading, SEO, labels, aria-labels, image paths and alts — nothing typed in JSX) and `meta.breadcrumbName`
2. Run `npm run content:sync` → creates `src/data/new-page.json`
3. Create `src/pages/NewPage.jsx` following the `SeoHead` + `PageHero` pattern above
4. Add a lazy-loaded route to `src/App.jsx`
5. Add a nav entry to `content/shared/navigation.yaml` (and a footer link in `footer.yaml` if wanted); review `public/sitemap.xml` and the page list in `content/shared/llms.txt`, which are maintained by hand
6. Add the page to `CONTENT-GUIDE.md`'s file table
7. Run `npm run content:sync` again, then `npm run content:validate`, `npm run lint`, `npm test` and `npm run build`

## Tech Stack Context

- **Vite 8 + React 19** — static site
- **React Router v7** — `BrowserRouter` (clean URLs; GitHub Pages SPA fallback via `public/404.html` + `index.html` redirect script, not hash routing)
- **Tailwind CSS v3** — utility classes
- **Framer Motion 12** — animations (shared fade-up presets in `src/utils/motionPresets.js`)
- **Lucide React** — icons
- **js-yaml** — YAML parsing in Node.js scripts (devDependency)
- **react-helmet-async** — SEO meta tags (HelmetProvider in App.jsx), via `src/components/ui/SeoHead.jsx`

## Design Tokens

Source of truth: `tailwind.config.js` and `src/index.css`.

```
Primary:    #1E6BAA  (TIDE teal-blue; also primary-dark #15538A, primary-light #D4EBF8)
Accent:     #F59E0B  (amber — CTAs; accent-deeper #B45309 for text on light backgrounds)
Navy:       #0D2137  (navy, navy-mid #162E4D, navy-light #1E3A5F)
Background: #FDFCF9  (tide-bg warm white; tide-subtle #F0EDE8, tide-surface #FFFFFF)
Text:       #0D1F3C  (tide-text near-black; tide-muted #5A6A7E, tide-mutedOnLight #4D5C6F)
Heading:    Playfair Display, with Noto Serif Devanagari / Noto Serif Gujarati as glyph fallbacks — font-display
Body:       Plus Jakarta Sans, with Noto Sans Devanagari / Noto Sans Gujarati as glyph fallbacks — font-body
```
The global keyboard focus ring (`:focus-visible` in `src/index.css`) is a 2px brand-blue outline with a 2px white `box-shadow` band, so it stays visible on the dark navy sections. `text-accent` (#F59E0B) is for dark backdrops only; on light backgrounds use `text-accent-deeper` (contrast). Layout helper in `index.css`: `section-padding` = `py-20 md:py-28 px-4 md:px-8 lg:px-16`. The PageHero banner uses a literal `#1c314d`, not the `navy` token.
