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

**Pages** (the site has exactly these 17 pages; each has one file in `content/pages/`)

| Page | File |
|------|------|
| Home | `content/pages/home.yaml` |
| About → Why TIDE? | `content/pages/about-why-tide.yaml` |
| About → Past Programs | `content/pages/about-past-programs.yaml` |
| About → Our Team | `content/pages/about-our-team.yaml` |
| About → Our Partners (the text around the partner sliders — the partners themselves come from the Sheet, see below) | `content/pages/about-our-partners.yaml` |
| About → Our Publications → TIDE Publications (`/tide/publications`; the text around the list — the publications themselves come from the Sheet, see below) | `content/pages/tide-publications.yaml` |
| Education for Harmony | `content/pages/education-for-harmony.yaml` |
| Education for Harmony → Organise your MCCx | `content/pages/get-involved-mccx.yaml` |
| Education for Harmony → Past SCF (Social Changemakers; reached only from the Education for Harmony page; the profiles come from the fellowship completion Sheet) | `content/pages/social-changemakers.yaml` |
| Pramaan → About Pramaan | `content/pages/abl-home.yaml` |
| Pramaan → Resource Centre (the list, filters, and each resource's page) | `content/pages/pramaan-library.yaml` |
| Pramaan → Contribute (incl. the form link `formUrl`) | `content/pages/abl-contribute.yaml` |
| THRIvE Research Centre (leaders, research associates with `role` + optional `suffix`, the four research areas) | `content/pages/thrive.yaml` |
| THRIvE Research Centre → THRIvE Publications (`/thrive/publications`; the text around the list) | `content/pages/thrive-publications.yaml` |
| Contact Us | `content/pages/contact.yaml` |
| Volunteer (the "Get Involved" item in the About menu) | `content/pages/get-involved-volunteer.yaml` |
| Donate (the Donate button) | `content/pages/get-involved-donate.yaml` |

A web address that is not one of the pages above shows the "page not found" screen (see `content/shared/not-found.yaml` below).

**Text shared across the whole site** (`content/shared/`)

| What it controls | File |
|------|------|
| Header menu labels, Donate button, "Skip to main content" link, logo text | `content/shared/navigation.yaml` |
| Footer: tagline (byline under the logo), copyright line, Donate button label, social links | `content/shared/footer.yaml` |
| Short phrases reused on several pages (the word "Step" and the "View {name} on LinkedIn (opens in a new tab)" label) | `content/shared/common.yaml` |
| Labels of the full-screen photo viewer (Close / Previous / Next buttons, "Image viewer", "Go to image {n}") and the Pramaan photo/video viewers (`mediaLightbox:`) | `content/shared/ui.yaml` |
| Messages shown while a page is loading | `content/shared/loader.yaml` |
| The "page not found" page | `content/shared/not-found.yaml` |
| The "Coming Soon" page (`/coming-soon`) | `content/shared/coming-soon.yaml` |
| The "Something went wrong" screen visitors see if a page crashes | `content/shared/error.yaml` |
| Site-wide facts: organisation name, web address, logo, the grey fallback picture (`placeholderImage`), contact e-mail, lives-impacted figure, founding year, search-engine description, the parent names in page breadcrumbs | `content/shared/site.yaml` |
| The summary text written for AI assistants, served at `/llms.txt` | `content/shared/llms.txt` |

### What a Pramaan editor can change

The Pramaan screens are fully editable from YAML. The **resources themselves** (name, description, grades, photos, videos…) do **not** come from YAML — they come from the Google Sheet "Contributing to Pramaan; Educators' Resource Bank (Responses)", copied into the website automatically within minutes of an edit, so edit those in the Sheet. Everything *around* them is in YAML:

- `home.yaml` — the homepage: the banner (`hero:` — badge, headline and its highlighted words, the line under it, the two buttons, the labels of the figures strip and the `pills` figures; the lives figure and the founding year come from `site.yaml`), `mission:`, `programs:` (the three approach cards), `journey:` (the phases — the last one is shown as a plan), `partners:` (the "In good company" block: title, the "{n} … work with us" line and the link to the Partners page; it appears only once the Partners Sheet has published logos) and `cta:` (the closing invitation).
- `abl-home.yaml` — the "About Pramaan" page: heading, the three-tab bar shown on every Pramaan page (`nav:`), the statistics labels (the resource and type counts are counted from the Sheet; the grade range is `gradeRange` in `site.yaml`), the reach figures (`about.reach`, keep them in step with the text and the video poster), the "What is Activity-Based Learning?" text, the list of "Why ABL works" points, and the name of each resource type (`resourceTypes.labels:`).
- `pramaan-library.yaml` — the Resource Centre: page title and search-result title (`meta:`), the Filters button and result counts (`page:`), every filter and sort label (`filters:`, `sort:`), the "no results" message (`grid:`), the wording on each resource card (`card:`), a single resource's page (`detail:` — browser-tab title, "Back to Resource Center", "Resource Not Found", section labels) and the page-number bar (`pagination:`). Rules for the Sheet itself: `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`.
- `abl-contribute.yaml` — the Contribute page text, its three steps, the heading above the form button, and the **form's web address** (`formUrl:`). Step by step: `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md`.
- The labels of the full-screen photo and video viewers ("Close preview", "Close video"…) are in `content/shared/ui.yaml` (`mediaLightbox:`).

### What a Publications editor can change

Two pages list publications: **TIDE Publications** (`/tide/publications`) and **THRIvE Publications**
(`/thrive/publications`). The **publications themselves** (title, date, type, description, link, thumbnail,
and for THRIvE the APA reference and field of work) do **not** come from YAML — they come from the Google
Sheet "TIDE THRIvE Publications (Responses)", which the publications Google Form fills. Add a publication by
submitting the Form (answer **TIDE** or **THRIvE** to choose the page); correct one by editing its row in the
Sheet. Changes are copied into the website automatically within minutes (live since 2026-11-20; setup:
`docs/PUBLICATIONS-SETUP-GUIDE.md`). A page with no publications shows the
"No publications published yet" message.

> **Every Form answer goes live** — there is no approval step. To take a publication off the website without
> deleting it, add a column headed `Hide from website` to the Sheet and type `Yes` in that row.

Everything *around* the publications is in YAML. The two pages look different, so their files have
different sections:

- Both files: page title, badge and subtitle (`meta:`, including the "No publications published yet" message
  and the breadcrumb name), the line of figures under the title (`stats:` — "{n} publications",
  "{n} types", "since {year}"; the numbers are counted from the Sheet), the "New" badge text (`newBadge:`),
  and the numbered-page buttons (`pagination:` — "Previous", "Next", "Page {n}").
- `tide-publications.yaml` (TIDE) — the page shows the latest annual report large, then one list of every
  TIDE publication (annual reports included) with a search box and Type / Year filters:
  - `featuredType:` — which "Type of material" gets the large card. Write it exactly as in the
    Sheet (capital letters don't matter); today `"Annual report"`. If no publication has that type, the large
    card is simply not shown. The "latest" report is the one whose title names the latest
    period (e.g. "2024-25"); without a period in the title, its date counts.
  - `featured:` (the small heading above the large card, its button text, and `seeAllTemplate` — "See all {n}
    editions", which shows only that type in the list below), `library:` (the list's heading, intro and the
    "Open" link text), `toolbar:` (the search box and the "Type of material" and "Year" filters at the
    list — their lists and counts come from the Sheet, so a new type or year appears on its own) and `results:`
    (the count line above the list and the "no results" message).
- `thrive-publications.yaml` (THRIvE) — a list grouped by year, 12 per page, with search and
  filters; each publication shows its image, its APA reference and a short summary:
  - `source:` (THRIvE only) — `label` (the "Source" tooltip), the words shown for DOI and Google Drive links
    (`doi`, `driveFile`, `driveFolder`), and `names`: a list of web addresses with the name to show instead
    (e.g. `tandfonline.com: "Taylor & Francis Online"`); an address not listed shows as it is.
  - `socialProofTypes:` — a list of "Type of material" names (exactly as in the Sheet; capital letters don't
    matter) counted in the extra figure under the title, `stats.socialProofTemplate` ("{n} pieces by others
    citing or featuring our work"). That figure is hidden when no publication has one of these types. Today:
    "Published by others (TIDE acknowledged)" and "Mass media coverage".
  - `chart:` (the chart's title, hint and the label read for each bar), `toolbar:` (search box, "Type of
    material", "Field of work" and "Year" lists, newest/oldest button, "Clear all"), `results:` (the count
    line, "Showing {from}–{to} of {total} …" when there are several pages, the "no results" message, the
    heading for undated publications and the "continued" label when a year carries on from the previous
    page), `entry:` (the "Read", "Copy citation" and "Show more/less" wording, and the small headings "APA reference" and
    "About this work" on each publication). `chart:` is only used if the year chart is switched back on.
- **Not in YAML:** how many items show before a page or a button appears (THRIvE 12 per page; TIDE 12
  cards per page), how long "New" lasts
  (120 days), whether a page has the year chart, and which icon each type gets. These are set in code
  (`src/config/publications.js`) — ask a developer to change them.
- Both files also have `a11y:` — text read out by screen readers only (not visible on the page).
- Rules for the Sheet itself: `docs/PUBLICATIONS-SHEET-SCHEMA.md`.
- The menu entries (About Us → Our Publications → TIDE / THRIvE Publications, and THRIvE Research Centre →
  THRIvE Publications) are in `content/shared/navigation.yaml` (see "Update navigation labels").

### What a Partners editor can change

The **Our Partners** page (`/about/our-partners`) shows one slider per type of partner. The **partners
themselves** (type, priority, name, website and logo) do **not** come from YAML — they come from the Google
Sheet "TIDE/THRIvE Partners (Responses)", which the partners Google Form fills. Add a partner by submitting the
Form; correct one by editing its row in the Sheet (for example change its Priority to move it within its
slider). Once the connection is set up (`docs/PARTNERS-SETUP-GUIDE.md`; not yet on 2026-11-21), changes reach
the website within minutes. Until then, the page shows the "being updated" message.

> **Every Form answer goes live** — there is no approval step. To take a partner off the website without
> deleting it, add a column headed `Hide from website` to the Sheet and type `Yes` in that row.

- Order: sections A→Z with "Others" last; inside each, Extremely high → High → Medium → Low, then A→Z by name.
  These rules and the slider speed are set in code (`src/config/partners.js`) — ask a developer to change them.
- `about-our-partners.yaml`: page title, badge, subtitle and breadcrumb name (`meta:`), the figures under the
  title (`meta.stats`: "{n} partners", "{n} types of partnership" and their one-item versions), `directory:` —
  the label of the row of section links, the search box, the "no match" and "being updated" messages, the
  "{count} partners" line under each heading, the "1–5 of 23" position between the arrows (`slider.position`),
  the slider button labels and the phone search buttons (`searchOpen` / `searchClose`) read by screen readers — and `cta:`,
  the band at the bottom (title, subtitle, two buttons, each a `label` and a `to` page path starting with `/`).
- A partner whose logo is missing, or who shares one picture with two or more others (such as a "No Logo
  Available" image), is shown with the initials of its name. Upload a real logo in the Sheet to replace them.
- Rules for the Sheet itself: `docs/PARTNERS-SHEET-SCHEMA.md`.

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
  get-involved-volunteer/   ← volunteer gallery
  projects-mcc/             ← photos on the Organise your MCCx page
  projects-bettered/        ← two of these are used on the homepage; gallery-04 is also the photo for THRIvE research area 01
  thrive/                   ← THRIvE team portraits and research-area photos
  education-for-harmony/    ← the CARES framework diagram on the Education for Harmony page
  thrive-happiness/         ← no longer used on the page (the Conferences section was removed)
  pramaan-library/          ← DO NOT TOUCH: Pramaan Resource Centre photos, filled in
                              automatically from the Google Sheet
```

The `projects-` folder names are left over from older page names; the two `projects-` folders above are still used.

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
  subtitle: Annual reports, public event recordings, and research from a decade of work.
  seoTitle: Publications — TIDE Foundation
  seoDescription: Access TIDE Foundation's annual reports, public event recordings, and research publications.
```

Edit the values after the colon. The subtitle line is called `tagline` on some pages and `subtitle` on others. `seoTitle` and `seoDescription` are what Google and the browser tab show, not the on-page heading.

### Update the THRIvE page (team and research areas)

Everything on `/thrive` is in `content/pages/thrive.yaml`:

```yaml
leaders:                      # the "Our team" co-directors (large portraits)
  members:
    - name: "Dr. Jane Smith"
      role: "Co-Director"
      suffix: "PhD, Example University"        # optional smaller line (qualifications)
      photo: "/assets/images/thrive/team-jane-smith.jpg"   # null shows initials
      linkedin: "https://www.linkedin.com/in/jane-smith/"  # optional; whole portrait links
researchTeam:                 # the Research Associates (same fields, shown in this order)
researchAreas:                # the four numbered areas
  items:
    - title: "..."
      overview: "..."         # the short line under the title
      photo: "/assets/images/projects-bettered/gallery-04.jpg"
      paragraphs:             # the write-up; the first is highlighted
        - "..."
        - "..."
```

The area photos are shown at about 16:10, so use landscape pictures. The "Research team" and "Our team" headings: `leaders.sectionTitle` is visible; `researchTeam.sectionBadge` is read aloud by screen readers but not shown.

### Add a team member

In `content/pages/about-our-team.yaml`, the leadership list is under `coreTeam:` → `members:`, and the advisors are under `advisoryBoard:` → `members:`. Add a new entry to the right list:

```yaml
coreTeam:
  members:
    - name: Jane Smith
      suffix: PhD, Example University   # optional; write null if none
      role: Programme Manager
      bio: A one- or two-sentence description shown under the photo.
      photo: /assets/images/about-our-team/jane-smith.jpg   # square, 600px or more, face centred with headroom
      linkedin: "https://www.linkedin.com/in/jane-smith/"   # clicking the tile opens this; use "" for no link
    # Add new member here, copying the lines above
```

Advisors use `name`, `role`, `photo` and `linkedin` only (no `suffix` or `bio`). The "More details" PDF button is `advisoryBoard.moreDetails`.

> **Important:** Keep the same indentation (spaces before the dash `- `). Copy the format of an existing entry exactly.

### Add an annual report (or any publication)

Annual reports, research and other publications are no longer typed into YAML. Submit the publications
Google Form (answer **TIDE** for the TIDE Publications page, **THRIvE** for THRIvE Publications), or edit the
Sheet "TIDE THRIvE Publications (Responses)". See "What a Publications editor can change" above.

### Update contact information

The address, phone numbers and office hours are in `content/pages/contact.yaml`:

```yaml
info:
  address: "TIDE Foundation, 2nd floor of BCM corporation, ..."
  phones:
    - "+91 99798 82648"
    - "+91 70410 94082"
  email: "tidefoundation@gmail.com"
  officeHours: "Monday – Saturday"
  officeTimes: "9:00 AM – 6:00 PM"
```

The footer reads its email and first phone number from this same file, so those update together.

The **map** on the Contact page is controlled by the `map:` block of the same file:

```yaml
map:
  eyebrow: "Find us"
  title: "Visit us in Navrangpura, Ahmedabad"
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=BCM+Corporation%2C+Navrangpura%2C+Ahmedabad%2C+Gujarat+380009"
  mapsLabel: "Open in Google Maps"
  embedQuery: "BCM Corporation, Navrangpura, Ahmedabad, Gujarat 380009"
  embedTitle: "Map showing the TIDE Foundation office in Navrangpura, Ahmedabad"
```

`mapsUrl` is where both "Open in Google Maps" links (the address and the one under the map) go; `embedQuery` is the place name Google searches for the embedded map. Keep the two pointing at the same place. The page has no contact form any more.

The Donate page's bank details (account name, number, bank, IFSC, branch and their labels) are in the `bank:` block of `content/pages/get-involved-donate.yaml`.

**The email address is special** — it must be the same on every page. Read "Site-wide facts" just below before changing it.

### Site-wide facts: email address and lives-impacted figure

A few facts appear in many places: in page text, in the footer, in the information search engines and AI assistants read, and in the `/llms.txt` summary. They are kept in one master file, `content/shared/site.yaml`:

```yaml
name: "TIDE Foundation"
url: "https://tideinternational.org"
email: "tidefoundation@gmail.com"
livesImpacted: "52,500+"
gradeRange: "1–5"      # grades the Pramaan library covers; pages write {gradeRange}
foundingYear: "2014"
```

(The same file also holds the logo, the placeholder picture, the faint texture behind the page banners (`pageBannerTexture`), location, search-engine description and keywords, the parent names used in page breadcrumbs, and two search-engine switches: `indexable` — `false` asks search engines not to list any page, for a test copy of the site — and `crawlers`, which decides what `/robots.txt` allows; `allowTraining: false` would ask AI-training crawlers to stay away. Ask a developer before changing either switch.) Anything you change in `site.yaml` flows automatically into the search-engine information in the page header and into `/llms.txt`.

**Rule: the email address and the lives-impacted figure must be the same everywhere.** The decided values today are `tidefoundation@gmail.com` and `52,500+`. If you ever need to change one:

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

`{{name}}`  `{{url}}`  `{{email}}`  `{{livesImpacted}}`  `{{gradeRange}}`  `{{foundingYear}}`  `{{location}}`  `{{pages}}`

Keep those words exactly as written (an unknown word in double braces stops the build). `{{pages}}` becomes the list of the site's pages, written automatically from each page's breadcrumb name and search-engine description (`meta.breadcrumbName` and `meta.seoDescription` in its YAML) — change those to change the list. The other lines are ordinary text you can edit; numbers typed there (for example the partner and volunteer counts) are not checked against the rest of the site, so keep them up to date. Do not create a `public/llms.txt` file; the website builds `/llms.txt`, a full-text `/llms-full.txt`, `/sitemap.xml` and `/robots.txt` itself.

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

Some menu entries open a small sub-menu instead of a page. They have a `subItems:` list instead of a `to:`
line — for example About Us → Our Publications:

```yaml
      - label: "Our Publications"
        desc: "Annual reports, research & events"
        subItems:
          - label: "TIDE Publications"
            to: "/tide/publications"
          - label: "THRIvE Publications"
            to: "/thrive/publications"
```

Change only the `label` and `desc` values. **Never change the `to:` paths** — those are URL routes that must match the app code. (The same applies to `donateHref` in `footer.yaml` and the `ctaHref` / `secondaryHref` lines in `not-found.yaml` and `ctaHref` in `coming-soon.yaml`.)

The footer (`content/shared/footer.yaml`) has no link columns. It is one short row: the logo, name and tagline on the left; the email, phone number, social icons and a Donate button on the right. Change the button's wording with `donateLabel`. The email and phone come from `content/pages/contact.yaml`.

The copyright line keeps `{year}` where the year goes — leave it in, and the site always shows the current year:

```yaml
rights: "© {year} TIDE Foundation. All rights reserved."
```

---

## Validating Your Changes

If you're using Path B, you can check your content before pushing:

```bash
npm run content:validate
```

This will:
- **Stop with an error** if a YAML file has a syntax mistake (missing colons, bad indentation, etc.) — these must be fixed
- **Stop with an error** if any email address in `content/` (including the `llms.txt` template) is different from the one in `content/shared/site.yaml`, or if a lives-impacted total such as `40,000+` (a number sitting in a sentence about lives, people or impact) is different from `livesImpacted` in `site.yaml`. The message names the file and the field to fix
- **Warn** when any value that looks like a file path — it starts with `/assets/` or `assets/`, or ends in a picture, video or PDF ending such as `.jpg`, `.png`, `.webp`, `.svg`, `.mp4` or `.pdf` — points to a file that is not in `public/`, whatever the field is called, or is a bare file name with no folder in front of it

It is a helper, not a guarantee: it does not check links, and a picture path it can't recognise as a file still slips through. A missing file shows the grey placeholder instead of the picture. Always look at the page in the preview too.

If you're using Path A — editing directly on GitHub — there's no check beforehand, but the live build runs this same check (plus the code checks, the tests, and since 2026-11-24 a check of every page in a real browser) before publishing. A YAML syntax error or a mismatched email / lives-impacted figure **stops the update** (the **Actions** tab shows a red ✕, and the site keeps showing the previous version). A misspelled key does *not* stop it — it just shows up as missing text on the page. A wrong image path is only a warning in the content check, but since 2026-11-24 the browser check counts a missing file on a page as a failure, so it may stop the update too (not tested with a real wrong path); otherwise it shows up as a grey placeholder picture.

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
- The `public/assets/images/pramaan-library/` folder — filled in automatically from the Resource Centre's Google Sheet
- The `public/assets/images/publications/` folder — filled in automatically from the Publications Sheet
- The `public/assets/images/partners/` folder — filled in automatically from the Partners Sheet

If you need to change layout, colours, or add new pages, that requires a developer. Everything else a visitor or search engine reads — including the search-engine "structured data" and page breadcrumbs — comes from YAML (`site.yaml` and each page's `breadcrumbName`).
