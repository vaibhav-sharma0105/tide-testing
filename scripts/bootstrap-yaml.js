// scripts/bootstrap-yaml.js
// Bootstraps starter YAML content files (navigation, footer, etc.)
// Only creates files that don't already exist — safe to re-run.
// Run: npm run content:bootstrap
//
// What it does:
//   1. For each shared/page file below, creates it under content/ if it
//      doesn't already exist
//   2. Structured data (arrays, image paths) must be added manually or are
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
# DO NOT change "to" paths — they are React Router routes

donateLabel: "Donate"
donateMobileLabel: "Donate to TIDE"

# Brand lockup + accessibility labels (header)
logo: "/assets/images/shared/tide-logo.png"
logoAlt: "TIDE Foundation"
brandName: "TIDE"
brandSuffix: "Foundation"
skipLink: "Skip to main content"
ariaMain: "Main navigation"
menuToggleLabel: "Toggle menu"

items:
  - label: "About Us"
    children:
      - label: "Why TIDE?"
        to: "/about/why-tide"
        desc: "Our story, vision & values"
      - label: "Past Programs"
        to: "/about/past-programs"
        desc: "Our history and earlier initiatives"
      - label: "Our Team"
        to: "/about/our-team"
        desc: "Meet the people behind TIDE"
      - label: "Our Partners"
        to: "/about/our-partners"
        desc: "Our network of collaborators"
      - label: "Get Involved"
        to: "/get-involved/volunteer"
        desc: "Volunteer, intern, or join the team"
      - label: "Our Publications"
        to: "/about/publications"
        desc: "Annual reports, research & events"

  - label: "Education for Harmony"
    children:
      - label: "Ecosystem of Programs"
        to: "/education-for-harmony"
        desc: "EHSA framework & community programs"
      - label: "Organise your MCCx"
        to: "/education-for-harmony/mccx"
        desc: "Run a Model City Council"

  - label: "Pramaan"
    children:
      - label: "About Pramaan"
        to: "/pramaan"
        desc: "Open-access ABL resource centre"
      - label: "Resource Centre"
        to: "/pramaan/resource-centre"
        desc: "Browse ABL materials by grade & subject"
      - label: "Contribute"
        to: "/pramaan/contribute"
        desc: "Share your teaching resources"

  - label: "THRIvE Research Centre"
    to: "/thrive"

  - label: "Contact Us"
    to: "/contact"
`)

// ── shared/footer.yaml ──────────────────────────────────────────────────────
writeIfAbsent(path.join(SHARED_DIR, 'footer.yaml'), `tagline: "Improving access to holistic education since 2014."
together: "Together in Development and Education"
rights: "© 2025 TIDE Foundation. All rights reserved."
supportWork: "Support our work"
madeWithLove: "Made with love for education in India"
donateLabel: "Donate"
donateMobileLabel: "Donate to TIDE"
logo: "/assets/images/shared/tide-logo.png"
logoAlt: "TIDE Foundation"
brandName: "TIDE"
brandSuffix: "Foundation"
# {platform} = capitalised social platform name; {title} = column title
socialAriaLabel: "Visit TIDE on {platform}"
columnNavAriaLabel: "Footer navigation: {title}"

columns:
  - title: "About"
    links:
      - label: "Why TIDE?"
        to: "/about/why-tide"
      - label: "Our Team"
        to: "/about/our-team"
      - label: "Our Partners"
        to: "/about/our-partners"

  - title: "Get Involved"
    links:
      - label: "Volunteer With Us"
        to: "/get-involved/volunteer"
      - label: "Donate"
        to: "/get-involved/donate"
      - label: "Organise MCCx"
        to: "/education-for-harmony/mccx"

  - title: "Resources"
    links:
      - label: "ABL Resources"
        to: "/pramaan"
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
