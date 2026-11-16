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
| Pramaan Google Sheet | Google Drive; id is in its URL (`/d/<id>/edit`). The id in the old spec is `1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ` | owner's personal Gmail | Tabs with a `UNIQUE ID NO FOR …` header are published; **everything in those tabs becomes public** | 2026-11-15 (live data: 4 tabs, 161 resources) |
| Drive folder(s) with resource photos | Google Drive (linked from the Sheet's photo column) | ⚠️ not recorded — fill in | Photos must stay readable by the script owner; include in any ownership move (`MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` Step 2b) | not verified |
| Apps Script project | Sheet → Extensions → Apps Script (attached to the Sheet) | same as Sheet | Source of truth: `apps-script/abl/Code.gs` in this repo. Deployed version unknown until Phase 2 (`showStatus` prints it) | 2026-11-15 |
| Web App deployment | Deploy → Manage deployments; URL = GitHub secret `VITE_ABL_API_URL` | same | Execute as **Me**, access **Anyone**. Update with **Edit → New version** only (keeps the URL) | 2026-11-15 (URL answers, 161 resources) |
| Drive API advanced service | Apps Script → Services | — | Needed for photo thumbnails; does not copy with the Sheet | not verified |
| Triggers | Apps Script → Triggers | same | v3: exactly `onSheetChange` (On change) + `tick` (every 5 min), installed by `setup()`. Before v3: unknown — sync history shows the edit trigger never fired | 2026-11-15 |
| Script Property `SYNC_TOKEN` | Apps Script → Project Settings | — | Must equal GitHub secret `ABL_SYNC_TOKEN` | not verified |
| Script Property `GITHUB_PAT` | same | — | See "GitHub token" row below | not verified |
| Script Properties `GITHUB_REPO`, `GITHUB_WORKFLOW`, `ALERT_EMAIL`, optional `SHEET_ID`, `GITHUB_REF` | same | — | Values: `docs/ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` Step 4. Other properties are bookkeeping written by the script | Phase 2 pending |
| Contribute Google Form | link = GitHub secret `VITE_ABL_CONTRIBUTE_FORM_URL` | ⚠️ not recorded — fill in | `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md` | see GitHub row: secret not set |
| Pramaan **Library** Sheet (form responses) | id `1-tjqKTutE7TRyG3ziAeFkarKfsOcLs9pKD_f9kQGcSU` | ⚠️ not recorded — fill in | **Holds personal data (cols L–P).** Only rows with Q, R, S = "Yes" are published; L–P never leave the Sheet. Rules: `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md` | 2026-11-16 (header read; 245-row range) |
| Pramaan Library Apps Script + Web App | Sheet → Extensions → Apps Script; URL = GitHub secret `PRAMAAN_LIBRARY_API_URL` | same | Source: `apps-script/pramaan-library/Code.gs`. **Installed and deployed as a web app (v1) on 2026-11-16**; `GITHUB_PAT` / `GITHUB_REPO` / `ALERT_EMAIL` and the `setup` triggers not confirmed yet — `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`. Recommended: its **own** fine-grained token (`pramaan-library-sheet`), not the ABL one. Properties: `SYNC_TOKEN` (= `PRAMAAN_LIBRARY_SYNC_TOKEN`), `GITHUB_PAT`, `GITHUB_REPO`, `ALERT_EMAIL`. Triggers: On change + On form submit + tick | not set up |
| Google account activity | — | owner | Google may delete a personal account after **2 years without sign-in**; sign in at least yearly | — |

## GitHub side

| Item | Where / identifier | Notes | Last verified |
|---|---|---|---|
| Repository | `vaibhav-sharma0105/tide-testing` — **must stay public** (free GitHub Pages requires it) | Owner: `vaibhav-sharma0105` | 2026-11-15 |
| GitHub Pages | Settings → Pages; source **GitHub Actions**; live at https://vaibhav-sharma0105.github.io/tide-testing/ | Environment `github-pages` | 2026-11-15 |
| Workflow `deploy.yml` | `.github/workflows/deploy.yml` | Builds + deploys on every push to `main`; opens an `automation-alert` issue on failure | 2026-11-15 |
| Workflow `sync-abl-thumbnails.yml` | `.github/workflows/sync-abl-thumbnails.yml` — **keep this file name** (the Apps Script calls it by name) | Every 6 h at :17 + when the Sheet changes + manual; commits data + photos, starts the deploy | 2026-11-15 |
| Secret `VITE_ABL_API_URL` | Settings → Secrets and variables → Actions | The Web App URL. Used by the sync (and by the site build until Phase 3) | 2026-11-15 (exists, set 2026-06-06) |
| Secret `ABL_SYNC_TOKEN` | same | Must equal Script Property `SYNC_TOKEN` | 2026-11-15 (exists, set 2026-06-20) |
| Secret `VITE_ABL_CONTRIBUTE_FORM_URL` | same | ⚠️ **Not set** as of 2026-11-15 (`gh secret list`), so the site build receives no form link; the effect on the live Contribute page is not verified here. Fix: `docs/MAINTENANCE-CONTRIBUTE-FORM-LINK.md` | 2026-11-15 |
| Workflow `sync-pramaan-library.yml` | `.github/workflows/sync-pramaan-library.yml` — **keep this file name** | Every 6 h at :47 + when the library Sheet changes; own concurrency group `pramaan-library-sync`. Skipped quietly only while its secrets are missing **and** the committed snapshot has no rows — once rows are committed, missing secrets fail loudly (alert issue every run), so add the secrets before pushing | 2026-11-16 (local only) |
| Secrets `PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN` | Settings → Secrets and variables → Actions | **Not set yet** (setup guide Step 6) | 2026-11-16 |
| Variable `ALERT_ASSIGNEE` | Settings → Secrets and variables → Actions → **Variables** | GitHub username alert issues are assigned to (emails them). Currently `vaibhav-sharma0105` | 2026-11-15 |
| GitHub token (fine-grained PAT) used by the Apps Script | Owner's GitHub → Settings → Developer settings → Fine-grained tokens | Only this repository; **Actions: Read and write**; nothing else. **Expiry date: ⚠️ not recorded — fill in, and put it in a calendar.** (v3 also emails 30/7/1 days before *if* GitHub reports the date — not documented, so don't rely on it.) Renew: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` | not verified |
| Who receives schedule-failure emails | GitHub sends them to the last person who edited the `cron:` line | After a handover the new owner changes the schedule once (e.g. minute `17` → `23`) | — |
| Labels `automation-alert`, `sheet-needs-attention` | Issues → Labels | Created by the workflows | 2026-11-15 |

## Bot-owned files (never edit by hand)

| Path | Written by |
|---|---|
| `src/data/sheets/abl-resources.json` | the sync (Pramaan data snapshot) |
| `src/data/abl-thumbnails-manifest.json` | the sync (photo list) |
| `public/assets/images/abl/*.webp` | the sync (photos) |
| `src/data/sheets/pramaan-library.json`, `src/data/pramaan-library-photos.json`, `public/assets/images/pramaan-library/*` | the Pramaan Library sync |
| `src/data/*.json` (others) | `scripts/yaml-to-json.js` from `content/` |

## Dates to put in a calendar

| When | What | Action |
|---|---|---|
| PAT expiry (⚠️ fill in) | GitHub token stops working | Renew 2 weeks before (`MAINTENANCE-GITHUB-PAT-REFRESH.md`) |
| ~2027-01 | Two months after the snapshot switch | Token-gate the old public data link (plan §8) |
| Yearly | Health review | `docs/OPERATIONS-RUNBOOK.md` → yearly checklist |
| 2028-04 | Node.js 24 end of life | Bump `node-version` in both workflows |
| ~2029 | `ubuntu-24.04` runner retirement (GitHub announces dates) | Bump `runs-on` in both workflows |
