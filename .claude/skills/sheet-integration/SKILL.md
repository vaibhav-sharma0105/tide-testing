---
name: sheet-integration
description: >
  TRIGGER — invoke this when the user wants to connect a Google Sheet (or Google Form responses)
  to the site, add a new site section backed by a Sheet that a non-technical person edits, or
  "do what we did for the Pramaan Library / Resource Centre but for X". The standard is SNAPSHOT
  MODE as built for the Pramaan Resource Centre (/pramaan/resource-centre, code named
  "library"): private Sheet → token-gated Apps Script (no public listing) →
  GitHub Actions sync with safety rules → committed JSON snapshot + self-hosted photos → page
  built from the snapshot. Follow docs/SHEET-INTEGRATION-PLAYBOOK.md (principles, naming, build
  order, page design, security checklist, go-live lessons). Never read a Sheet live in
  the browser (no public doGet listing, no VITE_* Sheet URL in the bundle) — that older pattern
  (useABLData) was retired and deleted on 2026-11-19.
  SKIP if the content is static (use the YAML CMS and cms-integrity) or if the change only
  extends an existing integration's Sheet (then it's a normal change to that integration).
---

# Sheet Integration — connect a new Sheet the Pramaan Library way

## Why this exists

Every Sheet connected so far taught something the hard way: a token that could leak into a
public Actions log and a Sheet value flowing into a file path (ABL audit, 2026-06-21); one
workflow's queued run silently replacing another's in a shared concurrency group; YouTube embeds
blocked by the CSP; a snapshot built from **test** consent committed to a public repository
(Pramaan Library launch, 2026-11-16). `docs/SHEET-INTEGRATION-PLAYBOOK.md` turns all of that into
one standard. This skill is the procedure for applying it, so the next integration starts with
those lessons instead of rediscovering them.

**The owner's request** usually follows `docs/NEW-SHEET-INTEGRATION-REQUEST.md` (page, Sheet,
column mapping, stakeholder notes, and eight working rules — e.g. never change the stakeholder's
Sheet without approval, never commit locally made data, commit only when asked). If the request
is missing any of that template's facts, ask for them before building; follow its working rules
either way.

**Reference implementation:** the Pramaan Library, served as the Pramaan Resource Centre at
`/pramaan/resource-centre` — `apps-script/pramaan-library/Code.gs`,
`scripts/sync-pramaan-library.js`, `scripts/lib/library-snapshot.js` (+ the shared
`scripts/lib/snapshot-core.js` for pure rules and `scripts/lib/sync-runner.js` for the sync's I/O),
`.github/workflows/sync-pramaan-library.yml`, `checkLibrarySnapshot()` in
`scripts/validate-content.js`, `src/pages/library/`, `src/components/library/`,
`src/utils/libraryFilters.js`, `content/pages/pramaan-library.yaml`,
`docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`.
Read the current files before copying — never pattern-match from memory.

**Second implementation (2026-11-20):** Publications — `apps-script/publications/Code.gs`,
`scripts/sync-publications.js`, `scripts/lib/publications-snapshot.js`, `scripts/lib/publications-images.js`,
`.github/workflows/sync-publications.yml`, `checkPublicationsSnapshot()`, `src/pages/publications/`,
`src/components/publications/`, `src/config/publications.js`. It shows one Sheet feeding two pages (split by a
column, limits checked per page). Its pages have their own layouts fitted to their content (TIDE: featured
report spotlight + one filterable library of cards, pages of 12; THRIvE: year-grouped list with search,
type/field/year filters and numbered pages of 12 in `?page=`), with every threshold a named
constant in `src/config/publications.js`. They have their own controls (`PublicationControls`,
`src/hooks/usePublicationControls.js`) and share only `src/utils/listingFilters.js` and `focusRing`/`FOCUS_PILL`;
`src/components/listing/`, `src/hooks/useSidebarFits.js` and `Pagination` are used by the Resource Centre —
reuse what fits (playbook §5 "Reuse"). For uploads that are screenshots of mixed shapes, copy the image step in
`scripts/lib/publications-images.js` (trim borders, ratio range, sizes recorded in the manifest; playbook §5).

**Third implementation (2026-11-21, not live until the owner's setup):** Partners — an existing page
(`/about/our-partners`, YAML kept) fed by `apps-script/partners/Code.gs`, `scripts/sync-partners.js`,
`scripts/lib/partners-snapshot.js`, `scripts/lib/partners-images.js` (logos: trim, never crop, keep
transparency; small raster files sent as the original by `fetchImage`), `.github/workflows/sync-partners.yml`,
`checkPartnersSnapshot()`, `src/components/partners/`, `src/config/partners.js` (also imported by the rules lib,
so the page order and the sync's "unknown priority" report agree). Reused `SearchField` + `useDebouncedSearch`.
Its stakeholder notes named columns by letter wrongly — always map by the real header row.

**Retired, do not reintroduce:** a browser-side Sheet read (the former `useABLData` hook, a public
`doGet` listing, a `VITE_*` Sheet URL in the bundle). It was deleted on 2026-11-19
(`docs/PRAMAAN-HARDENING-PLAN.md` §13); the code is only in the local git tag
`archive/pramaan-live-read`.

## Ground rules while doing this

- **Facts only** (CLAUDE.md): column names, publish rules, filters, page text and links come from
  the owner or the Sheet's header row — ask when missing.
- **Personal data:** never read, print, copy or commit personal columns. To learn the structure,
  read the header row only.
- **Secrets:** never paste or print a token or the web-app URL; `.env.development` is git-ignored
  — don't open or print it. Guide the owner to enter credentials; never enter them yourself.
- **Commit/push only when the user asks.**

## Procedure

Follow the playbook's §4 build order; the checkpoints below are where integrations go wrong.

1. **Scope with the owner** (playbook §4.1): Sheet + tab, public vs personal columns, publish gate,
   filters/sort fields, photos/videos, linked or unlinked + `noindex`, row count. Pick the
   `<slug>` and `<PREFIX>`, and check the naming table (playbook §3) for collisions: a free cron
   minute and heartbeat hour, unique issue titles, a photo-manifest name that is not a YAML basename.
2. **Write `docs/<SLUG>-SHEET-SCHEMA.md` first**, then the Apps Script from the library's
   `Code.gs`. Keep every principle P1–P13 (playbook §2). Test it with the simulated Google
   environment and the **real header row** (`src/test/scripts/libraryAppsScript.test.js`; build the
   sandbox with `makeAppsScriptEnv()` from `src/test/scripts/helpers/fakeAppsScript.js`, don't copy it).
3. **Rules lib + sync script + workflow + `content:validate` backstop**, copied from the
   reference and renamed per the naming table. The sync script **imports** its plumbing from
   `scripts/lib/sync-runner.js` (env loader, redaction, fetch + retry, report, outputs, refusal,
   photo loops) and the shared pure helpers from `snapshot-core.js` — only paths, names, messages,
   the stats line and `processPhoto` are written per integration (playbook §4.4–4.5, §9). Prove them against a **fake Apps Script server**
   with made-up rows: publish, no-change run, refusal on mass removal, token never printed, and
   the photo cap continuing on the next run.
4. **Page** per playbook §5: toolbar (search + sort) above the cards; filter card/drawer;
   faceted counts; option order "All" → A→Z → "Other"; URL state; fixed page size; empty and
   no-match states; detail page that hides empty sections. All text in
   `content/pages/<slug>.yaml` (run the `cms-integrity` skill). Add embed hosts to the CSP
   `frame-src`. If this is the **second** page that needs the library's listing UI, extract the
   shared parts instead of copying them (playbook §5 "Reuse").
5. **Security checklist** (playbook §6): go through every line and say which ones you verified.
6. **Docs:** setup guide + the doc-sync list (playbook §8), including the "taken" cron/heartbeat
   list in playbook §3. Then run the `doc-sync` skill.
7. **Verify:** `npm run lint`, `npm test`, `npm run content:validate`,
   `GITHUB_ACTIONS=true npm run build`; check the page at phone, tablet and laptop sizes, portrait
   and landscape (no horizontal overflow).
8. **Go-live with the owner** (playbook §7), one step at a time in plain words:
   token → Script Properties → `setup` + "Notify me immediately" → GitHub secrets → confirm
   `ALERT_ASSIGNEE` → (user approves) push → `testDispatch` (HTTP 204) → watch the first run with
   `gh run watch` → edit test.
   - **Before any push, check that the committed snapshot reflects real consent or approval,**
     not test data. The repository is public and history keeps everything.
   - **Push only after the secrets exist**, or every run fails and alerts.
   - **An intended mass change** goes through `allow_large_change`; never loosen the thresholds.

## Report back

State what was built, which checklist items were verified (and how), what is **not** verified,
and what the owner still has to do. Results as they really are: failed runs, refusals, skipped steps.
