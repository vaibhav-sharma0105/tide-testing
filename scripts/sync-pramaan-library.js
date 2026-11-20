// Pramaan Library sync (the form-format Sheet): pulls consented resources AND photos from the
// library's Apps Script (apps-script/pramaan-library/Code.gs), validates them, and writes the
// snapshot (src/data/sheets/pramaan-library.json) plus self-hosted WebP photos
// (public/assets/images/pramaan-library/ + src/data/pramaan-library-photos.json). The workflow
// commits them together, so data and photos always publish at once.
//
// Safety rules: scripts/lib/library-snapshot.js (and the shared ones in snapshot-core.js). A
// structural problem publishes NOTHING and fails the run unless ALLOW_LARGE_CHANGE=true. A photo
// Drive can't read keeps its previous copy; photos are deleted only when their row is gone.
// The run's plumbing (env loader, fetch + retry, token redaction, report, outputs, photo
// download/delete loops) is shared with every sync: scripts/lib/sync-runner.js.
//
// Run:  npm run content:sync-pramaan-library
// Env:  PRAMAAN_LIBRARY_API_URL, PRAMAAN_LIBRARY_SYNC_TOKEN (required);
//       ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)
// Locally, put the two required values in .env.development (gitignored) — the script reads it.

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import {
  normalizeLibrary, buildLibrarySnapshot, serializeSnapshot, validateLibrary, planLibraryPhotos,
  photoDeletionError, photosFromExport, isSafeId, photoFileBase,
} from './lib/library-snapshot.js'
import {
  loadLocalEnv, createRedactor, createFetchJson, readJson, createReport, fetchExport, notePatExpiry,
  refuseUnlessAllowed, fetchPhotos, deletePhotos, writeResults, runSync,
} from './lib/sync-runner.js'

// Local runs: read the two values from .env.development if they aren't in the environment.
loadLocalEnv('PRAMAAN_LIBRARY_')

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

const redactToken = createRedactor(TOKEN)
const fetchJson = createFetchJson({ redactToken, timeoutMs: REQUEST_TIMEOUT_MS })
const report = createReport({
  reportPath: REPORT_PATH,
  summaryTitle: 'Pramaan Library sync',
  setupGuide: 'docs/PRAMAAN-LIBRARY-SETUP-GUIDE.md',
  workflowName: 'Sync Pramaan Library',
})

function apiUrl(params) {
  return `${API_URL}?${new URLSearchParams({ ...params, token: TOKEN })}`
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
  const res = await fetchExport({
    fetchJson, url: apiUrl({ action: 'export' }), minScriptVersion: MIN_SCRIPT_VERSION,
    codeGsPath: 'apps-script/pramaan-library/Code.gs', slowExportMs: SLOW_EXPORT_MS, report,
  })
  const s = res.stats ?? {}
  report.notes.push(`Sheet: ${s.rows ?? '?'} filled rows → ${s.published ?? '?'} published; ${s.notConsented ?? '?'} not published because the three consent answers are not all "Yes"; ${s.generatedIds ?? 0} given an automatic ID (no Internal ID).`)
  notePatExpiry(report, res.health, PAT_WARN_DAYS)

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

  await refuseUnlessAllowed({ structural, allowLargeChange: ALLOW_LARGE_CHANGE, report })

  await fs.mkdir(ASSETS_DIR, { recursive: true })
  const fetchedChanged = await fetchPhotos({
    plan, manifest: localManifest, processPhoto, maxPhotos: MAX_PHOTOS_PER_RUN,
    timeBudgetMs: PHOTO_TIME_BUDGET_MS, report, redactToken,
  })
  const deletedChanged = await deletePhotos({ ids: plan.toDelete, manifest: localManifest, assetsDir: ASSETS_DIR, isSafeId })

  await writeResults({
    snapshotPath: SNAPSHOT_PATH, snapshotText: serializeSnapshot(snapshot), manifestPath: MANIFEST_PATH,
    manifest: localManifest, manifestChanged: fetchedChanged || deletedChanged, report,
  })
}

runSync(main, { report, redactToken })
