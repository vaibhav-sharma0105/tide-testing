# Partners: connecting the Sheet to the website (one-time setup)

**Who is this for?** The person who owns, or can edit, the Sheet "TIDE/THRIvE Partners (Responses)" (the
answers of the partners Google Form; owned by the TIDE Foundation Google account). No coding is needed:
you copy, paste and click.
**Time:** about 30 minutes.
**What you get:** the page `/about/our-partners` fills itself from the Sheet: one slider per **Type of
partner**, partners ordered by **Priority**, each with its logo and its name (linked to its website when
there is one). New form answers and edits show up within minutes, and you get an email or a GitHub issue
whenever something goes wrong. Nothing fails silently.

> Keep this guide in one tab and the Sheet in another. Do the steps in order. Each step ends with
> **✅ Check**. Don't move on until the check passes.
> Column rules (what the website reads, who gets published, the order): `docs/PARTNERS-SHEET-SCHEMA.md`.

> ⚠️ **Every Form answer goes live.** There is no approval column (owner decision, 2026-11-21). A row is
> published as soon as it has a Type of partner and a Name of the partner — at the next update, usually
> within minutes. **Anyone who has the Form link can put a partner on the website**, so share the Form
> link only with people you trust.
>
> **To take a row off the website without deleting it:** add a column to the Sheet with the header
> `Hide from website`, and type `Yes` in that row. The row disappears at the next update. Deleting the
> row also works. (The column is optional; until you add it, nothing is hidden.)

## How it works (one picture)

```
Sheet (the partners Form's answers)
  └─ its own Apps Script  ── token-gated; reads only Type, Priority, Name, Website, Logo (+ Timestamp → anonymous id);
        │                    never reads the notes columns
        │  "something changed" ping (after edits / form answers; plus a daily heartbeat at 06:00 UTC)
        ▼
GitHub Actions "Sync Partners"  (also runs every 6 hours by itself, at :07)
  └─ checks the data (safety rules) → saves data + logos in the repository → deploys the site
        ▼
Website /about/our-partners  (reads the saved copy; no live calls to Google)
```

This is a separate connection from the Resource Centre and Publications Sheets: its own script, its own
GitHub token, its own secrets, its own workflow and its own alert issues. Setting up one never changes the
others.

## Before you start

| You need | Where |
|---|---|
| The Sheet, opened with an account that can **edit** it (the script runs as that account and must be able to open the logo files) | Google Drive |
| The script file | GitHub → this repository → `apps-script/partners/Code.gs` |
| A **new** fine-grained GitHub token for this Sheet (recommended name `partners-sheet`, repository: this one only, permission **Actions: Read and write**). Use a token made only for this Sheet, so it can be revoked or renewed on its own; anyone who can edit the Sheet can read its Script Properties | `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1 |
| Admin access to the GitHub repository | github.com |
| The partners code already on GitHub (`main`), including `.github/workflows/sync-partners.yml` | ask the developer — Step 8 can't work before it is there |

### The order matters (go-live order)

From `docs/SHEET-INTEGRATION-PLAYBOOK.md` §7:

1. **GitHub token → Script Properties → `setup` (+ "Notify me immediately" on each trigger) → GitHub
   secrets → confirm `ALERT_ASSIGNEE` → push → `testDispatch` (expect HTTP 204) → watch the first run →
   edit test.** The steps below follow this order.
2. **The two GitHub secrets (Step 6) must exist before anything is pushed that has a non-empty partners
   data file** (`src/data/sheets/partners.json` with at least one row). Before that, the workflow skips
   quietly; after it, a missing secret makes every run fail and alert. The data file is committed **empty**
   until the first real run fills it.
3. **Never commit partners data made on a developer's computer.** The repository is public and git keeps
   every version. Let the GitHub run publish the real data. (A developer's computer may hold a design
   preview — manifest entries with `fileId: "preview"` — that must never be committed.)

---

## Step 1: Create the script inside the Sheet

1. Open the Sheet → **Extensions → Apps Script**. A new tab opens with an empty `Code.gs`.
2. Click the project name at the top ("Untitled project") and rename it to **Partners sync**.
3. Click inside `Code.gs`, press **Ctrl+A** (Mac: Cmd+A), then **Delete**.
4. On GitHub, open `apps-script/partners/Code.gs` and click **Copy raw file** (the two squares, top right).
5. Paste it into `Code.gs` (**Ctrl+V**) and save it (**Ctrl+S**).

✅ **Check:** the top of the file says `TIDE / THRIvE Partners — Google Apps Script, version 1.`, and saving shows no red error.

## Step 2: Turn on the Drive service (needed for logos)

Left sidebar → **Services** → **+** → **Drive API** → **Add**.

✅ **Check:** "Drive" appears under Services.

## Step 3: Make the secret key (SYNC_TOKEN)

1. Toolbar function dropdown → **`makeSyncToken`** → **Run**.
2. The first time, Google asks for permission: **Review permissions → choose your account →
   Advanced → Go to Partners sync (unsafe) → Allow**. "Unsafe" only means Google hasn't reviewed this
   private script, which is your own.
3. The **Execution log** shows a long code. **Copy it** into a temporary note; you need it in Step 6.

✅ **Check:** Project Settings (gear) → Script Properties lists `SYNC_TOKEN`.

> Running `makeSyncToken` again makes a **new** code; the GitHub secret `PARTNERS_SYNC_TOKEN` must then be
> updated too.

## Step 4: Add the other settings

Gear icon → **Script Properties** → **Edit script properties** → add each of these → **Save**:

| Property | Value |
|---|---|
| `GITHUB_PAT` | the GitHub token `partners-sheet` (see "Before you start") |
| `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` (change it after a repository transfer) |
| `ALERT_EMAIL` | the address that should receive problem emails (if left out, they go to the script's account) |

Leave `GITHUB_WORKFLOW` out; the default is `sync-partners.yml`. (`GITHUB_REF`, default `main`, and
`SHEET_ID` are also optional — leave them out.)

✅ **Check:** `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO` and `ALERT_EMAIL` are all listed.

## Step 5: Publish the script as a web app

1. **Deploy → New deployment** → gear icon next to "Select type" → **Web app**.
2. Description: `Partners v1`. **Execute as: Me**. **Who has access: Anyone**.
   *Why "Anyone" is safe here:* the script answers **nothing** without the secret key from Step 3, and
   even with the key it only sends the five public columns.
3. **Deploy** → copy the **Web app URL** (it ends in `/exec`) into your note.

✅ **Check:** open the URL in a private browser window. It must show
`{"success":false,"error":"Unknown action"}`, which proves nothing is public.

## Step 6: Give GitHub the two values

GitHub → repository → **Settings → Secrets and variables → Actions → New repository secret**, twice:

| Name | Value |
|---|---|
| `PARTNERS_API_URL` | the Web app URL from Step 5 |
| `PARTNERS_SYNC_TOKEN` | the code from Step 3 |

Then **delete the temporary note**, and in Apps Script clear the Execution log.

While you are in **Settings → Secrets and variables → Actions**, open the **Variables** tab and confirm
`ALERT_ASSIGNEE` holds the GitHub username that should receive problem issues (it is shared with the other
workflows; don't add a second one).

✅ **Check:** both secret names appear in the secrets list, and `ALERT_ASSIGNEE` is set.

## Step 7: Install the automatic triggers

1. Apps Script → function dropdown → **`setup`** → **Run** (allow permissions if asked).
2. The log prints a status block.

✅ **Check:** the log has a line `Rows: N filled rows → M would be published (…)`, and the **Triggers**
(clock icon) page shows exactly **three** rows: `onSheetChange` (On change), `onSheetChange` (On form
submit) and `tick` (every 5 minutes).
Then, for each trigger: pencil → **Failure notification settings → Notify me immediately → Save**.

> **Fewer rows "would be published" than you expected?** The same line says why: rows without a type,
> rows without a name, rows marked "Hide from website".

## Step 8: First update

> **The first run replaces a preview (2026-11-23).** Until this setup, the site shows a static preview of
> the partners (built from the Sheet's public export; its ids are made differently from the script's).
> The first real update replaces every one of them, which the safety rule refuses unless you allow it
> **once**: GitHub → **Actions → Sync Partners → Run workflow** → tick **allow_large_change** → **Run**.
> Do this right after Step 7 (instead of waiting for `testDispatch` below); later runs need nothing special.

1. Apps Script → **`testDispatch`** → **Run**. The log should say `SUCCESS (HTTP 204)` (GitHub's normal
   answer; `SUCCESS (HTTP 200)` also counts).
2. GitHub → **Actions → Sync Partners**: a run starts within a minute and turns green. If anything
   changed, **Deploy to GitHub Pages** starts after it.
3. Open the run's summary: it lists how many rows were published, how many were not and why, and any rows
   that need fixing.

✅ **Check:** the run is green, and once the deploy finishes,
`https://vaibhav-sharma0105.github.io/tide-testing/about/our-partners` shows the partners.

| `testDispatch` says | Meaning and fix |
|---|---|
| `FAILED (HTTP 401)` | Token wrong or expired → `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| `FAILED (HTTP 403)` | Token lacks **Actions: Read and write** on this repository |
| `FAILED (HTTP 404)` | `GITHUB_REPO` is misspelled, the token can't see the repository, or `sync-partners.yml` is not on `main` yet |
| `FAILED (HTTP 0)` + "not configured" | `GITHUB_PAT` or `GITHUB_REPO` is missing (Step 4) |

## Step 9: Real-world test (10 minutes)

Change one partner's priority (for example Medium → High). Within about a minute a **Sync Partners** run
starts by itself. When it and the deploy are green, the partner has moved in its slider.

✅ **Check:** done. Record the setup date, the token's expiry date and the Sheet owner in
`docs/OPERATIONS-INVENTORY.md` (Partners rows), and put the token's expiry date in your calendar.

---

## How you hear about problems (nothing fails silently)

| What happens | How you find out |
|---|---|
| The sync fails (Google error, bad token, script outdated, required question renamed) | GitHub issue **"Partners sync failed — the partners page is not updating"** (label `automation-alert`), assigned to `ALERT_ASSIGNEE`. It closes itself after the next good run |
| An update looks unsafe (the page would suddenly be empty, many partners or logos gone, data over 2 MB) | The same issue, saying **"Not published — the update looked unsafe"**. The page keeps the last good version |
| Some rows have problems (no type or name, a priority that isn't Extremely high/High/Medium/Low, no logo, an unreadable logo, a bad website link or website text without a link, a name that is a web address, the same name twice in one section, two rows with the same Timestamp, an email address typed into a field) | GitHub issue **"Partners Sheet: some rows need attention"** (label `sheet-needs-attention`), listing each row. It closes itself when they're fixed |
| The Sheet can't reach GitHub (token expired or wrong) | Email **"[Partners website] GitHub refused the update"**, at most one a day. The 6-hourly run still updates the page meanwhile |
| The token expires soon (only if GitHub tells the script the date) | Email **"[Partners website] GitHub token expires in N day(s)"**. Your calendar entry is the reliable reminder |
| A trigger crashes | Google's "Apps Script failure" email (Step 7) |
| A secret is deleted after the page was published | The sync fails loudly (issue above). It is skipped quietly **only** before the very first publish |
| The deploy fails | GitHub issue **"Website deploy failed"** |

## Troubleshooting

| What you see | Fix |
|---|---|
| Error "Required column(s) not found in the header row: …" | One of the four required questions was renamed: **Type of partner**, **Priority**, **Name of the partner**, **Logo**. Restore the start of its header, or ask the developer to update `COLUMNS` in `Code.gs` |
| Error "No tab has the "Type of partner" header" | The Type of partner question was renamed or its column deleted. Restore the header |
| A partner is missing from the page | Does the row have a type and a name? Is it marked `Yes` under "Hide from website"? Does another row have the same Timestamp? The "needs attention" issue lists the reason |
| A new, unexpected section appeared | Each different "Type of partner" value is its own section; a typo makes a new one. Fix the value in the Sheet |
| A partner is in the wrong place in its slider | Order is Extremely high → High → Medium → Low, then A→Z. A misspelled priority (e.g. "Mediun") goes last and is listed in the "needs attention" issue |
| A row you hid is still showing | The column header must start with `Hide from website`, and the cell must start with `Yes`. Wait for the next update |
| A logo is missing (the name is shown in its place) | Does the logo link open for the account that runs the script? The "needs attention" issue names the row if Drive refused. A logo uploaded as an image that says "No logo available" is shown as that image — leave the Logo answer empty instead |
| The name is not a link | The Website cell has no web link. It must start with `http://` or `https://` (a link typed as `www.…` is completed automatically) |
| An edited Form response downloads its logo again | Normal: editing a response changes its Timestamp, which gives the row a new id |
| Run summary says "allow_large_change" is needed | Check the Sheet. If the removal is intended: Actions → Sync Partners → Run workflow → tick **allow_large_change** |
| Run summary says "N photo(s) still to download — the next run continues" | Normal after many new logos: each run downloads at most 100 (about 20 minutes) so it always finishes and saves its work. The next run continues |
| Need the current state | Apps Script → **`showStatus`** → Run (never prints secret values) |

## For a developer: run the sync on your own computer

Add to `.env.development` (gitignored, never committed):

```
PARTNERS_API_URL=<Web app URL>
PARTNERS_SYNC_TOKEN=<token>
```

Then run `npm run content:sync-partners`. It writes `src/data/sheets/partners.json`,
`src/data/partners-photos.json` and `public/assets/images/partners/`, exactly as the GitHub run does. Don't
commit that output by hand — the GitHub run publishes the same data (see "The order matters").

## Moving everything to a new owner

Follow `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` (start at `docs/MIGRATION-OVERVIEW.md`): the old owner
removes their triggers, the Sheet and its Form are transferred (the script moves with the Sheet), then the
new owner repeats **Steps 2–8** here with their own accounts: new token, new deployment URL, both GitHub
secrets (`PARTNERS_API_URL`, `PARTNERS_SYNC_TOKEN`) updated, and `ALERT_EMAIL`. That migration guide was
written for the Resource Centre Sheet; do the same steps once more for this Sheet.
