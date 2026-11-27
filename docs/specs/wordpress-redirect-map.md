# WordPress → new site address map (draft for go-live)

**Status:** agreed 2026-11-27. Machine-readable copy for go-live: `docs/specs/wordpress-redirects.json` (same 59 rows). Used at go-live (audit ledger → "Go-live checklist", step 6). Nothing in the site uses it yet.

**Source of the old addresses:** `https://tideinternational.org/page-sitemap.xml` and `testimonials_category-sitemap.xml`, fetched 2026-11-27. The sitemap index (`/sitemap.xml`, All in One SEO v5.0.0.1) lists only these two sitemaps: **58 pages + 1 testimonials category**. Posts, media pages and anything not in the sitemap are not covered. The robots.txt also names `/sitemap.rss`; it was fetched and its 52 addresses are all in the page sitemap (no extra pages).

**How the forwarding works:** GitHub Pages can't send real 301 redirects. At go-live the build writes one small forwarding page per old address (the mechanism of `REDIRECT_ROUTES` in `src/config/siteRoutes.js`). The page is noindex, names the new address as canonical and forwards the visitor there.

**How each row was matched:** only by the old address (its slug) and the names that appear on the new site (file cited); the old pages' contents were not read. The 27 addresses that no new page names were then researched by reading each old page (2026-11-27, all 27 fetched with HTTP 200) and sent to the page that covers the same topic, so their search reputation carries over; only the 2 empty old pages go to the homepage (owner: when unsure, homepage).

## Same thing on the new site

| Old address | New address | Basis |
|---|---|---|
| `/` | `/` | home |
| `/about-us/` | `/about/why-tide` | About Us → Why TIDE |
| `/why-tide/` | `/about/why-tide` | same name |
| `/our-team/` | `/about/our-team` | same name |
| `/our-partners/` | `/about/our-partners` | same name |
| `/our-publications/` | `/tide/publications` | same name |
| `/annual-reports/` | `/tide/publications` | annual reports are on TIDE Publications (`tide-publications.yaml` `featuredType`) |
| `/thrive-research-centre/` | `/thrive` | same name |
| `/model-city-council/` | `/education-for-harmony/mccx` | MCC page (`get-involved-mccx.yaml`) |
| `/volunteer-with-us/` | `/get-involved/volunteer` | same name |
| `/workwithus/` | `/get-involved/volunteer` | "Work with us" section on that page (`get-involved-volunteer.yaml` `join`) |
| `/contact-us/` | `/contact` | same name |
| `/socialchangemakersfellowship/` | `/education-for-harmony/social-changemakers` | the Fellowship page |
| `/social-changemakers-team/` | `/education-for-harmony/social-changemakers` | the Fellowship page |
| `/prerak/` | `/about/past-programs` | "Prerak" on Past Programs (`about-past-programs.yaml:13`) |
| `/bettered/` | `/about/past-programs` | "BetterEd" (`about-past-programs.yaml:29`) |
| `/completed-2/` | `/about/past-programs` | "CompletEd" (`about-past-programs.yaml:47`) |
| `/empowered/` | `/about/past-programs` | "EmpowerEd" (`about-past-programs.yaml:61`) |
| `/empowered-sanand/` | `/about/past-programs` | EmpowerEd (`about-past-programs.yaml:61`) |

## Fellow pages → the Social Changemakers list

Each old fellow page forwards to the list of fellows, never to one person's profile (owner decision 2026-11-27).

| Old address | New address |
|---|---|
| `/tanay-sanghvi-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/anaya-zaveri-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/anaya-patel-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/hiya-patel-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/havisha-chokshi-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/samaya-bhowmick-sc-fellowship/` | `/education-for-harmony/social-changemakers` |
| `/yashvit-sancheti-mindful-futures/` | `/education-for-harmony/social-changemakers` |
| `/arav-gupta-and-prisha-arora-sc-fellowship/` | `/education-for-harmony/social-changemakers` |

## Named on the new site

| Old address | New address | Basis |
|---|---|---|
| `/mccxggis25/`, `/mccx-25-at-ggis/`, `/mccxau25/`, `/mccx-25-at-au/` | `/education-for-harmony/mccx` | MCCx event pages (2025 sessions); the MCCx page lists past sessions (`get-involved-mccx.yaml`) |
| `/disha/` | `/education-for-harmony` | "Disha camps" (`education-for-harmony.yaml`, Workshops and camps) |

## Researched by content (the old page was read)

Confidence: **High** = the old page is about what the new page shows; **Medium** = closely related; **Low** = nearest available (no real equivalent).

| Old address | New address | Confidence | What the old page is about → why this page |
|---|---|---|---|
| `/exploring-the-happiness-curriculum/` | `/thrive/publications?search=happiness` | High | old page "Exploring the happiness curriculum" (Delhi Happiness Curriculum research + papers); search returns 7 THRIvE rows |
| `/citizenship-education-through-contextualized-discussions-of-sustainability/` | `/education-for-harmony/mccx` | Medium | a dissertation on students in TIDE's Model City Council; no publication row matches; MCC page `get-involved-mccx.yaml` |
| `/role-of-social-changemaking-projects-in-holistic-development/` | `/education-for-harmony` | Medium | article on social changemaking projects in holistic development; no publication row; `education-for-harmony.yaml` (Social Changemakers, holistic aims); the Social Changemakers list is an alternative |
| `/researching-value-based-education/` | `/thrive` | High | "Researching Value Based Education" hub (research profiles, publications, happiness-curricula study) = the research centre |
| `/help-us-bring-a-change/` | `/get-involved/donate` | High | old page title "Donate Now" |
| `/apply-now/` | `/get-involved/volunteer` | High | internship "Apply Now!"; volunteer page covers "Volunteer or intern" |
| `/testimonials-category/home/` | `/` | Low | empty archive ("No posts were found"); nothing to match |
| `/miracleofideas/` | `/tide/publications?search=miracle+of+ideas` | Medium | "Miracle of Ideas" public talk series (2017); search returns 1 TIDE row "Miracle of Ideas" (P-d1fa62a399) |
| `/miracleofideas2017/` | `/tide/publications?search=miracle+of+ideas` | High | "Miracle of Ideas 2017 – Changing with Times"; same row P-d1fa62a399 |
| `/moi2023/` | `/thrive/publications?search=happiness` | Low | MOI 2023 student exhibition on happiness in education; no event page on the new site; nearest topic |
| `/miracle-of-ideas-2024/` | `/education-for-harmony` | Medium | MOI 2024 event (exhibition, talks, MCC, interventions); nearest: Exposure and deliberator events on Education for Harmony |
| `/miracle-of-ideas-2024-panel-talks/` | `/education-for-harmony` | Low | MOI 2024 panel talks; no talks page; same parent as MOI 2024 |
| `/miracle-of-ideas-2024-mcc/` | `/education-for-harmony/mccx` | High | "Miracle Of Ideas 2024 – Model City Council" |
| `/miracle-of-ideas-exhibition-24/` | `/education-for-harmony` | Low | call for artwork for the MOI 2024 exhibition; same parent as MOI 2024 |
| `/miracle-of-ideas-2024-interventions/` | `/education-for-harmony` | High | workshops, social change-making fellowship, SDG drives = the Education for Harmony ecosystem |
| `/sdg-drives/` | `/get-involved/volunteer` | Medium | SDG volunteer drives with volunteer / campus-ambassador registration |
| `/happiness-in-education-virtual-exhibition/` | `/thrive/publications?search=happiness` | Low | empty shell (unrendered gallery); by title part of MOI 2023, same destination |
| `/saral-kadam-program/` | `/pramaan` | Medium | activity-based foundational numeracy classes "across over 120 schools"; Pramaan covers ABL and 120+ schools (`abl-home.yaml`) |
| `/saral-kadam-materials/` | `/pramaan/resource-centre?subject=mathematics` | Medium | open numeracy materials; Resource Centre has 159 Mathematics resources (not checked whether the Saral Kadam booklets are among them) |
| `/block-educational-transformation-intiative/` | `/tide/publications?search=BETI` | Medium | BETI programme phases; search returns 1 TIDE row "BETI year 24-25 report" (P-4dacbae1ef) |
| `/prabhav/` | `/thrive/publications?search=teacher+agency` | Medium | PRABHAV teacher-agency study (Bihar, Schools2030), from its summary PDF; search returns 6 THRIvE rows |
| `/twd/` | `/thrive/publications?search=disabilities` | High | "Empowering Teachers with Disabilities"; search returns 3 THRIvE rows |
| `/tide-fellowship/` | `/get-involved/volunteer` | Medium | "TIDE Fellowship" placement (a 2019 draft page); nearest: join the team on the volunteer page |
| `/other-project/` | `/about/past-programs` | High | old page title "Past and Other Programs" |
| `/portfolio/` | `/` | Low | heading "Portfolio" and no content; nothing to match |
| `/our-results/` | `/about/past-programs` | Medium | "Our Results": reach figures per programme; Past Programs shows programme figures |
| `/faqs/` | `/get-involved/volunteer` | High | old page title "Internship Eligibility and FAQs" |

**Count:** 19 same page + 8 fellow pages + 5 named + 27 researched = 59 (58 pages + 1 category).

## Notes for go-live

- **Addresses with `?search=` / `?subject=`** (8 rows): the publications pages read `search` (`src/utils/publicationFilters.js`), the Resource Centre reads `subject` (`src/pages/library/PramaanLibrary.jsx`). The forwarding page as built today (`redirectHtml`, `scripts/lib/prerender-check.js:46-60`) puts `to` into the canonical link as is and appends the visitor's own query string to it. Before adding these rows, make the canonical the path without the query, and join the two query strings with `&` when both exist. The search results come from the Sheet snapshot and change with each sync; re-run the searches on go-live day.
- **Fellow pages** forward to the Social Changemakers list (no `?fellow=`), so no forward names one person.
- **The two empty old pages** (`/testimonials-category/home/`, `/portfolio/`) have no content; the homepage is used.
- Raw copies of the 27 researched pages (2026-11-27): the session scratchpad, not kept in the repo.
