# Pramaan Library: connecting the new Sheet to the website (one-time setup)

**Who is this for?** The person who owns the Sheet "Contributing to Pramaan; Educators' Resource
Bank (Responses)". No coding is needed: you copy, paste and click.
**Time:** about 30 minutes.
**What you get:** the unlinked page `/pramaan-library` fills itself from the Sheet. Edits and new
form answers show up within minutes, and you get an email or a GitHub issue whenever something
goes wrong. Nothing fails silently.

> Keep this guide in one tab and the Sheet in another. Do the steps in order. Each step ends with
> **✅ Check**. Don't move on until the check passes.
> Column rules (what the website reads, who gets published): `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`.

## How it works (one picture)

```
Sheet (private, holds personal data)
  └─ its own Apps Script  ── token-gated, sends ONLY consented rows, never columns L–P
        │  "something changed" ping (after edits / form answers; plus a daily heartbeat)
        ▼
GitHub Actions "Sync Pramaan Library"  (also runs every 6 hours by itself)
  └─ checks the data (safety rules) → saves data + photos in the repository → deploys the site
        ▼
Website page /pramaan-library  (reads the saved copy; no live calls to Google)
```

This is a **separate** connection from the old Pramaan Sheet. The old one keeps working
unchanged.

## Before you start

| You need | Where |
|---|---|
| The Sheet, opened with the **owner's** Google account | Google Drive |
| The script file | GitHub → this repository → `apps-script/pramaan-library/Code.gs` |
| A **new** fine-grained GitHub token for this Sheet (recommended name `pramaan-library-sheet`, repository: this one only, permission **Actions: Read and write**). Reusing the old Sheet's token works, but a separate one can be revoked or renewed on its own, and anyone who can edit either Sheet can read its Script Properties | `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1 |
| Admin access to the GitHub repository | github.com |

---

## Step 1: Create the script inside the Sheet

1. Open the Sheet → **Extensions → Apps Script**. A new tab opens with an empty `Code.gs`.
2. Click the project name at the top ("Untitled project") and rename it to **Pramaan Library sync**.
3. Click inside `Code.gs`, press **Ctrl+A** (Mac: Cmd+A), then **Delete**.
4. On GitHub, open `apps-script/pramaan-library/Code.gs` and click **Copy raw file** (the two squares, top right).
5. Paste it into `Code.gs` (**Ctrl+V**) and save it (**Ctrl+S**).

✅ **Check:** the first line says `Pramaan Library (form-format Sheet) — Google Apps Script, version 1`, and saving shows no red error.

## Step 2: Turn on the Drive service (needed for photos)

Left sidebar → **Services** → **+** → **Drive API** → **Add**.

✅ **Check:** "Drive" appears under Services.

## Step 3: Make the secret key (SYNC_TOKEN)

1. Toolbar function dropdown → **`makeSyncToken`** → **Run**.
2. The first time, Google asks for permission: **Review permissions → choose the owner account →
   Advanced → Go to Pramaan Library sync (unsafe) → Allow**. "Unsafe" only means Google hasn't
   reviewed this private script, which is your own.
3. The **Execution log** shows a long code. **Copy it** into a temporary note; you need it in Step 6.

✅ **Check:** Project Settings (gear) → Script Properties lists `SYNC_TOKEN`.

## Step 4: Add the other settings

Gear icon → **Script Properties** → **Edit script properties** → add each of these → **Save**:

| Property | Value |
|---|---|
| `GITHUB_PAT` | the GitHub token (see "Before you start") |
| `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` (change it after a repository transfer) |
| `ALERT_EMAIL` | the address that should receive problem emails |

Leave `GITHUB_WORKFLOW` out; the default is `sync-pramaan-library.yml`.

✅ **Check:** `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO` and `ALERT_EMAIL` are all listed.

## Step 5: Publish the script as a web app

1. **Deploy → New deployment** → gear icon next to "Select type" → **Web app**.
2. Description: `Pramaan Library v1`. **Execute as: Me**. **Who has access: Anyone**.
   *Why "Anyone" is safe here:* the script answers **nothing** without the secret key from Step 3,
   and even with the key it sends only consented rows and never the personal columns.
3. **Deploy** → copy the **Web app URL** (it ends in `/exec`) into your note.

✅ **Check:** open the URL in a private browser window. It must show
`{"success":false,"error":"Unknown action"}`, which proves nothing is public.

## Step 6: Give GitHub the two values

GitHub → repository → **Settings → Secrets and variables → Actions → New repository secret**, twice:

| Name | Value |
|---|---|
| `PRAMAAN_LIBRARY_API_URL` | the Web app URL from Step 5 |
| `PRAMAAN_LIBRARY_SYNC_TOKEN` | the code from Step 3 |

Then **delete the temporary note**, and in Apps Script clear the Execution log.

✅ **Check:** both names appear in the secrets list.

## Step 7: Install the automatic triggers

1. Apps Script → function dropdown → **`setup`** → **Run** (allow permissions if asked).
2. The log prints a status block.

✅ **Check:** the log has a line `Rows: N filled rows → M would be published, …`, and the
**Triggers** (clock icon) page shows exactly **three** rows: `onSheetChange` (On change),
`onSheetChange` (On form submit) and `tick` (every 5 minutes).
Then, for each trigger: pencil → **Failure notification settings → Notify me immediately → Save**.

> **"0 would be published"?** That is expected while columns Q, R and S are blank. A row appears
> on the page only when all three say **Yes**. Fill them in for the rows that may be shared.

## Step 8: First update

1. Apps Script → **`testDispatch`** → **Run**. The log should say `SUCCESS (HTTP 204)` or `SUCCESS (HTTP 200)`.
2. GitHub → **Actions → Sync Pramaan Library**: a run starts within a minute and turns green.
   If anything changed, **Deploy to GitHub Pages** starts after it.
3. Open the run's summary: it lists how many rows were published, how many lack consent, and any
   rows that need fixing.

✅ **Check:** the run is green, and once the deploy finishes, `https://vaibhav-sharma0105.github.io/tide-testing/pramaan-library` shows the consented resources.

| `testDispatch` says | Meaning and fix |
|---|---|
| `FAILED (HTTP 401)` | Token wrong or expired → `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| `FAILED (HTTP 403)` | Token lacks **Actions: Read and write** on this repository |
| `FAILED (HTTP 404)` | `GITHUB_REPO` is misspelled, or the token can't see the repository |
| `FAILED (HTTP 0)` + "not configured" | `GITHUB_PAT` or `GITHUB_REPO` is missing (Step 4) |

## Step 9: Real-world test (10 minutes)

Add a word to one consented row's description. Within about a minute a **Sync Pramaan Library**
run starts by itself. When it and the deploy are green, the page shows the new text.

✅ **Check:** done. Tick the setup items in `docs/PRAMAAN-HARDENING-PLAN.md` §12.

---

## How you hear about problems (nothing fails silently)

| What happens | How you find out |
|---|---|
| The sync fails (Google error, bad token, script outdated, column renamed) | GitHub issue **"Pramaan Library sync failed — the page is not updating"** (label `automation-alert`), assigned to `ALERT_ASSIGNEE`. It closes itself after the next good run |
| An update looks unsafe (many rows gone, the consent column changed) | The same issue, saying **"Not published — the update looked unsafe"**. The page keeps the last good version |
| Some rows have problems (no ID, duplicate ID, bad link, unreadable photo, an email address in a field) | GitHub issue **"Pramaan Library Sheet: some rows need attention"** (label `sheet-needs-attention`), listing each row. It closes itself when they're fixed |
| The Sheet can't reach GitHub (token expired or wrong) | Email **"[Pramaan Library website] GitHub refused the update"**, at most one a day. The 6-hourly run still updates the page meanwhile |
| A trigger crashes | Google's "Apps Script failure" email (Step 7) |
| A secret is deleted after the page was published | The sync fails loudly (issue above). It is skipped quietly **only** before the very first publish |
| The deploy fails | GitHub issue **"Website deploy failed"** |

## Troubleshooting

| What you see | Fix |
|---|---|
| Error "Required column(s) not found … consentShare" | A consent question header was renamed. Restore its start ("Do you consent to share…"), or ask the developer to update `COLUMNS` in `Code.gs` |
| A resource is missing from the page | Is Q/R/S "Yes" for that row? Does it have a name? Is its ID unique? The "needs attention" issue lists the reason |
| A photo is missing | Does the photo link open for the **owner** account (the account that owns the script)? The "needs attention" issue names the row if Drive refused |
| A video shows "Watch video" instead of playing | Only Google Drive and YouTube links play on the page; other sites open in a new tab |
| Run summary says "allow_large_change" is needed | Check the Sheet. If the removal is intended: Actions → Sync Pramaan Library → Run workflow → tick **allow_large_change** |
| Run summary says "N photo(s) still to download — the next run continues" | Normal after many new photos: each run downloads at most 100 (about 20 minutes) so it always finishes and saves its work. The next run continues. |
| A video shows "Sorry, the file you have requested does not exist" | The Drive video isn't shared publicly. Its owner sets **Share → General access → Anyone with the link (Viewer)**. No sync needed. |
| Need the current state | Apps Script → **`showStatus`** → Run (never prints secret values) |

## For a developer: run the sync on your own computer

Add to `.env.development` (gitignored, never committed):

```
PRAMAAN_LIBRARY_API_URL=<Web app URL>
PRAMAAN_LIBRARY_SYNC_TOKEN=<token>
```

Then run `npm run content:sync-pramaan-library`. It writes `src/data/sheets/pramaan-library.json`,
`src/data/pramaan-library-photos.json` and `public/assets/images/pramaan-library/`, exactly as the
GitHub run does.

## Moving everything to a new owner

Same order as the old Sheet (`docs/MIGRATION-OVERVIEW.md`): transfer the Sheet (the script moves
with it). Then the new owner repeats **Steps 3–8** with their own accounts: new token, new
deployment URL, both GitHub secrets updated, and `ALERT_EMAIL`.
