// Pure rules for the Social Changemakers snapshot (the "Social Changemakers' Fellowship Completion
// Form (Responses)" Sheet, apps-script/social-changemakers/Code.gs). No network or filesystem access
// here — scripts/sync-social-changemakers.js does the I/O, and
// src/test/scripts/socialChangemakersSnapshot.test.js exercises every rule.
// Column rules: docs/SOCIAL-CHANGEMAKERS-SHEET-SCHEMA.md. Page: /education-for-harmony/social-changemakers.

import {
  THRESHOLDS, isSafeId, isHttpUrl, contentHash, serializeSnapshot, photoFileBase,
  cleanStringCollapseSpaces as cleanString, asSingleTab, planListPhotos, stripDisguiseChars,
} from './snapshot-core.js'
import { orderNumber, batchYear } from '../../src/utils/changemakers.js'

export {
  isSafeId, serializeSnapshot, photoDeletionError, photosFromExport, photoFileBase,
} from './snapshot-core.js'

export const SCHEMA_VERSION = 1
export const SECTION = 'social-changemakers'
export const FIELD_SUFFIX = '__field' // photo id of a profile's field-work photo (same as Code.gs)
// Every image kept for a profile: '' = the fellow, then field work and the two video poster frames.
export const IMAGE_SUFFIXES = { photoUrl: '', fieldPhotoUrl: FIELD_SUFFIX, videoPoster: '__video', testimonialPoster: '__testimonial' }
const driveId = (url) => (/\/file\/d\/([A-Za-z0-9_-]{10,})\//.exec(url ?? '') || [])[1] ?? null

// The only fields that can reach the public snapshot, in output order. Anything else the Apps
// Script returns is dropped, so a new private column can never leak into the public repository.
// The photos' Drive links are NOT here: they are used only to download the photos.
export const RESOURCE_FIELDS = ['id', 'batch', 'order', 'name', 'project', 'summary', 'nextSteps', 'videoUrl', 'testimonialUrl', 'writeupUrl']
const TEXT_FIELDS = ['batch', 'name', 'project', 'summary', 'nextSteps']
// A video link is published only in exactly these two shapes (made by Code.gs); the write-up only as a
// Drive viewer link.
const DOC = /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\/preview$/
const VIDEO = /^https:\/\/(?:drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\/preview|www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11})$/
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
// Paragraph breaks in the summary / next steps are kept; other runs of spaces are collapsed.
const cleanText = (v) => (typeof v === 'string'
  ? stripDisguiseChars(v).replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n') || null
  : null)

/**
 * Apps Script payload → { resources (public, allowlisted), photoLinks (id → { photoUrl, fieldPhotoUrl },
 * never published), problems }. Row problems never block publishing; they go to the report.
 * Rows are ordered by id so the snapshot is stable (the page does the display order).
 */
export function normalizeChangemakers(payload) {
  const problems = (Array.isArray(payload?.problems) ? payload.problems : [])
    .filter(p => p && typeof p.message === 'string')
    .map(p => ({ kind: String(p.kind ?? 'sheet'), message: p.message }))
  const resources = []
  const photoLinks = {}
  const seen = new Set()
  const photoNames = new Map()
  const names = new Map()

  for (const row of Array.isArray(payload?.resources) ? payload.resources : []) {
    const id = cleanString(row?.id)
    const name = cleanString(row?.name)
    const batch = cleanString(row?.batch)
    if (!id || !name || !batch) { problems.push({ kind: 'missing-id', message: `a row without ${!id ? 'an ID' : !name ? 'a name' : 'a batch'} was skipped` }); continue }
    if (!isSafeId(id)) { problems.push({ kind: 'unsafe-id', id, message: `${id}: the ID may only use letters, numbers, spaces, - _ ( ) — skipped` }); continue }
    if (seen.has(id)) { problems.push({ kind: 'duplicate-id', id, message: `${id} is used more than once — later copy skipped` }); continue }
    seen.add(id)

    const out = { id }
    for (const f of ['batch', 'name', 'project']) out[f] = cleanString(row[f])
    for (const f of ['summary', 'nextSteps']) out[f] = cleanText(row[f])
    const label = `${id} ("${out.name}", ${out.batch})`

    out.order = orderNumber(row.order)
    if (out.order === null) problems.push({ kind: 'missing-order', id, message: `${label}: "Order to post within batch" ${cleanString(String(row.order ?? '')) ? `"${cleanString(String(row.order))}" is not a whole number` : 'is empty'} — shown last in its batch` })
    if (batchYear(out.batch) === null) problems.push({ kind: 'batch-without-year', id, message: `${label}: the batch "${out.batch}" has no year in it — shown after the dated batches` })
    if (!out.project) problems.push({ kind: 'missing-project', id, message: `${label}: no project name` })

    for (const f of ['videoUrl', 'testimonialUrl']) {
      const v = cleanString(row[f])
      out[f] = v && VIDEO.test(v) ? v : null
      if (v && !out[f]) problems.push({ kind: 'bad-video', id, message: `${label}: the ${f === 'videoUrl' ? 'project' : 'testimonial'} video link has an unexpected shape — left out` })
    }
    {
      const v = cleanString(row.writeupUrl)
      out.writeupUrl = v && DOC.test(v) ? v : null
      if (v && !out.writeupUrl) problems.push({ kind: 'bad-writeup', id, message: `${label}: the write-up link has an unexpected shape — left out` })
    }
    for (const f of TEXT_FIELDS) {
      if (typeof out[f] === 'string' && EMAIL.test(out[f])) {
        problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in "${f}" — that field was left out` })
        out[f] = null
      }
    }
    if (!out.name || !out.batch) continue // name/batch held an email address — nothing sensible left to show

    // Same name twice in one batch is usually a double submission — published, but reported.
    const nameKey = `${batchYear(out.batch) ?? out.batch.toLowerCase()}|${out.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`
    if (names.has(nameKey)) problems.push({ kind: 'possible-duplicate', id, message: `${label}: the same name appears more than once in this batch (also ${names.get(nameKey)}) — check whether one is a double submission` })
    else names.set(nameKey, id)

    const links = {}
    for (const f of ['photoUrl', 'fieldPhotoUrl']) {
      const v = cleanString(row[f])
      if (v && isHttpUrl(v)) links[f] = v
      else if (v) problems.push({ kind: 'bad-url', id, message: `${label}: the ${f === 'photoUrl' ? 'photo' : 'field-work photo'} link is not a web link — left out` })
    }
    const fileBase = photoFileBase(id)
    const owner = photoNames.get(fileBase)
    if (owner && (links.photoUrl || links.fieldPhotoUrl)) {
      problems.push({ kind: 'photo-name-clash', id, message: `${id}: its photos would share a file name with ${owner} — photos left out` })
    } else {
      photoNames.set(fileBase, id)
      if (links.photoUrl || links.fieldPhotoUrl) photoLinks[id] = links
    }
    if (!links.photoUrl && !links.fieldPhotoUrl) problems.push({ kind: 'missing-photo', id, message: `${label}: no photo uploaded — shown with initials` })
    // Poster frames of public Drive videos (YouTube videos get none).
    for (const [f, poster] of [['videoUrl', 'videoPoster'], ['testimonialUrl', 'testimonialPoster']]) {
      const vid = driveId(out[f])
      if (vid && photoLinks[id] !== undefined) photoLinks[id][poster] = `https://drive.google.com/file/d/${vid}/view`
      else if (vid && !owner) photoLinks[id] = { [poster]: `https://drive.google.com/file/d/${vid}/view` }
    }

    resources.push(Object.fromEntries(RESOURCE_FIELDS.map(f => [f, out[f] ?? null])))
  }
  resources.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { resources, photoLinks, problems }
}

const asTabs = resources => asSingleTab(SECTION, resources)

export function buildChangemakersSnapshot(resources, previous, nowIso) {
  const hash = contentHash(asTabs(resources))
  const lastUpdated = previous && previous.contentHash === hash && previous.lastUpdated ? previous.lastUpdated : nowIso
  const batches = new Set(resources.map(r => batchYear(r.batch) ?? r.batch.toLowerCase())).size
  return {
    schemaVersion: SCHEMA_VERSION,
    section: SECTION,
    success: true,
    lastUpdated,
    contentHash: hash,
    resources,
    meta: { total: resources.length, batches },
  }
}

/** Structural checks: any message returned means "publish nothing, keep the last good snapshot". */
export function validateChangemakers(next, previous, t = THRESHOLDS) {
  const errors = []
  const bytes = Buffer.byteLength(serializeSnapshot(next))
  if (bytes > t.maxSnapshotBytes) errors.push(`The data is ${Math.round(bytes / 1024)} KB, over the ${t.maxSnapshotBytes / 1024 / 1024} MB safety limit.`)
  const prev = Array.isArray(previous?.resources) ? previous.resources : []
  if (prev.length === 0) return errors
  if (next.resources.length === 0) {
    errors.push(`The Sheet returned no profiles, but ${prev.length} are on the website. Was a column renamed or the tab emptied?`)
    return errors
  }
  const nextIds = new Set(next.resources.map(r => r.id))
  const removed = prev.filter(r => !nextIds.has(r.id)).length
  const allowed = Math.max(t.maxRowsRemovedAbs, Math.floor(prev.length * t.maxRowsRemovedRatio))
  if (removed > allowed) errors.push(`${removed} of ${prev.length} profiles would disappear (limit ${allowed}).`)
  return errors
}

/**
 * The photo plan for every image of every profile: photo ids "<id>" (the fellow), "<id>__field"
 * (field work), "<id>__video" / "<id>__testimonial" (poster frames of public Drive videos). Same rules as every Sheet: keep on Drive errors, delete only when the
 * row or its link is gone.
 */
export function planChangemakersPhotos(photoLinks, photos, localManifest) {
  const rows = []
  for (const [id, links] of Object.entries(photoLinks)) {
    for (const [field, suffix] of Object.entries(IMAGE_SUFFIXES)) rows.push({ id: id + suffix, photoUrl: links[field] ?? null })
  }
  return planListPhotos(SECTION, rows, photos, localManifest)
}
