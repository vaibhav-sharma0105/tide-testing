# Maintenance: Refreshing an Expired GitHub Token

**Who is this for?** The site owner. This is a short, recurring task — not a one-time setup.

**When do I need this?** Fine-grained GitHub tokens expire on a date you chose when creating them (commonly 1 year). When the token used by the Apps Script (`GITHUB_PAT`) expires, Sheet edits stop reaching the website quickly — they then wait for the automatic run every 6 hours. Two reminders arrive beforehand: GitHub's own email to the token's owner, and — only if GitHub reports the expiry date to the script, which is not documented — an Apps Script email **"[Pramaan website] GitHub token expires in N day(s)"** 30, 7 and 1 days before. **The reliable reminder is your own calendar entry** made when you create the token.

**Two Sheets, two tokens.** The Pramaan Library Sheet's script has its own `GITHUB_PAT` (recommended name `pramaan-library-sheet`, permission **Actions: Read and write** on this repository only). Renew it the same way: Steps 1–3 below, in the library Sheet's Apps Script, and test with its `testDispatch`. Its failure email is titled **"[Pramaan Library website] GitHub refused the update"**.

**Time required:** ~10 minutes (per token).

---

## How to tell if this has already happened

- An email **"[Pramaan website] GitHub refused the update (HTTP 401)"** arrived.
- You edited the Sheet, waited a few minutes, and no new run appeared in the GitHub repo's **Actions** tab.
- In Apps Script, running **`showStatus`** shows "Last update request: HTTP 401 …" or a past "Token expires" date.
- The 6-hourly automatic sync keeps working without the token, so content still updates slowly — renew proactively when the reminder arrives.

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
9. **Permissions → Repository permissions → Actions:** set to **Read and write**. Leave everything else as "No access." (Apps Script v3 starts the sync through GitHub's "run workflow" API — `POST /repos/{owner}/{repo}/actions/workflows/{file}/dispatches`. GitHub's REST page for it did not state the fine-grained permission when checked on 2026-11-15; **Actions: Read and write** is the expected one, and Step 3's `testDispatch` confirms it in practice — `HTTP 403` means it is missing.)
10. Click **Generate token**, and **copy it immediately** — GitHub only shows it once.

---

## Step 2 — Update the Script Property

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Gear icon (Project Settings) → **Script Properties**.
3. Find `GITHUB_PAT` → click to edit its value → paste the new token → **Save**.

---

## Step 3 — Test It

1. Apps Script editor → function dropdown → **`testDispatch`** → **Run**.
2. The Execution log must say **`SUCCESS (HTTP 204)`** or **`SUCCESS (HTTP 200)`**, and GitHub → **Actions** shows a new **Sync ABL Thumbnails** run within a minute. (`HTTP 401`: token pasted wrongly; `403`: missing Actions permission; `404`: wrong repository chosen in Step 1.8 or wrong `GITHUB_REPO`.)
3. Write the new token's expiry date in `docs/OPERATIONS-INVENTORY.md` (GitHub token row) **and in your calendar** (2 weeks before). `showStatus` shows it too if GitHub reported it.

If all three pass, you're done — no redeployment needed. Only the Script Property changed.

---

## Old Token Cleanup

The old, expired token doesn't need any manual action — GitHub automatically stops accepting it once it expires. You can optionally delete it from **Developer settings → Personal access tokens** for tidiness, but it's not required.
