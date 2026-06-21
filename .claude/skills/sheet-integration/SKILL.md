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

Use `docs/ABL-RESOURCE-LIBRARY-SPEC.md` §2.5's `Code.gs` as the structural template — same
shape, new Sheet ID and new field mapping. Carry over these patterns exactly, they're not
optional extras:

- `doGet(e)` dispatches on `e.parameter.action`, default action is the public unauthenticated
  read.
- `CacheService` wraps the Sheet read (15-min TTL precedent) so traffic volume never translates
  into Sheet-read volume.
- Any privileged action (anything beyond the public read) is gated by
  `isAuthorizedSyncRequest(e)` — a shared-secret token compared with `===`, stored in
  `PropertiesService.getScriptProperties()`, never hardcoded.
- If the action accepts a client-supplied ID to fetch something (a file, a row), **look it up
  against the live data first and only act on a match** — never use a client-supplied ID
  (especially a Drive `fileId`) directly. This is what keeps a leaked token from being usable to
  pull arbitrary files. See `handleFetchImage` in the spec doc for the working example.

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
- [ ] **Any debounce/rate-limit on a Sheet-edit-triggered dispatch** (so rapid edits don't spam
  GitHub Actions) — the ABL precedent uses a 2-minute debounce via a stored timestamp property.

### 4. Scaffold the client-side hook and config

Mirror `src/hooks/useABLData.js` (fetch + `sessionStorage` cache, matching the Apps Script's
`CacheService` TTL) and `src/config/abl.js` (API URL from env, cache TTL constant, any
tab/category style mapping). New env vars go in `.env.development` (gitignored) and as GitHub
Actions repository secrets for production — never hardcoded.

### 5. If media needs self-hosting, scaffold the sync pipeline

Mirror `scripts/sync-abl-thumbnails.js` and `.github/workflows/sync-abl-thumbnails.yml` —
token-gated manifest/fetch actions, retry-with-backoff, the security checklist in step 3 above
applied to the new script, committing only the specific asset directory + manifest path (not a
broad `git add -A`).

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
ABL one.

## Reference implementation

`docs/ABL-RESOURCE-LIBRARY-SPEC.md` (Apps Script + architecture), `src/hooks/useABLData.js`,
`src/config/abl.js`, `scripts/sync-abl-thumbnails.js`, `.github/workflows/sync-abl-thumbnails.yml`,
`docs/ABL-APPSCRIPT-SETUP-GUIDE.md`, `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`. Read the actual
current state of these before copying — don't pattern-match from memory of what they used to do.
