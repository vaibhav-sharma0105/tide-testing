---
name: content-management
description: TIDE Foundation website content management — YAML CMS workflow, data pipeline, and page architecture
---

# TIDE Foundation — Content Management Skill

## Project Overview

This is a Vite 5 + React 18 static site for the TIDE Foundation NGO. All page content is managed through a YAML-based CMS that flows into JSON files imported by React components.

## Content Pipeline

```
content/*.yaml  →  scripts/yaml-to-json.js  →  src/data/*.json  →  React components
```

- **Source of truth**: `content/` directory (YAML files)
- **Generated output**: `src/data/` directory (JSON files, also committed to git)
- **Sync command**: `npm run content:sync` (runs `scripts/yaml-to-json.js`)
- **Validation command**: `npm run content:validate` (checks YAML syntax + image paths)
- **Bootstrap command**: `npm run content:bootstrap` (generates shared YAML from translation.json)
- **Auto-sync**: `predev` and `prebuild` hooks run sync automatically

## File Naming Convention

| Content file | Generated JSON | Page |
|---|---|---|
| `content/pages/home.yaml` | `src/data/home.json` | Home |
| `content/pages/about-why-tide.yaml` | `src/data/about-why-tide.json` | WhyTide |
| `content/pages/about-our-team.yaml` | `src/data/about-our-team.json` | OurTeam |
| `content/pages/about-our-partners.yaml` | `src/data/about-our-partners.json` | OurPartners |
| `content/pages/about-our-results.yaml` | `src/data/about-our-results.json` | OurResults |
| `content/pages/projects-block-eti.yaml` | `src/data/projects-block-eti.json` | BlockETI |
| `content/pages/projects-bettered.yaml` | `src/data/projects-bettered.json` | BetterED |
| `content/pages/projects-empowered.yaml` | `src/data/projects-empowered.json` | EmpowerEd |
| `content/pages/projects-completed.yaml` | `src/data/projects-completed.json` | CompletEd |
| `content/pages/projects-other.yaml` | `src/data/projects-other.json` | OtherProjects |
| `content/pages/get-involved-volunteer.yaml` | `src/data/get-involved-volunteer.json` | Volunteer |
| `content/pages/get-involved-donate.yaml` | `src/data/get-involved-donate.json` | Donate |
| `content/pages/get-involved-work-with-us.yaml` | `src/data/get-involved-work-with-us.json` | WorkWithUs |
| `content/pages/get-involved-mccx.yaml` | `src/data/get-involved-mccx.json` | OrganizeMCCx |
| `content/pages/thrive.yaml` | `src/data/thrive.json` | THRIvE |
| `content/pages/resources-saral-kadam.yaml` | `src/data/resources-saral-kadam.json` | SaralKadam |
| `content/pages/resources-annual-reports.yaml` | `src/data/resources-annual-reports.json` | AnnualReports |
| `content/pages/resources-publications.yaml` | `src/data/resources-publications.json` | Publications |
| `content/pages/contact.yaml` | `src/data/contact.json` | Contact |
| `content/shared/navigation.yaml` | `src/data/navigation.json` | Header |
| `content/shared/footer.yaml` | `src/data/footer.json` | Footer |

## React Component Import Pattern

All pages import their data file directly (no `useTranslation`):

```jsx
// Top-level page (src/pages/Foo.jsx):
import data from '../data/foo.json'

// Sub-directory page (src/pages/category/Foo.jsx):
import data from '../../data/category-foo.json'
```

Header and Footer use shared data:
```jsx
// src/components/layout/Header.jsx
import navData from '../../data/navigation.json'
const nav = navData.items   // replaces NAV(t)

// src/components/layout/Footer.jsx
import footerData from '../../data/footer.json'
import contactData from '../../data/contact.json'
```

## Non-Serializable Values (YAML Workaround)

React components and Tailwind variant classes cannot be stored in JSON. The pattern is:
- Store a **key string** in YAML (e.g. `iconKey: "BookOpen"`, `colorKey: "blue"`)
- Define a lookup map in the component file:

```jsx
// Icon map (component file keeps this)
const ICONS = {
  BookOpen: <BookOpen className="w-5 h-5" />,
  Users:    <Users className="w-5 h-5" />,
}
// Usage:
{ICONS[item.iconKey]}

// Color map
const COLOR_MAP = {
  blue:    { card: 'bg-blue-50 border-blue-200', accentBg: 'bg-blue-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', accentBg: 'bg-emerald-600' },
}
// Usage:
const colors = COLOR_MAP[item.colorKey]
```

## Image Paths

Images live in `public/assets/images/`. YAML stores full paths starting with `/assets/images/`:

```yaml
photo: /assets/images/about-our-team/jane-smith.jpg
```

For partner logos, YAML stores filenames only; the component prepends the base path:
```jsx
const BASE = '/assets/images/about-our-partners/'
// data.logoGallery.images is an array of filenames
```

## Lightbox Pattern

Pages with image galleries use `useLightbox` from `../../hooks/useLightbox`:

```jsx
const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox } = useLightbox(data.gallery.images.length)
```

Pages with multiple galleries (e.g. CompletEd) create multiple lightbox instances:
```jsx
const brochure = useLightbox(data.moiBrochure.pages.length)
const fellows  = useLightbox(data.scfProgram.fellows.length)
```

## YAML Structure Conventions

```yaml
# Every page YAML starts with meta:
meta:
  badge: "Page Section"
  title: "Page Title"
  tagline: "Short subtitle shown in hero."
  seoTitle: "Page Title — TIDE Foundation"
  seoDescription: "Description for search engines."

# Sections use sectionBadge / sectionTitle / sectionSubtitle:
sectionName:
  sectionBadge: "Badge Text"
  sectionTitle: "Section Heading"
  sectionSubtitle: "Optional descriptive line."
  items:
    - title: Item Title
      desc: Item description text.
      iconKey: BookOpen   # maps to ICONS in component
```

## Running the Pipeline

```bash
# Sync YAML → JSON (runs automatically before dev/build)
npm run content:sync

# Validate YAML syntax and check image paths
npm run content:validate

# Generate shared YAML files (navigation, footer) from translation.json
npm run content:bootstrap

# Start dev server (auto-syncs first)
npm run dev

# Production build (auto-syncs first)
npm run build
```

## Adding a New Page

1. Create `content/pages/new-page.yaml` with appropriate structure
2. Run `npm run content:sync` → creates `src/data/new-page.json`
3. Create `src/pages/NewPage.jsx`:
   ```jsx
   import data from '../data/new-page.json'
   export default function NewPage() {
     return <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />
   }
   ```
4. Add route to `src/App.jsx`
5. Add nav entry to `content/shared/navigation.yaml`

## Tech Stack Context

- **Vite 5 + React 18** — static site
- **React Router v6** — HashRouter (no server config needed)
- **Tailwind CSS v3** — utility classes
- **Framer Motion** — animations
- **Lucide React** — icons
- **js-yaml** — YAML parsing in Node.js scripts (devDependency)
- **react-helmet-async** — SEO meta tags

## Design Tokens

```
Primary:    #3B7CB8  (TIDE teal-blue)
Accent:     #F4A435  (amber — CTAs)
Background: #FAFAF8  (warm white)
Text:       #1A1A2E  (near-black)
Heading:    Playfair Display
Body:       Plus Jakarta Sans
```
