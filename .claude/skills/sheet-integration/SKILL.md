---
name: sheet-integration
description: >
  TRIGGER — invoke this when the user wants to add a new site section backed by a Google Sheet
  that a non-technical person can edit directly (the same shape as the existing ABL/Pramaan
  resource library: a private Sheet → Apps Script Web App → React hook → page, optionally with
  media that needs self-hosting). Also trigger if asked to "do what we did for ABL/Pramaan but
  for X," or to connect any new spreadsheet to the site. This generalizes a pattern that already
  works in production rather than reinventing it per integration — and folds in the security
  review that a 2026-06-21 audit found necessary (a token-in-error-message leak and a path-
  traversal bug were both found in the *original* ABL pipeline after the fact; this skill exists
  so the next integration has those checks from the start, not discovered later).
  SKIP if the new content is static (use the existing YAML CMS pipeline and `cms-integrity`
  instead) or if it's an extension of the *existing* ABL Sheet/tabs rather than a genuinely new,
  separate spreadsheet.
---

# Sheet Integration — Bootstrap a New Google-Sheet-Backed Section

## Why this exists

The ABL/Pramaan resource library proved a pattern: a non-technical person can fully own a piece
of live site content via a Google Sheet, with zero developer involvement after one-time setup.
That pattern is reusable, but copying `Code.gs`/`useABLData.js` by hand each time silently
recreates whatever the *previous* mistake was — and, concretely, a security audit of the ABL
pipeline (2026-06-21) found two real issues that weren't there from a design flaw, but from never
having a checklist to verify against: a token that could leak into a public GitHub Actions log
on any transient error, and a Sheet-supplied ID string flowing unsanitized into a filesystem
path. Neither was caught until someone went looking on purpose. This skill is that checklist,
applied at the start of the *next* integration instead of after it ships.

## Scope

**In scope:** designing and scaffolding a new `Sheet → Apps Script → React` integration:
the Apps Script Web App, the client-side fetch/cache hook, the config constants, and — if the
new section involves images/media that shouldn't hotlink Google's CDN — the self-hosting sync
pipeline (GitHub Actions + Node sync script), plus the matching non-technical setup guide.

**Out of scope:** the YAML CMS pipeline (that's `cms-integrity`'s territory — most new site
*content* doesn't need a Sheet at all), and changes to the *existing* ABL Sheet/Code.gs itself
(that's just a normal code change in `docs/ABL-RESOURCE-LIBRARY-SPEC.md`'s territory).

## Procedure

### 1. Scope the integration before writing anything

Ask (or infer from the request): Is this read-only listing data, or does it need media files
self-hosted too? Does it need a contribute/submission flow? Roughly how many rows/items? The
answers determine whether you need the full thumbnail-sync pipeline or just the Apps Script +
hook layer. Don't build the sync pipeline speculatively if there's no media involved.

### 2. Scaffold the Apps Script Web App (`Code.gs`)

Use **`apps-script/abl/Code.gs`** (Pramaan v3) as the structural template — keep it in the repo as
`apps-script/<section>/Code.gs` (the repo copy is the source of truth; the owner pastes it into Google)
and cover it with a simulated-Google test like `src/test/scripts/appsScript.test.js`. Same shape, new
field mapping and id header pattern. Carry over these patterns exactly, they're not optional extras:

- `doGet(e)` dispatches on `e.parameter.action`, default action is the public unauthenticated
  read.
- `CacheService` wraps the Sheet read (15-min TTL precedent) so traffic volume never translates
  into Sheet-read volume.
- Any privileged action (anything beyond the public read) is gated by
  `isAuthorizedSyncRequest(e)` — a shared-secret token compared in constant time, stored in
  `PropertiesService.getScriptProperties()`, never hardcoded.
- A token-gated **`export`** action does a **fresh** read and returns data + per-media results
  (`{id, fileId, modifiedTime}` or `{id, fileId, error}`) + `scriptVersion` + `health` from the same
  read, so the sync never sees stale cache or mismatched data/media.
- The Sheet comes from `getActiveSpreadsheet()` (bound script) or Script Property `SHEET_ID` — never a
  hard-coded id, so moving to a copy is a one-value change. Tabs are published by an explicit header
  pattern (allowlist), never "every tab except…".
- If the action accepts a client-supplied ID to fetch something (a file, a row), **look it up
  against the live data first and only act on a match** — never use a client-supplied ID
  (especially a Drive `fileId`) directly. This is what keeps a leaked token from being usable to
  pull arbitrary files. See `handleFetchImage` in `apps-script/abl/Code.gs` for the working example.

### 3. Security checklist — go through every line before calling Code.gs done

This is the deeper, more systematic pass referenced when this skill was created — broader than
"the two things that happened to leak last time":

- [ ] **Token never reaches a thrown `Error` or `console.warn`/`Logger.log` line**, in *either*
  the Apps Script side or the Node sync script side. If a URL containing the token might end up
  in an error message, redact it first (see `redactToken()` in `scripts/sync-abl-thumbnails.js`
  for the working pattern). Don't rely on GitHub's secret-log-redaction as the actual defense —
  it only catches an exact byte match, which breaks the moment the token is transformed (URL-
  encoded, truncated, concatenated) before being logged.
- [ ] **Any Sheet-supplied string that reaches a filesystem path (Node side) is allowlist-
  validated first** — reject or skip anything containing `..`, `/`, or other path-control
  characters before it reaches `path.join`/`fs.rm`/`fs.writeFile`. A Sheet is editable by
  non-developers; treat its content as untrusted input for this purpose even though the editor
  is generally trusted for *content* decisions.
- [ ] **Deletion paths get an independent check, not just the write path.** Verify the resolved
  absolute path actually sits inside the intended directory (`path.relative` + check it doesn't
  start with `..`) before any `fs.rm` call, even if the path came from your own previously-
  written manifest — defense in depth against that manifest ever being corrupted or hand-edited.
- [ ] **No raw external ID (Drive fileId, etc.) is ever accepted directly from an HTTP request
  parameter and acted on.** Always resolve through the live Sheet/data first (see step 2).
- [ ] **`UrlFetchApp`/`fetch` calls that matter for automation (e.g. a dispatch trigger) check
  the response code and log a failure**, even with `muteHttpExceptions: true`. A silent failure
  here means the whole pipeline can die with zero trace.
- [ ] **GitHub PAT is fine-grained, scoped to this one repo, with only the permission actually
  needed** (typically `Actions: Read and write`, nothing else) — never a classic/broad token.
- [ ] **Any new GitHub Actions workflow triggered by this integration has no `pull_request`
  trigger** if it uses secrets — confirm it only fires on `repository_dispatch`/`schedule`/
  `workflow_dispatch`, so untrusted fork PR code can never run with access to the secret.
- [ ] **Image/file decode (if any) goes through a real library** (`sharp` or equivalent) that
  validates the bytes actually decode as the claimed type, with a byte-size cap, rather than a
  hand-rolled magic-byte check — and don't disable the library's default pixel/dimension limits
  (these exist specifically to guard against decompression-bomb-style inputs).
- [ ] **Sheet changes reach GitHub without dropping any** — use an installable **On change** trigger
  (catches row/tab deletes; "On edit" doesn't), a **leading + trailing** debounce flushed by a
  5-minute `tick` trigger under `LockService`, and the **workflow_dispatch** endpoint; treat any
  **2xx** as success (GitHub now documents 200, it used to return 204). A leading-only debounce
  silently drops later edits — that was a real Pramaan bug. Install triggers with an idempotent
  `setup()`, never by hand.
- [ ] **Failures reach a human:** auth failures back off and email (`MailApp`, max 1/day); the sync
  and deploy workflows open GitHub Issues assigned to `vars.ALERT_ASSIGNEE` (`scripts/ci/alert-issue.sh`).
- [ ] **The sync can't destroy content:** structural thresholds (mass removal, vanished tab, renamed
  header) refuse to publish and keep the last good version; a media lookup error **keeps** the old
  file — media is deleted only when its row is gone. See `scripts/lib/abl-snapshot.js` + its tests.

### 4. Default to snapshot mode, not a runtime fetch

**Visitors should not call Apps Script** (30 simultaneous executions for the script owner, ~2 s per
call — `docs/PLATFORM-LIMITS.md`). Default design: the sync writes a validated snapshot to
`src/data/sheets/<section>.json` (a sub-folder, so it can't collide with YAML output) in the same
commit as the media, and the page imports it statically (design: `docs/PRAMAAN-HARDENING-PLAN.md`
§6.3). Only build a runtime fetch hook if the content truly must be live to the minute — then mirror
`src/hooks/useABLData.js` (Pramaan's hook until Phase 3 of that plan) and `src/config/abl.js`. New env vars go in `.env.development` (gitignored), as GitHub
Actions repository secrets, **and** must be listed in the `env:` block of the Build step in
`.github/workflows/deploy.yml` (that is how `VITE_ABL_API_URL` and
`VITE_ABL_CONTRIBUTE_FORM_URL` reach the production build) — never hardcoded. The hook's cache
key (`abl_api_cache_v2` for ABL) should be unique per integration and bumped whenever the payload
shape changes.

The section's **UI chrome** (headings, filter/button labels, empty/error messages, SEO strings)
is *not* Sheet data: put it in a `content/pages/<name>.yaml` and wire it per the `cms-integrity`
skill, exactly as `abl-home.yaml`, `abl-resource-center.yaml`, `abl-detail.yaml` and
`abl-contribute.yaml` do for Pramaan (including `meta.breadcrumbName` for the breadcrumb trail;
YAML pages read their data directly as `data.x.y` — there is no `t()` layer). Only the rows from
the Sheet are dynamic. Also add the new URL to `public/sitemap.xml` and to the hand-maintained
page list in the `content/shared/llms.txt` template.

### 5. If media needs self-hosting, scaffold the sync pipeline

Mirror `scripts/sync-abl-thumbnails.js` (+ `scripts/lib/abl-snapshot.js`) and
`.github/workflows/sync-abl-thumbnails.yml` — token-gated export/fetch actions, retry-with-backoff,
the security checklist in step 3 applied to the new script, committing only the specific data +
asset paths (not a broad `git add -A`), push retry with rebase, explicit `gh workflow run deploy.yml`,
`npm ci --ignore-scripts`, per-job permissions. Prefer adding the section to the **same** sync workflow
and concurrency group (`sheet-sync`) over a second workflow. The manifest lives in `src/data/` (ABL's is
`src/data/abl-thumbnails-manifest.json`) but is **not** produced by `scripts/yaml-to-json.js`;
because that script writes a flat `src/data/<basename>.json`, give a new manifest a name that
cannot collide with any YAML basename.

Also note the global image fallback: `src/utils/imagePlaceholder.js` swaps any `<img>` that fails
to load for the grey `placeholderImage` from `content/shared/site.yaml`. An image component that
draws its own fallback (as `src/components/abl/DriveImage.jsx` does) should carry the
`data-no-placeholder` attribute so the global handler leaves it alone.

### 6. Generate the non-technical setup guide

New file: `docs/<INTEGRATION-NAME>-SETUP-GUIDE.md`, modeled on
`docs/ABL-APPSCRIPT-SETUP-GUIDE.md`'s structure (Before You Start, numbered steps with exact
click-paths, a troubleshooting table, "what to save" callouts for tokens/IDs). Don't skip this
even for an internal/technical integration — the whole point of this pattern is that a developer
isn't required for ongoing maintenance, and that only holds if the non-technical owner has a
guide as good as the original.

### 7. Doc sync

This is exactly the kind of change `doc-sync` exists for — new subsystem, new pipeline, new
file-structure entries. Invoke it (or apply its procedure directly) once the integration is
built: update `AGENTS.md`'s repository tree and any relevant reference table, `CLAUDE.md`'s
subsystem list, and both architecture diagrams (`docs/ARCHITECTURE.html` and
`docs/ARCHITECTURE-DATAFLOW.html`) to include the new integration as a parallel block to the
ABL one. If the integration adds a Sheet, token, secret or PAT, also review
`docs/MIGRATION-OVERVIEW.md`, `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md`,
`docs/MIGRATION-GITHUB-REPOSITORY.md` and `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`, which
enumerate what a new owner must move or refresh — and add every new Sheet, Drive folder, script,
trigger, secret and expiry to **`docs/OPERATIONS-INVENTORY.md`** and any new symptom to
`docs/OPERATIONS-RUNBOOK.md`. Add the new page's YAML file to
`CONTENT-GUIDE.md`'s file table.

## Reference implementation

`apps-script/abl/Code.gs`, `scripts/lib/abl-snapshot.js`, `scripts/sync-abl-thumbnails.js`,
`.github/workflows/sync-abl-thumbnails.yml`, `scripts/ci/alert-issue.sh`, `src/test/scripts/`,
`docs/PRAMAAN-HARDENING-PLAN.md` (design + reasons), `docs/ABL-APPSCRIPT-V3-UPGRADE-GUIDE.md` (owner guide
style), `docs/ABL-RESOURCE-LIBRARY-SPEC.md`, `src/config/abl.js`. Read the actual
current state of these before copying — don't pattern-match from memory of what they used to do.
