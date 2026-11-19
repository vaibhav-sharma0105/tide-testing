# Operations Inventory — everything the website depends on

> **The single list** of every account, file, script, trigger, workflow, secret and expiry date
> behind the live site. Walk it row by row at a handover and once a year. **No secret values
> here** (this repository is public) — only names and where they live.
>
> When something changes, update the row and its **Last verified** date. Related: what to do when
> something breaks → `docs/OPERATIONS-RUNBOOK.md`; free-tier limits → `docs/PLATFORM-LIMITS.md`;
> moving everything to a new owner → `docs/MIGRATION-OVERVIEW.md`.

**Current owner of record:** GitHub `vaibhav-sharma0105` (to be replaced at the stakeholder
handover). Last full review: 2026-11-15.

## Google side

| Item | Where / identifier | Owner account | Notes | Last verified |
|---|---|---|---|---|
| Contribute Google Form | link in `content/pages/abl-contribute.yaml` → `formUrl` (not a secret) | ⚠️ not recorded — fill in | Should feed the Resource Centre Sheet below. Change it: `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md` | 2026-11-19 (link set in YAML) |
| Drive folder(s) with resource photos | Google Drive (linked from the Sheet's photo column) | ⚠️ not recorded — fill in | Photos must stay readable by the script owner; include in any ownership move (`MIGRATION-GOOGLE-SHEET-APPSCRIPT.md`) | not verified |
| **Resource Centre Sheet** ("Contributing to Pramaan; Educators' Resource Bank (Responses)", the Pramaan Library) | id `1-tjqKTutE7TRyG3ziAeFkarKfsOcLs9pKD_f9kQGcSU` | ⚠️ not recorded — fill in | **Holds personal data (cols L–P).** Only rows with Q, R, S = "Yes" are published; L–P never leave the Sheet. Rules: `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md` | 2026-11-16 (header read; 245-row range) |
| Resource Centre Apps Script + Web App | Sheet → Extensions → Apps Script; URL = GitHub secret `PRAMAAN_LIBRARY_API_URL` | same | Source: `apps-script/pramaan-library/Code.gs`. **Installed and deployed as a web app (v1) on 2026-11-16**; `GITHUB_PAT` (its own fine-grained token `pramaan-library-sheet`, created 2026-11-16 with a 1-year expiry per the setup steps — exact date ⚠️ not recorded), `GITHUB_REPO`, `ALERT_EMAIL` and the `setup` triggers ("notify immediately") set by the owner on 2026-11-16; `testDispatch` → HTTP 204. Setup: `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`. Properties: `SYNC_TOKEN` (= `PRAMAAN_LIBRARY_SYNC_TOKEN`), `GITHUB_PAT`, `GITHUB_REPO`, `ALERT_EMAIL`. Triggers: On change + On form submit + tick | 2026-11-16 (owner) |
| Google account activity | — | owner | Google may delete a personal account after **2 years without sign-in**; sign in at least yearly | — |

## GitHub side

| Item | Where / identifier | Notes | Last verified |
|---|---|---|---|
| Repository | `vaibhav-sharma0105/tide-testing` — **must stay public** (free GitHub Pages requires it) | Owner: `vaibhav-sharma0105` | 2026-11-15 |
| GitHub Pages | Settings → Pages; source **GitHub Actions**; live at https://vaibhav-sharma0105.github.io/tide-testing/ | Environment `github-pages` | 2026-11-15 |
| Workflow `deploy.yml` | `.github/workflows/deploy.yml` | Builds + deploys on every push to `main`; opens an `automation-alert` issue on failure | 2026-11-15 |
| Workflow `sync-pramaan-library.yml` | `.github/workflows/sync-pramaan-library.yml` — **keep this file name** (the Apps Script calls it by name) | Every 6 h at :47 + when the library Sheet changes; own concurrency group `pramaan-library-sync`. Skipped quietly only while its secrets are missing **and** the committed snapshot has no rows — once rows are committed, missing secrets fail loudly (alert issue every run), so add the secrets before pushing. First green run 2026-11-16 (`43867768722`); after the owner's Sheet update, **243 resources published** (run `43874559074`, 2026-11-16) | 2026-11-16 |
| Secrets `PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN` | Settings → Secrets and variables → Actions | Set 2026-11-16 (`gh secret list`, names only) | 2026-11-16 |
| Variable `ALERT_ASSIGNEE` | Settings → Secrets and variables → Actions → **Variables** | GitHub username alert issues are assigned to (emails them). Currently `vaibhav-sharma0105` | 2026-11-15 |
| GitHub token (fine-grained PAT) used by the Resource Centre Apps Script (`pramaan-library-sheet`) | Owner's GitHub → Settings → Developer settings → Fine-grained tokens | Only this repository; **Actions: Read and write**; nothing else. **Expiry date: ⚠️ not recorded — fill in, and put it in a calendar** (created 2026-11-16 with a 1-year expiry per the setup steps). The script also emails before expiry *if* GitHub reports the date — not documented, so don't rely on it. Renew: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` | not verified |
| Who receives schedule-failure emails | GitHub sends them to the last person who edited the `cron:` line | After a handover the new owner changes the schedule once (e.g. minute `47` → `53`) | — |
| Labels `automation-alert`, `sheet-needs-attention` | Issues → Labels | Created by the workflows | 2026-11-15 |

## Bot-owned files (never edit by hand)

| Path | Written by |
|---|---|
| `src/data/sheets/pramaan-library.json`, `src/data/pramaan-library-photos.json`, `public/assets/images/pramaan-library/*` | the Resource Centre sync (`scripts/sync-pramaan-library.js`) |
| `src/data/*.json` (others) | `scripts/yaml-to-json.js` from `content/` |

## Dates to put in a calendar

| When | What | Action |
|---|---|---|
| PAT expiry (⚠️ fill in) | GitHub token stops working | Renew 2 weeks before (`MAINTENANCE-GITHUB-PAT-REFRESH.md`) |
| Yearly | Health review | `docs/OPERATIONS-RUNBOOK.md` → yearly checklist |
| 2028-04 | Node.js 24 end of life | Bump `node-version` in both workflows (`deploy.yml`, `sync-pramaan-library.yml`) |
| ~2029 | `ubuntu-24.04` runner retirement (GitHub announces dates) | Bump `runs-on` in both workflows |

## Retired — no longer used by the website (since 2026-11-19)

The former Resource Centre was replaced by the Pramaan Library (`docs/PRAMAAN-HARDENING-PLAN.md` §13). Its
code is deleted from the repository (kept in the local git tag `archive/pramaan-live-read`). By owner
decision these were **left as they are** — nothing in the repository reads them; remove them whenever
convenient:

| Item | Where | Note |
|---|---|---|
| Old Pramaan Google Sheet (4 tabs, 161 resources on 2026-11-15) | Google Drive, id `1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ` (from the old spec) | Keep as an archive; all 161 ids also exist in the Resource Centre Sheet |
| Its Apps Script project, triggers and Web App deployment | Sheet → Extensions → Apps Script | The web app's public listing (no token) stays reachable by anyone with its URL until the deployment is archived (Deploy → Manage deployments → Archive). Removing its triggers stops any requests to GitHub |
| Its GitHub token (fine-grained PAT) | Owner's GitHub → Developer settings | Can be deleted once the script's triggers are removed |
| GitHub secrets `VITE_ABL_API_URL`, `ABL_SYNC_TOKEN`, `VITE_ABL_CONTRIBUTE_FORM_URL` | Settings → Secrets and variables → Actions | Not read by any workflow |
