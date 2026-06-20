// scripts/bootstrap-yaml.js
// Bootstraps YAML content files from existing translation.json
// Only creates files that don't already exist — safe to re-run.
// Run: npm run content:bootstrap
//
// What it does:
//   1. Reads src/i18n/locales/en/translation.json
//   2. For each page, creates content/pages/<page>.yaml if it doesn't exist
//   3. Embeds all i18n text into a `text:` section in the YAML
//   4. Structured data (arrays, image paths) must be added manually or are
//      already present if you cloned the repo with content/ committed.

import fs from 'fs'
import path from 'path'

const CONTENT_DIR      = path.resolve('content')
const PAGES_DIR        = path.join(CONTENT_DIR, 'pages')
const SHARED_DIR       = path.join(CONTENT_DIR, 'shared')

fs.mkdirSync(PAGES_DIR,  { recursive: true })
fs.mkdirSync(SHARED_DIR, { recursive: true })

let created = 0
let skipped = 0

function writeIfAbsent(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`  ↷ skipped (exists): ${path.relative('.', filePath)}`)
    skipped++
  } else {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  ✓ created: ${path.relative('.', filePath)}`)
    created++
  }
}

console.log('\n🌱 Bootstrapping YAML content files...\n')

// ── shared/navigation.yaml ──────────────────────────────────────────────────
writeIfAbsent(path.join(SHARED_DIR, 'navigation.yaml'), `# Navigation — edit labels here to update all nav menus
# DO NOT change the "to" paths — they are React Router routes
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
`)

// ── shared/footer.yaml ──────────────────────────────────────────────────────
writeIfAbsent(path.join(SHARED_DIR, 'footer.yaml'), `tagline: "Improving access to holistic education since 2014."
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
`)

console.log(`\n   ${created} file(s) created, ${skipped} skipped (already exist).\n`)
console.log('ℹ  Page YAML files are pre-populated in content/pages/ — run "npm run content:sync" to regenerate JSON.\n')
