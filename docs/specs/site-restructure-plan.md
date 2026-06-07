# Site Restructure Plan — site_updates.docx Review

> Drafted from feedback in `site_updates.docx`. Status: **DRAFT — Q2 (project page redirects) still open. All other blockers cleared.**
>
> Tasks are split into **Content** (YAML-only edits, no code) and **Structural** (routing, new components, new pages, code changes).
>
> **Confirmed decisions (2026-06-07):**
> - New nav structure is correct ✓
> - Pramaan is a top-level nav section ✓
> - Donate stays as the existing amber pill button in the header (no nav restructure needed for it) ✓
> - Looker Studio dashboard: skip for now ✓
> - QR code on Donate page: skip for now (placeholder) ✓
> - Team photos and form URLs: skip for now ✓
> - Padlet URL: provided (update `content/pages/home.yaml` when confirmed)

---

## Summary of What's Changing

The feedback proposes a significant restructure of the site's information architecture:

| Current top-level nav | New top-level nav |
|---|---|
| About Us | About Us (expanded — Publications + Get Involved now live here) |
| Projects (6 subpages) | Education for Harmony *(new section)* |
| Get Involved | Pramaan *(ABL Resources → new top-level section)* |
| THRIvE | THRIvE |
| Resources | ~~Donate~~ *(stays as amber header button — no change)* |
| Contact Us | Contact Us |

**Confirmed nav structure:**
```
[Logo]   About Us ▾   Education for Harmony ▾   Pramaan ▾   THRIvE   Contact Us   [Donate button]
```

---

## A — Global / Cross-site

### A1 · Favicon — CONTENT
**Change:** Replace current favicon with TIDE's logo.  
**File:** `public/favicon.ico` (or `favicon.png` — check current `index.html`)  
**Action:** Drop the correct favicon asset into `public/` and update `index.html`.

### A2 · Footer — CONTENT (YAML)
**File:** `content/shared/footer.yaml`

Current footer columns need the following additions/changes:
- Add Google Maps link for the Ahmedabad address: `https://maps.app.goo.gl/5bDtQ3RPQ5FXZMWr8`
- Confirm social links are live (FB, LinkedIn, Instagram — already present but verify URLs)
- Footer column nav links will need updating once nav restructure is done (A3)

### A3 · Navigation restructure — STRUCTURAL
**Files:** `content/shared/navigation.yaml` + `src/App.jsx` (new routes) + `src/components/layout/Header.jsx`

**Proposed new nav structure:**
```
About Us
  ├── Why TIDE?
  ├── Past Programs        ← NEW page
  ├── Our Team
  ├── Our Partners
  ├── Get Involved         ← COMBINED (Volunteer + Work With Us merged)
  └── Our Publications     ← MOVED from Resources

Education for Harmony      ← NEW top-level section
  ├── Ecosystem of Programs  ← NEW page
  └── Organise your MCCx     ← MOVED from Get Involved

Pramaan                    ← RENAME of ABL Resources section
  ├── About Pramaan          ← RENAMED AblHome
  ├── Resource Centre        ← existing AblResourceCenter
  └── Contribute             ← existing AblContribute

THRIvE Research Centre     ← unchanged

Donate                     ← MOVED to top-level (was under Get Involved)

Contact Us
```

---

## B — Home Page

### B1 · Screen 1 — Hero — CONTENT
**File:** `content/pages/home.yaml` → `hero.*`

| Field | Current | New |
|---|---|---|
| tagline | "Improving access to" | "Improving access to" (keep) |
| taglineHighlight | "holistic education" | "holistic education" (keep) |
| description | current text | "TIDE Foundation works to bring sustainable, systemic and scalable change to India's education landscape — built to last, designed to disappear." |
| pills[0] | 40,000+ / lives changed | **50,000+** / Lives impacted |
| pills[1] | 10 yrs / of impact | 10 yrs / of impact (keep) |
| pills[2] | 70+ / partners | 70+ / partners (keep) |

### B2 · Screen 2 — Mission — CONTENT
**File:** `content/pages/home.yaml` → `mission.*`

- **title:** "Transformative education for harmony"
- **body:** "TIDE builds and empowers systems to bring about holistic education of the whole child (education of the head, heart, hands, and soul) for all."
- **quote:** "We imagine an education that helps students develop as a whole person and learn to work together to counter the many 21st century challenges that India and the globe faces."
- Badge / `sectionBadge`: "Our Mission" (keep)
- `learnMore` link label: "Learn why we do this" (keep)

### B3 · Screen 3 — Impact Stats — CONTENT
**File:** `content/pages/home.yaml` → `impact.stats[]`

| # | value | label | detail |
|---|---|---|---|
| 1 | 50,500+ | Lives Impacted | across Gujarat since 2014 |
| 2 | 70+ | Partner Organisations | Schools, NGOs & institutions since 2014 |
| 3 | 10 | Years of Service | of continuous grassroots impact |
| 4 | 100+ | Current Volunteers | from universities across India |

*(Note: was previously 200+ Volunteers & Interns — now 100+ Current Volunteers)*

### B4 · Section 4 — Journey Timeline — STRUCTURAL (NEW SECTION)
**File:** `src/pages/Home.jsx` + `content/pages/home.yaml`

A new section between Impact and Programs showing TIDE's multi-year journey. Three phases:

| Phase | Period | Lives | Description |
|---|---|---|---|
| 1 | 2014–2019 | 15,301 lives impacted | Understanding educational landscape through deep transformation |
| 2 | 2019–2026 | 35,041 lives transformed | Systems-based interventions to identify and develop scalable solutions |
| 3 | 2026–2031 | 10,00,000 lives targeted | Scaling solutions by partnering with NGOs, schools, colleges & governments |

Intro text: *"A multi year journey to developing grounded and contextualized but scalable educational interventions."*

### B5 · Section 5 — Programs — STRUCTURAL (MAJOR REDESIGN)
**File:** `src/pages/Home.jsx` + `content/pages/home.yaml` → `programs.*`

Current: 6 individual programme cards (Block ETI, BetterED, EmpowerEd, CompletEd, THRIvE, Other)

New: 3 "approaches" cards — one per pillar:

| Pillar | Headline | Link |
|---|---|---|
| Education for Harmony | Promoting thinking skills, life skills, civic responsibility, social emotional learning, and sewa | `/education-for-harmony` |
| Activity Based Learning | Collating activity based learning materials to inspire conceptual understanding | `/pramaan` *(or existing ABL URL)* |
| Systems Research | To understand and empower educational systems | `/thrive` |

Section heading: *"Three approaches – One vision"*  
Subtitle: *"An ecosystem of interventions. A digital repository. A research Centre."*

### B6 · Section 6 — Remove Gallery Strip — STRUCTURAL
Delete the "Moments from the field" horizontal scrolling photo strip from `Home.jsx`. Remove corresponding fields from `content/pages/home.yaml` (`gallery.*`).

### B7 · Section 7 — Student Work + Padlet Embed — STRUCTURAL (NEW SECTION)
**File:** `src/pages/Home.jsx` + `content/pages/home.yaml`

New section after programmes:
- Heading: *"See some of the work that our students have done!"*
- Embed: Padlet — **"Sustainability in Action: Our Goals, Our World"**
- ✅ Padlet embed already exists on the SDG Drives page (`SdgDrives.jsx`) — reuse the same embed code/URL from there.

### B8 · Section 8 — Testimonials — CONTENT
**File:** `content/pages/home.yaml` → `testimonial.*`
- Note from doc: "we will need more of these!" — content to be provided by TIDE team

### B9 · Section 9 — Get Involved CTA — CONTENT
**File:** `content/pages/home.yaml` → `cta.*`
- Volunteer button label: "Volunteer or work with us" (currently "Volunteer With Us")
- CTA link: update to point to new combined Get Involved page

---

## C — About Us

### C1 · Why TIDE — CONTENT
**File:** `content/pages/about-why-tide.yaml`

Significant text overhaul:

**Mission block:**
> TIDE (Together in Development and Education) Foundation was established on November 14, 2014 with a singular mission: to bring about contextualized, systemic, sustainable changes in India's education sector. We believe simple, well-aimed interventions can create domino effects throughout communities.

**Vision block:**
> We envision an education system that propels students to think, respect other people and their perspectives, to learn to collaborate, and to deal with the many 21st century issues.
> Our vision is bold — to deplete the need for our own projects within 15 years, either by systemically resolving root issues or by developing independent systems that no longer need our support.

**Quote:** *(keep)* "A sustainable change requires deep understanding of the complex system."

**Four goals (updated):**
1. Build holistic learning — heart, head, hands, and soul
2. Create leaders equipped with creative and critical thinking
3. Develop replicable, sustainable change models
4. Empower teachers to transform teaching pedagogy

**Five guiding principles (NEW section):**
1. Sustainable change
2. Empower existent systems
3. Systemic change
4. Scalable change
5. Meaningful impact

### C2 · Past Programs — STRUCTURAL (NEW PAGE)
**New route:** `/about/past-programs`  
**New files:** `content/pages/about-past-programs.yaml`, `src/pages/about/PastPrograms.jsx`

Documents historical TIDE programs with impact stats:

| Program | Summary | Scale |
|---|---|---|
| **Prerak** | Application and project-based learning; bridging academic learning gap through ABL kits, flashcards, games, and worksheets. Holistic foundational learning. | 126 schools + 5+ NGOs · 29,402 children + 448 teachers |
| **BetterEd** | Life skills education through clubs, weekend classes, SDG workshops, project-based sessions. | 60 schools, 12 slums, 5 orphanages, 1 village · 6,302 children |
| **CompletEd** | Socially responsible youth leadership through critical dialogue, social entrepreneurship, SDG drives, talks, fellowships. | 7 schools + 5 colleges · 5,512 people |
| **EmpowerEd** | Communities of practice, peer-learning, action research for educators. | 15+ low-fee, 20+ alternative, 37+ govt schools · 889 lives |

### C3 · Our Results — REMOVE PAGE — STRUCTURAL
- Remove route `/about/our-results` from `src/App.jsx`
- Remove nav entry from `content/shared/navigation.yaml`
- Remove from footer column links if present
- Keep the file (`OurResults.jsx`) in the codebase but just unreachable — no deletion needed

### C4 · Our Team — CONTENT + STRUCTURAL
**File:** `content/pages/about-our-team.yaml`

**Structural change:** Unify display format for advisors and core team members (currently different card sizes). Advisors get same portrait card format as core team.

**Content changes:**
- Move **Munira Jariwala** and **Nishi Nair** from advisors → core team
- Add academic qualifications to all profiles
- Add LinkedIn URLs for all listed members:

| Name | LinkedIn |
|---|---|
| Prof. Neelkanth Chhaya | N/A |
| Prof. Raghavan Rangarajan | https://www.linkedin.com/in/raghavan-rangarajan-628b08b3/ |
| Dr. Prerna Mohite | https://www.linkedin.com/in/prerana-mohite-84500641/ |
| Dr. Shailendra Gupta | https://www.linkedin.com/in/dr-shailendra-gupta-a89b6051/ |
| Mr. Hiren Parikh | https://www.linkedin.com/in/hiren-parikh-3429b89b/ |
| Mr. Keshav Chatterjee | https://www.linkedin.com/in/keshav-chatterjee-01200a15/ |
| Gayatri Dave | https://www.linkedin.com/in/gayatri-dave/ |
| Om Patel | https://www.linkedin.com/in/omypatel/ |
| Deep Shah | https://www.linkedin.com/in/deep-shah-8b4572123/ |
| Prathmesh Sharma | https://www.linkedin.com/in/prathmesh-sharma-50080b10a/ |
| Kaneesha Parikh | https://www.linkedin.com/in/kaneesha-parikh-bb2b96118/ |
| Bhavik Dholu | https://www.linkedin.com/in/bhavik-dholu-122a8728/ |
| Munira Jariwala | https://www.linkedin.com/in/munira-jariwala-8058b61a8/ |
| Jwalin Patel | https://www.linkedin.com/in/jwalin10/ |
| Nishi Nair | https://www.linkedin.com/in/nishi-nair-a97521129/ |

Photos and qualifications for advisors are in the supporting materials folder: https://drive.google.com/drive/folders/1Nv7cmgk_PTlFXy4u00Eie-HkNnhnucWL

### C5 · Our Partners — CONTENT
**File:** `content/pages/about-our-partners.yaml`

Split into the original 5 categories (as on previous site) and add new entries:

**Beneficiaries (new):**
- Eklavya India Foundation
- Apple Global School
- Gems Genesis International School

**Volunteer Partners (new):**
- Design for Good
- Riverside School
- MS University

**Collaborating NGOs (new):**
- Aga Khan Foundation
- Had Anhad
- Jivantirth Foundation (JEEVANTIRTH)
- Anusandhan Foundation
- Yuva Unstoppable *(if not already listed)*

**Knowledge, Research & Funding (new):**
- University College London
- CaNDER (Cambridge Network for Disability and Education Research)
- INSTRUCT Lab
- TTEC India
- University of Trans-Disciplinary Health Sciences and Technology (TDU)
- India Welfare Trust
- BCM Corporation
- University of Notre Dame
- Spencer Foundation
- Samagata Foundation

**Other Supporters (new):**
- Global Schools Forum
- Prabhat Foundation

### C6 · Get Involved — STRUCTURAL (COMBINED PAGE)
**File:** `src/pages/get-involved/Volunteer.jsx` (becomes the combined page)  
**URL stays:** `/get-involved/volunteer` (or change — see questions)

Redesign into two logical sections on one page:

**Section 1 — Volunteer with us**
- Keep right-hand content unchanged
- Left side: Reduce to 3 opportunity boxes:
  1. **Direct Teaching** — Work directly with children in classrooms
  2. **Administration** — Contribute to organisational operations, communications, and strategic projects
  3. **Organise your own MCCx** — Run a consultative event in your school/university
- CTA: "Apply via Google Form" button (form URL needed)

**Section 2 — Join the team (Work with us)**
- Heading: *"TIDE Foundation is always looking for passionate educators, researchers, designers, communicators, and operational talent. We offer part-time, full-time, and remote opportunities."*
- **Auto-updated open positions** (Google Sheets pattern): Each row = one card with role title, 20-word description, link to JD PDF
- CTA: "Apply via Google Form" button

**Section 3 — Moments from the field**
- Keep existing gallery
- Add 1–2 more photos (to be provided)

### C7 · Our Publications — STRUCTURAL (MAJOR REDESIGN + RELOCATION)
**Current URL:** `/resources/annual-reports`, `/resources/publications` (two separate pages)  
**New URL:** `/about/publications` (single combined page — see questions)  
**New files:** `content/pages/about-publications.yaml`, `src/pages/about/Publications.jsx`

Three tabs or sections on one page:

**Tab 1 — Annual Reports**
Auto-updated from Google Sheet: year, title, link to PDF. Portal auto-generates thumbnail from year field.

**Tab 2 — Glimpses of Public Events**
Curated video/photo gallery. Initial content:
- MOI 2024 — 2 talks
- MCC 2024
- MOI 2023 — Happiness in Education Exhibition Walkthrough
- 5–6 MOI 2017 talks
- GGIS MCC
- AGS MCC
- Parivartan Mela

**Tab 3 — Research and Writing**
Auto-updated from Google Sheet: image, title, link to PDF or read-more URL.

---

## D — Education for Harmony (New Section)

### D1 · Ecosystem of Programs page — STRUCTURAL (NEW PAGE)
**New route:** `/education-for-harmony`  
**New files:** `content/pages/education-for-harmony.yaml`, `src/pages/EducationForHarmony.jsx`

**Intro text:**
> At TIDE Foundation we have been developing an ecosystem of educational interventions for self- and social-transformation for different contexts, age groups, and to varying degrees of depth.
>
> Education for harmony brings about conscientization, care, compassion, and consciousness. We specifically aim to promote holistic, experiential, collaborative, project-based, and human-centered learning; build life skills like communication, problem-solving, teamwork, and leadership; develop thinking and decision-making; develop empathy and care; foster a sense of social responsibility; and shape socially conscious global leaders.

**Left panel — EHSA/CARES framework:**
Five dimensions (Consciousness → Awaken Empathy → Reflect & Reimagine → Engage & Empower → Sense of Responsibility) × Five contexts (Self / School & Home / Community / City / Planet). This is a 5×5 visual matrix.

**Right panel — Jwalin's framework + ecosystem of interventions:**

| Program | Impact so far |
|---|---|
| Social Explorer Program | 1,961 students |
| Social Deliberator & Planning (Model City Councils) | 2,882 students |
| Community Changemaker | 4,245 students in 154 camps across 86 schools; indirectly impacting 2,944 students |
| Social Ambassadors | 222 students |
| Social Changemakers (fellowships) | 27 students, indirectly impacting 2,399 people |
| Social Transformers (mentor program) | *no number given yet* |

**Glimpses of Community Changemaker:**
- Video overview: https://www.youtube.com/watch?v=y7pp0ABMu_4

**Collaborate with us:**
> We are happy to share our materials and to support other organizations interested in replicating the interventions in their contexts — regional, state, and national government, educational institutions, NGOs, and colleges offering MSW and BEd courses.
- Button: "Email us to collaborate" → `mailto:tidefoundation@gmail.com`

**Dashboard:**
- Embed Looker Studio dashboard (URL needed — see questions)

### D2 · Organise Your MCCx — STRUCTURAL (ROUTE MOVE)
**Current route:** `/get-involved/mccx`  
**New route:** `/education-for-harmony/mccx`  
Add a redirect from old URL.

**Content additions:**
- "Learn more" section: Embed a flipbook PDF (PDF file needed — see questions)
- Past MCC: Auto-updated Google Sheet with: key photo, school name, dates, # students, key student organizer names, key expert names
- **Past SCF tab** *(not in main menu)*: Auto-updated Google Sheet sorted by latest. Each entry: photo, student name, school/uni + graduation year, SCF batch year, 50–100 word project description. [Link out to student profiles]

---

## E — Pramaan (Rename + Expand ABL Resources)

### E1 · Rename and expand AblHome — CONTENT + STRUCTURAL
**Current:** "ABL Resource Library" at `/resources/abl-resources`  
**New name:** "Pramaan" (label change throughout)

**New intro content for the landing page:**
- Promo video embed: https://www.youtube.com/watch?v=12Kzj8bgTQA
- New backstory text (from doc — full text in section 4.1 of docx)
- Gallery of photos from past ABL sessions
- File: `content/pages/abl-home.yaml` — update title, subtitle, add video URL, history text, photo gallery

**"Access the materials" section** (existing AblResourceCenter): No structural change. Expose sort by grade, subject, organisation.

**"Contribute to the materials" section** (existing AblContribute): Update body copy:
> We're looking to build meaningful partnerships with mission-aligned institutions to support with: a two-way exchange, support with content/expertise/spreading the word, or collaborative efforts to shape the platform together. We will carefully organise and align them to curricula, create demo videos, develop how-to-use guidelines, and share them freely on the platform. We will acknowledge partner organisations.

Two CTAs: "Share your resources" button + "Contact us if you have many materials" link.

---

## F — Donate Page

### F1 · Donate — CONTENT (MAJOR OVERHAUL)
**File:** `content/pages/get-involved-donate.yaml`

**Left side:**
- Section heading: "Support TIDE Foundation"
- Body: *"Your donation directly funds programs that will reach thousands of people across India. To make a donation or learn about CSR partnerships, please reach out to us directly."*
- Three bullet points: 50,000+ lives impacted · 80G tax exemption for Indian donors · CSR partnership opportunities
- CTA 1: "Email to donate" → `mailto:tidefoundation@gmail.com`
- CTA 2: "WhatsApp us" → `https://wa.me/919979882648`

**Donate Directly section:**
- QR code image (to be provided by Jwalin)
- Bank transfer details:
  - Account Name: TIDE Foundation
  - Account Number: 50200018421062
  - Bank: HDFC Bank
  - IFSC: HDFC0000006
  - Branch: HDFC Bank, Navrangpura

**Right side:**
- Crop the existing image to remove logo and QR from the bottom

---

## G — THRIvE Research Centre
No changes requested. Kept as-is.

---

## Implementation Priority

| Priority | Task | Type | Effort |
|---|---|---|---|
| 1 | A3 Navigation restructure | Structural | Large |
| 2 | B5 Home programs — 3 pillars | Structural | Medium |
| 3 | D1 Education for Harmony page | Structural/New | Large |
| 4 | C6 Get Involved combined page | Structural | Medium |
| 5 | C7 Our Publications combined page | Structural | Medium |
| 6 | C2 Past Programs new page | Structural/New | Medium |
| 7 | C3 Remove Our Results | Structural | Small |
| 8 | F1 Donate page | Content | Medium |
| 9 | C1 Why TIDE text | Content | Small |
| 10 | B1–B3 Home hero/mission/stats | Content | Small |
| 11 | B4 Home timeline section | Structural | Medium |
| 12 | B6 Remove home gallery | Structural | Small |
| 13 | B7 Padlet embed | Structural | Small |
| 14 | C4 Team format + LinkedIn | Content + Structural | Medium |
| 15 | C5 Partners update | Content | Small |
| 16 | E1 Pramaan rename + expand | Content + Structural | Medium |
| 17 | D2 MCCx route move | Structural | Small |
| 18 | A1 Favicon | Content | Small |
| 19 | A2 Footer updates | Content | Small |

---

## 🗂 Orphaned Pages Tracker — Pending Stakeholder Decision

These pages remain accessible via direct URL but will have **no nav link** after the restructure. Check with stakeholders whether to redirect, repurpose, or permanently remove.

| URL | Current page | Suggested destination if redirected | Status |
|---|---|---|---|
| `/projects/block-eti` | Block ETI | Unknown — not in new structure | ⏳ Pending |
| `/projects/bettered` | BetterED | `/about/past-programs` | ⏳ Pending |
| `/projects/empowered` | EmpowerEd | `/about/past-programs` | ⏳ Pending |
| `/projects/completed` | CompletEd | `/education-for-harmony` | ⏳ Pending |
| `/projects/sdg-drives` | SDG Drives | `/education-for-harmony` | ⏳ Pending |
| `/projects/other-projects` | Other Projects | `/about/past-programs` | ⏳ Pending |
| `/about/our-results` | Our Results | Removed from nav — content migrated to Home impact stats | ⏳ Pending |
| `/resources/saral-kadam` | Saral Kadam | `/pramaan` or keep under Resources? | ⏳ Pending |
| `/resources/annual-reports` | Annual Reports | `/about/publications` | ⏳ Pending |
| `/resources/publications` | Publications | `/about/publications` | ⏳ Pending |
| `/get-involved/work-with-us` | Work With Us | `/get-involved/volunteer` (combined page) | ⏳ Pending |

---

## ❓ Questions Before Work Begins

### Navigation & Structure

1. **Top-level nav items**: The proposed structure has 6 top-level items: About Us, Education for Harmony, Pramaan, THRIvE, Donate, Contact Us. Is this correct? Should "Pramaan" appear at the top level, or nested under something?

2. **Existing project pages** — ✅ **DECIDED: Option B — keep routes but remove from nav.** Pages remain accessible via direct URL but no nav link. See "Orphaned Pages Tracker" section below.

3. **Block ETI**: Not mentioned anywhere in the feedback. Is it still an active program? Should it appear anywhere in the new structure, or is it going away?

4. **Saral Kadam** (`/resources/saral-kadam`): Not mentioned in the new structure. Does this page disappear, move into Pramaan, or stay somewhere in Resources?

5. **"Our Publications" URL**: Currently split across `/resources/annual-reports` and `/resources/publications`. The new structure puts it under About Us. Should the URL become `/about/publications`, or keep the existing URLs and just update the nav placement?

6. **Get Involved combined page URL**: Should it live at `/get-involved` (new), `/get-involved/volunteer` (keep current URL), or something else?

7. **Pramaan URL**: Should the existing `/resources/abl-resources` URL stay the same (just relabelled "Pramaan" in the UI), or should it move to `/pramaan`?

### Auto-updated Sheets

8. **Which sections need live Google Sheets integration?** The doc mentions auto-updating for: impact stats (home), open job positions (Get Involved), annual reports, public events, research/writing, past MCC events, past SCF fellows. Are all of these expected to use the same Apps Script JSON API pattern as ABL, or are some fine as manually-updated YAML?

9. **Home page impact stats** (Screen 3): The doc says "[Auto updated] link to an excel sheet where this is automatically updated." Does this mean the four counters should pull from a live sheet, or is this just asking us to note that these numbers need periodic manual updates?

### Content / Assets Needed

10. ✅ **Padlet embed** — already embedded on `/projects/sdg-drives`. Reuse the same embed code for the Home page Section 7. Extract from `SdgDrives.jsx` or `content/pages/projects-sdg-drives.yaml`.

11. **Looker Studio dashboard URL** (Education for Harmony): What is the embed URL?

12. **MCCx flipbook PDF** (Education for Harmony > MCCx "Learn more"): What PDF should be embedded?

13. **QR code for Donate**: Jwalin will provide — should we add a placeholder for now and swap it in later?

14. **Team advisor photos & qualifications**: The doc links to a Drive folder. Are these photos ready to download and add to `public/assets/images/about-our-team/`?

15. **Get Involved Google Form URL**: What is the form URL for volunteer/intern applications?

16. **Work With Us Google Form URL**: Is this the same form or a different one?

17. **Donate page right-side image**: Which image should be cropped? Is this the current hero image on the Donate page?

### Design / UX

18. **CARES matrix** (Education for Harmony): The 5×5 grid (Consciousness/Empathy/Reimagine/Engage/Responsibility × Self/School/Community/City/Planet) — should this be static visual or interactive (hover states per cell)? Does TIDE have an existing graphic for this?

19. **Team card format unification**: Should advisors now get the same circular/square portrait + hover-bio card as core team, or a different but consistent format?

20. **Past MCC / Past SCF**: These are described as "not in the main menu tabs" — should they live as tabs within the MCCx page, or as a separate hidden section?

21. **Favicon asset**: The current logo at `public/assets/images/shared/tide-logo.png` — is this the correct image to use as the favicon, or is there a dedicated square/icon version?
