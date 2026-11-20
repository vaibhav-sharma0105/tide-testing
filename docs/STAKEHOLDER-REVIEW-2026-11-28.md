# Stakeholder review — Publications pages (meeting 2026-11-28)

**Status:** parked until the owner's meeting with the stakeholder on 2026-11-28 (owner decision,
2026-11-21). Until then, **no changes are made to the stakeholder's Sheet** ("TIDE THRIvE
Publications (Responses)") and none of the questions below are acted on.

Pages: `/tide/publications` and `/thrive/publications` (live; first sync 2026-11-20, commit
`f524770`). Everything below was read from the code, the Sheet snapshot or GitHub on 2026-11-21.

---

## 1. For the record: the publications sync token

| What | Value | Source |
|---|---|---|
| Token type and permission | GitHub fine-grained token, **Actions: read & write** | the owner, 2026-11-21 |
| Reminder | calendar reminder **one year** out | the owner, 2026-11-21 |
| Where it lives | the Publications Sheet's Apps Script, Script Property `GITHUB_PAT` | `apps-script/publications/Code.gs` |
| Not recorded yet | the token's **name** and its exact **expiry date** | — please note both at the meeting |

When it expires, Sheet edits stop reaching the website quickly; they then wait for the automatic run
every 6 hours. How to renew: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`. Whoever owns the Sheet after a
handover needs to know this date.

**Owner to-do (later, not urgent):** delete the two unused old repository secrets
`ABL_SYNC_TOKEN` and `VITE_ABL_API_URL` (GitHub → repository Settings → Secrets and variables →
Actions). No code uses them.

---

## 2. Rows in the Sheet that need a decision

From the open GitHub issue **#7 "Publications Sheet: some rows need attention"** (re-checked by every
sync). Row ids are the website's anonymous ids, shown in that issue.

| # | Publication | What the sync found | Question for the stakeholder |
|---|---|---|---|
| a | "Happiness Education in India: Two Researchers Set out to Ask What Students and Teachers Think" (P-43d9a5039d) | the link cell has text but no web link | What is the link? (Shown today without a "Read" button.) |
| b | "Happiness Education in India: …" — a second row (P-ffa05bbb22) | same title as (a) | Double submission, or two different pieces? |
| c | "Teaching against the odds: Teachers with disabilities in Indian mainstream schools" (P-1fa0424cb7 and P-71a598e3e5) | same title twice | Double submission, or two different pieces? |
| d | "Learning to Live Together Harmoniously…" (P-b104efe293, P-bb217f72be, P-9a5466ddc6, P-e6caf1e323) | same title four times | Their citations name different reviewers (e.g. Timalsina 2025, Jha 2024), so they may be separate reviews of the book — please confirm each is a distinct piece. Not verified. |

Duplicates are published as they are; the sync only reports them.

## 3. Other Sheet content

- **Two names for one type?** THRIvE has "Conference slides" (1 row) and "Talk / Conference slides"
  (3 rows). They show as two separate filter choices. Should they be one?
- **A temporary link:** "Happiness in education from the lens of children: Photovoice of students in
  government run schools in India" (P-88fc05ebde) links to a `pdf.sciencedirectassets.com` address,
  which stops working after a while. Its own citation gives the permanent DOI
  `https://doi.org/10.1016/j.ssaho.2025.101244` — use that instead?
- **Taking a row down without deleting it:** possible by adding a column headed `Hide from website`
  and typing `Yes` (supported by the code; the column does not exist and will only be added if the
  stakeholder wants it).

## 4. Wording written by the developer — needs approval

None of this text came from the stakeholder; it can be changed in the files shown.

| Where | Current text | File |
|---|---|---|
| TIDE page subtitle | "Our reports, research and talks — an open, year-by-year record of TIDE Foundation's work in education." | `content/pages/tide-publications.yaml` (`meta.subtitle`) |
| THRIvE page subtitle | "Journal articles, books, talks and coverage of our research on holistic education, social emotional learning, teacher agency and inclusive education." | `content/pages/thrive-publications.yaml` (`meta.subtitle`) |
| Menu descriptions | TIDE Publications: "Annual reports, project reports & talks" · THRIvE Publications: "Journal articles, books & talks" | `content/shared/navigation.yaml` |
| TIDE spotlight | "Latest edition", "See all {n} editions" | `tide-publications.yaml` (`featured`) |
| TIDE library | "All publications" — "Everything TIDE has published, newest first — search it, or narrow it by type and year." | `tide-publications.yaml` (`library`) |
| THRIvE entry headings | "APA reference", "About this work" | `thrive-publications.yaml` (`entry`) |
| THRIvE source names | e.g. ukfiet.org → "UKFIET", taylorfrancis.com → "Routledge", tandfonline.com → "Taylor & Francis Online" (23 web addresses, 22 names — ScienceDirect has two addresses) | `thrive-publications.yaml` (`source.names`) |

## 5. For the owner to check (found in the 2026-11-21 code audit)

- **Is the Form's upload folder shared?** Each thumbnail's Google Drive file id is in the public data
  (`src/data/publications-photos.json` and the snapshot's `photoUrl`). An id alone does not open a file:
  Drive's sharing decides. Form uploads are private to the Form owner by default — please confirm the
  upload folder is **not** shared as "Anyone with the link". (Not verified; it can only be checked in
  the owner's Drive.)
- **Who can submit the Form?** Every answer with TIDE/THRIvE and a title goes live (decision of
  2026-11-20), so anyone with the Form link can put a link on the website. Restricting the Form to
  signed-in members of the organisation would close that. Titles also appear in the GitHub "rows need
  attention" issue; since 2026-11-21 an "@name" there can no longer notify a GitHub user.

## 6. Decisions already made (for information)

- TIDE page address is now `/tide/publications`; the old `/about/publications` forwards to it.
- No "Source" line on the TIDE page (all its links are Google Drive links).
- The "publications per year" chart is switched off on both pages (`HERO_CHART` in
  `src/config/publications.js`), because the current year's short bar reads as a decline.
- Every Form answer with TIDE/THRIvE + a title goes live (no approval column; decided 2026-11-20).
