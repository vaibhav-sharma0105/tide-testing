// Pure rules for the Partners snapshot (the "TIDE/THRIvE Partners (Responses)" Sheet,
// apps-script/partners/Code.gs). No network or filesystem access here — scripts/sync-partners.js
// does the I/O, and src/test/scripts/partnersSnapshot.test.js exercises every rule.
// Column rules: docs/PARTNERS-SHEET-SCHEMA.md. Page: /about/our-partners.

import {
  THRESHOLDS, isSafeId, isHttpUrl, contentHash, serializeSnapshot, photoFileBase,
  cleanStringCollapseSpaces as cleanString, asSingleTab, planListPhotos,
} from './snapshot-core.js'
import { PRIORITY_ORDER } from '../../src/config/partners.js'

// Re-exported so the sync script and tests import everything for this Sheet from one file.
// extractDriveFileId here is the form-link-aware reader (snapshot-core's extractDriveFileIdAnyLink).
export {
  isSafeId, serializeSnapshot, photoDeletionError, photosFromExport, photoFileBase,
  extractDriveFileIdAnyLink as extractDriveFileId,
} from './snapshot-core.js'

export const SCHEMA_VERSION = 1
export const SECTION = 'partners'

// The only fields that can reach the public snapshot, in output order. Anything else the Apps
// Script returns is dropped, so a new private column can never leak into the public repository
// even if the script were changed by mistake.
export const RESOURCE_FIELDS = ['id', 'type', 'priority', 'name', 'website', 'photoUrl']
const URL_FIELDS = ['website', 'photoUrl']

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const key = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().toLowerCase() : '')
const PRIORITY_KEYS = PRIORITY_ORDER.map(key)

/** Known priority → its PRIORITY_ORDER spelling; anything else → null. */
export function knownPriority(value) {
  const i = PRIORITY_KEYS.indexOf(key(value))
  return i === -1 ? null : PRIORITY_ORDER[i]
}

/**
 * Apps Script payload ({resources: [...], problems: [...]}) → clean, allowlisted rows.
 * Row problems never block publishing; they go to the "Sheet needs attention" report.
 * Rows are ordered by id so the snapshot is stable (the page does the display order).
 */
export function normalizePartners(payload) {
  const problems = (Array.isArray(payload?.problems) ? payload.problems : [])
    .filter(p => p && typeof p.message === 'string')
    .map(p => ({ kind: String(p.kind ?? 'sheet'), message: p.message }))
  const resources = []
  const seen = new Set()
  const photoNames = new Map()
  const names = new Map() // type|normalised name → first id with it

  for (const row of Array.isArray(payload?.resources) ? payload.resources : []) {
    const id = cleanString(row?.id)
    const name = cleanString(row?.name)
    const type = cleanString(row?.type)
    if (!id || !name || !type) { problems.push({ kind: 'missing-id', message: `a row without ${!id ? 'an ID' : !name ? 'a name' : 'a type'} was skipped` }); continue }
    if (!isSafeId(id)) { problems.push({ kind: 'unsafe-id', id, message: `${id}: the ID may only use letters, numbers, spaces, - _ ( ) — skipped` }); continue }
    if (seen.has(id)) { problems.push({ kind: 'duplicate-id', id, message: `${id} is used more than once — later copy skipped` }); continue }
    seen.add(id)

    const out = {}
    for (const field of RESOURCE_FIELDS) out[field] = cleanString(row[field])
    const label = `${id} ("${out.name}", ${out.type})`

    const priority = knownPriority(out.priority)
    if (priority) out.priority = priority
    else problems.push({ kind: 'unknown-priority', id, message: `${label}: the priority ${out.priority ? `"${out.priority}"` : 'is empty and'} is not one of ${PRIORITY_ORDER.join(', ')} — listed after ${PRIORITY_ORDER.at(-1)}` })

    if (out.website && /^www\.\S+$/i.test(out.website)) out.website = `https://${out.website}`
    for (const field of URL_FIELDS) {
      if (out[field] && !isHttpUrl(out[field])) {
        problems.push({ kind: 'bad-url', id, message: `${label}: the ${field === 'website' ? 'website' : 'logo link'} is not a web link — removed` })
        out[field] = null
      }
    }
    if (isHttpUrl(out.name)) problems.push({ kind: 'name-is-link', id, message: `${label}: the partner name is a web address — type the name instead` })
    for (const field of RESOURCE_FIELDS) {
      if (typeof out[field] === 'string' && EMAIL.test(out[field])) {
        problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in "${field}" — that field was left out` })
        out[field] = null
      }
    }
    if (!out.name || !out.type) continue // name/type held an email address — nothing sensible left to show
    if (!out.photoUrl) problems.push({ kind: 'missing-logo', id, message: `${label}: no logo — shown with its name only` })

    // Same name twice in one section is usually a double submission — published, but reported.
    const nameKey = `${key(out.type)}|${out.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`
    if (names.has(nameKey)) problems.push({ kind: 'possible-duplicate', id, message: `${label}: the same name appears more than once in this section (also ${names.get(nameKey)}) — check whether one is a double submission` })
    else names.set(nameKey, id)
    if (out.photoUrl) {
      const fileBase = photoFileBase(id)
      const owner = photoNames.get(fileBase)
      if (owner) {
        problems.push({ kind: 'photo-name-clash', id, message: `${id}: its logo would share a file name with ${owner} — logo left out` })
        out.photoUrl = null
      } else photoNames.set(fileBase, id)
    }
    resources.push(out)
  }
  resources.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { resources, problems }
}

const asTabs = resources => asSingleTab('partners', resources)

export function buildPartnersSnapshot(resources, previous, nowIso) {
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

/** Structural checks: any message returned means "publish nothing, keep the last good snapshot". */
export function validatePartners(next, previous, t = THRESHOLDS) {
  const errors = []
  const bytes = Buffer.byteLength(serializeSnapshot(next))
  if (bytes > t.maxSnapshotBytes) errors.push(`The data is ${Math.round(bytes / 1024)} KB, over the ${t.maxSnapshotBytes / 1024 / 1024} MB safety limit.`)
  const prev = Array.isArray(previous?.resources) ? previous.resources : []
  if (prev.length === 0) return errors
  if (next.resources.length === 0) {
    errors.push(`The Sheet returned no partners, but ${prev.length} are on the website. Was a column renamed or the tab emptied?`)
    return errors
  }
  const nextIds = new Set(next.resources.map(r => r.id))
  const removed = prev.filter(r => !nextIds.has(r.id)).length
  const allowed = Math.max(t.maxRowsRemovedAbs, Math.floor(prev.length * t.maxRowsRemovedRatio))
  if (removed > allowed) errors.push(`${removed} of ${prev.length} partners would disappear (limit ${allowed}).`)
  return errors
}

/** Same logo plan as the other Sheets (keep on Drive errors, delete only when the row/link is gone). */
export function planPartnersPhotos(snapshot, photos, localManifest) {
  return planListPhotos('partners', snapshot.resources, photos, localManifest)
}

// A logo file shared by this many partners or more is treated as a placeholder (e.g. one
// "No Logo Available" picture uploaded for many rows): the page shows those partners' initials
// instead, and the report lists them so real logos can be added. Two partners sharing one logo
// (one organisation in two sections) is normal and left alone.
export const SHARED_LOGO_MIN = 3

/**
 * Marks manifest entries whose rendered logo (`hash`, written by the sync) is shared by
 * SHARED_LOGO_MIN or more partners as `placeholder: true`, and clears the mark from the rest.
 * Changes `manifest` in place. Returns { changed, problems } — one problem per shared picture.
 * `names` (optional) maps id → partner name for the report.
 */
export function markSharedLogos(manifest, names = new Map()) {
  const byHash = new Map()
  for (const [id, entry] of Object.entries(manifest)) {
    if (!entry?.hash) continue
    if (!byHash.has(entry.hash)) byHash.set(entry.hash, [])
    byHash.get(entry.hash).push(id)
  }
  let changed = false
  const problems = []
  for (const entry of Object.values(manifest)) {
    const shared = !!entry?.hash && byHash.get(entry.hash).length >= SHARED_LOGO_MIN
    if (shared && !entry.placeholder) { entry.placeholder = true; changed = true }
    if (!shared && entry && 'placeholder' in entry) { delete entry.placeholder; changed = true }
  }
  for (const ids of byHash.values()) {
    if (ids.length < SHARED_LOGO_MIN) continue
    const sorted = [...ids].sort()
    const list = sorted.slice(0, 5).map(id => names.get(id) ?? id).join(', ')
    problems.push({
      kind: 'shared-logo',
      id: sorted[0],
      message: `${ids.length} partners use the same logo picture (${list}${ids.length > 5 ? ', …' : ''}) — shown with their initials until each has its own logo`,
    })
  }
  return { changed, problems }
}
