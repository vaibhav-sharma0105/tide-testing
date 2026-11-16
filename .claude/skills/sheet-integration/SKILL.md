---
name: sheet-integration
description: >
  TRIGGER — invoke this when the user wants to connect a Google Sheet (or Google Form responses)
  to the site, add a new site section backed by a Sheet that a non-technical person edits, or
  "do what we did for the Pramaan Library / Pramaan but for X". The standard is SNAPSHOT MODE as
  built for /pramaan-library: private Sheet → token-gated Apps Script (no public listing) →
  GitHub Actions sync with safety rules → committed JSON snapshot + self-hosted photos → page
  built from the snapshot. Follow docs/SHEET-INTEGRATION-PLAYBOOK.md (principles, naming, build
  order, page design, security checklist, go-live lessons). Do NOT copy the older live-API
  pattern (useABLData / public doGet read / VITE_* Sheet URL in the bundle) — it is legacy.
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

**Reference implementation:** the Pramaan Library — `apps-script/pramaan-library/Code.gs`,
`scripts/sync-pramaan-library.js`, `scripts/lib/library-snapshot.js`,
`.github/workflows/sync-pramaan-library.yml`, `checkLibrarySnapshot()` in
`scripts/validate-content.js`, `src/pages/library/`, `src/components/library/`,
`src/utils/libraryFilters.js`, `content/pages/pramaan-library.yaml`,
`docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md`, `docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md`.
Read the current files before copying — never pattern-match from memory.

**Legacy, do not copy:** `src/hooks/useABLData.js`, the ABL script's public `doGet` read, and
`VITE_ABL_API_URL` reaching the browser. They still run for `/pramaan/*` until Phase 3 of
`docs/PRAMAAN-HARDENING-PLAN.md`; `docs/ABL-RESOURCE-LIBRARY-SPEC.md` describes that older design.

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
   environment and the **real header row** (`src/test/scripts/libraryAppsScript.test.js`).
3. **Rules lib + sync script + workflow + `content:validate` backstop**, copied from the
   reference and renamed per the naming table. Prove them against a **fake Apps Script server**
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
