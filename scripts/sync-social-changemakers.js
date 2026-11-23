// Social Changemakers sync (the "Social Changemakers' Fellowship Completion Form (Responses)" Sheet):
// pulls publishable rows AND photos from its Apps Script (apps-script/social-changemakers/Code.gs),
// validates them, and writes the snapshot (src/data/sheets/social-changemakers.json) plus
// self-hosted WebP photos (public/assets/images/social-changemakers/ +
// src/data/social-changemakers-photos.json). The workflow commits them together.
//
// Each profile has up to two photos: "<id>" (the fellow) and "<id>__field" (field work).
// Safety rules: scripts/lib/social-changemakers-snapshot.js (and the shared ones in snapshot-core.js).
// A structural problem publishes NOTHING and fails the run unless ALLOW_LARGE_CHANGE=true. A photo
// Drive can't read keeps its previous copy; photos are deleted only when their row or link is gone.
// The run's plumbing is shared with every sync: scripts/lib/sync-runner.js.
//
// Run:  npm run content:sync-social-changemakers
// Env:  SOCIAL_CHANGEMAKERS_API_URL, SOCIAL_CHANGEMAKERS_SYNC_TOKEN (required);
//       ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)
// Locally, put the two required values in .env.development (gitignored) — the script reads it.

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { renderFellowPhoto } from './lib/social-changemakers-images.js'
import {
  normalizeChangemakers, buildChangemakersSnapshot, serializeSnapshot, validateChangemakers,
  planChangemakersPhotos, photoDeletionError, photosFromExport, isSafeId, photoFileBase,
} from './lib/social-changemakers-snapshot.js'
import {
  loadLocalEnv, createRedactor, createFetchJson, readJson, createReport, fetchExport, notePatExpiry,
  refuseUnlessAllowed, fetchPhotos, deletePhotos, writeResults, runSync,
} from './lib/sync-runner.js'

loadLocalEnv('SOCIAL_CHANGEMAKERS_')

const API_URL = process.env.SOCIAL_CHANGEMAKERS_API_URL
const TOKEN = process.env.SOCIAL_CHANGEMAKERS_SYNC_TOKEN
const ALLOW_LARGE_CHANGE = process.env.ALLOW_LARGE_CHANGE === 'true'
const REPORT_PATH = process.env.SYNC_REPORT_PATH || path.join(os.tmpdir(), 'social-changemakers-sync-report.md')

const MIN_SCRIPT_VERSION = 1
const PAT_WARN_DAYS = 21
const SLOW_EXPORT_MS = 120_000

const SNAPSHOT_PATH = path.resolve('src/data/sheets/social-changemakers.json')
const MANIFEST_PATH = path.resolve('src/data/social-changemakers-photos.json')
const ASSETS_DIR = path.resolve('public/assets/images/social-changemakers')
const ASSETS_URL = 'assets/images/social-changemakers'
const MAX_RAW_BYTES = 25 * 1024 * 1024
// Keep every run well inside the workflow's 30-minute limit; photos left over are fetched next run.
const REQUEST_TIMEOUT_MS = 60_000
const MAX_PHOTOS_PER_RUN = Number(process.env.MAX_PHOTOS_PER_RUN) || 100
const PHOTO_TIME_BUDGET_MS = 20 * 60_000

const redactToken = createRedactor(TOKEN)
const fetchJson = createFetchJson({ redactToken, timeoutMs: REQUEST_TIMEOUT_MS })
const report = createReport({
  reportPath: REPORT_PATH,
  summaryTitle: 'Social Changemakers sync',
  setupGuide: 'docs/SOCIAL-CHANGEMAKERS-SETUP-GUIDE.md',
  workflowName: 'Sync Social Changemakers',
})

function apiUrl(params) {
  return `${API_URL}?${new URLSearchParams({ ...params, token: TOKEN })}`
}

async function processPhoto({ id, fileId, modifiedTime }) {
  const imgRes = await fetchJson(apiUrl({ action: 'fetchImage', id }))
  if (!imgRes?.success) throw new Error(imgRes?.error ?? 'no response')
  const raw = Buffer.from(imgRes.base64, 'base64')
  if (raw.length > MAX_RAW_BYTES) throw new Error(`image too large (${raw.length} bytes)`)
  const photo = await renderFellowPhoto(raw)
  const fileBase = photoFileBase(id)
  await fs.writeFile(path.join(ASSETS_DIR, `${fileBase}.webp`), photo.buffer)
  return {
    fileId,
    modifiedTime: imgRes.modifiedTime || modifiedTime,
    // Pixel size, so the page can reserve the right space (no layout shift).
    width: photo.width, height: photo.height,
    thumb: `${ASSETS_URL}/${fileBase}.webp`,
  }
}

async function main() {
  if (!API_URL) throw new Error('SOCIAL_CHANGEMAKERS_API_URL is not set')
  if (!TOKEN) throw new Error('SOCIAL_CHANGEMAKERS_SYNC_TOKEN is not set')

  console.log('Fetching the profiles from the Apps Script…')
  const res = await fetchExport({
    fetchJson, url: apiUrl({ action: 'export' }), minScriptVersion: MIN_SCRIPT_VERSION,
    codeGsPath: 'apps-script/social-changemakers/Code.gs', slowExportMs: SLOW_EXPORT_MS, report,
  })
  const s = res.stats ?? {}
  report.notes.push(`Sheet: ${s.rows ?? '?'} filled rows → ${s.published ?? '?'} published (${s.noPhoto ?? '?'} without any photo, ${s.videos ?? 0} with a public video); not published: ${s.noName ?? '?'} without a name, ${s.noBatch ?? '?'} without a batch, ${s.hidden ?? '?'} marked "Hide from website"; ${s.idFromContent ?? 0} typed in without a Timestamp (id made from batch + name).`)
  notePatExpiry(report, res.health, PAT_WARN_DAYS)

  const previous = await readJson(SNAPSHOT_PATH, null)
  const localManifest = await readJson(MANIFEST_PATH, {})

  const { resources, photoLinks, problems } = normalizeChangemakers(res)
  report.problems.push(...problems)
  const snapshot = buildChangemakersSnapshot(resources, previous, new Date().toISOString())

  const plan = planChangemakersPhotos(photoLinks, photosFromExport(res.photos), localManifest)
  report.problems.push(...plan.problems)

  const structural = validateChangemakers(snapshot, previous)
  const deleteErr = photoDeletionError(plan.toDelete.length, Object.keys(localManifest).length)
  if (deleteErr) structural.push(deleteErr)

  console.log(`  ${snapshot.meta.total} profiles; ${plan.toFetch.length} photos to fetch, ${plan.toDelete.length} to delete; ${report.problems.length} row problem(s)`)

  await refuseUnlessAllowed({ structural, allowLargeChange: ALLOW_LARGE_CHANGE, report })

  await fs.mkdir(ASSETS_DIR, { recursive: true })
  const fetchedChanged = await fetchPhotos({
    plan, manifest: localManifest, processPhoto,
    maxPhotos: MAX_PHOTOS_PER_RUN, timeBudgetMs: PHOTO_TIME_BUDGET_MS, report, redactToken,
  })
  const deletedChanged = await deletePhotos({ ids: plan.toDelete, manifest: localManifest, assetsDir: ASSETS_DIR, isSafeId })

  await writeResults({
    snapshotPath: SNAPSHOT_PATH, snapshotText: serializeSnapshot(snapshot), manifestPath: MANIFEST_PATH,
    manifest: localManifest, manifestChanged: fetchedChanged || deletedChanged, report,
  })
}

runSync(main, { report, redactToken })
