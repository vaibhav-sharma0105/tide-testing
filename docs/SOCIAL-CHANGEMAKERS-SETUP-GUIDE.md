# Social Changemakers (Past SCF): connecting the Sheet to the website (one-time setup)

**Who is this for?** The person who owns, or can edit, the Sheet "Social Changemakers' Fellowship
Completion Form (Responses)" (the answers of the fellowship completion Google Form). No coding is needed:
you copy, paste and click.
**Time:** about 30 minutes.
**What you get:** the Past SCF page (`/education-for-harmony/social-changemakers`) fills itself from the
Sheet: one list of fellow cards (newest **SCF Batch** first, then the **Order to post within batch**), with
search and a batch filter. Each card opens the fellow's profile: photo (switching to the field-work photo),
name, project, the project summary, the project film, testimonial and write-up (when shared publicly), and
"What's next". New form answers and edits show up within minutes, and you get an email or a GitHub issue
whenever something goes wrong. Nothing fails silently.

> Keep this guide in one tab and the Sheet in another. Do the steps in order. Each step ends with
> **✅ Check**. Don't move on until the check passes.
> Column rules (what the website reads, who gets published, the order): `docs/SOCIAL-CHANGEMAKERS-SHEET-SCHEMA.md`.

> ⚠️ **Every Form answer goes live** (owner decision, 2026-11-23; consent is part of the fellowship). A row
> is published as soon as it has a **Name** and an **SCF Batch** — at the next update, usually within
> minutes. Share the Form link only with the fellows.
>
> **To take a profile off the website without deleting it:** add a column to the Sheet with the header
> `Hide from website`, and type `Yes` in that row. The profile disappears at the next update.
>
> **Photos must be file uploads** (through the Form, or a Drive link in the cell). A photo pasted into a
> cell as an image can't be read. **Videos** are shown only when the Drive file is shared "Anyone with the
> link" (or when the cell holds a YouTube link).

## How it works (one picture)

```
Sheet (the fellowship completion Form's answers)
  └─ its own Apps Script  ── token-gated; reads only Order, Batch, Name, Project, Summary, the two photos,
        │                    the two videos, the write-up, Next steps (+ Timestamp → anonymous id); never reads the email columns
        │  "something changed" ping (after edits / form answers; plus a daily heartbeat at 07:00 UTC)
        ▼
GitHub Actions "Sync Social Changemakers"  (also runs every 6 hours by itself, at :17)
  └─ checks the data (safety rules) → saves data + photos in the repository → deploys the site
        ▼
Website /education-for-harmony/social-changemakers  (reads the saved copy; no live calls to Google)
```

This is a separate connection from the Resource Centre, Publications and Partners Sheets: its own script,
its own GitHub token, its own secrets, its own workflow and its own alert issues.

## Before you start

| You need | Where |
|---|---|
| The Sheet, opened with an account that can **edit** it (the script runs as that account and must be able to open the uploaded photos and videos) | Google Drive |
| The script file | GitHub → this repository → `apps-script/social-changemakers/Code.gs` |
| A **new** fine-grained GitHub token for this Sheet (name `social-changemakers-sheet`, repository: this one only, permission **Actions: Read and write**). Anyone who can edit the Sheet can read its Script Properties, so use a token made only for this Sheet | `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1 |
| Admin access to the GitHub repository | github.com |
| The Social Changemakers code already on GitHub (`main`), including `.github/workflows/sync-social-changemakers.yml` | ask the developer — Step 8 can't work before it is there |

### The order matters (go-live order)

From `docs/SHEET-INTEGRATION-PLAYBOOK.md` §7:

1. **GitHub token → Script Properties → `setup` (+ "Notify me immediately" on each trigger) → GitHub
   secrets → confirm `ALERT_ASSIGNEE` → `testDispatch` (expect HTTP 204) → watch the first run → edit test.**
2. **The two GitHub secrets (Step 6) must exist before the data file has any profile in it.** Until the
   first real run, the committed data file is **empty** and the workflow skips quietly; after it, a missing
   secret makes every run fail and alert.
3. **Never commit Social Changemakers data made on a developer's computer.** The repository is public and
   git keeps every version. Let the GitHub run publish the real data.

---

## Step 1: Create the script inside the Sheet

1. Open the Sheet → **Extensions → Apps Script**. A new tab opens with an empty `Code.gs`.
2. Rename the project ("Untitled project") to **Social Changemakers sync**.
3. Click inside `Code.gs`, press **Ctrl+A** (Mac: Cmd+A), then **Delete**.
4. On GitHub, open `apps-script/social-changemakers/Code.gs` and click **Copy raw file**.
5. Paste it into `Code.gs` (**Ctrl+V**) and save it (**Ctrl+S**).

✅ **Check:** the top of the file says `Social Changemakers (Past SCF) — Google Apps Script, version 1.`, and saving shows no red error.

## Step 2: Turn on the Drive service (needed for photos)

Left sidebar → **Services** → **+** → **Drive API** → **Add**.

✅ **Check:** "Drive" appears under Services.

## Step 3: Make the secret key (SYNC_TOKEN)

1. Toolbar function dropdown → **`makeSyncToken`** → **Run**.
2. The first time, Google asks for permission: **Review permissions → choose your account →
   Advanced → Go to Social Changemakers sync (unsafe) → Allow**. "Unsafe" only means Google hasn't
   reviewed this private script, which is your own.
3. The **Execution log** shows a long code. **Copy it** into a temporary note; you need it in Step 6.

✅ **Check:** Project Settings (gear) → Script Properties lists `SYNC_TOKEN`.

> Running `makeSyncToken` again makes a **new** code; the GitHub secret `SOCIAL_CHANGEMAKERS_SYNC_TOKEN`
> must then be updated too.

## Step 4: Add the other settings

Gear icon → **Script Properties** → **Edit script properties** → add each of these → **Save**:

| Property | Value |
|---|---|
| `GITHUB_PAT` | the GitHub token `social-changemakers-sheet` (see "Before you start") |
| `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` (change it after a repository transfer) |
| `ALERT_EMAIL` | the address that should receive problem emails (if left out, they go to the script's account) |

Leave `GITHUB_WORKFLOW` out; the default is `sync-social-changemakers.yml`. (`GITHUB_REF` and `SHEET_ID`
are also optional — leave them out.)

✅ **Check:** `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO` and `ALERT_EMAIL` are all listed.

## Step 5: Publish the script as a web app

1. **Deploy → New deployment** → gear icon next to "Select type" → **Web app**.
2. Description: `Social Changemakers v1`. **Execute as: Me**. **Who has access: Anyone**.
   *Why "Anyone" is safe here:* the script answers **nothing** without the secret key from Step 3, and
   even with the key it only sends the profile columns listed in the schema doc — never the email columns.
3. **Deploy** → copy the **Web app URL** (it ends in `/exec`) into your note.

✅ **Check:** open the URL in a private browser window. It must show
`{"success":false,"error":"Unknown action"}`, which proves nothing is public.

## Step 6: Give GitHub the two values

GitHub → repository → **Settings → Secrets and variables → Actions → New repository secret**, twice:

| Name | Value |
|---|---|
| `SOCIAL_CHANGEMAKERS_API_URL` | the Web app URL from Step 5 |
| `SOCIAL_CHANGEMAKERS_SYNC_TOKEN` | the code from Step 3 |

Then **delete the temporary note**, and in Apps Script clear the Execution log.

While you are there, open the **Variables** tab and confirm `ALERT_ASSIGNEE` holds the GitHub username
that should receive problem issues (shared with the other workflows; don't add a second one).

✅ **Check:** both secret names appear in the secrets list, and `ALERT_ASSIGNEE` is set.

## Step 7: Install the automatic triggers

1. Apps Script → function dropdown → **`setup`** → **Run** (allow permissions if asked).
2. The log prints a status block.

✅ **Check:** the log has a line `Rows: N filled rows → M would be published (…)`, and the **Triggers**
(clock icon) page shows exactly **three** rows: `onSheetChange` (On change), `onSheetChange` (On form
submit) and `tick` (every 5 minutes).
Then, for each trigger: pencil → **Failure notification settings → Notify me immediately → Save**.

> **Fewer rows "would be published" than you expected?** The same line says why: rows without a name,
> rows without a batch, rows marked "Hide from website".

## Step 8: First update

1. Apps Script → **`testDispatch`** → **Run**. The log should say `SUCCESS (HTTP 204)` (`SUCCESS (HTTP 200)`
   also counts).
2. GitHub → **Actions → Sync Social Changemakers**: a run starts within a minute and turns green. If
   anything changed, **Deploy to GitHub Pages** starts after it.
3. Open the run's summary: it lists how many rows were published, how many have a public video, and any
   rows that need fixing (a missing order number, a private video, a missing photo…).

✅ **Check:** the run is green, and once the deploy finishes,
`https://vaibhav-sharma0105.github.io/tide-testing/education-for-harmony/social-changemakers` shows the fellows.

| `testDispatch` says | Meaning and fix |
|---|---|
| `FAILED (HTTP 401)` | Token wrong or expired → `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| `FAILED (HTTP 403)` | Token lacks **Actions: Read and write** on this repository |
| `FAILED (HTTP 404)` | `GITHUB_REPO` is misspelled, the token can't see the repository, or `sync-social-changemakers.yml` is not on `main` yet |
| `FAILED (HTTP 0)` + "not configured" | `GITHUB_PAT` or `GITHUB_REPO` is missing (Step 4) |

## Step 9: Real-world test (10 minutes)

Swap two fellows' **Order to post within batch** numbers. Within about a minute a **Sync Social
Changemakers** run starts by itself. When it and the deploy are green, the two cards have swapped places.

✅ **Check:** done. Record the setup date, the token's expiry date and the Sheet owner in
`docs/OPERATIONS-INVENTORY.md` (Social Changemakers rows), and put the token's expiry date in your calendar.

---

## How you hear about problems (nothing fails silently)

| What happens | How you find out |
|---|---|
| The sync fails (Google error, bad token, script outdated, required question renamed) | GitHub issue **"Social Changemakers sync failed — the Past SCF page is not updating"** (label `automation-alert`), assigned to `ALERT_ASSIGNEE`. It closes itself after the next good run |
| An update looks unsafe (the page would suddenly be empty, many profiles or photos gone, data over 2 MB) | The same issue, saying **"Not published — the update looked unsafe"**. The page keeps the last good version |
| Some rows have problems (no name or batch, no order number, a batch without a year, no photo, an unreadable photo, a private or unsupported video, the same name twice in one batch, two rows with the same Timestamp, an email address typed into a field) | GitHub issue **"Social Changemakers Sheet: some rows need attention"** (label `sheet-needs-attention`), listing each row. It closes itself when they're fixed |
| The Sheet can't reach GitHub (token expired or wrong) | Email **"[Social Changemakers website] GitHub refused the update"**, at most one a day. The 6-hourly run still updates the page meanwhile |
| The token expires soon (only if GitHub tells the script the date) | Email **"[Social Changemakers website] GitHub token expires in N day(s)"**. Your calendar entry is the reliable reminder |
| A trigger crashes | Google's "Apps Script failure" email (Step 7) |
| A secret is deleted after the page was published | The sync fails loudly (issue above). It is skipped quietly **only** before the very first publish |
| The deploy fails | GitHub issue **"Website deploy failed"** |

## Troubleshooting

| What you see | Fix |
|---|---|
| Error "Required column(s) not found in the header row: …" | One of the required questions was renamed: **Order to post within batch**, **SCF Batch**, **Name**, **Project name**. Restore the start of its header, or ask the developer to update `COLUMNS` in `Code.gs` |
| Error "No tab has the "SCF Batch" header" | The SCF Batch question was renamed or its column deleted. Restore the header |
| A fellow is missing from the page | Does the row have a name and a batch? Is it marked `Yes` under "Hide from website"? The "needs attention" issue lists the reason |
| A fellow is in the wrong place | Batches are newest first (by the first year written in the batch); inside a batch, by **Order to post within batch** (a whole number), then A→Z. A row without a number goes last and is listed in the "needs attention" issue |
| Two batches that should be one | They are one batch only if their first year is the same ("23-24" and "2023-24" are; "23-24" and "Batch 2023" are not unless the year matches). Write the batch the same way on every row |
| A photo is missing (initials are shown) | Is it a file upload (not an image pasted into the cell)? Does the link open for the account that runs the script? The "needs attention" issue names the row |
| A video button is missing | The Drive file must be shared **Anyone with the link** (Drive → Share → General access). The "needs attention" issue lists private videos |
| An edited Form response downloads its photos again | Normal: editing a response changes its Timestamp, which gives the row a new id |
| Run summary says "allow_large_change" is needed | Check the Sheet. If the removal is intended: Actions → Sync Social Changemakers → Run workflow → tick **allow_large_change** |
| Run summary says "N photo(s) still to download — the next run continues" | Normal after many new photos: each run downloads at most 100 so it always finishes and saves its work. The next run continues |
| Need the current state | Apps Script → **`showStatus`** → Run (never prints secret values) |

## For a developer: run the sync on your own computer

Add to `.env.development` (gitignored, never committed):

```
SOCIAL_CHANGEMAKERS_API_URL=<Web app URL>
SOCIAL_CHANGEMAKERS_SYNC_TOKEN=<token>
```

Then run `npm run content:sync-social-changemakers`. It writes `src/data/sheets/social-changemakers.json`,
`src/data/social-changemakers-photos.json` and `public/assets/images/social-changemakers/`, exactly as the
GitHub run does. Don't commit that output by hand — the GitHub run publishes the same data.

## Moving everything to a new owner

Follow `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` (start at `docs/MIGRATION-OVERVIEW.md`): the old owner
removes their triggers, the Sheet and its Form are transferred (the script moves with the Sheet), then the
new owner repeats **Steps 2–8** here with their own accounts: new token, new deployment URL, both GitHub
secrets updated, and `ALERT_EMAIL`. The Sheet is owned by a personal Google account today (2026-11-23);
moving it to the TIDE Foundation account is recommended (`docs/STAKEHOLDER-REVIEW-2026-11-28.md` §8).
