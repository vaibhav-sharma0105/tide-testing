// scripts/validate-content.js
// Validates all YAML files in content/ — checks syntax and image paths
// Run: npm run content:validate

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { checkConsistency } from './contentConsistency.js'

const CONTENT_DIR = path.resolve('content')
const PUBLIC_DIR  = path.resolve('public')
let warnings = 0
let errors   = 0
const parsedDocs = []   // { file, data } for the consistency check below

function warn(file, msg)  { console.warn(`  ⚠  ${file}: ${msg}`);  warnings++ }
function error(file, msg) { console.error(`  ✗  ${file}: ${msg}`); errors++ }

// Any string value that is a local file path — it starts with /assets/ or assets/, or ends in an
// image/media extension — whatever its key, with or without the leading slash. A failed image is
// swapped for site.placeholderImage on the page, so a typo here would otherwise go unnoticed.
const MEDIA_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|pdf)$/i
function checkImagePath(file, key, value) {
  if (typeof value !== 'string') return
  if (/^(https?:|mailto:|tel:|data:)/i.test(value)) return
  if (!/^\/?assets\//.test(value) && !MEDIA_EXT.test(value)) return
  const rel = value.replace(/^\/+/, '')
  if (!rel.includes('/')) {
    warn(file, `file name without its folder: ${key} = "${value}" (write the full path, e.g. /assets/images/…)`)
    return
  }
  if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) {
    warn(file, `image not found on disk: ${key} = "${value}"`)
  }
}

function walkObject(file, obj, parentKey = '') {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      if (typeof item === 'string') checkImagePath(file, `${parentKey}[${i}]`, item)
      walkObject(file, item, `${parentKey}[${i}]`)
    })
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}.${k}` : k
      if (typeof v === 'string') checkImagePath(file, fullKey, v)
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
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      const relPath = path.relative('.', fullPath)
      let parsed
      try {
        parsed = yaml.load(fs.readFileSync(fullPath, 'utf8'))
      } catch (e) {
        error(relPath, `YAML parse error: ${e.message}`)
        continue
      }
      parsedDocs.push({ file: relPath, data: parsed })
      walkObject(relPath, parsed)
    }
  }
}

console.log('\n🔍 Validating YAML content...\n')
processDir(CONTENT_DIR)

// The e-mail and the lives-impacted total must match content/shared/site.yaml
// everywhere they appear (YAML pages + the llms.txt template).
function checkSiteConsistency() {
  const siteFile = path.join('content', 'shared', 'site.yaml')
  const siteDoc = parsedDocs.find(d => d.file === siteFile)
  if (!siteDoc || !siteDoc.data) {
    error(siteFile, 'missing or unparsable — cannot run the consistency check')
    return
  }
  const docs = [...parsedDocs]
  const llms = path.join(CONTENT_DIR, 'shared', 'llms.txt')
  if (fs.existsSync(llms)) {
    docs.push({ file: path.relative('.', llms), text: fs.readFileSync(llms, 'utf8') })
  }
  for (const { file, message } of checkConsistency(siteDoc.data, docs)) error(file, message)
}
checkSiteConsistency()

// Pramaan Library snapshot (form-format Sheet, scripts/sync-pramaan-library.js). A broken or hand-edited
// file must fail CI rather than reach the live site. Plus a
// privacy backstop: the snapshot may hold only the allowlisted fields and no email address, so a
// mistake can never publish contributors' personal details.
function checkLibrarySnapshot() {
  const snapFile = path.join('src', 'data', 'sheets', 'pramaan-library.json')
  const manFile = path.join('src', 'data', 'pramaan-library-photos.json')
  const allowed = new Set(['id', 'name', 'subject', 'type', 'concept', 'language', 'ownership', 'description', 'photoUrl', 'videoUrl', 'additionalInfo', 'grades', 'chapters'])
  let snap, manifest
  try { snap = JSON.parse(fs.readFileSync(snapFile, 'utf8')) } catch (e) { error(snapFile, `missing or not valid JSON: ${e.message}`); return }
  try { manifest = JSON.parse(fs.readFileSync(manFile, 'utf8')) } catch (e) { error(manFile, `missing or not valid JSON: ${e.message}`); return }
  if (snap.schemaVersion !== 1 || snap.success !== true || !Array.isArray(snap.resources)) {
    error(snapFile, 'unexpected shape (needs schemaVersion 1, success, resources[])')
    return
  }
  const ids = new Set()
  for (const r of snap.resources) {
    if (!r || typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name) { error(snapFile, 'a row has no id or name'); continue }
    if (ids.has(r.id)) error(snapFile, `duplicate id ${r.id}`)
    ids.add(r.id)
    const extra = Object.keys(r).filter(k => !allowed.has(k))
    if (extra.length) error(snapFile, `${r.id}: field(s) not allowed in the public snapshot: ${extra.join(', ')}`)
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(JSON.stringify(r))) error(snapFile, `${r.id}: contains an email address`)
  }
  if (snap.meta?.total !== snap.resources.length) error(snapFile, `meta.total is ${snap.meta?.total} but there are ${snap.resources.length} rows`)
  for (const [id, entry] of Object.entries(manifest)) {
    if (!ids.has(id)) error(manFile, `photo entry ${id} has no matching resource in the snapshot`)
    for (const rel of [entry?.thumb, entry?.full]) {
      if (typeof rel !== 'string' || !rel.startsWith('assets/images/pramaan-library/')) { error(manFile, `${id}: bad photo path ${JSON.stringify(rel)}`); continue }
      if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) error(manFile, `${id}: missing file public/${rel}`)
    }
  }
}
checkLibrarySnapshot()

// Publications snapshot ("TIDE THRIvE Publications (Responses)" Sheet, scripts/sync-publications.js).
// Same backstop as the library: allowlisted fields only, no email address, valid org/date/links,
// counts that match, and every thumbnail entry has its files inside its own folder.
function checkPublicationsSnapshot() {
  const snapFile = path.join('src', 'data', 'sheets', 'publications.json')
  const manFile = path.join('src', 'data', 'publications-photos.json')
  const allowed = new Set(['id', 'org', 'date', 'title', 'type', 'fields', 'description', 'citation', 'link', 'photoUrl'])
  const orgs = ['TIDE', 'THRIvE']
  let snap, manifest
  try { snap = JSON.parse(fs.readFileSync(snapFile, 'utf8')) } catch (e) { error(snapFile, `missing or not valid JSON: ${e.message}`); return }
  try { manifest = JSON.parse(fs.readFileSync(manFile, 'utf8')) } catch (e) { error(manFile, `missing or not valid JSON: ${e.message}`); return }
  if (snap.schemaVersion !== 1 || snap.success !== true || snap.section !== 'publications' || !Array.isArray(snap.resources)) {
    error(snapFile, 'unexpected shape (needs schemaVersion 1, success, section "publications", resources[])')
    return
  }
  const ids = new Set()
  for (const r of snap.resources) {
    if (!r || typeof r.id !== 'string' || !r.id || typeof r.title !== 'string' || !r.title) { error(snapFile, 'a row has no id or title'); continue }
    if (ids.has(r.id)) error(snapFile, `duplicate id ${r.id}`)
    ids.add(r.id)
    const extra = Object.keys(r).filter(k => !allowed.has(k))
    if (extra.length) error(snapFile, `${r.id}: field(s) not allowed in the public snapshot: ${extra.join(', ')}`)
    if (!orgs.includes(r.org)) error(snapFile, `${r.id}: org must be TIDE or THRIvE, got ${JSON.stringify(r.org)}`)
    if (r.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) error(snapFile, `${r.id}: date must be YYYY-MM-DD or null`)
    if (!Array.isArray(r.fields)) error(snapFile, `${r.id}: fields must be a list`)
    for (const k of ['link', 'photoUrl']) {
      if (r[k] !== null && !/^https?:\/\//.test(String(r[k]))) error(snapFile, `${r.id}: ${k} must be an http(s) link or null`)
    }
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(JSON.stringify(r))) error(snapFile, `${r.id}: contains an email address`)
  }
  if (snap.meta?.total !== snap.resources.length) error(snapFile, `meta.total is ${snap.meta?.total} but there are ${snap.resources.length} rows`)
  for (const org of orgs) {
    const n = snap.resources.filter(r => r.org === org).length
    if (snap.meta?.counts?.[org] !== n) error(snapFile, `meta.counts.${org} is ${snap.meta?.counts?.[org]} but there are ${n} rows`)
  }
  for (const [id, entry] of Object.entries(manifest)) {
    if (!ids.has(id)) error(manFile, `photo entry ${id} has no matching publication in the snapshot`)
    for (const rel of [entry?.thumb, entry?.full]) {
      if (typeof rel !== 'string' || !rel.startsWith('assets/images/publications/') || rel.includes('..')) { error(manFile, `${id}: bad photo path ${JSON.stringify(rel)}`); continue }
      if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) error(manFile, `${id}: missing file public/${rel}`)
    }
  }
}
checkPublicationsSnapshot()

// Partners snapshot ("TIDE/THRIvE Partners (Responses)" Sheet, scripts/sync-partners.js). Same
// backstop: allowlisted fields only, no email address, http(s) links only, a count that matches,
// and every logo entry has its file inside its own folder.
function checkPartnersSnapshot() {
  const snapFile = path.join('src', 'data', 'sheets', 'partners.json')
  const manFile = path.join('src', 'data', 'partners-photos.json')
  const allowed = new Set(['id', 'type', 'priority', 'name', 'website', 'photoUrl'])
  let snap, manifest
  try { snap = JSON.parse(fs.readFileSync(snapFile, 'utf8')) } catch (e) { error(snapFile, `missing or not valid JSON: ${e.message}`); return }
  try { manifest = JSON.parse(fs.readFileSync(manFile, 'utf8')) } catch (e) { error(manFile, `missing or not valid JSON: ${e.message}`); return }
  if (snap.schemaVersion !== 1 || snap.success !== true || snap.section !== 'partners' || !Array.isArray(snap.resources)) {
    error(snapFile, 'unexpected shape (needs schemaVersion 1, success, section "partners", resources[])')
    return
  }
  const ids = new Set()
  for (const r of snap.resources) {
    if (!r || typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name || typeof r.type !== 'string' || !r.type) { error(snapFile, 'a row has no id, name or type'); continue }
    if (ids.has(r.id)) error(snapFile, `duplicate id ${r.id}`)
    ids.add(r.id)
    const extra = Object.keys(r).filter(k => !allowed.has(k))
    if (extra.length) error(snapFile, `${r.id}: field(s) not allowed in the public snapshot: ${extra.join(', ')}`)
    for (const k of ['website', 'photoUrl']) {
      if (r[k] !== null && r[k] !== undefined && !/^https?:\/\//.test(String(r[k]))) error(snapFile, `${r.id}: ${k} must be an http(s) link or null`)
    }
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(JSON.stringify(r))) error(snapFile, `${r.id}: contains an email address`)
  }
  if (snap.meta?.total !== snap.resources.length) error(snapFile, `meta.total is ${snap.meta?.total} but there are ${snap.resources.length} rows`)
  for (const [id, entry] of Object.entries(manifest)) {
    if (!ids.has(id)) error(manFile, `logo entry ${id} has no matching partner in the snapshot`)
    const rel = entry?.thumb
    if (typeof rel !== 'string' || !rel.startsWith('assets/images/partners/') || rel.includes('..')) { error(manFile, `${id}: bad logo path ${JSON.stringify(rel)}`); continue }
    if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) error(manFile, `${id}: missing file public/${rel}`)
  }
}

// The Past SCF snapshot (scripts/sync-social-changemakers.js): shape, allowed fields only (no photo
// links), video links only in the two shapes the Apps Script makes, no email address, and every photo
// entry belonging to a profile ("<id>" or "<id>__field") with its file on disk.
function checkSocialChangemakersSnapshot() {
  const snapFile = path.join('src', 'data', 'sheets', 'social-changemakers.json')
  const manFile = path.join('src', 'data', 'social-changemakers-photos.json')
  const allowed = new Set(['id', 'batch', 'order', 'name', 'project', 'summary', 'nextSteps', 'videoUrl', 'testimonialUrl', 'writeupUrl'])
  const video = /^https:\/\/(?:drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\/preview|www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11})$/
  let snap, manifest
  try { snap = JSON.parse(fs.readFileSync(snapFile, 'utf8')) } catch (e) { error(snapFile, `missing or not valid JSON: ${e.message}`); return }
  try { manifest = JSON.parse(fs.readFileSync(manFile, 'utf8')) } catch (e) { error(manFile, `missing or not valid JSON: ${e.message}`); return }
  if (snap.schemaVersion !== 1 || snap.success !== true || snap.section !== 'social-changemakers' || !Array.isArray(snap.resources)) {
    error(snapFile, 'unexpected shape (needs schemaVersion 1, success, section "social-changemakers", resources[])')
    return
  }
  const ids = new Set()
  for (const r of snap.resources) {
    if (!r || typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name || typeof r.batch !== 'string' || !r.batch) { error(snapFile, 'a row has no id, name or batch'); continue }
    if (ids.has(r.id)) error(snapFile, `duplicate id ${r.id}`)
    ids.add(r.id)
    const extra = Object.keys(r).filter(k => !allowed.has(k))
    if (extra.length) error(snapFile, `${r.id}: field(s) not allowed in the public snapshot: ${extra.join(', ')}`)
    for (const k of ['videoUrl', 'testimonialUrl']) {
      if (r[k] !== null && r[k] !== undefined && !video.test(String(r[k]))) error(snapFile, `${r.id}: ${k} must be a Drive /preview or youtube-nocookie embed link, or null`)
    }
    if (r.writeupUrl !== null && r.writeupUrl !== undefined && !/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\/preview$/.test(String(r.writeupUrl))) error(snapFile, `${r.id}: writeupUrl must be a Drive /preview link or null`)
    if (r.order !== null && r.order !== undefined && !(Number.isInteger(r.order) && r.order > 0)) error(snapFile, `${r.id}: order must be a whole number or null`)
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(JSON.stringify(r))) error(snapFile, `${r.id}: contains an email address`)
  }
  if (snap.meta?.total !== snap.resources.length) error(snapFile, `meta.total is ${snap.meta?.total} but there are ${snap.resources.length} rows`)
  for (const [id, entry] of Object.entries(manifest)) {
    if (!ids.has(id.replace(/__(field|video|testimonial)$/, ''))) error(manFile, `photo entry ${id} has no matching profile in the snapshot`)
    const rel = entry?.thumb
    if (typeof rel !== 'string' || !rel.startsWith('assets/images/social-changemakers/') || rel.includes('..')) { error(manFile, `${id}: bad photo path ${JSON.stringify(rel)}`); continue }
    if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) error(manFile, `${id}: missing file public/${rel}`)
  }
}
checkPartnersSnapshot()
checkSocialChangemakersSnapshot()

// The Contribute button's link (abl-contribute.yaml → formUrl): empty, or a Google Forms link.
function checkContributeForm() {
  const file = path.join('content', 'pages', 'abl-contribute.yaml')
  let doc
  try { doc = yaml.load(fs.readFileSync(file, 'utf8')) } catch { return } // syntax errors are reported above
  const url = doc?.formUrl
  if (url === undefined || url === null || url === '') { warn(file, 'formUrl is empty — the Contribute button shows as "coming soon"'); return }
  let u
  try { u = new URL(String(url)) } catch { error(file, `formUrl is not a valid link: ${JSON.stringify(url)}`); return }
  const google = u.protocol === 'https:' && ((u.hostname === 'docs.google.com' && u.pathname.startsWith('/forms/')) || u.hostname === 'forms.gle')
  if (!google) error(file, `formUrl must be a Google Forms link (https://docs.google.com/forms/… or https://forms.gle/…), got ${JSON.stringify(url)}`)
}
checkContributeForm()

console.log(`\n   ${warnings} warning(s), ${errors} error(s)\n`)
if (errors > 0) process.exit(1)
