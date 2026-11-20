# Request template: connect a new Google Sheet to the site

**Who is this for?** The site owner (or whoever asks an AI agent or a developer to connect a Sheet).
**What is it?** A message to copy into a **new** conversation when a page should show data from a
Google Sheet (or Google Form responses), built the same way as the Pramaan Resource Centre and the
Publications pages.

The technical standard is `docs/SHEET-INTEGRATION-PLAYBOOK.md` (an agent also loads the
`sheet-integration` skill automatically). This template only adds what the standard cannot know —
the page, the Sheet, the stakeholder's wishes — and the working rules learned on the first two
integrations (2026-11-16 Resource Centre, 2026-11-20 Publications).

---

## Before you start, gather

- [ ] The Sheet link, and your account has **edit** access to it.
- [ ] Which columns hold personal data (emails, phone numbers, names of private people…).
- [ ] The stakeholder's mapping: which column becomes which part of the page.
- [ ] Who may publish: every row, or only rows with an approval/consent answer?
- [ ] The stakeholder's feedback notes, word for word.
- [ ] ~10 minutes for the owner setup: deploy the Sheet's Apps Script, create a fine-grained GitHub
      token (this repository only, Actions read/write, calendar reminder before it expires), add two
      GitHub secrets. The agent walks you through it.

## The message to paste (fill in the `< >` parts)

````markdown
I want to connect a Google Sheet to an existing page, the same way as the Pramaan
Resource Centre and the Publications pages. Follow docs/SHEET-INTEGRATION-PLAYBOOK.md
and the sheet-integration skill (snapshot mode: private Sheet → token-gated Apps Script →
GitHub Actions sync with safety rules → committed snapshot + self-hosted images → page).

## The page
- Page / route: <e.g. /about/our-team>  (existing page: keep its route and YAML)
- What it should show: <one or two sentences>
- Who visits it and why: <e.g. donors checking credibility, teachers looking for a resource>

## The Sheet
- Link: <Sheet URL> — read the header row from the Sheet itself; match columns by header, not letter
- Owner account: <email or role> · Who edits it: <stakeholder / Form submissions>
- Filled by a Google Form? <yes/no> · Form link: <if yes>
- Columns with personal data (must never leave the Sheet): <e.g. Email address, Phone>
- Who gets published: <every row / only rows with an approval or consent column = Yes>

## Column → page mapping (from the stakeholder)
| What the page shows | Column header | Notes |
|---|---|---|
| Title | <header> | |
| Date / order by | <header> | newest first? |
| Category / filter tag | <header> | one value or several (checkboxes)? |
| Image | <header> | Drive upload? |
| Link | <header> | |
| <other> | <header> | |

## Stakeholder notes (verbatim — treat as requirements to check, not as facts)
<paste the stakeholder's feedback notes here>

## My decisions and preferences
- <e.g. filters needed: type + year; page size 12; featured item: latest X>
- <anything already decided, with the date>

## Working rules (from our earlier integrations)
1. Facts only (CLAUDE.md): read the real Sheet, code and data; never invent content,
   names, numbers or copy. Ask me when something isn't known.
2. Do NOT change the stakeholder's Sheet (no new columns, no edits) unless I approve it
   explicitly. Suggest changes; I take them to the stakeholder.
3. Before building, list what you read from the Sheet, ask your open questions in one go,
   and propose the plan. Then build in the playbook's order.
4. Never commit data made locally from Sheet rows; only the GitHub sync publishes data.
   Secrets go into GitHub before any push with a non-empty snapshot. Guide me through the
   owner setup (Apps Script, token, secrets) one step at a time.
5. Security: token-gated Apps Script, no public listing, field allowlist, personal columns
   never read, http(s) links only, safety limits on mass removals, alerts as GitHub Issues.
6. UI/UX: reuse the Publications building blocks where they fit (PublicationMedia-style
   fixed frames with the whole image, the shared search + filter bar with counts, URL state,
   numbered pages). Filters and counts come from the data, never hard-coded. All visible
   text in YAML (cms-integrity). WCAG 2.2 AA; check phone width.
7. Show me the page in the dev server as you go; I'll give UI feedback in rounds.
8. Commit and push only when I ask.

## Done means
- npm run lint, content:validate, npm test, build, test:e2e and scripts/a11y-audit.cjs all pass.
- Owner setup guide + Sheet schema doc written; OPERATIONS/MIGRATION docs, CLAUDE.md,
  AGENTS.md and both docs/ARCHITECTURE*.html diagrams updated (doc-sync).
- A subagent audits the code against best practices and the docs against the code;
  real findings fixed.
- Open questions for the stakeholder collected in docs/STAKEHOLDER-REVIEW-<date>.md.
````

## Why these rules exist (what happened before)

| Rule | Learned from |
|---|---|
| Read headers from the Sheet; match by header | The Publications brief named a thumbnail column by letter; the Sheet had it elsewhere (`docs/PUBLICATIONS-SHEET-SCHEMA.md`). |
| No changes to the stakeholder's Sheet without approval | 2026-11-20: a suggested "Hide from website" column, filled in during testing, took three rows off the live Publications pages until it was removed. |
| Never commit locally made data | A local design preview has different row ids; the next real sync refused it as a mass removal. |
| Filters and counts from the data | The TIDE page first had type buttons and wording tied to "annual reports"; new types from the Sheet would not have fitted. |
| A subagent audit at the end | The 2026-11-21 audit found a search-box race, workflow permission gaps and ~60 stale doc statements that tests and lint did not catch. |

Keep this file in step with the playbook: if the standard changes, update the message above too
(the `doc-sync` skill lists this file).
