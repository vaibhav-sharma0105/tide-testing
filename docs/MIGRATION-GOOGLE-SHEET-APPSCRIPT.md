# Migrating the Google Sheet + Apps Script to a New Owner

**Who is this for?** The new, non-technical owner, doing this together with the current owner. It covers the
one Google Sheet the website uses: **"Contributing to Pramaan; Educators' Resource Bank (Responses)"** (the
Pramaan Resource Centre, `/pramaan/resource-centre`), its Apps Script, the Google Form that fills it, and the
Drive files its rows link to.

**Time required:** ~45 minutes.

**Read `docs/MIGRATION-OVERVIEW.md` first** — it explains why this happens before the GitHub repository
transfer, not after.

> **Second Sheet (since 2026-11-20):** "TIDE THRIvE Publications (Responses)" feeds `/tide/publications` and
> `/thrive/publications`, with its own script (`apps-script/publications/Code.gs`), Form, token and GitHub secrets
> (`PUBLICATIONS_API_URL`, `PUBLICATIONS_SYNC_TOKEN`). Once it is set up, move it with the same steps below, done a
> second time for that Sheet; where a step points to `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`, use
> `docs/PUBLICATIONS-SETUP-GUIDE.md` instead. It also holds personal data (each submitter's email address).

> Until 2026-11-19 the site also used an older Pramaan Sheet with its own script. That one is retired and no
> longer needs moving (`docs/PRAMAAN-HARDENING-PLAN.md` §13); it can simply be kept as an archive.

---

## What moves, and what has to be redone

| Thing | Moves with the file? | What to do |
|---|---|---|
| The Sheet (rows, consent answers) | yes, when ownership is transferred | Step 2 |
| The Apps Script code | yes — it is attached to the Sheet | nothing |
| The **Google Form** that fills the Sheet | no — it is a separate file | Step 2 (transfer it too) |
| Drive photos/videos linked from rows | no — separate files | Step 3 |
| Script Properties (`SYNC_TOKEN`, `GITHUB_PAT`, …) | not verified | Step 4 re-creates them anyway |
| Triggers | **no** — triggers belong to the person who installed them | Steps 1 and 4 |
| The web app (its URL) | **no** | Step 4 makes a new one |

**Why the web app must be redone:** Google Apps Script web app deployments do not transfer ownership, even
when the file does — a deployment keeps running as the account that made it.
([Source](https://support.google.com/a/thread/137654217/how-to-transfer-google-sheet-app-script-so-that-it-runs-from-another-account))
So the new owner makes a **fresh deployment** under their own account. With this Sheet that is safe: the
script answers nothing without the secret key, and the website never calls it directly.

---

## Before you start

- The new owner needs their own Google account and a GitHub account with access to the repository.
- Both people should be reachable during this process.
- Have `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md` open — Step 4 below repeats its Steps 2–8.

---

## Step 1 — Current owner: stop your own triggers

Apps Script → **Triggers** (clock icon) → delete the three triggers (`onSheetChange` On change,
`onSheetChange` On form submit, `tick`). Triggers run as the person who installed them, so the new owner
cannot remove yours, and yours would keep running after the transfer.

## Step 2 — Transfer the Sheet and the Form

1. Open the Sheet → **Share** → add the new owner as **Editor** → in their row choose **Transfer ownership**.
   The new owner accepts the invitation from their email.
2. Do the same for the **Google Form** that fills the Sheet (Google Forms → the form → ⋮ → **Add
   collaborators** → Editor → transfer ownership), so the new owner can edit questions and see responses.
3. Record the new owner in `docs/OPERATIONS-INVENTORY.md`.

*Not verified here:* whether Google allows ownership transfer between two personal Gmail accounts in every
case. If the option is missing, use **File → Make a copy** instead and then check, in the Form → **Responses**
tab, which spreadsheet receives the answers — the website reads only the Sheet the script is attached to (or
the one named in the Script Property `SHEET_ID`). Ask the developer before choosing this path: a copy needs its
own form link and the Contribute button's `formUrl` may have to change (`MAINTENANCE-CONTRIBUTE-FORM-LINK.md`).

## Step 3 — Photos and videos: make sure the new owner can read them

Rows link to files in Google Drive (form uploads and shared links). **They are not moved with the Sheet.** The
script reads photos as the new owner, so the new owner's account must be able to open every photo; videos must
stay shared "Anyone with the link".

1. Current owner: find the Drive folder(s) holding the uploads (open a few photo links from the Sheet; for form
   uploads it is usually the Form's upload folder) and record them in `docs/OPERATIONS-INVENTORY.md`.
2. Share those folders with the new owner (**Editor**), or transfer their ownership. Transfer keeps every file's
   id, so the Sheet's links keep working.
3. Check: signed in as the new owner, open 3 photo links from the Sheet — each must open.

If photos become unreadable, the sync **keeps the old photos** on the website and lists the affected rows in a
`sheet-needs-attention` issue — nothing is deleted.

## Step 4 — New owner: set up the script under your account

Follow `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md` **Steps 2–8** in the transferred Sheet (the code is already
there — skip pasting it in Step 1):

- Step 2: Drive service on · Step 3: `makeSyncToken` (new secret key) · Step 4: Script Properties with
  **your own** GitHub token (`GITHUB_PAT`, see `MAINTENANCE-GITHUB-PAT-REFRESH.md` Step 1) and **your** `ALERT_EMAIL`
- Step 5: **New deployment** (new web app URL) · Step 6: update the GitHub secrets
  `PRAMAAN_LIBRARY_API_URL` and `PRAMAAN_LIBRARY_SYNC_TOKEN` (edit the existing ones)
- Step 7: `setup` (installs your three triggers; set "Notify me immediately") · Step 8: `testDispatch` →
  `SUCCESS (HTTP 204)` and a green **Sync Pramaan Library** run

## Step 5 — Check end to end

1. Edit one published row in the Sheet (e.g. a description), wait ~10 minutes.
2. GitHub → **Actions**: a **Sync Pramaan Library** run, then **Deploy to GitHub Pages**, both green.
3. The change shows on `/pramaan/resource-centre/<that ID>` (hard-refresh with Ctrl+F5). Undo the test edit.
4. In the Google Form → **Responses** tab, check it still sends answers to this Sheet (the link to the
   spreadsheet opens the transferred one).

Then the current owner archives **their** old deployment: Apps Script → **Deploy → Manage deployments** → the
old one → **Archive** (it answers nothing without the old key anyway).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `testDispatch` says HTTP 401 / 403 / 404 | token pasted wrongly / missing **Actions: Read and write** / wrong repository | `MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| Sync run fails with "Unauthorized" | `PRAMAAN_LIBRARY_SYNC_TOKEN` doesn't match the Script Property `SYNC_TOKEN` | Step 4 (setup guide Steps 3 and 6) |
| Issue lists "photo couldn't be read" for many rows | New owner can't open the Drive photos | Step 3 |
| Sheet edits don't start a sync | Triggers not installed under the new owner | Run `setup` again; check the Triggers page shows three rows |
| Two syncs per edit, or emails to the old owner | The old owner's triggers are still installed | Step 1 |
| New form answers never reach the site | The Form sends answers to a different spreadsheet | Step 2 note — ask the developer |

---

*Next: `docs/MIGRATION-GITHUB-REPOSITORY.md`.*
