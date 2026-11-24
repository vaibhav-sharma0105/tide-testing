// Pure rules for the Publications snapshot (the "TIDE THRIvE Publications (Responses)" Sheet,
// apps-script/publications/Code.gs). No network or filesystem access here — scripts/sync-publications.js
// does the I/O, and src/test/scripts/publicationsSnapshot.test.js exercises every rule.
//
// One Sheet feeds two pages: rows answered "TIDE" go to /tide/publications, rows answered "THRIvE"
// go to /thrive/publications. Column rules: docs/PUBLICATIONS-SHEET-SCHEMA.md.

// Shared building blocks (safe ids, hashing, photo plan, deletion limits, Drive-link reading, photo
// file names, cell cleaning) come from snapshot-core.js.
import {
  THRESHOLDS, isSafeId, isHttpUrl, withoutAccountId, contentHash, serializeSnapshot, photoFileBase,
  cleanStringCollapseSpaces as cleanString, asSingleTab, planListPhotos,
} from './snapshot-core.js'

// Re-exported so the sync script and tests import everything for this Sheet from one file.
// extractDriveFileId here is the form-link-aware reader (snapshot-core's extractDriveFileIdAnyLink).
export {
  isSafeId, serializeSnapshot, photoDeletionError, photosFromExport, photoFileBase,
  extractDriveFileIdAnyLink as extractDriveFileId,
} from './snapshot-core.js'

export const SCHEMA_VERSION = 1
export const SECTION = 'publications'
export const ORGS = ['TIDE', 'THRIvE']

// The only fields that can reach the public snapshot, in output order. Anything else the Apps
// Script returns is dropped — the Sheet holds submitters' email addresses, and a new private
// column must never leak into the public repository even if the script were changed by mistake.
export const RESOURCE_FIELDS = ['id', 'org', 'date', 'title', 'type', 'fields', 'description', 'citation', 'link', 'photoUrl']
const URL_FIELDS = ['link', 'photoUrl']

// "THRIvE Field of Work" is a checkbox question: Google Forms joins the ticked options with ", ".
// An option that itself contains a comma must be listed here, or it would be split into pieces.
// Add new comma-containing options here when the Form gets them (docs/PUBLICATIONS-SHEET-SCHEMA.md).
export const FIELDS_WITH_COMMAS = [
  'Teacher agency, wellbeing, motivation, and professional development',
]

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** "A, B, C" from a checkbox answer → ['A', 'B', 'C'], keeping known comma-containing options whole. */
export function splitFields(text, known = FIELDS_WITH_COMMAS) {
  let rest = cleanString(text)
  if (!rest) return []
  const out = []
  for (const option of known) {
    const re = new RegExp(`(^|,\\s*)${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s*,|$)`, 'i')
    if (re.test(rest)) {
      out.push(option)
      rest = rest.replace(re, '$1')
    }
  }
  for (const part of rest.split(',')) {
    const p = cleanString(part)
    if (p && !out.some(o => o.toLowerCase() === p.toLowerCase())) out.push(p)
  }
  return out
}

/**
 * Apps Script payload ({resources: [...], problems: [...]}) → clean, allowlisted rows.
 * Row problems never block publishing; they go to the "Sheet needs attention" report.
 * Rows are ordered newest first (undated last), then by id, so the snapshot is stable.
 */
export function normalizePublications(payload) {
  const problems = (Array.isArray(payload?.problems) ? payload.problems : [])
    .filter(p => p && typeof p.message === 'string')
    .map(p => ({ kind: String(p.kind ?? 'sheet'), message: p.message }))
  const resources = []
  const seen = new Set()
  const photoNames = new Map()
  const titles = new Map() // org|normalised title → first id with it

  for (const row of Array.isArray(payload?.resources) ? payload.resources : []) {
    const id = cleanString(row?.id)
    const title = cleanString(row?.title)
    if (!id || !title) { problems.push({ kind: 'missing-id', message: `a row without ${id ? 'a title' : 'an ID'} was skipped` }); continue }
    if (!isSafeId(id)) { problems.push({ kind: 'unsafe-id', id, message: `${id}: the ID may only use letters, numbers, spaces, - _ ( ) — skipped` }); continue }
    if (seen.has(id)) { problems.push({ kind: 'duplicate-id', id, message: `${id} is used more than once — later copy skipped` }); continue }
    const org = ORGS.find(o => o.toLowerCase() === String(row?.org ?? '').trim().toLowerCase())
    if (!org) { problems.push({ kind: 'bad-org', id, message: `${id} ("${title}"): "TIDE / THRIvE" is neither TIDE nor THRIvE — skipped` }); continue }
    seen.add(id)

    const out = {}
    for (const field of RESOURCE_FIELDS) {
      if (field === 'org') out.org = org
      else if (field === 'fields') out.fields = Array.isArray(row.fields) ? row.fields.map(cleanString).filter(Boolean) : splitFields(row.fields)
      else out[field] = cleanString(row[field])
    }
    if (out.date && !ISO_DATE.test(out.date)) {
      problems.push({ kind: 'bad-date', id, message: `${id} ("${title}"): the date of publication "${out.date}" could not be read — shown without a date, listed last` })
      out.date = null
    } else if (!out.date) {
      problems.push({ kind: 'missing-date', id, message: `${id} ("${title}"): no date of publication — listed last` })
    }
    // A link typed without "https://" ("www.…", "doi.org/…") is completed, as the Apps Script does.
    if (out.link && /^(www\.|doi\.org\/)\S+$/i.test(out.link)) out.link = `https://${out.link}`
    for (const field of URL_FIELDS) {
      if (out[field] && !isHttpUrl(out[field])) {
        problems.push({ kind: 'bad-url', id, message: `${id} ("${title}"): the ${field === 'link' ? 'publication link' : 'thumbnail link'} is not a web link — removed` })
        out[field] = null
      }
      out[field] = withoutAccountId(out[field])
    }
    if (!out.link) problems.push({ kind: 'missing-link', id, message: `${id} ("${title}"): no working link to the publication — shown without an "open" button` })
    for (const field of RESOURCE_FIELDS) {
      if (typeof out[field] === 'string' && EMAIL.test(out[field])) {
        problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in "${field}" — that field was left out` })
        out[field] = field === 'title' ? '' : null
      }
    }
    if (out.fields.some(f => EMAIL.test(f))) {
      problems.push({ kind: 'personal-data', id, message: `${id}: an email address was found in "fields" — that entry was left out` })
      out.fields = out.fields.filter(f => !EMAIL.test(f))
    }
    if (!out.title) continue // title held an email address — nothing sensible left to show
    // Same title twice on one page is usually a double submission — published, but reported.
    const titleKey = `${org}|${out.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`
    if (titles.has(titleKey)) problems.push({ kind: 'possible-duplicate', id, message: `${id} ("${out.title}"): the same ${org} title appears more than once (also ${titles.get(titleKey)}) — check whether one is a double submission` })
    else titles.set(titleKey, id)
    if (out.photoUrl) {
      const fileBase = photoFileBase(id)
      const owner = photoNames.get(fileBase)
      if (owner) {
        problems.push({ kind: 'photo-name-clash', id, message: `${id}: its thumbnail would share a file name with ${owner} — thumbnail left out` })
        out.photoUrl = null
      } else photoNames.set(fileBase, id)
    }
    resources.push(out)
  }
  resources.sort(comparePublications)
  return { resources, problems }
}

export function comparePublications(a, b) {
  if (a.date !== b.date) {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? 1 : -1
  }
  return a.id.localeCompare(b.id, 'en', { numeric: true })
}

const asTabs = resources => asSingleTab('publications', resources)

export function buildPublicationsSnapshot(resources, previous, nowIso) {
  const hash = contentHash(asTabs(resources))
  const lastUpdated = previous && previous.contentHash === hash && previous.lastUpdated ? previous.lastUpdated : nowIso
  const counts = Object.fromEntries(ORGS.map(o => [o, resources.filter(r => r.org === o).length]))
  return {
    schemaVersion: SCHEMA_VERSION,
    section: SECTION,
    success: true,
    lastUpdated,
    contentHash: hash,
    resources,
    meta: { total: resources.length, counts },
  }
}

/**
 * Structural checks: any message returned means "publish nothing, keep the last good snapshot".
 * Checked for the whole Sheet AND for each page, so one page can't silently empty while the
 * other still has rows.
 */
export function validatePublications(next, previous, t = THRESHOLDS) {
  const errors = []
  const bytes = Buffer.byteLength(serializeSnapshot(next))
  if (bytes > t.maxSnapshotBytes) errors.push(`The data is ${Math.round(bytes / 1024)} KB, over the ${t.maxSnapshotBytes / 1024 / 1024} MB safety limit.`)
  const prevAll = Array.isArray(previous?.resources) ? previous.resources : []
  const nextIds = new Set(next.resources.map(r => r.id))
  for (const org of ORGS) {
    const prev = prevAll.filter(r => r.org === org)
    if (prev.length === 0) continue
    const nextCount = next.resources.filter(r => r.org === org).length
    if (nextCount === 0) {
      errors.push(`The Sheet returned no ${org} publications, but ${prev.length} are on the website. Was the "TIDE / THRIvE" column changed?`)
      continue
    }
    const removed = prev.filter(r => !nextIds.has(r.id)).length
    const allowed = Math.max(t.maxRowsRemovedAbs, Math.floor(prev.length * t.maxRowsRemovedRatio))
    if (removed > allowed) errors.push(`${removed} of ${prev.length} ${org} publications would disappear (limit ${allowed}).`)
  }
  return errors
}

/** Same photo plan as the Pramaan Library (keep on Drive errors, delete only when the row/link is gone). */
export function planPublicationsPhotos(snapshot, photos, localManifest) {
  return planListPhotos('publications', snapshot.resources, photos, localManifest)
}
