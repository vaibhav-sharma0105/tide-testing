// Partners sync (the "TIDE/THRIvE Partners (Responses)" Sheet): pulls publishable rows AND logos
// from its Apps Script (apps-script/partners/Code.gs), validates them, and writes the snapshot
// (src/data/sheets/partners.json) plus self-hosted WebP logos (public/assets/images/partners/ +
// src/data/partners-photos.json). The workflow commits them together, so data and logos always
// publish at once.
//
// Safety rules: scripts/lib/partners-snapshot.js (and the shared ones in snapshot-core.js). A
// structural problem publishes NOTHING and fails the run unless ALLOW_LARGE_CHANGE=true. A logo
// Drive can't read keeps its previous copy; logos are deleted only when their row is gone.
// The run's plumbing (env loader, fetch + retry, token redaction, report, outputs, photo
// download/delete loops) is shared with every sync: scripts/lib/sync-runner.js.
//
// Run:  npm run content:sync-partners
// Env:  PARTNERS_API_URL, PARTNERS_SYNC_TOKEN (required);
//       ALLOW_LARGE_CHANGE, SYNC_REPORT_PATH (optional)
// Locally, put the two required values in .env.development (gitignored) — the script reads it.

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { renderPartnerLogo } from './lib/partners-images.js'
import {
  normalizePartners, buildPartnersSnapshot, serializeSnapshot, validatePartners, planPartnersPhotos,
  photoDeletionError, photosFromExport, isSafeId, photoFileBase, markSharedLogos,
} from './lib/partners-snapshot.js'
import {
  loadLocalEnv, createRedactor, createFetchJson, readJson, createReport, fetchExport, notePatExpiry,
  refuseUnlessAllowed, fetchPhotos, deletePhotos, writeResults, runSync,
} from './lib/sync-runner.js'

// Local runs: read the two values from .env.development if they aren't in the environment.
loadLocalEnv('PARTNERS_')

const API_URL = process.env.PARTNERS_API_URL
const TOKEN = process.env.PARTNERS_SYNC_TOKEN
const ALLOW_LARGE_CHANGE = process.env.ALLOW_LARGE_CHANGE === 'true'
const REPORT_PATH = process.env.SYNC_REPORT_PATH || path.join(os.tmpdir(), 'partners-sync-report.md')

const MIN_SCRIPT_VERSION = 1
const PAT_WARN_DAYS = 21
const SLOW_EXPORT_MS = 120_000

const SNAPSHOT_PATH = path.resolve('src/data/sheets/partners.json')
const MANIFEST_PATH = path.resolve('src/data/partners-photos.json')
const ASSETS_DIR = path.resolve('public/assets/images/partners')
const ASSETS_URL = 'assets/images/partners'
const MAX_RAW_BYTES = 25 * 1024 * 1024
// Keep every run well inside the workflow's 30-minute limit, so a big batch of new logos (or one
// stuck request) can never stop the run from committing what it has done. Logos left over are
// fetched by the next run (every 6 hours, or the next Sheet change); the report says how many.
const REQUEST_TIMEOUT_MS = 60_000
const MAX_PHOTOS_PER_RUN = Number(process.env.MAX_PHOTOS_PER_RUN) || 100
const PHOTO_TIME_BUDGET_MS = 20 * 60_000

const redactToken = createRedactor(TOKEN)
const fetchJson = createFetchJson({ redactToken, timeoutMs: REQUEST_TIMEOUT_MS })
const report = createReport({
  reportPath: REPORT_PATH,
  summaryTitle: 'Partners sync',
  setupGuide: 'docs/PARTNERS-SETUP-GUIDE.md',
  workflowName: 'Sync Partners',
})

function apiUrl(params) {
  return `${API_URL}?${new URLSearchParams({ ...params, token: TOKEN })}`
}

// Fingerprint of a rendered logo, so the same picture uploaded for many partners can be spotted.
const logoHash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16)

/** Entries written before fingerprints existed get one from the file on disk (skipped if unreadable). */
async function backfillHashes(manifest) {
  let changed = false
  for (const [id, entry] of Object.entries(manifest)) {
    if (entry?.hash || !entry?.thumb || !isSafeId(id)) continue
    try {
      entry.hash = logoHash(await fs.readFile(path.join(ASSETS_DIR, `${photoFileBase(id)}-logo.webp`)))
      changed = true
    } catch { /* file missing — the photo plan fetches it again */ }
  }
  return changed
}

async function processPhoto({ id, fileId, modifiedTime }) {
  const imgRes = await fetchJson(apiUrl({ action: 'fetchImage', id }))
  if (!imgRes?.success) throw new Error(imgRes?.error ?? 'no response')
  const raw = Buffer.from(imgRes.base64, 'base64')
  if (raw.length > MAX_RAW_BYTES) throw new Error(`image too large (${raw.length} bytes)`)
  // Margins trimmed, transparency kept, never cropped (partners-images.js).
  const logo = await renderPartnerLogo(raw)
  // Ids may contain spaces/brackets (allowed by isSafeId); file names use a URL-safe form.
  const fileBase = photoFileBase(id)
  await fs.writeFile(path.join(ASSETS_DIR, `${fileBase}-logo.webp`), logo)
  const m = await sharp(logo).metadata()
  return {
    fileId,
    modifiedTime: imgRes.modifiedTime || modifiedTime,
    // Pixel size, so the page can reserve the right space (no layout shift).
    thumbWidth: m.width, thumbHeight: m.height,
    thumb: `${ASSETS_URL}/${fileBase}-logo.webp`,
    hash: logoHash(logo),
  }
}

async function main() {
  if (!API_URL) throw new Error('PARTNERS_API_URL is not set')
  if (!TOKEN) throw new Error('PARTNERS_SYNC_TOKEN is not set')

  console.log('Fetching the partners from the Apps Script…')
  const res = await fetchExport({
    fetchJson, url: apiUrl({ action: 'export' }), minScriptVersion: MIN_SCRIPT_VERSION,
    codeGsPath: 'apps-script/partners/Code.gs', slowExportMs: SLOW_EXPORT_MS, report,
  })
  const s = res.stats ?? {}
  report.notes.push(`Sheet: ${s.rows ?? '?'} filled rows → ${s.published ?? '?'} published (${s.noLogo ?? '?'} without a logo link); not published: ${s.noType ?? '?'} without a type, ${s.noName ?? '?'} without a name, ${s.hidden ?? '?'} marked "Hide from website"; ${s.idFromContent ?? 0} typed in without a Timestamp (id made from type + name).`)
  notePatExpiry(report, res.health, PAT_WARN_DAYS)

  const previous = await readJson(SNAPSHOT_PATH, null)
  const localManifest = await readJson(MANIFEST_PATH, {})

  const { resources, problems } = normalizePartners(res)
  report.problems.push(...problems)
  const snapshot = buildPartnersSnapshot(resources, previous, new Date().toISOString())

  const plan = planPartnersPhotos(snapshot, photosFromExport(res.photos), localManifest)
  report.problems.push(...plan.problems)

  const structural = validatePartners(snapshot, previous)
  const deleteErr = photoDeletionError(plan.toDelete.length, Object.keys(localManifest).length)
  if (deleteErr) structural.push(deleteErr)

  console.log(`  ${snapshot.meta.total} partners; ${plan.toFetch.length} logos to fetch, ${plan.toDelete.length} to delete; ${report.problems.length} row problem(s)`)

  await refuseUnlessAllowed({ structural, allowLargeChange: ALLOW_LARGE_CHANGE, report })

  await fs.mkdir(ASSETS_DIR, { recursive: true })
  const fetchedChanged = await fetchPhotos({
    plan, manifest: localManifest, processPhoto,
    maxPhotos: MAX_PHOTOS_PER_RUN, timeBudgetMs: PHOTO_TIME_BUDGET_MS, report, redactToken,
  })
  const deletedChanged = await deletePhotos({ ids: plan.toDelete, manifest: localManifest, assetsDir: ASSETS_DIR, isSafeId })

  // One picture used for many partners (e.g. "No Logo Available") → initials on the page + reported.
  const hashesChanged = await backfillHashes(localManifest)
  const shared = markSharedLogos(localManifest, new Map(snapshot.resources.map(r => [r.id, r.name])))
  report.problems.push(...shared.problems)

  await writeResults({
    snapshotPath: SNAPSHOT_PATH, snapshotText: serializeSnapshot(snapshot), manifestPath: MANIFEST_PATH,
    manifest: localManifest, manifestChanged: fetchedChanged || deletedChanged || hashesChanged || shared.changed, report,
  })
}

runSync(main, { report, redactToken })
