# What's Next — Open Items

> Last verified against the code: 2026-10-25. Everything under "Open items" was re-checked in the repository on that date; nothing is listed from memory. The "Archive" section further down is a finished 2026-04-12 audit, kept for history only.

## Open items

### Decisions waiting on the site owner

1. ~~Images left unused by the removed pages~~ — **done 2026-10-25:** the 97 unused files (about 21 MB) were deleted with the owner's approval; recover with `git checkout a4126d1 -- <path>`. The unused legacy downloader `scripts/download-images.mjs` was deleted on 2026-10-26 (recover with `git checkout a4126d1 -- scripts/download-images.mjs`).
2. **`intro.ctaHref` in `content/pages/get-involved-volunteer.yaml`** is the placeholder `https://docs.google.com/forms`, not a real application form. Owner said keep as is for now. The page is reachable from the About menu.

### Content and data issues

3. **Bare-filename images are not validated.** `npm run content:validate` checks only leading-slash values under a fixed key list, so a wrong name in `logoGallery.images` (a list of bare filenames in `content/pages/about-our-partners.yaml`) is not caught; a missing file shows the grey placeholder from `src/utils/imagePlaceholder.js`. The one nonexistent entry (`image-33-e1699293507264.png`) was removed on 2026-10-25.
4. **`content/pages/about-publications.yaml`:** `research.items` is empty (the page shows "Research publications will be listed here. Coming soon.") and 10 entries have `link: ""` (shown as "Coming soon").

### Resolved

- 2026-10-26: `GRADES` now lives once in `src/config/abl.js`; the dead `gradient` prop was removed from the 10 pages that passed it; `deploy.yml` now runs lint, `content:validate` and the unit tests before building; the thumbnail-sync workflow now starts the deploy itself (confirmed through the public Actions API that its June 2026 commits started no run).
- The 16 stranded routes: removed outright, no redirects (`src/test/routing/removedRoutes.test.jsx`); pages, YAML, generated JSON and `TodoPlaceholder` are gone.
- Unused code and assets (`Badge.jsx`, `WhatsAppIcon`, `src/App.css`, `src/assets/*`, 91 images, `getDriveDownloadUrl`, `public/icons.svg`, `public/favicon.svg`): deleted with the owner's approval on 2026-10-25.
- Devanagari/Gujarati fonts: owner decided to keep them.
- Contact email and lives-impacted figure: `tidefoundation@gmail.com` and `50,500+` everywhere, from `content/shared/site.yaml`, enforced by `npm run content:validate`.
- Multilingual framework: removed (archived in the local git tag `archive/multilingual-framework`).

---

# Archive: Hardcoded UI Audit (2026-04-12) — RESOLVED

> ## STATUS (2026-10-25): RESOLVED / SUPERSEDED — kept for history only
> Every item below was re-checked against the current code and is **done**; nothing here is still pending. The file and line references in the body are obsolete (the files have changed, and several of the pages named, such as the Saral Kadam, Publications and project pages, no longer exist), so do not use them to locate code. The `t()` wording in the original proposals no longer applies: the i18n layer has since been removed and pages read the generated JSON directly.
>
> | # | Item | Current state (verified) |
> |---|------|--------------------------|
> | 1 | SEO tags never applied | Done. A `SeoHead` component (react-helmet-async) is used by 27 page files; `ComingSoon` and `NotFound` use `Helmet` directly with `noindex`. The "19 pages" count is outdated. |
> | 2 | "Click any image…" hint x6 | Done. One shared string, `clickToZoom` in `content/shared/common.yaml`, read as `common.clickToZoom`. |
> | 3 | Header donate labels | Done. `donateLabel` / `donateMobileLabel` in `content/shared/navigation.yaml`. |
> | 4 | Footer brand text and taglines | Done. `brandName`, `brandSuffix`, `tagline`, `supportWork`, `rights`, `madeWithLove` come from `footer.json`. |
> | 5 | Contact labels and email subject | Done. Labels from `data.labels.*`; subject from `data.form.mailSubject` in `contact.yaml`. |
> | 6 | Publications type labels | Done. `data.typeLabels` in `resources-publications.yaml`, read in `Publications.jsx`. |
> | 7 | THRIvE "Research" badge | Done. `researchProjects.cardBadge` in `thrive.yaml`. |
> | 8 | "Hover over a photo" hints | Done. `common.hoverForBio` and `common.hoverForRole` in `common.yaml`. |
> | 9 | "Step N" prefix | Done. `common.step` in `common.yaml`. |
> | 10 | Saral Kadam booklet mailto | Done. `data.booklets.bookletRequestHref` in `resources-saral-kadam.yaml`. |
>
> **How this is guarded now:** `eslint.config.js` sets `react/jsx-no-literals` to `error` for `src/pages/**` and `src/components/**`, so bare visible text in JSX fails `npm run lint`. The rule ignores props (`ignoreProps: true`), so literal `aria-label`/`alt` text is not caught by it. `npm run lint` is also run by CI (`.github/workflows/deploy.yml`), so a violation stops the deploy. The `cms-integrity` skill (`.claude/skills/cms-integrity/SKILL.md`) is the other safeguard.

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
