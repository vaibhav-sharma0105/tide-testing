# Publications — what the Sheet must look like

Sheet: **"TIDE THRIvE Publications (Responses)"** — the responses of the publications Google Form.
Script: `apps-script/publications/Code.gs`. Sync: `scripts/sync-publications.js` +
`scripts/lib/publications-snapshot.js`. Setup: `docs/PUBLICATIONS-SETUP-GUIDE.md`.
Structure below was read from the Sheet's header row on 2026-11-20 (range A1:P66); the selection and
ordering rules come from the stakeholder's brief (passed on by the owner, 2026-11-20).

## Which tab is read

The first tab whose header row contains **"TIDE / THRIvE"** (today: "Form responses 1"). Other tabs are
ignored, so notes or helper tabs are safe.

## Columns

Columns are found by **header text** (start of the header, case-insensitive), not by letter, so moving
or inserting columns is safe. Renaming a *required* header makes the sync fail loudly and publish nothing.

| Col (today) | Header | Used for | Public? |
|---|---|---|---|
| A | Timestamp | turned into the anonymous id (`P-` + 10 hex characters); never published. Rows typed in by hand have none — see IDs | no |
| B | Email address | **never read by the script** | **no — personal** |
| C | Date of publication **(required header)** | `date` — both pages sort by it, newest first | yes |
| D | TIDE / THRIvE **(required header)** | which page the row goes to | yes (`org`) |
| E | Title of TIDE publication **(required header)** | TIDE `title` | yes |
| F | Type of material | TIDE `type` — filter tag | yes |
| G | Short description | TIDE `description` | yes |
| H | TIDE Link to the publication | TIDE `link` (first web link in the cell) | yes |
| I | Thumbnail / cover image | TIDE thumbnail (Drive upload → self-hosted WebP) | yes |
| J | Title of THRIvE publication **(required header)** | THRIvE `title` | yes |
| K | THRIvE Type of material | THRIvE `type` — filter tag | yes |
| L | THRIvE Field of Work | THRIvE `fields` (several allowed) — filter tag | yes |
| M | THRIvE Short description | THRIvE `description` | yes |
| N | APA Style Reference | THRIvE `citation`, shown under the title | yes |
| O | THRIvE Link to the publication | THRIvE `link` (first web link in the cell) | yes |
| P | THRIvE Thumbnail / cover image | THRIvE thumbnail | yes |
| (optional) | Hide from website | a row with **Yes** here is not published | — |

Note: the stakeholder brief named **F** as the THRIvE thumbnail; the Sheet has it in **P**
("THRIvE Thumbnail / cover image"). The script uses the header, so this does not matter.

## Who gets published

Owner decision (2026-11-20): there is no separate approval column. A row is published when:

1. "TIDE / THRIvE" is **TIDE** or **THRIvE** (any capitalisation), and
2. it has a title in that choice's title column, and
3. it is not marked **Yes** in an optional "Hide from website" column.

So **every Form submission goes live** at the next sync (within minutes). Anyone who has the Form link can
therefore put a row on the website. To take one down without deleting the response, add a column headed
`Hide from website` and type `Yes` in that row. Deleting the row also works.

## Field of Work (several answers per row)

Google Forms writes ticked checkboxes as one cell joined with ", ". An answer that itself contains a comma
("Teacher agency, wellbeing, motivation, and professional development") would be cut into pieces, so such
answers are listed in `FIELDS_WITH_COMMAS` in `scripts/lib/publications-snapshot.js`. **If a new Field of
Work option with a comma is added to the Form, add it to that list** (and a test in
`src/test/scripts/publicationsSnapshot.test.js`).

## Dates

Read from the date cell (Sheet time zone) or typed as `dd/mm/yyyy`; stored as `YYYY-MM-DD`. A row with no
readable date is still published, shown without a date and listed last, and reported.

## Links

Only the first `http://` or `https://` link in the cell is used. A cell with text but no link (seen in the
Sheet on 2026-11-20 for one THRIvE row) publishes the row without an "open" button and is reported.
Signed or temporary links (e.g. a `pdf.sciencedirectassets.com` link with `X-Amz-Security-…` in it, also
present on 2026-11-20) stop working after a while — use the publisher's permanent page or DOI instead.

## IDs

There is no id column. Each row's id is a hash of its Timestamp: stable across syncs, reveals nothing.
Editing a Form response changes its Timestamp, so the row gets a new id (its thumbnail is downloaded again).
Two rows with the same Timestamp: the later one is skipped and reported.

Rows **typed into the Sheet by hand** have no Timestamp (on 2026-11-20: rows 63–66, the TIDE annual
reports 2014–2019, 2019–2020, 2020–2021 and 2021–2022). Their id is a hash of TIDE/THRIvE + title + date
instead, so they are published; editing that title or date gives the row a new id. Two such rows with the
same title and date: the later one is skipped and reported.

The same title appearing twice on one page (3 THRIvE titles on 2026-11-20) is published but reported as a
possible double submission.

## Safety rules (nothing is published when one trips)

Checked for each page separately (TIDE and THRIvE) by `validatePublications`:

- a page that had publications suddenly has none;
- more than max(10, 20%) of a page's publications would disappear;
- more than max(10, 20%) of the thumbnails would be deleted;
- the data would exceed 2 MB.

An intended big change: **Actions → Sync Publications → Run workflow → tick allow_large_change**. Row-level
problems (no title, bad link, unreadable date, an email address typed into a field) never block the update;
they are listed in the GitHub issue "Publications Sheet: some rows need attention".

## Thumbnails

Uploaded through the Form (Drive). The sync turns each into two self-hosted WebP files
(`scripts/lib/publications-images.js`), because the uploads are screenshots of very different shapes
(measured 2026-11-20: portrait report covers, 16:10 slides with black bars, a logo on a wide white
margin, tall phone screenshots of blog pages, a two-page textbook spread):

- uniform borders (black bars, white margins) are trimmed first;
- **TIDE** — covers are kept whole, never cropped (the page frames them as documents);
- **THRIvE** — the list thumbnail keeps the image's own shape when it is between 3:4 (portrait) and
  16:9 (wide), so slides and spreads are never cropped and no words are cut off. Taller images (phone
  screenshots) are cropped to 3:4 around their most interesting area (so a browser bar doesn't fill
  the box); wider ones (logo strips, banners) are cropped to 16:9 from the centre;
- sizes: the thumbnail is at most 480 px wide (a smaller upload is not enlarged, except a cropped
  THRIvE thumbnail, which is always 480 px wide); the full-size file is at most 1200 px wide, never
  enlarged and never cropped;
- the manifest (`src/data/publications-photos.json`) records each file's pixel size
  (`thumbWidth`/`thumbHeight`/`fullWidth`/`fullHeight`), so the page reserves the right space.

Best results: upload the cover or first slide itself, not a screenshot of a browser showing it.
