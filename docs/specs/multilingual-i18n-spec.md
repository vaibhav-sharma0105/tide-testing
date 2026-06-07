# Multilingual (EN / HI / GU) Implementation Spec
**Version:** 1.0 — 2026-06-07  
**Scope:** Full end-to-end i18n for all 24 pages, header, footer, and shared UI components.  
**Out of scope:** ABL content rows (Google Sheet data stays in English); navigation/footer structural URLs.

---

## 1. Architecture

### Golden rule
**YAML files are never touched.** They hold English structural data only (image paths, URLs, icon keys, link targets). All displayable text lives exclusively in `src/i18n/locales/*/translation.json`.

### Data flow
```
content/*.yaml  →  src/data/*.json  (structural: paths, IDs, icon keys, URLs)
                                         ↓
                         React component reads JSON for structure
                         React component calls t('key', fallback) for text
                                         ↓
                    src/i18n/locales/en|hi|gu/translation.json
```

### Fallback chain
`i18next` is configured with `fallbackLng: 'en'`. Every `t()` call uses the English string as its inline fallback:
```jsx
t('home.hero.tagline', data.hero.tagline)   // JSON value = English fallback
t('home.impact.label', 'Our Impact in Numbers')  // literal = English fallback
```
This means HI/GU translations can be filled in gradually — users always see English until a translation exists.

### Language persistence
`localStorage.setItem('tide-lang', code)` — stored under key `tide-lang`. Already implemented in `LanguageSwitcher.jsx`.

### ABL pages
Language switcher is **hidden** on all ABL routes (`/resources/abl-resources*`). The ABL content rows (fetched from Google Sheet) are English-only. Only ABL UI chrome (buttons, labels, filter options) is translated. See §6.

---

## 2. Current State Audit

### What already works
- `i18next` + `react-i18next` installed and configured in `src/i18n/index.js`
- `LanguageSwitcher.jsx` renders in `Header.jsx` (desktop + mobile)
- `src/i18n/locales/en/translation.json` — **exists, partially populated** (nav, home, about, projects, thrive, getInvolved, resources, contact, footer, todo, lang)
- `src/i18n/locales/hi/translation.json` — **exists, partially populated** (same structure as EN, most strings translated)
- `src/i18n/locales/gu/translation.json` — **exists, incomplete** (same structure, ~60% complete, has character corruption in several sections)

### What needs to be done
1. **No page component currently calls `useTranslation()`** — they all read from `data` JSON only. Every component needs to be wired up.
2. **~80+ hardcoded strings** in JSX need `t()` wrapping and keys added to all three translation files.
3. **Navigation labels** are read from `navData.items[*].label` (English from navigation.json). Need i18nKey fields.
4. **Footer** column titles and link labels are read from `footerData.columns[*].title` and `.links[*].label` (English-only from footer.json). Need i18nKey fields.
5. **Missing keys** in EN, HI, GU: sdgDrives, ABL UI strings, common UI strings (below).
6. **GU corruption** in several keys — needs fix.
7. **Language switcher hiding** on ABL routes — one Header change.

---

## 3. Translation Key Hierarchy (Complete Additions Required)

This section lists **all keys that must be added** to `src/i18n/locales/en/translation.json` (with English values), then mirrored with translations in HI and GU files.

Keys that **already exist** in EN translation.json are marked with ✓. All others need to be added.

### 3.1 Additions to `nav` namespace

```jsonc
"nav": {
  // ✓ Existing: home, about, whyTide, ourTeam, ourPartners, ourResults,
  //   projects, blockETI, bettered, empowered, completed, otherProjects,
  //   getInvolved, volunteer, donate, workWithUs, mccx, thrive,
  //   resources, saralKadam, annualReports, publications, contact

  // ADD:
  "sdgDrives": "SDG Drives",
  "abl": "ABL Resources",
  "ablHome": "Home",
  "ablResourceCenter": "Resource Center",
  "ablContribute": "Contribute",

  // Nav item descriptions (used in dropdown sub-labels):
  "desc": {
    "whyTide": "Our story, vision & values",
    "ourTeam": "Meet the people behind TIDE",
    "ourPartners": "70+ school & university partners",
    "ourResults": "Impact data & outcomes",
    "blockETI": "Systemic change in govt. schools",
    "bettered": "Life skills in 12 urban slums",
    "empowered": "Teacher professional development",
    "completed": "Fellowships & civic education",
    "sdgDrives": "Year-long SDG volunteering initiative",
    "otherProjects": "More initiatives & programs",
    "volunteer": "Intern or volunteer with us",
    "workWithUs": "Full-time & part-time roles",
    "mccx": "Organise a Model City Council",
    "saralKadam": "Foundational learning booklets",
    "annualReports": "Reports from 2014 to present",
    "publications": "Research papers & articles",
    "abl": "Activity-Based Learning resource library"
  }
}
```

### 3.2 Additions to `home` namespace

```jsonc
"home": {
  "hero": {
    // ✓ tagline, taglineHighlight, description, cta, ctaSecondary
    "badge": "Together in Development & Education",
    "scroll": "Scroll",
    "floatProjects": "Active programmes",
    "floatFounded": "Founded in Ahmedabad"
  },
  "impact": {
    "sectionLabel": "Our Impact in Numbers",
    "stats": [
      { "value": "40000+", "label": "Lives Impacted", "detail": "across Gujarat since 2014" },
      { "value": "200+",   "label": "Volunteers & Interns", "detail": "from universities across India" },
      { "value": "70+",    "label": "Partner Organisations", "detail": "schools, NGOs & institutions" },
      { "value": "10",     "label": "Years of Service", "detail": "of continuous grassroots impact" }
    ]
  },
  "mission": {
    // ✓ title, body, quote
    "learnMore": "Learn why we do this"
  },
  "programs": {
    // ✓ title, subtitle
    "badge": "Our Programmes",
    "explore": "Explore"
  },
  "gallery": {
    "badge": "Our Work in Photos",
    "title": "Moments from the field",
    "viewAll": "View all"
  },
  "testimonial": {
    "sectionLabel": "Voices from the field"
  },
  "cta": {
    // ✓ title, body, volunteer, donate
    "badge": "Get Involved"
  }
}
```

> **Implementation note for `impact.stats`:** Because the stat items are hardcoded in Home.jsx as a JS array (not from data JSON), translate them as an array in translation.json using the i18next array syntax, or use indexed keys (`impact.stat0.label`, etc.). Recommended: indexed keys for simplicity.

Simpler flat form (recommended):
```jsonc
"home": {
  "impact": {
    "sectionLabel": "Our Impact in Numbers",
    "stat0Value": "40,000+", "stat0Label": "Lives Impacted", "stat0Detail": "across Gujarat since 2014",
    "stat1Value": "200+",   "stat1Label": "Volunteers & Interns", "stat1Detail": "from universities across India",
    "stat2Value": "70+",    "stat2Label": "Partner Organisations", "stat2Detail": "schools, NGOs & institutions",
    "stat3Value": "10",     "stat3Label": "Years of Service", "stat3Detail": "of continuous grassroots impact"
  }
}
```

### 3.3 Additions to `common` namespace (new top-level)

```jsonc
"common": {
  "donate": "Donate",
  "donateToTide": "Donate to TIDE",
  "supportWork": "Support our work",
  "madeWithLove": "Made with love for education in India",
  "foundation": "Foundation",
  "loading": "Loading...",
  "error": "Failed to load. Please try again.",
  "retry": "Retry",
  "noResults": "No results found.",
  "previous": "Previous",
  "next": "Next",
  "page": "Page",
  "of": "of",
  "hoverForBio": "Hover over a photo to read about each person.",
  "learnMore": "Learn more",
  "viewAll": "View all"
}
```

### 3.4 Additions to `footer` namespace

```jsonc
"footer": {
  // ✓ tagline, rights, together
  "madeWithLove": "Made with love for education in India",
  "columns": {
    "about": "About",
    "projects": "Projects",
    "getInvolved": "Get Involved",
    "resources": "Resources",
    "contact": "Contact"
  }
}
```

> The footer column links use the same translated labels as `nav.*` keys — reuse them in Footer.jsx via `t('nav.' + item.i18nKey, item.label)`.

### 3.5 Additions to `projects` namespace

```jsonc
"projects": {
  // ✓ bettered, empowered, completed, blockETI, other

  // ADD:
  "sdgDrives": {
    "title": "SDG Drives",
    "tagline": "Year-long volunteering aligned with the UN Sustainable Development Goals.",
    "overview": "SDG Drives mobilises volunteers across Gujarat for targeted, SDG-aligned impact campaigns."
  }
}
```

### 3.6 New `abl` namespace (ABL UI chrome only — not content rows)

```jsonc
"abl": {
  "nav": {
    "home": "ABL Resources",
    "resourceCenter": "Resource Center",
    "contribute": "Contribute"
  },
  "home": {
    "badge": "Activity-Based Learning",
    "title": "ABL Resource Library",
    "subtitle": "Curated teaching materials for Activity-Based Learning across grades 1–5.",
    "browseButton": "Browse Resources",
    "contributeButton": "Contribute a Resource",
    "statsTitle": "Library at a glance",
    "totalResources": "Total Resources",
    "typeLabels": {
      "Worksheet": "Worksheets",
      "Games": "Games",
      "Kits": "Kits",
      "Flashcards": "Flashcards"
    },
    "typeDescriptions": {
      "Worksheet": "Printable activity sheets",
      "Games": "Learning games & activities",
      "Kits": "Physical resource kits",
      "Flashcards": "Visual memory aids"
    }
  },
  "resourceCenter": {
    "title": "Resource Center",
    "subtitle": "Browse and download ABL teaching materials.",
    "searchPlaceholder": "Search resources...",
    "filterType": "Resource Type",
    "filterGrade": "Grade",
    "filterLanguage": "Language",
    "filterOwnership": "Source",
    "filterAll": "All",
    "filterTide": "TIDE Only",
    "filterExternal": "External",
    "clearFilters": "Clear filters",
    "showing": "Showing",
    "resources": "resources",
    "noResults": "No resources match your filters.",
    "loading": "Loading resources...",
    "error": "Failed to load resources.",
    "retry": "Try again"
  },
  "resourceCard": {
    "tideResource": "TIDE Resource",
    "externalResource": "External Resource",
    "grades": "Grades",
    "language": "Language",
    "type": "Type"
  },
  "detail": {
    "back": "Back to Resource Center",
    "download": "Download",
    "preview": "Preview",
    "request": "Request Access",
    "grades": "Grades",
    "language": "Language",
    "type": "Type",
    "ownership": "Source",
    "tideResource": "TIDE Resource",
    "externalResource": "External Resource",
    "noPreview": "No preview available.",
    "notFound": "Resource not found.",
    "notFoundSub": "This resource may have been removed or the link is incorrect."
  },
  "contribute": {
    "badge": "Share your materials",
    "title": "Contribute a Resource",
    "subtitle": "Help grow the ABL library by sharing your teaching materials.",
    "step1Title": "Prepare your material",
    "step1Desc": "Ensure your resource is a Google Drive file (Doc, Sheet, PDF, image).",
    "step2Title": "Fill the form",
    "step2Desc": "Provide title, grade level, language, and resource type.",
    "step3Title": "We review & publish",
    "step3Desc": "Our team reviews submissions within 5–7 working days.",
    "cta": "Submit via Google Form",
    "ctaPending": "Contribution form coming soon"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "page": "Page",
    "of": "of"
  }
}
```

### 3.7 Additions to existing `contact` namespace

```jsonc
"contact": {
  // ✓ title, tagline, address, hours, whatsapp, email,
  //   namePlaceholder, emailPlaceholder, messagePlaceholder, send
  // These already exist but GU file has them corrupted — see §7
}
```

### 3.8 Additions to existing `resources` namespace

```jsonc
"resources": {
  "saralKadam": {
    // ✓ title, tagline, overview, available, request, level0..level3
    "downloadButton": "Download free",
    "requestWorksheet": "Request worksheets"
  },
  "annualReports": {
    // ✓ title, tagline
    "download": "Download PDF",
    "viewReport": "View Report"
  },
  "publications": {
    // ✓ title, tagline
    "readMore": "Read more",
    "download": "Download"
  }
}
```

---

## 4. Navigation — i18nKey Fields

### 4.1 navigation.yaml additions

Add an `i18nKey` field to every navigation item and an optional `descKey` for descriptions. The YAML values are the lookup key into `nav.*` in translation.json.

```yaml
# content/shared/navigation.yaml
items:
  - label: "About Us"
    i18nKey: "about"
    children:
      - label: "Why TIDE?"
        i18nKey: "whyTide"
        descKey: "desc.whyTide"
        to: "/about/why-tide"
        desc: "Our story, vision & values"
      - label: "Our Team"
        i18nKey: "ourTeam"
        descKey: "desc.ourTeam"
        to: "/about/our-team"
        desc: "Meet the people behind TIDE"
      # ... all items follow same pattern
      - label: "SDG Drives"
        i18nKey: "sdgDrives"
        descKey: "desc.sdgDrives"
        to: "/projects/sdg-drives"
        desc: "Year-long SDG volunteering initiative"
```

### 4.2 Header.jsx changes

```jsx
// Add at top:
import { useTranslation } from 'react-i18next'

// Inside Header():
const { t } = useTranslation()

// In nav item rendering:
{item.label}  →  {t(`nav.${item.i18nKey}`, item.label)}

// In Dropdown, for desc:
{item.desc && <div>{item.desc}</div>}
→
{item.descKey && <div>{t(`nav.${item.descKey}`, item.desc)}</div>}

// Donate button:
'Donate'  →  {t('common.donate', 'Donate')}
'Donate to TIDE'  →  {t('common.donateToTide', 'Donate to TIDE')}

// Language switcher: hide on ABL routes
import { useLocation } from 'react-router-dom'
const location = useLocation()
const isABL = location.pathname.startsWith('/resources/abl-resources')
// Render LanguageSwitcher only when !isABL
```

### 4.3 Footer.jsx changes

```jsx
// Add at top:
import { useTranslation } from 'react-i18next'

// Inside Footer():
const { t } = useTranslation()

// Column titles (footerData.columns[*].title → navData i18nKey lookup):
{col.title}  →  {t(`footer.columns.${col.i18nKey}`, col.title)}

// Column links (each link has an i18nKey matching nav.* keys):
{item.label}  →  {t(`nav.${item.i18nKey}`, item.label)}

// Bottom bar:
'Made with ❤ for education in India'  →  {t('common.madeWithLove')}
'Support our work'  →  {t('common.supportWork')}
'© ... All rights reserved.'  →  {t('footer.rights')}  ← already in EN
```

### 4.4 footer.yaml additions

Add `i18nKey` to each column and each link:
```yaml
# content/shared/footer.yaml
columns:
  - title: "About"
    i18nKey: "about"
    links:
      - label: "Why TIDE?"
        i18nKey: "whyTide"
        to: "/about/why-tide"
      # ...
  - title: "Projects"
    i18nKey: "projects"
    links:
      - label: "SDG Drives"
        i18nKey: "sdgDrives"
        to: "/projects/sdg-drives"
      # ...
```

---

## 5. Page-by-Page Transformation Guide

For every page component, the pattern is:

```jsx
import { useTranslation } from 'react-i18next'

export default function PageName() {
  const { t } = useTranslation()
  // Replace hardcoded text with t('key', 'EN fallback')
  // Replace data.hero.title with t('pageName.hero.title', data.hero.title)
}
```

### 5.1 Home.jsx

**Hardcoded strings to wrap:**

| Location | Current | Key | EN fallback |
|----------|---------|-----|-------------|
| Hero badge | `"Together in Development & Education"` | `home.hero.badge` | same |
| Scroll hint | `"Scroll"` | `home.hero.scroll` | same |
| Floating card | `"Active programmes"` | `home.hero.floatProjects` | same |
| Floating card | `"Founded in Ahmedabad"` | `home.hero.floatFounded` | same |
| Impact header | `"Our Impact in Numbers"` | `home.impact.sectionLabel` | same |
| Impact stat 0 | `'Lives Impacted'`, `'across Gujarat since 2014'` | `home.impact.stat0Label`, `home.impact.stat0Detail` | same |
| Impact stat 1 | `'Volunteers & Interns'`, `'from universities across India'` | `home.impact.stat1Label`, `home.impact.stat1Detail` | same |
| Impact stat 2 | `'Partner Organisations'`, `'schools, NGOs & institutions'` | `home.impact.stat2Label`, `home.impact.stat2Detail` | same |
| Impact stat 3 | `'Years of Service'`, `'of continuous grassroots impact'` | `home.impact.stat3Label`, `home.impact.stat3Detail` | same |
| Mission section | `data.mission.sectionBadge` | Keep in JSON (EN) / or `t('home.mission.badge', data.mission.sectionBadge)` | same |
| Mission button | `"Learn why we do this"` | `home.mission.learnMore` | same |
| Programs badge | `"Our Programmes"` | `home.programs.badge` | same |
| Programs title | `data.programs.sectionTitle` | `t('home.programs.title', data.programs.sectionTitle)` | same |
| Programs subtitle | `data.programs.sectionSubtitle` | `t('home.programs.subtitle', data.programs.sectionSubtitle)` | same |
| Programs hover | `"Explore"` | `home.programs.explore` | same |
| Gallery badge | `"Our Work in Photos"` | `home.gallery.badge` | same |
| Gallery heading | `"Moments from the field"` | `home.gallery.title` | same |
| Gallery link | `"View all"` | `home.gallery.viewAll` | same |
| Testimonial label | `"Voices from the field"` | `home.testimonial.sectionLabel` | same |
| CTA badge | `"Get Involved"` | `home.cta.badge` | same |

**Data JSON fields to translate** (add `useTranslation` and use JSON value as fallback):
- `data.hero.tagline`, `data.hero.taglineHighlight`, `data.hero.description`, `data.hero.ctaLabel`, `data.hero.ctaSecondaryLabel`
- `data.mission.title`, `data.mission.body`, `data.mission.quote`
- `data.cta.sectionTitle`, `data.cta.body`, `data.cta.volunteerLabel`, `data.cta.donateLabel`
- `data.testimonial.quote`, `data.testimonial.author`, `data.testimonial.role`
- Each `program.title`, `program.desc`, `program.badge` via `t('home.programs.{program.id}.title', program.title)`

**home.json modification:** Add `"id"` field to each program item so it can be used as an i18n key:
```json
"programs": {
  "items": [
    { "id": "blockETI", "iconKey": "Globe", "to": "...", "photo": "...",
      "title": "Block ETI", "badge": "Project 1", "desc": "..." }
  ]
}
```

### 5.2 Pages using PageHero + SectionHeader + data JSON

All page components (WhyTide, OurTeam, OurPartners, OurResults, BlockETI, BetterED, EmpowerEd, CompletEd, SdgDrives, OtherProjects, Volunteer, Donate, WorkWithUs, OrganizeMCCx, THRIvE, SaralKadam, AnnualReports, Publications, Contact) follow the same pattern:

```jsx
import { useTranslation } from 'react-i18next'

export default function PageName() {
  const { t } = useTranslation()
  // data.meta.badge  →  t('pageName.meta.badge', data.meta.badge)
  // data.meta.title  →  t('pageName.meta.title', data.meta.title)
  // etc.
}
```

The **existing translation.json keys** for each page serve as the i18n source. The `data.*` values serve as the EN fallback. No data JSON changes are needed for simple pages.

**Pages that have hardcoded UI strings needing `t()`:**

| File | Hardcoded string | Key |
|------|-----------------|-----|
| `OurTeam.jsx:93` | `"Hover over a photo to read about each person."` | `common.hoverForBio` |
| All pages | Button labels that come from data JSON | Use `t('page.section.key', data.key)` |

### 5.3 Contact.jsx

Already has keys in translation.json (`contact.*`). Just needs `useTranslation()` added and all text replaced with `t()` calls. The contact form placeholders (`namePlaceholder`, `emailPlaceholder`, `messagePlaceholder`, `send`) already exist in EN translation.json.

### 5.4 THRIvE.jsx

Already has keys in translation.json (`thrive.*`). Needs `useTranslation()` + `t()`.

### 5.5 SdgDrives.jsx

Missing from both nav and projects sections in translation.json. Add `nav.sdgDrives` and `projects.sdgDrives.*` keys.

---

## 6. ABL Pages — Special Rules

### 6.1 Hide language switcher
In `Header.jsx`, detect ABL routes and hide `<LanguageSwitcher>`:
```jsx
const { pathname } = useLocation()
const isABL = pathname.startsWith('/resources/abl-resources')
// ...
{!isABL && <LanguageSwitcher light={!scrolled} />}
```

### 6.2 ABL UI chrome translation
All UI chrome (buttons, labels, filter options, states) uses `t('abl.*')` keys defined in §3.6. Data rows from the Google Sheet stay in English.

### 6.3 AblHome.jsx changes
```jsx
const { t } = useTranslation()
// Replace all hardcoded English strings with t('abl.home.*', 'fallback')
// Dynamic stats (total count, per-tab counts) come from useABLData() — numbers only, no translation needed
// Tab type labels → t('abl.home.typeLabels.Worksheet', 'Worksheets') etc.
```

### 6.4 AblResourceCenter.jsx changes
```jsx
const { t } = useTranslation()
// Search placeholder, filter labels, "Showing X resources", empty state, error state
// All use t('abl.resourceCenter.*', fallback)
```

### 6.5 AblDetail.jsx changes
```jsx
const { t } = useTranslation()
// Back button, action buttons (Download, Preview, Request), metadata labels
// "TIDE Resource" / "External Resource" badge text
// Not-found state text
```

### 6.6 AblContribute.jsx changes
```jsx
const { t } = useTranslation()
// Badge, title, subtitle, step titles/descriptions, CTA button
// Uses t('abl.contribute.*', fallback)
```

### 6.7 ResourceCard.jsx changes
```jsx
const { t } = useTranslation()
// "TIDE Resource" → t('abl.resourceCard.tideResource', 'TIDE Resource')
// "External Resource" → t('abl.resourceCard.externalResource', 'External Resource')
```

### 6.8 ResourceFilters.jsx changes
```jsx
const { t } = useTranslation()
// Filter labels, placeholders, "All", "TIDE Only", "External"
```

### 6.9 Pagination.jsx changes
```jsx
const { t } = useTranslation()
// "Previous", "Next", "Page X of Y"
```

---

## 7. Gujarati (GU) Corruption Fixes

The GU translation file has corrupted character sequences (`..ç..ç..ä..ç..ç..ä`) in the following keys. These need to be corrected:

| Key | Corrupted value | Action |
|-----|----------------|--------|
| `thrive.projects.p2desc` | `"ભારત ભરમાં શૈક્ષ..ç..ç..ä..."` | Rewrite with correct Gujarati text or use EN fallback |
| `resources.saralKadam.available` | `"હાલ ગુજ..ç..ç..ä..."` | Rewrite |
| `resources.annualReports.tagline` | `"અ..ç..ç..ä..."` | Rewrite |
| `resources.publications.title` | `"..ç..ç..ä"` | Rewrite |
| `resources.publications.tagline` | `"TIDE સ..ç..ç..ä..."` | Rewrite |
| `contact.title` | `"સ..ç..ç..ä..."` | Rewrite |

**Recommended fix:** Replace all corrupted GU strings with their EN equivalents temporarily (surrounded by a comment or flagged), then get proper Gujarati translations from a native speaker. i18next will fall back to EN anyway until corrected.

---

## 8. Implementation Phases

### Phase 1 — Translation File Updates (no UI changes yet)
**Files:** `src/i18n/locales/en/translation.json`, `hi/translation.json`, `gu/translation.json`

1. Add all keys from §3 to EN translation.json
2. Add HI translations for new keys (or copy EN as placeholder)
3. Add GU translations for new keys + fix §7 corruption
4. Add `sdgDrives` to `projects` namespace in all three files

**Acceptance:** Run `npm run dev`, open browser, switch language — no visible change yet (since no components use `t()` yet), but no console errors.

### Phase 2 — YAML additions
**Files:** `content/shared/navigation.yaml`, `content/shared/footer.yaml`

1. Add `i18nKey` field to every nav item and footer link (see §4.1, §4.4)
2. Run `npm run content:sync` to regenerate JSON
3. Verify `src/data/navigation.json` and `src/data/footer.json` have `i18nKey` fields

### Phase 3 — Header & Footer
**Files:** `src/components/layout/Header.jsx`, `src/components/layout/Footer.jsx`

1. Wire up `useTranslation()` in both
2. Replace `item.label` with `t('nav.' + item.i18nKey, item.label)` everywhere in Header
3. Replace `item.desc` with `t('nav.' + item.descKey, item.desc)` in dropdown
4. Replace "Donate" / "Donate to TIDE" with `t('common.donate')` / `t('common.donateToTide')`
5. Replace footer column titles with `t('footer.columns.' + col.i18nKey, col.title)`
6. Replace footer link labels with `t('nav.' + item.i18nKey, item.label)`
7. Replace "Made with ❤ for education in India" with `t('common.madeWithLove')`
8. Replace "Support our work" with `t('common.supportWork')`
9. Add ABL route detection to hide LanguageSwitcher

**Acceptance:** Switch language → navigation labels, footer labels change.

### Phase 4 — Home.jsx
**Files:** `src/pages/Home.jsx`, `content/pages/home.yaml` (add program `id` fields), `src/data/home.json`

1. Add `useTranslation()`
2. Add `id` field to each program item in `home.yaml` (e.g., `blockETI`, `bettered`, etc.)
3. Resync: `npm run content:sync`
4. Replace all hardcoded strings with `t()` (see §5.1 table)
5. Replace `data.*` text fields with `t('home.*', data.*)` calls

**Acceptance:** Switch language → home page content changes.

### Phase 5 — Content pages (all remaining 19 pages)
**Order:** About pages → Projects → Get Involved → THRIvE → Resources → Contact

For each page:
1. Add `useTranslation()`
2. Wrap every `data.*` text field: `t('namespace.key', data.value)`
3. Wrap any hardcoded UI strings

Files in order:
- `src/pages/about/WhyTide.jsx`
- `src/pages/about/OurTeam.jsx` (+ add `common.hoverForBio` key)
- `src/pages/about/OurPartners.jsx`
- `src/pages/about/OurResults.jsx`
- `src/pages/projects/BlockETI.jsx`
- `src/pages/projects/BetterED.jsx`
- `src/pages/projects/EmpowerEd.jsx`
- `src/pages/projects/CompletEd.jsx`
- `src/pages/projects/SdgDrives.jsx`
- `src/pages/projects/OtherProjects.jsx`
- `src/pages/get-involved/Volunteer.jsx`
- `src/pages/get-involved/Donate.jsx`
- `src/pages/get-involved/WorkWithUs.jsx`
- `src/pages/get-involved/OrganizeMCCx.jsx`
- `src/pages/THRIvE.jsx`
- `src/pages/resources/SaralKadam.jsx`
- `src/pages/resources/AnnualReports.jsx`
- `src/pages/resources/Publications.jsx`
- `src/pages/Contact.jsx`

**Acceptance:** Switch language on any page → page content switches.

### Phase 6 — ABL Pages
**Files:** All `src/pages/resources/Abl*.jsx`, `src/components/abl/ResourceCard.jsx`, `src/components/abl/ResourceFilters.jsx`, `src/components/abl/Pagination.jsx`, `src/components/abl/AblNavBar.jsx`

1. Add `useTranslation()` to all 8 files
2. Replace all UI strings with `t('abl.*', fallback)` (see §6)
3. Language switcher hidden via Phase 3 Header change

**Acceptance:** On ABL pages, no language switcher appears. Filter labels, buttons, states translate correctly. Content rows remain in English.

### Phase 7 — Shared UI Components
**Files:** `src/components/ui/TodoPlaceholder.jsx`

1. Add `useTranslation()` to TodoPlaceholder
2. Replace badge/message strings with `t('todo.label')` and `t('todo.message')`

These already exist in EN translation.json.

---

## 9. Component-Level Pattern Reference

### Pattern A: Page with data JSON (most pages)
```jsx
import { useTranslation } from 'react-i18next'
import data from '../data/page-name.json'

export default function PageName() {
  const { t } = useTranslation()
  return (
    <PageHero
      badge={t('namespace.badge', data.meta.badge)}
      title={t('namespace.title', data.meta.title)}
      subtitle={t('namespace.subtitle', data.meta.subtitle)}
    />
  )
}
```

### Pattern B: Hardcoded string
```jsx
// Before:
<span>Our Impact in Numbers</span>
// After:
<span>{t('home.impact.sectionLabel', 'Our Impact in Numbers')}</span>
```

### Pattern C: Array item with id-based lookup
```jsx
// home.json programs.items has { id: 'bettered', title: 'BetterED', ... }
{data.programs.items.map(item => (
  <div key={item.id}>
    <h3>{t(`home.programs.${item.id}.title`, item.title)}</h3>
    <p>{t(`home.programs.${item.id}.desc`, item.desc)}</p>
  </div>
))}
```

### Pattern D: Navigation label (Header/Footer)
```jsx
// navData.items[*].i18nKey = 'bettered' → t('nav.bettered', item.label)
{t(`nav.${item.i18nKey}`, item.label)}
```

### Pattern E: Conditional language switcher (Header)
```jsx
const { pathname } = useLocation()
const isABL = pathname.startsWith('/resources/abl-resources')
// ...
{!isABL && <LanguageSwitcher light={!scrolled} />}
```

---

## 10. Testing Checklist

After implementation, verify:

- [ ] Language switcher renders in Header on all non-ABL pages
- [ ] Language switcher is hidden on `/resources/abl-resources`, `/resources/abl-resources/resource-center`, and `/resources/abl-resources/resource-center/:id`
- [ ] Switching to HI: navigation labels change, home page hero text changes, footer changes
- [ ] Switching to GU: same as HI — no corrupted characters visible (i18next falls back to EN)
- [ ] Switching back to EN: everything returns to English
- [ ] Language preference persists on page reload (localStorage `tide-lang` key)
- [ ] On ABL pages: resource rows stay in English; filter/button UI chrome translates
- [ ] GU translation file has no `..ç..ç..ä..` sequences in rendered output
- [ ] `npm run build` produces no TypeScript/JSX errors
- [ ] No missing key warnings in browser console for any of the three languages

---

## 11. Files Modified Summary

| File | Change type |
|------|-------------|
| `src/i18n/locales/en/translation.json` | Add ~80 new keys (§3) |
| `src/i18n/locales/hi/translation.json` | Mirror all new keys with HI translations |
| `src/i18n/locales/gu/translation.json` | Mirror all new keys; fix corruption (§7) |
| `content/shared/navigation.yaml` | Add `i18nKey` + `descKey` to all items |
| `content/shared/footer.yaml` | Add `i18nKey` to columns + links |
| `src/components/layout/Header.jsx` | `useTranslation`, translated labels, hide LanguageSwitcher on ABL |
| `src/components/layout/Footer.jsx` | `useTranslation`, translated labels, translated bottom bar |
| `src/pages/Home.jsx` | `useTranslation`, ~25 hardcoded strings + all data.* fields |
| `content/pages/home.yaml` | Add `id` field to each program item |
| `src/pages/about/WhyTide.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/about/OurTeam.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/about/OurPartners.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/about/OurResults.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/BlockETI.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/BetterED.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/EmpowerEd.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/CompletEd.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/SdgDrives.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/projects/OtherProjects.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/get-involved/Volunteer.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/get-involved/Donate.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/get-involved/WorkWithUs.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/get-involved/OrganizeMCCx.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/THRIvE.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/resources/SaralKadam.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/resources/AnnualReports.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/resources/Publications.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/Contact.jsx` | `useTranslation` + `t()` wrapping |
| `src/pages/resources/AblHome.jsx` | `useTranslation` + `t('abl.home.*')` |
| `src/pages/resources/AblResourceCenter.jsx` | `useTranslation` + `t('abl.resourceCenter.*')` |
| `src/pages/resources/AblDetail.jsx` | `useTranslation` + `t('abl.detail.*')` |
| `src/pages/resources/AblContribute.jsx` | `useTranslation` + `t('abl.contribute.*')` |
| `src/components/abl/ResourceCard.jsx` | `useTranslation` + `t('abl.resourceCard.*')` |
| `src/components/abl/ResourceFilters.jsx` | `useTranslation` + `t('abl.resourceCenter.*')` |
| `src/components/abl/Pagination.jsx` | `useTranslation` + `t('abl.pagination.*')` |
| `src/components/abl/AblNavBar.jsx` | `useTranslation` + `t('abl.nav.*')` |
| `src/components/ui/TodoPlaceholder.jsx` | `useTranslation` + `t('todo.*')` |

**Total: ~38 files** across 7 phases.

---

## 12. Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| YAML stays English-only | Avoids per-locale YAML duplication; all translatable content centralised in one directory |
| JSON values as EN fallback | `t('key', data.value)` means zero extra work for EN — it always renders; HI/GU can be added gradually |
| `id` field on array items | Allows `t('home.programs.${id}.title')` without positional indexing fragility |
| ABL routes hide language switcher | ABL content rows are English-only; showing a language switcher that only affects UI chrome would be misleading |
| `common.*` namespace | Prevents duplication of generic strings like "Loading...", "Retry", "Donate" across namespaces |
| Phase 1 is translation files only | Lets translations be prepared before any component is touched — reduces risk of rendering gaps |
| Inline EN fallback `t('key', 'English string')` | Decouples component from translation file completeness; missing keys never produce blank UI |
