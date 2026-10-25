# Stranded Pages Review (HISTORICAL - the pages reviewed here no longer exist)

> **Outcome (2026-10-25):** the stakeholder decision this review asked for was made: all 16 "stranded" routes listed below were **removed entirely, with no redirects**. Their page components (`OurResults`, `WorkWithUs`, `SaralKadam`, `AnnualReports`, `resources/Publications`, everything under `src/pages/projects/`), YAML, generated JSON and the `TodoPlaceholder` component were deleted, and the legacy duplicates `/get-involved/mccx` and `/resources/abl-resources/*` are gone too. Those URLs now render the NotFound page (test: `src/test/routing/removedRoutes.test.jsx`); `src/App.jsx` registers 19 `<Route>`s (16 primary + `/coming-soon`, `/404`, `*`). Everything below is the unedited 2026-06-21 review, kept as a record. To recover any deleted file: `git checkout a4126d1 -- <path>` (e.g. `src/pages/projects/BlockETI.jsx`).

Generated 2026-06-21. Companion to `docs/specs/site-restructure-plan.md`.

Two lists: pages reachable from the header menu today, and pages that exist as live routes but
have no navigation path to them from the homepage (footer links ignored, per request — a footer
link doesn't count as "reachable" for this review).

---

## List 1 — Pages reachable from the header menu (incl. dropdown sub-links) + functional pages

- (logo → Home) — `/`
- About Us (dropdown — not itself a page)
  - Why TIDE? — `/about/why-tide`
  - Past Programs — `/about/past-programs`
  - Our Team — `/about/our-team`
  - Our Partners — `/about/our-partners`
  - Get Involved (label in dropdown → Volunteer page) — `/get-involved/volunteer`
  - Our Publications — `/about/publications`
- Education for Harmony (dropdown — not itself a page)
  - Ecosystem of Programs — `/education-for-harmony`
  - Organise your MCCx — `/education-for-harmony/mccx`
- Pramaan (dropdown — not itself a page)
  - About Pramaan — `/pramaan`
  - Resource Centre — `/pramaan/resource-centre`
  - Contribute — `/pramaan/contribute`
- THRIvE Research Centre — `/thrive`
- Contact Us — `/contact`
- Donate (header CTA button) — `/get-involved/donate`
- 404 — Page Not Found (functional, catch-all) — `*` (any unmatched path)

**Not included in either list:** `/pramaan/resource-centre/:id` (individual resource detail
page). Not a header link, but reachable through normal use — clicking any resource card on the
Resource Centre page.

---

## List 2 — Pages with no navigation path from the homepage (footer ignored)

These exist as live routes and will load if visited directly, but nothing in the header — or
any other page's UI — links to them.

- Our Results — `/about/our-results`
- Block Educational Transformation Initiative — `/projects/block-eti`
- BetterED — `/projects/bettered`
- EmpowerEd — `/projects/empowered`
- CompletEd — `/projects/completed`
- Other Projects — `/projects/other-projects`
- SDG Drives — `/projects/sdg-drives`
- Work With Us — `/get-involved/work-with-us`
- Organise your MCCx (legacy duplicate — header points to `/education-for-harmony/mccx` instead) — `/get-involved/mccx`
- Saral Kadam Materials — `/resources/saral-kadam`
- Annual Reports — `/resources/annual-reports`
- Our Publications (legacy duplicate — header points to `/about/publications` instead) — `/resources/publications`
- About Pramaan (legacy duplicate — header points to `/pramaan` instead) — `/resources/abl-resources`
- Resource Centre (legacy duplicate — header points to `/pramaan/resource-centre` instead) — `/resources/abl-resources/resource-center`
- Resource detail (legacy duplicate, dynamic) — `/resources/abl-resources/resource-center/:id`
- Contribute (legacy duplicate — header points to `/pramaan/contribute` instead) — `/resources/abl-resources/contribute`

These 16 are exactly the routes `src/App.jsx` itself comments as "Stranded routes — accessible
via URL, not in nav... pending stakeholder decision on redirect/removal."

---

## Two different kinds of decision needed

**6 pure legacy duplicates** of pages already in the header under a new path — `/get-involved/mccx`,
`/resources/publications`, and the four `/resources/abl-resources/*` paths. These don't need a
content decision, just a technical one: redirect old → new (so old bookmarks/external links land
on working content instead of a dead duplicate or a 404), or leave as-is.

**10 pages with real, non-duplicate content** and no current header link — Our Results, Block ETI,
BetterED, EmpowerEd, CompletEd, Other Projects, SDG Drives, Work With Us, Saral Kadam, Annual
Reports. This needs an actual content call per page: was it intentionally dropped from the nav
during the restructure (→ remove the route), or should it be added back into a menu somewhere
(→ decide where)?
