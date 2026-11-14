# Upgrading the Pramaan Apps Script to Version 3 (one-time)

**Who is this for?** The person who owns the Pramaan Google Sheet. No coding needed — you copy,
paste and click.
**Time:** about 20 minutes. **When:** after the website code for version 3 is on GitHub
(Phase 1 of `docs/PRAMAAN-HARDENING-PLAN.md`). **Nothing breaks if you wait** — the website keeps
working with the old script until you do this.

**What you get:** Sheet edits reach the website within minutes (today they wait for a daily run),
deleted rows are picked up too, nothing is ever dropped, and you get an email if the connection
to GitHub breaks (and, if GitHub reports the date, before its token expires).

> Keep this page open in one tab and the Sheet in another. Do the steps in order. Each step ends
> with **✅ Check** — don't move on until the check passes.

---

## Before you start — have these ready

| You need | Where to find it |
|---|---|
| The Pramaan Google Sheet, opened with the **owner's** Google account | Google Drive |
| The new script file | GitHub → this repository → folder `apps-script/abl/` → file `Code.gs` |
| The email address that should receive problem alerts | Your choice (usually the owner's) |

---

## Step 1 — Look at what is installed today (diagnosis, 3 minutes)

The website's records show the Sheet has **never** started an update by itself. This step finds out why.

1. In the Sheet: **Extensions → Apps Script**. A new tab opens with the script editor.
2. Left sidebar: click the **clock icon (Triggers)**. Write down every row you see
   (function name + event, e.g. "onSheetChange — From spreadsheet — On edit").
3. Left sidebar: click the **list icon (Executions)**. Look for any `onSheetChange` rows. Click one
   if present and note any red error text.
4. Left sidebar: click the **gear icon (Project Settings)** → scroll to **Script Properties**.
   Note which of these names exist (don't copy the values anywhere public):
   `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO`.

✅ **Check:** you have a short note of triggers, any errors, and which properties exist. Send it to
whoever is helping you, or keep it for Step 8. (No trigger at all, or a missing `GITHUB_PAT`, would
explain why updates never started.)

---

## Step 2 — Replace the code

1. Left sidebar: click **`< >` Editor**, then click **`Code.gs`**.
2. Click anywhere in the code, press **Ctrl+A** (Mac: Cmd+A) to select all, then **Delete**.
   The file is now empty.
3. In another tab open GitHub → `apps-script/abl/Code.gs` → click the **Copy raw file** button
   (two overlapping squares, top-right of the file).
4. Back in the script editor, click into the empty `Code.gs` and press **Ctrl+V** (Mac: Cmd+V).
5. Press **Ctrl+S** (Mac: Cmd+S) to save.

✅ **Check:** the top of the file says `Pramaan (ABL) resource library — Google Apps Script, version 3`,
and there is no red error banner after saving.

---

## Step 3 — Make sure the Drive API service is on

1. Left sidebar: look under **Services** for **Drive API**.
2. If it is **not** listed: click **+** next to Services → choose **Drive API** → **Add**.

✅ **Check:** "Drive" appears under Services.

---

## Step 4 — Add the new settings (Script Properties)

1. Gear icon (**Project Settings**) → scroll to **Script Properties** → **Edit script properties**.
2. Make sure each row below exists (click **Add script property** for missing ones). Then **Save**.

| Property | Value | Notes |
|---|---|---|
| `SYNC_TOKEN` | (keep the existing value) | Must equal the GitHub secret `ABL_SYNC_TOKEN`. Don't change it. |
| `GITHUB_PAT` | (keep, or a new token) | Fine-grained token, this repository only, **Actions: Read and write**. If missing or expired, create one: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1. |
| `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` | owner/name of the repository (change after a repository transfer). |
| `GITHUB_WORKFLOW` | `sync-abl-thumbnails.yml` | **New.** The workflow the Sheet starts. |
| `ALERT_EMAIL` | the alert address | **New.** Where problem emails go. |
| `SHEET_ID` | (leave out) | Optional. Only if the script should read a *different* Sheet than the one it is attached to. |

✅ **Check:** all of `SYNC_TOKEN`, `GITHUB_PAT`, `GITHUB_REPO`, `GITHUB_WORKFLOW`, `ALERT_EMAIL` are listed.

---

## Step 5 — Run `setup` once (installs the triggers)

1. Go back to the **Editor** (`< >`).
2. In the toolbar, the function dropdown (next to **Debug**) — choose **`setup`**.
3. Click **Run** (▶).
4. Google asks for permission (new: sending email, managing triggers). Click
   **Review permissions → choose the owner account → Advanced → Go to (project name) (unsafe) → Allow**.
   ("Unsafe" only means Google hasn't reviewed this private script — it's your own script.)
5. The **Execution log** opens at the bottom and prints a status block.

✅ **Check:** the log shows `Pramaan Apps Script v3` and a `Triggers:` line listing exactly
`onSheetChange` and `tick`. Open the **clock icon (Triggers)**: you see exactly two rows —
`onSheetChange` (From spreadsheet — **On change**) and `tick` (Time-based — every 5 minutes).
Running `setup` again later is safe; it never creates duplicates.

---

## Step 6 — Get alert emails immediately

1. **Triggers** (clock icon) → for **each** of the two rows: click the **pencil** →
   **Failure notification settings** → **Notify me immediately** → **Save**.

✅ **Check:** both triggers show "Notify me immediately".

---

## Step 7 — Publish the new version (same web address)

> ⚠️ Use **Manage deployments → Edit**. **Do not** use "New deployment" — that would create a
> *different* web address and the website would lose its data source.

1. Top-right: **Deploy → Manage deployments**.
2. Select the existing **Web app** deployment on the left → click the **pencil (Edit)** icon.
3. **Version:** open the dropdown → **New version**. (Execute as: **Me**; Who has access: **Anyone** — leave as they are.)
4. Click **Deploy** → **Done**.

✅ **Check:** the deployment's version number went up by one, and its web address (URL) is
**unchanged**.

---

## Step 8 — Test the connection to GitHub

1. Editor → function dropdown → **`testDispatch`** → **Run**.
2. Read the Execution log:
   - `SUCCESS (HTTP 204)` or `SUCCESS (HTTP 200)` → go to GitHub → **Actions** → you should see **Sync ABL Thumbnails**
     start within a minute. ✅
   - `FAILED (HTTP 401)` → the token is wrong or expired → `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`.
   - `FAILED (HTTP 403)` → the token lacks **Actions: Read and write** for this repository.
   - `FAILED (HTTP 404)` → `GITHUB_REPO` or `GITHUB_WORKFLOW` is misspelled, or the token can't see the repository.
   - `FAILED (HTTP 0)` + "not configured" → `GITHUB_PAT` or `GITHUB_REPO` is missing (Step 4).

✅ **Check:** `SUCCESS` and a new run in GitHub Actions that finishes green.

---

## Step 9 — Real-world test (10 minutes)

1. In the Sheet, change something harmless and visible — e.g. add a word to one resource's
   description. Note the time.
2. Within ~1 minute: GitHub → **Actions** → a **Sync ABL Thumbnails** run starts by itself.
3. ~30 seconds later, edit the same description back.
4. Within ~7 minutes a **second** run starts by itself (this is the "no dropped edits" fix).
5. When both runs and the **Deploy to GitHub Pages** run are green, open the live site's Pramaan
   page for that resource: it shows the final text.

✅ **Check:** two automatic runs, the site shows the final text. Tell the developer it passed, or
tick **G6** in `docs/PRAMAAN-HARDENING-PLAN.md` section 9.

---

## Troubleshooting

| What you see | Most likely cause | Fix |
|---|---|---|
| Red error when saving the code | Part of the file wasn't copied | Repeat Step 2 using **Copy raw file** |
| `setup` fails with "No Sheet" | Script isn't attached to the Sheet | Add Script Property `SHEET_ID` = the Sheet's id (the long part of its URL between `/d/` and `/edit`), run `setup` again |
| `setup` asks for permission every time | Permission dialog was closed early | Run it again and click through to **Allow** |
| No run starts after an edit, `testDispatch` succeeds | Trigger not installed | Run `setup` again (Step 5); check the Triggers page |
| GitHub opened an issue "Apps Script is outdated" | Step 7 wasn't done (old version still published) | Do Step 7 |
| Website shows old data after a test | The deploy run is still going, or failed | GitHub → Actions → wait for green "Deploy to GitHub Pages"; if red, see `docs/OPERATIONS-RUNBOOK.md` |
| Email "GitHub refused the update" | Token expired / wrong permission | `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |

To see the current state at any time: Editor → function **`showStatus`** → **Run** → read the log
(it never prints secret values).
