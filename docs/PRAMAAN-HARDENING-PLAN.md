# Pramaan Hardening + Snapshot Mode — Work Plan and Checklist

> **Start here in a new conversation.** This file is self-contained: it records why this work
> exists, the evidence, every decision, the detailed design, and a checklist of what is done and
> what is left. Update the checklist (section 9) as items are completed — tick the box and add
> the commit hash.
>
> **Status (2026-11-19):** sections 1–11 describe the *former* Pramaan Resource Centre (old Sheet, live
> read through `useABLData`, `sync-abl-thumbnails.yml`). That setup was **replaced by the Pramaan Library
> and its code deleted** — see section 13. Sections 1–11 are kept as the history of the decisions; the
> files they name are in the local git tag `archive/pramaan-live-read`. Phase 2/3 of section 9 will not
> be done.
>
> Opened: 2026-11-15. Owner of record (until the stakeholder handover): GitHub user
> `vaibhav-sharma0105`. Platform limits referenced here are in `docs/PLATFORM-LIMITS.md`.

---

## 1. Why this work exists (one paragraph)

Pramaan (the ABL resource library at `/pramaan`) reads its resource data **live from a Google
Apps Script Web App in every visitor's browser** (`src/hooks/useABLData.js`), while its photos are
copied into the repo by a GitHub Actions job (`scripts/sync-abl-thumbnails.js`,
`.github/workflows/sync-abl-thumbnails.yml`). The owner wants the site to stay fast, reliable and
free for decades, to survive a handover to a new owner, and to become the template for more
Google-Sheet-backed sections. We decided to move Pramaan to **snapshot mode** (the data is saved
into the site at sync time, so visitors never call Google) and to fix the pipeline gaps found by
an architecture review.

## 2. Verified evidence (checked against GitHub on 2026-11-15)

| Finding | Evidence |
|---|---|
| **No sync has ever been started by a Sheet edit** — the "instant" path never worked | `gh run list --workflow sync-abl-thumbnails.yml --limit 300` → `schedule: 83`, `workflow_dispatch: 5`, **zero** `repository_dispatch` |
| The daily safety-net sync runs **5–8 hours late** | cron is `0 2 * * *` (02:00 UTC); last five runs started 08:50–09:37 UTC. GitHub delays/drops top-of-the-hour schedules |
| The "redeploy after sync" step has **never run** | `gh run list --workflow deploy.yml --event workflow_dispatch` → 0 runs |
| Only 2 sync commits ever | `742d0ad`, `44542c5` (both 2026-06-20) |
| Live data call cost | anonymous call to the Apps Script: 302 → 200, 108 KB JSON, ~2 s, `Access-Control-Allow-Origin: *` |
| Repo sizes | public repo; published site 45 MB; ABL photos 29 MB / 318 files; git pack 84 MB |

Likely causes of the dead instant path (to be confirmed in Phase 2, step G1): the `onSheetChange`
trigger was never installed, the deployed Apps Script is an older version, or the PAT lacks the
permission the `/dispatches` call needs.

## 3. The two gaps the owner asked to fix

1. **Stale read.** `onSheetChange` dispatches but never clears the Apps Script `CacheService`
   cache (15-minute TTL), so the sync can read pre-edit data.
2. **Dropped edits.** The 2-minute debounce returns early and never fires again, so a second
   burst of edits waits for the next scheduled run (up to ~32 h counting cron delay).

## 4. Full risk list from the architecture review (ranked)

Severity: **C** critical · **H** high · **M** medium · **L** low. "Fix" = the agreed resolution.

| # | Risk | Failure scenario | Fix |
|---|---|---|---|
| C1 | Instant Sheet→GitHub path never fired | Editor adds a resource; nothing happens for 8–32 h; nobody told | Diagnose (G1); switch dispatch to the **workflow_dispatch** REST endpoint (`POST /repos/{owner}/{repo}/actions/workflows/{file}/dispatches`, body `{"ref":"main"}`), which needs the PAT permission **Actions: Read and write** (matches existing docs); file name in Script Property `GITHUB_WORKFLOW` |
| C2 | **Photos can be mass-deleted**: `handleManifest` drops ids whose Drive lookup errors; the sync deletes every local id missing from the manifest | One Drive hiccup or an account migration wipes all 318 thumbnails, committed and deployed | Deletions driven by the **snapshot rows**, not the manifest: delete only if the row is gone or its photo is empty. A Drive error keeps the old photo. Refuse to delete more than `max(10, 20%)` of photos in one run |
| C3 | Nothing validates data before publishing (snapshot mode) | A renamed column header publishes a broken library | Two-tier validation (section 6.3); structural failure keeps the last good snapshot and fails the run |
| C4 | Gap 1 (stale read) | Sync commits pre-edit data | Token-gated `?action=export` always reads fresh; edits clear the cache (section 6.1) |
| C5 | Gap 2 (dropped edits) | Second edit burst waits up to ~32 h | Leading + trailing debounce flushed by a 5-minute tick (section 6.2) |
| H1 | Trigger is "On edit": ignores row/tab insert, delete, rename | A deleted resource stays live | Use an **"On change"** installable trigger, installed by a `setup()` function |
| H2 | Failures are invisible (bot-started runs notify nobody; per-photo errors only warn) | Pipeline broken for months unnoticed — today's state | Any failure opens/updates a **GitHub Issue assigned to the owner** (label `automation-alert`), auto-closed on next success; Apps Script emails the owner (max 1 per 24 h) |
| H3 | `git push` in the sync has no retry | A human push during a sync loses that update | Push retry loop: fetch + rebase + retry up to 5 times |
| H4 | Scheduler unreliable (late; disabled after 60 days of no activity) | Safety net silently stops | Cron `17 */6 * * *` (4×/day, off the hour); keep the keep-alive commit; Apps Script sends one heartbeat dispatch per day (independent second scheduler) |
| H5 | PAT expiry is silent | Instant path dies on the expiry date | Record expiry (from the `GitHub-Authentication-Token-Expiration` response header if present — *unverified*); email at 30/7/1 days; the sync opens an issue under 21 days. PAT is created under the **owner's** account |
| H6 | Ownership gaps: `SHEET_ID` hardcoded; Drive photos folder not in any migration doc; schedule emails go to whoever last edited the cron line; Google deletes personal accounts inactive 2 years | After handover photos break or nobody is notified | `getActiveSpreadsheet()` (script is bound to the Sheet) with `SHEET_ID` property fallback; migration steps for Drive folder ownership and a trivial cron-line edit by the new owner; "sign in yearly" in the health checklist |
| H7 | No handling for stale code chunks after a deploy | A visitor with an old tab open sees the crash screen | `vite:preloadError` listener in `src/main.jsx`: reload once (sessionStorage guard) |
| H8 | Apps Script code lives only inside a markdown doc; triggers run "Head" code while the web app runs the deployed version | Code drift nobody can detect | Move the code to `apps-script/abl/Code.gs`; `SCRIPT_VERSION` constant returned by the export; the sync fails with "Apps Script outdated" if too old; CI runs `node --check` on it |
| M1 | Tabs chosen by deny-list; id header hardcoded to 4 names; setup guide wrongly says new tabs are picked up automatically | A new "Posters" tab silently publishes nothing; a Form-responses tab could publish personal data | Include a tab only if its header row has a cell matching `/^UNIQUE ID NO FOR /i` (and it is not in `SKIP_SHEETS`); report excluded tabs |
| M2 | Snapshot churn if it stores a volatile timestamp | A commit + deploy on every run | Snapshot stores a `contentHash`; `lastUpdated` changes only when the hash changes |
| M3 | Duplicate ids | Photos flip-flop and re-download every run | Keep the first occurrence, drop and report the rest |
| M4 | Photo change detection uses `modifiedTime` only | Re-pointing a row to a different (older) file is missed | Manifest stores `fileId`; re-sync if `fileId` or `modifiedTime` changes |
| M5 | Supply chain: `npm ci` runs install scripts while a write token is in `.git/config` | A compromised dependency pushes to `main` | `npm ci --ignore-scripts` (verify sharp still works); `permissions: {}` at top, granted per job; secrets only in the sync step's env |
| M6 | Git history keeps every photo/data version forever (public) | Repo grows; a private detail cannot be scrubbed without a history rewrite | Keep the field allowlist; editor guide says "everything in the Sheet becomes public forever"; report repo size each run, alert above 700 MB |
| M7 | `deploy.yml` uses `cancel-in-progress: true` and builds `github.sha` | A deploy killed mid-flight; a "Re-run" republishes an old commit | `cancel-in-progress: false`; always check out `main` HEAD |
| M8 | Runner `ubuntu-24.04` / Node 24 will retire (Node 24 EOL 2028-04) | Guaranteed breakage some day | Put retirement dates in the inventory; failure opens an issue (H2) |
| M9 | Export calls Drive once per resource; 100 KB cache per tab | Slows near ~1,000+ resources | Log export duration, alert above 120 s; optimise later |
| M10 | Sheet URLs not scheme-validated | A `javascript:` or junk link is published | Sync nulls any non-`http(s)` URL and reports it |
| L1 | Token in query string; non-constant-time compare | Token in Google-side logs | Later: move to `doPost` |
| L2 | Ids with spaces / case-only collisions | Odd filenames | Later |
| L3 | Doc drift (e.g. spec says lint not in CI — it is) | Misleading docs | Fix during the doc pass |
| L4 | `allResources` recomputed every render | Minor waste | Memoise at module level (comes free with snapshot mode) |
| L5 | Public Apps Script read stays open after visitors stop using it | Abusable against the 30-simultaneous-executions limit | ~2 months after the switch, token-gate it |

## 5. Target architecture (after this work)

```
Google Sheet ──(On change trigger + 5-min tick, Apps Script)──► GitHub workflow_dispatch
                                                                     │
                       sync job (GitHub Actions, every edit burst + every 6 h)
                       ├─ GET ?action=export&token=…   (fresh read: data + photo list)
                       ├─ validate → keep last good on structural failure
                       ├─ download changed photos → WebP (sharp)
                       ├─ write src/data/sheets/abl-resources.json  (snapshot)
                       ├─ write src/data/abl-thumbnails-manifest.json
                       ├─ ONE commit (data + photos) → push with retry
                       └─ start deploy.yml ──► GitHub Pages
Visitors ──► static site only (snapshot bundled into the Pramaan pages). No Google call.
Failures ──► GitHub Issue assigned to the owner (+ Apps Script email for token problems)
```

## 6. Detailed design (decisions, so a new conversation does not redo the analysis)

### 6.1 Stale-read fix (gap 1)
- New token-gated `?action=export`: always does a **fresh** Sheet read (also re-primes the cache)
  and builds the photo list **from the same read**. Returns
  `{success, schemaVersion, scriptVersion, tabs, resources, meta, photos:[{id,fileId,modifiedTime}|{id,fileId,error}], excludedTabs, health}`.
- `handleFetchImage`: on "unknown id", do one fresh read before refusing.
- `onSheetChange`: clear the cache keys (meta + per-tab).
- Remove the 15-minute `scheduledRefresh` trigger (visitors no longer read the cache).

### 6.2 Dropped-edits fix (gap 2) — leading + trailing debounce, flushed by a 5-minute tick
Script Properties: `LAST_DISPATCH_AT`, `PENDING_SINCE`, `LAST_EDIT_AT`, `BLOCKED_UNTIL`,
`LAST_DISPATCH_STATUS`, `PAT_EXPIRES_AT`, `LAST_ALERT_AT`.
```
onSheetChange(e):                       // installable "On change" trigger
  clear cache; LAST_EDIT_AT = now
  lock (tryLock 5 s) — if busy: set PENDING_SINCE if absent; return
  if no PENDING_SINCE and now-LAST_DISPATCH_AT >= 2 min and now >= BLOCKED_UNTIL:
      LAST_DISPATCH_AT = now; unlock; dispatch()
  else: set PENDING_SINCE if absent; unlock

tick():                                 // time-driven, every 5 minutes
  lock or return
  if PENDING_SINCE and now >= BLOCKED_UNTIL and
     (now-LAST_EDIT_AT >= 2 min or now-PENDING_SINCE >= 10 min):
      snap = LAST_EDIT_AT; LAST_DISPATCH_AT = now; unlock; dispatch(snap)
  once a day (UTC hour 3): heartbeat dispatch + PAT-expiry email check

dispatch(snap): POST workflow_dispatch (muteHttpExceptions)
  204 → under lock: clear PENDING_SINCE only if LAST_EDIT_AT == snap; record expiry header; status
  401/403/404 → keep PENDING_SINCE; BLOCKED_UNTIL = now+1 h; email owner (max 1 per 24 h)
  5xx/exception → keep PENDING_SINCE; retried on next tick
```
Latency: single edit ≈ seconds + run; a burst ≈ 2–7 min after the last edit + run; during constant editing ≤ ~15 min (10-min max wait, checked by the 5-minute tick — verified by the simulated test in `src/test/scripts/appsScript.test.js`). Quota on a heavy 500-edit day:
under 5 trigger-minutes (limit 90), under 350 URL fetches (limit 20,000), ~3–4k property ops
(limit 50,000), 2 installed triggers (limit 20). `setup()` deletes any `onSheetChange` / `tick` /
`scheduledRefresh` / legacy "On edit" triggers and recreates exactly two; safe to re-run.
Rejected: one-off `after()` triggers (can leak, hit the 20-trigger cap); dispatch on every edit
(floods the Actions tab).

### 6.3 Snapshot mode
- **File:** `src/data/sheets/abl-resources.json` (sub-folder cannot collide with the flat
  YAML→JSON output of `scripts/yaml-to-json.js`). Bot-owned; never hand-edit.
- **Schema (deterministic order, 2-space indent, trailing newline):**
  `{schemaVersion:1, section:"abl", success:true, lastUpdated, contentHash:"sha256:…", tabs, resources:{tab:[…]}, meta:{counts, total}}`
  — keeps today's payload shape (`success`, `tabs`, `resources`, `meta`) so the pages work unchanged.
- **Validation** (one module `scripts/lib/abl-snapshot.js`, shared by the sync, `content:validate`
  and unit tests):
  - *Refuse, keep last good, fail the run:* bad shape or `success:false`; Apps Script version too
    old; 0 tabs or 0 rows; rows removed > `max(10, 20%)`; a tab with ≥5 rows disappears or drops
    >50%; `name` empty in >10% of rows; photo deletions > `max(10, 20%)`; snapshot > 2 MB.
    Override: workflow input `allow_large_change` (Actions → Run workflow → tick the box).
  - *Publish but report in a `sheet-needs-attention` issue:* duplicate id (keep first); missing
    id or name (drop row); non-`http(s)` URL (set null); unsafe id (publish without photo); photo
    fetch error (keep old photo); excluded tabs.
- **Client:** `useABLData.js` **imports the snapshot statically** (lands in the lazily loaded,
  content-hashed Pramaan chunk; atomic with the already-bundled thumbnail manifest; no spinner).
  Returns the same shape `{ data, allResources, loading:false, error:null, lastUpdated, refetch }`.
  **No runtime fallback** to the live API (it would bring back latency, quotas and data/photo
  mismatch). Rollback = `git revert` of the switch commit.
- `VITE_ABL_API_URL` is removed from the deploy build env and the client; the secret stays for
  the sync job only.
- "Last synced" on `/pramaan` now means "last content change" (YAML label `stats.lastSynced` may
  be renamed by the owner).

### 6.4 Workflows
- **Sync:** triggers `workflow_dispatch` (input `allow_large_change`), legacy
  `repository_dispatch`, `schedule: '17 */6 * * *'`; no `pull_request`. `permissions: {}` at top;
  job gets `contents: write`, `actions: write`, `issues: write`. `concurrency: {group: sheet-sync,
  cancel-in-progress: false}` (one group for all future sections). Steps: checkout
  (`fetch-depth: 0`) → `npm ci --ignore-scripts` → sync (secrets only here) → commit only if
  changed → push with retry → start deploy if changed → upsert/close the problems issue →
  `if: failure()` alert issue → keep-alive (schedule only, no commit this run, last commit ≥45 days).
- **Deploy:** `cancel-in-progress: false`; check out `main` HEAD always; failure issue; drop
  `VITE_ABL_API_URL` from the build env; remove the warning at `vite.config.js`.
- Repo variable `ALERT_ASSIGNEE` = GitHub username that alert issues are assigned to
  (currently `vaibhav-sharma0105`).

### 6.5 Observability for a non-technical owner
Signals: GitHub Issue assigned to the owner (`automation-alert` = broken,
`sheet-needs-attention` = fix these rows); Apps Script email (token/dispatch problems; address in
Script Property `ALERT_EMAIL` — not recorded in this public repo); Google's trigger-failure
emails set to "immediately"; "Last updated" on `/pramaan`; the Actions job summary.

### 6.6 Generalising for future Sheet-backed sections (kept small now)
Apps Script as a reusable kernel (`export`, `fetchImage`, dispatch/tick/setup, health) with one
`SECTION` config block. Sync as `scripts/sheets/run.js` + `scripts/sheets/sections.js` (array of
`{name, urlEnv, tokenEnv, dataOut, mediaOut, mediaDir, validate, thresholds}`), Pramaan the only
entry for now. One sync workflow, one concurrency group, one PAT for all sections; per-section
`<SECTION>_SYNC_TOKEN` and URL secrets. Update `.claude/skills/sheet-integration/SKILL.md`
(it still prescribes the runtime hook and the leading-only debounce).

## 7. Values and where they live (no secret values in this file)

| Item | Where | Current |
|---|---|---|
| GitHub alert assignee | repo variable `ALERT_ASSIGNEE` | `vaibhav-sharma0105` (to be replaced at stakeholder handover) |
| Apps Script alert email | Script Property `ALERT_EMAIL` | the owner's email — set in Apps Script only, never committed |
| Workflow file for dispatch | Script Property `GITHUB_WORKFLOW` | `sync-abl-thumbnails.yml` |
| Repo for dispatch | Script Property `GITHUB_REPO` | `vaibhav-sharma0105/tide-testing` |
| PAT for dispatch | Script Property `GITHUB_PAT` | fine-grained, this repo only, Actions: Read and write |
| Sync token | Script Property `SYNC_TOKEN` + GitHub secret `ABL_SYNC_TOKEN` | must match |
| Apps Script URL | GitHub secret `VITE_ABL_API_URL` | sync job only after the switch |

## 8. Deferred to later (deliberately not in this round)

These are real but low-risk improvements. "Deferred" means: **not needed for the system to be
safe and reliable now; do them when the trigger condition is met or during a quiet period.** Each
has a trigger so it is not forgotten.

| Item | What it means in plain words | Do it when |
|---|---|---|
| Pin GitHub Actions by exact version (SHA) + Dependabot | Lock the third-party building blocks our workflows use to an exact fingerprint so nobody can swap them; a bot proposes safe updates | Next maintenance session; before handover |
| Weekly/daily watchdog | Apps Script checks GitHub once a day and emails if no successful sync for 48 h | If alerts ever fail to arrive, or at handover |
| Photo cache-busting (`?v=`) | Changed photos show immediately instead of after the browser/Pages cache expires (~minutes) | If editors complain about seeing old photos |
| Token-gate the public Apps Script read | Close the old public data link visitors no longer use | ~2 months after the snapshot switch (≈ 2027-01) |
| Generic multi-section sync config / one shared "bridge" script | Make adding a new Sheet section a config entry, not new code | When the 2nd Sheet section is built |
| Split the snapshot | Separate card list from full details to keep pages light | When the snapshot passes ~500 KB (today ~108 KB) |
| Separate assets repository | Move photo history out of the main repo | When the repo passes ~700 MB (today 84 MB) |
| GitHub App instead of a PAT | Removes the need to renew a token every year | If PAT renewal becomes a burden |
| Move the sync token to POST / constant-time compare (L1) | Keeps the token out of Google-side request logs | Next Apps Script revision after this one |

## 9. Checklist

Legend: `[x]` done (with commit) · `[ ]` to do · **(OWNER)** needs the owner's hands.

### Phase 0 — Analysis (done)
- [x] Architecture review completed and findings verified against GitHub (2026-11-15)
- [x] This plan and `docs/PLATFORM-LIMITS.md` written
- [x] Owner provided: GitHub username (`vaibhav-sharma0105`) and alert email (kept out of the repo)

### Phase 1 — Repository side (developer; nothing changes on Google yet)
- [x] 1.1 *(local, 2026-11-15; 16 simulated-Google tests in `src/test/scripts/appsScript.test.js`)* Move Apps Script code into `apps-script/abl/Code.gs` (v3 per sections 6.1–6.2, H1, H5, H6, H8, M1), with `SCRIPT_VERSION`; CI `node --check`; docs link to it
- [x] 1.2 *(local, 2026-11-15; run end to end against a stand-in API serving the real live data: 161 resources, 159 photo fileIds back-filled with 0 downloads and 0 deletions, second run a no-op, Drive failures kept photos, a vanished tab was refused with no file changed, override worked)* Sync refactor: pure planner + validator module (`scripts/lib/abl-snapshot.js`), snapshot writing, snapshot-driven deletions (C2), `fileId` in manifest (M4), duplicate handling (M3), URL scheme check (M10), problem report, `allow_large_change` override. **Must work with both the current Apps Script (public read + manifest) and v3 (`export`)** so nothing breaks before Phase 2
- [x] 1.3 *(30 tests, `src/test/scripts/ablSnapshot.test.js`)* Unit tests for planner/validator (one test per threshold, deletion semantics, idempotency)
- [x] 1.4 *(local; YAML parses; `scripts/ci/alert-issue.sh` tested against a verified fake `gh`; sharp 0.35.2 has no install script and its linux-x64 prebuilds are in the lockfile, so `--ignore-scripts` is safe)* Sync workflow per section 6.4 (cron, push retry, `--ignore-scripts` verified, permissions, issues, input)
- [x] 1.5 *(local)* `deploy.yml` per section 6.4 (no-cancel, newest `main`, `notify` job) and the `content:validate` snapshot guard (tested with a valid and a corrupted snapshot). **Moved to 3.2:** removing `VITE_ABL_API_URL` from the build and the `vite.config.js` warning — the site still reads live data until Phase 3
- [x] 1.6 *(4 tests)* `vite:preloadError` reload guard in `src/main.jsx` (H7)
- [x] 1.7 Repo variable `ALERT_ASSIGNEE=vaibhav-sharma0105` (set 2026-11-15 via `gh variable set`)
- [x] 1.8 *(local, 2026-11-15)* Docs (also new: `docs/ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` = the Phase 2 owner guide; spec §2.5 now points to the code file instead of embedding it; stale CI claims in AGENTS.md fixed): `docs/OPERATIONS-INVENTORY.md` (every Sheet, Drive folder, script, trigger, workflow, secret, PAT expiry, retirement dates), `docs/OPERATIONS-RUNBOOK.md` (symptom → action), update `MIGRATION-*` + `MAINTENANCE-GITHUB-PAT-REFRESH.md` (Drive folder, `setup()`, PAT permission/endpoint, cron-line edit, `ALERT_ASSIGNEE`), setup guides, `CLAUDE.md`, `AGENTS.md`, both `docs/ARCHITECTURE*.html`, the sheet-integration skill
- [x] 1.9 *(2026-11-14 19:27–19:31 UTC: pushed e056ba3, aa3966f, d2321d5; manual sync run 43632228919 green — source legacy, 161 resources / 4 tabs, 0 photos fetched, 0 deleted, 0 row problems, committed 4447e2e (snapshot + fileId back-fill); the sync-started deploy 43632299055 green incl. content:validate 0 errors — the first deploy ever started by the sync)* Commit + push Phase 1; run the sync manually once to confirm it still works against the current Apps Script (expected: legacy mode, first run commits the snapshot + fileId back-fill, no photo downloads). Gate before push: lint ✓, content:validate ✓, 246/246 unit tests ✓, build ✓ (2026-11-15)

### Phase 2 — Google side (OWNER, ~20 min, click-by-click guide to be written in 1.8)
- [ ] G1 **(OWNER)** Diagnose the dead instant path: Apps Script → Triggers (is `onSheetChange` installed?) and Executions log; note the PAT's permissions
- [ ] G2 **(OWNER)** Paste `apps-script/abl/Code.gs` into the Apps Script editor; save
- [ ] G3 **(OWNER)** Script Properties: add `GITHUB_WORKFLOW`, `ALERT_EMAIL`; confirm `GITHUB_REPO`, `GITHUB_PAT`, `SYNC_TOKEN`
- [ ] G4 **(OWNER)** Run `setup()` once (installs the "On change" + 5-minute triggers, removes old ones); set trigger-failure notifications to "immediately"
- [ ] G5 **(OWNER)** Deploy → Manage deployments → Edit → **New version** (same URL)
- [ ] G6 Verify: two edits 30 s apart → exactly 2 sync runs within ~7 min, second includes the second edit; a row delete triggers a run

### Phase 3 — Switch the site to the snapshot
- [x] 3.1 Seed: manual sync run commits the first validated snapshot + photos *(done by the 1.9 run: commit 4447e2e)*
- [ ] 3.2 Switch `useABLData.js` to the bundled snapshot; update its tests and `e2e/` spec; drop `VITE_ABL_API_URL` from the deploy build env and the warning in `vite.config.js`
- [ ] 3.3 Verify live: Pramaan pages make no request to `script.google.com`; an edited row appears on the live site within ~10 min
- [ ] 3.4 Update this checklist, the inventory and the memory notes

### Later (see section 8)
- [ ] Items in section 8, each when its trigger condition is met

## 10. Not yet verified (check during implementation)

Checked 2026-11-15 against GitHub's REST docs ("Create a workflow dispatch event"):
- The success code is documented as **200** with the run's id (older behaviour: 204). The Apps Script treats any 2xx as success — a 204-only check would have retried forever (fixed + tested).
- The page does **not** state the fine-grained permission; **Actions: Read and write** is expected and `testDispatch` (G1/Step 8) confirms it in practice.
- The `GitHub-Authentication-Token-Expiration` header is **not documented** on the REST auth/troubleshooting pages. Expiry warnings work only if GitHub sends it; the owner's calendar entry is the real safeguard.

Still open:
- Who receives Actions failure emails for bot/schedule-started runs (Issues make this moot)
- Whether bot commits count as activity for the 60-day schedule rule
- `getActiveSpreadsheet()` inside a bound script's web-app context
- Consumer-to-consumer Drive folder ownership transfer
- Unauthenticated `thumbnailLink` fetch longevity (defensive: send `ScriptApp.getOAuthToken()`)
- Exact GitHub Pages cache lifetime
- `sharp` with `npm ci --ignore-scripts`
- The currently deployed Apps Script version (only the owner can see it)

## 11. Incident log

- **2026-11-15 — test touched the real repository.** While testing `scripts/ci/alert-issue.sh` with a
  fake `gh`, a Windows drive path (`C:/…`) in `PATH` under Git Bash broke the override, so the real
  `gh` ran and created issues #1–#4 (+3 comments, 2 labels) on the public repo. No code, settings or
  deploys were affected. The owner chose deletion; #1–#4 were deleted the same day (repo back to 0
  issues). The two labels were kept (the workflows use them). **Rule:** when shadowing a command for a
  test, convert paths with `cygpath -u` and assert `command -v <cmd>` points at the fake before running.

## 12. Pramaan Library — the new form-format Sheet (opened 2026-11-16)

**What:** a second, separate Sheet ("Contributing to Pramaan; Educators' Resource Bank (Responses)",
id `1-tjqKTutE7TRyG3ziAeFkarKfsOcLs9pKD_f9kQGcSU`) feeds a **new, unlinked page** `/pramaan-library`
(+ `/pramaan-library/:id`): no menu, footer or sitemap entry, `noindex`. The old `/pramaan/*` pages and
their Sheet are untouched.

**Owner decisions (2026-11-16):** publish a row only when **Q, R, S** (the three consent questions) are
all "Yes" (the stakeholder note said "P, Q, R"; P is "Position", so Q–S was confirmed by the owner);
filters = **Subject (B), Type (E), Ownership (K)** + **grades and chapters kept** (T–Y; Y = Foundational);
**no language filter** (G); show **name (C), description (D), ownership (K), photo (H), video (I),
additional link (J)**; sync **directly from the Sheet** (no CSV export).

**Design (same pattern as §6, snapshot mode from day one):**
- `apps-script/pramaan-library/Code.gs` v1 — **no public listing** (the Sheet holds personal data);
  token-gated `export` / `fetchImage`; columns found by header text; consent filter; L–P never read
  out; id = Internal ID, else `R-` + hash of the timestamp; Drive `open?id=` links accepted; first of
  repeated video links; triggers On change + **On form submit** + 5-min tick; heartbeat 04:00 UTC.
- `scripts/sync-pramaan-library.js` + `scripts/lib/library-snapshot.js` — allowlisted fields, email
  backstop, empty library allowed only before the first publish, removal/photo-deletion limits shared
  with §6.3. Writes `src/data/sheets/pramaan-library.json`, `src/data/pramaan-library-photos.json`,
  `public/assets/images/pramaan-library/`.
- `.github/workflows/sync-pramaan-library.yml` — every 6 h at :47 + dispatch; **own** concurrency group
  `pramaan-library-sync` (sharing `sheet-sync` with the ABL sync let one workflow's queued run silently
  replace the other's); skipped quietly **only** while secrets are missing and the committed snapshot has
  no rows, otherwise fails loudly with the same alert issues as §6. Each run fetches at most 100 photos
  (~20 min budget, 60 s per request) and continues next run, so it always finishes inside the 30-minute job.
- `npm run content:validate` fails the deploy if the library snapshot has a non-allowlisted field or an
  email address.
- Owner guide: `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`; column rules: `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`.

**Verified (2026-11-16):** lint clean; 23 test files / 294 tests pass; production build passes;
end-to-end sync against a fake Apps Script server (publish + photo, no-change run, refusal on 15→1,
token never printed, per-run photo cap continues on the next run). On Google: script installed and
deployed as a web app; without the token it answers `Unknown action`; `showStatus` ran. Real local
sync (owner's machine) while the owner had set Q/R/S = "Yes" on every row **for testing**: 245 rows →
243 published (2 duplicate IDs), 166 photos synced. Page reviewed in a browser with that data at
phone/tablet/laptop sizes, portrait and landscape (no horizontal overflow).
**Found on 2026-11-16 (owner to fix in the Sheet/Drive):** duplicate IDs W52, W62; 35 photos not
readable by the owner account (F64–F71, W62–W88; W63/W65/W66/W81 are documents, not images);
16 Drive videos not shared publicly; F12's video link is a YouTube Studio edit link.
**Fixed after the readiness review (2026-11-16):** YouTube embeds were blocked by the CSP (added
`https://www.youtube-nocookie.com` to `frame-src`); email scrub now covers chapter cells; per-request
timeout + per-run photo cap; photo file-name clash reported; own concurrency group; the push loop's last
rebase is pushed.
**Went live (2026-11-16):** the owner set up the library token `pramaan-library-sheet`, the Script
Properties and the `setup` triggers (with "notify immediately"); both GitHub secrets exist
(`gh secret list`); `ALERT_ASSIGNEE` = `vaibhav-sharma0105` (`gh variable list`). Pushed as
`1723ff3` — that commit carried the **test** snapshot (243 rows), which was then live on the unlinked
page. Deploy green. `testDispatch` → HTTP 204 (owner's log). The owner had meanwhile reverted the test
consent (Q/R/S empty again), so the first sync run (`43865385374`) read 0 publishable rows and
**refused** (empty library after a publish + 166 of 166 photos) — the safety rule working; alert issue #5
opened. Re-run with `allow_large_change` at the owner's request (`43867768722`): **0 resources
published**, 166 photos removed, commit `a9c1826`, deploy green, issue #5 closed automatically.
**Then (13:18 UTC, after the owner updated the Sheet):** sync run `43874559074` published **243
resources** and 166 photos (37 row problems → issue #6 "Pramaan Library Sheet: some rows need attention");
deploy `43875588619` green.
**Current state:** 243 published. The earlier test data stays in git history (`1723ff3`).
**History clean-up not needed (checked 2026-11-19, owner agreed):** every one of the 243 rows in the test
snapshot is published now with real consent (239 identical, 4 edited since; 0 test-only rows) and every
photo file in that commit is on the site now (0 test-only files), so removing `1723ff3` would hide
nothing. A rewrite would still change the ids of every later commit, need a force-push to `main` with the
sync bot paused, break links to old commits (Actions runs, issues, this file), and GitHub can keep serving
old commits by id until it purges them. Revisit only if consent is **withdrawn** for some rows and they
must also leave history — a targeted rewrite, planned with the owner, sync paused.
**Not verified:** a scheduled run since go-live; the live page was not opened in a browser after
these runs.

### Checklist
- [x] L1 Apps Script v1, sync, workflow, page, tests, docs (local)
- [x] L2 Commit and push (2026-11-16, `1723ff3`)
- [x] L3 Owner: setup guide Steps 1–7 (script, Drive service, own token, Script Properties, web app,
      `setup` triggers + "notify immediately", GitHub secrets, `ALERT_ASSIGNEE` confirmed) — 2026-11-16
- [x] L4 Owner: fill Q/R/S = "Yes" for rows cleared for sharing (the first "Yes on every row" was a
      test and was reverted; after the owner's Sheet update, 243 published at 13:25 UTC 2026-11-16)
- [ ] L4b Owner: fix duplicate IDs, share the 35 photos and 16 videos, fix F12's link (lists above)
- [x] L5 Owner: Steps 8–9 — `testDispatch` (HTTP 204), first green Actions run (`43867768722`), Sheet
      edit → automatic sync + deploy (`43874559074`, 2026-11-16)
- [x] L5b Remove the test snapshot from git history — **not needed** (2026-11-19, owner agreed; reason above)
- [x] L6 Visual review of `/pramaan-library` with Sheet data (local, 2026-11-16; test consent)
- [x] L7 Doc sync (2026-11-16): CLAUDE.md, AGENTS.md, OPERATIONS-INVENTORY/RUNBOOK, PLATFORM-LIMITS,
      MIGRATION-OVERVIEW, MAINTENANCE-GITHUB-PAT-REFRESH, setup guide, schema, both ARCHITECTURE diagrams
- [x] L8 Linked from the site — it became the Resource Centre at `/pramaan/resource-centre`, public and
      indexed (owner decision 2026-11-19; see section 13)

## 13. The Pramaan Library replaces the former Resource Centre (2026-11-19)

**Owner decisions (2026-11-19):** keep the new library and retire the old one; serve it at the old
address `/pramaan/resource-centre` (+ `/:id`) with the Pramaan tab bar; make it public and indexed (the
consent covers that); `/pramaan` counts from the library; Contribute form link in YAML; keep the
grades shown as they are ("Grades 1–5" from `site.yaml`); use the former Resource Centre's titles
("Resource Center", "{name} — TIDE Pramaan", "Back to Resource Center"); keep the Contribute text as it
is ("old process is right for the end customer"); clean up **code only** — nothing on the Google side and
no GitHub secrets were touched.

**Checked before the switch:** all 161 former resource ids exist in the new data (152 same name, 9
renamed); type names differ (old tabs Worksheet/Games/Kits/Flashcards vs typed Worksheet/Games/Kit/
Flashcard — mapped by `libraryTypeKey` / `typeParamKey`, so `?type=Kits` still filters); no row has
Foundational yet. The old language filter was not carried over (earlier stakeholder decision).

**What changed in the site**
- `/pramaan/resource-centre(/:id)` → `PramaanLibrary` / `PramaanLibraryDetail`, with `AblNavBar`,
  breadcrumbs, no `noindex` (an unknown id stays `noindex`). `/pramaan-library(/:id)` redirects there,
  keeping the query string (`LibraryRedirect`).
- `/pramaan`: total, type count, type cards (count, `?type=<key>` link) and "Updated" date from the
  snapshot at build time (was a live read).
- Contribute: `formUrl` in `abl-contribute.yaml` (validated by `content:validate`); the
  `VITE_ABL_CONTRIBUTE_FORM_URL` build secret is no longer read.
- `llms.txt` no longer quotes "150+". CSP `connect-src` no longer allows `script.google.com` /
  `script.googleusercontent.com` (nothing fetches from them now; `frame-src script.google.com` stays for
  the Education for Harmony embed).
- Responsive pass over all Pramaan pages (15 viewport sizes, portrait and landscape): the tab bar fits
  phones without sideways scrolling and stops sticking on short screens (max-height 500px); the detail
  facts card stacks the video below the facts at 1024–1279px; the back link is a 44px tap target. The
  filter tiles' counts were raised to full contrast (axe found 3.6–4.2:1).

**What was deleted** (all recoverable from the **local** tag `archive/pramaan-live-read`, commit
`dd5b5a5`: `git show archive/pramaan-live-read:<path>`): `AblResourceCenter`, `AblDetail`,
`ResourceCard/Grid/Filters`, `ActiveFilters`, `useABLData`, `filterResources`, `resourceLanguages`,
`driveUtils`, `ablThumbnails`, `abl-resource-center.yaml`, `abl-detail.yaml` (+ JSON), the old snapshot
`sheets/abl-resources.json`, `abl-thumbnails-manifest.json`, `public/assets/images/abl/` (318 files,
29 MB — still in git history, so the repository does not shrink), `scripts/sync-abl-thumbnails.js`,
`.github/workflows/sync-abl-thumbnails.yml`, `apps-script/abl/`, their tests, the
`content:sync-abl-thumbnails` npm script, the `VITE_ABL_API_URL` build env and CI warning, and the docs
`ABL-RESOURCE-LIBRARY-SPEC`, `ABL-APPSCRIPT-SETUP-GUIDE`, `ABL-APPSCRIPT-V3-UPGRADE-GUIDE`,
`ABL-THUMBNAIL-SYNC-SETUP-GUIDE`. The shared safety rules the library sync used from
`scripts/lib/abl-snapshot.js` were moved unchanged to `scripts/lib/snapshot-core.js` (tests ported to
`src/test/scripts/snapshotCore.test.js`). The image/video viewer labels moved to `ui.yaml`
(`mediaLightbox.*`), the pagination labels to `pramaan-library.yaml`.

**Left as they are (owner decision — code clean-up only):** the old Pramaan Sheet, its Apps Script
project, triggers and web-app deployment, its GitHub token, and the GitHub secrets `VITE_ABL_API_URL`,
`ABL_SYNC_TOKEN`, `VITE_ABL_CONTRIBUTE_FORM_URL` (the last one is already deleted — `gh secret list`, 2026-11-21). Nothing in the repository reads them now. What the
old script does now depends on its version, which is **not verified**: Phase 2 (installing v3) was never
ticked, so it is most likely the older script, whose `repository_dispatch` request GitHub accepts even
with no workflow listening — nothing runs, no email. If v3 *was* installed, each old-Sheet edit and its
daily heartbeat would get HTTP 404 (the workflow file is gone) and email "[Pramaan website] GitHub
refused the update (HTTP 404)"; removing that script's triggers in Google stops it. Note: the old web app's
public listing (`doGet` without a token) stays reachable by anyone who has its URL until its deployment
is archived in Google.

**Verification (local, 2026-11-19):** lint 0 errors; `content:validate` 0 errors; Vitest 18 files /
199 tests pass; production build (`GITHUB_ACTIONS=true`) OK; Playwright e2e 25/25; axe scan 0 violations
on every route; responsive audit 15 sizes × 6 Pramaan pages with no page overflow, no element off-screen,
no tab-bar scrolling, no tap target under 24px.

### Checklist
- [x] R1 Switch `/pramaan/resource-centre` to the library; redirect `/pramaan-library`; public + indexed
- [x] R2 `/pramaan` counts and type cards from the snapshot
- [x] R3 Contribute form link in YAML (+ validation)
- [x] R4 Former titles; responsive and accessibility pass
- [x] R5 Archive tag `archive/pramaan-live-read` (local), delete the old code, docs, skills, diagrams updated
- [ ] R6 Commit and push (waiting for the owner); then check the live site (all four Pramaan pages,
      an old `/pramaan/resource-centre/<id>` link, `/pramaan-library` redirect)
- [ ] R7 Optional: push the archive tag to GitHub (`git push origin archive/pramaan-live-read`) so it
      survives a fresh clone — it exists only on this machine today, like `archive/multilingual-framework`
