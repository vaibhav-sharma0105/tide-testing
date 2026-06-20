# ABL Resource Library — Thumbnail Sync Setup Guide

**Audience:** Site owner (non-developer)
**Time required:** ~30 minutes
**What you will set up:** An automated pipeline that copies resource thumbnail
images from Google Drive into the website itself, so the site never depends
on Google's image servers while a visitor is browsing. New or changed photos
in the Sheet show up on the live site automatically within about a minute of
you editing the Sheet — no developer involved after this one-time setup.

**Why this exists:** The Resource Center used to build thumbnail URLs on the
fly by guessing an undocumented Google address
(`lh3.googleusercontent.com/d/.../=wN`). That address has no guaranteed
capacity — Google can and does throttle it, which is why some resource cards
sometimes showed a plain icon instead of a photo. This setup replaces that
with a small robot that copies each photo into the website's own files ahead
of time, so visitors are never waiting on Google at all.

---

## Before You Start — What You Need

- You must have **already completed** `docs/ABL-APPSCRIPT-SETUP-GUIDE.md` —
  the Apps Script Web App must already be deployed and working.
- Access to the same Google account that owns the Sheet/script.
- **Admin (or write) access to the GitHub repository** for this website —
  you need to be able to add repository secrets under *Settings*. If you
  don't have this, ask whoever manages the GitHub repo to do Steps 2 and 7
  with you.
- A browser. Nothing else to install.

---

## Step 1 — Generate a Secret Token

This is a long random password that lets the website's automation prove to
your Apps Script that it's allowed to fetch images — without it, anyone who
finds your Web App URL could not pull images out of it.

You can generate one without installing anything, right inside the Apps
Script editor you already have open from the previous guide:

1. Open the Apps Script editor (Extensions → Apps Script, from the Sheet).
2. In the function dropdown at the top, you'll add a temporary function.
   Click into the code, go to a blank line at the very bottom, and paste:
   ```javascript
   function generateToken() {
     Logger.log(Utilities.getUuid() + Utilities.getUuid());
   }
   ```
3. Select `generateToken` from the function dropdown and click **Run** (▶).
4. Click **Execution log** at the bottom. You'll see a long string like
   `a1b2c3d4-....-....-....-....e5f6`. That's your token.
5. **Copy it somewhere safe** — you'll paste it in two places below.
6. You can now delete the `generateToken` function — it was only needed once.

---

## Step 2 — Add the Token as a GitHub Repository Secret

1. Go to the GitHub repository in your browser.
2. Click **Settings** (top tab of the repo, not your account settings).
3. In the left sidebar: **Secrets and variables** → **Actions**.
4. Click **New repository secret**.
5. **Name:** `ABL_SYNC_TOKEN`
6. **Value:** paste the token from Step 1.
7. Click **Add secret**.

---

## Step 3 — Replace Code.gs With the Updated Version

1. Back in the Apps Script editor, select all the existing code (Ctrl+A /
   Cmd+A) and delete it.
2. Paste the complete, up-to-date script from
   **`docs/ABL-RESOURCE-LIBRARY-SPEC.md`, section "2.5 Complete Apps Script
   Code"** — copy the entire code block from there. It includes everything
   from the original setup guide *plus* the new thumbnail-sync functions.
3. Click **Save** (Ctrl+S).

> Keeping the canonical script in one place (the spec doc) avoids two copies
> drifting apart. Always copy from there when updating.

---

## Step 4 — Store the Token in Script Properties

1. In the Apps Script editor, click the **gear icon** (Project Settings) in
   the left sidebar.
2. Scroll to **Script Properties**.
3. Click **Add script property**.
4. **Property:** `SYNC_TOKEN`  **Value:** the same token from Step 1.
5. Click **Save script properties**.

---

## Step 5 — Redeploy the Web App

**This step is easy to forget and the most common cause of "it's not
working."** Apps Script Web Apps keep serving the *old* code until you
explicitly redeploy — saving alone is not enough.

1. Click **Deploy** → **Manage deployments**.
2. Click the **pencil/edit icon** next to your existing deployment.
3. Change **Version** to **New version**.
4. Click **Deploy**.

> ⚠️ Do **NOT** click "New deployment" — that creates a second, different
> URL. Always use "Manage deployments" → edit the existing one, exactly as
> in the original setup guide.

---

## Step 6 — Test the New Endpoints

1. Take your Web App URL (from the original setup) and paste this into a
   browser, replacing `YOUR_TOKEN`:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=manifest&token=YOUR_TOKEN
   ```
2. You should see `{"success":true,"manifest":[...]}` with one entry per
   resource that has a photo.
3. If you see `{"success":false,"error":"Unauthorized"}` — the token in the
   URL doesn't match Script Properties. Re-check Steps 1 and 4.
4. If you see `{"success":false,"error":"Unauthorized"}` even with the right
   token, you likely skipped Step 5 (redeploy).

---

## Step 7 — Create a Fine-Grained GitHub Personal Access Token (PAT)

This lets your Apps Script tell GitHub "something changed, run the sync now."
It is scoped as narrowly as GitHub allows — it can only trigger a workflow
run in this one repository, nothing else.

1. In GitHub, click your profile picture (top right) → **Settings**.
2. Left sidebar, scroll down: **Developer settings**.
3. **Personal access tokens** → **Fine-grained tokens**.
4. Click **Generate new token**.
5. **Token name:** `tide-abl-thumbnail-sync` (or anything memorable).
6. **Expiration:** pick a duration (e.g. 1 year) — you'll need to regenerate
   and update it when it expires; GitHub will email you a reminder.
7. **Resource owner:** your account/organization.
8. **Repository access:** **Only select repositories** → choose this one
   repository only.
9. **Permissions** → **Repository permissions** → find **Actions** → set to
   **Read and write**. Leave every other permission as "No access."
10. Click **Generate token**.
11. **Copy the token immediately** — GitHub only shows it once.

---

## Step 8 — Store the GitHub PAT in Script Properties

1. Back in Apps Script → gear icon (Project Settings) → Script Properties.
2. Add property: **`GITHUB_PAT`** → paste the token from Step 7.
3. Add another property: **`GITHUB_REPO`** → value is `owner/repo-name`
   exactly as it appears in your repository's GitHub URL
   (e.g. `vaibhav-sharma0105/tide-testing`).
4. Click **Save script properties**.

---

## Step 9 — Create the "Sheet Edited" Trigger

This makes the Sheet automatically notify GitHub the moment something
changes, instead of waiting for the once-a-day safety-net check.

1. In the Apps Script editor, click the **clock icon** (Triggers) in the left
   sidebar.
2. Click **+ Add Trigger**.
3. Configure exactly as follows:
   - **Choose which function to run:** `onSheetChange`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From spreadsheet`
   - **Select event type:** `On edit`
4. Click **Save**.
5. Google will ask for permission again (since this trigger can now reach
   the internet via GitHub) — approve it the same way as before.

---

## Step 10 — Run the First Sync Manually

The very first run has to be triggered by hand, since nothing has "changed"
yet from GitHub's point of view.

1. Go to the GitHub repository → **Actions** tab.
2. In the left sidebar, click **Sync ABL Thumbnails**.
3. Click **Run workflow** (right side) → **Run workflow** (green button).
4. Wait ~1–2 minutes. Refresh the page — you should see a run with a green
   checkmark.
5. Check the repository's commit history — you should see a new commit like
   `chore(abl-sync): update resource thumbnails`.

---

## Step 11 — Verify on the Live Site

1. Wait for the commit from Step 10 to finish deploying (check the
   **"Deploy to GitHub Pages"** workflow also went green — it runs
   automatically after the sync commit).
2. Open the live Resource Center page.
3. Resource cards should now show real photos instead of the light-blue
   placeholder icon.

---

## Step 12 — Test the Automatic Path

1. In the Google Sheet, make a small, harmless edit (e.g. add a space to a
   description and remove it again, then save).
2. Within about a minute, check the GitHub Actions tab — a new "Sync ABL
   Thumbnails" run should appear on its own, with no one clicking anything.

If that run appears automatically, the whole pipeline is live and you're
done — no further manual steps, ever, for normal day-to-day Sheet edits.

---

## What to Save — Important Credentials

| Item | Where to find it again | Why you need it |
|---|---|---|
| **`ABL_SYNC_TOKEN`** value | GitHub repo secret (write-only after saving — re-generate via Step 1 if lost) | Shared secret between Apps Script and the sync job |
| **`GITHUB_PAT`** | GitHub → Settings → Developer settings → Fine-grained tokens (you can revoke/regenerate, but not view the value again) | Lets the Sheet notify GitHub of changes |
| **`GITHUB_REPO`** value | Your repo's GitHub URL | Tells Apps Script which repo to notify |

---

## Updating the Script in the Future

Same rule as the main setup guide: **any** change to `Code.gs` requires a
redeploy via **Deploy → Manage deployments → edit → New version → Deploy**.
Saving alone never updates what the live Web App actually serves.

---

## Monitoring & Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `{"success":false,"error":"Unauthorized"}` from `?action=manifest` | Token mismatch, or forgot to redeploy after Step 3 | Re-check Steps 1, 4, and especially Step 5 (redeploy) |
| `{"success":false,"error":"Unknown resource id"}` from `?action=fetchImage` | Normal if the id genuinely doesn't exist; otherwise the Sheet may not have synced recently | Run `scheduledRefresh` manually (see main setup guide) and retry |
| Sheet edits don't trigger an automatic run | The "On edit" trigger (Step 9) isn't installed, or the debounce window (2 minutes) hasn't passed since the last dispatch | Check Triggers list has `onSheetChange`; wait a bit and try again |
| GitHub Action run fails immediately | A secret (`ABL_SYNC_TOKEN` or `VITE_ABL_API_URL`) is missing or wrong | Re-check Step 2; confirm `VITE_ABL_API_URL` secret already exists from the main setup guide |
| Action succeeds but no commit appears | Nothing actually changed (this is normal — the job is a no-op if nothing differs) | Not an error. Edit a resource's photo and re-test if you want to confirm end-to-end |
| `GITHUB_PAT` stops working after a while | Fine-grained PATs expire on the date you chose in Step 7 | Generate a new one (Step 7) and update the Script Property (Step 8) |
| Cards show placeholders again after working fine before | A redeploy of the GitHub Pages site happened from an older commit, or the manifest file was manually edited | Re-run the workflow manually (Step 10) |

---

*End of setup guide. Keep this document, your `ABL_SYNC_TOKEN`, and your
`GITHUB_PAT` details in a safe place.*
