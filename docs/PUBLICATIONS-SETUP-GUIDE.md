# Publications: connecting the Sheet to the website (one-time setup)

**Who is this for?** The person who owns the Sheet "TIDE THRIvE Publications (Responses)" (the answers
of the publications Google Form). No coding is needed: you copy, paste and click.
**Time:** about 30 minutes.
**What you get:** two pages fill themselves from the Sheet:

- rows answered **TIDE** → `/tide/publications` (TIDE Publications)
- rows answered **THRIvE** → `/thrive/publications` (THRIvE Publications)

New form answers and edits show up within minutes, and you get an email or a GitHub issue whenever
something goes wrong. Nothing fails silently.

> Keep this guide in one tab and the Sheet in another. Do the steps in order. Each step ends with
> **✅ Check**. Don't move on until the check passes.
> Column rules (what the website reads, who gets published): `docs/PUBLICATIONS-SHEET-SCHEMA.md`.

> ⚠️ **Every Form answer goes live.** There is no approval column (owner decision, 2026-11-20). A row
> is published as soon as it says TIDE or THRIvE and has a title for that choice — at the next update,
> usually within minutes. **Anyone who has the Form link can put a publication on the website**, so
> share the Form link only with people you trust.
>
> **To take a row off the website without deleting it:** add a column to the Sheet with the header
> `Hide from website`, and type `Yes` in that row. The row disappears at the next update. Deleting the
> row also works. (The column is optional; until you add it, nothing is hidden.)

## How it works (one picture)

```
Sheet (private; holds each submitter's email address)
  └─ its own Apps Script  ── token-gated; never reads the email column; turns the Timestamp (or, for rows typed in by hand, title + date) into an anonymous id
        │  "something changed" ping (after edits / form answers; plus a daily heartbeat at 05:00 UTC)
        ▼
GitHub Actions "Sync Publications"  (also runs every 6 hours by itself)
  └─ checks the data (safety rules) → saves data + thumbnails in the repository → deploys the site
        ▼
Website /tide/publications (TIDE rows) and /thrive/publications (THRIvE rows)
  (read the saved copy; no live calls to Google)
```

This is a separate connection from the Pramaan Resource Centre Sheet: its own script, its own GitHub
token, its own secrets, its own workflow and its own alert issues. Setting up one never changes the other.

## Before you start

| You need | Where |
|---|---|
| The Sheet, opened with the **owner's** Google account | Google Drive |
| The script file | GitHub → this repository → `apps-script/publications/Code.gs` |
| A **new** fine-grained GitHub token for this Sheet (recommended name `publications-sheet`, repository: this one only, permission **Actions: Read and write**). Use a token made only for this Sheet, so it can be revoked or renewed on its own; anyone who can edit the Sheet can read its Script Properties | `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1 |
| Admin access to the GitHub repository | github.com |
| The publications code already on GitHub (`main`), including `.github/workflows/sync-publications.yml` | ask the developer — Step 8 can't work before it is there |

### The order matters (go-live order)

From `docs/SHEET-INTEGRATION-PLAYBOOK.md` §7:

1. **GitHub token → Script Properties → `setup` (+ "Notify me immediately" on each trigger) → GitHub
   secrets → confirm `ALERT_ASSIGNEE` → push → `testDispatch` (expect HTTP 204) → watch the first run →
   edit test.** The steps below follow this order.
2. **The two GitHub secrets (Step 6) must exist before anything is pushed that has a non-empty
   publications data file** (`src/data/sheets/publications.json` with at least one row). Before that, the
   workflow skips quietly; after it, a missing secret makes every run fail and alert. The data file was
   committed **empty** until the first real run filled it (2026-11-20, commit `f524770`). (A developer's
   computer may hold a preview data file made for design work — see point 3; it must never be committed.)
3. **Never commit publications data made on a developer's computer from test rows.** The repository is
   public and git keeps every version. Let the GitHub run publish the real data.

---

## Step 1: Create the script inside the Sheet

1. Open the Sheet → **Extensions → Apps Script**. A new tab opens with an empty `Code.gs`.
2. Click the project name at the top ("Untitled project") and rename it to **Publications sync**.
3. Click inside `Code.gs`, press **Ctrl+A** (Mac: Cmd+A), then **Delete**.
4. On GitHub, open `apps-script/publications/Code.gs` and click **Copy raw file** (the two squares, top right).
5. Paste it into `Code.gs` (**Ctrl+V**) and save it (**Ctrl+S**).

✅ **Check:** the top of the file says `TIDE / THRIvE Publications — Google Apps Script, version 1.`, and saving shows no red error.

## Step 2: Turn on the Drive service (needed for thumbnails)

Left sidebar → **Services** → **+** → **Drive API** → **Add**.

✅ **Check:** "Drive" appears under Services.

## Step 3: Make the secret key (SYNC_TOKEN)

1. Toolbar function dropdown → **`makeSyncToken`** → **Run**.
2. The first time, Google asks for permission: **Review permissions → choose the owner account →
   Advanced → Go to Publications sync (unsafe) → Allow**. "Unsafe" only means Google hasn't
   reviewed this private script, which is your own.
3. The **Execution log** shows a long code. **Copy it** into a temporary note; you need it in Step 6.

✅ **Check:** Project Settings (gear) → Script Properties lists `SYNC_TOKEN`.

> Running `makeSyncToken` again makes a **new** code; the GitHub secret `PUBLICATIONS_SYNC_TOKEN` must then
> be updated too.

## Step 4: Add the other settings

Gear icon → **Script Properties** → **Edit script properties** → add each of these → **Save**:

| Property | Value |
|---|---|
| `GITHUB_PAT` | the GitHub token `publications-sheet` (see "Before you start") |
| `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` (change it after a repository transfer) |
| `ALERT_EMAIL` | the address that should receive problem emails (if left out, they go to the script owner) |

Leave `GITHUB_WORKFLOW` out; the default is `sync-publications.yml`. (`GITHUB_REF`, default `main`, and
`SHEET_ID` are also optional — leave them out.)

✅ **Check:** `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO` and `ALERT_EMAIL` are all listed.

## Step 5: Publish the script as a web app

1. **Deploy → New deployment** → gear icon next to "Select type" → **Web app**.
2. Description: `Publications v1`. **Execute as: Me**. **Who has access: Anyone**.
   *Why "Anyone" is safe here:* the script answers **nothing** without the secret key from Step 3,
   and even with the key it never sends the email column or the Timestamp.
3. **Deploy** → copy the **Web app URL** (it ends in `/exec`) into your note.

✅ **Check:** open the URL in a private browser window. It must show
`{"success":false,"error":"Unknown action"}`, which proves nothing is public.

## Step 6: Give GitHub the two values

GitHub → repository → **Settings → Secrets and variables → Actions → New repository secret**, twice:

| Name | Value |
|---|---|
| `PUBLICATIONS_API_URL` | the Web app URL from Step 5 |
| `PUBLICATIONS_SYNC_TOKEN` | the code from Step 3 |

Then **delete the temporary note**, and in Apps Script clear the Execution log.

While you are in **Settings → Secrets and variables → Actions**, open the **Variables** tab and confirm
`ALERT_ASSIGNEE` holds the GitHub username that should receive problem issues (it is shared with the other
workflows; don't add a second one).

✅ **Check:** both secret names appear in the secrets list, and `ALERT_ASSIGNEE` is set.

## Step 7: Install the automatic triggers

1. Apps Script → function dropdown → **`setup`** → **Run** (allow permissions if asked).
2. The log prints a status block.

✅ **Check:** the log has a line `Rows: N filled rows → M would be published (X TIDE, Y THRIvE); …`, and
the **Triggers** (clock icon) page shows exactly **three** rows: `onSheetChange` (On change),
`onSheetChange` (On form submit) and `tick` (every 5 minutes).
Then, for each trigger: pencil → **Failure notification settings → Notify me immediately → Save**.

> **Fewer rows "would be published" than you expected?** The same line says why: rows without
> TIDE/THRIvE, rows without a title for their choice, rows marked "Hide from website". Rows typed into
> the Sheet by hand (no Timestamp) **are** published; the line counts them as "typed in without a
> Timestamp (id made from title + date)". There is no consent or approval column to fill in.

## Step 8: First update

1. Apps Script → **`testDispatch`** → **Run**. The log should say `SUCCESS (HTTP 204)` (GitHub's normal
   answer; `SUCCESS (HTTP 200)` also counts).
2. GitHub → **Actions → Sync Publications**: a run starts within a minute and turns green.
   If anything changed, **Deploy to GitHub Pages** starts after it.
3. Open the run's summary: it lists how many rows were published (TIDE and THRIvE separately), how many
   were not and why, and any rows that need fixing.

✅ **Check:** the run is green, and once the deploy finishes,
`https://vaibhav-sharma0105.github.io/tide-testing/tide/publications` shows the TIDE rows and
`https://vaibhav-sharma0105.github.io/tide-testing/thrive/publications` shows the THRIvE rows.

| `testDispatch` says | Meaning and fix |
|---|---|
| `FAILED (HTTP 401)` | Token wrong or expired → `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| `FAILED (HTTP 403)` | Token lacks **Actions: Read and write** on this repository |
| `FAILED (HTTP 404)` | `GITHUB_REPO` is misspelled, the token can't see the repository, or `sync-publications.yml` is not on `main` yet |
| `FAILED (HTTP 0)` + "not configured" | `GITHUB_PAT` or `GITHUB_REPO` is missing (Step 4) |

## Step 9: Real-world test (10 minutes)

Add a word to one published row's short description. Within about a minute a **Sync Publications**
run starts by itself. When it and the deploy are green, the page shows the new text.

✅ **Check:** done. Record the setup date, the token's expiry date and the Sheet owner in
`docs/OPERATIONS-INVENTORY.md` (Publications rows), and put the token's expiry date in your calendar.

---

## How you hear about problems (nothing fails silently)

| What happens | How you find out |
|---|---|
| The sync fails (Google error, bad token, script outdated, required question renamed) | GitHub issue **"Publications sync failed — the publications pages are not updating"** (label `automation-alert`), assigned to `ALERT_ASSIGNEE`. It closes itself after the next good run |
| An update looks unsafe (one page would suddenly be empty, many publications or thumbnails gone, data over 2 MB) | The same issue, saying **"Not published — the update looked unsafe"**. Both pages keep the last good version |
| Some rows have problems (no title, no TIDE/THRIvE answer, bad or missing link, unreadable date, unreadable thumbnail, two rows with the same Timestamp, the same title twice on one page, an email address typed into a field) | GitHub issue **"Publications Sheet: some rows need attention"** (label `sheet-needs-attention`), listing each row. It closes itself when they're fixed |
| The Sheet can't reach GitHub (token expired or wrong) | Email **"[Publications website] GitHub refused the update"**, at most one a day. The 6-hourly run still updates the pages meanwhile |
| The token expires soon (only if GitHub tells the script the date) | Email **"[Publications website] GitHub token expires in N day(s)"**. Your calendar entry is the reliable reminder |
| A trigger crashes | Google's "Apps Script failure" email (Step 7) |
| A secret is deleted after the pages were published | The sync fails loudly (issue above). It is skipped quietly **only** before the very first publish |
| The deploy fails | GitHub issue **"Website deploy failed"** |

## Troubleshooting

| What you see | Fix |
|---|---|
| Error "Required column(s) not found in the header row: …" | One of the four required questions was renamed: **Date of publication**, **TIDE / THRIvE**, **Title of TIDE publication**, **Title of THRIvE publication**. Restore the start of its header, or ask the developer to update `COLUMNS` in `Code.gs` |
| Error "No tab has the "TIDE / THRIvE" header" | The TIDE / THRIvE question was renamed or its column deleted. Restore the header |
| A publication is missing from the page | Does the row say TIDE or THRIvE? Does it have a title in **that** choice's title column? Is it marked `Yes` under "Hide from website"? Does another row have the same Timestamp (or, for rows typed in by hand, the same title and date)? The "needs attention" issue lists the reason |
| A publication is on the wrong page | The row's TIDE / THRIvE answer decides the page. Change the answer in the Sheet |
| A row you hid is still showing | The column header must start with `Hide from website`, and the cell must start with `Yes`. Wait for the next update |
| A thumbnail is missing | Does the thumbnail link open for the **owner** account (the account that owns the script)? The "needs attention" issue names the row if Drive refused. Until a thumbnail is synced, the page shows a plain stand-in (the latest annual report at the top of the TIDE page: a dark cover with the period and title printed on it; every other entry: the type's icon on a light tinted, dotted frame) |
| A thumbnail looks cropped, or its border is gone | Expected: plain borders are trimmed, and a THRIvE image taller than 3:4 or wider than 16:9 is cropped to that shape (TIDE covers are never cropped). See "Thumbnails" in `docs/PUBLICATIONS-SHEET-SCHEMA.md`. Upload the cover or first slide itself rather than a screenshot of a browser |
| No "Read" / "Read report" / "Open" button on a publication | The link cell has no web link. A link typed as `www.…` or `doi.org/…` is completed with `https://` automatically; anything else must start with `http://` or `https://`. Put the publication's web address there. Avoid signed/temporary links (for example a `pdf.sciencedirectassets.com` link with `X-Amz-Security-…` in it) — they stop working; use the publisher's permanent page or DOI |
| A publication shows no date and is listed last | The date of publication is empty or not readable. Use a date cell, or type `dd/mm/yyyy` |
| A Field of Work answer is split into pieces | It contains a comma. Ask the developer to add it to `FIELDS_WITH_COMMAS` in `scripts/lib/publications-snapshot.js` |
| An edited Form response downloads its thumbnail again | Normal: editing a response changes its Timestamp, which gives the row a new id |
| Run summary says "allow_large_change" is needed | Check the Sheet. If the removal is intended: Actions → Sync Publications → Run workflow → tick **allow_large_change** |
| Run summary says "N photo(s) still to download — the next run continues" | Normal after many new thumbnails: each run downloads at most 100 (about 20 minutes) so it always finishes and saves its work. The next run continues |
| Need the current state | Apps Script → **`showStatus`** → Run (never prints secret values) |

## For a developer: run the sync on your own computer

Add to `.env.development` (gitignored, never committed):

```
PUBLICATIONS_API_URL=<Web app URL>
PUBLICATIONS_SYNC_TOKEN=<token>
```

Then run `npm run content:sync-publications`. It writes `src/data/sheets/publications.json`,
`src/data/publications-photos.json` and `public/assets/images/publications/`, exactly as the GitHub run
does. Don't commit that output by hand — the GitHub run publishes the same data (see "The order matters").

## Moving everything to a new owner

Follow `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` (start at `docs/MIGRATION-OVERVIEW.md`): the old owner
removes their triggers, the Sheet and its Form are transferred (the script moves with the Sheet), then the
new owner repeats **Steps 2–8** here with their own accounts: new token, new deployment URL, both GitHub
secrets (`PUBLICATIONS_API_URL`, `PUBLICATIONS_SYNC_TOKEN`) updated, and `ALERT_EMAIL`. That migration guide
was written for the Resource Centre Sheet; do the same steps once more for this Sheet.
