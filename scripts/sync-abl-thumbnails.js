// Syncs ABL resource thumbnails from Google Drive into local, optimized
// WebP assets, via the Apps Script Web App's token-gated manifest/fetchImage
// actions — so the live site never depends on Google's thumbnail CDN (and
// its undocumented rate limits) at runtime.
//
// Diffs against the committed manifest (src/data/abl-thumbnails-manifest.json)
// so unchanged resources are never re-downloaded. Safe to re-run; no-ops
// when nothing changed.
//
// Run: npm run content:sync-abl-thumbnails
// Requires env vars: VITE_ABL_API_URL, ABL_SYNC_TOKEN
//
// See docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md for the full setup procedure.

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const API_URL = process.env.VITE_ABL_API_URL
const TOKEN   = process.env.ABL_SYNC_TOKEN

const MANIFEST_PATH = path.resolve('src/data/abl-thumbnails-manifest.json')
const ASSETS_DIR    = path.resolve('public/assets/images/abl')
const THUMB_WIDTH   = 480
const FULL_WIDTH    = 1200
const MAX_RAW_BYTES = 25 * 1024 * 1024 // reject anything larger than 25MB raw (modern phone photos can exceed 8-10MB)

// Resource ids come from a staff-editable Sheet column, not a developer —
// a stray "../" (malicious or just a typo) must never reach path.join/fs.rm
// below. Verified against all 161 current production ids before adding
// this; none would be rejected by it.
const SAFE_ID = /^[A-Za-z0-9 _()-]+$/
function isSafeId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100 && SAFE_ID.test(id)
}

// Defense in depth for the removal path below: even if a manifest entry's
// stored path were ever corrupted or hand-edited, never delete anything
// that doesn't resolve inside the assets directory we own.
function isInsideAssetsDir(absPath) {
  const rel = path.relative(ASSETS_DIR, absPath)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

// Never let the real token reach a log line or thrown Error message — on a
// public repo, that string ends up in a publicly-readable Actions log.
// GitHub's own secret redaction is the backstop, not the primary defense:
// it only catches an exact byte-for-byte match of the secret value, which
// breaks the moment the token contains a character encodeURIComponent()
// would alter (it currently doesn't, by accident of how the setup guide
// has you generate it — that's not something this code should rely on).
function redactToken(url) {
  return url.replace(/([?&]token=)[^&]*/, '$1<redacted>')
}

async function fetchJson(url, attempts = 3) {
  const safeUrl = redactToken(url)
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl}`)
      return await res.json()
    } catch (err) {
      if (attempt === attempts) throw err
      const delayMs = attempt * 2000
      console.warn(`  fetch failed (attempt ${attempt}/${attempts}) for ${safeUrl}: ${err.message} — retrying in ${delayMs}ms`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

async function loadManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'))
  } catch {
    return {}
  }
}

async function main() {
  if (!API_URL) throw new Error('VITE_ABL_API_URL is not set')
  if (!TOKEN) throw new Error('ABL_SYNC_TOKEN is not set')

  console.log('Fetching remote manifest...')
  const manifestRes = await fetchJson(`${API_URL}?action=manifest&token=${encodeURIComponent(TOKEN)}`)
  if (!manifestRes.success) throw new Error(`Manifest request failed: ${manifestRes.error}`)

  const remote = manifestRes.manifest // [{id, fileId, modifiedTime}]
  const local  = await loadManifest()

  const remoteIds = new Set(remote.map(r => r.id))
  const toSync   = remote.filter(r => !local[r.id] || local[r.id].modifiedTime !== r.modifiedTime)
  const toRemove = Object.keys(local).filter(id => !remoteIds.has(id))

  console.log(`${remote.length} resources with photos, ${toSync.length} to sync, ${toRemove.length} to remove`)

  await fs.mkdir(ASSETS_DIR, { recursive: true })

  let changed = false

  for (const { id, modifiedTime } of toSync) {
    if (!isSafeId(id)) {
      console.warn(`  skip ${JSON.stringify(id)}: id contains characters outside the allowed set (letters, digits, space, _ ( ) -)`)
      continue
    }
    try {
      const imgRes = await fetchJson(`${API_URL}?action=fetchImage&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`)
      if (!imgRes.success) {
        console.warn(`  skip ${id}: ${imgRes.error}`)
        continue
      }

      const raw = Buffer.from(imgRes.base64, 'base64')
      if (raw.length > MAX_RAW_BYTES) {
        console.warn(`  skip ${id}: image too large (${raw.length} bytes)`)
        continue
      }

      // Let sharp itself validate the bytes are a decodable image — it
      // supports far more real-world formats (HEIC/HEIF, GIF, TIFF, AVIF...)
      // than a hand-rolled magic-byte check would, and a decode failure here
      // is a stronger signal of "not actually an image" than guessing.
      await sharp(raw).metadata()

      const thumbPath = path.join(ASSETS_DIR, `${id}-thumb.webp`)
      const fullPath  = path.join(ASSETS_DIR, `${id}-full.webp`)

      await sharp(raw).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbPath)
      await sharp(raw).resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fullPath)

      local[id] = {
        modifiedTime,
        thumb: `assets/images/abl/${id}-thumb.webp`,
        full: `assets/images/abl/${id}-full.webp`,
      }
      changed = true
      console.log(`  synced ${id}`)
    } catch (err) {
      console.warn(`  failed ${id}: ${err.message}`)
    }
  }

  for (const id of toRemove) {
    const entry = local[id]
    delete local[id]
    changed = true
    if (entry) {
      for (const rel of [entry.thumb, entry.full]) {
        const abs = path.resolve('public', rel)
        if (isInsideAssetsDir(abs)) {
          await fs.rm(abs, { force: true })
        } else {
          console.warn(`  refused to delete ${JSON.stringify(rel)}: resolves outside ${ASSETS_DIR}`)
        }
      }
    }
    console.log(`  removed ${id}`)
  }

  if (changed) {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(local, null, 2) + '\n', 'utf8')
    console.log('Manifest updated.')
  } else {
    console.log('No changes.')
  }

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
