# TIDE Foundation Website — Agent Onboarding

> This file is for AI agents (Claude, Codex, Gemini, etc.) picking up work on this project.
> Read this first. It tells you everything you need to know to work safely and effectively.

---

## What This Project Is

A production React static site for [TIDE Foundation](https://tideinternational.org/), an NGO in Ahmedabad, India focused on educational reform. Built with Vite 5 + React 18 + Tailwind CSS v3 + Framer Motion. Deployed as a static bundle — no server, no database.

**19 pages. All content is data-driven through a YAML CMS.**

---

## The Most Important Rule

> **Never edit files in `src/data/`.**

`src/data/*.json` files are **auto-generated** by the build pipeline. Any changes you make there will be silently overwritten the next time `npm run content:sync` (or `npm run dev` / `npm run build`) runs.

The canonical source of truth for all content is:
```
content/pages/*.yaml     ← page content
content/shared/*.yaml    ← navigation and footer
```

---

## How to Start

```bash
npm install          # first time only
npm run dev          # auto-syncs content, then starts dev server at localhost:5173
npm run build        # auto-syncs content, then builds to dist/
```

---

## Content Pipeline (YAML → JSON → React)

```
content/*.yaml
    ↓  scripts/yaml-to-json.js
src/data/*.json
    ↓  React import data from '../../data/foo.json'
Browser
```

| Command | What it does |
|---------|-------------|
| `npm run content:sync` | YAML → JSON (runs automatically before dev/build) |
| `npm run content:validate` | Check YAML syntax + verify image paths exist |
| `npm run content:bootstrap` | Generate shared YAML from translation.json |

Full pipeline docs: `.claude/skills/content-management.md`
Non-technical guide: `CONTENT-GUIDE.md`

---

## Project Structure

```
content/           ← EDIT THIS — YAML source files
  pages/           ← one .yaml per page (21 files)
  shared/          ← navigation.yaml, footer.yaml

src/
  components/
    layout/        ← Header.jsx, Footer.jsx, Layout.jsx
    ui/            ← Button, Card, PageHero, SectionHeader, Lightbox, ...
  pages/           ← React page components (19 pages)
    Home.jsx
    about/         ← WhyTide, OurTeam, OurPartners, OurResults
    projects/      ← BlockETI, BetterED, EmpowerEd, CompletEd, OtherProjects
    get-involved/  ← Volunteer, Donate, WorkWithUs, OrganizeMCCx
    resources/     ← SaralKadam, AnnualReports, Publications
    THRIvE.jsx
    Contact.jsx
  data/            ← DO NOT EDIT — auto-generated JSON
  hooks/           ← useLightbox, useScrollAnimation
  i18n/            ← translation files (legacy — pages now use JSON directly)

scripts/
  yaml-to-json.js      ← sync engine
  validate-content.js  ← validation
  bootstrap-yaml.js    ← bootstrap generator

public/
  assets/images/   ← all site images, organised by section
```

---

## How Pages Import Data

Every page imports its JSON directly — **no `useTranslation`**:

```jsx
// src/pages/Contact.jsx
import data from '../data/contact.json'

// src/pages/about/OurTeam.jsx
import data from '../../data/about-our-team.json'

// src/components/layout/Header.jsx
import navData from '../../data/navigation.json'

// src/components/layout/Footer.jsx
import footerData from '../../data/footer.json'
import contactData from '../../data/contact.json'
```

---

## Non-Serializable Values

React components and Tailwind variant classes **cannot** live in JSON/YAML. The solution:

1. Store a **string key** in YAML: `iconKey: "BookOpen"`, `colorKey: "blue"`
2. Define a **lookup map** in the component:

```jsx
const ICONS = {
  BookOpen: <BookOpen className="w-5 h-5" />,
  Users:    <Users className="w-5 h-5" />,
}
// Usage: {ICONS[item.iconKey]}

const COLOR_MAP = {
  blue:    { card: 'bg-blue-50 border-blue-200', accentBg: 'bg-blue-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', accentBg: 'bg-emerald-600' },
}
// Usage: const colors = COLOR_MAP[item.colorKey]
```

Never move these maps to YAML — Tailwind needs static class strings for tree-shaking.

---

## Image Paths

All images live under `public/assets/images/`. YAML stores full paths:

```yaml
photo: /assets/images/about-our-team/jane-smith.jpg
```

Exception: `OurPartners.jsx` stores only **filenames** in YAML and prepends a base path in the component:
```jsx
const BASE = '/assets/images/about-our-partners/'
```

---

## Lightbox Pattern

Pages with image galleries use the `useLightbox` hook:

```jsx
const { lightboxIndex, isLightboxOpen, openLightbox, closeLightbox, prevLightbox, nextLightbox }
  = useLightbox(data.gallery.images.length)
```

Pages with **multiple galleries** (e.g. `CompletEd.jsx`) create multiple instances with distinct variable names:
```jsx
const brochure = useLightbox(data.moiBrochure.pages.length)
const fellows  = useLightbox(data.scfProgram.fellows.length)
```

---

## Design System

| Token | Value |
|-------|-------|
| Primary | `#3B7CB8` (TIDE teal-blue) |
| Accent | `#F4A435` (amber — CTAs, highlights) |
| Background | `#FAFAF8` (warm white) |
| Text | `#1A1A2E` (near-black) |
| Heading font | Playfair Display |
| Body font | Plus Jakarta Sans |

Key custom Tailwind classes: `bg-tide-bg`, `bg-tide-subtle`, `text-tide-text`, `text-tide-muted`, `border-tide-border`, `badge-primary`, `badge-accent`, `section-padding`, `gradient-primary`, `gradient-accent`, `shadow-card`, `shadow-card-hover`, `shadow-float`.

---

## Pages Status

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | Home | Complete |
| `/about/why-tide` | WhyTide | Complete |
| `/about/our-team` | OurTeam | Complete |
| `/about/our-partners` | OurPartners | Complete |
| `/about/our-results` | OurResults | Complete |
| `/projects/block-eti` | BlockETI | TodoPlaceholder — needs stats/school data |
| `/projects/bettered` | BetterED | Complete |
| `/projects/empowered` | EmpowerEd | Complete |
| `/projects/completed` | CompletEd | Complete |
| `/projects/other-projects` | OtherProjects | Complete |
| `/get-involved/volunteer` | Volunteer | Complete |
| `/get-involved/donate` | Donate | Complete |
| `/get-involved/work-with-us` | WorkWithUs | TodoPlaceholder — needs job listings |
| `/get-involved/mccx` | OrganizeMCCx | Complete |
| `/thrive` | THRIvE | Complete |
| `/resources/saral-kadam` | SaralKadam | Complete |
| `/resources/annual-reports` | AnnualReports | Complete |
| `/resources/publications` | Publications | Complete |
| `/contact` | Contact | Complete |

---

## Common Tasks

### Update page content
Edit the relevant `content/pages/*.yaml` file → `npm run content:sync` → done.

### Add a team member
In `content/pages/about-our-team.yaml`, append to the appropriate `members:` list. Place the photo in `public/assets/images/about-our-team/`.

### Add an annual report
In `content/pages/resources-annual-reports.yaml`, prepend to `reports:` with `highlight: true` and update the previous latest to `highlight: false`.

### Add a new page
1. Create `content/pages/new-page.yaml`
2. Run `npm run content:sync`
3. Create `src/pages/NewPage.jsx` importing `data from '../data/new-page.json'`
4. Add route in `src/App.jsx`
5. Add nav entry in `content/shared/navigation.yaml`

### Fix a broken image
Run `npm run content:validate` — it lists all YAML image paths that have no matching file in `public/`.

---

## What to Avoid

- **Do not** edit `src/data/*.json` — overwritten on sync
- **Do not** add `useTranslation` to pages — all content now comes from JSON
- **Do not** hardcode content strings in JSX — put them in YAML
- **Do not** use `find`/`grep` Bash commands when Glob/Grep tools are available
- **Do not** create new abstraction layers without a clear need — the codebase is intentionally simple

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full architecture + CMS docs for Claude specifically |
| `CONTENT-GUIDE.md` | Non-technical user guide for content editing |
| `.claude/skills/content-management.md` | Agent skill — detailed CMS reference |
| `content/pages/home.yaml` | Reference example of a full page YAML |
| `src/pages/Home.jsx` | Reference example of a full page component |
