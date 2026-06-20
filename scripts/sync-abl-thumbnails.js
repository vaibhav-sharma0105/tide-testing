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
const MAX_RAW_BYTES = 8 * 1024 * 1024 // reject anything larger than 8MB raw

function sniffImageType(buf) {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

async function fetchJson(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
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
      if (!sniffImageType(raw)) {
        console.warn(`  skip ${id}: not a recognized image format`)
        continue
      }

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
      await fs.rm(path.resolve('public', entry.thumb), { force: true })
      await fs.rm(path.resolve('public', entry.full), { force: true })
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
