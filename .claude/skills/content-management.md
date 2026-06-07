---
name: content-management
description: TIDE Foundation website content management — YAML CMS workflow, i18n pipeline, data pipeline, and page architecture
---

# TIDE Foundation — Content Management Skill

## Project Overview

This is a **Vite 8 + React 19** static site for the TIDE Foundation NGO. All visible English content is managed through a YAML-based CMS. Translations (Hindi/Gujarati) are also managed through YAML files under `content/locales/`. The site is trilingual: EN / HI / GU.

## CRITICAL ARCHITECTURAL RULE — i18n Source of Truth

**English content ALWAYS comes from YAML data, never from translation.json.**

Every page component does:
```jsx
import { useTranslation } from 'react-i18next'
import data from '../data/page-name.json'

const { t } = useTranslation()

// The second arg to t() is the EN fallback from YAML:
<h1>{t('home.hero.tagline', data.hero.tagline)}</h1>
```

- `src/i18n/locales/en/translation.json` is intentionally empty (`{}`)
- `fallbackLng: false` — when HI/GU key is missing, i18next renders the `data.*` fallback directly
- If you hardcode an English string as the t() fallback, non-developers cannot update it via YAML

## Content Pipelines

There are THREE distinct data pipelines:

### Pipeline A — Page content (YAML → src/data/)
```
content/pages/*.yaml    ─┐
content/shared/*.yaml   ─┤  scripts/yaml-to-json.js  →  src/data/*.json  →  React component imports
```

### Pipeline B — Locale translations (YAML → translation.json)
```
content/locales/hi/*.yaml  →  deep-merge  →  src/i18n/locales/hi/translation.json
content/locales/gu/*.yaml  →  deep-merge  →  src/i18n/locales/gu/translation.json
```

Both pipelines run via a single command:
```bash
npm run content:sync    # handles both Pipeline A and Pipeline B
```

**Never edit `src/data/*.json` or `src/i18n/locales/hi|gu/translation.json` directly** — all are auto-generated.

### Pipeline C — ABL (Google Sheets API)
```
Google Sheet  →  Apps Script Web App  →  useABLData() hook  →  ABL page components
```
ABL content comes from Google Sheets. No YAML. Language switcher is hidden on ABL pages.

## File Naming Convention

### Page YAML → JSON
| Content file | Generated JSON | Page component |
|---|---|---|
| `content/pages/home.yaml` | `src/data/home.json` | `src/pages/Home.jsx` |
| `content/pages/about-why-tide.yaml` | `src/data/about-why-tide.json` | `WhyTide.jsx` |
| `content/pages/about-our-team.yaml` | `src/data/about-our-team.json` | `OurTeam.jsx` |
| `content/pages/about-our-partners.yaml` | `src/data/about-our-partners.json` | `OurPartners.jsx` |
| `content/pages/about-our-results.yaml` | `src/data/about-our-results.json` | `OurResults.jsx` |
| `content/pages/projects-block-eti.yaml` | `src/data/projects-block-eti.json` | `BlockETI.jsx` |
| `content/pages/projects-bettered.yaml` | `src/data/projects-bettered.json` | `BetterED.jsx` |
| `content/pages/projects-empowered.yaml` | `src/data/projects-empowered.json` | `EmpowerEd.jsx` |
| `content/pages/projects-completed.yaml` | `src/data/projects-completed.json` | `CompletEd.jsx` |
| `content/pages/projects-sdg-drives.yaml` | `src/data/projects-sdg-drives.json` | `SdgDrives.jsx` |
| `content/pages/projects-other.yaml` | `src/data/projects-other.json` | `OtherProjects.jsx` |
| `content/pages/get-involved-volunteer.yaml` | `src/data/get-involved-volunteer.json` | `Volunteer.jsx` |
| `content/pages/get-involved-donate.yaml` | `src/data/get-involved-donate.json` | `Donate.jsx` |
| `content/pages/get-involved-work-with-us.yaml` | `src/data/get-involved-work-with-us.json` | `WorkWithUs.jsx` |
| `content/pages/get-involved-mccx.yaml` | `src/data/get-involved-mccx.json` | `OrganizeMCCx.jsx` |
| `content/pages/thrive.yaml` | `src/data/thrive.json` | `THRIvE.jsx` |
| `content/pages/resources-saral-kadam.yaml` | `src/data/resources-saral-kadam.json` | `SaralKadam.jsx` |
| `content/pages/resources-annual-reports.yaml` | `src/data/resources-annual-reports.json` | `AnnualReports.jsx` |
| `content/pages/resources-publications.yaml` | `src/data/resources-publications.json` | `Publications.jsx` |
| `content/pages/abl-home.yaml` | `src/data/abl-home.json` | `AblHome.jsx` |
| `content/pages/abl-contribute.yaml` | `src/data/abl-contribute.json` | `AblContribute.jsx` |
| `content/pages/contact.yaml` | `src/data/contact.json` | `Contact.jsx` |
| `content/shared/navigation.yaml` | `src/data/navigation.json` | `Header.jsx` |
| `content/shared/footer.yaml` | `src/data/footer.json` | `Footer.jsx` |

### Locale YAML → translation.json
| Locale YAML directory | Generated translation file |
|---|---|
| `content/locales/hi/*.yaml` | `src/i18n/locales/hi/translation.json` |
| `content/locales/gu/*.yaml` | `src/i18n/locales/gu/translation.json` |

Each lang directory has: `shared.yaml` (nav, common, footer, abl, lang, todo) and `pages.yaml` (all page-specific content).

## React Component Import Pattern

All pages import both their data file AND useTranslation:

```jsx
import { useTranslation } from 'react-i18next'
import data from '../data/page-name.json'
import { Helmet } from 'react-helmet-async'

export default function PageName() {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{data.meta.seoTitle}</title>
        <meta name="description" content={data.meta.seoDescription} />
      </Helmet>
      <PageHero
        badge={data.meta.badge}
        title={t('pagename.hero.title', data.meta.title)}
        subtitle={t('pagename.hero.subtitle', data.meta.tagline)}
      />
      ...
    </>
  )
}
```

Header and Footer use shared data:
```jsx
// src/components/layout/Header.jsx
import navData from '../../data/navigation.json'
// t('common.donate', navData.donateLabel)

// src/components/layout/Footer.jsx
import footerData from '../../data/footer.json'
// t('common.supportWork', footerData.supportWork)
// t('footer.rights', footerData.rights)
// t('footer.madeWithLove', footerData.madeWithLove)
```

## i18n Key Naming Conventions

Keys follow a `section.subsection.field` pattern matching the YAML structure:

| Page | i18n key prefix | Example |
|---|---|---|
| Home | `home.` | `home.hero.badge`, `home.impact.sectionLabel` |
| About/WhyTide | `about.whyTide.` | `about.whyTide.title` |
| Projects/BetterED | `projects.bettered.` | `projects.bettered.tagline` |
| Get Involved | `getInvolved.` | `getInvolved.volunteer.title` |
| Resources/ABL | `abl.` | `abl.home.title`, `abl.contribute.cta` |
| Navigation | `nav.` | `nav.about`, `nav.desc.whyTide` |
| Common/shared | `common.` | `common.donate`, `common.learnMore` |
| Footer | `footer.` | `footer.rights`, `footer.columns.about` |
| Language names | `lang.` | `lang.en`, `lang.hi`, `lang.gu` |

## Feature Flag — Multilingual

`src/config/features.js` exports `MULTILINGUAL_ENABLED`. When false:
- Language switcher is hidden from header
- localStorage lang key is cleared
- Site always renders in English (from YAML data fallbacks)

To enable: set `const ENABLED = true` in `src/config/features.js`, or set env var `VITE_MULTILINGUAL_ENABLED=true`.

## YAML Structure Conventions

```yaml
# Every page YAML starts with meta:
meta:
  badge: "Section · Sub"          # small chip above hero title
  title: "Page Title"
  tagline: "Short subtitle."
  seoTitle: "Page Title — TIDE Foundation"    # browser tab + OG title
  seoDescription: "Search engine description (150 chars)."

# Sections use sectionBadge / sectionTitle / sectionSubtitle:
impact:
  sectionLabel: "Our Impact"
  stats:
    - value: "40,000+"
      label: "Lives Impacted"
      detail: "across Gujarat"

# Gallery items always include alt text:
gallery:
  badge: "Gallery Badge"
  title: "Gallery Title"
  viewAll: "View all"
  items:
    - src: assets/images/photo.jpg
      alt: "Descriptive alt text for accessibility"

# iconKey maps to a lookup table in the component (never store React components in YAML):
programs:
  items:
    - iconKey: "BookOpen"   # ICON_MAP['BookOpen'] in component
      colorKey: "blue"      # COLOR_MAP['blue'] in component
      title: "Programme Title"
```

## Image Paths

Images live in `public/assets/images/`. You may write paths with a leading `/` in YAML — `yaml-to-json.js` strips the leading `/` automatically:

```yaml
photo: /assets/images/team/jane-smith.jpg   # ✓ works (slash stripped by script)
photo: assets/images/team/jane-smith.jpg    # ✓ also works
```

Components use `import.meta.env.BASE_URL` prefix for runtime paths:
```jsx
<img src={`${import.meta.env.BASE_URL}${data.photo}`} />
```

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
# Sync both page YAML → src/data/ AND locale YAML → translation.json
npm run content:sync

# Validate YAML syntax and check image paths
npm run content:validate

# Start dev server (auto-syncs first)
npm run dev

# Production build (auto-syncs first)
npm run build
```

## Adding a New Page with i18n

1. Create `content/pages/new-page.yaml` with all visible English text
2. Run `npm run content:sync` → creates `src/data/new-page.json`
3. Create `src/pages/NewPage.jsx`:
   ```jsx
   import { useTranslation } from 'react-i18next'
   import { Helmet } from 'react-helmet-async'
   import data from '../data/new-page.json'

   export default function NewPage() {
     const { t } = useTranslation()
     return (
       <>
         <Helmet>
           <title>{data.meta.seoTitle}</title>
           <meta name="description" content={data.meta.seoDescription} />
         </Helmet>
         <PageHero badge={data.meta.badge} title={t('pagename.hero.title', data.meta.title)} subtitle={t('pagename.hero.subtitle', data.meta.tagline)} />
       </>
     )
   }
   ```
4. Add route to `src/App.jsx`
5. Add nav entry to `content/shared/navigation.yaml`
6. Add HI translations in `content/locales/hi/pages.yaml` under the matching key prefix
7. Add GU translations in `content/locales/gu/pages.yaml` under the matching key prefix
8. Run `npm run content:sync` again to regenerate translation.json files

## Adding/Editing HI or GU Translations

Edit `content/locales/hi/pages.yaml` or `content/locales/gu/pages.yaml` (or `shared.yaml` for nav/footer/common keys). Then run `npm run content:sync` — it deep-merges all YAML files per language and regenerates `translation.json`.

```yaml
# content/locales/hi/pages.yaml — example
home:
  hero:
    tagline: "समग्र शिक्षा तक"
    taglineHighlight: "पहुंच में सुधार"
    badge: "Together in Development & Education"  # keep EN if no translation needed
```

## Tech Stack Context

- **Vite 8 + React 19** — static site
- **React Router v7** — HashRouter (no server config needed)
- **Tailwind CSS v3** — utility classes
- **Framer Motion 12** — animations
- **i18next + react-i18next** — EN/HI/GU with localStorage persistence
- **Lucide React** — icons
- **js-yaml** — YAML parsing in Node.js scripts (devDependency)
- **react-helmet-async** — SEO meta tags (HelmetProvider in App.jsx)

## Design Tokens

```
Primary:    #3B7CB8  (TIDE teal-blue)
Accent:     #F4A435  (amber — CTAs)
Background: #FAFAF8  (warm white)
Text:       #1A1A2E  (near-black)
Heading:    Playfair Display (EN) / Noto Serif Devanagari (HI) / Noto Serif Gujarati (GU)
Body:       Plus Jakarta Sans (EN) / Noto Sans Devanagari (HI) / Noto Sans Gujarati (GU)
```
