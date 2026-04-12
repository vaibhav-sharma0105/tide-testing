# What's Next — Hardcoded UI Audit

> UI elements currently not covered by YAML/JSON, found during content audit on 2026-04-12.
> Ordered by priority.

---

## 🔴 Critical

### 1. SEO Meta Tags Never Applied
Every YAML file has `seoTitle` and `seoDescription` fields but no page renders a `<Helmet>` tag. The data exists — it just never reaches `<head>`.

**Fix:** Add `react-helmet-async` `<Helmet>` to each page component using `data.meta.seoTitle` and `data.meta.seoDescription`. The `HelmetProvider` is likely already in `main.jsx`.

**Affects:** All 19 pages.

---

### 2. "Click any image to view full screen." — Repeated Across 6 Pages
Identical hint text hardcoded in 6 separate JSX files. One wording change requires editing all 6.

**Files:**
- `src/pages/projects/BetterED.jsx`
- `src/pages/THRIvE.jsx`
- `src/pages/get-involved/Volunteer.jsx`
- `src/pages/resources/SaralKadam.jsx`
- `src/pages/projects/OtherProjects.jsx` (appears twice — Disha + MOI galleries)

**Fix:** Move to a shared constant or add a `hint` field in each relevant YAML section (e.g. `gallery.hint`). Or define once in a `src/constants/ui.js` file.

---

## 🟠 High

### 3. Header — Donate CTA Labels and Link Hardcoded
```jsx
// Desktop button
Donate

// Mobile button
Donate to TIDE

// Link target
/get-involved/donate
```
**File:** `src/components/layout/Header.jsx:182, 272`

**Fix:** Add to `content/shared/navigation.yaml`:
```yaml
donateCta:
  labelDesktop: "Donate"
  labelMobile: "Donate to TIDE"
  to: /get-involved/donate
```

---

### 4. Footer — Brand Text and Taglines Hardcoded
```jsx
"TIDE"                                          // logo wordmark
"Foundation"                                    // logo sub-wordmark
"Support our work"                              // donate CTA label
"© {year} TIDE Foundation. All rights reserved."
"Made with ❤️ for education in India"
```
**File:** `src/components/layout/Footer.jsx:41-42, 86, 112, 115`

**Fix:** Add to `content/shared/footer.yaml`:
```yaml
logoName: "TIDE"
logoSub: "Foundation"
donateCta: "Support our work"
copyright: "TIDE Foundation. All rights reserved."
madeWith: "Made with love for education in India"
```

---

### 5. Contact Page — Field Labels Hardcoded
The contact info *values* come from YAML correctly, but all surrounding UI labels are hardcoded:
```jsx
"Get in touch"        ← section h2
"Address"
"Phone"
"Email"
"Office Hours"
"Follow Us"
"Message from TIDE Website"   ← email subject line (also a support/ops concern)
```
**File:** `src/pages/Contact.jsx:24, 31, 40, 51, 60, 68, 97`

**Fix:** Add a `labels:` block to `content/pages/contact.yaml`:
```yaml
labels:
  heading: "Get in touch"
  address: "Address"
  phone: "Phone"
  email: "Email"
  officeHours: "Office Hours"
  followUs: "Follow Us"
  emailSubject: "Message from TIDE Website"
```

---

## 🟡 Medium

### 6. Publications — Type Labels and Link Text Hardcoded
```jsx
const typeLabel = { book: 'Book', article: 'Article', video: 'Video', talk: 'Talk', materials: 'Materials' }

{p.internal ? 'View resource' : 'Read more'}
```
**File:** `src/pages/resources/Publications.jsx`

**Fix:** Add to `content/pages/resources-publications.yaml`:
```yaml
typeLabels:
  book: "Book"
  article: "Article"
  video: "Video"
  talk: "Talk"
  materials: "Materials"
linkLabels:
  internal: "View resource"
  external: "Read more"
```

---

### 7. THRIvE — "Research" Badge on Project Cards Hardcoded
```jsx
Research   // badge shown on every research project card
```
**File:** `src/pages/THRIvE.jsx:145`

**Fix:** Add `badgeLabel` field to each item in `researchProjects.items` in `content/pages/thrive.yaml`, or add a single `researchProjects.cardBadge: "Research"` field.

---

### 8. "Hover over a photo…" Hints Hardcoded
Two variants, both hardcoded:
```jsx
// OurTeam.jsx
"Hover over a photo to read about each person."

// THRIvE.jsx
"Hover over a photo to see the role."
```
**Files:** `src/pages/about/OurTeam.jsx:91`, `src/pages/THRIvE.jsx:103`

**Fix:** Add a `hoverHint` field to the relevant YAML sections (e.g. `coreTeam.hoverHint`, `researchTeam.hoverHint`).

---

### 9. OrganizeMCCx — "Step" Prefix Hardcoded
```jsx
Step {i + 1}
```
**File:** `src/pages/get-involved/OrganizeMCCx.jsx:60`

Matters for future i18n — "Step" would need to be translated.

**Fix:** Add `steps.stepPrefix: "Step"` to `content/pages/get-involved-mccx.yaml`.

---

### 10. SaralKadam — Booklet Email Href Hardcoded on 14 Cards
The "Request Materials" button correctly uses `data.about.ctaHref`, but the 14 individual booklet cards still have the email hardcoded:
```jsx
href="mailto:info@tideinternational.org?subject=Saral Kadam Booklet Request"
```
**File:** `src/pages/resources/SaralKadam.jsx`

**Fix:** Add `booklets.bookletRequestHref` to `content/pages/resources-saral-kadam.yaml` and use it in the map.

---

## Quick Reference

| # | Item | File(s) | Priority |
|---|------|---------|----------|
| 1 | SEO `<Helmet>` tags never rendered | All 19 pages | 🔴 Critical |
| 2 | "Click any image…" hint (×6) | BetterED, THRIvE, Volunteer, SaralKadam, OtherProjects | 🔴 Critical |
| 3 | Header donate CTA label + link | Header.jsx | 🟠 High |
| 4 | Footer brand text + taglines | Footer.jsx | 🟠 High |
| 5 | Contact field labels | Contact.jsx | 🟠 High |
| 6 | Publications type labels + link text | Publications.jsx | 🟡 Medium |
| 7 | THRIvE "Research" badge | THRIvE.jsx | 🟡 Medium |
| 8 | Hover photo hints | OurTeam.jsx, THRIvE.jsx | 🟡 Medium |
| 9 | "Step N" prefix | OrganizeMCCx.jsx | 🟡 Medium |
| 10 | Booklet mailto href (×14) | SaralKadam.jsx | 🟡 Medium |
