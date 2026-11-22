# Stakeholder review — Publications and Partners pages (meeting 2026-11-28)

Sections 1–6: Publications. Section 7: Partners (`/about/our-partners`, added 2026-11-21).

**Status:** parked until the owner's meeting with the stakeholder on 2026-11-28 (owner decision,
2026-11-21). Until then, **no changes are made to the stakeholder's Sheet** ("TIDE THRIvE
Publications (Responses)") and none of the questions below are acted on.

Pages: `/tide/publications` and `/thrive/publications` (live; first sync 2026-11-20, commit
`f524770`). Everything below was read from the code, the Sheet snapshot or GitHub on 2026-11-21.

---

## 1. For the record: the publications sync token

| What | Value | Source |
|---|---|---|
| Token type and permission | GitHub fine-grained token, **Actions: read & write** | the owner, 2026-11-21 |
| Reminder | calendar reminder **one year** out | the owner, 2026-11-21 |
| Where it lives | the Publications Sheet's Apps Script, Script Property `GITHUB_PAT` | `apps-script/publications/Code.gs` |
| Not recorded yet | the token's **name** and its exact **expiry date** | — please note both at the meeting |

When it expires, Sheet edits stop reaching the website quickly; they then wait for the automatic run
every 6 hours. How to renew: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`. Whoever owns the Sheet after a
handover needs to know this date.

**Owner to-do (later, not urgent):** delete the two unused old repository secrets
`ABL_SYNC_TOKEN` and `VITE_ABL_API_URL` (GitHub → repository Settings → Secrets and variables →
Actions). No code uses them.

---

## 2. Rows in the Sheet that need a decision

From the open GitHub issue **#7 "Publications Sheet: some rows need attention"** (re-checked by every
sync). Row ids are the website's anonymous ids, shown in that issue.

| # | Publication | What the sync found | Question for the stakeholder |
|---|---|---|---|
| a | "Happiness Education in India: Two Researchers Set out to Ask What Students and Teachers Think" (P-43d9a5039d) | the link cell has text but no web link | What is the link? (Shown today without a "Read" button.) |
| b | "Happiness Education in India: …" — a second row (P-ffa05bbb22) | same title as (a) | Double submission, or two different pieces? |
| c | "Teaching against the odds: Teachers with disabilities in Indian mainstream schools" (P-1fa0424cb7 and P-71a598e3e5) | same title twice | Double submission, or two different pieces? |
| d | "Learning to Live Together Harmoniously…" (P-b104efe293, P-bb217f72be, P-9a5466ddc6, P-e6caf1e323) | same title four times | Their citations name different reviewers (e.g. Timalsina 2025, Jha 2024), so they may be separate reviews of the book — please confirm each is a distinct piece. Not verified. |

Duplicates are published as they are; the sync only reports them.

## 3. Other Sheet content

- **Two names for one type?** THRIvE has "Conference slides" (1 row) and "Talk / Conference slides"
  (3 rows). They show as two separate filter choices. Should they be one?
- **A temporary link:** "Happiness in education from the lens of children: Photovoice of students in
  government run schools in India" (P-88fc05ebde) links to a `pdf.sciencedirectassets.com` address,
  which stops working after a while. Its own citation gives the permanent DOI
  `https://doi.org/10.1016/j.ssaho.2025.101244` — use that instead?
- **Taking a row down without deleting it:** possible by adding a column headed `Hide from website`
  and typing `Yes` (supported by the code; the column does not exist and will only be added if the
  stakeholder wants it).

## 4. Wording written by the developer — needs approval

None of this text came from the stakeholder; it can be changed in the files shown.

| Where | Current text | File |
|---|---|---|
| TIDE page subtitle | "Our reports, research and talks — an open, year-by-year record of TIDE Foundation's work in education." | `content/pages/tide-publications.yaml` (`meta.subtitle`) |
| THRIvE page subtitle | "Journal articles, books, talks and coverage of our research on holistic education, social emotional learning, teacher agency and inclusive education." | `content/pages/thrive-publications.yaml` (`meta.subtitle`) |
| Menu descriptions | TIDE Publications: "Annual reports, project reports & talks" · THRIvE Publications: "Journal articles, books & talks" | `content/shared/navigation.yaml` |
| TIDE spotlight | "Latest edition", "See all {n} editions" | `tide-publications.yaml` (`featured`) |
| TIDE library | "All publications" — "Everything TIDE has published, newest first — search it, or narrow it by type and year." | `tide-publications.yaml` (`library`) |
| THRIvE entry headings | "APA reference", "About this work" | `thrive-publications.yaml` (`entry`) |
| THRIvE source names | e.g. ukfiet.org → "UKFIET", taylorfrancis.com → "Routledge", tandfonline.com → "Taylor & Francis Online" (23 web addresses, 22 names — ScienceDirect has two addresses) | `thrive-publications.yaml` (`source.names`) |

## 5. For the owner to check (found in the 2026-11-21 code audit)

- **Is the Form's upload folder shared?** Each thumbnail's Google Drive file id is in the public data
  (`src/data/publications-photos.json` and the snapshot's `photoUrl`). An id alone does not open a file:
  Drive's sharing decides. Form uploads are private to the Form owner by default — please confirm the
  upload folder is **not** shared as "Anyone with the link". (Not verified; it can only be checked in
  the owner's Drive.)
- **Who can submit the Form?** Every answer with TIDE/THRIvE and a title goes live (decision of
  2026-11-20), so anyone with the Form link can put a link on the website. Restricting the Form to
  signed-in members of the organisation would close that. Titles also appear in the GitHub "rows need
  attention" issue; since 2026-11-21 an "@name" there can no longer notify a GitHub user.

## 6. Decisions already made (for information)

- TIDE page address is now `/tide/publications`; the old `/about/publications` forwards to it.
- No "Source" line on the TIDE page (all its links are Google Drive links).
- The "publications per year" chart is switched off on both pages (`HERO_CHART` in
  `src/config/publications.js`), because the current year's short bar reads as a decline.
- Every Form answer with TIDE/THRIvE + a title goes live (no approval column; decided 2026-11-20).

---

## 7. Partners page (`/about/our-partners`)

Sheet: **"TIDE/THRIvE Partners (Responses)"** (owner: the TIDE Foundation Google account). Read on
2026-11-21: one tab, 113 filled rows, columns A–F only (the "Column 2" and "Notes for Jwalin- to
remove?" columns were not read — owner decision, 2026-11-21). **No changes have been made to this
Sheet.** Column rules: `docs/PARTNERS-SHEET-SCHEMA.md`.

### 7.1 How the page now works (decided by the owner, 2026-11-21 — for confirmation)

- One slider per **Type of partner**, sections A→Z with **Others** last. The sliders move on their own
  and have previous / pause / next buttons (and stay still for visitors who switched on "reduce
  motion").
- Inside a section: **Extremely high → High → Medium → Low**, then A→Z by name. The brief named three
  levels (High, Medium, Low); the Sheet also uses **Extremely high** (9 rows), so it was added on top.
- Each partner: its logo, and its name, linked to its website when there is one.
- A name search above the sliders (no other filters).
- **Every Form answer goes live** — no approval column (same as Publications). To take a partner down
  without deleting the row, a `Hide from website` column can be added (supported by the code; not added).
- The old hand-typed partner lists and the 42 old logo images on the page were replaced by the Sheet.

### 7.2 Rows that need a decision (found by the sync's checks on the 2026-11-21 data)

| # | Row(s) | What was found | Question |
|---|---|---|---|
| a | Beneficiaries: "Childrens home Paldi" (Low) and "Childrens Home Paldi" (Medium) | same name twice in one section | Double submission? Which priority is right? |
| b | "Global Schools Forum" — in **Knowledge, Research and Funding** (High) and in **Others** (Medium) | one partner in two sections | Intended? (Allowed by the code; both are shown.) |
| c | Volunteer partners: the name is `https://ahduni.edu.in/` | a web address in the **Name** column | Should it read "Ahmedabad University"? |
| d | Volunteer partners: "Alps Institute" | priority typed as "Mediun" | Medium? (Shown after Low until fixed.) |
| e | **24 Beneficiaries rows** use the same uploaded image, a picture with the words "No Logo Available" (e.g. Memnagar Sarwajanik Vidhyalaya, Pratap Highschool, Republic School, Anjuman School, Matrutva School, Shela/Dantali/Jaspur/Adalaj/Gibpura Primary School) | identical image file on 24 rows | Real logos available? Until then the page shows each one's initials (a picture shared by 3+ partners is treated as a placeholder, 2026-11-22). |
| f | Others: "Pratham Education Foundation" | the website is a Google Ads click link (`google.com/aclk?…`) | Use `https://www.pratham.org/`? (Not verified — please confirm the address.) |
| g | Decathlon, Adventure Pvt ltd, UPES university | the website ends with tracking text (`?srsltid=…`) | Remove the tracking part? |
| h | Bharat Youth Convention, IITs Bombay Student Council | the website uses `http://` (not secure) | Is there an `https://` address? |
| i | "Saraswati School " | a trailing space in the name | No action needed — the code trims it. |

### 7.3 Sharing (for the owner to check)

- **The Sheet is shared as "Anyone with the link can view"** (Drive, read 2026-11-21) — anyone with the
  link can read every column, including the internal notes column. The website doesn't need this (the
  script runs as the owner). Switch to **Restricted**?
- **The logo upload files are publicly downloadable** (one checked on 2026-11-21 opened without signing
  in). Logos end up on the public website anyway, but the Form's upload folder may also hold other
  files — please check its sharing.
- **Who can submit the Form?** Anyone with the Form link can put a partner (name, logo, link) on the
  website. Restricting the Form to signed-in members of the organisation would close that.

### 7.4 Wording written by the developer — needs approval

| Where | Current text | File |
|---|---|---|
| Page subtitle | "A network of schools, universities, organisations and funders that make our work possible." (the previous subtitle with "funders" added) | `content/pages/about-our-partners.yaml` (`meta.subtitle`) |
| Search description (Google) | "The schools, universities, NGOs, funders and volunteer partners working with TIDE Foundation." | same file, `meta.seoDescription` |
| Figures under the title | "113 partners", "5 types of partnership" | same file, `meta.stats` |
| Section links, search, empty and no-match texts, slider button labels | e.g. "Jump to a type of partner" (screen readers), "Search partners by name", "Our partner list is being updated. Please check back soon." | same file, `directory` |
| Band at the bottom (added in the 2026-11-22 redesign) | "Work with TIDE" / "Schools, universities, organisations and volunteers partner with us in different ways. Find yours, and help us change the way children learn." / buttons "Get in touch" (→ /contact) and "Volunteer with us" (→ /get-involved/volunteer). Is /contact the right place for a would-be partner, or should there be a partner form? | same file, `cta` |
| Optional one-line intro per type of partner (not built — needs wording) | e.g. what "Beneficiaries" means | — |

### 7.5 Not done yet (owner)

- The Partners sync is **not connected** yet: the owner's edit access to the Sheet was requested on
  2026-11-21. Setup: `docs/PARTNERS-SETUP-GUIDE.md`. Until then the page shows "Our partner list is being
  updated" (the committed data file is empty).
