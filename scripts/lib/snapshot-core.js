// Shared, pure building blocks for every Sheet snapshot sync (today: the Pramaan Library,
// scripts/lib/library-snapshot.js, and Publications, scripts/lib/publications-snapshot.js). No
// network or filesystem access (the shared I/O is scripts/lib/sync-runner.js). Moved unchanged from the former
// Pramaan sync's rules file (scripts/lib/abl-snapshot.js, archived in git tag archive/pramaan-live-read)
// so hashes, photo plans and limits stay byte-for-byte the same.
//
// Changing a threshold here changes what a sync will publish — update docs/SHEET-INTEGRATION-PLAYBOOK.md
// and the tests together.

import { createHash } from 'node:crypto'

// Breaching any of these refuses the whole publish (last good snapshot is kept) unless the run was
// started with allow_large_change.
export const THRESHOLDS = {
  maxRowsRemovedAbs: 10,        // removing up to this many rows is always allowed…
  maxRowsRemovedRatio: 0.2,     // …beyond that, at most 20% of the previous rows
  maxPhotoDeletesAbs: 10,
  maxPhotoDeletesRatio: 0.2,
  maxSnapshotBytes: 2 * 1024 * 1024,
}

// Ids become file names, so only these characters are allowed.
const SAFE_ID = /^[A-Za-z0-9 _()-]+$/
export function isSafeId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100 && SAFE_ID.test(id)
}

// Two Drive-link readers — keep them apart:
//  - extractDriveFileId: `…/d/<id>/…` links only, any id length. planPhotos reads the (normalised)
//    photoUrl with it; changing it changes every photo plan.
//  - extractDriveFileIdAnyLink: also Google Form upload links (`…?id=<id>`), ids of 10+ characters.
//    Use it on links typed into a Sheet. Each Sheet's rules file re-exports it under the name
//    `extractDriveFileId` (library-snapshot.js, publications-snapshot.js).
export function extractDriveFileId(url) {
  if (typeof url !== 'string') return null
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

/** Drive file id from either link style: …/file/d/<id>/… or …?id=<id> (Google Form uploads). */
export function extractDriveFileIdAnyLink(url) {
  if (typeof url !== 'string') return null
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  return m ? m[1] : null
}

/**
 * The photo file name for an ID. IDs may contain spaces and brackets (isSafeId), file names use a
 * URL-safe form, so two different IDs can map to one name ("K 31" and "K_31"); each Sheet's
 * normalize step reports that instead of letting one photo overwrite the other.
 */
export const photoFileBase = (id) => id.replace(/[^A-Za-z0-9_-]/g, '_')

/** Cell value → trimmed string, or null when empty. Inner whitespace is kept as typed. */
export function cleanString(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

/** Like cleanString, but every run of whitespace (incl. line breaks) becomes one space. */
export function cleanStringCollapseSpaces(value) {
  if (value === null || value === undefined) return null
  const s = String(value).replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}

export function isHttpUrl(value) {
  if (typeof value !== 'string') return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
  }
  return value
}

export function contentHash({ tabs, resources }) {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(canonical({ tabs, resources }))).digest('hex')
}

export function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2) + '\n'
}

/**
 * Decides which photos to fetch and which local photos to delete.
 *
 * `photos` maps id -> { fileId, modifiedTime } (Drive lookup succeeded) or { fileId, error }.
 * A row whose photo lookup failed KEEPS its existing local photo — a Drive hiccup must never
 * delete anything. A local photo is deleted only when its row is gone from the snapshot or the
 * row no longer has a Drive photo link.
 *
 * Manifest entries written before fileId was recorded (pre-2026-11) are back-filled instead of
 * re-downloaded when their modifiedTime still matches — re-fetching all of them once would add
 * every photo to git history a second time for no visible change.
 *
 * Returns { toFetch: [{id, fileId, modifiedTime}], toBackfill: [{id, fileId}], toDelete: [id], problems: [...] }.
 */
export function planPhotos(snapshot, photos, localManifest) {
  const problems = []
  const toFetch = []
  const toBackfill = []
  const rows = new Map()
  for (const tab of snapshot.tabs) for (const r of snapshot.resources[tab]) rows.set(r.id, r)

  for (const [id, row] of rows) {
    const fileId = extractDriveFileId(row.photoUrl)
    if (!fileId) continue
    if (!isSafeId(id)) {
      problems.push({ kind: 'unsafe-id', id, message: `${id}: the ID has characters a file name can't use — published without a photo` })
      continue
    }
    const photo = photos[id]
    if (!photo || photo.error) {
      problems.push({ kind: 'photo-unavailable', id, message: `${id}: the photo couldn't be read from Drive (${photo?.error ?? 'not returned'}) — kept the previous photo, if any` })
      continue
    }
    const local = localManifest[id]
    if (local && !local.fileId && local.modifiedTime === photo.modifiedTime) {
      toBackfill.push({ id, fileId: photo.fileId })
    } else if (!local || local.fileId !== photo.fileId || local.modifiedTime !== photo.modifiedTime) {
      toFetch.push({ id, fileId: photo.fileId, modifiedTime: photo.modifiedTime })
    }
  }

  const toDelete = Object.keys(localManifest).filter(id => {
    const row = rows.get(id)
    return !row || !extractDriveFileId(row.photoUrl)
  })
  return { toFetch, toBackfill, toDelete, problems }
}

/** A one-list Sheet in the tabbed shape contentHash/planPhotos work on. */
export const asSingleTab = (tab, resources) => ({ tabs: [tab], resources: { [tab]: resources } })

/**
 * planPhotos for a one-list Sheet whose photoUrl may be a Form upload link (open?id=…):
 * planPhotos reads the Drive id with the /d/ pattern only, so it gets a normalised link.
 */
export function planListPhotos(tab, resources, photos, localManifest) {
  const rows = resources.map(r => {
    const fileId = extractDriveFileIdAnyLink(r.photoUrl)
    return { ...r, photoUrl: fileId ? `https://drive.google.com/file/d/${fileId}/view` : null }
  })
  return planPhotos(asSingleTab(tab, rows), photos, localManifest)
}

export function photoDeletionError(deleteCount, localCount, t = THRESHOLDS) {
  const allowed = Math.max(t.maxPhotoDeletesAbs, Math.floor(localCount * t.maxPhotoDeletesRatio))
  return deleteCount > allowed
    ? `${deleteCount} of ${localCount} photos would be deleted (limit ${allowed}).`
    : null
}

/** export action: [{id, fileId, modifiedTime} | {id, fileId, error}] -> map */
export function photosFromExport(list) {
  const photos = {}
  for (const p of list ?? []) {
    if (p && typeof p.id === 'string') photos[p.id] = p.error ? { fileId: p.fileId ?? null, error: String(p.error) } : { fileId: p.fileId, modifiedTime: p.modifiedTime }
  }
  return photos
}
