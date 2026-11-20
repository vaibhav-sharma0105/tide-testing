// Publications sync (the "TIDE THRIvE Publications (Responses)" Sheet): pulls publishable rows AND
// thumbnails from its Apps Script (apps-script/publications/Code.gs), validates them, and writes the
// snapshot (src/data/sheets/publications.json) plus self-hosted WebP photos
// (public/assets/images/publications/ + src/data/publications-photos.json). The workflow
// commits them together, so data and photos always publish at once.
//
// Safety rules: scripts/lib/publications-snapshot.js (and the shared ones in snapshot-core.js). A
// structural problem publishes NOTHING and fails the run unless ALLOW_LARGE_CHANGE=true. A photo
// Drive can't read keeps its previous copy; photos are deleted only when their row is gone.
// The run's plumbing (env loader, fetch + retry, token redaction, report, outputs, photo
// download/delete loops) is shared with every sync: scripts/lib/sync-runner.js.
//
// Run:  npm run content:sync-publications
// Env:  PUBLICATIONS_API_URL, PUBLICATIONS_SYNC_TOKEN (required);
//       ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)
// Locally, put the two required values in .env.development (gitignored) — the script reads it.

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import { renderPublicationImages } from './lib/publications-images.js'
import {
  normalizePublications, buildPublicationsSnapshot, serializeSnapshot, validatePublications, planPublicationsPhotos,
  photoDeletionError, photosFromExport, isSafeId, photoFileBase,
} from './lib/publications-snapshot.js'
import {
  loadLocalEnv, createRedactor, createFetchJson, readJson, createReport, fetchExport, notePatExpiry,
  refuseUnlessAllowed, fetchPhotos, deletePhotos, writeResults, runSync,
} from './lib/sync-runner.js'

// Local runs: read the two values from .env.development if they aren't in the environment.
loadLocalEnv('PUBLICATIONS_')

const API_URL = process.env.PUBLICATIONS_API_URL
const TOKEN = process.env.PUBLICATIONS_SYNC_TOKEN
const ALLOW_LARGE_CHANGE = process.env.ALLOW_LARGE_CHANGE === 'true'
const REPORT_PATH = process.env.SYNC_REPORT_PATH || path.join(os.tmpdir(), 'publications-sync-report.md')

const MIN_SCRIPT_VERSION = 1
const PAT_WARN_DAYS = 21
const SLOW_EXPORT_MS = 120_000

const SNAPSHOT_PATH = path.resolve('src/data/sheets/publications.json')
const MANIFEST_PATH = path.resolve('src/data/publications-photos.json')
const ASSETS_DIR = path.resolve('public/assets/images/publications')
const ASSETS_URL = 'assets/images/publications'
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
  summaryTitle: 'Publications sync',
  setupGuide: 'docs/PUBLICATIONS-SETUP-GUIDE.md',
  workflowName: 'Sync Publications',
})

function apiUrl(params) {
  return `${API_URL}?${new URLSearchParams({ ...params, token: TOKEN })}`
}

async function processPhoto({ id, fileId, modifiedTime }, org) {
  const imgRes = await fetchJson(apiUrl({ action: 'fetchImage', id }))
  if (!imgRes?.success) throw new Error(imgRes?.error ?? 'no response')
  const raw = Buffer.from(imgRes.base64, 'base64')
  if (raw.length > MAX_RAW_BYTES) throw new Error(`image too large (${raw.length} bytes)`)
  // Trim borders; TIDE covers kept whole; THRIvE thumbnails keep their shape within 3:4…16:9 (publications-images.js).
  const { thumb, full } = await renderPublicationImages(raw, org)
  // Ids may contain spaces/brackets (allowed by isSafeId); file names use a URL-safe form.
  const fileBase = photoFileBase(id)
  await fs.writeFile(path.join(ASSETS_DIR, `${fileBase}-thumb.webp`), thumb)
  await fs.writeFile(path.join(ASSETS_DIR, `${fileBase}-full.webp`), full)
  const t = await sharp(thumb).metadata()
  const fm = await sharp(full).metadata()
  return {
    fileId,
    modifiedTime: imgRes.modifiedTime || modifiedTime,
    // Pixel sizes, so the page can reserve the right space (no layout shift) and pick a frame.
    thumbWidth: t.width, thumbHeight: t.height, fullWidth: fm.width, fullHeight: fm.height,
    thumb: `${ASSETS_URL}/${fileBase}-thumb.webp`,
    full: `${ASSETS_URL}/${fileBase}-full.webp`,
  }
}

async function main() {
  if (!API_URL) throw new Error('PUBLICATIONS_API_URL is not set')
  if (!TOKEN) throw new Error('PUBLICATIONS_SYNC_TOKEN is not set')

  console.log('Fetching the publications from the Apps Script…')
  const res = await fetchExport({
    fetchJson, url: apiUrl({ action: 'export' }), minScriptVersion: MIN_SCRIPT_VERSION,
    codeGsPath: 'apps-script/publications/Code.gs', slowExportMs: SLOW_EXPORT_MS, report,
  })
  const s = res.stats ?? {}
  report.notes.push(`Sheet: ${s.rows ?? '?'} filled rows → ${s.published ?? '?'} published (${s.tide ?? '?'} TIDE, ${s.thrive ?? '?'} THRIvE); not published: ${s.noOrg ?? '?'} without TIDE/THRIvE, ${s.noTitle ?? '?'} without a title, ${s.hidden ?? '?'} marked "Hide from website"; ${s.idFromContent ?? 0} typed in without a Timestamp (id made from title + date).`)
  notePatExpiry(report, res.health, PAT_WARN_DAYS)

  const previous = await readJson(SNAPSHOT_PATH, null)
  const localManifest = await readJson(MANIFEST_PATH, {})

  const { resources, problems } = normalizePublications(res)
  report.problems.push(...problems)
  const snapshot = buildPublicationsSnapshot(resources, previous, new Date().toISOString())

  const plan = planPublicationsPhotos(snapshot, photosFromExport(res.photos), localManifest)
  report.problems.push(...plan.problems)

  const structural = validatePublications(snapshot, previous)
  const deleteErr = photoDeletionError(plan.toDelete.length, Object.keys(localManifest).length)
  if (deleteErr) structural.push(deleteErr)

  console.log(`  ${snapshot.meta.total} publications (${snapshot.meta.counts.TIDE} TIDE, ${snapshot.meta.counts.THRIvE} THRIvE); ${plan.toFetch.length} photos to fetch, ${plan.toDelete.length} to delete; ${report.problems.length} row problem(s)`)

  await refuseUnlessAllowed({ structural, allowLargeChange: ALLOW_LARGE_CHANGE, report })

  await fs.mkdir(ASSETS_DIR, { recursive: true })
  const orgById = new Map(snapshot.resources.map(r => [r.id, r.org]))
  const fetchedChanged = await fetchPhotos({
    plan, manifest: localManifest, processPhoto: item => processPhoto(item, orgById.get(item.id)),
    maxPhotos: MAX_PHOTOS_PER_RUN, timeBudgetMs: PHOTO_TIME_BUDGET_MS, report, redactToken,
  })
  const deletedChanged = await deletePhotos({ ids: plan.toDelete, manifest: localManifest, assetsDir: ASSETS_DIR, isSafeId })

  await writeResults({
    snapshotPath: SNAPSHOT_PATH, snapshotText: serializeSnapshot(snapshot), manifestPath: MANIFEST_PATH,
    manifest: localManifest, manifestChanged: fetchedChanged || deletedChanged, report,
  })
}

runSync(main, { report, redactToken })
