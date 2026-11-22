# Partners — what the Sheet must look like

Sheet: **"TIDE/THRIvE Partners (Responses)"** — the responses of the partners Google Form, owned by the TIDE
Foundation Google account. Script: `apps-script/partners/Code.gs`. Sync: `scripts/sync-partners.js` +
`scripts/lib/partners-snapshot.js`. Setup: `docs/PARTNERS-SETUP-GUIDE.md`. Page: `/about/our-partners`.

Structure below was read from the Sheet's header row on 2026-11-21 (one tab, "Form Responses 1", A1:H114,
113 filled rows). The page rules come from the stakeholder's brief and the owner's answers (2026-11-21).

## Which tab is read

The first tab whose header row contains **"Type of partner"** (today: "Form Responses 1"). Other tabs are
ignored, so notes or helper tabs are safe.

## Columns

Columns are found by **header text** (start of the header, case-insensitive), not by letter, so moving
or inserting columns is safe. Renaming a *required* header makes the sync fail loudly and publish nothing.

| Col (today) | Header | Used for | Public? |
|---|---|---|---|
| A | Timestamp | turned into the anonymous id (`PA-` + 10 hex characters); never published | no |
| B | Type of partner **(required header)** | the section (slider) the partner appears in | yes (`type`) |
| C | Priority **(required header)** | order inside a section: Extremely high → High → Medium → Low | yes (`priority`) |
| D | Name of the partner **(required header)** | the name under the logo | yes (`name`) |
| E | Website (if available) | the name links here when there is a web link | yes (`website`) |
| F | Logo **(required header)** | the logo (Drive upload → self-hosted WebP) | yes |
| G | Column 2 | **never read** (empty on 2026-11-21) | no |
| H | Notes for Jwalin- to remove? | **never read** — internal notes (owner decision, 2026-11-21: ignore) | no |
| (optional) | Hide from website | a row with **Yes** here is not published | — |

Note: the stakeholder brief named **C** as the name and **D** as the priority; the Sheet has them the other
way round (C = Priority, D = Name). The script uses the headers, so this does not matter.

No column holds personal data today. A new column is never published unless it is added to the script, the
sync's allowlist and `content:validate` — so adding a column (for example a contact person) is safe.

## Who gets published

Owner decision (2026-11-21): no approval column — the rows come straight from Form submissions. A row is
published when:

1. it has a **Type of partner**, and
2. it has a **Name of the partner**, and
3. it is not marked **Yes** in an optional "Hide from website" column.

So **every Form submission goes live** at the next sync (within minutes), and anyone who has the Form link can
put a partner on the website. To take one down without deleting the response, add a column headed
`Hide from website` and type `Yes` in that row. Deleting the row also works.

## Type of partner → sections

Each different value becomes its own section with its own slider; there is no fixed list in the code. On
2026-11-21 the values were: Beneficiaries (42), Collaborators (23), Knowledge, Research and Funding (24),
Volunteer partners (18), Others (6). Sections are ordered **A→Z, with "Others" (or "Other") last** (owner
decision, 2026-11-21; `LAST_CATEGORIES` in `src/config/partners.js`). Values that differ only in capitals or
spaces ("Volunteer partners" / "volunteer Partners") are one section. A new value typed into the Sheet makes a
new section — so a typo makes a section of its own.

## Priority → order inside a section

Partners are ordered **Extremely high → High → Medium → Low**, then **A→Z by name** (owner decision,
2026-11-21; `PRIORITY_ORDER` in `src/config/partners.js`). Capitals and extra spaces don't matter. Any other
value (on 2026-11-21: one row with "Mediun") is still published, listed after Low, and reported in the GitHub
issue "Partners Sheet: some rows need attention". An empty priority is treated the same way.

## Website links

Only the first `http://` or `https://` link in the cell is used; a link typed as `www.…` gets `https://`
added. A cell with text but no link publishes the partner with an unlinked name and is reported. Links are
published exactly as typed (tracking parts such as `?srsltid=…` are not removed — fix them in the Sheet).

## Logos

Uploaded through the Form (Drive). The sync (`scripts/lib/partners-images.js`) trims uniform margins, keeps
transparency, never crops, and makes one WebP of at most 400 × 400 px (smaller uploads are not enlarged). The
manifest (`src/data/partners-photos.json`) records each logo's pixel size so the page reserves the right space.
A partner without a logo (or whose logo Drive can't read) is shown with the initials of its name and reported.
The same picture used for **3 or more partners** (for example one "No Logo Available" image uploaded for many
rows) is treated as a placeholder: those partners are shown with their initials too, and the sync report lists
them once ("N partners use the same logo picture"). Two partners sharing one logo (one organisation in two
sections) is normal and shown as it is.

Best results: a PNG with a transparent or white background, at least 400 px wide.

## IDs

There is no id column. Each row's id is a hash of its Timestamp: stable across syncs, reveals nothing. Editing
a Form response changes its Timestamp, so the row gets a new id (its logo is downloaded again). Rows typed into
the Sheet by hand have no Timestamp; their id is a hash of type + name instead. Two rows with the same id: the
later one is skipped and reported.

The same name twice in one section (on 2026-11-21: "Childrens home Paldi" in Beneficiaries) is published but
reported as a possible double submission. The same partner in two different sections (on 2026-11-21: "Global
Schools Forum") is allowed.

## Safety rules (nothing is published when one trips)

Checked by `validatePartners`:

- the page had partners and the Sheet suddenly returns none;
- more than max(10, 20%) of the partners would disappear;
- more than max(10, 20%) of the logos would be deleted;
- the data would exceed 2 MB.

An intended big change: **Actions → Sync Partners → Run workflow → tick allow_large_change**. Row-level problems
(no name, unknown priority, bad link, an email address typed into a field) never block the update; they are
listed in the GitHub issue "Partners Sheet: some rows need attention".
