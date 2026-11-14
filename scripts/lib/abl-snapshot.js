// Pure rules for the Pramaan (ABL) snapshot: what gets published, what is refused, which photos
// are fetched or deleted. No network or filesystem access here — the sync script
// (scripts/sync-abl-thumbnails.js) does the I/O, and the unit tests
// (src/test/scripts/ablSnapshot.test.js) exercise every rule directly.
//
// Design: docs/PRAMAAN-HARDENING-PLAN.md §6.3. Changing a threshold here changes what the
// pipeline will publish — update that section and the tests together.

import { createHash } from 'node:crypto'

export const SCHEMA_VERSION = 1
export const SECTION = 'abl'

// The fields a resource may carry into the public snapshot, in output order. Anything else the
// Apps Script returns is dropped, so a new private column can never leak into the public repo.
export const RESOURCE_FIELDS = [
  'id', 'name', 'type', 'concept', 'language', 'ownership', 'quantity', 'storageLocation',
  'photoUrl', 'videoUrl', 'canvaUrl', 'grades', 'chapters', 'description', 'referenceLink',
]
const URL_FIELDS = ['photoUrl', 'videoUrl', 'canvaUrl', 'referenceLink']

// Structural thresholds: breaching any of these refuses the whole publish (last good snapshot is
// kept) unless the run was started with allow_large_change.
export const THRESHOLDS = {
  maxRowsRemovedAbs: 10,        // removing up to this many rows is always allowed…
  maxRowsRemovedRatio: 0.2,     // …beyond that, at most 20% of the previous rows
  tabMinRowsWatched: 5,         // a tab this big may not vanish…
  tabMaxDropRatio: 0.5,         // …or lose more than half its rows in one run
  maxMissingNameRatio: 0.1,     // more than 10% nameless rows = a header was probably renamed
  maxPhotoDeletesAbs: 10,
  maxPhotoDeletesRatio: 0.2,
  maxSnapshotBytes: 2 * 1024 * 1024,
}

// Same rule the sync has always used for ids that become filenames.
const SAFE_ID = /^[A-Za-z0-9 _()-]+$/
export function isSafeId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100 && SAFE_ID.test(id)
}

export function extractDriveFileId(url) {
  if (typeof url !== 'string') return null
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
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

function cleanString(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function cleanList(value) {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : []
}

function cleanChapters(value) {
  const out = {}
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value).sort()) out[key] = cleanList(value[key])
  }
  return out
}

/**
 * Turns an Apps Script payload ({tabs, resources}) into clean, allowlisted rows.
 * Row-level problems never block publishing; they are returned for the "Sheet needs attention"
 * report. Returns { tabs, resources, problems }.
 */
export function normalizeResources(payload) {
  const problems = []
  const tabs = []
  const resources = {}
  const seen = new Map() // id -> tab where it first appeared

  const inTabs = Array.isArray(payload?.tabs) ? payload.tabs : []
  for (const tab of inTabs) {
    if (typeof tab !== 'string' || !tab.trim()) continue
    const rowsIn = Array.isArray(payload.resources?.[tab]) ? payload.resources[tab] : []
    const rowsOut = []
    rowsIn.forEach((row, index) => {
      const id = cleanString(row?.id)
      const name = cleanString(row?.name)
      if (!id) { problems.push({ kind: 'missing-id', tab, row: index + 2, message: `row ${index + 2} has no ID — skipped` }); return }
      if (!name) { problems.push({ kind: 'missing-name', tab, id, message: `${id} has no name — skipped` }); return }
      if (seen.has(id)) {
        problems.push({ kind: 'duplicate-id', tab, id, message: `${id} is used more than once (first in "${seen.get(id)}") — later copy skipped` })
        return
      }
      seen.set(id, tab)

      const out = {}
      for (const field of RESOURCE_FIELDS) {
        if (field === 'grades') out.grades = cleanList(row.grades)
        else if (field === 'chapters') out.chapters = cleanChapters(row.chapters)
        else if (field === 'quantity') out.quantity = Number.isFinite(row.quantity) ? row.quantity : null
        else out[field] = cleanString(row[field])
      }
      for (const field of URL_FIELDS) {
        if (out[field] && !isHttpUrl(out[field])) {
          problems.push({ kind: 'bad-url', tab, id, message: `${id}: ${field} is not a web link — removed` })
          out[field] = null
        }
      }
      rowsOut.push(out)
    })
    if (rowsOut.length > 0) {
      tabs.push(tab)
      resources[tab] = rowsOut
    }
  }
  return { tabs, resources, problems }
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

/**
 * Builds the snapshot object. `lastUpdated` only moves when the content actually changed, so a
 * run with no Sheet edits produces a byte-identical file (no commit, no deploy).
 */
export function buildSnapshot({ tabs, resources }, previous, nowIso) {
  const hash = contentHash({ tabs, resources })
  const counts = Object.fromEntries(tabs.map(t => [t, resources[t].length]))
  const total = tabs.reduce((n, t) => n + resources[t].length, 0)
  const lastUpdated = previous && previous.contentHash === hash && previous.lastUpdated
    ? previous.lastUpdated
    : nowIso
  return {
    schemaVersion: SCHEMA_VERSION,
    section: SECTION,
    success: true,
    lastUpdated,
    contentHash: hash,
    tabs,
    resources,
    meta: { counts, total },
  }
}

export function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2) + '\n'
}

function totalRows(s) {
  return s ? s.tabs.reduce((n, t) => n + (s.resources[t]?.length ?? 0), 0) : 0
}

/**
 * Structural checks. Any message returned means: do not publish, keep the last good snapshot,
 * fail the run (unless allow_large_change). `previous` may be null on the very first run.
 * `rowProblems` are the problems normalizeResources reported (nameless rows were dropped there,
 * so they are counted from it).
 */
export function validateStructure(next, previous, rowProblems = [], t = THRESHOLDS) {
  const errors = []
  const nextTotal = totalRows(next)
  if (next.tabs.length === 0 || nextTotal === 0) {
    errors.push('The Sheet returned no resources at all. Nothing was published.')
    return errors
  }
  const bytes = Buffer.byteLength(serializeSnapshot(next))
  if (bytes > t.maxSnapshotBytes) errors.push(`The data is ${Math.round(bytes / 1024)} KB, over the ${t.maxSnapshotBytes / 1024 / 1024} MB safety limit.`)

  const allRows = next.tabs.flatMap(tab => next.resources[tab])
  const nameless = rowProblems.filter(p => p.kind === 'missing-name').length
  if (nameless / (allRows.length + nameless) > t.maxMissingNameRatio) {
    errors.push(`${nameless} of ${allRows.length + nameless} resources have no name — a column header was probably renamed.`)
  }

  if (previous) {
    const prevTotal = totalRows(previous)
    const nextIds = new Set(allRows.map(r => r.id))
    const removed = previous.tabs.flatMap(tab => previous.resources[tab] ?? []).filter(r => !nextIds.has(r.id)).length
    const allowed = Math.max(t.maxRowsRemovedAbs, Math.floor(prevTotal * t.maxRowsRemovedRatio))
    if (removed > allowed) {
      errors.push(`${removed} of ${prevTotal} resources would disappear (limit ${allowed}).`)
    }
    for (const tab of previous.tabs) {
      const before = previous.resources[tab]?.length ?? 0
      if (before < t.tabMinRowsWatched) continue
      const after = next.resources[tab]?.length ?? 0
      if (after === 0) errors.push(`The "${tab}" tab (${before} resources) is missing or empty.`)
      else if ((before - after) / before > t.tabMaxDropRatio) errors.push(`The "${tab}" tab dropped from ${before} to ${after} resources.`)
    }
  }
  return errors
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

export function photoDeletionError(deleteCount, localCount, t = THRESHOLDS) {
  const allowed = Math.max(t.maxPhotoDeletesAbs, Math.floor(localCount * t.maxPhotoDeletesRatio))
  return deleteCount > allowed
    ? `${deleteCount} of ${localCount} photos would be deleted (limit ${allowed}).`
    : null
}

/**
 * Legacy Apps Script (before v3) has no `export` action: photos come from `?action=manifest`,
 * which silently omits ids whose Drive lookup failed. Convert that list to the v3 shape, marking
 * any row that has a Drive link but is missing from the manifest as an error (so it is kept, not
 * deleted).
 */
export function photosFromLegacyManifest(snapshot, manifestList) {
  const byId = new Map((manifestList ?? []).map(m => [m.id, m]))
  const photos = {}
  for (const tab of snapshot.tabs) {
    for (const r of snapshot.resources[tab]) {
      const fileId = extractDriveFileId(r.photoUrl)
      if (!fileId) continue
      const m = byId.get(r.id)
      photos[r.id] = m ? { fileId: m.fileId, modifiedTime: m.modifiedTime } : { fileId, error: 'missing from the Drive manifest' }
    }
  }
  return photos
}

/** v3 export: [{id, fileId, modifiedTime} | {id, fileId, error}] -> map */
export function photosFromExport(list) {
  const photos = {}
  for (const p of list ?? []) {
    if (p && typeof p.id === 'string') photos[p.id] = p.error ? { fileId: p.fileId ?? null, error: String(p.error) } : { fileId: p.fileId, modifiedTime: p.modifiedTime }
  }
  return photos
}
