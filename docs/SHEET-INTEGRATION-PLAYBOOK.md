# Sheet Integration Playbook — the standard for connecting a Google Sheet to the site

**Status (2026-11-19):** this is **the** pattern for every Sheet-backed section. The reference
implementation is the **Pramaan Library**, which since 2026-11-19 is the Pramaan Resource Centre
(`/pramaan/resource-centre`; code still named `library` / `pramaan-library`) — when in doubt, read its code
and copy its shape. The older pattern that read a Sheet **live** in the browser (`useABLData()` → a public
Apps Script listing) was retired and deleted that day; never reintroduce it (it is kept only in the local
git tag `archive/pramaan-live-read`, for reference).

Agents: the procedure that walks through this document step by step is
`.claude/skills/sheet-integration/SKILL.md`.

---

## 1. The architecture (one picture)

```
Google Sheet (private; may hold personal data)
   │  edited by a non-technical owner, or filled by a Google Form
   ▼
apps-script/<slug>/Code.gs           (lives inside the Sheet; this repo file is the source of truth)
   │  • NO public listing — every action needs SYNC_TOKEN
   │  • ?action=export      → only publishable rows, only allowlisted fields, counts, problems, photo list
   │  • ?action=fetchImage  → one photo, only for an id that is publishable right now
   │  • On change / On form submit / 5-min tick → asks GitHub to run the sync (debounced) + daily heartbeat
   ▼
.github/workflows/sync-<slug>.yml    (own queue, schedule every 6 h, dispatch from the script, manual run)
   ▼
scripts/sync-<slug>.js  +  scripts/lib/<slug>-snapshot.js   (pure, unit-tested rules)
   │  allowlist → privacy scrub → safety limits → photos as WebP → report
   ▼  ONE commit (data + photos together), then starts deploy.yml
src/data/sheets/<slug>.json · src/data/<slug>-photos.json · public/assets/images/<slug>/   (bot-owned)
   ▼  npm run content:validate re-checks the snapshot in every deploy (privacy backstop)
src/pages/<area>/*.jsx  — imports the snapshot at BUILD time; visitors never contact Google
   text around the data: content/pages/<slug>.yaml
```

Why snapshot instead of a live API: no Google quota or outage reaches visitors, no URL or token is ever
in the site bundle, the Sheet can hold private columns safely, every published change is a reviewable
git commit, and a bad edit is refused before it reaches the site.

## 2. Principles (non-negotiable)

| # | Rule | Where it lives in the reference |
|---|---|---|
| P1 | **Snapshot only.** No browser request to Google, no `VITE_*` URL for the Sheet. | `src/pages/library/*.jsx` import `src/data/sheets/pramaan-library.json` |
| P2 | **No public listing.** Every Apps Script action is token-gated; anything else → `{ success:false }`. | `Code.gs` `doGet`, `isAuthorizedSyncRequest` (constant-time compare) |
| P3 | **Explicit publish gate.** A row is published only when the Sheet says so (consent/approval column(s) = "Yes"). Empty means *not* published. | `Code.gs` `YES` + `consented` check |
| P4 | **Allowlist, never blocklist.** Only named fields leave the Sheet; personal columns are never read into the output. Checked again in the sync and again in `content:validate`. | `COLUMNS` in `Code.gs`; `RESOURCE_FIELDS` in `library-snapshot.js`; `checkLibrarySnapshot()` in `validate-content.js` |
| P5 | **Privacy scrub.** Email addresses are removed from every published field (including nested lists); `content:validate` fails the deploy if one slips through. | `library-snapshot.js` (problem kind `personal-data`) |
| P6 | **Columns by header text**, not letter, so inserting/moving a column is safe; a missing *required* header fails loudly. | `COLUMNS[...].re` + `required` |
| P7 | **Fail closed, keep the last good version.** Structural problems (empty after a publish, mass removal, size cap, mass photo deletion) publish nothing. Intended big changes go through the `allow_large_change` run input. | `validateLibrary`, `photoDeletionError` |
| P8 | **Nothing fails silently.** Job failure → `automation-alert` issue; row problems → `sheet-needs-attention` issue; both assigned to `ALERT_ASSIGNEE` and closed automatically on the next success. Apps Script failures email `ALERT_EMAIL`. **Each integration uses its own issue titles.** | `scripts/ci/alert-issue.sh` (matches label **and** exact title) |
| P9 | **Isolation.** Own Sheet, own Apps Script, own fine-grained GitHub token, own secrets, own workflow file, own concurrency group, own cron minute, own data/photo paths. | see §3 |
| P10 | **Data and photos publish together** in one commit; a photo Drive can't read keeps its previous copy; photos are deleted only when their row is gone. | `planLibraryPhotos` |
| P11 | **Secrets never printed.** `redactToken()` on every log/error line; ids allowlist-validated before any path use; deletions checked to stay inside the photo folder. | `scripts/lib/sync-runner.js` (`createRedactor`, `isInsideAssetsDir`, `deletePhotos`) |
| P12 | **UI text is YAML**, data is the snapshot. No string typed in JSX (`react/jsx-no-literals`). | `content/pages/pramaan-library.yaml` |
| P13 | **Transferable.** A new owner can move Sheet → script → token → secrets with a click-by-click guide. | `docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `docs/MIGRATION-*.md` |

## 3. Naming — one `<slug>` per integration

Pick a short kebab-case slug (e.g. `pramaan-library`, `social-changemakers`) and an UPPER_SNAKE prefix
(`PRAMAAN_LIBRARY`). Everything below must be unique per integration — never reuse another's.

| Piece | Name pattern | Reference value |
|---|---|---|
| Apps Script source | `apps-script/<slug>/Code.gs` | `apps-script/pramaan-library/Code.gs` |
| Workflow (keep the file name — the script calls it by name) | `.github/workflows/sync-<slug>.yml` | `sync-pramaan-library.yml` |
| Concurrency group | `<slug>-sync` | `pramaan-library-sync` |
| Cron | every 6 h at a **minute not used by another sync** (taken: `:47` Resource Centre / library, `:27` Publications; `:17` was the retired ABL sync — free again) | `47 */6 * * *` |
| Sync script + rules | `scripts/sync-<slug>.js` (built on the shared `scripts/lib/sync-runner.js` — never copy its plumbing), `scripts/lib/<slug>-snapshot.js` | `sync-pramaan-library.js`, `library-snapshot.js` |
| npm script | `content:sync-<slug>` | `content:sync-pramaan-library` |
| GitHub secrets | `<PREFIX>_API_URL`, `<PREFIX>_SYNC_TOKEN` | `PRAMAAN_LIBRARY_API_URL`, `PRAMAAN_LIBRARY_SYNC_TOKEN` |
| GitHub token (in Script Properties) | fine-grained, this repo only, **Actions: Read and write**, named `<slug>-sheet` | `pramaan-library-sheet` |
| Snapshot | `src/data/sheets/<slug>.json` (`schemaVersion`, `section`, `contentHash`, `resources`, `meta.total`) | `src/data/sheets/pramaan-library.json` |
| Photo manifest | `src/data/<slug>-photos.json` — must not collide with a YAML basename | `pramaan-library-photos.json` |
| Photos | `public/assets/images/<slug>/` | `public/assets/images/pramaan-library/` |
| Alert issue titles | "`<Name>` sync failed — the page is not updating", "`<Name>` Sheet: some rows need attention" | "Pramaan Library sync failed — …" |
| Heartbeat hour (UTC) | different from the other scripts (taken: 04:00 Resource Centre, 05:00 Publications) | 04:00 |
| Page YAML | `content/pages/<slug>.yaml` | `pramaan-library.yaml` |
| Pages / components / config / utils | `src/pages/<area>/`, `src/components/<area>/`, `src/config/<area>.js`, `src/utils/<area>Filters.js` | `library/`, `config/library.js`, `libraryFilters.js` |
| Owner docs | `docs/<SLUG>-SETUP-GUIDE.md`, `docs/<SLUG>-SHEET-SCHEMA.md` | `PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `PRAMAAN-LIBRARY-SHEET-SCHEMA.md` |
| Tests | `src/test/scripts/<area>AppsScript.test.js`, `<area>Snapshot.test.js`, `src/test/utils/<area>Filters.test.js`, `src/test/pages/<slug>.test.jsx` | `libraryAppsScript`, `librarySnapshot`, `libraryFilters`, `pramaanLibrary` |

## 4. Build order

Do these in order; each step has a reference file to copy from.

1. **Scope with the owner (ask, don't assume).** Which Sheet and tab; which columns are public;
   which are personal (never leave); what the publish gate is; which fields the page filters/sorts
   by; are there photos/videos; linked from the menu or unlinked + `noindex`; expected row count.
   Record the answers in the schema doc. **Do not read or print personal columns** while exploring
   the Sheet — read the header row only.
2. **Schema doc first** — `docs/<SLUG>-SHEET-SCHEMA.md` (copy the headings of
   `PRAMAAN-LIBRARY-SHEET-SCHEMA.md`: which tab, columns, who gets published, ids, safety rules).
3. **Apps Script** — copy `apps-script/pramaan-library/Code.gs`; change `COLUMNS`, the publish gate,
   the output fields, `SCRIPT_VERSION`/`SCHEMA_VERSION`, the default `GITHUB_WORKFLOW`, the photo cache
   key, the heartbeat hour and the alert-email subject. Keep: token gate, `fetchImage` resolving ids
   through publishable rows, debounce + max-wait + auth-failure backoff, `setup()`, `makeSyncToken()`,
   `testDispatch()`, `showStatus()` (counts only, never values).
   Test it in the simulated Google environment like `src/test/scripts/libraryAppsScript.test.js`,
   **using the real header row** — build the sandbox with `makeAppsScriptEnv()` from the shared
   `src/test/scripts/helpers/fakeAppsScript.js` (pass this Sheet's tabs, spreadsheet name and, if
   `Code.gs` formats dates, `timeZone`); don't copy the fake Google services into the new test.
4. **Rules library** — start from `scripts/lib/library-snapshot.js`: field allowlist, normalisation, email
   scrub, id rules, clash detection, `validate…` thresholds, photo plan. Import the shared pieces from
   `snapshot-core.js` instead of re-writing them (`THRESHOLDS`, `isSafeId`, `photoFileBase`,
   `cleanString` / `cleanStringCollapseSpaces`, `extractDriveFileIdAnyLink` for links typed into the
   Sheet, `asSingleTab`, `planListPhotos`), and re-export what the sync script needs. Pure functions
   only; unit-test every rule.
5. **Sync script** — start from `scripts/sync-pramaan-library.js`, which is ~120 lines because the run
   plumbing lives in `scripts/lib/sync-runner.js` (`.env.development` loader for one prefix, token
   redaction, fetch + retry + timeout, report, `GITHUB_OUTPUT`, refusal/override, capped photo
   downloads, guarded deletes, writing the files, failure exit). Change only what is per integration:
   env names + `loadLocalEnv('<PREFIX>_')`, paths, `createReport({ summaryTitle, setupGuide,
   workflowName })`, the `Code.gs` path, the stats line, the console summary line, and
   `processPhoto` (plain resize like the library, or a custom renderer like
   `publications-images.js`). Keep `REQUEST_TIMEOUT_MS`, `MAX_PHOTOS_PER_RUN` and the photo time
   budget. If the new sync needs a behaviour the runner lacks, add it to `sync-runner.js` with a
   parameter (and a test in `src/test/scripts/syncRunner.test.js`) rather than forking a copy.
   Run it against a **fake Apps Script server** (no real data) to prove: publish, no-change run,
   refusal on mass removal, token never printed, photo cap continues next run.
6. **Workflow** — copy `.github/workflows/sync-pramaan-library.yml`; rename paths, secrets, group, cron,
   issue titles. Keep: `permissions: {}` at the top and per-job grants, no `pull_request` trigger,
   the `check` job (skip quietly **only** while secrets are missing *and* the committed snapshot is
   empty), `allow_large_change` input, commit only the bot paths, push with rebase retry, `gh workflow
   run deploy.yml`, alert open/close steps, `timeout-minutes: 30`, pinned `ubuntu-24.04`.
7. **Deploy backstop** — add a `check<Name>Snapshot()` to `scripts/validate-content.js` (shape, allowed
   fields, no email address, unique ids, `meta.total`, every photo entry has its files).
8. **UI** — §5. Text in `content/pages/<slug>.yaml`; routes in `src/App.jsx`; if videos are embedded,
   their host must be in the `frame-src` of the CSP in `index.html` (YouTube needed
   `https://www.youtube-nocookie.com`).
9. **Docs** — `docs/<SLUG>-SETUP-GUIDE.md` (copy the library guide's steps 1–9, "How you hear about
   problems", troubleshooting, local run, moving to a new owner) + the doc-sync list in §8.
10. **Owner setup, guided step by step** (setup guide), then the go-live checklist in §7.

## 5. Page design standard (listing + detail)

Reference: `src/pages/library/PramaanLibrary.jsx`, `PramaanLibraryDetail.jsx`, `src/components/library/`,
`src/utils/libraryFilters.js`, `src/config/library.js`. Reviewed at phone/tablet/laptop sizes, portrait and
landscape, with no horizontal overflow (2026-11-16).

**Listing page**
- **Toolbar above the cards:** search, then a sort control (field + ascending/descending toggle); on
  phones the search takes the full width and a "Filters" button opens the drawer.
- **Filters** in a card on the left (desktop) / a drawer (phone: `role="dialog"`, `useFocusTrap` +
  `useModalBehavior`, a "Show {n} {resources}" button, "Clear (n)"). The sidebar is sticky **only** if it
  fits the viewport (`useSidebarFits`) — never an inner scrollbar.
- **Filter order** = what the stakeholder asked for most first. Many-valued fields use a compact picker
  (inline listbox, type-ahead, clear ×); few-valued fields use tiles or pills.
- **Option order:** "All …" first, then A→Z, "Other" last; a pinned value may follow "All" when the owner
  asks (`orderFilterOptions(options, pinned)`).
- **Counts follow the other filters** (faceted: `facetOptions`); a selected value stays visible with 0.
- **Sort only by the fields the stakeholder named;** direction reverses the primary key only; blanks last.
- **All state in the URL** (query string read with `URLSearchParams`, written with `navigate(…, { replace: true })`: search, filters, sort, dir, page) so links and reloads keep the view;
  "Clear" keeps sort and direction.
- **Fixed page size** from config (`LIBRARY_PAGE_SIZE = 9`, fits 1/2/3 columns); shared
  `src/components/abl/Pagination.jsx` (arrows only on phones).
- **Result count** in an `aria-live` region; empty state ("No resources published yet") and no-match state
  text both from YAML.
- **Consistent shapes:** rounded pills/cards; focus styles use `focus-visible:rounded-*` classes
  (`FOCUS_PILL`) because the global `:focus-visible` rule in `src/index.css` sets a 4px radius.

**Detail page**
- Only show sections that have data (e.g. grades without chapters are hidden, not shown disabled).
- Fixed, meaningful order (e.g. Foundational before Grade 1–5 via `sortGrades`).
- Photos: self-hosted WebP via the manifest (`getLibraryPhoto`), lightbox via `ImageLightbox src=…`;
  videos via `getVideoEmbedUrl` (Drive → `/preview`, YouTube → `youtube-nocookie` embed).
- Unknown id → friendly not-found state, still `noindex`.

**Unlinked pages** (until the owner decides to link): no menu/footer/sitemap/llms.txt entry and
`SeoHead … noindex` on every state. When linking later: remove `noindex` (keep it on the not-found state),
add breadcrumbs, add to `public/sitemap.xml` and `content/shared/llms.txt`, and confirm with the owner that
the consent wording covers a public, search-indexed listing. If the page replaces an older one, serve it at
the old address and redirect the new one (as `/pramaan-library` → `/pramaan/resource-centre`, which keeps
ids and `?type=` links working).

**Reuse.** The generic listing parts of the Resource Centre live in shared modules (extracted 2026-11-20) —
use them instead of copying the library's code:
- `src/components/listing/` — `SearchField` (search box + clear), `FilterChips` (active filters as
  removable chips), `FilterDrawer` (the phone filter dialog: focus trap, Esc, scroll lock, "Show {n}"
  button) and `PickerField` (the compact inline-listbox picker with type-ahead and clear ×).
- `src/utils/listingFilters.js` — `normKey`, `cleanLabel`, `optionsFor`, `optionsForMany` (list-valued
  fields) and `orderFilterOptions` (`libraryFilters.js` re-exports the ones it used to define).
- `src/hooks/useSidebarFits.js` — sticky sidebar only while it fits.
- `src/utils/focusRing.js` — `focusRing(radius)`; `src/components/abl/Pagination.jsx` takes a `labels`
  prop for another page's YAML.

A listing does not have to use them all. The Publications pages first reused the library's listing UI
(sidebar filters, drawer, pagination), then got their own layouts in `src/components/publications/`, fitted
to each page's content: the TIDE page (16 rows in the Sheet on 2026-11-20) has the latest annual report
spotlighted, then one library of every row as cards with numbered pages of 12 (`TideCollection`); the THRIvE
page (49 text-heavy rows) is a single year-grouped reading column with numbered pages of 12 kept in `?page=`;
both share one search + filter bar (`PublicationToolbar`, `usePublicationQuery`; `ResearchArchive`,
`PublicationsPagination`). Every such threshold is a named constant in
`src/config/publications.js`, so a control appears only when the row count makes it useful. They have their
own controls (`PublicationControls`, `usePublicationControls`) and use none of `src/components/listing/`,
`useSidebarFits` or `abl/Pagination`; of the shared parts they use `listingFilters.js`, `focusRing` and
`FOCUS_PILL`. Choose the layout from the data (row count, text length), not from the previous integration.

**Uploaded images that are screenshots.** When people upload "thumbnails" of very different shapes
(covers, slides with black bars, logos on wide margins, tall phone screenshots), a plain resize gives bars
and squeezed boxes. `scripts/lib/publications-images.js` (used by `scripts/sync-publications.js`, tested in
`src/test/scripts/publicationsImages.test.js`) is the pattern to copy: trim uniform borders with sharp
(never failing the photo if trimming can't), keep document covers whole, keep other images in their own
shape within a ratio range (THRIvE: 3:4…16:9; taller → `attention` crop to 3:4, wider → centre crop to
16:9), never crop the full-size file, and record the pixel sizes (`thumbWidth`/`thumbHeight`/
`fullWidth`/`fullHeight`) in the photo manifest so the page can set `width`/`height` and show each image whole
at its own ratio inside the component's fixed frame (`getPublicationThumb`, `PublicationMedia`). The Resource Centre sync does not do this (plain resize).

Still library-only: `LibraryDropdown` (the sort menu; it also exports `FOCUS_PILL`, which the shared pieces
and the Publications components import), the type tiles and grade pills, and the per-integration
filter/sort rules (`libraryFilters.js`, `publicationFilters.js`). Tests for the shared pieces run through
`src/test/pages/pramaanLibrary.test.jsx`; there are no separate unit tests for `src/components/listing/`.

## 6. Security checklist (every line, before calling it done)

- [ ] No public action in `Code.gs`; token compared in constant time; token only in Script Properties.
- [ ] `fetchImage` (or any id-taking action) resolves the id through the **currently publishable** rows —
      never a raw Drive id from the request.
- [ ] Personal columns are not in `COLUMNS` output, not in the snapshot, and `content:validate` would
      fail if an email address appeared.
- [ ] The token never reaches a thrown `Error`, `console.*` or `Logger.log` line (`redactToken()` —
      on the Node side from `sync-runner.js` `createRedactor`), on both the Apps Script and the Node side.
- [ ] Every Sheet string that reaches a file path is allowlist-validated; deletions are checked to stay
      inside the photo folder (`path.relative`).
- [ ] Image bytes are decoded by `sharp` with a size cap; its pixel limits are left on.
- [ ] Every `UrlFetchApp`/`fetch` that matters checks the status code and has a timeout.
- [ ] GitHub token is fine-grained, one repo, **Actions: Read and write** only, with an expiry in a calendar.
- [ ] Workflow: no `pull_request` trigger; `permissions: {}` + minimal per-job grants; commits only bot paths.
- [ ] Dispatch is debounced (2 min quiet, 10 min max wait) so edit bursts don't spam Actions.
- [ ] Nothing about the integration is in the site bundle except the snapshot itself.

## 7. Go-live checklist and lessons (from the Pramaan Library launch, 2026-11-16)

1. **Never commit a snapshot made from test data.** The repository is **public** (free GitHub Pages
   requires it) and git history keeps every commit. Test publish logic with the fake server or
   simulated Apps Script; if you run a real local sync for a visual check, don't commit its output
   unless the publish gate reflects real consent/approval. (The library's first push carried 243 rows
   published from "Yes on every row" test consent; it stays in history in `1723ff3`. A clean-up was later
   judged unnecessary because the same rows then received real consent — that was luck, not a plan.)
   If a test snapshot *is* committed and the rows never get consent, removing it means rewriting `main`
   (new ids for every later commit, force-push, sync paused) — plan it with the owner.
2. **Add the GitHub secrets before the first push** that contains a non-empty snapshot — otherwise every
   run fails and alerts.
3. **An intended mass change** (e.g. reverting test consent, a big clean-up) is refused by design; run the
   workflow manually with **allow_large_change** after checking the Sheet. Don't weaken the rule.
4. **Owner setup order:** token → Script Properties → `setup` (+ "Notify me immediately" on each
   trigger) → GitHub secrets → confirm `ALERT_ASSIGNEE` → push → `testDispatch` (expect HTTP 204) → watch
   the first run → edit test.
5. **Drive sharing:** photos the script owner can't read and videos not shared publicly don't appear; list
   them for the owner (the sync report names them). Duplicate ids are skipped and reported.
6. **CSP:** any new embed host must be added to `frame-src` in `index.html`, or the embed silently shows
   nothing.
7. **Alerts must not collide:** a new integration's issue titles must differ from every other workflow's,
   or one success would close another's alert.

## 8. Docs to update for every new integration (doc-sync)

`CLAUDE.md` (tree, routes table, a short section), `AGENTS.md` (§2 data flows, tree, §8 subsection),
`docs/OPERATIONS-INVENTORY.md`, `docs/OPERATIONS-RUNBOOK.md`, `docs/PLATFORM-LIMITS.md`,
`docs/MIGRATION-OVERVIEW.md`, `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` (one more token),
**both** `docs/ARCHITECTURE.html` (a tab per integration) and `docs/ARCHITECTURE-DATAFLOW.html` (nodes +
secrets table), `CONTENT-GUIDE.md` (the new YAML), and the cron/heartbeat "taken" list in §3 of this file.

## 9. What is shared vs. per integration

| Shared (change with care — affects every integration) | Per integration |
|---|---|
| `scripts/ci/alert-issue.sh`, `deploy.yml`, `scripts/lib/snapshot-core.js` (`THRESHOLDS`, `isSafeId`, `serializeSnapshot`, `photoDeletionError`, `photosFromExport`, `contentHash`, `planPhotos`, `planListPhotos`, `asSingleTab`, `photoFileBase`, `cleanString`, `cleanStringCollapseSpaces`, `extractDriveFileId` (`/d/` only) and `extractDriveFileIdAnyLink` (also `?id=`); tests `src/test/scripts/snapshotCore.test.js`), `scripts/lib/sync-runner.js` (the sync scripts' I/O: env loader, redaction, fetch + retry, report, outputs, refusal, photo loops, file writes, failure exit — its wording appears in every sync's log and report; tests `src/test/scripts/syncRunner.test.js`), `src/test/scripts/helpers/fakeAppsScript.js` (the Apps Script tests' sandbox + fake Google services), `scripts/validate-content.js`, `src/components/abl/Pagination.jsx`, `src/components/listing/`, `src/utils/listingFilters.js`, `src/hooks/useSidebarFits.js`, `src/utils/focusRing.js`, `DriveImage`/`ImageLightbox` (take a `src`), `VideoLightbox`, their labels in `ui.yaml` `mediaLightbox.*`, `SeoHead`, `index.html` CSP, the repo variable `ALERT_ASSIGNEE` | Sheet, `Code.gs`, token, secrets, workflow + queue + cron, sync script (env prefix, paths, report title/guide/workflow name, stats line, `processPhoto`) + rules, snapshot + photos paths, page YAML, pages/components, setup guide + schema doc, issue titles |
