# TIDE Foundation Website — Claude Context

## Project Overview
A world-class, award-winning React static site rebuild of [tideinternational.org](https://tideinternational.org/) for TIDE Foundation (Together in Development and Education), an NGO based in Ahmedabad, India focused on educational reform.

## Tech Stack
- **Vite 5 + React 18** — static site, `npm run build` → `dist/`
- **React Router v6** (HashRouter — works on any static host without server config)
- **Tailwind CSS v3** — utility-first styling
- **Framer Motion** — animations and page transitions
- **i18next + react-i18next** — trilingual: English (default), Hindi, Gujarati
- **Lucide React** — icons
- **react-helmet-async** — SEO meta tags

## Deployment
Simple static: `npm run build` → upload `dist/` to Netlify/Vercel/GitHub Pages.

## Design System
- **Primary:** `#3B7CB8` (TIDE teal-blue)
- **Accent:** `#F4A435` (amber — CTAs, highlights)
- **Background:** `#FAFAF8` (warm white)
- **Text:** `#1A1A2E` (near-black)
- **Headings font:** Playfair Display (EN) / Noto Serif Devanagari (HI) / Noto Serif Gujarati (GU)
- **Body font:** Plus Jakarta Sans (EN) / Noto Sans Devanagari (HI) / Noto Sans Gujarati (GU)

## Folder Structure
```
src/
  components/
    layout/        # Header, Footer, Layout
    ui/            # Button, Card, Section, Badge, AnimatedCounter, TodoPlaceholder, LanguageSwitcher
  pages/
    Home.jsx
    about/         # WhyTide, OurTeam, OurPartners, OurResults
    projects/      # BlockETI, BetterED, EmpowerEd, CompletEd, OtherProjects
    get-involved/  # Volunteer, Donate, WorkWithUs, OrganizeMCCx
    resources/     # SaralKadam, AnnualReports, Publications
    THRIvE.jsx
    Contact.jsx
  i18n/
    index.js
    locales/en/translation.json
    locales/hi/translation.json
    locales/gu/translation.json
  hooks/
    useScrollAnimation.js
  App.jsx
  main.jsx
  index.css
```

## Pages (19 total)
| Route | Component | Status |
|-------|-----------|--------|
| `/` | Home | — |
| `/about/why-tide` | WhyTide | — |
| `/about/our-team` | OurTeam | — |
| `/about/our-partners` | OurPartners | — |
| `/about/our-results` | OurResults | — |
| `/projects/block-eti` | BlockETI | TODO content |
| `/projects/bettered` | BetterED | — |
| `/projects/empowered` | EmpowerEd | — |
| `/projects/completed` | CompletEd | — |
| `/projects/other-projects` | OtherProjects | TODO content |
| `/get-involved/volunteer` | Volunteer | — |
| `/get-involved/donate` | Donate | TODO content |
| `/get-involved/work-with-us` | WorkWithUs | TODO content |
| `/get-involved/mccx` | OrganizeMCCx | TODO content |
| `/thrive` | THRIvE | — |
| `/resources/saral-kadam` | SaralKadam | — |
| `/resources/annual-reports` | AnnualReports | — |
| `/resources/publications` | Publications | — |
| `/contact` | Contact | — |

## TODO Placeholders
Pages marked "TODO content" use `<TodoPlaceholder>` component — a subtle amber banner at the bottom indicating content needs updating. All placeholder sections are marked with `{/* TODO: replace with real content */}` comments.

## Source Content
All content crawled from tideinternational.org. See memory file `content_crawl.md` for full content reference.

## Content Management System (CMS)

All page content is managed through YAML files. **Never edit `src/data/` directly** — it is auto-generated.

### Pipeline
```
content/*.yaml  →  scripts/yaml-to-json.js  →  src/data/*.json  →  React imports JSON
```

### Commands
```bash
npm run content:sync       # YAML → JSON (runs automatically via predev/prebuild)
npm run content:validate   # Check YAML syntax + image path existence
npm run content:bootstrap  # Generate shared YAML from translation.json (safe to re-run)
npm run dev                # auto-syncs then starts Vite dev server
npm run build              # auto-syncs then builds to dist/
```

### Structure
```
content/
  pages/    # one YAML file per page (21 files)
  shared/   # navigation.yaml, footer.yaml
src/data/   # auto-generated JSON (committed to git, do not edit)
scripts/
  yaml-to-json.js      # sync engine
  validate-content.js  # YAML + image validation
  bootstrap-yaml.js    # initial shared file generator
```

### Component import pattern
```jsx
// Top-level page
import data from '../data/page-name.json'
// Sub-directory page
import data from '../../data/category-page.json'
```

### Non-serializable values
Icons and Tailwind color variants are kept in component files as lookup maps:
- `iconKey: "BookOpen"` in YAML → `ICONS[item.iconKey]` in JSX
- `colorKey: "blue"` in YAML → `COLOR_MAP[item.colorKey]` in JSX

### Full docs
See `CONTENT-GUIDE.md` for the non-technical user guide.
See `.claude/skills/content-management.md` for the full agent skill reference.

## Resuming Work
- Check this file for architecture overview
- Check `memory/project_tide_context.md` for project status
- Check `memory/content_crawl.md` for all page content
- Check `memory/design_decisions.md` for design system decisions
- Run `npm run dev` to start dev server
- Run `npm run build` to build for production
