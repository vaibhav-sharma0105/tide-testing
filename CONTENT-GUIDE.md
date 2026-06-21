# TIDE Website — Content Editing Guide

> **Who is this for?** Anyone who needs to update text, images, or links on the TIDE Foundation website — no coding knowledge required.

---

## How the System Works (Overview)

Content lives in simple **YAML files** inside the `content/` folder. YAML is a plain-text format that looks like a structured list. You edit YAML, save it to GitHub, and the live site updates **automatically** within a few minutes — there is no separate "publish" or "upload" step to remember.

```
content/
  pages/         ← one file per page (English)
  shared/        ← navigation and footer (English)
  locales/       ← Hindi and Gujarati translations (see "Translations" section below)
src/data/        ← auto-generated JSON (do not edit directly)
```

**The golden rule:** Only ever edit files in `content/`. Never edit files in `src/data/` — they are overwritten automatically.

**Two ways to make an edit — pick whichever fits you:**

| | No terminal, no installs | Terminal, with local preview |
|---|---|---|
| **Best for** | A quick text/link fix you want live fast | Bigger edits you want to see rendered before publishing |
| **Where you edit** | Directly on GitHub's website | Files on your own computer |
| **How it goes live** | Click GitHub's "Commit changes" button | `git push` after previewing locally |
| **Full steps** | "Path A" in each section below | "Path B" in each section below |

Both paths end the same way: a commit lands on the `main` branch, and GitHub Actions builds and deploys the site automatically. You never need to manually upload a `dist/` folder anywhere.

---

## Step-by-Step: Edit Content

### 1. Open the right file

Find the YAML file for the page you want to edit. Naming follows the URL:

| Page | File |
|------|------|
| Home | `content/pages/home.yaml` |
| Why TIDE? | `content/pages/about-why-tide.yaml` |
| Our Team | `content/pages/about-our-team.yaml` |
| Our Partners | `content/pages/about-our-partners.yaml` |
| Our Results | `content/pages/about-our-results.yaml` |
| Block ETI | `content/pages/projects-block-eti.yaml` |
| BetterED | `content/pages/projects-bettered.yaml` |
| EmpowerEd | `content/pages/projects-empowered.yaml` |
| CompletEd | `content/pages/projects-completed.yaml` |
| Other Projects | `content/pages/projects-other.yaml` |
| Volunteer | `content/pages/get-involved-volunteer.yaml` |
| Donate | `content/pages/get-involved-donate.yaml` |
| Work With Us | `content/pages/get-involved-work-with-us.yaml` |
| Organise MCCx | `content/pages/get-involved-mccx.yaml` |
| THRIvE | `content/pages/thrive.yaml` |
| Saral Kadam | `content/pages/resources-saral-kadam.yaml` |
| Annual Reports | `content/pages/resources-annual-reports.yaml` |
| Publications | `content/pages/resources-publications.yaml` |
| Contact | `content/pages/contact.yaml` |
| Navigation (all pages) | `content/shared/navigation.yaml` |
| Footer | `content/shared/footer.yaml` |

### 2. Edit the text

YAML uses a simple `key: value` format:

```yaml
title: Our Amazing Team
subtitle: The people who make it happen.
```

To change the title, just replace the text after the colon:

```yaml
title: Meet the TIDE Team
```

**Rules:**
- Keep the colons (`:`) in place
- Do not change the **key names** (the words before the colon) — only change the values
- If text contains a colon, wrap it in quotes: `title: "Education: A Path Forward"`
- Indentation (spaces) matters — keep it exactly as-is

### 3. Publish your change

#### Path A — No terminal, no installs (fastest for small edits)

1. Go to the repository on GitHub and open the file you need (use the table above to find it).
2. Click the **pencil icon** ("Edit this file") near the top right of the file view.
3. Make your change directly in the browser.
4. Scroll down to **"Commit changes"**, add a short description of what you changed, and click **Commit changes** (committing straight to `main` is fine for content edits).
5. That's it — no further steps. GitHub Actions builds and deploys the site automatically. Check the **Actions** tab if you want to watch it happen; it usually takes 1–2 minutes.

#### Path B — Terminal, with local preview first

Use this when you want to see the change rendered before it goes live, or you're editing several things at once.

1. Open a terminal in the project folder and run:
   ```bash
   npm run dev
   ```
   This automatically syncs your YAML into JSON and starts a local preview server.
2. Open `http://localhost:5173` in your browser to see your change rendered.
3. Happy with it? Save it to GitHub:
   ```bash
   git add content/
   git commit -m "Update [page name] content"
   git push
   ```
4. GitHub Actions takes it from there — builds and deploys automatically, usually within 1–2 minutes. No `npm run build` and no manual upload needed; that only happens inside GitHub's automation, not on your computer.

---

## Translations (Hindi & Gujarati)

The site shows English, Hindi, or Gujarati depending on what the visitor picks with the language switcher. **Editing a translation never touches the English content** — they're completely separate files, so a translator can't accidentally change the English text, and an English editor can't accidentally break a translation.

```
content/locales/
  hi/
    pages.yaml     ← Hindi translations for every page
    shared.yaml    ← Hindi translations for navigation/footer
  gu/
    pages.yaml     ← Gujarati translations for every page
    shared.yaml    ← Gujarati translations for navigation/footer
```

### How to find the right line to translate

Each translation file mirrors the *same* structure as the English content, just with translated values. For example, the Home page's hero tagline:

- English source: `content/pages/home.yaml` → `hero: { tagline: "..." }`
- Hindi translation: `content/locales/hi/pages.yaml` → `home: { hero: { tagline: "..." } }`
- Gujarati translation: `content/locales/gu/pages.yaml` → `home: { hero: { tagline: "..." } }`

The key names (`home`, `hero`, `tagline`) are always in English and must match exactly across all three files — only the *values* (the actual text) differ. If you're translating an existing page, the easiest approach is: open the English YAML file and the matching locale file side by side, and translate value-for-value, line-for-line.

### What happens if a translation is missing

If a Hindi or Gujarati value is ever missing for some text, that text simply falls back to showing the English version — visitors never see a broken or blank section. This means translation work can happen gradually, page by page, without anything ever looking unfinished in the meantime.

### Publishing a translation edit

Exactly the same as English content — use **Path A** (GitHub web UI) or **Path B** (terminal with local preview) from the section above. To preview a translation locally, switch the language using the switcher in the site's header after running `npm run dev`.

---

## Adding / Updating Images

All images live in `public/assets/images/`. They are organised by section:

```
public/assets/images/
  shared/                   ← logo, shared images
  home/                     ← homepage photos
  about-our-team/           ← team portrait photos
  about-our-partners/       ← partner logo files
  projects-bettered/        ← BetterED photos
  projects-empowered/       ← EmpowerEd photos
  projects-completed/       ← CompletEd photos
  resources-saral-kadam/    ← booklet cover images
  resources-saral-kadam-program/  ← programme photos
  resources-publications/   ← publication thumbnails
  get-involved-volunteer/   ← volunteer gallery
  thrive/                   ← THRIvE conference photos
  ...
```

### To replace an image

1. Copy your new image into the correct folder
2. Name it exactly the same as the old file (e.g. `photo-sarah.jpg`)
3. Done — no YAML edits needed if the filename is unchanged

### To add a new image

1. Copy the image into the correct folder
2. Open the relevant YAML file
3. Update the `photo:` or `src:` field to the new path:

```yaml
photo: /assets/images/about-our-team/new-photo-name.jpg
```

**Path format:** Always start with `/assets/images/` followed by the folder and filename.

---

## Common Editing Tasks

### Change page title or subtitle

In the YAML file, find the `meta:` section at the top:

```yaml
meta:
  title: Our Publications
  tagline: Research, insights, and ideas from the TIDE community.
```

Edit the values after the colon.

### Add a team member

In `content/pages/about-our-team.yaml`, find the `members:` list and add a new entry:

```yaml
members:
  - name: Jane Smith
    role: Programme Manager
    photo: /assets/images/about-our-team/jane-smith.jpg
  # Add new member here:
  - name: Raj Patel
    role: Research Associate
    photo: /assets/images/about-our-team/raj-patel.jpg
```

> **Important:** Keep the same indentation (two spaces before the dash `- `). Copy the format of an existing entry exactly.

### Add an annual report

In `content/pages/resources-annual-reports.yaml`, add to the `reports:` list:

```yaml
reports:
  - year: "2024–25"
    label: Annual Report
    photo: /assets/images/resources-annual-reports/2024-25-cover.jpg
    href: https://link-to-your-pdf.com
    highlight: true   # Set to true for "Latest" badge; false for others
    wide: false
```

Set `highlight: true` only for the most recent report. Set all others to `false`.

### Update contact information

Edit `content/pages/contact.yaml`:

```yaml
info:
  address: "8 Deepawali Centre (1st Floor), ..."
  phones:
    - "+91 99798 82648"
    - "+91 70410 94082"
  email: info@tideinternational.org
  officeHours: "Monday – Friday, 9:00 AM – 6:00 PM"
```

### Update navigation labels

Edit `content/shared/navigation.yaml`. Each item has a `label` and a `to` (URL path):

```yaml
items:
  - label: About Us
    children:
      - label: Why TIDE?
        to: /about/why-tide
        desc: Our story, vision & values
```

Change only the `label` and `desc` values. **Never change the `to:` paths** — those are URL routes that must match the app code.

---

## Validating Your Changes

If you're using Path B, you can check that all YAML files are valid before pushing:

```bash
npm run content:validate
```

This will:
- Report any YAML syntax errors (missing colons, bad indentation, etc.)
- Warn about any image paths in YAML that don't have matching files in `public/`

Fix any errors reported before pushing. (If you're using Path A — editing directly on GitHub — there's no equivalent check beforehand; if something's wrong, the GitHub Actions build will fail and you can see why in the **Actions** tab.)

---

## Full Workflow Summary

**Path A — no terminal:**
```
Edit a file on GitHub's website
        ↓
Click "Commit changes"
        ↓
GitHub Actions builds + deploys automatically (~1-2 min)
        ↓
Live on the site
```

**Path B — terminal, with local preview:**
```
Edit a YAML file in content/
        ↓
npm run dev          ← auto-syncs YAML → JSON, starts local preview
        ↓
Check http://localhost:5173 — looks good?
        ↓
git add, git commit, git push
        ↓
GitHub Actions builds + deploys automatically (~1-2 min)
        ↓
Live on the site
```

There is no manual build step and no manual upload, ever — `npm run build` only matters if you're a developer debugging a build issue locally. Publishing always happens through a commit reaching `main`, never by running `npm run build` yourself and moving files anywhere.

---

## First-Time Setup (for a new computer, Path B only)

You only need this if you're using Path B (terminal with local preview). Path A needs nothing installed at all.

1. Install [Node.js](https://nodejs.org/) (LTS version) and [Git](https://git-scm.com/downloads).
2. Clone the repository (one-time only):
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```
3. Install dependencies (one-time only):
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" error | Run `npm install` first |
| Changes not showing in local preview (Path B) | Run `npm run content:sync` then refresh |
| Committed a change but the live site looks the same after 5+ minutes | Check the repo's **Actions** tab — if the latest run shows a red ✕, click it to see what failed |
| YAML syntax error | Check for missing colons, wrong indentation, or unquoted colons in values |
| Image not showing | Check the path in YAML starts with `/assets/images/` and the file exists in `public/` |
| Build fails (Actions tab shows red ✕) | Run `npm run content:validate` locally to find the problem, fix it, and push again |

---

## What NOT to Edit

- Files in `src/data/` — auto-generated, overwritten on every sync
- Files in `src/pages/` or `src/components/` — these are the React components (code)
- Files in `dist/` — auto-generated build output

If you need to change layout, colours, or add new pages, that requires a developer.
