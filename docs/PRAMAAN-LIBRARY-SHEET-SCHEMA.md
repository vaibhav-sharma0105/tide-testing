# Pramaan Library — what the Sheet must look like

The Sheet **"Contributing to Pramaan; Educators' Resource Bank (Responses)"** feeds the Pramaan
Resource Centre, `/pramaan/resource-centre` (its former address `/pramaan-library` redirects there). This page lists every rule the website applies to it. The rules are
written in code in `apps-script/pramaan-library/Code.gs`, `scripts/lib/library-snapshot.js`
and `scripts/validate-content.js`. If you change a rule there, update this page too.

## Which tab is read

The script reads the tab whose header row contains the consent question **"Do you consent to share…"**.
Today that tab is **Form responses 1**. Every other tab is ignored, including "Next steps required in
cleaning the ABL RC".

## Columns

The script finds each column by the **start of its header text** (case does not matter), never by
its letter. You can therefore move columns or add new ones safely. **Renaming a header can break
things**, though: a renamed **required** header stops the update with an error, and nothing is
published.

| Col (today) | Header starts with | Used for | Shown on the website? |
|---|---|---|---|
| A | `Internal ID` | The resource ID (the page link is `/pramaan/resource-centre/<ID>`) | In the link only |
| B | `Subject` | The **Subject** filter | Yes (card and detail page) |
| C | `Name of resource` | **Required.** Rows without a name are skipped and reported | Yes |
| D | `Short description` | Description | Yes |
| E | `What type of resource` | The **Type of material** filter and the colour of its badge | Yes |
| F | `Concepts captured` | Concept, also searchable | Detail page |
| G | `Language of material` | Shown as a label. **Not a filter** (stakeholder decision) | Detail page |
| H | `Upload a photo` | Photo. A copy is stored on the website, and "Open the file" links to the original | Yes |
| I | `Link to explanation video` | The first link only, if the same link is pasted several times. Drive and YouTube links play on the page; other links open in a new tab | Yes |
| J | `Any additional link` | Free text; any web links in it become clickable | Detail page |
| K | `Organization / Person that owns` | The **Ownership** filter (the list is built from the real values) | Yes |
| L | `Timestamp` | **Private.** Used only to create an ID for rows without one; never published | **Never** |
| M–P | Email, Name, Institution, Position | **Private** | **Never**. The script does not read them out |
| Q | `Do you consent to share` | **Required.** See "Who gets published" below | No |
| R | `Do you confirm … your original work` | **Required.** See below | No |
| S | `Do you confirm … accurate` | **Required.** See below | No |
| T–X | `… [Grade 1]` … `… [Grade 5]` | Grades and chapters (see below) | Yes (grade filter and alignment grid) |
| Y | `… [Foundational]` | The **Foundational** grade | Yes |

## Who gets published

A row is published **only if Q, R and S all start with "Yes"** (case does not matter). If any of
them is blank or "No", the row stays private. The sync report shows how many rows were not
published for this reason.

## Grades and chapters (T–Y)

| What the cell says | Meaning |
|---|---|
| empty | Not for this grade |
| `Doesn't fit the grade` (also `Does not fit…`, `Don't fit…`, `Not applicable`, `N/A`, `NA`, `-`; any case — `Code.gs` `NOT_THIS_GRADE`) | Not for this grade |
| anything else, e.g. `ch 2, ch 5` | **For this grade.** The text is split at commas into chapters |

## IDs

- **Use the "Internal ID if any" column for every resource you can.** IDs may contain only letters,
  numbers, spaces, `-`, `_`, `(` and `)`. Any other ID is skipped and reported.
- If a row has **no ID**, the script creates one from the hidden timestamp, e.g. `R-3fa91c02be`. It
  stays the same as long as the timestamp is unchanged. Adding an Internal ID later **changes
  the link**.
- If a row has **no ID and no timestamp**, it is skipped and reported. Add an Internal ID.
- If **two rows share an ID**, only the first is published and the second is reported.
- Photo files are named after the ID with spaces and brackets turned into `_`, so **`K 31` and `K_31` would share one photo file**. The second one's photo is left out and reported; change one of the two IDs.

## Safety rules (nothing is published when one trips)

- If the website already shows resources and the Sheet suddenly has **none publishable** (for
  example, the consent column was renamed or cleared), the update is refused.
- If more than **max(10, 20%)** of the published resources would disappear in one update, it is refused.
- If more than **max(10, 20%)** of the photos would be deleted, it is refused.
- If the data is larger than **2 MB**, it is refused.
- Any **email address** found in a published field removes that field and is reported (in a grade column, only that chapter entry is removed). A last check
  before deploying (`npm run content:validate`) stops the deploy if an email address or an
  unexpected field is ever in the published file.

If a large removal is really intended, go to GitHub → **Actions → Sync Pramaan Library → Run
workflow** and tick **allow_large_change**.
