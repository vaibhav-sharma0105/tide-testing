# TIDE Website — Content Editing Guide

> **Who is this for?** Anyone who needs to update text, images, or links on the TIDE Foundation website — no coding knowledge required.

---

## How the System Works (Overview)

Content lives in simple **YAML files** inside the `content/` folder. YAML is a plain-text format that looks like a structured list. You edit YAML, save it to GitHub, and the live site updates **automatically** within a few minutes — there is no separate "publish" or "upload" step to remember.

```
content/
  pages/         ← one file per page (text, links, image paths)
  shared/        ← text and facts shared across the whole site: navigation,
                   footer, loading messages, 404 / coming-soon / error screens,
                   short phrases (common.yaml), pop-up viewer labels (ui.yaml),
                   site-wide facts (site.yaml) and the llms.txt template
src/data/        ← auto-generated JSON (do not edit directly)
```

The site is in English only.

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

Find the YAML file for the page you want to edit. Naming follows the URL (`/about/our-team` → `about-our-team.yaml`).

**Pages** (the site has exactly these 16 pages; each has one file in `content/pages/`)

| Page | File |
|------|------|
| Home | `content/pages/home.yaml` |
| About → Why TIDE? | `content/pages/about-why-tide.yaml` |
| About → Past Programs | `content/pages/about-past-programs.yaml` |
| About → Our Team | `content/pages/about-our-team.yaml` |
| About → Our Partners | `content/pages/about-our-partners.yaml` |
| About → Our Publications | `content/pages/about-publications.yaml` |
| Education for Harmony | `content/pages/education-for-harmony.yaml` |
| Education for Harmony → Organise your MCCx | `content/pages/get-involved-mccx.yaml` |
| Pramaan → About Pramaan | `content/pages/abl-home.yaml` |
| Pramaan → Resource Centre (the list and filters) | `content/pages/abl-resource-center.yaml` |
| Pramaan → a single resource's page | `content/pages/abl-detail.yaml` |
| Pramaan → Contribute | `content/pages/abl-contribute.yaml` |
| THRIvE Research Centre | `content/pages/thrive.yaml` |
| Contact Us | `content/pages/contact.yaml` |
| Volunteer (reached from the About menu) | `content/pages/get-involved-volunteer.yaml` |
| Donate (the Donate button) | `content/pages/get-involved-donate.yaml` |

A web address that is not one of the pages above shows the "page not found" screen (see `content/shared/not-found.yaml` below).

**Text shared across the whole site** (`content/shared/`)

| What it controls | File |
|------|------|
| Header menu labels, Donate button, "Skip to main content" link, logo text | `content/shared/navigation.yaml` |
| Footer: tagline, copyright line, the three link columns (About, Get Involved, Resources) | `content/shared/footer.yaml` |
| Short phrases reused on several pages ("Click any image to view full screen.", "Hover over a photo to see the role.", "Hover over a photo to read about each person.", the word "Step") | `content/shared/common.yaml` |
| Labels of the full-screen photo viewer (Close / Previous / Next buttons, "Image viewer", "Go to image {n}") | `content/shared/ui.yaml` |
| Messages shown while a page is loading | `content/shared/loader.yaml` |
| The "page not found" page | `content/shared/not-found.yaml` |
| The "Coming Soon" page (`/coming-soon`) | `content/shared/coming-soon.yaml` |
| The "Something went wrong" screen visitors see if a page crashes | `content/shared/error.yaml` |
| Site-wide facts: organisation name, web address, logo, the grey fallback picture (`placeholderImage`), contact e-mail, lives-impacted figure, founding year, search-engine description, the parent names in page breadcrumbs | `content/shared/site.yaml` |
| The summary text written for AI assistants, served at `/llms.txt` | `content/shared/llms.txt` |

### What a Pramaan editor can change

The Pramaan screens are fully editable from YAML. The **resources themselves** (name, description, grades, photos, videos…) do **not** come from YAML — they come live from the Google Sheet, so edit those in the Sheet. Everything *around* them is in YAML:

- `abl-home.yaml` — the "About Pramaan" page: heading, the three-tab bar (`nav:`), the statistics labels, the "What is Activity-Based Learning?" text, the list of "Why ABL works" points, and the error messages.
- `abl-resource-center.yaml` — the Resource Centre page: heading and search-result title (`meta:`), the Filters button and result counts (`page:`), every filter label (`filters:`), the "no results" and "try again" messages (`grid:`), the pagination bar (`pagination:`), the wording on each resource card (`card:`) and the image/video pop-up fallbacks (`lightbox:`).
- `abl-detail.yaml` — a single resource's page: browser-tab title and description wording (`meta:`), the "Resource Not Found" page (`notFound:`), the "Back to Resource Center" link, the button and section labels (`media:`, `facts:`, `coverage:`).
- `abl-contribute.yaml` — the Contribute page text and its three steps.

> **Placeholders in `{curly braces}`.** Some Pramaan and shared phrases contain a word in curly braces, for example `"Grade {n}"`, `"View {name}"`, `"{name} — TIDE Pramaan"` or `"Visit TIDE on {platform}"`. The website fills these in automatically (the grade number, the resource name, …). You can reword the text around them, but **keep the `{word}` exactly as written** — if you delete or misspell it, the site will show the raw `{word}` or leave a gap.

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

1. Go to the repository on GitHub and open the file you need (use the tables above to find it).
2. Click the **pencil icon** ("Edit this file") near the top right of the file view.
3. Make your change directly in the browser.
4. Scroll down to **"Commit changes"**, add a short description of what you changed, and click **Commit changes** (committing straight to `main` is fine for content edits).
5. That's it — no further steps. GitHub Actions builds and deploys the site automatically. Check the **Actions** tab if you want to watch it happen; it usually takes a few minutes.

#### Path B — Terminal, with local preview first

Use this when you want to see the change rendered before it goes live, or you're editing several things at once.

1. Open a terminal in the project folder and run:
   ```bash
   npm run dev
   ```
   This automatically syncs your YAML into JSON and starts a local preview server.
2. Open `http://localhost:5173` in your browser to see your change rendered. (If that port is busy, the terminal prints the address it picked instead.)
3. Happy with it? Save it to GitHub:
   ```bash
   git add content/
   git commit -m "Update [page name] content"
   git push
   ```
   Running `npm run dev` also rewrites files in `src/data/`. You don't need to add those — the live build regenerates them from your YAML.
4. GitHub Actions takes it from there — builds and deploys automatically. No `npm run build` and no manual upload needed; that only happens inside GitHub's automation, not on your computer.

---

## Adding / Updating Images

All images live in `public/assets/images/`. They are organised by section:

```
public/assets/images/
  shared/                   ← logo, the page-banner background and placeholder.svg
                              (the grey fallback picture, see below)
  home/                     ← homepage photos
  about-our-team/           ← team portrait photos
  about-our-partners/       ← partner logo files
  get-involved-volunteer/   ← volunteer gallery
  projects-mcc/             ← photos on the Organise your MCCx page
  projects-bettered/        ← two of these are used on the homepage
  thrive/, thrive-happiness/      ← THRIvE photos
  abl/                      ← DO NOT TOUCH: Pramaan thumbnails, filled in
                              automatically from the Google Sheet
```

Other folders may exist in `public/assets/images/` (names starting `projects-` or `resources-`). They are left over from pages that were removed from the site, and no page uses them. See `WHATS-NEXT.md`.

### If an image is missing

If a picture's file is missing or its name is mistyped, the website no longer shows a broken-image icon. It shows a plain grey placeholder picture instead (set by `placeholderImage` in `content/shared/site.yaml`; the file is `public/assets/images/shared/placeholder.svg`). This keeps the page tidy, but it is a **sign that something needs fixing**: check the filename in the YAML against the file in the folder, including capital letters, and correct it. (The Pramaan resource thumbnails are the exception: they draw their own icon when a picture fails.)

### To replace an image

1. Copy your new image into the correct folder
2. Name it exactly the same as the old file (e.g. `photo-sarah.jpg`), including capital letters
3. Done — no YAML edits needed if the filename is unchanged

### To add a new image

1. Copy the image into the correct folder
2. Open the relevant YAML file
3. Update the `photo:` or `src:` field to the new path:

```yaml
photo: /assets/images/about-our-team/new-photo-name.jpg
```

**Path format:** Always start with `/assets/images/` followed by the folder and filename.

Photo captions (the `label:` or `alt:` line next to an image) are read aloud by screen readers for people who cannot see the picture — write a short description of what the photo shows.

---

## Common Editing Tasks

### Change page title or subtitle

In the YAML file, find the `meta:` section at the top:

```yaml
meta:
  badge: About Us · Publications
  title: Our Publications
  tagline: Annual reports, public event recordings, and research.
  seoTitle: Publications — TIDE Foundation
  seoDescription: Access TIDE Foundation's annual reports and research publications.
```

Edit the values after the colon. The subtitle line is called `tagline` on some pages and `subtitle` on others. `seoTitle` and `seoDescription` are what Google and the browser tab show, not the on-page heading.

### Add a team member

In `content/pages/about-our-team.yaml`, the leadership list is under `coreTeam:` → `members:`, and the advisors are under `advisoryBoard:` → `members:`. Add a new entry to the right list:

```yaml
coreTeam:
  members:
    - name: Jane Smith
      suffix: PhD, Example University   # optional; write null if none
      role: Programme Manager
      bio: A one- or two-sentence description shown when hovering the photo.
      photo: /assets/images/about-our-team/jane-smith.jpg
    # Add new member here, copying the lines above
```

Advisors use `name`, `role` and `photo` only (no `suffix` or `bio`).

> **Important:** Keep the same indentation (spaces before the dash `- `). Copy the format of an existing entry exactly.

### Add an annual report

The live site lists annual reports on the **Our Publications** page, in `content/pages/about-publications.yaml`, under `annualReports:` → `items:`:

```yaml
annualReports:
  items:
    - year: "2024–25"
      title: "TIDE Foundation Annual Report 2024–25"
      link: https://link-to-your-pdf.com
```

(Leave `link: ""` for a report whose PDF is not ready yet.)

### Update contact information

The address, phone numbers and office hours are in `content/pages/contact.yaml`:

```yaml
info:
  address: "8 Deepawali Centre (1st Floor), ..."
  phones:
    - "+91 99798 82648"
    - "+91 70410 94082"
  email: "tidefoundation@gmail.com"
  officeHours: "Monday – Friday, 9:00 AM – 6:00 PM"
```

The footer reads its email and first phone number from this same file, so those update together.

**The email address is special** — it must be the same on every page. Read "Site-wide facts" just below before changing it.

### Site-wide facts: email address and lives-impacted figure

A few facts appear in many places: in page text, in the footer, in the information search engines and AI assistants read, and in the `/llms.txt` summary. They are kept in one master file, `content/shared/site.yaml`:

```yaml
name: "TIDE Foundation"
url: "https://tideinternational.org"
email: "tidefoundation@gmail.com"
livesImpacted: "50,500+"
gradeRange: "1–5"      # grades the Pramaan library covers; pages write {gradeRange}
foundingYear: "2014"
```

(The same file also holds the logo, location, search-engine description and keywords, and the parent names used in page breadcrumbs.) Anything you change in `site.yaml` flows automatically into the search-engine information in the page header and into `/llms.txt`.

**Rule: the email address and the lives-impacted figure must be the same everywhere.** The decided values today are `tidefoundation@gmail.com` and `50,500+`. If you ever need to change one:

1. Change it in `content/shared/site.yaml`.
2. Change it in **every page that states it** (for example the Contact, Donate and Home pages, the loading messages in `loader.yaml`, and the `llms.txt` template).
3. Run `npm run content:validate` (see "Validating Your Changes"). It lists every file that still has the old value — fix those until it reports no errors.

If you are editing on GitHub without a terminal (Path A), ask a developer to run the check for you.

### What a breadcrumb name is

Search engines show a small trail like "Home › About Us › Our Team" for each page. The last step of the trail is the page's own name, taken from `breadcrumbName` at the top of that page's YAML file:

```yaml
meta:
  breadcrumbName: "Our Team"
  badge: "About Us"
```

Change `breadcrumbName` only if the page itself is renamed. The earlier steps ("Home", "About Us", "Pramaan", …) live in `content/shared/site.yaml` under `breadcrumbs:`. This text is not shown on the page itself — only to search engines.

### The llms.txt summary for AI assistants

`/llms.txt` is a short plain-text summary of TIDE that AI assistants read. Edit its template, `content/shared/llms.txt`. It is ordinary text with a few fill-in words in double curly braces that the website replaces from `site.yaml`:

`{{name}}`  `{{url}}`  `{{email}}`  `{{livesImpacted}}`  `{{gradeRange}}`  `{{foundingYear}}`

Keep those words exactly as written (an unknown word in double braces stops the build). The list of pages in this file is typed by hand — if a page is added or removed, update the list. Do not create a `public/llms.txt` file; the website builds `/llms.txt` itself.

### Change the "Something went wrong" screen

If something unexpected breaks while a page is loading, visitors see a friendly screen instead of a blank page. Its words are in `content/shared/error.yaml`: `heading`, `body`, and the two button labels `reloadLabel` and `homeLabel`. Keep the wording short and calm.

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

Change only the `label` and `desc` values. **Never change the `to:` paths** — those are URL routes that must match the app code. (The same applies to the `to:` lines in `footer.yaml` and the `ctaHref` / `secondaryHref` lines in `not-found.yaml` and `ctaHref` in `coming-soon.yaml`.)

The footer has three link columns — About, Get Involved and Resources — in `content/shared/footer.yaml`. Each column is a `title` and a list of links, each with a `label` and a `to`:

```yaml
columns:
  - title: "About"
    links:
      - label: "Why TIDE?"
        to: "/about/why-tide"
```

Change a link's wording by editing its `label`. Only point a `to:` at a page that exists, and ask a developer before adding or removing a link.

---

## Validating Your Changes

If you're using Path B, you can check your content before pushing:

```bash
npm run content:validate
```

This will:
- **Stop with an error** if a YAML file has a syntax mistake (missing colons, bad indentation, etc.) — these must be fixed
- **Stop with an error** if any email address in `content/` (including the `llms.txt` template) is different from the one in `content/shared/site.yaml`, or if a lives-impacted total such as `40,000+` (a number sitting in a sentence about lives, people or impact) is different from `livesImpacted` in `site.yaml`. The message names the file and the field to fix
- **Warn** when an image path written as `/assets/images/...` under a field named `photo`, `src`, `logo`, `image`, `poster`, `img`, `coverImage`, `heroPhoto`, `mainPhoto`, `diagramPhoto`, `backgroundImage` or `donorPoster` points to a file that is not in `public/`

It is a helper, not a guarantee: it does not check other image field names, links, or images written **without** a leading slash. In particular, the partner logos on the Our Partners page are a list of bare file names (`logoGallery.images:` in `about-our-partners.yaml`; the page adds the folder itself), so a misspelled or missing name there is not caught. A missing file shows the grey placeholder instead of the logo. Always look at the page in the preview too.

If you're using Path A — editing directly on GitHub — there's no check beforehand, and the live build does not run this check either. The live build only stops for **YAML syntax errors** (the **Actions** tab will show a red ✕); a wrong image path, a mismatched email or a misspelled key does *not* stop the build. It just shows up as a missing picture, an inconsistent figure or missing text on the page.

---

## Full Workflow Summary

**Path A — no terminal:**
```
Edit a file on GitHub's website
        ↓
Click "Commit changes"
        ↓
GitHub Actions builds + deploys automatically (a few minutes)
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
git add content/, git commit, git push
        ↓
GitHub Actions builds + deploys automatically (a few minutes)
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
| A grey placeholder picture appears instead of a photo | The image file is missing or its name is mistyped. Check the path in YAML starts with `/assets/images/`, the file exists in `public/`, and the spelling and capital letters match exactly |
| Text shows `{n}`, `{name}` or similar curly-brace words | A `{placeholder}` was edited or deleted — put it back exactly as written (see "What a Pramaan editor can change") |
| `content:validate` says an email or a lives figure "differs from site.yaml" | Make that file match `content/shared/site.yaml`, or change `site.yaml` and every other file that states it (see "Site-wide facts") |
| Build fails (Actions tab shows red ✕) | Run `npm run content:validate` locally to find the problem, fix it, and push again |

---

## What NOT to Edit

- Files in `src/data/` — auto-generated, overwritten on every sync
- Files in `src/pages/` or `src/components/` — these are the React components (code)
- Files in `dist/` — auto-generated build output
- The `public/assets/images/abl/` folder — filled in automatically from the Pramaan Google Sheet

If you need to change layout, colours, or add new pages, that requires a developer. Everything else a visitor or search engine reads — including the search-engine "structured data" and page breadcrumbs — comes from YAML (`site.yaml` and each page's `breadcrumbName`).
