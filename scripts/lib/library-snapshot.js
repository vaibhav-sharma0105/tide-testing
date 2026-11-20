// Pure rules for the Pramaan Library snapshot (the form-format Sheet, apps-script/pramaan-library/Code.gs).
// No network or filesystem access here — scripts/sync-pramaan-library.js does the I/O, and
// src/test/scripts/librarySnapshot.test.js exercises every rule.
//
// Shared building blocks (safe ids, hashing, photo plan, deletion limits, Drive-link reading, photo
// file names, cell cleaning) come from snapshot-core.js, so every Sheet integration follows the same
// safety rules. Column rules for this Sheet: docs/PRAMAAN-LIBRARY-SHEET-SCHEMA.md.

import {
  THRESHOLDS, isSafeId, isHttpUrl, contentHash, serializeSnapshot, photoFileBase, cleanString,
  asSingleTab, planListPhotos,
} from './snapshot-core.js'

// Re-exported so the sync script and tests import everything for this Sheet from one file.
// extractDriveFileId here is the form-link-aware reader (snapshot-core's extractDriveFileIdAnyLink).
export {
  isSafeId, serializeSnapshot, photoDeletionError, photosFromExport, photoFileBase,
  extractDriveFileIdAnyLink as extractDriveFileId,
} from './snapshot-core.js'

export const SCHEMA_VERSION = 1
export const SECTION = 'pramaan-library'

// The only fields that can reach the public snapshot, in output order. Anything else the Apps
// Script returns is dropped — the Sheet holds contributors' personal details, and a new private
// column must never leak into the public repository even if the script were changed by mistake.
export const RESOURCE_FIELDS = [
  'id', 'name', 'subject', 'type', 'concept', 'language', 'ownership', 'description',
  'photoUrl', 'videoUrl', 'additionalInfo', 'grades', 'chapters',
]
const URL_FIELDS = ['photoUrl', 'videoUrl']
// Alphabetical order ("Foundational" before "Grade 1"); grades are stored in this order.
export const GRADE_KEYS = ['FOUNDATIONAL', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

// Personal-data patterns that must never appear in the published snapshot. A last line of
// defence: the Apps Script never outputs these columns, but if an email address turns up in any
// published field (e.g. typed into a description), the row is still published with that field
// removed and the row is reported.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/

function cleanList(value) {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : []
}

/**
 * Apps Script payload ({resources: [...], problems: [...]}) → clean, allowlisted rows.
 * Row problems never block publishing; they go to the "Sheet needs attention" report.
 * Returns { resources, problems }.
 */
export function normalizeLibrary(payload) {
  const problems = (Array.isArray(payload?.problems) ? payload.problems : [])
    .filter(p => p && typeof p.message === 'string')
    .map(p => ({ kind: String(p.kind ?? 'sheet'), message: p.message }))
  const resources = []
  const seen = new Set()
  const photoNames = new Map() // photo file name → the ID that uses it

  for (const row of Array.isArray(payload?.resources) ? payload.resources : []) {
    const id = cleanString(row?.id)
    const name = cleanString(row?.name)
    if (!id || !name) { problems.push({ kind: 'missing-id', message: `a row without ${id ? 'a name' : 'an ID'} was skipped` }); continue }
    if (!isSafeId(id)) { problems.push({ kind: 'unsafe-id', id, message: `${id}: the ID may only use letters, numbers, spaces, - _ ( ) — skipped` }); continue }
    if (seen.has(id)) { problems.push({ kind: 'duplicate-id', id, message: `${id} is used more than once — later copy skipped` }); continue }
    seen.add(id)

    const out = {}
    for (const field of RESOURCE_FIELDS) {
      if (field === 'grades') { const list = cleanList(row.grades); out.grades = GRADE_KEYS.filter(g => list.includes(g)) }
      else if (field === 'chapters') {
        out.chapters = {}
        for (const g of GRADE_KEYS) if (Array.isArray(row.chapters?.[g])) out.chapters[g] = cleanList(row.chapters[g])
      } else out[field] = cleanString(row[field])
    }
    for (const field of URL_FIELDS) {
      if (out[field] && !isHttpUrl(out[field])) {
        problems.push({ kind: 'bad-url', id, message: `${id}: ${field === 'photoUrl' ? 'photo' : 'video'} link is not a web link — removed` })
        out[field] = null
      }
    }
    for (const field of RESOURCE_FIELDS) {
      if (typeof out[field] === 'string' && EMAIL.test(out[field])) {
        problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in "${field}" — that field was left out` })
        out[field] = null
      }
    }
    // Chapter cells are free text too: drop any chapter entry holding an email address, before the
    // snapshot is written (the deploy-time check would only catch it after it was committed).
    for (const g of Object.keys(out.chapters)) {
      if (out.chapters[g].some(c => EMAIL.test(c))) {
        problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in the chapters for ${g} — that entry was left out` })
        out.chapters[g] = out.chapters[g].filter(c => !EMAIL.test(c))
      }
    }
    if (out.photoUrl) {
      const fileBase = photoFileBase(id)
      const owner = photoNames.get(fileBase)
      if (owner) {
        problems.push({ kind: 'photo-name-clash', id, message: `${id}: its photo would share a file name with ${owner} — photo left out; change one of the two IDs` })
        out.photoUrl = null
      } else photoNames.set(fileBase, id)
    }
    resources.push(out)
  }
  resources.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { resources, problems }
}

// The shared helpers work on the tabbed shape; this Sheet has one list.
const asTabs = resources => asSingleTab('library', resources)

export function buildLibrarySnapshot(resources, previous, nowIso) {
  const hash = contentHash(asTabs(resources))
  const lastUpdated = previous && previous.contentHash === hash && previous.lastUpdated ? previous.lastUpdated : nowIso
  return {
    schemaVersion: SCHEMA_VERSION,
    section: SECTION,
    success: true,
    lastUpdated,
    contentHash: hash,
    resources,
    meta: { total: resources.length },
  }
}

/**
 * Structural checks: any message returned means "publish nothing, keep the last good snapshot".
 * Unlike the old Sheet, an EMPTY library is allowed while nothing has been published yet (rows
 * appear only once their consent answers are "Yes") — but a library that had resources must not
 * suddenly empty or lose more than max(10, 20%) of them.
 */
export function validateLibrary(next, previous, t = THRESHOLDS) {
  const errors = []
  const bytes = Buffer.byteLength(serializeSnapshot(next))
  if (bytes > t.maxSnapshotBytes) errors.push(`The data is ${Math.round(bytes / 1024)} KB, over the ${t.maxSnapshotBytes / 1024 / 1024} MB safety limit.`)
  const prev = Array.isArray(previous?.resources) ? previous.resources : []
  if (prev.length > 0) {
    if (next.resources.length === 0) {
      errors.push(`The Sheet returned no publishable resources, but ${prev.length} are on the website. Was the consent column changed?`)
      return errors
    }
    const nextIds = new Set(next.resources.map(r => r.id))
    const removed = prev.filter(r => !nextIds.has(r.id)).length
    const allowed = Math.max(t.maxRowsRemovedAbs, Math.floor(prev.length * t.maxRowsRemovedRatio))
    if (removed > allowed) errors.push(`${removed} of ${prev.length} resources would disappear (limit ${allowed}).`)
  }
  return errors
}

/** Same photo plan as the old Sheet (keep on Drive errors, delete only when the row/link is gone). */
export function planLibraryPhotos(snapshot, photos, localManifest) {
  // Form-upload links (open?id=…) are normalised to /d/ links first (snapshot-core planListPhotos).
  return planListPhotos('library', snapshot.resources, photos, localManifest)
}
