# TIDE Website — Content Editing Guide

> **Who is this for?** Anyone who needs to update text, images, or links on the TIDE Foundation website — no coding knowledge required.

---

## How the System Works (Overview)

Content lives in simple **YAML files** inside the `content/` folder. YAML is a plain-text format that looks like a structured list. You edit YAML → run one command → the site updates.

```
content/
  pages/         ← one file per page
  shared/        ← navigation and footer
src/data/        ← auto-generated JSON (do not edit directly)
```

**The golden rule:** Only ever edit files in `content/`. Never edit files in `src/data/` — they are overwritten automatically.

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

Open the file in any text editor (Notepad, VS Code, etc.). YAML uses a simple `key: value` format:

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

### 3. Sync and preview

After editing, open a terminal in the project folder and run:

```bash
npm run content:sync
```

This converts your YAML changes into the JSON files the site reads. Then:

```bash
npm run dev
```

Open your browser to `http://localhost:5173` to preview the changes.

### 4. Build and deploy

When you're happy with the changes:

```bash
npm run build
```

This creates a `dist/` folder. Upload its contents to your hosting provider (Netlify, Vercel, GitHub Pages, etc.).

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

Before building, you can check that all YAML files are valid:

```bash
npm run content:validate
```

This will:
- Report any YAML syntax errors (missing colons, bad indentation, etc.)
- Warn about any image paths in YAML that don't have matching files in `public/`

Fix any errors reported before building.

---

## Full Workflow Summary

```
Edit a YAML file in content/
        ↓
npm run content:sync      ← converts YAML → JSON
        ↓
npm run dev               ← preview in browser (http://localhost:5173)
        ↓
Looks good? →
        ↓
npm run build             ← creates dist/ folder
        ↓
Upload dist/ to hosting
```

Or just use `npm run dev` directly — it runs the sync automatically before starting.

---

## First-Time Setup (for a new computer)

1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Open a terminal and navigate to the project folder:
   ```bash
   cd path/to/tide-new
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
| Changes not showing | Run `npm run content:sync` then refresh |
| YAML syntax error | Check for missing colons, wrong indentation, or unquoted colons in values |
| Image not showing | Check the path in YAML starts with `/assets/images/` and the file exists in `public/` |
| Build fails | Run `npm run content:validate` to find the problem |

---

## What NOT to Edit

- Files in `src/data/` — auto-generated, overwritten on every sync
- Files in `src/pages/` or `src/components/` — these are the React components (code)
- Files in `dist/` — auto-generated build output

If you need to change layout, colours, or add new pages, that requires a developer.
