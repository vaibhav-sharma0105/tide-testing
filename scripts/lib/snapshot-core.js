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

// Sheet text is typed by anyone who can fill in a Form (Publications and Partners publish with no
// approval step), so it is untrusted. Invisible characters that only serve to disguise text are
// removed: C0/C1 control characters (tab and line breaks are kept) and the bidirectional override /
// isolate marks U+202A–U+202E, U+2066–U+2069 (they can make a name display reversed or hide part of
// it). Zero-width joiners (U+200C/U+200D) stay: Gujarati and Devanagari spelling needs them.
// eslint-disable-next-line no-control-regex
const DISGUISE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g
export const stripDisguiseChars = (s) => String(s).replace(DISGUISE_CHARS, '')

/** Cell value → trimmed string, or null when empty. Inner whitespace is kept as typed. */
export function cleanString(value) {
  if (value === null || value === undefined) return null
  const s = stripDisguiseChars(value).trim()
  return s === '' ? null : s
}

/** Like cleanString, but every run of whitespace (incl. line breaks) becomes one space. */
export function cleanStringCollapseSpaces(value) {
  if (value === null || value === undefined) return null
  const s = stripDisguiseChars(value).replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}

/**
 * The URL allow-list applied at ingest by every sync: a single absolute http(s) link to a named
 * host, with no user name or password in it ("https://trusted.org@evil.example" style disguises)
 * and no spaces or control characters (two links pasted into one cell are not one link). Anything
 * else — javascript:, data:, vbscript:, file:, relative paths — is refused. The pages check again
 * when rendering (src/utils/safeUrl.js).
 */
// eslint-disable-next-line no-control-regex
const URL_FORBIDDEN_CHARS = /[\s\u0000-\u001F\u007F]/
export function isHttpUrl(value) {
  if (typeof value !== 'string' || value === '' || URL_FORBIDDEN_CHARS.test(value)) return false
  try {
    const u = new URL(value)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

/**
 * Google adds `ouid=<the sharer's Google account id>` to some "copy link" addresses
 * (docs.google.com/…/edit?usp=sharing&ouid=…). The id identifies a person and the link works
 * without it, so it is removed before a link is published. Other links are returned unchanged.
 */
export function withoutAccountId(url) {
  if (typeof url !== 'string' || !/[?&]ouid=/.test(url)) return url
  try {
    const u = new URL(url)
    if (!/(^|\.)google\.com$/i.test(u.hostname)) return url
    u.searchParams.delete('ouid')
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Makes one line of report text (which quotes Sheet text) inert in GitHub Markdown: line breaks
 * become spaces (no new headings, list items or blocks), HTML is shown as text (no hidden
 * `<!-- … -->` comments or tags that a person can't see but an AI agent reading the issue would),
 * and link / image / code / emphasis / table characters are escaped. "@" is handled by
 * scripts/ci/alert-issue.sh.
 */
export function reportText(value) {
  return String(value)
    .replace(/[\r\n\u2028\u2029]+/g, ' ')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_[\]|~]/g, (c) => `\\${c}`)
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
