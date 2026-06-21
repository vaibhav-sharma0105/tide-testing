# Moving This Project to a New Owner — Overview

**Who is this for?** The current developer/owner (you), planning to hand this entire project — the Google Sheet, the Apps Script automation, and the GitHub repository itself — to the non-technical person who will own and run it going forward.

**Time required:** A few hours, ideally split across more than one sitting. Not urgent-feeling, but not a 10-minute task either — rushing this is how things break.

---

## Why this is three separate documents, not one

This move touches two completely different platforms (Google and GitHub), and each has its own non-obvious behavior that a single combined guide would make confusing. Doing them in the wrong order, or assuming a feature works the way it sounds like it should, is exactly how a non-technical reader gets stuck with no way to debug it themselves. So:

| Document | Covers | When |
|---|---|---|
| `MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` | Moving the Sheet + Apps Script (resource listing + thumbnail sync) to the new owner's Google account | **Do this first** |
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

Because of this, the Google-side guide does **not** use Google Drive's "transfer ownership" feature. Instead, it has the new owner make a fresh copy of the Sheet and a fresh deployment under their own account — the exact same reliable process as the original setup guides, just done once more under a different account. This is more steps than a single "click transfer" would be, but it's the version that's actually guaranteed to work.

---

## Before you start — a few minutes of preparation

- [ ] Confirm the new owner already has (or can create) their own Google account and GitHub account.
- [ ] Confirm you (current owner) still have access to everything today — the Google Sheet, the Apps Script project, and admin rights on the GitHub repository. If any of these are already unclear, sort that out before continuing.
- [ ] Block out time for both people to be reachable (even just by chat) during the migration, in case a step needs the *other* person's account to grant access.
- [ ] Read through both migration guides once, fully, before doing anything — so neither of you hits a surprise mid-step.

---

## After both migrations are complete

- [ ] New owner can see and edit the Google Sheet.
- [ ] New owner can open the Apps Script project and see the deployed Web App.
- [ ] New owner owns the GitHub repository, and the original developer still has collaborator access (this happens automatically for personal-to-personal transfers — see the GitHub guide).
- [ ] Live site loads correctly at its new URL and shows current data.
- [ ] A test edit in the Sheet shows up on the live site within a few minutes (confirms the whole pipeline survived the move, end to end).
- [ ] New owner has bookmarked `CONTENT-GUIDE.md`, `docs/ABL-APPSCRIPT-SETUP-GUIDE.md`, `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`, and `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` for future reference.

---

*Next: open `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md`.*
