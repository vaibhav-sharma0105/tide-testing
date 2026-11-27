# WordPress → new site address map (draft for go-live)

**Status:** DRAFT, 2026-11-27, for the owner to approve. Used at go-live (audit ledger → "Go-live checklist", step 6). Nothing in the site uses it yet.

**Source of the old addresses:** `https://tideinternational.org/page-sitemap.xml` and `testimonials_category-sitemap.xml`, fetched 2026-11-27. The sitemap index (`/sitemap.xml`, All in One SEO v5.0.0.1) lists only these two sitemaps: **58 pages + 1 testimonials category**. Posts, media pages and anything not in the sitemap are not covered. The robots.txt also names `/sitemap.rss`; it was fetched and its 52 addresses are all in the page sitemap (no extra pages).

**How the forwarding works:** GitHub Pages can't send real 301 redirects. At go-live the build writes one small forwarding page per old address (the mechanism of `REDIRECT_ROUTES` in `src/config/siteRoutes.js`). The page is noindex, names the new address as canonical and forwards the visitor there.

**How each row was matched:** only by the old address (its slug) and the names that appear on the new site (file cited). The old pages' contents were **not** read, so rows marked **Check** or **Your call** need the owner.

- **Match:** the new site has a page for the same thing.
- **Check:** a likely match from the slug; please confirm.
- **Your call:** no clear equivalent; choose a page, or let it show "page not found".

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
| `/completed-2/` | `/about/past-programs` | "CompletEd" (`about-past-programs.yaml:47`); slug `completed-2` read as CompletEd: **Check** |
| `/empowered/` | `/about/past-programs` | "EmpowerEd" (`about-past-programs.yaml:61`) |
| `/empowered-sanand/` | `/about/past-programs` | EmpowerEd (Sanand), same programme: **Check** |

## Fellow pages → that fellow's profile

The new page opens a profile with `?fellow=<id>`. The ids come from the Sheet snapshot (`src/data/sheets/social-changemakers.json`, 2026-11-27) and are matched by name.

| Old address | New address |
|---|---|
| `/tanay-sanghvi-sc-fellowship/` | `/education-for-harmony/social-changemakers?fellow=SC-8104649fd4` |
| `/anaya-zaveri-sc-fellowship/` | `…?fellow=SC-f72c331b0f` |
| `/anaya-patel-sc-fellowship/` | `…?fellow=SC-799f00c393` |
| `/hiya-patel-sc-fellowship/` | `…?fellow=SC-dcb0da6dea` |
| `/havisha-chokshi-sc-fellowship/` | `…?fellow=SC-6acc6e5769` |
| `/samaya-bhowmick-sc-fellowship/` | `…?fellow=SC-9c6c76264f` |
| `/yashvit-sancheti-mindful-futures/` | `…?fellow=SC-1a9635ce22` |
| `/arav-gupta-and-prisha-arora-sc-fellowship/` | `…?fellow=SC-9d11843cf9` (Arav Gupta; Prisha Arora is `SC-b75123e2f2`, so one page has two people: **Check**) |

An id changes only if the Sheet row's Timestamp changes. Re-check this table against the snapshot on go-live day.

## Likely match: please check

| Old address | Suggested new address | Why |
|---|---|---|
| `/mccxggis25/`, `/mccx-25-at-ggis/`, `/mccxau25/`, `/mccx-25-at-au/` | `/education-for-harmony/mccx` | MCCx event pages (slugs name 2025 MCCx events at GGIS / AU); the MCCx page lists past sessions |
| `/disha/` | `/education-for-harmony` | "Disha camps" are described there (`education-for-harmony.yaml`, Workshops and camps) |
| `/exploring-the-happiness-curriculum/` | `/thrive` | happiness-curriculum research is a THRIvE research area (`thrive.yaml`, research photo `research-happiness-curriculum.png`) |
| `/citizenship-education-through-contextualized-discussions-of-sustainability/` | `/thrive/publications` | title reads like a research paper; not checked |
| `/role-of-social-changemaking-projects-in-holistic-development/` | `/thrive/publications` | title reads like a research paper; not checked |
| `/researching-value-based-education/` | `/thrive` | research topic; "value-based" also appears on Past Programs: **Check** |
| `/help-us-bring-a-change/` | `/get-involved/donate` | slug reads like a donation appeal; not checked |
| `/apply-now/` | `/get-involved/volunteer` | unclear what the application was for |
| `/testimonials-category/home/` | `/` | a WordPress testimonials listing for the home page |

## No clear equivalent: your call

For each: pick a page, or leave it ("page not found"). A sensible default is shown.

| Old address | Default suggestion |
|---|---|
| `/miracleofideas/`, `/miracleofideas2017/`, `/moi2023/`, `/miracle-of-ideas-2024/`, `/miracle-of-ideas-2024-panel-talks/`, `/miracle-of-ideas-2024-mcc/`, `/miracle-of-ideas-exhibition-24/`, `/miracle-of-ideas-2024-interventions/` (8) | `/education-for-harmony` (the name "Miracle of Ideas" does not appear on the new site) |
| `/sdg-drives/` | `/education-for-harmony` |
| `/happiness-in-education-virtual-exhibition/` | `/thrive` |
| `/saral-kadam-program/`, `/saral-kadam-materials/` | `/about/past-programs` ("Saral Kadam" does not appear on the new site) |
| `/block-educational-transformation-intiative/` | `/about/past-programs` |
| `/prabhav/`, `/tide-fellowship/`, `/twd/` | `/about/past-programs` |
| `/other-project/`, `/portfolio/` | `/about/past-programs` |
| `/our-results/` | `/about/why-tide` (the new site's own `/about/our-results` was removed by owner decision; this is the WordPress address) |
| `/faqs/` | `/contact` (no FAQ page on the new site) |
