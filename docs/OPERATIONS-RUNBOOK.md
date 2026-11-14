# Operations Runbook — what to do when something needs attention

> For the site owner, no coding needed. Find your symptom, follow the steps. Everything the site
> depends on is listed in `docs/OPERATIONS-INVENTORY.md`.

## How you'll find out something is wrong

| Signal | Means |
|---|---|
| GitHub email: issue labelled **`automation-alert`** assigned to you | Something is **broken** (sync or deploy failed). The site keeps showing the last good version. The issue closes itself after the next successful run. |
| GitHub email: issue labelled **`sheet-needs-attention`** | The site updated, but some **Sheet rows** have problems (missing name, duplicate ID, bad link, unreadable photo). The issue lists them and closes itself when they're fixed. |
| Email **"[Pramaan website] …"** from Google | The Sheet couldn't reach GitHub, or the GitHub token expires soon. |
| Email from Google "Apps Script failure" | A script trigger crashed (set to "notify immediately" during setup). |
| `/pramaan` page "Last updated …" is old | No content change has been published since then — fine if nobody edited the Sheet. |

## Symptom → action

| Symptom | What to do |
|---|---|
| Issue says **"Not published — the update looked unsafe"** | Open the Sheet and look at what the issue lists (e.g. a tab missing, many rows gone, a renamed column header). **If it was a mistake:** undo it in the Sheet (File → Version history) — the next run publishes normally. **If it was intended** (e.g. you really removed 40 resources): GitHub → **Actions → Sync ABL Thumbnails → Run workflow** → tick **allow_large_change** → **Run workflow**. |
| Issue says **"Apps Script is outdated"** | Paste the latest `apps-script/abl/Code.gs` and publish a new version: `docs/ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` Steps 2 and 7. |
| Issue says **"Unauthorized"** | The Sheet's `SYNC_TOKEN` and GitHub's `ABL_SYNC_TOKEN` don't match. Copy the Script Property value into the GitHub secret (Settings → Secrets and variables → Actions → `ABL_SYNC_TOKEN` → Update). |
| Email **"GitHub refused the update"** or **"token expires in N days"**, or the expiry date in your calendar is near | Renew the token: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` (~10 min). The site still updates every 6 hours meanwhile. |
| Issue **"Website deploy failed"** | Open the linked run, click the red step. If it says lint / tests / content check failed, a recent code or content change broke the build — revert that change or ask the developer. If it was a GitHub outage, **Actions → Deploy to GitHub Pages → Run workflow**. |
| Edited the Sheet, nothing changed after 30 minutes | 1) GitHub → Actions: did **Sync ABL Thumbnails** run? If **no**: in Apps Script run **`showStatus`** and read "Last update request"; run **`testDispatch`** (meanings: `ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` Step 8). If **yes and green**: check **Deploy to GitHub Pages** ran after it and is green; then hard-refresh the page (Ctrl+F5). |
| A photo doesn't show / shows an old photo | The `sheet-needs-attention` issue names the row if Drive couldn't be read. Check the photo link in the Sheet opens for the owner account. Changed photos can take a few minutes to appear (browser cache). |
| Banner in GitHub Actions: "This scheduled workflow is disabled" | Click **Enable workflow**, then **Run workflow**. (GitHub disables schedules after 60 days without activity; the workflow and the Apps Script heartbeat normally prevent this.) |
| Want to republish now | Actions → **Sync ABL Thumbnails** (data/photos) or **Deploy to GitHub Pages** (site code) → **Run workflow**. **Never use "Re-run" on an old run** — use Run workflow. |
| Something looks badly wrong after a change and you need the old version back | Ask the developer to `git revert` the change; every published version is in the repository history. |

## Health checklists

**Monthly (5 minutes)**
- [ ] No open issues labelled `automation-alert` on GitHub.
- [ ] GitHub → Actions → **Sync ABL Thumbnails** shows green runs in the last day.
- [ ] `/pramaan` "Last updated" date matches the last time the Sheet was edited.

**Yearly (30 minutes)**
- [ ] Renew the GitHub token **before** its expiry date (`MAINTENANCE-GITHUB-PAT-REFRESH.md`).
- [ ] Sign in to the Google account that owns the Sheet (Google may delete accounts unused for 2 years).
- [ ] Walk `docs/OPERATIONS-INVENTORY.md`; update anything that changed and the "Last verified" dates.
- [ ] Re-check `docs/PLATFORM-LIMITS.md` against the official pages (limits can change).
- [ ] Check the "Dates to put in a calendar" table in the inventory (Node.js / runner retirements).
- [ ] Repository size (the sync's run summary prints it): act if over 700 MB.

**At a handover (owner changes)**
- [ ] Follow `docs/MIGRATION-OVERVIEW.md` (Google side first, then GitHub).
- [ ] Update GitHub variable `ALERT_ASSIGNEE` and Script Property `ALERT_EMAIL` to the new owner.
- [ ] New owner creates their **own** GitHub token and puts it in `GITHUB_PAT`.
- [ ] New owner changes the `cron:` schedule in `.github/workflows/sync-abl-thumbnails.yml` once — e.g. the minute `17` → `23` — so GitHub's schedule emails go to them (GitHub notifies whoever last changed the cron syntax; a comment edit may not count).
- [ ] Walk `docs/OPERATIONS-INVENTORY.md` together and fill every ⚠️ row.
