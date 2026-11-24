# Platform Limits (free tiers) — and what they mean for this site

> Reference for anyone changing the Google Sheet → Apps Script → GitHub → GitHub Pages pipeline.
> Numbers are copied from the official pages listed at the bottom, read on **2026-11-14/15**.
> Google and GitHub say limits can change without notice — re-check the sources once a year
> (it is on the yearly checklist in `docs/OPERATIONS-RUNBOOK.md`).

## The short version

- **Visitors should never depend on Google at page-view time.** Apps Script allows only
  **30 executions at the same moment** for the account the script runs as, and each live call
  takes ~2 seconds. That is why every Pramaan page reads a snapshot built into the site (since
  2026-11-19; `docs/PRAMAAN-HARDENING-PLAN.md` §13), and so do the Publications and Partners pages.
- **The GitHub repository must stay public.** On a free account, GitHub Pages only works for
  public repositories. Secrets stay safe in GitHub Actions secrets; everything committed is public.
- **The one long-term thing to watch is repository size** — git keeps every old version of every
  photo forever. About 94 MB on 2026-11-19 (GitHub API `size`: 95,974 KB); act at ~700 MB.

---

## Google Apps Script (personal Gmail account)

| Limit | Personal Gmail | Google Workspace | What it means here |
|---|---|---|---|
| Executions at the same moment | 30 per user | 30 per user | With "Execute as: Me", **every visitor runs as the owner**, so they share these 30 slots. A traffic spike can exceed it. Snapshot mode takes visitors off this path. |
| Executions per script at the same moment | 1,000 | 1,000 | Not reached; the per-user limit above bites first. |
| Web app requests per day | not published | not published | Google publishes no daily cap. |
| Time per execution | 6 min | 6 min | The sync's export must finish well inside this (alert above 120 s). |
| Trigger run time, total per day | 90 min | 6 hours | Edit/tick triggers use < 5 min on a heavy day (Resource Centre script; the Publications and Partners scripts have the same design — not measured yet). Scripts running under one Google account share this daily total. |
| Installable triggers | 20 per user per script | 20 per user per script | Resource Centre (Pramaan Library) Sheet: 3 (On change, On form submit, 5-minute tick). Publications Sheet and Partners Sheet: the same 3 each (separate scripts). |
| URL Fetch calls per day | 20,000 | 100,000 | Dispatches to GitHub; < 350 on a heavy day. |
| URL Fetch response size | 50 MB per call | 50 MB per call | Not relevant. |
| Script Properties reads/writes per day | 50,000 | 500,000 | Debounce bookkeeping; ~3–4k on a heavy day. |
| Script Property value size | 9 KB per value | 9 KB per value | Tokens and timestamps only. |
| Script Properties total | 500 KB per store | 500 KB per store | Fine. |
| CacheService value size | 100 KB per key | 100 KB per key | Large data must be split. The Resource Centre script's photo map is one key — about 1,500 IDs fit; beyond that photo requests re-read the Sheet (slower, still works). |
| CacheService longest expiry | 6 hours | 6 hours | The Resource Centre, Publications and Partners scripts keep their photo maps 30 minutes (`PHOTO_CACHE_S` = 1800). |
| CacheService items | 1,000 (oldest dropped beyond that) | same | Fine. |

Quotas reset 24 hours after the first request. Google may delete a personal account after
**2 years of inactivity** — the owner must sign in at least yearly.

## GitHub Pages (free account)

| Limit | Value | This site today | Verdict |
|---|---|---|---|
| Repository visibility | **Public required** on GitHub Free | Public | Must stay public |
| Published site size | 1 GB | 65 MB built site on 2026-11-24 (`du -sh dist`, base-path build with 265 prerendered HTML files); 49 MB on 2026-11-19, of which Resource Centre photos 33 MB / 400 files (~85 KB each). The former Pramaan photos (29 MB) were removed from the site that day | Room for several thousand more photos |
| Bandwidth | 100 GB / month (soft) | not measured; a few MB per visit | Tens of thousands of visits/month |
| Builds per hour | 10 / hour (soft) | **does not apply** — we deploy with a custom Actions workflow | OK |
| Deploy timeout | 10 minutes | ~1–2 minutes | OK |
| Rate limiting | may return HTTP 429; no number published | — | If ever hit, put a free CDN in front |
| Use | not for commercial sites, shops or SaaS; no passwords/card data | NGO information site | OK |

## GitHub repository

| Limit | Value | This repo today | Verdict |
|---|---|---|---|
| Recommended size | ideally < 1 GB, strongly < 5 GB | ~94 MB of history (2026-11-19; deleting the former Pramaan photos does not shrink it — they stay in history) | Watch it; alert at 700 MB |
| File size | warning at 50 MB, **blocked at 100 MB** | largest file < 2 MB | OK |
| Browser upload size | 25 MB per file | — | Use git for anything larger |

**Why history grows:** every replaced photo stays in git history forever (public). Remedy if it
ever gets close: move photo history to a separate assets repository.

## GitHub Actions (free account)

| Limit | Value | What it means here |
|---|---|---|
| Cost for public repositories | **free, unlimited** on standard runners | Our syncs and deploys cost nothing |
| Cost if the repo became private | $12/month of included compute (≈ 2,000 Linux minutes — derived, not quoted) | Since 2026-11-24 the deploy also prerenders and runs browser tests, and a nightly test run (up to 45 min) was added — neither measured on GitHub yet; a private repo would need that re-checked. Pages would stop working on Free anyway |
| Job run time | 6 hours per job | Sync ~1–2 min; deploy build: prerender ~1 min + built-site tests ~2 min locally (not measured on GitHub); nightly job capped at 45 min |
| Concurrent jobs | 20 (Free plan) | We run 1–3 at a time (deploy, a sync, the nightly tests) |
| `GITHUB_TOKEN` API calls | 1,000 per hour per repository | A handful per sync |
| Trigger events | 1,500 per 10 s per repository | Not reached |
| Scheduled workflows | **auto-disabled after 60 days without repository activity** (public repos) | Handled by the keep-alive commit + the Apps Script daily heartbeat |
| Artifact storage | 500 MB | Only when browser tests fail: their report and traces (deploy: kept 14 days) |
| Cache storage | 10 GB per repository | npm cache + the Playwright browsers (deploy: Chromium; nightly: three browsers) |
| A push made with `GITHUB_TOKEN` | does **not** start other workflows | That is why the sync starts the deploy explicitly |

## Sources
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/cache/cache
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions
- https://docs.github.com/en/actions/using-workflows/disabling-and-enabling-a-workflow
