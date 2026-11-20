# Operations Runbook — what to do when something needs attention

> For the site owner, no coding needed. Find your symptom, follow the steps. Everything the site
> depends on is listed in `docs/OPERATIONS-INVENTORY.md`.
>
> The Pramaan **Resource Centre** (`/pramaan/resource-centre`) and the counts on `/pramaan` come from one
> Sheet: "Contributing to Pramaan; Educators' Resource Bank (Responses)". Its GitHub workflow is
> **Sync Pramaan Library**. (The older Pramaan Sheet and its **Sync ABL Thumbnails** workflow were retired on
> 2026-11-19 — see `docs/PRAMAAN-HARDENING-PLAN.md` §13.)
>
> The **Publications** pages (`/about/publications` for TIDE, `/thrive/publications` for THRIvE) come from a
> second, separate Sheet: "TIDE THRIvE Publications (Responses)". Its GitHub workflow is **Sync Publications**.
> Not set up yet (2026-11-20) — `docs/PUBLICATIONS-SETUP-GUIDE.md`. The steps below work the same for it: use
> its workflow, its issue titles and its Sheet's Apps Script.

## How you'll find out something is wrong

| Signal | Means |
|---|---|
| GitHub email: issue **"Pramaan Library sync failed — the page is not updating"** (label **`automation-alert`**) assigned to you | The sync is **broken**. The site keeps showing the last good version. The issue closes itself after the next successful run. |
| GitHub email: issue **"Website deploy failed"** (label `automation-alert`) | The website build failed; the site keeps the last good version. |
| GitHub email: issue **"Pramaan Library Sheet: some rows need attention"** (label **`sheet-needs-attention`**) | The site updated, but some **Sheet rows** have problems (missing name, duplicate ID, bad link, unreadable photo). The issue lists them and closes itself when they're fixed. |
| GitHub email: issue **"Publications sync failed — the publications pages are not updating"** (`automation-alert`) | The Publications sync is broken; both publications pages keep the last good version. Closes itself after the next good run. |
| GitHub email: issue **"Publications Sheet: some rows need attention"** (`sheet-needs-attention`) | The publications pages updated, but some rows have problems (no title, no TIDE/THRIvE answer, bad link, unreadable date or thumbnail, the same title twice on one page — that one is still published). |
| Email **"[Pramaan Library website] …"** or **"[Publications website] …"** from Google | That Sheet couldn't reach GitHub, or its GitHub token expires soon. |
| Email from Google "Apps Script failure" | A script trigger crashed (set to "notify immediately" during setup). |
| The Resource Centre's "Last updated …" date is old | No content change has been published since then — fine if nobody edited the Sheet. |

## Symptom → action

| Symptom | What to do |
|---|---|
| Issue says **"Not published — the update looked unsafe"** | Open the Sheet and look at what the issue lists (e.g. many rows gone, consent answers changed). **If it was a mistake:** undo it in the Sheet (File → Version history) — the next run publishes normally. **If it was intended** (e.g. you really removed 40 resources): GitHub → **Actions → Sync Pramaan Library → Run workflow** → tick **allow_large_change** → **Run workflow**. |
| Email **"GitHub refused the update"** or **"token expires in N days"**, or the expiry date in your calendar is near | Renew the token: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` (~10 min). The site still updates every 6 hours meanwhile. |
| Issue **"Website deploy failed"** | Open the linked run, click the red step. If it says lint / tests / content check failed, a recent code or content change broke the build — revert that change or ask the developer. If it was a GitHub outage, **Actions → Deploy to GitHub Pages → Run workflow**. |
| Edited the Sheet, nothing changed after 30 minutes | 1) GitHub → Actions: did **Sync Pramaan Library** run? If **no**: in the Sheet's Apps Script run **`showStatus`**, then **`testDispatch`** (it must say HTTP 204; meanings in `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md` Step 8). If **yes and green**: check **Deploy to GitHub Pages** ran after it and is green; then hard-refresh the page (Ctrl+F5). 2) A row is published only when its three consent answers are "Yes". |
| A photo doesn't show / shows an old photo | The `sheet-needs-attention` issue names the row if Drive couldn't be read. Check the photo link in the Sheet opens for the owner account. Changed photos can take a few minutes to appear (browser cache — hard-refresh with Ctrl+F5). |
| Run summary says **"N photo(s) still to download — the next run continues"** | Normal after many new photos: each run downloads at most 100 (about 20 minutes). Wait for the next run, or start one: Actions → **Sync Pramaan Library** → Run workflow. |
| A video shows "Sorry, the file you have requested does not exist" or "You need access" | The Drive video isn't shared publicly. Open it as its owner → **Share → General access → Anyone with the link (Viewer)**. No sync needed. |
| Contribute button opens the wrong form, or says "Form link coming soon" | Change `formUrl`: `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md`. |
| An unwanted publication appeared (every Form answer goes live) | In the Publications Sheet add a column headed `Hide from website` (once) and type `Yes` in that row — it disappears at the next update. Or delete the row. |
| A publication is missing or on the wrong page | Its "TIDE / THRIvE" answer decides the page; it needs a title for that choice. The "Publications Sheet: some rows need attention" issue gives the reason. More: `docs/PUBLICATIONS-SETUP-GUIDE.md` → Troubleshooting. |
| Banner in GitHub Actions: "This scheduled workflow is disabled" | Click **Enable workflow**, then **Run workflow**. (GitHub disables schedules after 60 days without activity; the workflow's keep-alive step and the Apps Script heartbeat normally prevent this.) |
| Want to republish now | Actions → **Sync Pramaan Library** or **Sync Publications** (data/photos) or **Deploy to GitHub Pages** (site code) → **Run workflow**. **Never use "Re-run" on an old run** — use Run workflow. |
| More library problems | Full table: `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md` → "How you hear about problems" and "Troubleshooting". |
| Something looks badly wrong after a change and you need the old version back | Ask the developer to `git revert` the change; every published version is in the repository history. |

## Health checklists

**Monthly (5 minutes)**
- [ ] No open issues labelled `automation-alert` on GitHub.
- [ ] GitHub → Actions → **Sync Pramaan Library** (and, once set up, **Sync Publications**) shows green runs in the last day.
- [ ] The Resource Centre's "Last updated" date matches the last time the Sheet was edited.

**Yearly (30 minutes)**
- [ ] Renew each GitHub token **before** its expiry date (`pramaan-library-sheet`, `publications-sheet`; `MAINTENANCE-GITHUB-PAT-REFRESH.md`).
- [ ] Sign in to the Google account(s) that own the Sheets (Google may delete accounts unused for 2 years).
- [ ] Walk `docs/OPERATIONS-INVENTORY.md`; update anything that changed and the "Last verified" dates.
- [ ] Re-check `docs/PLATFORM-LIMITS.md` against the official pages (limits can change).
- [ ] Check the "Dates to put in a calendar" table in the inventory (Node.js / runner retirements).
- [ ] Repository size (the sync's run summary prints it): act if over 700 MB.

**At a handover (owner changes)**
- [ ] Follow `docs/MIGRATION-OVERVIEW.md` (Google side first, then GitHub).
- [ ] Update GitHub variable `ALERT_ASSIGNEE` and Script Property `ALERT_EMAIL` to the new owner.
- [ ] New owner creates their **own** GitHub tokens (one per Sheet) and puts each in `GITHUB_PAT` in that Sheet's script (Resource Centre, Publications).
- [ ] New owner changes the `cron:` schedule once in `.github/workflows/sync-pramaan-library.yml` (e.g. the minute `47` → `53`) and in `.github/workflows/sync-publications.yml` (e.g. `27` → `33`) — so GitHub's schedule emails go to them (GitHub notifies whoever last changed the cron syntax; a comment edit may not count).
- [ ] Walk `docs/OPERATIONS-INVENTORY.md` together and fill every ⚠️ row.
