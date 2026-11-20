# Moving This Project to a New Owner — Overview

**Who is this for?** The current developer/owner (you), planning to hand this entire project — the Google Sheet, the Apps Script automation, and the GitHub repository itself — to the non-technical person who will own and run it going forward.

**Time required:** A few hours, ideally split across more than one sitting. Not urgent-feeling, but not a 10-minute task either — rushing this is how things break.

> **Start with the inventory.** `docs/OPERATIONS-INVENTORY.md` lists every account, file, script, trigger, workflow, secret and expiry date that has to move. Walk it before you begin and again at the end; every row must point at the new owner.

---

## Why this is three separate documents, not one

This move touches two completely different platforms (Google and GitHub), and each has its own non-obvious behavior that a single combined guide would make confusing. Doing them in the wrong order, or assuming a feature works the way it sounds like it should, is exactly how a non-technical reader gets stuck with no way to debug it themselves. So:

| Document | Covers | When |
|---|---|---|
| `MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` | Moving the Resource Centre Sheet, its Google Form and its Apps Script to the new owner's Google account — then the same steps once more for the Publications Sheet | **Do this first** |
| `MIGRATION-GITHUB-REPOSITORY.md` | Transferring the GitHub repository itself to the new owner's GitHub account | **Do this second** |
| `MAINTENANCE-GITHUB-PAT-REFRESH.md` | A short, recurring task — regenerating an expired GitHub token | Ongoing, after migration is complete |

---

## Why this specific order matters

**Google first, GitHub second.** Here's the reasoning, so you're not just following orders blindly:

1. Moving the Google side produces a **brand new Web App URL** (this is expected — see that guide for why). You need to update a GitHub repository secret with this new URL.
2. It's much easier to debug "did the Google migration work?" while GitHub is still in its current, familiar state — one moving part at a time, not two at once.
3. Only once you've confirmed the site still works correctly with the new Google-side setup do you transfer the GitHub repository itself. At that point you're just handing over a project that's already fully working — not troubleshooting two changes simultaneously.

**What NOT to do:** Don't transfer the GitHub repository first and then try to migrate the Google side afterward "since they're at their own desk now." Whoever is doing the Google-side steps needs admin access to update the GitHub secret with the new Web App URL — make sure that's sorted out before you start, regardless of who that ends up being for this migration.

---

## A critical fact that shapes the Google-side guide

Google Apps Script has a real, confirmed gotcha: **you cannot transfer ownership of an Apps Script Web App's deployment**, even if you transfer the underlying Sheet/script file to another account. The deployment keeps running as the *original* owner regardless. ([Source](https://support.google.com/a/thread/137654217/how-to-transfer-google-sheet-app-script-so-that-it-runs-from-another-account))

Because of this, the Google-side guide transfers the *files* (the Sheet with its script, and the Google Form that fills it — a transferred file keeps its id, so the Form is expected to keep sending answers to the same Sheet; the guide's end-to-end check confirms it) but has the new owner make a **fresh deployment and fresh triggers** under their own account — the same steps as the original setup guide (`docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`), done once more. The old owner removes their own triggers first, because triggers run as whoever installed them.

---

## Before you start — a few minutes of preparation

- [ ] Confirm the new owner already has (or can create) their own Google account and GitHub account.
- [ ] Confirm you (current owner) still have access to everything today — the Google Sheet, the Apps Script project, and admin rights on the GitHub repository. If any of these are already unclear, sort that out before continuing.
- [ ] Block out time for both people to be reachable (even just by chat) during the migration, in case a step needs the *other* person's account to grant access.
- [ ] Read through both migration guides once, fully, before doing anything — so neither of you hits a surprise mid-step.

---

## The two Sheets the site uses

The Pramaan Resource Centre (`/pramaan/resource-centre`, and the counts on `/pramaan`) is fed by **one** Sheet, "Contributing to Pramaan; Educators' Resource Bank (Responses)", filled by a Google Form, with its own Apps Script, token, GitHub secrets (`PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN`) and workflow (`sync-pramaan-library.yml`). The Google guide covers all of it. That Sheet holds contributors' personal data (columns L–P) — share it only with the new owner. (The older Pramaan Sheet was retired on 2026-11-19 and does not need moving.)

The Publications pages (`/tide/publications` for TIDE rows, `/thrive/publications` for THRIvE rows) are fed by a **second**, separate Sheet, "TIDE THRIvE Publications (Responses)", also filled by a Google Form, with its own Apps Script (`apps-script/publications/Code.gs`), token (`publications-sheet`), GitHub secrets (`PUBLICATIONS_API_URL`, `PUBLICATIONS_SYNC_TOKEN`) and workflow (`sync-publications.yml`). Move it the same way as the first: transfer the Sheet and its Form, then the new owner repeats Steps 2–8 of `docs/PUBLICATIONS-SETUP-GUIDE.md`. It holds each submitter's email address — share it only with the new owner. (Not set up yet on 2026-11-20; if it still isn't at the handover, the new owner simply does the setup guide.)

## After both migrations are complete

- [ ] New owner owns the Google Sheet and its Google Form.
- [ ] New owner owns the Publications Sheet and its Google Form (once that integration is set up).
- [ ] New owner can open each Apps Script project and sees their own deployment and three triggers in each.
- [ ] New owner owns the GitHub repository, and the original developer still has collaborator access (this happens automatically for personal-to-personal transfers — see the GitHub guide).
- [ ] Live site loads correctly at its new URL and shows current data.
- [ ] A test edit in the Sheet shows up on `/pramaan/resource-centre` within a few minutes (confirms the whole pipeline survived the move, end to end) — and the same for the Publications Sheet on `/tide/publications` or `/thrive/publications`.
- [ ] Drive photo folders are readable by the new owner (Google guide Step 3).
- [ ] Alerts reach the new owner: GitHub variable `ALERT_ASSIGNEE` and Script Property `ALERT_EMAIL` (in each Sheet's script) updated; the cron schedule changed once by the new owner (GitHub guide Step 7).
- [ ] Every row of `docs/OPERATIONS-INVENTORY.md` points at the new owner, with the token expiry date in their calendar.
- [ ] New owner has bookmarked `docs/OPERATIONS-RUNBOOK.md`, `CONTENT-GUIDE.md`, `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `docs/PUBLICATIONS-SETUP-GUIDE.md`, `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md` and `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` for future reference.

---

*Next: open `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md`.*
