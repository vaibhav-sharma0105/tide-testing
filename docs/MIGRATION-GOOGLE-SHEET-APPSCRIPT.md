# Migrating the Google Sheet + Apps Script to a New Owner

**Who is this for?** The new, non-technical owner, doing this together with (or guided by) the current owner. Covers both the resource-listing system and the thumbnail-sync system — they live in one shared Apps Script project, so this is one combined guide, not two.

**Time required:** ~45 minutes.

**Read `docs/MIGRATION-OVERVIEW.md` first if you haven't already** — it explains why this happens before the GitHub repository transfer, not after.

---

## Why we don't use Google's "transfer ownership" feature

You might expect this to be a simple "right-click → transfer ownership." It isn't, for a specific, confirmed reason: **Google Apps Script Web App deployments do not transfer ownership, even when the underlying file does.** If we transferred ownership the obvious way, the live Web App would keep quietly running as the *old* account forever, regardless of who owns the Sheet. ([Source](https://support.google.com/a/thread/137654217/how-to-transfer-google-sheet-app-script-so-that-it-runs-from-another-account))

So instead, the new owner makes a **fresh copy** of the Sheet (which also copies the script code automatically) and does a **fresh deployment** under their own account — the same reliable process as the original setup, just done once more. A bit more work, but it actually works.

---

## Before You Start — What You Need

- The new owner needs their own Google account.
- The current owner needs to share the existing Sheet with the new owner (Editor access) — see Step 1.
- Both people should be reachable during this process.

---

## Step 1 — Current Owner: Share the Sheet

1. Open the existing Google Sheet.
2. Click **Share** (top right).
3. Add the new owner's Google account email, set their role to **Editor**.
4. Click **Send**.

---

## Step 2 — New Owner: Make Your Own Copy

1. Open the Sheet using the link/invite from Step 1.
2. Click **File → Make a copy**.
3. Save it to **your own** Google Drive (not a shared folder owned by someone else).
4. Rename it to something clear, e.g. "TIDE ABL Resources (Live)".
5. Open the new copy's URL bar and copy the long ID string between `/d/` and `/edit` — you'll need this in Step 4. It looks like:
   ```
   https://docs.google.com/spreadsheets/d/THIS_LONG_ID_HERE/edit
   ```

This copy includes all the existing resource data **and** a copy of the automation script — both now owned by you.

---

## Step 3 — New Owner: Open Apps Script and Re-authorize

1. In your new copy, click **Extensions → Apps Script**.
2. You should see `Code.gs` already there, full of code — this came along with the copy.
3. In the function dropdown at the top, select **`scheduledRefresh`**.
4. Click **Run** (▶). You'll be asked to authorize permissions — this is expected, since this is a fresh project under your account even though the code looks identical. Click through: **Review permissions → your account → Advanced → Go to [project] (unsafe) → Allow**.
5. Check the **Execution log** — you should see `ABL cache refreshed at [timestamp]`. If you see an error instead, double check Step 4 below before re-running.

---

## Step 4 — ⚠️ Update the Sheet ID — Do Not Skip This

This is the single most important step in this whole guide, and it's easy to miss because nothing visibly breaks if you skip it.

The script has a line near the top that looks like this:

```javascript
const SHEET_ID = '1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ';
```

This is the ID of the **original** Sheet, hardcoded in the code itself. If you don't change it, your new copy's script will keep quietly reading data from the old Sheet under the old account forever — even though everything *looks* like it's using your new copy. The migration would be fake.

1. In `Code.gs`, find the `SHEET_ID` line near the top.
2. Replace the value between the quotes with the ID you copied in Step 2.5.
3. Save (Ctrl+S).
4. Re-run `scheduledRefresh` (same as Step 3) and check the execution log again — it should still say "refreshed" successfully, now reading from your copy.

---

## Step 5 — Deploy as a Web App

This produces a **brand new Web App URL** — different from the old one. That's expected.

1. Click **Deploy → New deployment** (this time it really is a new deployment, since this is a new project).
2. Gear icon ⚙ next to "Select type" → **Web app**.
3. Settings:
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone`
4. Click **Deploy**, approve permissions again if asked.
5. **Copy the new Web App URL and save it somewhere safe** — you'll paste it into a GitHub secret in Step 9.

---

## Step 6 — Set Up the 15-Minute Auto-Refresh Trigger

1. Click the **clock icon** (Triggers) in the left sidebar.
2. **+ Add Trigger**.
3. Function: `scheduledRefresh` · Deployment: `Head` · Source: `Time-driven` · Type: `Minutes timer` · Interval: `Every 15 minutes`.
4. Save.

---

## Step 7 — Generate a New Sync Token

Same method as the original thumbnail-sync setup — using the Apps Script editor itself, no extra tools.

1. Add this temporary function to the bottom of `Code.gs`:
   ```javascript
   function generateToken() {
     Logger.log(Utilities.getUuid() + Utilities.getUuid());
   }
   ```
2. Save, select it from the function dropdown, click **Run**.
3. Open **Execution log**, copy the long string shown.
4. Delete the `generateToken` function and save again.

**Save this token somewhere safe** — you'll need it twice: once here (Step 8) and once in GitHub (Step 9).

---

## Step 8 — Set Script Properties

1. Gear icon (Project Settings) → **Script Properties** → **Add script property**, for each of these:

| Property | Value |
|---|---|
| `SYNC_TOKEN` | The token from Step 7 |
| `GITHUB_PAT` | A fine-grained GitHub token — see the note below |
| `GITHUB_REPO` | `owner/repo-name`, e.g. `vaibhav-sharma0105/tide-testing` (use whatever it currently is — this may need updating again after the GitHub repository transfer; see that guide's last step) |

> **About `GITHUB_PAT` at this stage:** if you're following `MIGRATION-OVERVIEW.md`'s recommended order, the GitHub repository hasn't transferred yet — so generate this PAT under whoever currently has admin access to the GitHub repo (likely the original developer, for now). Once the GitHub transfer is complete, the very last step of `MIGRATION-GITHUB-REPOSITORY.md` has the new owner generate their **own** PAT under their own account and update this property again, fully decoupling from the original developer. Don't worry about getting this perfectly "final" right now — getting it *working* is what matters at this stage.

2. Add the "Drive API" advanced service (used for fetching thumbnails — easy to forget since the code already references it, but the *service* itself is per-project and doesn't carry over with a copy):
   - **Services** (+ icon, left sidebar) → **Drive API** → **Add**.

---

## Step 9 — Update GitHub Secrets

1. Go to the GitHub repository → **Settings → Secrets and variables → Actions**.
2. Update (don't just add a new one — edit the existing) **`VITE_ABL_API_URL`** with the new Web App URL from Step 5.
3. Update **`ABL_SYNC_TOKEN`** with the new token from Step 7.

---

## Step 10 — Set Up the "Sheet Edited" Trigger

1. Apps Script editor → **clock icon** (Triggers) → **+ Add Trigger**.
2. Function: `onSheetChange` · Deployment: `Head` · Source: `From spreadsheet` · Type: `On edit`.
3. Save, approve permissions if asked.

---

## Step 11 — Test Everything End to End

1. Paste your new Web App URL into a browser — confirm you see `{"success":true,...}` JSON.
2. GitHub repo → **Actions** tab → **Sync ABL Thumbnails** → **Run workflow** (manual trigger, to seed thumbnails from the new setup).
3. Confirm a new commit appears (`chore(abl-sync): update resource thumbnails`).
4. Make a small, harmless edit in your new Sheet copy. Within a couple of minutes, check the Actions tab — a sync run should start **on its own**, with nobody clicking anything.
5. Visit the live site and confirm resources and images display correctly.

If all five pass, the Google side of the migration is complete.

---

## What to Do With the Old Sheet

**Don't delete it immediately.** Keep it (and the old Apps Script project) untouched for a few weeks as a safety fallback while you confirm the new setup is fully stable. Once confident, the original owner can delete it, or just leave it dormant indefinitely — it's no longer connected to anything once `VITE_ABL_API_URL` points elsewhere.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| New Web App URL returns the *old* data | Forgot Step 4 (updating `SHEET_ID`) | Go back to Step 4 |
| `{"success":false,"error":"Unauthorized"}` on `?action=manifest` | `SYNC_TOKEN` script property doesn't match the GitHub secret | Re-check Steps 7–9 match exactly |
| Sheet edits don't trigger an automatic sync | Step 10's trigger isn't installed, or `GITHUB_PAT`/`GITHUB_REPO` properties are wrong | Re-check Step 8 and Step 10 |
| Everything works except the live site never updates | GitHub secrets weren't actually saved in Step 9 | Re-open Settings → Secrets and confirm both show a recent "Updated" date |

---

*Next: `docs/MIGRATION-GITHUB-REPOSITORY.md`.*
