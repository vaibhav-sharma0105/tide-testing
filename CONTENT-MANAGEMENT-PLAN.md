# TIDE Foundation — YAML Content Management System
## Implementation Plan for Claude Code

**Purpose:** Replace all hardcoded content and i18n JSON files with a YAML content layer.
A non-technical person edits YAML files; commands auto-convert to JSON; React reads JSON.

**Status:** Ready to implement. Follow phases in order. Do not skip phases.

---

## Architecture Summary

```
content/pages/*.yaml   ← non-tech person edits these
content/shared/*.yaml  ← navigation, footer, seo
        ↓  auto-runs via predev / prebuild npm hooks
src/data/*.json        ← gitignored, always regenerated
        ↓
React components import JSON directly (no useTranslation on pages)
        ↓
npm run build → dist/ → FTP upload
```

**Rules enforced by this plan:**
- YAML is the single source of truth — JSON is never edited directly
- `useTranslation` is removed from all 19 page components
- `react-i18next` package stays (infrastructure for future multilingual)
- `src/data/` is gitignored
- `predev` and `prebuild` hooks auto-run YAML→JSON conversion

---

## Phase 1 — Infrastructure

### 1.1 Install dependency

```bash
npm install --save-dev js-yaml
```

### 1.2 Create `scripts/yaml-to-json.js`

Create this file exactly:

```javascript
// scripts/yaml-to-json.js
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = path.resolve('content')
const OUTPUT_DIR  = path.resolve('src/data')

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

let count = 0

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      const raw     = fs.readFileSync(fullPath, 'utf8')
      const parsed  = yaml.load(raw)
      const outName = entry.name.replace(/\.ya?ml$/, '.json')
      const outPath = path.join(OUTPUT_DIR, outName)
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8')
      console.log(`  ✓ ${path.relative('.', fullPath)} → src/data/${outName}`)
      count++
    }
  }
}

console.log('\n📄 Syncing YAML content to JSON...')
processDir(CONTENT_DIR)
console.log(`   ${count} file(s) synced.\n`)
```

### 1.3 Create `scripts/validate-content.js`

```javascript
// scripts/validate-content.js
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR  = path.resolve('content')
const PUBLIC_DIR   = path.resolve('public')
let warnings = 0
let errors   = 0

function warn(file, msg)  { console.warn(`  ⚠  ${file}: ${msg}`);  warnings++ }
function error(file, msg) { console.error(`  ✗  ${file}: ${msg}`); errors++ }

function checkImagePath(file, key, value) {
  if (typeof value !== 'string') return
  if (value.startsWith('http://') || value.startsWith('https://')) return // external URL, skip
  if (!value.startsWith('/')) return // not a local path
  const localPath = path.join(PUBLIC_DIR, value)
  if (!fs.existsSync(localPath)) {
    warn(file, `image not found on disk: ${key} = "${value}"`)
  }
}

function walkObject(file, obj, parentKey = '') {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => walkObject(file, item, `${parentKey}[${i}]`))
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}.${k}` : k
      if (['photo', 'src', 'logo', 'coverImage', 'image', 'poster', 'img'].includes(k)) {
        checkImagePath(file, fullKey, v)
      }
      walkObject(file, v, fullKey)
    }
  }
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.yaml')) {
      const relPath = path.relative('.', fullPath)
      let parsed
      try {
        parsed = yaml.load(fs.readFileSync(fullPath, 'utf8'))
      } catch (e) {
        error(relPath, `YAML parse error: ${e.message}`)
        continue
      }
      walkObject(relPath, parsed)
    }
  }
}

console.log('\n🔍 Validating YAML content...\n')
processDir(CONTENT_DIR)
console.log(`\n   ${warnings} warning(s), ${errors} error(s)\n`)
if (errors > 0) process.exit(1)
```

### 1.4 Update `package.json` scripts

Read `package.json`, then add/replace the scripts block with:

```json
"scripts": {
  "predev":           "node scripts/yaml-to-json.js",
  "dev":              "vite",
  "prebuild":         "node scripts/yaml-to-json.js",
  "build":            "vite build",
  "preview":          "vite preview",
  "content:sync":     "node scripts/yaml-to-json.js",
  "content:validate": "node scripts/validate-content.js"
}
```

Also ensure `"type": "module"` is present in package.json (needed for ES module `import` in scripts).
If it is not present, add `"type": "module"` at the top level of package.json.

### 1.5 Add `src/data/` to `.gitignore`

Read `.gitignore` (or create it if absent). Append:

```
# Auto-generated from YAML — do not edit
src/data/
```

### 1.6 Create directory structure

```
mkdir content
mkdir content/pages
mkdir content/shared
mkdir src/data
```

---

## Phase 2 — YAML Files

Create each file below exactly as specified.
Content values: copy from the source JSX file and/or `src/i18n/locales/en/translation.json`.
Reference: source paths are noted in each section header.

---

### `content/shared/navigation.yaml`
*Source: `src/components/layout/Header.jsx` — NAV array and translation keys*

```yaml
items:
  - label: "About Us"
    children:
      - label: "Why TIDE?"
        to: "/about/why-tide"
        desc: "Our story, vision & values"
      - label: "Our Team"
        to: "/about/our-team"
        desc: "Meet the people behind TIDE"
      - label: "Our Partners"
        to: "/about/our-partners"
        desc: "70+ school & university partners"
      - label: "Our Results"
        to: "/about/our-results"
        desc: "Impact data & outcomes"

  - label: "Projects"
    children:
      - label: "Block Educational Transformation Initiative"
        to: "/projects/block-eti"
        desc: "Systemic change in govt. schools"
      - label: "BetterED"
        to: "/projects/bettered"
        desc: "Life skills in 12 urban slums"
      - label: "EmpowerEd"
        to: "/projects/empowered"
        desc: "Teacher professional development"
      - label: "CompletEd"
        to: "/projects/completed"
        desc: "Fellowships & civic education"
      - label: "Other Projects"
        to: "/projects/other-projects"
        desc: "More initiatives & programs"

  - label: "Get Involved"
    children:
      - label: "Volunteer / Intern With Us"
        to: "/get-involved/volunteer"
        desc: "Intern or volunteer with us"
      - label: "Work With Us"
        to: "/get-involved/work-with-us"
        desc: "Full-time & part-time roles"
      - label: "Organise your MCCx"
        to: "/get-involved/mccx"
        desc: "Organise a Model City Council"

  - label: "THRIvE Research Centre"
    to: "/thrive"

  - label: "Resources"
    children:
      - label: "Saral Kadam Materials"
        to: "/resources/saral-kadam"
        desc: "Foundational learning booklets"
      - label: "Annual Reports"
        to: "/resources/annual-reports"
        desc: "Reports from 2014 to present"
      - label: "Our Publications"
        to: "/resources/publications"
        desc: "Research papers & articles"

  - label: "Contact Us"
    to: "/contact"
```

---

### `content/shared/footer.yaml`
*Source: `src/i18n/locales/en/translation.json` — footer keys; `src/components/layout/Footer.jsx`*

**IMPORTANT:** Read `src/components/layout/Footer.jsx` before creating this file.
Model the schema as follows and fill values from that file:

```yaml
tagline: "Improving access to holistic education since 2014."
together: "Together in Development and Education"
rights: "© 2025 TIDE Foundation. All rights reserved."
logo: "/assets/images/shared/tide-logo.png"

columns:
  - title: "About"
    links:
      - label: "Why TIDE?"
        to: "/about/why-tide"
      - label: "Our Team"
        to: "/about/our-team"
      - label: "Our Partners"
        to: "/about/our-partners"
      - label: "Our Results"
        to: "/about/our-results"

  - title: "Projects"
    links:
      - label: "Block ETI"
        to: "/projects/block-eti"
      - label: "BetterED"
        to: "/projects/bettered"
      - label: "EmpowerEd"
        to: "/projects/empowered"
      - label: "CompletEd"
        to: "/projects/completed"
      - label: "Other Projects"
        to: "/projects/other-projects"

  - title: "Get Involved"
    links:
      - label: "Volunteer With Us"
        to: "/get-involved/volunteer"
      - label: "Donate"
        to: "/get-involved/donate"
      - label: "Work With Us"
        to: "/get-involved/work-with-us"
      - label: "Organise MCCx"
        to: "/get-involved/mccx"

  - title: "Resources"
    links:
      - label: "Saral Kadam"
        to: "/resources/saral-kadam"
      - label: "Annual Reports"
        to: "/resources/annual-reports"
      - label: "Publications"
        to: "/resources/publications"
      - label: "THRIvE"
        to: "/thrive"
      - label: "Contact"
        to: "/contact"

social:
  - platform: "facebook"
    href: "https://facebook.com/togetherindevelopmentandeducation"
  - platform: "instagram"
    href: "https://instagram.com/tide_foundation_"
  - platform: "linkedin"
    href: "https://linkedin.com/company/13326412"
```

---

### `content/pages/home.yaml`
*Source: `src/pages/Home.jsx` — PROGRAMS, STATS, GALLERY arrays; `translation.json` — home keys*

```yaml
meta:
  badge: "TIDE Foundation"
  seoTitle: "TIDE Foundation — Holistic Education for India"
  seoDescription: "TIDE Foundation works to bring sustainable, systemic change to India's education landscape through six independent projects."

hero:
  tagline: "Improving access to"
  taglineHighlight: "holistic education"
  description: "TIDE Foundation works to bring sustainable, systemic change to India's education landscape through six independent projects — built to last, designed to disappear."
  ctaLabel: "Explore Our Work"
  ctaSecondaryLabel: "Get Involved"

stats:
  - value: "40000+"
    label: "Lives impacted"
  - value: "200+"
    label: "Volunteers & interns"
  - value: "70+"
    label: "Partner organisations"
  - value: "10"
    label: "Years of service"

mission:
  sectionBadge: "Our Mission"
  title: "Education as the silver bullet"
  body: "Access to quality education is the key to unlocking India's social challenges. We work intensively with communities — not superficially across many — to build change that grows from within."
  quote: "A sustainable change requires deep understanding of the complex system."

programs:
  sectionTitle: "Six projects. One vision."
  sectionSubtitle: "Each initiative targets a different root cause in the education system, working independently toward the same north star."
  items:
    - to: "/projects/block-eti"
      photo: "/assets/images/home/gallery-1.jpg"
      iconKey: "Globe"
      title: "Block ETI"
      badge: "Government Schools"
      desc: "Systemic change at the block level — transforming foundational learning across rural Gujarat."
    - to: "/projects/bettered"
      photo: "/assets/images/projects-bettered/gallery-01.jpg"
      iconKey: "BookOpen"
      title: "BetterED"
      badge: "1,225 Children"
      desc: "After-school life-skills and numeracy programs across 12 urban slum communities."
    - to: "/projects/empowered"
      photo: "/assets/images/projects-empowered/Build-teacher-agency.jpg"
      iconKey: "GraduationCap"
      title: "EmpowerEd"
      badge: "Teacher-led"
      desc: "Bottom-up professional development — teachers as agents of change, not recipients."
    - to: "/projects/completed"
      photo: "/assets/images/home/gallery-2.jpg"
      iconKey: "Heart"
      title: "CompletEd"
      badge: "1,028 People"
      desc: "Social justice through civic education — fellowships, SDG drives, Model City Councils."
    - to: "/thrive"
      photo: "/assets/images/thrive/research-happiness-curriculum.png"
      iconKey: "Lightbulb"
      title: "THRIvE"
      badge: "Research"
      desc: "A research centre for transformative, inclusive and equitable education futures."
    - to: "/projects/other-projects"
      photo: "/assets/images/projects-other/EEP.jpg"
      iconKey: "Users"
      title: "Other Projects"
      badge: "More Work"
      desc: "College development, refugee education, Disha, Saral Kadam and beyond."

gallery:
  - "/assets/images/home/slider-1.jpg"
  - "/assets/images/get-involved-volunteer/gallery-01.jpg"
  - "/assets/images/home/slider-2.jpg"
  - "/assets/images/home/gallery-3.jpg"
  - "/assets/images/projects-bettered/gallery-03.jpg"
  - "/assets/images/get-involved-volunteer/gallery-04.jpg"
  - "/assets/images/home/slider-3.jpg"
  - "/assets/images/projects-bettered/gallery-07.jpg"
  - "/assets/images/get-involved-volunteer/gallery-08.jpg"
  - "/assets/images/projects-bettered/gallery-09.jpg"

testimonial:
  quote: "TIDE doesn't just run programs — it builds ecosystems. Their work with our teachers changed how our entire school thinks about education."
  author: "School Principal, Ahmedabad"
  role: "Partner since 2017"

cta:
  sectionTitle: "Be part of the change"
  body: "Whether you donate time, resources, or expertise — there's a place for you in TIDE's mission."
  volunteerLabel: "Volunteer With Us"
  donateLabel: "Make a Donation"
```

**NOTE for Phase 3:** After reading `src/pages/Home.jsx` fully, check if there are additional gallery images beyond index 10 and add them to the gallery array above.

---

### `content/pages/about-why-tide.yaml`
*Source: `src/pages/about/WhyTide.jsx`; `translation.json` — about.whyTide keys*

```yaml
meta:
  badge: "About TIDE"
  title: "Why TIDE?"
  subtitle: "We exist to create change that outlasts us."
  seoTitle: "Why TIDE? — TIDE Foundation"
  seoDescription: "TIDE Foundation was established in 2014 to bring contextualized, sustainable change to India's education sector."

whoWeAre:
  sectionBadge: "Mission"
  sectionTitle: "Who We Are"
  mission: "TIDE Foundation (Together in Development and Education) was established on November 14, 2014 with a singular mission: to bring about contextualized, grass root level, sustainable changes in India's education sector."
  philosophy: "We believe simple, well-aimed interventions can create domino effects throughout communities. Rather than spreading thin across many places, we work intensively with fewer communities to catalyse organic, lasting transformation."

vision:
  title: "Our Vision"
  body: "Our vision is bold — to deplete the need for our own projects within 15 years, either by systemically resolving root issues or by developing independent systems that no longer need our support."
  quote: "A sustainable change requires deep understanding of the complex system."
  backgroundImage: "/assets/images/home/bg-aim.jpg"

goals:
  sectionBadge: "Goals"
  sectionTitle: "Five Primary Goals"
  items:
    - iconKey: "Target"
      text: "Develop replicable, sustainable change models"
    - iconKey: "Lightbulb"
      text: "Create leaders equipped with creative and critical thinking"
    - iconKey: "CheckCircle2"
      text: "Build holistic environments — heart, head, and hands"
    - iconKey: "Eye"
      text: "Establish application-based learning for critical reasoning"
    - iconKey: "CheckCircle2"
      text: "Elevate education quality in government and municipal schools"
```

---

### `content/pages/about-our-team.yaml`
*Source: `src/pages/about/OurTeam.jsx`*

```yaml
meta:
  badge: "About TIDE"
  title: "Our Team"
  subtitle: "Practitioners, scholars, and changemakers — united by one purpose."
  seoTitle: "Our Team — TIDE Foundation"
  seoDescription: "Meet the co-founders, directors, trustees and advisors of TIDE Foundation."

coreTeam:
  sectionBadge: "Leadership"
  sectionTitle: "Core Team & Founders"
  sectionSubtitle: "The founders and directors who built TIDE from the ground up — hover to learn more."
  members:
    - name: "Jwalin Patel"
      suffix: "PhD, University of Cambridge"
      role: "President & Co-Founder"
      bio: "Academic scholar, practitioner, and international development consultant with deep expertise in education systems."
      photo: "/assets/images/about-our-team/Jwalin-Patel-1.jpg"
    - name: "Gayatri Dave"
      suffix: null
      role: "Trustee & Co-Founder"
      bio: "Experienced teacher, school coordinator, and curriculum developer committed to holistic education."
      photo: "/assets/images/about-our-team/Gayatri-Oza-1.jpg"
    - name: "Om Patel"
      suffix: null
      role: "Trustee & Co-Founder"
      bio: "Director of Finance Strategy at Teladoc Health, USA — bringing global strategic and financial leadership."
      photo: "/assets/images/about-our-team/Om-Patel-1.jpg"
    - name: "Prathmesh Sharma"
      suffix: null
      role: "Trustee & Co-Founder"
      bio: "Manager at ShineHub, Australia — driving operational excellence and international partnerships."
      photo: "/assets/images/about-our-team/Prathmesh-Sharma-1.jpg"
    - name: "Deep Shah"
      suffix: null
      role: "Trustee"
      bio: "Senior Transportation Data Specialist at ICF, USA — expertise in data systems and policy."
      photo: null
    - name: "Kaneesha Parikh"
      suffix: null
      role: "Trustee"
      bio: "Sports and fitness expert with a passion for physical education and youth development."
      photo: "/assets/images/about-our-team/Kaneesha-Parikh-1.jpeg"
    - name: "Bhavik Dholu"
      suffix: null
      role: "Trustee"
      bio: "Architect with a strong belief in the built environment as a tool for social change."
      photo: "/assets/images/about-our-team/Bhavik-Dholu-1.jpg"
    - name: "Nishi Nair"
      suffix: null
      role: "Strategy & Expansions Director"
      bio: "Coordinates the Student Volunteer Programme and leads TIDE's strategic expansion initiatives."
      photo: "/assets/images/about-our-team/Nishi-Nair-180x180.jpeg"
    - name: "Munira Jariwala"
      suffix: null
      role: "Operations Director"
      bio: "Content writer and operations lead at TIDE, formerly at Designmate (I) Pvt. Ltd."
      photo: "/assets/images/about-our-team/Munira-Jariwala-1.jpg"

advisoryBoard:
  sectionBadge: "Advisory Board"
  sectionTitle: "Advisors"
  sectionSubtitle: "Senior academics, practitioners and leaders who guide TIDE's strategy."
  members:
    - name: "Prof. Neelkanth Chhaya"
      role: "Head of Architecture, CEPT University (till 2015)"
      photo: "/assets/images/about-our-team/Prof.-Neelkanth-Chhaya-1.jpg"
    - name: "Prof. Raghavan Rangarajan"
      role: "Dean, Arts & Sciences, Ahmedabad University; formerly Physical Research Laboratory"
      photo: "/assets/images/about-our-team/Prof.-Raghavan-Rangarajan-1.jpg"
    - name: "Dr. Prerna Mohite"
      role: "Professor Emeritus, Human Development & Family Studies, M.S. University Vadodara"
      photo: "/assets/images/about-our-team/Dr.-Prerna-Mohite-1.jpg"
    - name: "Dr. Shailendra Gupta"
      role: "CSR Consultant, GPPL APM Terminals; formerly Principal, Calorx Teachers' University"
      photo: "/assets/images/about-our-team/Dr.-Shailendra-Gupta-1.png"
    - name: "Mr. Hiren Parikh"
      role: "Consultant, Reach to Teach; formerly Academic Director, Sanskardham"
      photo: "/assets/images/about-our-team/Mr.-Hiren-Parikh-1.png"
    - name: "Mr. Keshav Chatterjee"
      role: "Managing Trustee & Director, Prabhat Education Foundation"
      photo: "/assets/images/about-our-team/Mr.-Keshav-Chatterjee-1.png"
```

---

### `content/pages/about-our-partners.yaml`
*Source: `src/pages/about/OurPartners.jsx`*

```yaml
meta:
  badge: "About TIDE"
  title: "Our Partners"
  subtitle: "A network of institutions, universities, and organisations that make our work possible."
  seoTitle: "Our Partners — TIDE Foundation"
  seoDescription: "70+ schools, universities, NGOs and organisations partnering with TIDE Foundation."

logoGallery:
  sectionBadge: "Partner Network"
  sectionTitle: "A Network Built on Trust"
  sectionSubtitle: "70+ schools, universities, NGOs and organisations powering TIDE's work."
  # Images are filenames only — component prepends /assets/images/about-our-partners/
  images:
    - "image_2024-06-03_015959653-e1717360355473.png"
    - "image_2024-06-03_020450281-e1717360912908.png"
    - "image_2024-06-03_020529379-e1717360945343.png"
    - "image_2024-06-03_020641800-e1717360927525.png"
    - "image_2024-06-03_020744358-e1717360996970.png"
    - "image_2024-06-03_020829727-e1717360986615.png"
    - "image_2024-06-03_020910228-e1717361034126.png"
    - "image_2024-06-03_020946325.png"
    - "image_2024-06-03_021035914.png"
    - "image-1-e1699203683612.png"
    - "image-2-e1699268069298.png"
    - "image-3-e1699268240144.png"
    - "image-4-e1699268549177.png"
    - "image-5-e1696767236795.png"
    - "image-6-e1696767359324.png"
    - "image-7-e1696767338300.png"
    - "image-8-e1699270516498.png"
    - "image-9-e1696784125346.png"
    - "image-10-e1696784184315.png"
    - "image-11-e1699289070343.png"
    - "image-12-e1699289052339.png"
    - "image-13-e1699289088856.png"
    - "image-15-e1699289107679.png"
    - "image-16-e1699289253828.png"
    - "image-17.png"
    - "image-18-e1699203496915.png"
    - "image-19.png"
    - "image-20-e1699293034944.png"
    - "image-21-e1699293045416.png"
    - "image-22-e1699293105650.png"
    - "image-23-e1699293251893.png"
    - "image-24-e1699293400159.png"
    - "image-25-e1699293415472.png"
    - "image-26-e1699293426812.png"
    - "image-27-e1699293436956.png"
    - "image-28.png"
    - "image-29-e1699289341794.png"
    - "image-31-e1699293478698.png"
    - "image-32-e1699293494122.png"
    - "image-33-e1699293507264.png"
    - "image-34-e1699293538439.png"
    - "Screenshot-2023-09-20-at-10.43.16-PM-e1699269167459.png"
    - "Screenshot-2023-09-20-at-10.53.05-PM.png"

categories:
  - title: "Beneficiaries (Schools & Institutions)"
    partners:
      - "Ahmedabad Zilla Parishad Office"
      - "Sanand BRC Bhavan"
      - "St Xavier's College"
      - "Euroschool"
      - "Lakshya International"
      - "Blue Bell School"
      - "Vandana School"
      - "Crescent School"
      - "Balbharti School"
      - "Nirman School"
      - "Shams School"
      - "Saraswati School"
      - "Neema School"
      - "Republic School"
      - "Matrutva School"
      - "Anjuman School"
      - "Matruchaya School"
      - "Rah-e-Khair School"
      - "Memnagar Sarwajanik Vidhyalaya"
      - "ZED English Medium"
      - "Smt AAS Primary School"
      - "Vidya Sagar High School"
      - "Pratap High School"
      - "Shreyas Balgruh"
      - "Children's Home Paldi"
      - "Boys Remand Home Sola"
      - "Vikasgruh School & Orphanage Paldi"

  - title: "Volunteer Partners"
    partners:
      - "IIT Bombay Student Council"
      - "Ahmedabad University"
      - "Nirma University"
      - "Symbiosis Hyderabad"
      - "GLS"
      - "einfochips"
      - "Ahmedabad International School"
      - "Calorx Olive International School"
      - "Redbricks School"
      - "Apple Global School"
      - "Knowledge Consortium of Gujarat"
      - "Gujarat Vidhyapith"
      - "JG College of Education"
      - "Connectfor"
      - "Omprakash Foundation"
      - "UPES University"

  - title: "Collaborating NGOs & Organisations"
    partners:
      - "Dream A Dream Foundation"
      - "Cell for Human Value & Transformative Learning (CHVTL)"
      - "Ahmedabad Management Association"
      - "Bharat Youth Convention"
      - "YUVA Unstoppable"
      - "Aasmaan Foundation"
      - "Saath Trust"
      - "Karma Foundation"
      - "Indian Multiversity Alliance"
      - "Kahaani Sports Academy"
      - "SEE Learning"
      - "Piramal School of Leadership"

  - title: "Knowledge, Research & Funding Partners"
    partners:
      - "University of Cambridge"
      - "The Royal Society of Arts (UK)"
      - "Mind & Life Institute"
      - "NISSEM"
      - "Aurobindo Ashram Delhi Branch"
      - "Aga Khan Foundation"
      - "Decathlon"
      - "Havmor Ice Creams"

  - title: "Other Supporters"
    partners:
      - "Jeevantirth Foundation"
      - "Gyanprakash Foundation"
      - "Pratham Education Foundation"
      - "Riverside School"
      - "Mahatma Gandhi International School"
      - "Adani International School"
```

---

### `content/pages/about-our-results.yaml`
*Source: `src/pages/about/OurResults.jsx`; `translation.json` — about.results keys*

```yaml
meta:
  badge: "Impact"
  title: "Our Results"
  subtitle: "Numbers that tell a human story."
  seoTitle: "Our Results — TIDE Foundation"
  seoDescription: "TIDE Foundation's impact across 40,000+ people, 7 programs, and 10 years of work."

topStats:
  - value: "40000+"
    label: "People Engaged"
  - value: "200+"
    label: "Active Volunteers"
  - value: "7"
    label: "Programs Run"
  - value: "10"
    label: "Years of Impact"

programImpact:
  sectionBadge: "By Program"
  sectionTitle: "Program-wise Impact"
  programs:
    - name: "Saral Kadam"
      stats: "124 government schools · 12,244 children"
      colorKey: "blue"
    - name: "Prerak"
      stats: "26 schools · 2 remand homes · 14,402 children · 695 teachers"
      colorKey: "emerald"
    - name: "BetterED"
      stats: "12 slums · 1,225 children"
      colorKey: "violet"
    - name: "Disha"
      stats: "10 schools · 5 orphanages · 1 village · 1 slum · 2,082 children"
      colorKey: "rose"
    - name: "CollegeDev"
      stats: "1,056 students"
      colorKey: "amber"
    - name: "CompletEd"
      stats: "5 workshops · 6 talk shows · 1,028 people"
      colorKey: "sky"
    - name: "RefugEd"
      stats: "5 Syrian refugee families supported"
      colorKey: "orange"
```

**NOTE for Phase 3:** The `colorKey` maps to Tailwind classes in the component. Keep the mapping in JSX as a constant object:
```js
const COLOR_MAP = {
  blue:    'bg-blue-50 border-blue-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  violet:  'bg-violet-50 border-violet-200',
  rose:    'bg-rose-50 border-rose-200',
  amber:   'bg-amber-50 border-amber-200',
  sky:     'bg-sky-50 border-sky-200',
  orange:  'bg-orange-50 border-orange-200',
}
```

---

### `content/pages/projects-block-eti.yaml`
*Source: `src/pages/projects/BlockETI.jsx`; `translation.json` — projects.blockETI keys*

```yaml
meta:
  badge: "Projects"
  title: "Block Educational Transformation Initiative"
  tagline: "Systemic change at the block level."
  seoTitle: "Block ETI — TIDE Foundation"
  seoDescription: "A comprehensive initiative working at the government school block level to transform foundational learning, life skills, and teacher empowerment."

overview:
  title: "Overview"
  body: "A comprehensive initiative working at the government school block level to transform foundational learning, life skills, and teacher empowerment — at scale."

subPrograms:
  sectionBadge: "Sub-Programs"
  sectionTitle: "Three Pillars"
  sectionSubtitle: "Each sub-program targets a distinct root cause at the block level"
  items:
    - name: "सरल कदम (Saral Kadam)"
      desc: "Foundational mathematics through 14 visual, self-directed learning booklets for government school students."
      iconKey: "BookOpen"
      to: "/resources/saral-kadam"
    - name: "Disha"
      desc: "Life skills and social-emotional development programme operating across schools, orphanages and communities."
      iconKey: "Heart"
      to: null
    - name: "EmpowerEd Sanand"
      desc: "Teacher empowerment and professional development initiative running at the block level in Sanand."
      iconKey: "Users"
      to: null
```

---

### `content/pages/projects-bettered.yaml`
*Source: `src/pages/projects/BetterED.jsx`; `translation.json` — projects.bettered keys*

```yaml
meta:
  badge: "Projects"
  title: "BetterED"
  tagline: "After-school education for underserved communities."
  seoTitle: "BetterED — TIDE Foundation"
  seoDescription: "BetterED addresses learning gaps through structured after-school programs in urban slums."

stats:
  - value: "12"
    label: "Slums Served"
  - value: "1225"
    label: "Children Reached"
  - value: "5"
    label: "Days/Week"
  - value: "2014"
    label: "Founded"

overview:
  title: "Overview"
  body: "BetterED addresses learning gaps through structured after-school programs in urban slums — evolving from weekly games sessions to a comprehensive five-to-six-day-a-week educational model."
  reach: "12 slums · 1,225 children"
  focus: "Life skills, arts, dance, theatre, public speaking and storytelling"
  goal: "A scalable, volunteer-driven intervention that can reach hundreds of schools citywide."
  photo1: "/assets/images/projects-bettered/gallery-01.jpg"
  photo2: "/assets/images/projects-bettered/gallery-02.jpg"

evolution:
  sectionBadge: "Journey"
  sectionTitle: "Program Evolution"
  sectionSubtitle: "How BetterED grew from play to purpose"
  phases:
    - phase: "Phase 1"
      desc: "Once-weekly recreational games sessions"
      icon: "🎮"
    - phase: "Phase 2"
      desc: "Doubt-solving and life skills classes — twice weekly"
      icon: "📚"
    - phase: "Phase 3"
      desc: "Five to six days per week comprehensive education"
      icon: "🏫"
    - phase: "Post-Pandemic"
      desc: "Life skills, integrated holistic education, and physical education"
      icon: "🌱"

gallery:
  sectionBadge: "Gallery"
  sectionTitle: "BetterED in Action"
  images:
    - src: "/assets/images/projects-bettered/gallery-03.jpg"
      label: "BetterED gallery 1"
    - src: "/assets/images/projects-bettered/gallery-04.jpg"
      label: "BetterED gallery 2"
    - src: "/assets/images/projects-bettered/gallery-05.jpg"
      label: "BetterED gallery 3"
    - src: "/assets/images/projects-bettered/gallery-06.jpg"
      label: "BetterED gallery 4"
    - src: "/assets/images/projects-bettered/gallery-07.jpg"
      label: "BetterED gallery 5"
    - src: "/assets/images/projects-bettered/gallery-08.jpg"
      label: "BetterED gallery 6"
    - src: "/assets/images/projects-bettered/gallery-09.jpg"
      label: "BetterED gallery 7"
    - src: "/assets/images/projects-bettered/gallery-10.jpg"
      label: "BetterED gallery 8"
    - src: "/assets/images/projects-bettered/gallery-11.jpg"
      label: "BetterED gallery 9"
```

---

### `content/pages/projects-empowered.yaml`
*Source: `src/pages/projects/EmpowerEd.jsx`; `translation.json` — projects.empowered keys*

```yaml
meta:
  badge: "Projects"
  title: "EmpowerEd"
  tagline: "Empower. Enrich. Educate."
  seoTitle: "EmpowerEd — TIDE Foundation"
  seoDescription: "EmpowerEd develops bottom-up, collaborative interventions to educate and empower educators."

overview:
  title: "Overview"
  body: "EmpowerEd develops bottom-up, collaborative interventions to educate, enrich and empower educators. It treats teachers as experts — not recipients — of professional development."
  logo: "/assets/images/projects-empowered/ee-logo.jpeg"
  heroPhoto: "/assets/images/projects-empowered/Build-teacher-agency.jpg"

components:
  - title: "Community of Practitioners"
    desc: "Fortnightly dialogue sessions, small-group projects, action research, reading groups, and best-practice documentation."
    iconKey: "Users"
  - title: "Immersive Teacher Empowerment App"
    desc: "Rich storytelling and game-based decision-making scenarios rooted in diverse household experiences."
    iconKey: "BookOpen"

objectives:
  sectionBadge: "Our Approach"
  sectionTitle: "Five Objectives"
  sectionSubtitle: "The pillars that guide EmpowerEd's work with teachers"
  items:
    - label: "Build teacher agency"
      photo: "/assets/images/projects-empowered/Build-teacher-agency.jpg"
    - label: "Share best practices"
      photo: "/assets/images/projects-empowered/Share-best-practices.jpg"
    - label: "Facilitate dialogic & experiential learning"
      photo: "/assets/images/projects-empowered/Dialogic-and-experiential-learning.jpg"
    - label: "Create professional learning communities"
      photo: "/assets/images/projects-empowered/Createp-rofessional-learning-communities.jpg"
    - label: "Generate systemic change"
      photo: "/assets/images/projects-empowered/Create-systemic-change.jpg"

timeline:
  sectionBadge: "Roadmap"
  sectionTitle: "Implementation Timeline"
  sectionSubtitle: "A phased approach to scaling teacher empowerment"
  phases:
    - "Phase 1 (Jul–Nov 2022): Planning & design"
    - "Phase 2 (Nov 2022–Jun 2024): Pre-pilot with ~50 teachers; app pilot with ~10,000 teachers"
    - "Phase 3 (Jun 2024–Jun 2025): Scale to ~100,000 teachers across one Indian state"
    - "Phase 4 (Jun 2025–Jun 2028): Expand to 10–30 million teachers across India and internationally"
```

---

### `content/pages/projects-completed.yaml`
*Source: `src/pages/projects/CompletEd.jsx`; `translation.json` — projects.completed keys*

```yaml
meta:
  badge: "Projects"
  title: "CompletEd"
  tagline: "Education through, as, and for social justice."
  seoTitle: "CompletEd — TIDE Foundation"
  seoDescription: "CompletEd engages students and communities in social change through four distinct sub-programs."

stats:
  - value: "4"
    label: "Sub-Programs"
  - value: "1028"
    label: "People Engaged"
  - value: "5"
    label: "Workshops Run"
  - value: "3"
    label: "MOI Editions"

overview:
  title: "Overview"
  body: "CompletEd engages students and communities in social change through four distinct sub-programs, fostering civic awareness, leadership, and a commitment to the Sustainable Development Goals."

programs:
  sectionBadge: "Sub-Programs"
  sectionTitle: "Four Pillars of CompletEd"
  items:
    - key: "scf"
      title: "Social Changemakers Fellowship"
      desc: "A prestigious program fostering social leadership among young people."
      logo: "/assets/images/projects-completed/bg-scf-logo.png"
      colorKey: "violet"
    - key: "sdg"
      title: "SDG Drives"
      desc: "Volunteering initiatives directly aligned with the UN Sustainable Development Goals."
      logo: "/assets/images/projects-completed/bg-sdg-logo.png"
      colorKey: "emerald"
    - key: "mcc"
      title: "Model City Council"
      desc: "A public engagement event promoting civic participation and collaborative problem-solving."
      logo: "/assets/images/projects-completed/bg-mcc-logo.png"
      colorKey: "blue"
    - key: "moi"
      title: "Miracle of Ideas"
      desc: "A platform showcasing innovative solutions — editions in 2017, 2023, and 2024."
      logo: "/assets/images/projects-completed/bg-moi-logo.jpg"
      colorKey: "amber"

moiBrochure:
  sectionBadge: "Miracle of Ideas 2023"
  sectionTitle: "MOI Brochure"
  sectionSubtitle: "Inside the 2023 edition of Miracle of Ideas."
  pages:
    - src: "/assets/images/projects-moi2023/brochure-p1.jpg"
      label: "MOI 2023 Brochure — Page 1"
    - src: "/assets/images/projects-moi2023/brochure-p2.jpg"
      label: "MOI 2023 Brochure — Page 2"
    - src: "/assets/images/projects-moi2023/brochure-p3.jpg"
      label: "MOI 2023 Brochure — Page 3"

scfProgram:
  sectionBadge: "Social Changemakers Fellowship"
  sectionTitle: "SCF Program Design"
  sectionSubtitle: "How the fellowship is structured and what it aims to achieve."
  diagrams:
    - src: "/assets/images/projects-scf/areas-of-work.png"
      label: "Areas of Work"
    - src: "/assets/images/projects-scf/timeline-diagram.png"
      label: "Program Timeline"
  fellowsBadge: "Fellows"
  fellowsTitle: "SCF Fellows"
  fellowsSubtitle: "Young people driving social change through education and community action."
  fellows:
    - name: "Aarushi Patel"
      photo: "/assets/images/projects-scf-team/aarushi-patel.png"
    - name: "Anaya Patel"
      photo: "/assets/images/projects-scf-team/anaya-patel.png"
    - name: "Arav Gupta"
      photo: "/assets/images/projects-scf-team/arav-gupta.png"
    - name: "Arth Patel"
      photo: "/assets/images/projects-scf-team/arth-patel.png"
    - name: "Havisha Chokshi"
      photo: "/assets/images/projects-scf-team/havisha-chokshi.png"
    - name: "Hiya Patel"
      photo: "/assets/images/projects-scf-team/hiya-patel.png"
    - name: "Prisha Arora"
      photo: "/assets/images/projects-scf-team/prisha-arora.png"
    - name: "Samaya Bhowmick"
      photo: "/assets/images/projects-scf-team/samaya-bhowmick.jpg"
    - name: "Tanay Sanghvi"
      photo: "/assets/images/projects-scf-team/tanay-sanghvi.png"
    - name: "Yashvit Sancheti"
      photo: "/assets/images/projects-scf-team/yashvit-sancheti.png"

moi2024:
  sectionBadge: "Miracle of Ideas 2024"
  sectionTitle: "MOI 2024 Highlights"
  sectionSubtitle: "The latest edition — exhibitions, panel talks, interventions and more."
  highlights:
    - src: "/assets/images/projects-moi2024/icon-exhibition.png"
      label: "Exhibition"
    - src: "/assets/images/projects-moi2024/icon-panel-talks.png"
      label: "Panel Talks"
    - src: "/assets/images/projects-moi2024/icon-interventions.png"
      label: "Interventions"
    - src: "/assets/images/projects-moi2024/icon-mcc.png"
      label: "MCC"
  poster: "/assets/images/projects-moi2024/signup-poster.png"
```

**NOTE for Phase 3:** The `colorKey` for programs maps in JSX:
```js
const PROGRAM_COLORS = {
  violet: { bg: 'bg-violet-50', accent: 'from-violet-600 to-purple-700' },
  emerald: { bg: 'bg-emerald-50', accent: 'from-emerald-600 to-teal-700' },
  blue:   { bg: 'bg-blue-50',   accent: 'from-blue-600 to-sky-700' },
  amber:  { bg: 'bg-amber-50',  accent: 'from-amber-500 to-orange-600' },
}
```

---

### `content/pages/projects-other.yaml`
*Source: `src/pages/projects/OtherProjects.jsx`*

```yaml
meta:
  badge: "Projects"
  title: "Other Projects"
  tagline: "Further initiatives in TIDE's portfolio."
  seoTitle: "Other Projects — TIDE Foundation"
  seoDescription: "Beyond the six core projects, TIDE Foundation has run CollegeDev, Prerak, RefugEd, Disha, MOI, and more."

intro: "Beyond our six core projects, TIDE Foundation has run and continues to develop additional initiatives responding to specific educational needs in Ahmedabad and beyond."

knownProjects:
  items:
    - name: "CollegeDev"
      desc: "Higher education support programme that has engaged 1,056 college-going students across the city."
      stats: "1,056 students"
      iconKey: "GraduationCap"
      photos:
        - "/assets/images/projects-other/1.-colDev4.jpg"
        - "/assets/images/projects-other/2.-colDev1.jpg"
        - "/assets/images/projects-other/colDev3.jpg"
        - "/assets/images/projects-other/colDev5.jpg"
    - name: "Prerak"
      desc: "School improvement programme working across 26 schools, 2 remand homes, reaching 14,402 children and 695 teachers."
      stats: "14,402 children · 695 teachers"
      iconKey: "Heart"
      photos:
        - "/assets/images/projects-other/1.-Prerak-Gibpura-1.jpg"
        - "/assets/images/projects-other/2.-Prerak-Gibpura1-1.jpg"
        - "/assets/images/projects-other/3.-Prerak-Shela5-1.jpg"
        - "/assets/images/projects-other/5.-Prerak-Gibpura4-2.jpg"
    - name: "RefugEd"
      desc: "A past initiative providing educational support to Syrian refugee families resettling in Ahmedabad."
      stats: "5 families"
      iconKey: "Globe"
      photos: []

disha:
  sectionBadge: "Disha"
  sectionTitle: "Disha — Life Skills & Community Education"
  sectionSubtitle: "Social-emotional development across schools, orphanages, and communities."
  body: "Disha has reached **2,082 children** across 10 schools, 5 orphanages, 1 village, and 1 slum. The program focuses on life skills, social activism, and community values through experiential activities and celebrations like pre-Diwali events in partnership with local communities."
  photos:
    - src: "/assets/images/projects-disha/1.-Sk-Yateemkhana.jpg"
      label: "Disha program 1"
    - src: "/assets/images/projects-disha/2.-Sk-Odhav-Social-activism-works.jpg"
      label: "Disha program 2"
    - src: "/assets/images/projects-disha/3.-Sk-Yateemkhana1.jpg"
      label: "Disha program 3"
    - src: "/assets/images/projects-disha/4.-Sk-Yateemkhana2.jpg"
      label: "Disha program 4"
    - src: "/assets/images/projects-disha/Fangdi-prediwali-2022-1-scaled.jpg"
      label: "Disha program 5"
    - src: "/assets/images/projects-disha/Fangdi-prediwali-2022-2-scaled.jpg"
      label: "Disha program 6"

moi:
  sectionBadge: "Miracle of Ideas"
  sectionTitle: "Miracle of Ideas (MOI)"
  sectionSubtitle: "A platform showcasing innovative solutions — editions in 2017, 2023, and 2024."
  photos:
    - src: "/assets/images/projects-moi/moi-photo.jpg"
      label: "MOI Session"
    - src: "/assets/images/projects-moi/moi-poster.jpg"
      label: "MOI Poster"

prabhav:
  sectionBadge: "Prabhav · Schools2030"
  sectionTitle: "Prabhav & Schools2030"
  sectionSubtitle: "Research-driven school improvement initiatives in partnership with global education networks."
  body: "Prabhav is TIDE's research initiative studying the impact of holistic education interventions. As part of the global **Schools2030** network — a programme by the Aga Khan Foundation — TIDE contributes on-ground data and insights on transformative learning environments."
  poster: "/assets/images/projects-prabhav/schools2030-poster.png"
```

**NOTE for Phase 3:** The `body` fields above use `**bold**` markdown. In the JSX, render these with a simple helper or `react-markdown`. Since these are isolated fields, the simplest approach is to use `dangerouslySetInnerHTML` with a minimal markdown processor, or just store HTML-like text. Alternatively, split into separate plain text fields. Decision: **keep as plain text, remove markdown bold for now** — the implementer should remove `**` from the body text above and use `<strong>` in JSX directly, OR install `react-markdown` for those fields.

---

### `content/pages/get-involved-volunteer.yaml`
*Source: `src/pages/get-involved/Volunteer.jsx`; `translation.json` — getInvolved.volunteer keys*

```yaml
meta:
  badge: "Get Involved"
  title: "Volunteer & Intern With Us"
  tagline: "Donate your time. Transform a life."
  seoTitle: "Volunteer With TIDE Foundation"
  seoDescription: "Intern or volunteer with TIDE Foundation — teach, create materials, support teachers, or help with operations."

intro:
  body: "Whether it's a couple of hours a week or a full-time internship, your contribution helps reform education for thousands of children across India."
  quote: "Helping People + Working With Peers = A Great Learning Experience"
  ctaLabel: "Apply via Google Form"
  ctaHref: "https://docs.google.com/forms"

opportunities:
  sectionBadge: "How You Can Help"
  sectionTitle: "Volunteer Opportunities"
  items:
    - iconKey: "BookOpen"
      title: "Direct Teaching"
      desc: "Work directly with children in classrooms, after-school programs, or community centres."
    - iconKey: "FileEdit"
      title: "Educational Materials"
      desc: "Create worksheets, curriculum content, and learning resources for our programs."
    - iconKey: "Users"
      title: "Teacher Training"
      desc: "Support our teacher empowerment initiatives and professional development sessions."
    - iconKey: "Building2"
      title: "School Improvement"
      desc: "Assist in school-level improvement projects and community engagement."
    - iconKey: "Briefcase"
      title: "Administration"
      desc: "Contribute to organisational operations, communications, and strategic projects."

gallery:
  sectionBadge: "Life at TIDE"
  sectionTitle: "Moments from the field"
  images:
    - src: "/assets/images/get-involved-volunteer/gallery-01.jpg"
      label: "TIDE volunteer 1"
    - src: "/assets/images/get-involved-volunteer/gallery-02.jpg"
      label: "TIDE volunteer 2"
    - src: "/assets/images/get-involved-volunteer/gallery-03.jpg"
      label: "TIDE volunteer 3"
    - src: "/assets/images/get-involved-volunteer/gallery-04.jpg"
      label: "TIDE volunteer 4"
    - src: "/assets/images/get-involved-volunteer/gallery-05.jpg"
      label: "TIDE volunteer 5"
    - src: "/assets/images/get-involved-volunteer/gallery-07.jpg"
      label: "TIDE volunteer 6"
    - src: "/assets/images/get-involved-volunteer/gallery-08.jpg"
      label: "TIDE volunteer 7"
    - src: "/assets/images/get-involved-volunteer/gallery-09.jpg"
      label: "TIDE volunteer 8"
```

---

### `content/pages/get-involved-donate.yaml`
*Source: `src/pages/get-involved/Donate.jsx`; `translation.json` — getInvolved.donate keys*

```yaml
meta:
  badge: "Get Involved"
  title: "Donate Now"
  tagline: "Every rupee builds a better classroom."
  seoTitle: "Donate — TIDE Foundation"
  seoDescription: "Support TIDE Foundation. Your donation directly funds programs reaching 40,000+ people across India."

support:
  title: "Support TIDE Foundation"
  body: "Your donation directly funds programs that reach 40,000+ people across India. To make a donation or learn about CSR partnerships, please reach out to us directly."
  impactPoints:
    - "40,000+ lives impacted across Gujarat"
    - "6 independent programs supported"
    - "80G tax exemption available for Indian donors"
    - "CSR partnership opportunities available"
  donorPoster: "/assets/images/get-involved-donate/qr-donate-poster.png"
  posterCaption: "Scan the QR code to donate directly, or contact us for bank transfer details and CSR arrangements."
  contactLabel: "Contact to Donate"
  contactHref: "mailto:info@tideinternational.org?subject=Donation Enquiry"
  whatsappLabel: "WhatsApp Us"
  whatsappHref: "https://wa.me/917041094082"
```

---

### `content/pages/get-involved-work-with-us.yaml`
*Source: `src/pages/get-involved/WorkWithUs.jsx`; `translation.json` — getInvolved.work keys*

```yaml
meta:
  badge: "Get Involved"
  title: "Work With Us"
  tagline: "Build a career at the intersection of education and social change."
  seoTitle: "Work With TIDE Foundation"
  seoDescription: "TIDE Foundation is always looking for passionate educators, researchers, designers and operational talent."

intro:
  title: "Join the Team"
  body: "TIDE Foundation is always looking for passionate educators, researchers, designers, communicators, and operational talent. We offer part-time, full-time, and remote opportunities."
  contactBody: "To enquire about current openings or express interest in working with us, reach out at:"
  contactEmail: "info@tideinternational.org"
```

---

### `content/pages/get-involved-mccx.yaml`
*Source: `src/pages/get-involved/OrganizeMCCx.jsx`; `translation.json` — getInvolved.mccx keys*

```yaml
meta:
  badge: "Get Involved"
  title: "Organise Your MCCx"
  tagline: "Bring Model City Council to your community."
  seoTitle: "Organise an MCCx — TIDE Foundation"
  seoDescription: "Model City Council puts young people in the role of city councillors — debating real civic issues and experiencing democratic participation."

whatIs:
  title: "What is Model City Council?"
  body1: "Model City Council (MCC) is a public engagement event that puts young people in the role of city councillors — debating real civic issues, proposing sustainable solutions, and experiencing democratic participation first-hand."
  body2: "Want to organise an MCC event at your school, college, or organisation? Get in touch with us to learn how."
  ctaLabel: "Get in Touch"
  ctaHref: "mailto:info@tideinternational.org?subject=MCCx Organisation Enquiry"
  photos:
    - src: "/assets/images/projects-mcc/mccx-2025-au.jpg"
      label: "Ahmedabad University 2025"
    - src: "/assets/images/projects-mcc/mccx-2025-ggis.jpg"
      label: "GGIS 2025"
    - src: "/assets/images/projects-mcc/mcc-2024-navjeevan.jpeg"
      label: "Navjeevan 2024"
    - src: "/assets/images/projects-mcc/mcc-4-copy.png"
      label: "MCC Session"

steps:
  sectionBadge: "Process"
  sectionTitle: "How to Organise an MCCx"
  sectionSubtitle: "Four simple steps to bring Model City Council to your community."
  items:
    - iconKey: "Mail"
      title: "Express Interest"
      desc: "Reach out to us via email or WhatsApp to indicate your interest in hosting an MCCx."
    - iconKey: "Users"
      title: "Coordinator Call"
      desc: "A TIDE team member will connect with you to understand your context and co-design the event."
    - iconKey: "Lightbulb"
      title: "Plan & Prepare"
      desc: "We provide an organiser kit: agenda templates, facilitator guides, and topic briefings."
    - iconKey: "Vote"
      title: "Host the Event"
      desc: "Run the MCCx at your school, college, or organisation with TIDE support throughout."
```

---

### `content/pages/thrive.yaml`
*Source: `src/pages/THRIvE.jsx`; `translation.json` — thrive keys*

```yaml
meta:
  badge: "Research"
  title: "THRIvE Research Centre"
  fullName: "Transformative Holistic Research for Integral and Inclusive Education"
  tagline: "Where rigorous inquiry meets real-world impact."
  seoTitle: "THRIvE Research Centre — TIDE Foundation"
  seoDescription: "THRIvE is committed to creating transformative, inclusive, and equitable education systems through deep inquiry and strategic collaboration."

about:
  sectionBadge: "About"
  sectionTitle: "About THRIvE"
  body: "THRIvE is committed to creating transformative, inclusive, and equitable education systems through deep inquiry, strategic collaboration, holistic approaches, and actionable insights."

leaders:
  sectionBadge: "Co-Directors"
  sectionTitle: "Leadership"
  members:
    - name: "Dr. Jwalin Patel"
      role: "Co-Director · PhD, University of Cambridge"
      photo: "/assets/images/thrive/team-jwalin-patel.jpg"
    - name: "Dr. Seema Nath"
      role: "Co-Director · PhD, University of Cambridge · Associate Director, Ummeed Child Development Center"
      photo: null
    - name: "Dr. Rohini Sen"
      role: "Co-Director · PhD candidate, University of Warwick · Associate Professor, Jindal Global Law School"
      photo: "/assets/images/thrive/team-rohini-sen.jpg"

researchTeam:
  sectionBadge: "Team"
  sectionTitle: "Research Associates"
  sectionSubtitle: "The team driving THRIvE's on-ground investigations"
  members:
    - name: "Sangeeta Bhatt"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-sangeeta-bhatt.jpg"
    - name: "Mansi Nanda"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-mansi-nanda.jpg"
    - name: "Muskan Khanna"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-muskan-khanna.jpg"
    - name: "Murari Jha"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-murari-jha.jpg"
    - name: "Magdhi Diksha"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-magdhi-diksha.jpg"
    - name: "Paran Amitava"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-paran-amitava.jpg"
    - name: "Thilanka Wijesinghe"
      role: "Research Associate"
      photo: "/assets/images/thrive/team-thilanka-wijesinghe.jpg"

principles:
  sectionBadge: "Approach"
  sectionTitle: "Core Principles"
  items:
    - iconKey: "BookOpen"
      title: "Knowledge Generation"
      desc: "Producing evidence-based research to guide systemic improvements."
    - iconKey: "Microscope"
      title: "Deep Exploratory Research"
      desc: "Examining stakeholder experiences and systemic factors influencing behaviour."
    - iconKey: "TrendingUp"
      title: "Implementation Research"
      desc: "Investigating why policies and interventions succeed or fail."
    - iconKey: "Lightbulb"
      title: "Actionable Research"
      desc: "Ensuring insights drive tangible educational change."
    - iconKey: "Link2"
      title: "Sustainable Collaborations"
      desc: "Building long-term partnerships that foster institutional innovation."
    - iconKey: "Users"
      title: "Capacity Building"
      desc: "Equipping educators with research skills for sustainable change."

researchProjects:
  sectionBadge: "Research"
  sectionTitle: "Current Research Projects"
  sectionSubtitle: "Active investigations shaping the future of Indian education"
  items:
    - title: "Happiness Curriculum Study"
      desc: "Exploring teacher and student experiences with social-emotional development curricula."
      photo: "/assets/images/thrive/research-happiness-curriculum.png"
    - title: "PRABHAV"
      desc: "Examining teacher agency as a catalyst for educational change across India."
      photo: "/assets/images/thrive/research-prabhav.png"
    - title: "Teachers with Disabilities"
      desc: "Investigating professional experiences and identity among disabled educators."
      photo: "/assets/images/thrive/research-twd.png"
    - title: "Social Changemakers Program"
      desc: "Autoethnographic study of student engagement in immersive social justice projects."
      photo: "/assets/images/thrive/research-scf.jpg"
    - title: "Model City Council"
      desc: "Qualitative study of collaborative sustainability discussions and civic education."
      photo: "/assets/images/thrive/research-mcc.png"

conferences:
  sectionBadge: "Impact"
  sectionTitle: "Conferences & Publications"
  sectionSubtitle: "Sharing THRIvE's findings on global stages and in peer-reviewed research."
  images:
    - src: "/assets/images/thrive-happiness/bg-cies-2024-poster.jpg"
      label: "CIES 2024 Poster"
    - src: "/assets/images/thrive-happiness/bg-cies-2024-talk.png"
      label: "CIES 2024 Talk"
    - src: "/assets/images/thrive-happiness/bg-selebrating-summit.png"
      label: "SEL Celebrating Summit"
    - src: "/assets/images/thrive-happiness/bg-sel-paper.jpeg"
      label: "SEL Research Paper"
    - src: "/assets/images/thrive-happiness/bg-templeton-conf.png"
      label: "Templeton Conference"
    - src: "/assets/images/thrive-happiness/bg-blog-research.png"
      label: "Research Blog"
```

---

### `content/pages/resources-saral-kadam.yaml`
*Source: `src/pages/resources/SaralKadam.jsx`; `translation.json` — resources.saralKadam keys*

```yaml
meta:
  badge: "Resources"
  title: "Saral Kadam Materials"
  tagline: "Open-source foundational mathematics for every child."
  seoTitle: "Saral Kadam — TIDE Foundation"
  seoDescription: "14 visual, self-directed learning booklets for foundational numeracy — free to use and share."

about:
  title: "About Saral Kadam"
  overview: "14 visual, graphical, self and peer-directed learning booklets for foundational numeracy — free to use, free to share."
  available: "Currently available in Gujarati. English and Hindi translations in progress."
  request: "Worksheets and test papers available on request — email us at info@tideinternational.org"
  mainPhoto: "/assets/images/resources-publications/saral-kadam-booklets.jpg"
  diagramPhoto: "/assets/images/resources-saral-kadam-program/diagram.png"
  ctaLabel: "Request Materials"
  ctaHref: "mailto:info@tideinternational.org"

booklets:
  sectionBadge: "Materials"
  sectionTitle: "14 Booklets Across 4 Levels"
  sectionSubtitle: "Visual, self-directed learning for foundational numeracy — free to download and share."
  downloadCtaTitle: "Get the Full Booklet Set"
  downloadCtaBody: "All 14 Saral Kadam booklets are freely available. Worksheets and test papers available on request. Currently in Gujarati — English and Hindi coming soon."
  downloadCtaLabel: "Request Full Set"
  downloadCtaHref: "mailto:info@tideinternational.org?subject=Saral Kadam Materials Request"
  levels:
    - key: "level0"
      title: "Level 0"
      colorKey: "blue"
      booklets:
        - title: "Introduction to numbers"
          img: "/assets/images/resources-saral-kadam/L0B1.png"
        - title: "Counting"
          img: "/assets/images/resources-saral-kadam/LOB2.png"
    - key: "level1"
      title: "Level 1"
      colorKey: "emerald"
      booklets:
        - title: "Patterns"
          img: "/assets/images/resources-saral-kadam/L1B1.png"
        - title: "Counting"
          img: "/assets/images/resources-saral-kadam/L1B2.png"
        - title: "Place value"
          img: "/assets/images/resources-saral-kadam/L1B3.png"
        - title: "Zero"
          img: "/assets/images/resources-saral-kadam/L1B4.png"
    - key: "level2"
      title: "Level 2"
      colorKey: "violet"
      booklets:
        - title: "Shapes"
          img: "/assets/images/resources-saral-kadam/L2B1.png"
        - title: "Give and take"
          img: "/assets/images/resources-saral-kadam/L2B2.png"
        - title: "Addition and subtraction"
          img: "/assets/images/resources-saral-kadam/L2B3.png"
        - title: "Carry forward and borrowing"
          img: "/assets/images/resources-saral-kadam/L2B4.png"
    - key: "level3"
      title: "Level 3"
      colorKey: "amber"
      booklets:
        - title: "Measurement"
          img: "/assets/images/resources-saral-kadam/L3B1.png"
        - title: "Multiples and tables"
          img: "/assets/images/resources-saral-kadam/L3B2.png"
        - title: "Multiplication"
          img: "/assets/images/resources-saral-kadam/L3B3.png"
        - title: "Division"
          img: "/assets/images/resources-saral-kadam/L3B4.png"

programGallery:
  sectionBadge: "Saral Kadam in Action"
  sectionTitle: "Program Highlights"
  sectionSubtitle: "Saral Kadam being used across government school communities."
  photos:
    - src: "/assets/images/resources-saral-kadam-program/SKP-books-2.jpeg"
      label: "Saral Kadam program 1"
    - src: "/assets/images/resources-saral-kadam-program/SKP-1.jpg"
      label: "Saral Kadam program 2"
    - src: "/assets/images/resources-saral-kadam-program/SKP-2.jpg"
      label: "Saral Kadam program 3"
    - src: "/assets/images/resources-saral-kadam-program/SKP-3.jpg"
      label: "Saral Kadam program 4"
    - src: "/assets/images/resources-saral-kadam-program/SKP-4.jpg"
      label: "Saral Kadam program 5"
    - src: "/assets/images/resources-saral-kadam-program/SKP-5.jpg"
      label: "Saral Kadam program 6"
    - src: "/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-1-scaled.jpg"
      label: "Saral Kadam program 7"
    - src: "/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-2-scaled.jpg"
      label: "Saral Kadam program 8"
    - src: "/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-3-scaled.jpg"
      label: "Saral Kadam program 9"
    - src: "/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-1-scaled.jpg"
      label: "Saral Kadam program 10"
    - src: "/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-2-scaled.jpg"
      label: "Saral Kadam program 11"
    - src: "/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-5-scaled.jpg"
      label: "Saral Kadam program 12"
    - src: "/assets/images/resources-saral-kadam-program/Popatpura-SKP-prediwali-2022-scaled.jpg"
      label: "Saral Kadam program 13"
```

**NOTE for Phase 3:** `colorKey` maps to Tailwind classes. Keep in JSX:
```js
const LEVEL_COLORS = {
  blue:    { card: 'bg-blue-50 border-blue-200',     accentBg: 'bg-blue-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', accentBg: 'bg-emerald-600' },
  violet:  { card: 'bg-violet-50 border-violet-200', accentBg: 'bg-violet-600' },
  amber:   { card: 'bg-amber-50 border-amber-200',   accentBg: 'bg-amber-600' },
}
```

---

### `content/pages/resources-annual-reports.yaml`
*Source: `src/pages/resources/AnnualReports.jsx`; `translation.json` — resources.annualReports keys*

```yaml
meta:
  badge: "Resources"
  title: "Annual Reports"
  tagline: "Transparency in every year of our journey."
  seoTitle: "Annual Reports — TIDE Foundation"
  seoDescription: "TIDE Foundation annual reports from 2014 to present — a decade of accountability and learning."

section:
  sectionBadge: "Transparency"
  sectionTitle: "10 Years of Documentation"
  sectionSubtitle: "Every report reflects our commitment to accountability and learning."
  footerNote: "For full PDF downloads, visit tideinternational.org or email info@tideinternational.org"

reports:
  - year: "2025–26"
    label: "Latest Report"
    photo: "/assets/images/resources-annual-reports/report-2025-26.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: true
    wide: false
  - year: "2023–24"
    label: "Annual Report"
    photo: "/assets/images/resources-annual-reports/report-2023-24.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
  - year: "2022–23"
    label: "Annual Report"
    photo: "/assets/images/resources-annual-reports/report-2022-23.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
  - year: "2021–22"
    label: "Annual Report"
    photo: "/assets/images/resources-annual-reports/report-2021-22.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
  - year: "2020–21"
    label: "Annual Report"
    photo: "/assets/images/resources-annual-reports/report-2020-21.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
  - year: "2019–20"
    label: "Annual Report"
    photo: "/assets/images/resources-annual-reports/report-2019-20.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
  - year: "5-Year Report (2014–2019)"
    label: "Impact Report"
    photo: "/assets/images/resources-annual-reports/report-2014-19.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: true
  - year: "2014–15"
    label: "Inaugural Report"
    photo: "/assets/images/resources-annual-reports/report-2014-15.png"
    href: "https://tideinternational.org/resources/annual-reports/"
    highlight: false
    wide: false
```

---

### `content/pages/resources-publications.yaml`
*Source: `src/pages/resources/Publications.jsx`; `translation.json` — resources.publications keys*

```yaml
meta:
  badge: "Resources"
  title: "Our Publications"
  tagline: "Research, insights, and ideas from the TIDE community."
  seoTitle: "Publications — TIDE Foundation"
  seoDescription: "Academic, applied, and public scholarship from the TIDE team — 15+ publications and presentations."

section:
  sectionBadge: "Research & Writing"
  sectionTitle: "15+ Publications & Presentations"
  sectionSubtitle: "Academic, applied, and public scholarship from the TIDE team."

# type values: book | article | video | talk | materials
# href: null if no link available
# internal: true if href is an internal React Router path
publications:
  - type: "book"
    title: "Learning to Live Together Harmoniously: Spiritual Perspectives from Indian Classrooms"
    publisher: "Palgrave, Macmillan & Springer"
    href: "https://link.springer.com/book/9783031235382"
    internal: false
    photo: "/assets/images/resources-publications/publication-1.jpg"
  - type: "book"
    title: "Case Study on Best Practices During COVID-19"
    publisher: "Education for All in Times of Crisis (Routledge, 2021)"
    href: "https://www.doi.org/10.4324/9781003155591"
    internal: false
    photo: "/assets/images/resources-publications/blog-covid.png"
  - type: "book"
    title: "Case Study on Social Activism in Education"
    publisher: "Rewilding Education (Routledge, 2023)"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/case-study-covid.png"
  - type: "article"
    title: "Sample Chapter on Integrating Social Emotional Learning"
    publisher: "NISSEM"
    href: "https://tideinternational.org/wp-content/uploads/2023/01/Sample-textbook_revise2.pdf"
    internal: false
    photo: null
  - type: "article"
    title: "A Vision for Indian Education System"
    publisher: "Kedavani Vimarsh 1(1), 27–28 — Patel, J."
    href: null
    internal: false
    photo: "/assets/images/resources-publications/vision-education.png"
  - type: "article"
    title: "Researching Happiness Curricula"
    publisher: "Mind & Life Institute"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/happiness-study.jpg"
  - type: "article"
    title: "Early Updates from Happiness Curricula Study"
    publisher: "Mind & Life Media"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/mli-logo.png"
  - type: "article"
    title: "Citizens in the Making: Inside the Schools that Prioritise Harmonious Living"
    publisher: "Cambridge Education News"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/citizens-in-making.png"
  - type: "video"
    title: "Miracle of Ideas — Public Talks Series"
    publisher: "YouTube Playlist — Editions 2017, 2023, 2024"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/moi-poster.png"
  - type: "talk"
    title: "Education for Harmony: Insights from Indian Thinkers and Practitioners"
    publisher: "IIMA Seminar — Dr. Jwalin Patel"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/iima-seminar.jpg"
  - type: "talk"
    title: "Presentation at Cambridge Education, London"
    publisher: "Voices of the Next Generation: Shaping the Future in Education"
    href: null
    internal: false
    photo: "/assets/images/resources-publications/cambridge-presentation.jpg"
  - type: "materials"
    title: "Saral Kadam Booklets"
    publisher: "14 open-source visual learning booklets for foundational mathematics"
    href: "/resources/saral-kadam"
    internal: true
    photo: "/assets/images/resources-publications/saral-kadam-booklets.jpg"
```

---

### `content/pages/contact.yaml`
*Source: `src/pages/Contact.jsx`; `translation.json` — contact keys*

```yaml
meta:
  badge: "Contact"
  title: "Get in Touch"
  tagline: "We'd love to hear from you."
  seoTitle: "Contact TIDE Foundation"
  seoDescription: "Get in touch with TIDE Foundation — Ahmedabad, Gujarat, India."

info:
  address: "8 Deepawali Centre (1st Floor), Opp Old High Court, Nr Income Tax Circle, Ahmedabad 380014, Gujarat, India"
  phones:
    - "+91 99798 82648"
    - "+91 70410 94082"
  email: "info@tideinternational.org"
  officeHours: "Monday – Friday, 9:00 AM – 6:00 PM"

social:
  - platform: "facebook"
    href: "https://facebook.com/togetherindevelopmentandeducation"
  - platform: "instagram"
    href: "https://instagram.com/tide_foundation_"
  - platform: "linkedin"
    href: "https://linkedin.com/company/13326412"

cta:
  whatsappLabel: "WhatsApp Us"
  whatsappHref: "https://wa.me/917041094082"
  emailLabel: "Email Us"
  emailHref: "mailto:info@tideinternational.org"

map:
  label: "Ahmedabad, Gujarat, India"
  mapsUrl: "https://maps.google.com/?q=8+Deepawali+Centre+Ahmedabad"
  mapsLabel: "View on Google Maps →"

form:
  title: "Send a Message"
  namePlaceholder: "Your name"
  emailPlaceholder: "Your email"
  messagePlaceholder: "Your message"
  submitLabel: "Send Message"
```

---

## Phase 3 — Component Refactor

### Pattern to apply to every page

**Remove:**
```js
import { useTranslation } from 'react-i18next'
// and:
const { t } = useTranslation()
```

**Add at top of file:**
```js
import data from '../data/[page-name].json'       // pages at src/pages/
import data from '../../data/[page-name].json'    // pages at src/pages/[subdir]/
```

**Replace all `t('key.path')` calls** with `data.field.subField`.

**Replace all hardcoded data arrays** with `data.arrayName`.

**Icon handling:** For sections where icons are stored as `iconKey` strings in YAML, add a lookup map in the component:
```js
import { Target, Lightbulb, CheckCircle2, Eye, ... } from 'lucide-react'
const ICONS = {
  Target:       <Target className="w-5 h-5" />,
  Lightbulb:    <Lightbulb className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Eye:          <Eye className="w-5 h-5" />,
  // add all used in that page
}
// Usage: {ICONS[item.iconKey]}
```

---

### Page-by-page refactor instructions

#### `src/pages/Home.jsx`
- Import: `import data from '../data/home.json'`
- Replace `PROGRAMS` constant with `data.programs.items` (add `iconKey` → ICONS lookup for `icon` prop)
- Replace `STATS` constant with `data.stats`
- Replace `GALLERY` constant with `data.gallery`
- Replace `t('home.hero.*')` with `data.hero.*`
- Replace `t('home.mission.*')` with `data.mission.*`
- Replace `t('home.projects.*')` with `data.programs.*`
- Replace `t('home.testimonial.*')` with `data.testimonial.*`
- Replace `t('home.cta.*')` with `data.cta.*`
- Remove `useTranslation` import and usage

#### `src/pages/about/WhyTide.jsx`
- Import: `import data from '../../data/about-why-tide.json'`
- Replace `goals` array with `data.goals.items` (add ICONS lookup for `icon`)
- Replace all `t('about.whyTide.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/about/OurTeam.jsx`
- Import: `import data from '../../data/about-our-team.json'`
- Replace `coreTeam` array with `data.coreTeam.members`
- Replace `advisors` array with `data.advisoryBoard.members`
- Replace `t('about.team.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/about/OurPartners.jsx`
- Import: `import data from '../../data/about-our-partners.json'`
- Replace `partnerData` array with `data.categories`
- Replace `partnerImages` array with `data.logoGallery.images.map(f => '/assets/images/about-our-partners/' + f)`
- Replace `t('about.partners.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/about/OurResults.jsx`
- Import: `import data from '../../data/about-our-results.json'`
- Replace `programs` array with `data.programImpact.programs`
- Add `COLOR_MAP` constant (see schema note above)
- Replace counter values with `data.topStats`
- Replace `t('about.results.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/projects/BlockETI.jsx`
- Import: `import data from '../../data/projects-block-eti.json'`
- Replace `subPrograms` array with `data.subPrograms.items` (add ICONS lookup)
- Replace `t('projects.blockETI.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/projects/BetterED.jsx`
- Import: `import data from '../../data/projects-bettered.json'`
- Replace `evolution` array with `data.evolution.phases`
- Replace `galleryImages` array with `data.gallery.images`
- Replace counter values inline with `data.stats`
- Replace `t('projects.bettered.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/projects/EmpowerEd.jsx`
- Import: `import data from '../../data/projects-empowered.json'`
- Replace `phases` array with `data.timeline.phases`
- Replace `objectives` array with `data.objectives.items`
- Replace component cards with `data.components` (add ICONS lookup)
- Replace `t('projects.empowered.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/projects/CompletEd.jsx`
- Import: `import data from '../../data/projects-completed.json'`
- Replace `programs` array with `data.programs.items` (add `PROGRAM_COLORS` lookup)
- Replace `scfTeam` array with `data.scfProgram.fellows` (map to `scfFellowItems`)
- Replace `moiBrochureItems` with `data.moiBrochure.pages`
- Replace counter values with `data.stats`
- Replace `t('projects.completed.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/projects/OtherProjects.jsx`
- Import: `import data from '../../data/projects-other.json'`
- Replace `knownProjects` array with `data.knownProjects.items` (add ICONS lookup)
- Replace `dishaPhotos` array source with `data.disha.photos`
- Replace `moiPhotos` array source with `data.moi.photos`
- Replace `dishaItems` / `moiItems` derivation accordingly
- Remove `useTranslation`

#### `src/pages/get-involved/Volunteer.jsx`
- Import: `import data from '../../data/get-involved-volunteer.json'`
- Replace `gallery` array with `data.gallery.images` (map to src strings for `galleryItems`)
- Replace `opportunities` array with `data.opportunities.items` (add ICONS lookup)
- Replace `t('getInvolved.volunteer.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/get-involved/Donate.jsx`
- Import: `import data from '../../data/get-involved-donate.json'`
- Replace `impactPoints` array with `data.support.impactPoints`
- Replace all text strings with `data.support.*`
- Remove `useTranslation`

#### `src/pages/get-involved/WorkWithUs.jsx`
- Import: `import data from '../../data/get-involved-work-with-us.json'`
- Replace all `t('getInvolved.work.*')` and hardcoded strings with `data.intro.*`
- Remove `useTranslation`

#### `src/pages/get-involved/OrganizeMCCx.jsx`
- Import: `import data from '../../data/get-involved-mccx.json'`
- Replace `mccPhotos` array with `data.whatIs.photos`
- Replace `steps` array with `data.steps.items` (add ICONS lookup)
- Replace all `t('getInvolved.mccx.*')` and hardcoded strings with `data.*`
- Remove `useTranslation`

#### `src/pages/THRIvE.jsx`
- Import: `import data from '../data/thrive.json'`
- Replace `leaders` array with `data.leaders.members`
- Replace `researchTeam` array with `data.researchTeam.members`
- Replace `principles` array with `data.principles.items` (add ICONS lookup)
- Replace `researchProjects` array with `data.researchProjects.items`
- Replace `confImages` array with `data.conferences.images`
- Replace all `t('thrive.*')` with `data.*`
- Remove `useTranslation`

#### `src/pages/resources/SaralKadam.jsx`
- Import: `import data from '../../data/resources-saral-kadam.json'`
- Replace `levels` array with `data.booklets.levels` (add `LEVEL_COLORS` lookup)
- Replace `programPhotos` array source with `data.programGallery.photos.map(p => p.src)`
- Replace `programPhotoItems` derivation with `data.programGallery.photos`
- Replace all `t('resources.saralKadam.*')` and hardcoded strings with `data.*`
- Remove `useTranslation`

#### `src/pages/resources/AnnualReports.jsx`
- Import: `import data from '../../data/resources-annual-reports.json'`
- Replace `reports` array with `data.reports`
- Replace all `t('resources.annualReports.*')` and hardcoded strings with `data.*`
- Remove `useTranslation`

#### `src/pages/resources/Publications.jsx`
- Import: `import data from '../../data/resources-publications.json'`
- Replace `pubs` array with `data.publications`
- The `typeColors` and `typeLabel` maps stay hardcoded in JSX (they are style, not content)
- The `icon` per publication: add an icon based on `type` field in JSX (keep the `type → icon` mapping in JSX)
- Replace all `t('resources.publications.*')` and hardcoded strings with `data.*`
- Remove `useTranslation`

#### `src/pages/Contact.jsx`
- Import: `import data from '../data/contact.json'`
- Replace `t('contact.*')` with `data.*`
- Replace hardcoded phone numbers, addresses, social links with `data.info.*` and `data.social`
- Remove `useTranslation`

---

## Phase 4 — Shared Components

### `src/components/layout/Header.jsx`

- Import: `import navData from '../../data/navigation.json'`
- Replace the `NAV(t)` function with a direct reference: `const nav = navData.items`
- Remove `useTranslation` import and usage from Header
- The `t('nav.*')` calls are replaced by the label values already in the JSON
- Keep all interactivity logic (dropdowns, scroll detection, mobile menu) unchanged

### `src/components/layout/Footer.jsx`

**Read `src/components/layout/Footer.jsx` first.**
- Import: `import footerData from '../../data/footer.json'`
- Replace hardcoded columns, links, tagline, rights text with `footerData.*`
- Replace social links array with `footerData.social`
- Remove `useTranslation` usage

---

## Phase 5 — Cleanup & Testing

### 5.1 Run the sync and validate

```bash
npm run content:sync
npm run content:validate
```

Fix any path warnings reported.

### 5.2 Remove i18n locale files

Delete the content of:
- `src/i18n/locales/en/translation.json` — replace with empty object `{}`
- `src/i18n/locales/hi/translation.json` — replace with empty object `{}`
- `src/i18n/locales/gu/translation.json` — replace with empty object `{}`

Keep the files and the `src/i18n/index.js` setup intact — the language switcher infrastructure remains for future multilingual support.

### 5.3 Test dev server

```bash
npm run dev
```

Manually check these pages in the browser:
- `/` — hero, stats, programs, testimonial
- `/#/about/our-team` — all team members render, advisors render
- `/#/about/our-partners` — logo grid renders, category lists render
- `/#/projects/completed` — all four program cards, brochure lightbox, fellows grid
- `/#/thrive` — all sections, conference lightbox opens
- `/#/resources/annual-reports` — all 8 reports render correctly
- `/#/contact` — address and phone numbers correct

### 5.4 Production build

```bash
npm run build
```

Build must complete with 0 errors. The `(!) Some chunks are larger than 500 kB` warning is acceptable.

### 5.5 Commit

Commit with message:
```
Migrate all content to YAML content layer

- All 19 pages now read from src/data/*.json (auto-generated)
- Removed useTranslation from all page components
- i18n locale files cleared (infrastructure kept for future multilingual)
- Added scripts/yaml-to-json.js and scripts/validate-content.js
- predev/prebuild hooks auto-sync YAML before every dev/build run
```

---

## Phase 6 — Content Guide

Create `CONTENT-GUIDE.md` in the project root. This is for the non-technical content editor.

```markdown
# TIDE Website Content Guide

How to update the TIDE Foundation website content without touching any code.

---

## Setup (one-time, done by developer)

1. Install Node.js from https://nodejs.org (LTS version)
2. Open the project folder in VS Code
3. In VS Code, install the extension: "YAML" by Red Hat
4. Open a terminal in VS Code: Terminal → New Terminal
5. Run: `npm install`

---

## The golden rule

**Only edit files in the `content/` folder.**
Never edit files in `src/`, `scripts/`, or `dist/`.

---

## File map — which file = which page

| File | Page on website |
|------|----------------|
| `content/pages/home.yaml` | Home page |
| `content/pages/about-why-tide.yaml` | About → Why TIDE? |
| `content/pages/about-our-team.yaml` | About → Our Team |
| `content/pages/about-our-partners.yaml` | About → Our Partners |
| `content/pages/about-our-results.yaml` | About → Our Results |
| `content/pages/projects-bettered.yaml` | Projects → BetterED |
| `content/pages/projects-empowered.yaml` | Projects → EmpowerEd |
| `content/pages/projects-completed.yaml` | Projects → CompletEd |
| `content/pages/projects-block-eti.yaml` | Projects → Block ETI |
| `content/pages/projects-other.yaml` | Projects → Other Projects |
| `content/pages/get-involved-volunteer.yaml` | Get Involved → Volunteer |
| `content/pages/get-involved-donate.yaml` | Get Involved → Donate |
| `content/pages/get-involved-work-with-us.yaml` | Get Involved → Work With Us |
| `content/pages/get-involved-mccx.yaml` | Get Involved → Organise MCCx |
| `content/pages/thrive.yaml` | THRIvE Research Centre |
| `content/pages/resources-saral-kadam.yaml` | Resources → Saral Kadam |
| `content/pages/resources-annual-reports.yaml` | Resources → Annual Reports |
| `content/pages/resources-publications.yaml` | Resources → Publications |
| `content/pages/contact.yaml` | Contact page |
| `content/shared/navigation.yaml` | Top navigation menu |
| `content/shared/footer.yaml` | Footer |

---

## YAML basics — what you need to know

YAML uses indentation (spaces) to organise data. **Never use Tab key — only Spacebar.**

```yaml
# This is a comment — ignored by the computer
title: "Our Team"                # a simple text value
count: 42                        # a number
active: true                     # yes/no value

member:                          # a group of related fields
  name: "Jwalin Patel"
  role: "President"

members:                         # a list (each item starts with -)
  - name: "Jwalin Patel"
    role: "President"
  - name: "Gayatri Dave"
    role: "Co-Founder"
```

**Safe rules:**
- Always put text values in double quotes: `"Like this"`
- Never change the indentation of existing lines
- Never change the key names (the word before the colon)
- Only change the values (the text after the colon)

---

## Common tasks

### Update a stat number

Open `content/pages/home.yaml`. Find the `stats:` section:

```yaml
stats:
  - value: "40000+"    ← change this number
    label: "Lives impacted"
```

Change the value and save. That's it.

### Update the testimonial

In `content/pages/home.yaml`:

```yaml
testimonial:
  quote: "TIDE doesn't just run programs..."   ← change this
  author: "School Principal, Ahmedabad"         ← change this
  role: "Partner since 2017"                    ← change this
```

### Add a new annual report

Open `content/pages/resources-annual-reports.yaml`. Add a new item at the **top** of the `reports:` list:

```yaml
reports:
  - year: "2026–27"                                           ← new year
    label: "Latest Report"
    photo: "/assets/images/resources-annual-reports/report-2026-27.png"  ← cover image
    href: "https://drive.google.com/file/d/YOUR_FILE_ID/view"             ← Google Drive link
    highlight: true    ← set to true for the newest report only
    wide: false

  - year: "2025–26"
    label: "Annual Report"    ← change previous "Latest" to "Annual Report"
    highlight: false          ← set previous newest to false
    ...
```

Also add the cover image: place `report-2026-27.png` into `public/assets/images/resources-annual-reports/`.

### Add a new team member

Open `content/pages/about-our-team.yaml`. Under `coreTeam: members:`, copy an existing entry and paste it at the right position:

```yaml
    - name: "New Person Name"
      suffix: null             # use null if no degree/credential, or "PhD, University Name"
      role: "Their Role"
      bio: "A sentence or two about them."
      photo: "/assets/images/about-our-team/New-Person-Name-1.jpg"
```

Also add their photo: place the image file in `public/assets/images/about-our-team/`.

### Add a partner organisation name

Open `content/pages/about-our-partners.yaml`. Find the right `categories:` section and add to the `partners:` list:

```yaml
      - "New Partner Organisation Name"
```

### Add a partner logo

In `content/pages/about-our-partners.yaml`, under `logoGallery: images:`, add the filename:

```yaml
    - "new-partner-logo.png"
```

Place `new-partner-logo.png` in `public/assets/images/about-our-partners/`.

### Update a program stat

For BetterED stats, open `content/pages/projects-bettered.yaml`:

```yaml
stats:
  - value: "14"         ← update the number
    label: "Slums Served"
```

---

## Adding images

Images can be:
1. **Local files** — path starts with `/assets/images/...`
   - Place the file in the matching folder inside `public/assets/images/`
   - Use the path exactly as it appears in the folder
2. **External URLs** — full URL starting with `https://`
   - Just paste the URL as the value: `photo: "https://drive.google.com/..."`

---

## Preview your changes

After editing, open VS Code terminal and run:

**Windows:**
```
npm run dev
```

Open your browser at `http://localhost:5173` (or whatever port is shown).
Check the pages you edited look correct.
Press Ctrl+C in terminal to stop the preview.

---

## Build and deploy

Once changes look good:

**Step 1 — Build:**
```
npm run build
```
This creates a `dist/` folder with the final website files.

**Step 2 — Deploy:**
Open FileZilla (or your FTP client).
Connect to the server using the saved credentials.
Upload the **contents** of the `dist/` folder to the server's web root.

---

## Check for problems

Before building, you can run a check:
```
npm run content:validate
```
This will warn you if any image paths are broken or required fields are missing.

---

## What NOT to change

- `src/` folder — React code
- `scripts/` folder — build tools
- `dist/` folder — generated output (overwritten every build)
- Any `.yaml` file key names (the word before the colon)
- Indentation structure

If anything seems broken, close the file without saving and ask for help.
```

---

## Appendix A — YAML Quick Reference

| What you want | How to write it |
|---|---|
| Simple text | `title: "My title here"` |
| Text with apostrophe | `label: "Children's Home"` |
| Text with quotes inside | `quote: 'He said "hello" to her'` |
| Empty/no value | `photo: null` |
| A number | `value: "1225"` (keep as string for display) |
| A URL | `href: "https://example.com"` |
| A local image path | `photo: "/assets/images/folder/file.jpg"` |
| Yes/No flag | `highlight: true` or `highlight: false` |
| Long text (multiple lines) | Use `\|` then indent: |

```yaml
body: |
  First paragraph of text here.

  Second paragraph here.
```

---

## Appendix B — Image folder map

| Page section | Folder in public/ |
|---|---|
| Team photos (core team, advisors) | `assets/images/about-our-team/` |
| Partner logos | `assets/images/about-our-partners/` |
| Annual report covers | `assets/images/resources-annual-reports/` |
| BetterED gallery | `assets/images/projects-bettered/` |
| THRIvE team | `assets/images/thrive/` |
| Home page | `assets/images/home/` |
| Volunteer gallery | `assets/images/get-involved-volunteer/` |
| Saral Kadam booklet covers | `assets/images/resources-saral-kadam/` |
| Saral Kadam program photos | `assets/images/resources-saral-kadam-program/` |
```

---

## Future: AI-Assisted Translation (not in scope now)

When multilingual support is needed, create a script `scripts/translate-yaml.js` that:
1. Reads all files in `content/pages/`
2. Calls an AI API (Claude/OpenAI) with each string value
3. Writes translated YAML to `content/hi/pages/` and `content/gu/pages/`
4. The `yaml-to-json.js` script is extended to write `src/data/en/`, `src/data/hi/`, `src/data/gu/`
5. A language context in React switches which data directory is loaded

The i18n infrastructure kept in Phase 5.2 enables this path without rework.
