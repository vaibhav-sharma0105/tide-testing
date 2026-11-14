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

function checkImagePath(file, key, value) {
  if (typeof value !== 'string') return
  if (value.startsWith('http://') || value.startsWith('https://')) return
  if (!value.startsWith('/')) return
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
      if (['photo', 'src', 'logo', 'coverImage', 'image', 'poster', 'img',
           'heroPhoto', 'mainPhoto', 'diagramPhoto', 'backgroundImage',
           'donorPoster'].includes(k)) {
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

// Pramaan snapshot + photo manifest (bot-written by scripts/sync-abl-thumbnails.js). A broken or
// hand-edited file must fail CI rather than reach the live site. Skipped until the first sync has
// written the snapshot. Rules: docs/PRAMAAN-HARDENING-PLAN.md §6.3.
function checkAblSnapshot() {
  const snapFile = path.join('src', 'data', 'sheets', 'abl-resources.json')
  const manFile = path.join('src', 'data', 'abl-thumbnails-manifest.json')
  if (!fs.existsSync(snapFile)) return
  let snap, manifest
  try { snap = JSON.parse(fs.readFileSync(snapFile, 'utf8')) } catch (e) { error(snapFile, `not valid JSON: ${e.message}`); return }
  try { manifest = JSON.parse(fs.readFileSync(manFile, 'utf8')) } catch (e) { error(manFile, `not valid JSON: ${e.message}`); return }

  if (snap.schemaVersion !== 1 || snap.success !== true || !Array.isArray(snap.tabs) || !snap.resources || typeof snap.resources !== 'object') {
    error(snapFile, 'unexpected shape (needs schemaVersion 1, success, tabs[], resources{})')
    return
  }
  const ids = new Set()
  let total = 0
  for (const tab of snap.tabs) {
    const rows = snap.resources[tab]
    if (!Array.isArray(rows) || rows.length === 0) { error(snapFile, `tab "${tab}" has no rows`); continue }
    for (const r of rows) {
      if (!r || typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name) { error(snapFile, `a row in "${tab}" has no id or name`); continue }
      if (ids.has(r.id)) error(snapFile, `duplicate id ${r.id}`)
      ids.add(r.id)
      total++
    }
  }
  if (snap.meta?.total !== total) error(snapFile, `meta.total is ${snap.meta?.total} but there are ${total} rows`)

  const assetsDir = path.resolve(PUBLIC_DIR, 'assets', 'images', 'abl')
  for (const [id, entry] of Object.entries(manifest)) {
    if (!ids.has(id)) error(manFile, `photo entry ${id} has no matching resource in the snapshot`)
    for (const rel of [entry?.thumb, entry?.full]) {
      if (typeof rel !== 'string' || !rel.startsWith('assets/images/abl/')) { error(manFile, `${id}: bad photo path ${JSON.stringify(rel)}`); continue }
      if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) error(manFile, `${id}: missing file public/${rel}`)
    }
  }
  const known = new Set(Object.values(manifest).flatMap(e => [e?.thumb, e?.full]).filter(Boolean).map(p => path.basename(p)))
  const strays = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter(f => !known.has(f)) : []
  if (strays.length) warn('public/assets/images/abl', `${strays.length} file(s) not referenced by the manifest (e.g. ${strays.slice(0, 3).join(', ')})`)
}
checkAblSnapshot()

console.log(`\n   ${warnings} warning(s), ${errors} error(s)\n`)
if (errors > 0) process.exit(1)
