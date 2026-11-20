# Maintenance: Refreshing an Expired GitHub Token

**Who is this for?** The site owner. This is a short, recurring task — not a one-time setup.

**When do I need this?** Fine-grained GitHub tokens expire on a date you chose when creating them (commonly 1 year). The Resource Centre Sheet ("Contributing to Pramaan; Educators' Resource Bank (Responses)") uses one, stored in its Apps Script as `GITHUB_PAT` (recommended name `pramaan-library-sheet`), to tell GitHub "the Sheet changed, update the website". When it expires, Sheet edits stop reaching the website quickly — they then wait for the automatic run every 6 hours. Reminders beforehand: GitHub's own email to the token's owner, and — only if GitHub reports the expiry date to the script, which is not documented — an Apps Script email **"[Pramaan Library website] GitHub token expires in N day(s)"**. **The reliable reminder is your own calendar entry** made when you create the token.

> **There is one token per Sheet.** Two Sheets can update the website, each with its own token in its own Apps Script:
>
> | Sheet | Token name | Emails from its script start with | Its GitHub workflow |
> |---|---|---|---|
> | "Contributing to Pramaan; Educators' Resource Bank (Responses)" (Resource Centre) | `pramaan-library-sheet` | `[Pramaan Library website]` | **Sync Pramaan Library** |
> | "TIDE THRIvE Publications (Responses)" (Publications pages) — not set up yet on 2026-11-20 | `publications-sheet` | `[Publications website]` | **Sync Publications** |
>
> The steps below are written for the Resource Centre Sheet. For the Publications Sheet do exactly the same in **its** Apps Script, with its token name and its workflow. Renewing one token never affects the other.
>
> The older Pramaan Sheet's script and its token are no longer used by the website (see `docs/PRAMAAN-HARDENING-PLAN.md` §13).

**Time required:** ~10 minutes.

---

## How to tell if this has already happened

- An email **"[Pramaan Library website] GitHub refused the update (HTTP 401)"** arrived.
- You edited the Sheet, waited a few minutes, and no new **Sync Pramaan Library** run appeared in the GitHub repo's **Actions** tab.
- In the Sheet's Apps Script, running **`showStatus`** shows "HTTP 401" for the last update request, or a past token expiry date.
- The 6-hourly automatic sync keeps working without the token, so content still updates slowly — renew proactively when the reminder arrives.

---

## Step 1 — Generate a New Token

1. GitHub → your profile picture (top right) → **Settings**.
2. Left sidebar, scroll down → **Developer settings**.
3. **Personal access tokens → Fine-grained tokens**.
4. Click **Generate new token**.
5. **Token name:** anything memorable, e.g. `pramaan-library-sheet-2027`.
6. **Expiration:** pick a future date — GitHub will email a reminder again before this one expires too.
7. **Resource owner:** your account.
8. **Repository access:** **Only select repositories** → choose this one repository only.
9. **Permissions → Repository permissions → Actions:** set to **Read and write**. Leave everything else as "No access." (The script starts the sync through GitHub's "run workflow" API — `POST /repos/{owner}/{repo}/actions/workflows/{file}/dispatches`. Step 3's `testDispatch` confirms the permission in practice — `HTTP 403` means it is missing.)
10. Click **Generate token**, and **copy it immediately** — GitHub only shows it once.

---

## Step 2 — Update the Script Property

1. Open the Resource Centre Google Sheet → **Extensions → Apps Script**.
2. Gear icon (Project Settings) → **Script Properties**.
3. Find `GITHUB_PAT` → click to edit its value → paste the new token → **Save**.

---

## Step 3 — Test It

1. Apps Script editor → function dropdown → **`testDispatch`** → **Run**.
2. The Execution log must say **`SUCCESS (HTTP 204)`** or **`SUCCESS (HTTP 200)`**, and GitHub → **Actions** shows a new **Sync Pramaan Library** run within a minute. (`HTTP 401`: token pasted wrongly; `403`: missing Actions permission; `404`: wrong repository chosen in Step 1.8 or wrong `GITHUB_REPO`.)
3. Write the new token's expiry date in `docs/OPERATIONS-INVENTORY.md` (the matching token row — Resource Centre or Publications) **and in your calendar** (2 weeks before). `showStatus` shows it too if GitHub reported it.

If all three pass, you're done — no redeployment needed. Only the Script Property changed.

---

## Old Token Cleanup

The old, expired token doesn't need any manual action — GitHub automatically stops accepting it once it expires. You can optionally delete it from **Developer settings → Personal access tokens** for tidiness, but it's not required.
