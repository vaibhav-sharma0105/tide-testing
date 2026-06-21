# Maintenance: Refreshing an Expired GitHub Token

**Who is this for?** The site owner. This is a short, recurring task — not a one-time setup.

**When do I need this?** Fine-grained GitHub tokens expire on a date you chose when creating them (commonly 1 year). When the token used by `onSheetChange` expires, Sheet edits silently stop triggering automatic thumbnail syncs. GitHub emails you a reminder before this happens — don't ignore that email.

**Time required:** ~10 minutes.

---

## How to tell if this has already happened

- You edited the Sheet, waited a few minutes, and no new run appeared in the GitHub repo's **Actions** tab.
- The daily safety-net sync (runs automatically once a day) is still working, so you might not notice for up to 24 hours — this is exactly why it's worth renewing proactively when the reminder email arrives, rather than waiting for something to look broken.

---

## Step 1 — Generate a New Token

1. GitHub → your profile picture (top right) → **Settings**.
2. Left sidebar, scroll down → **Developer settings**.
3. **Personal access tokens → Fine-grained tokens**.
4. Click **Generate new token**.
5. **Token name:** anything memorable, e.g. `tide-abl-thumbnail-sync-2027`.
6. **Expiration:** pick a future date — GitHub will email a reminder again before this one expires too.
7. **Resource owner:** your account.
8. **Repository access:** **Only select repositories** → choose this one repository only.
9. **Permissions → Repository permissions → Actions:** set to **Read and write**. Leave everything else as "No access."
10. Click **Generate token**, and **copy it immediately** — GitHub only shows it once.

---

## Step 2 — Update the Script Property

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Gear icon (Project Settings) → **Script Properties**.
3. Find `GITHUB_PAT` → click to edit its value → paste the new token → **Save**.

---

## Step 3 — Test It

1. Make a small, harmless edit in the Sheet (add a space to a description, then remove it, save).
2. Within a couple of minutes, check the GitHub repo's **Actions** tab — a new "Sync ABL Thumbnails" run should appear automatically.

If it appears, you're done — no redeployment needed, no other steps. Only the Script Property changed.

---

## Old Token Cleanup

The old, expired token doesn't need any manual action — GitHub automatically stops accepting it once it expires. You can optionally delete it from **Developer settings → Personal access tokens** for tidiness, but it's not required.
