// Pramaan (ABL) sync: pulls the resource data AND photos from the Apps Script Web App, validates
// them, and writes — in one go — the data snapshot (src/data/sheets/abl-resources.json) and the
// self-hosted WebP photos (public/assets/images/abl/ + src/data/abl-thumbnails-manifest.json).
// The workflow then commits both together, so data and photos always publish atomically.
//
// Works with both Apps Script versions:
//   - v3+ (apps-script/abl/Code.gs): one token-gated `?action=export` returns a FRESH read with
//     data + photo list + health info.
//   - legacy (before v3): `export` is unknown, so the script answers with its public (cached)
//     listing; photos come from `?action=manifest`.
//
// Safety (docs/PRAMAAN-HARDENING-PLAN.md §6.3): rules live in scripts/lib/abl-snapshot.js. A
// structural problem (mass removal, vanished tab, renamed header…) publishes NOTHING and fails
// the run, keeping the last good snapshot — unless ALLOW_LARGE_CHANGE=true. A photo that can't be
// read from Drive keeps its previous local copy; photos are only deleted when their row is gone.
//
// Run: npm run content:sync-abl-thumbnails
// Env: VITE_ABL_API_URL, ABL_SYNC_TOKEN (required); ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import {
  normalizeResources, buildSnapshot, serializeSnapshot, validateStructure, planPhotos,
  photoDeletionError, photosFromLegacyManifest, photosFromExport, isSafeId,
} from './lib/abl-snapshot.js'

const API_URL = process.env.VITE_ABL_API_URL
const TOKEN = process.env.ABL_SYNC_TOKEN
const ALLOW_LARGE_CHANGE = process.env.ALLOW_LARGE_CHANGE === 'true'
const REPORT_PATH = process.env.SYNC_REPORT_PATH || path.join(os.tmpdir(), 'abl-sync-report.md')

// Oldest Apps Script that the `export` path accepts. Raise it when the sync starts relying on
// something new in apps-script/abl/Code.gs (its SCRIPT_VERSION constant).
const MIN_SCRIPT_VERSION = 3
const PAT_WARN_DAYS = 21
const SLOW_EXPORT_MS = 120_000

export const SNAPSHOT_PATH = path.resolve('src/data/sheets/abl-resources.json')
const MANIFEST_PATH = path.resolve('src/data/abl-thumbnails-manifest.json')
const ASSETS_DIR = path.resolve('public/assets/images/abl')
const THUMB_WIDTH = 480
const FULL_WIDTH = 1200
const MAX_RAW_BYTES = 25 * 1024 * 1024 // modern phone photos can exceed 8-10MB

// Defense in depth for deletion: never remove anything outside the assets directory we own, even
// if a manifest entry were corrupted or hand-edited.
function isInsideAssetsDir(absPath) {
  const rel = path.relative(ASSETS_DIR, absPath)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

// Never let the real token reach a log line or an Error message: on a public repo the Actions log
// is public. GitHub's own redaction only matches the exact secret bytes, so it is a backstop only.
function redactToken(url) {
  return url.replace(/([?&]token=)[^&]*/, '$1<redacted>')
}

async function fetchJson(url, attempts = 3) {
  const safeUrl = redactToken(url)
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl}`)
      return await res.json()
    } catch (err) {
      if (attempt === attempts) throw new Error(redactToken(String(err.message)))
      const delayMs = attempt * 2000
      console.warn(`  fetch failed (attempt ${attempt}/${attempts}) for ${safeUrl}: ${redactToken(String(err.message))} — retrying in ${delayMs}ms`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback }
}

function apiUrl(params) {
  const qs = new URLSearchParams({ ...params, token: TOKEN })
  return `${API_URL}?${qs}`
}

// ── Report: written to a markdown file the workflow turns into a GitHub Issue / job summary ──
const report = { errors: [], refused: [], problems: [], notes: [] }

async function writeReport(outcome) {
  const lines = [`**Outcome:** ${outcome}`, '']
  if (report.errors.length) {
    lines.push('### The sync failed', '', ...report.errors.map(m => `- ${m}`), '',
      'Nothing was published; the site keeps showing the last good version. See docs/OPERATIONS-RUNBOOK.md for what to do.', '')
  }
  if (report.refused.length) {
    lines.push('### Not published — the update looked unsafe', '',
      ...report.refused.map(m => `- ${m}`), '',
      'The site keeps showing the last good version. Check the Sheet. If the change is intended, go to **Actions → Sync ABL Thumbnails → Run workflow**, tick **allow_large_change**, and run it.', '')
  }
  if (report.problems.length) {
    lines.push(`### Rows that need attention in the Sheet (${report.problems.length})`, '',
      ...report.problems.map(p => `- ${p.tab ? `**${p.tab}** — ` : ''}${p.message}`), '')
  }
  if (report.notes.length) lines.push('### Notes', '', ...report.notes.map(n => `- ${n}`), '')
  const md = lines.join('\n')
  await fs.writeFile(REPORT_PATH, md, 'utf8')
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `## Pramaan sync\n\n${md}\n`)
}

async function setOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return
  await fs.appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''))
}

// ── Fetch data + photo list from whichever Apps Script version is deployed ──
async function fetchSource() {
  const started = Date.now()
  const res = await fetchJson(apiUrl({ action: 'export' }))
  if (!res || res.success !== true) throw new Error(`Apps Script returned an error: ${res?.error ?? 'no response'}`)

  if (res.scriptVersion !== undefined) {
    if (!(res.scriptVersion >= MIN_SCRIPT_VERSION)) {
      throw new Error(`Apps Script is outdated (version ${res.scriptVersion}, need ${MIN_SCRIPT_VERSION}+). Paste apps-script/abl/Code.gs into the Apps Script editor and deploy a new version.`)
    }
    const ms = Date.now() - started
    if (ms > SLOW_EXPORT_MS) report.notes.push(`The Apps Script export took ${Math.round(ms / 1000)} s (alert threshold ${SLOW_EXPORT_MS / 1000} s). It is approaching Google's 6-minute limit as the library grows.`)
    for (const tab of res.excludedTabs ?? []) report.notes.push(`Tab "${tab}" was not published: its header row has no "UNIQUE ID NO FOR …" column.`)
    const exp = res.health?.patExpiresAt
    if (exp) {
      const days = Math.floor((Date.parse(exp) - Date.now()) / 86_400_000)
      if (days <= PAT_WARN_DAYS) report.notes.push(`⚠️ The GitHub token used by the Apps Script expires in ${days} day(s) (${exp}). Renew it: docs/MAINTENANCE-GITHUB-PAT-REFRESH.md.`)
    }
    return { mode: `export v${res.scriptVersion}`, payload: res, photoSource: { kind: 'export', list: res.photos } }
  }

  // Legacy script: `export` fell through to the public listing.
  report.notes.push('The Apps Script is the older version (no fresh export). Data may be up to 15 minutes old. Upgrade: Phase 2 of docs/PRAMAAN-HARDENING-PLAN.md.')
  const manifestRes = await fetchJson(apiUrl({ action: 'manifest' }))
  if (!manifestRes?.success) throw new Error(`Manifest request failed: ${manifestRes?.error ?? 'no response'}`)
  return { mode: 'legacy', payload: res, photoSource: { kind: 'legacy', list: manifestRes.manifest } }
}

async function processPhoto({ id, fileId, modifiedTime }) {
  const imgRes = await fetchJson(apiUrl({ action: 'fetchImage', id }))
  if (!imgRes?.success) throw new Error(imgRes?.error ?? 'no response')
  const raw = Buffer.from(imgRes.base64, 'base64')
  if (raw.length > MAX_RAW_BYTES) throw new Error(`image too large (${raw.length} bytes)`)
  // sharp validates that the bytes really decode as an image (default pixel limits stay on, as a
  // guard against decompression bombs).
  await sharp(raw).metadata()
  const thumbPath = path.join(ASSETS_DIR, `${id}-thumb.webp`)
  const fullPath = path.join(ASSETS_DIR, `${id}-full.webp`)
  await sharp(raw).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbPath)
  await sharp(raw).resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fullPath)
  return {
    fileId,
    modifiedTime: imgRes.modifiedTime || modifiedTime,
    thumb: `assets/images/abl/${id}-thumb.webp`,
    full: `assets/images/abl/${id}-full.webp`,
  }
}

async function main() {
  if (!API_URL) throw new Error('VITE_ABL_API_URL is not set')
  if (!TOKEN) throw new Error('ABL_SYNC_TOKEN is not set')

  console.log('Fetching data from the Apps Script…')
  const { mode, payload, photoSource } = await fetchSource()
  console.log(`  source: ${mode}`)

  const previous = await readJson(SNAPSHOT_PATH, null)
  const localManifest = await readJson(MANIFEST_PATH, {})

  const { tabs, resources, problems } = normalizeResources(payload)
  report.problems.push(...problems)
  const snapshot = buildSnapshot({ tabs, resources }, previous, new Date().toISOString())

  const photos = photoSource.kind === 'export'
    ? photosFromExport(photoSource.list)
    : photosFromLegacyManifest(snapshot, photoSource.list)
  const plan = planPhotos(snapshot, photos, localManifest)
  report.problems.push(...plan.problems)

  const structural = validateStructure(snapshot, previous, problems)
  const deleteErr = photoDeletionError(plan.toDelete.length, Object.keys(localManifest).length)
  if (deleteErr) structural.push(deleteErr)

  console.log(`  ${snapshot.meta.total} resources in ${tabs.length} tabs; ${plan.toFetch.length} photos to fetch, ${plan.toDelete.length} to delete; ${report.problems.length} row problem(s)`)

  if (structural.length) {
    if (!ALLOW_LARGE_CHANGE) {
      report.refused.push(...structural)
      await writeReport('❌ Refused — nothing was published')
      await setOutputs({ changed: false, refused: true, problems: report.problems.length })
      console.error('Refused to publish:\n  - ' + structural.join('\n  - '))
      process.exit(1)
    }
    report.notes.push(`allow_large_change was set, so these safety checks were overridden: ${structural.join(' ')}`)
  }

  await fs.mkdir(ASSETS_DIR, { recursive: true })
  let manifestChanged = false

  for (const { id, fileId } of plan.toBackfill) {
    localManifest[id] = { ...localManifest[id], fileId }
    manifestChanged = true
  }

  for (const item of plan.toFetch) {
    try {
      localManifest[item.id] = await processPhoto(item)
      manifestChanged = true
      console.log(`  synced photo ${item.id}`)
    } catch (err) {
      report.problems.push({ kind: 'photo-failed', id: item.id, message: `${item.id}: photo download failed (${redactToken(String(err.message))}) — kept the previous photo, if any` })
      console.warn(`  failed photo ${item.id}: ${redactToken(String(err.message))}`)
    }
  }

  for (const id of plan.toDelete) {
    const entry = localManifest[id]
    delete localManifest[id]
    manifestChanged = true
    for (const rel of [entry?.thumb, entry?.full]) {
      if (!rel) continue
      const abs = path.resolve('public', rel)
      if (isSafeId(id) && isInsideAssetsDir(abs)) await fs.rm(abs, { force: true })
      else console.warn(`  refused to delete ${JSON.stringify(rel)}: outside ${ASSETS_DIR}`)
    }
    console.log(`  removed photo ${id}`)
  }

  const nextText = serializeSnapshot(snapshot)
  const prevText = await fs.readFile(SNAPSHOT_PATH, 'utf8').catch(() => null)
  const snapshotChanged = nextText !== prevText
  if (snapshotChanged) {
    await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true })
    await fs.writeFile(SNAPSHOT_PATH, nextText, 'utf8')
  }
  if (manifestChanged) {
    const sorted = Object.fromEntries(Object.keys(localManifest).sort().map(k => [k, localManifest[k]]))
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8')
  }

  const changed = snapshotChanged || manifestChanged
  console.log(changed ? `Updated: ${[snapshotChanged && 'data', manifestChanged && 'photos'].filter(Boolean).join(' + ')}` : 'No changes.')
  await writeReport(changed ? '✅ Published changes' : '✅ No changes')
  await setOutputs({ changed, refused: false, problems: report.problems.length })
}

main().catch(async err => {
  const msg = redactToken(String(err?.message ?? err))
  report.errors.push(msg)
  try { await writeReport('❌ Failed'); await setOutputs({ changed: false, refused: false, problems: report.problems.length }) } catch { /* best effort */ }
  console.error(msg)
  process.exit(1)
})
