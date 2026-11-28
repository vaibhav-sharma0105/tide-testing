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
<p>{common.step}</p>
```

`eslint.config.js` enforces `react/jsx-no-literals` as an **error** for `src/pages/**/*.jsx` and `src/components/**/*.jsx` (only punctuation/glyphs are allowed as bare text), so visible text typed into JSX fails `npm run lint`. CI runs lint too (a failure stops the deploy) — still run it locally. A second rule in the same block (`no-restricted-syntax`, `CMS_TEXT_SELECTORS`, audit P1 2026-11-24) also fails on words in text props (`alt`, `aria-label`, `title`, `placeholder`, `label`, `badge`, …) and in `{'…'}` / template-literal text in JSX (tests: `src/test/scripts/cmsGuard.test.js`). Neither sees text built in plain JS away from the JSX, JSON-LD objects or breadcrumb names; see the `cms-integrity` skill for the checklist that covers those.

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
                                ├──────────────────────────────────────────→  /llms.txt, /robots.txt, /sitemap.xml (served in dev, emitted into dist/ on build;
                                │                                              sitemap + llms {{pages}} from src/config/siteRoutes.js + the Resource Centre snapshot)
                                └── scripts/prerender.mjs (after vite build)  →  one HTML file per public page, 404.html, forwarding pages, /llms-full.txt
content/shared/site.yaml       ──  scripts/yaml-to-json.js  →  src/data/site.json  →  SeoHead + page breadcrumbs
```
`content/shared/site.yaml` is the single source for site-wide facts: `name`, `alternateName`, `url` (the canonical base: canonicals, sitemap, robots, llms), `indexable` (false → noindex on every page), `logo`, `placeholderImage`, `pageBannerTexture`, `email`, `livesImpacted`, `gradeRange`, `foundingYear`, `location`, `country`, `language`, `description` (may contain `{livesImpacted}` and `{foundingYear}`), `websiteDescription`, `keywords`, `crawlers` (`search`, `training`, `allowTraining` → robots.txt), and `breadcrumbs.*` (names of the parent steps: `home`, `aboutUs`, `getInvolved`, `pramaan`, `educationForHarmony`, `resourceCentre`, `thrive`). The plugin reads the YAML directly, so it does not depend on `content:sync` having run.

`public/llms.txt` no longer exists. The editable template is `content/shared/llms.txt`; `siteDataPlugin.js` `renderLlms()` replaces `{{name}}`, `{{url}}`, `{{email}}`, `{{livesImpacted}}`, `{{gradeRange}}`, `{{foundingYear}}`, `{{location}}` and `{{pages}}` (an unknown token throws). `{{pages}}` is generated: one line per sitemap page (its `meta.breadcrumbName` + `meta.seoDescription`). There is no `public/sitemap.xml`, `public/robots.txt` or `public/404.html` any more — all generated at build; a new public page only needs its path in `src/config/siteRoutes.js` (`sitemap: false` keeps it out of the sitemap and llms list). The figures typed in the template ("100+ partner organisations", "12 years", …) are still plain text — an open owner question (audit ledger).

Each page's **last breadcrumb name** is its own `meta.breadcrumbName` in the page YAML; the parent steps come from `site.json` `breadcrumbs.*`:
```jsx
breadcrumbs={[
  { name: site.breadcrumbs.home, path: '/' },
  { name: site.breadcrumbs.aboutUs },
  { name: data.meta.breadcrumbName, path: '/about/our-partners' },
]}
```
Sixteen of the 17 page YAMLs carry `meta.breadcrumbName` (every page except `home`); `Home.jsx` uses only `site.breadcrumbs.home`, and the Resource Centre's detail page (`library/PramaanLibraryDetail.jsx`) builds its last step from the resource name.

**Consistency guard.** The contact email and the lives-impacted total must be identical everywhere. `npm run content:validate` (`scripts/validate-content.js` + `scripts/contentConsistency.js`) **errors** (exit 1) if any e-mail address in `content/` (YAML values and the `llms.txt` template) differs from `site.yaml` `email`, or if a 5-digit total such as `40,000+` that sits in a sentence with the words lives/people/impacted/changed differs from `livesImpacted`. Owner decisions: e-mail `tidefoundation@gmail.com`, lives impacted `52,500+`, everywhere. To change either, edit `site.yaml` **and** every page that states it — the validator prints which files and fields.

### Pipeline C — Google Sheets
```
Snapshot mode (the only Sheet pattern; Pramaan Resource Centre, /pramaan/resource-centre; Publications, /tide/publications + /thrive/publications;
Partners, /about/our-partners (static preview until the sync is connected); Social Changemakers, /education-for-harmony/social-changemakers):
Google Sheet → token-gated Apps Script → GitHub Actions sync → src/data/sheets/<slug>.json (+ photos) → page (build time)
```
New Sheet integrations follow `docs/SHEET-INTEGRATION-PLAYBOOK.md` (skill: `.claude/skills/sheet-integration/SKILL.md`). No page reads a Sheet in the browser (the former `useABLData` live read was retired on 2026-11-19; archived in git tag `archive/pramaan-live-read`).
The **resource data** (title, description, grades…) comes from the Sheet snapshot (`src/data/sheets/pramaan-library.json`), not YAML. The **Pramaan UI chrome** (labels, headings, filter text, SEO titles) is YAML-backed in `abl-home`, `pramaan-library` and `abl-contribute` (+ `ui.yaml` `mediaLightbox.*`). Photos are a separate one-way sync into `public/assets/images/pramaan-library/`. Likewise the **publications rows** come from `src/data/sheets/publications.json` (Sheet "TIDE THRIvE Publications (Responses)"), while their chrome is YAML in `tide-publications` and `thrive-publications`. Google Fonts still loads the Devanagari and Gujarati families because Pramaan resource titles from the Sheet can contain Gujarati.

## File Naming Convention

### Page YAML → JSON
17 files in `content/pages/` (one per page or screen; `src/routes.js` lists 24 routes: 18 primary routes — the Resource Centre list and detail share `pramaan-library.yaml` — plus 3 redirects (`/about/publications`, `/pramaan-library`, `/pramaan-library/:id`) and the 3 system routes `/coming-soon`, `/404` and `*`):

| Content file | Generated JSON (in `src/data/`) | Component |
|---|---|---|
| `home.yaml` | `home.json` | `src/pages/Home.jsx` |
| `about-why-tide.yaml` | `about-why-tide.json` | `about/WhyTide.jsx` |
| `about-past-programs.yaml` | `about-past-programs.json` | `about/PastPrograms.jsx` |
| `about-our-team.yaml` | `about-our-team.json` | `about/OurTeam.jsx` |
| `about-our-partners.yaml` | `about-our-partners.json` | `about/OurPartners.jsx` |
| `tide-publications.yaml` | `tide-publications.json` | `publications/TidePublications.jsx` + `components/publications/*` |
| `thrive-publications.yaml` | `thrive-publications.json` | `publications/ThrivePublications.jsx` + `components/publications/*` |
| `education-for-harmony.yaml` | `education-for-harmony.json` | `src/pages/EducationForHarmony.jsx` |
| `get-involved-mccx.yaml` | `get-involved-mccx.json` | `get-involved/OrganizeMCCx.jsx` |
| `get-involved-volunteer.yaml` | `get-involved-volunteer.json` | `get-involved/Volunteer.jsx` |
| `get-involved-donate.yaml` | `get-involved-donate.json` | `get-involved/Donate.jsx` |
| `thrive.yaml` | `thrive.json` | `src/pages/THRIvE.jsx` |
| `contact.yaml` | `contact.json` | `src/pages/Contact.jsx` |
| `abl-home.yaml` | `abl-home.json` | `resources/AblHome.jsx` |
| `pramaan-library.yaml` | `pramaan-library.json` | `library/PramaanLibrary.jsx`, `library/PramaanLibraryDetail.jsx` + `components/library/*`, `abl/Pagination.jsx` |
| `social-changemakers.yaml` | `social-changemakers.json` | `src/pages/SocialChangemakers.jsx` |
| `abl-contribute.yaml` | `abl-contribute.json` | `resources/AblContribute.jsx` |

The former "stranded" pages (Our Results, the six `projects-*` pages, Work With Us, Saral Kadam, the older Annual Reports / Publications pages and the duplicate `/get-involved/mccx` and `/resources/abl-resources/*` routes) were removed entirely, with no redirects: those URLs now show the NotFound page (`src/test/routing/removedRoutes.test.jsx`). Their YAML, generated JSON and page components are gone; `ui.yaml` no longer has a `todo:` block. Recover anything from git history (`git checkout a4126d1 -- <path>`).

`pramaan-library.yaml` holds the Resource Centre chrome: titles, filter/sort/pagination/card labels, detail-page labels, SEO strings. Strings with `{token}` placeholders (`{n}`, `{name}`, `{id}`, `{date}`, `{resources}` …) are filled in by code (`.replace('{token}', …)`, or the `fill()` helper in `PramaanLibraryDetail.jsx`) — keep the token names when editing and do not rename them without changing the component.

### Shared YAML → JSON
9 YAML files in `content/shared/` (plus the `llms.txt` template, which is not synced):

| Content file | Generated JSON | Consumed by |
|---|---|---|
| `navigation.yaml` | `navigation.json` | `layout/Header.jsx`, `layout/Layout.jsx` (also skip-link, aria labels, Donate CTA labels) |
| `footer.yaml` | `footer.json` | `layout/Footer.jsx` (plus `contact.json` for email/phone). No link columns. One compact row: logo, name + tagline byline left; email, phone, social icons and Donate button (`donateLabel`, `donateHref`) right. `rights` has a `{year}` token filled in at render |
| `common.yaml` | `common.json` | Reused micro-copy: keys `step`, `viewLinkedIn` (OrganizeMCCx; OurTeam and THRIvE via `ArchPortrait`) |
| `ui.yaml` | `ui.json` | `ui/Lightbox.jsx` (`lightbox.*` aria-labels; `goTo` has an `{n}` token); `abl/ImageLightbox.jsx`, `abl/VideoLightbox.jsx` (`mediaLightbox.*`) |
| `loader.yaml` | `loader.json` | `ui/CreativeLoader.jsx` (rotating `messages`) |
| `not-found.yaml` | `not-found.json` | `NotFound.jsx` (`/404` and unmatched URLs) |
| `coming-soon.yaml` | `coming-soon.json` | `ComingSoon.jsx` (`/coming-soon`; props can override) |
| `error.yaml` | `error.json` | `components/ErrorBoundary.jsx` (keys `heading`, `body`, `reloadLabel`, `homeLabel`) |
| `site.yaml` | `site.json` | `ui/SeoHead.jsx`, the 18 page files that build breadcrumbs (`site.breadcrumbs.*`) and `src/utils/imagePlaceholder.js` (`placeholderImage`); also read directly by `scripts/siteDataPlugin.js` |
| `llms.txt` | — (not synced) | Template rendered by `siteDataPlugin.js` into `/llms.txt` |

`src/data/` also holds `pramaan-library-photos.json`, `publications-photos.json`, `partners-photos.json`, `social-changemakers-photos.json` and `sheets/pramaan-library.json`, `sheets/publications.json`, `sheets/partners.json`, `sheets/social-changemakers.json`, which are **not** produced by this pipeline (they come from the four Sheet syncs `sync-pramaan-library`, `sync-publications`, `sync-partners` and `sync-social-changemakers`): 26 generated JSON files (17 + 9) plus those four manifests = 30 files at the top level, and the four snapshots under `sheets/`.

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
(Adjust `../` depth for sub-directory pages. Which `meta` field holds the subtitle varies per page: `tagline` on some, `subtitle` on others — check the YAML.) `ComingSoon` and `NotFound` use `Helmet` directly instead of `SeoHead`. `PageHero` accepts exactly `badge`, `badgeClassName`, `title`, `subtitle`, `children` and `aside`; there is no `gradient` prop — don't pass one.

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
highlights:
  sectionLabel: "Our Impact"
  stats:
    - value: "52,500+"
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

`scripts/validate-content.js` checks every string value that is a local file path (starts with `/assets/` or `assets/`, or ends in an image/media extension), whatever its key, in objects and lists; a missing file or a bare file name with no folder is a warning (since 2026-11-24). CI runs it before the build, so an error stops the deploy.

In components, resolve a data image with `imgSrc(path)` from `src/utils/imgSrc.js` (handles `BASE_URL` on GitHub Pages). `imgSrc` is not idempotent under `/tide-testing/`, and `Lightbox` already applies it to every `src` it receives, so never pre-apply it to lightbox images. A few spots build `${import.meta.env.BASE_URL}…` by hand (Header, Footer, `PageHero` banner texture, `SeoHead` default OG image, `Home`, `ErrorBoundary`) — that works because the leading slash was stripped.

**Missing-image fallback.** `src/utils/imagePlaceholder.js` (installed once in `src/main.jsx`) listens for failed `<img>` loads site-wide and swaps the source for the `placeholderImage` in `content/shared/site.yaml` (`public/assets/images/shared/placeholder.svg`). So a missing or mistyped file shows a grey placeholder rather than a broken icon, which hides the mistake: still check the filename. An `<img>` opts out with the `data-no-placeholder` attribute (`DriveImage.jsx` does, because it draws its own icon).

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

# Validate YAML syntax, every local file path in YAML (missing → warning), the four Sheet snapshots, formUrl,
# and site.yaml email / lives-total consistency (→ error)
npm run content:validate

# Visible-text guards (react/jsx-no-literals + no-restricted-syntax on text props) + other lint rules — also run in CI
npm run lint

# Unit tests (46 files / 532 tests as of 2026-11-28); Playwright against the dev server (local only)
npm test
npm run test:e2e
# Playwright against the built base-path site (CI runs this after the build): $env:GITHUB_ACTIONS='true'; npm run build first
npm run test:e2e:site

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
4. Add a lazy-loaded route to `src/routes.js` (`lazyPage` import + a `ROUTES` entry)
5. Add the path to `src/config/siteRoutes.js` `PRIMARY_ROUTES` with its `sources` (prerender, sitemap.xml and the llms page list; `siteRoutes.test.jsx` fails until you do), and a nav entry to `content/shared/navigation.yaml`. The page needs exactly one `<h1>` (the prerender fails the build otherwise; `Layout` moves focus to it)
6. Add the page to `CONTENT-GUIDE.md`'s file table
7. Run `npm run content:sync` again, then `npm run content:validate`, `npm run lint`, `npm test` and `npm run build`

## Tech Stack Context

- **Vite 8 + React 19** — static site
- **React Router v7** — `BrowserRouter` (clean URLs, not hash routing); every public page prerendered at build (`scripts/prerender.mjs`), the generated `404.html` is the NotFound page and the app renders the matching route over it
- **Tailwind CSS v3** — utility classes
- **Framer Motion 12** — animations (shared fade-up presets in `src/utils/motionPresets.js`)
- **Lucide React** — icons
- **js-yaml** — YAML parsing in Node.js scripts (devDependency)
- **react-helmet-async** — SEO meta tags (HelmetProvider in App.jsx), via `src/components/ui/SeoHead.jsx`; JSON-LD always through `jsonLdText` (`src/utils/jsonLd.js`)

## Design Tokens

Source of truth: `tailwind.config.js` and `src/index.css`.

```
Primary:    #1E6BAA  (TIDE teal-blue; also primary-dark #15538A, primary-light #D4EBF8)
Accent:     #F59E0B  (amber — CTAs; accent-deeper #843A0C for text on light backgrounds)
Navy:       #0D2137  (navy, navy-mid #162E4D, navy-light #1E3A5F)
Background: #FDFCF9  (tide-bg warm white; tide-subtle #F0EDE8, tide-surface #FFFFFF)
Text:       #0D1F3C  (tide-text near-black; tide-muted / tide-mutedOnLight #44515F; blue text = primary-dark #15538A (AAA))
Heading:    Playfair Display, with Noto Serif Devanagari / Noto Serif Gujarati as glyph fallbacks — font-display
Body:       Plus Jakarta Sans, with Noto Sans Devanagari / Noto Sans Gujarati as glyph fallbacks — font-body
```
The global keyboard focus ring (`:focus-visible` in `src/index.css`) is a 2px brand-blue outline with a 2px white `box-shadow` band, so it stays visible on the dark navy sections. `text-accent` (#F59E0B) is for dark backdrops only; on light backgrounds use `text-accent-deeper` (contrast). Layout helper in `index.css`: `section-padding` = `py-20 md:py-28 px-4 md:px-8 lg:px-16`. The PageHero banner uses a literal `#1c314d`, not the `navy` token.
