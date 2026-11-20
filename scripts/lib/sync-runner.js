// Shared I/O for every Sheet snapshot sync (today: scripts/sync-pramaan-library.js and
// scripts/sync-publications.js). The pure rules live in snapshot-core.js and each Sheet's
// <slug>-snapshot.js; this file holds the network, filesystem and GitHub Actions plumbing that
// was identical in every sync script. Each sync script keeps its own paths, names, messages,
// stats line and image processing, and calls these functions in order — read a sync script top to
// bottom to see the whole run.
//
// Changing wording or behaviour here changes EVERY sync's logs, reports and outputs. Keep the
// token redaction, retry and exit rules as they are unless every integration's docs change too.

import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Local runs: copy `<prefix>…=value` lines from .env.development (in the working directory) into
 * process.env, unless the variable is already set. CI passes the values as secrets instead.
 * Example prefix: 'PRAMAAN_LIBRARY_' (must be A–Z/_ only).
 */
export function loadLocalEnv(prefix, file = '.env.development') {
  const re = new RegExp(`^\\s*(${prefix}[A-Z_]+)\\s*=\\s*(.*?)\\s*$`)
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(re)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no local file: CI passes the values as secrets */ }
}

/**
 * The Actions log of a public repository is public: the token must never reach a log line.
 * Returns redactToken(text): hides any `token=` query value and every copy of the token itself.
 */
export function createRedactor(token) {
  return function redactToken(text) {
    let out = String(text).replace(/([?&]token=)[^&\s]*/g, '$1<redacted>')
    if (token) out = out.split(token).join('<redacted>')
    return out
  }
}

/** Returns fetchJson(url, attempts = 3): GET with a timeout, retried after 2 s, 4 s, …; errors are redacted. */
export function createFetchJson({ redactToken, timeoutMs }) {
  return async function fetchJson(url, attempts = 3) {
    const safeUrl = redactToken(url)
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl}`)
        return await res.json()
      } catch (err) {
        if (attempt === attempts) throw new Error(redactToken(err.message))
        const delayMs = attempt * 2000
        console.warn(`  fetch failed (attempt ${attempt}/${attempts}): ${redactToken(err.message)} — retrying in ${delayMs}ms`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
}

export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback }
}

/** True only for a path strictly inside `dir` — the guard before any photo is deleted. */
export function isInsideAssetsDir(dir, absPath) {
  const rel = path.relative(dir, absPath)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/** Appends key=value lines to $GITHUB_OUTPUT (no-op outside Actions). */
export async function setOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return
  await fs.appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''))
}

/**
 * The run report (Markdown at `reportPath`, also appended to $GITHUB_STEP_SUMMARY under
 * `## <summaryTitle>`). Push messages into errors / refused / problems ({message}) / notes, then
 * call write(outcome). `setupGuide` is named in the failure text, `workflowName` in the
 * "tick allow_large_change" text.
 */
export function createReport({ reportPath, summaryTitle, setupGuide, workflowName }) {
  const report = { errors: [], refused: [], problems: [], notes: [] }
  report.write = async function writeReport(outcome) {
    const lines = [`**Outcome:** ${outcome}`, '']
    if (report.errors.length) {
      lines.push('### The sync failed', '', ...report.errors.map(m => `- ${m}`), '',
        `Nothing was published; the page keeps showing the last good version. See ${setupGuide} → Troubleshooting.`, '')
    }
    if (report.refused.length) {
      lines.push('### Not published — the update looked unsafe', '', ...report.refused.map(m => `- ${m}`), '',
        `The page keeps showing the last good version. Check the Sheet. If the change is intended, go to **Actions → ${workflowName} → Run workflow**, tick **allow_large_change**, and run it.`, '')
    }
    if (report.problems.length) {
      lines.push(`### Rows that need attention in the Sheet (${report.problems.length})`, '', ...report.problems.map(p => `- ${p.message}`), '')
    }
    if (report.notes.length) lines.push('### Notes', '', ...report.notes.map(n => `- ${n}`), '')
    const md = lines.join('\n')
    await fs.writeFile(reportPath, md, 'utf8')
    if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `## ${summaryTitle}\n\n${md}\n`)
  }
  return report
}

/**
 * Calls ?action=export and checks it: success flag, minimum script version (`codeGsPath` is named
 * in the error), slow-export note. Returns the payload. The per-Sheet stats line stays in the
 * sync script.
 */
export async function fetchExport({ fetchJson, url, minScriptVersion, codeGsPath, slowExportMs, report }) {
  const started = Date.now()
  const res = await fetchJson(url)
  if (!res || res.success !== true) throw new Error(`Apps Script returned an error: ${res?.error ?? 'no response'}`)
  if (!(res.scriptVersion >= minScriptVersion)) throw new Error(`Apps Script version ${res.scriptVersion} is too old (need ${minScriptVersion}+). Paste ${codeGsPath} and deploy a new version.`)
  const ms = Date.now() - started
  if (ms > slowExportMs) report.notes.push(`The Apps Script export took ${Math.round(ms / 1000)} s; Google stops scripts at 6 minutes.`)
  return res
}

/** Adds the "GitHub token expires soon" note when health.patExpiresAt is within `warnDays`. */
export function notePatExpiry(report, health, warnDays) {
  const exp = health?.patExpiresAt
  if (exp) {
    const days = Math.floor((Date.parse(exp) - Date.now()) / 86_400_000)
    if (days <= warnDays) report.notes.push(`⚠️ The GitHub token used by the Apps Script expires in ${days} day(s) (${exp}). Renew it: docs/MAINTENANCE-GITHUB-PAT-REFRESH.md.`)
  }
}

/**
 * Structural problems: without allow_large_change, write the "Refused" report and outputs and
 * exit 1 (nothing published); with it, record the override in the notes and carry on.
 */
export async function refuseUnlessAllowed({ structural, allowLargeChange, report }) {
  if (!structural.length) return
  if (!allowLargeChange) {
    report.refused.push(...structural)
    await report.write('❌ Refused — nothing was published')
    await setOutputs({ changed: false, refused: true, problems: report.problems.length })
    console.error('Refused to publish:\n  - ' + structural.join('\n  - '))
    process.exit(1)
  }
  report.notes.push(`allow_large_change was set, so these safety checks were overridden: ${structural.join(' ')}`)
}

/**
 * Applies the photo plan to the manifest (mutated in place): back-fills fileIds, downloads
 * plan.toFetch with `processPhoto(item)` (returns the new manifest entry) within the per-run cap
 * and time budget, keeps the previous photo when a download fails. Returns true if the manifest
 * changed. Deletions are done separately (deletePhotos).
 */
export async function fetchPhotos({ plan, manifest, processPhoto, maxPhotos, timeBudgetMs, report, redactToken }) {
  let manifestChanged = false
  for (const { id, fileId } of plan.toBackfill) {
    manifest[id] = { ...manifest[id], fileId }
    manifestChanged = true
  }

  const photoStart = Date.now()
  let fetched = 0
  for (const [i, item] of plan.toFetch.entries()) {
    if (fetched >= maxPhotos || Date.now() - photoStart > timeBudgetMs) {
      const left = plan.toFetch.length - i
      report.notes.push(`${left} photo(s) still to download — the next run continues (each run fetches at most ${maxPhotos} photos in about 20 minutes). Until then those resources show a placeholder.`)
      console.log(`  stopping photo downloads for this run; ${left} left for the next run`)
      break
    }
    fetched++
    try {
      manifest[item.id] = await processPhoto(item)
      manifestChanged = true
      console.log(`  synced photo ${item.id}`)
    } catch (err) {
      report.problems.push({ kind: 'photo-failed', id: item.id, message: `${item.id}: photo download failed (${redactToken(err.message)}) — kept the previous photo, if any` })
      console.warn(`  failed photo ${item.id}: ${redactToken(err.message)}`)
    }
  }
  return manifestChanged
}

/**
 * Removes the manifest entries in `ids` and their thumb/full files (paths relative to public/),
 * but only files strictly inside `assetsDir` and only for safe ids. Returns true if any entry went.
 */
export async function deletePhotos({ ids, manifest, assetsDir, isSafeId }) {
  let manifestChanged = false
  for (const id of ids) {
    const entry = manifest[id]
    delete manifest[id]
    manifestChanged = true
    for (const rel of [entry?.thumb, entry?.full]) {
      if (!rel) continue
      const abs = path.resolve('public', rel)
      if (isSafeId(id) && isInsideAssetsDir(assetsDir, abs)) await fs.rm(abs, { force: true })
      else console.warn(`  refused to delete ${JSON.stringify(rel)}: outside ${assetsDir}`)
    }
    console.log(`  removed photo ${id}`)
  }
  return manifestChanged
}

/**
 * Writes the snapshot only when its text changed, and the manifest (keys sorted) when
 * `manifestChanged`; then logs, writes the success report and the outputs.
 */
export async function writeResults({ snapshotPath, snapshotText, manifestPath, manifest, manifestChanged, report }) {
  const prevText = await fs.readFile(snapshotPath, 'utf8').catch(() => null)
  const snapshotChanged = snapshotText !== prevText
  if (snapshotChanged) {
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true })
    await fs.writeFile(snapshotPath, snapshotText, 'utf8')
  }
  if (manifestChanged) {
    const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]))
    await fs.writeFile(manifestPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8')
  }

  const changed = snapshotChanged || manifestChanged
  console.log(changed ? `Updated: ${[snapshotChanged && 'data', manifestChanged && 'photos'].filter(Boolean).join(' + ')}` : 'No changes.')
  await report.write(changed ? '✅ Published changes' : '✅ No changes')
  await setOutputs({ changed, refused: false, problems: report.problems.length })
}

/** Runs main(); on any error writes the "Failed" report and outputs (best effort), logs the redacted message, exits 1. */
export function runSync(main, { report, redactToken }) {
  main().catch(async err => {
    const msg = redactToken(err?.message ?? err)
    report.errors.push(msg)
    try { await report.write('❌ Failed'); await setOutputs({ changed: false, refused: false, problems: report.problems.length }) } catch { /* best effort */ }
    console.error(msg)
    process.exit(1)
  })
}
