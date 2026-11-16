// Pramaan Library sync (the form-format Sheet): pulls consented resources AND photos from the
// library's Apps Script (apps-script/pramaan-library/Code.gs), validates them, and writes the
// snapshot (src/data/sheets/pramaan-library.json) plus self-hosted WebP photos
// (public/assets/images/pramaan-library/ + src/data/pramaan-library-photos.json). The workflow
// commits them together, so data and photos always publish at once.
//
// Safety rules: scripts/lib/library-snapshot.js (and the shared ones in abl-snapshot.js). A
// structural problem publishes NOTHING and fails the run unless ALLOW_LARGE_CHANGE=true. A photo
// Drive can't read keeps its previous copy; photos are deleted only when their row is gone.
//
// Run:  npm run content:sync-pramaan-library
// Env:  PRAMAAN_LIBRARY_API_URL, PRAMAAN_LIBRARY_SYNC_TOKEN (required);
//       ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)
// Locally, put the two required values in .env.development (gitignored) — the script reads it.

import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import {
  normalizeLibrary, buildLibrarySnapshot, serializeSnapshot, validateLibrary, planLibraryPhotos,
  photoDeletionError, photosFromExport, isSafeId, photoFileBase,
} from './lib/library-snapshot.js'

// Local runs: read the two values from .env.development if they aren't in the environment.
function loadLocalEnv() {
  try {
    for (const line of readFileSync('.env.development', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(PRAMAAN_LIBRARY_[A-Z_]+)\s*=\s*(.*?)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no local file: CI passes the values as secrets */ }
}
loadLocalEnv()

const API_URL = process.env.PRAMAAN_LIBRARY_API_URL
const TOKEN = process.env.PRAMAAN_LIBRARY_SYNC_TOKEN
const ALLOW_LARGE_CHANGE = process.env.ALLOW_LARGE_CHANGE === 'true'
const REPORT_PATH = process.env.SYNC_REPORT_PATH || path.join(os.tmpdir(), 'pramaan-library-sync-report.md')

const MIN_SCRIPT_VERSION = 1
const PAT_WARN_DAYS = 21
const SLOW_EXPORT_MS = 120_000

const SNAPSHOT_PATH = path.resolve('src/data/sheets/pramaan-library.json')
const MANIFEST_PATH = path.resolve('src/data/pramaan-library-photos.json')
const ASSETS_DIR = path.resolve('public/assets/images/pramaan-library')
const ASSETS_URL = 'assets/images/pramaan-library'
const THUMB_WIDTH = 480
const FULL_WIDTH = 1200
const MAX_RAW_BYTES = 25 * 1024 * 1024
// Keep every run well inside the workflow's 30-minute limit, so a big batch of new photos (or one
// stuck request) can never stop the run from committing what it has done. Photos left over are
// fetched by the next run (every 6 hours, or the next Sheet change); the report says how many.
const REQUEST_TIMEOUT_MS = 60_000
const MAX_PHOTOS_PER_RUN = Number(process.env.MAX_PHOTOS_PER_RUN) || 100
const PHOTO_TIME_BUDGET_MS = 20 * 60_000

function isInsideAssetsDir(absPath) {
  const rel = path.relative(ASSETS_DIR, absPath)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

// The Actions log of a public repository is public: the token must never reach a log line.
function redactToken(text) {
  let out = String(text).replace(/([?&]token=)[^&\s]*/g, '$1<redacted>')
  if (TOKEN) out = out.split(TOKEN).join('<redacted>')
  return out
}

async function fetchJson(url, attempts = 3) {
  const safeUrl = redactToken(url)
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl}`)
      return await res.json()
    } catch (err) {
      if (attempt === attempts) throw new Error(redactToken(err.message))
      const delayMs = attempt * 2000
      console.warn(`  fetch failed (attempt ${attempt}/${attempts}): ${redactToken(err.message)} — retrying in ${delayMs}ms`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback }
}

function apiUrl(params) {
  return `${API_URL}?${new URLSearchParams({ ...params, token: TOKEN })}`
}

const report = { errors: [], refused: [], problems: [], notes: [] }

async function writeReport(outcome) {
  const lines = [`**Outcome:** ${outcome}`, '']
  if (report.errors.length) {
    lines.push('### The sync failed', '', ...report.errors.map(m => `- ${m}`), '',
      'Nothing was published; the page keeps showing the last good version. See docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md → Troubleshooting.', '')
  }
  if (report.refused.length) {
    lines.push('### Not published — the update looked unsafe', '', ...report.refused.map(m => `- ${m}`), '',
      'The page keeps showing the last good version. Check the Sheet. If the change is intended, go to **Actions → Sync Pramaan Library → Run workflow**, tick **allow_large_change**, and run it.', '')
  }
  if (report.problems.length) {
    lines.push(`### Rows that need attention in the Sheet (${report.problems.length})`, '', ...report.problems.map(p => `- ${p.message}`), '')
  }
  if (report.notes.length) lines.push('### Notes', '', ...report.notes.map(n => `- ${n}`), '')
  const md = lines.join('\n')
  await fs.writeFile(REPORT_PATH, md, 'utf8')
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `## Pramaan Library sync\n\n${md}\n`)
}

async function setOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return
  await fs.appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''))
}

async function processPhoto({ id, fileId, modifiedTime }) {
  const imgRes = await fetchJson(apiUrl({ action: 'fetchImage', id }))
  if (!imgRes?.success) throw new Error(imgRes?.error ?? 'no response')
  const raw = Buffer.from(imgRes.base64, 'base64')
  if (raw.length > MAX_RAW_BYTES) throw new Error(`image too large (${raw.length} bytes)`)
  await sharp(raw).metadata() // real decode check; sharp's default pixel limits stay on
  // Ids may contain spaces/brackets (allowed by isSafeId); file names use a URL-safe form.
  const fileBase = photoFileBase(id)
  await sharp(raw).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(ASSETS_DIR, `${fileBase}-thumb.webp`))
  await sharp(raw).resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(ASSETS_DIR, `${fileBase}-full.webp`))
  return {
    fileId,
    modifiedTime: imgRes.modifiedTime || modifiedTime,
    thumb: `${ASSETS_URL}/${fileBase}-thumb.webp`,
    full: `${ASSETS_URL}/${fileBase}-full.webp`,
  }
}

async function main() {
  if (!API_URL) throw new Error('PRAMAAN_LIBRARY_API_URL is not set')
  if (!TOKEN) throw new Error('PRAMAAN_LIBRARY_SYNC_TOKEN is not set')

  console.log('Fetching the library from the Apps Script…')
  const started = Date.now()
  const res = await fetchJson(apiUrl({ action: 'export' }))
  if (!res || res.success !== true) throw new Error(`Apps Script returned an error: ${res?.error ?? 'no response'}`)
  if (!(res.scriptVersion >= MIN_SCRIPT_VERSION)) throw new Error(`Apps Script version ${res.scriptVersion} is too old (need ${MIN_SCRIPT_VERSION}+). Paste apps-script/pramaan-library/Code.gs and deploy a new version.`)
  const ms = Date.now() - started
  if (ms > SLOW_EXPORT_MS) report.notes.push(`The Apps Script export took ${Math.round(ms / 1000)} s; Google stops scripts at 6 minutes.`)
  const s = res.stats ?? {}
  report.notes.push(`Sheet: ${s.rows ?? '?'} filled rows → ${s.published ?? '?'} published; ${s.notConsented ?? '?'} not published because the three consent answers are not all "Yes"; ${s.generatedIds ?? 0} given an automatic ID (no Internal ID).`)
  const exp = res.health?.patExpiresAt
  if (exp) {
    const days = Math.floor((Date.parse(exp) - Date.now()) / 86_400_000)
    if (days <= PAT_WARN_DAYS) report.notes.push(`⚠️ The GitHub token used by the Apps Script expires in ${days} day(s) (${exp}). Renew it: docs/MAINTENANCE-GITHUB-PAT-REFRESH.md.`)
  }

  const previous = await readJson(SNAPSHOT_PATH, null)
  const localManifest = await readJson(MANIFEST_PATH, {})

  const { resources, problems } = normalizeLibrary(res)
  report.problems.push(...problems)
  const snapshot = buildLibrarySnapshot(resources, previous, new Date().toISOString())

  const plan = planLibraryPhotos(snapshot, photosFromExport(res.photos), localManifest)
  report.problems.push(...plan.problems)

  const structural = validateLibrary(snapshot, previous)
  const deleteErr = photoDeletionError(plan.toDelete.length, Object.keys(localManifest).length)
  if (deleteErr) structural.push(deleteErr)

  console.log(`  ${snapshot.meta.total} resources; ${plan.toFetch.length} photos to fetch, ${plan.toDelete.length} to delete; ${report.problems.length} row problem(s)`)

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

  const photoStart = Date.now()
  let fetched = 0
  for (const [i, item] of plan.toFetch.entries()) {
    if (fetched >= MAX_PHOTOS_PER_RUN || Date.now() - photoStart > PHOTO_TIME_BUDGET_MS) {
      const left = plan.toFetch.length - i
      report.notes.push(`${left} photo(s) still to download — the next run continues (each run fetches at most ${MAX_PHOTOS_PER_RUN} photos in about 20 minutes). Until then those resources show a placeholder.`)
      console.log(`  stopping photo downloads for this run; ${left} left for the next run`)
      break
    }
    fetched++
    try {
      localManifest[item.id] = await processPhoto(item)
      manifestChanged = true
      console.log(`  synced photo ${item.id}`)
    } catch (err) {
      report.problems.push({ kind: 'photo-failed', id: item.id, message: `${item.id}: photo download failed (${redactToken(err.message)}) — kept the previous photo, if any` })
      console.warn(`  failed photo ${item.id}: ${redactToken(err.message)}`)
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
  const msg = redactToken(err?.message ?? err)
  report.errors.push(msg)
  try { await writeReport('❌ Failed'); await setOutputs({ changed: false, refused: false, problems: report.problems.length }) } catch { /* best effort */ }
  console.error(msg)
  process.exit(1)
})
