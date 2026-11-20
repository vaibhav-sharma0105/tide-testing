// Shared test harness for the Apps Script tests (libraryAppsScript.test.js,
// publicationsAppsScript.test.js, and the next Sheet integration's): runs a real Code.gs in a Node vm
// sandbox with fake Google services, because it can't run on Google from CI. Not a test file itself
// (vitest only picks up *.test.js).
//
// Every fake records what the script did, so tests can assert on it:
//   props (Script Properties), cache (CacheService), fetches (UrlFetchApp calls),
//   triggers (ScriptApp), sheets (tab name → rows, header first; tests may edit it), clock.t (now).
// DriveApp.getFileById('missingFile0001') throws "No item with the given ID could be found"; every
// other id returns a file last updated 2026-01-01T00:00:00Z.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createHash } from 'node:crypto'

/** Code.gs source, read relative to the repo root (vitest's working directory). */
export function readCodeGs(relPath) {
  return fs.readFileSync(path.resolve(relPath), 'utf8')
}

/**
 * Loads `code` into a fresh sandbox and sets the Script Properties SYNC_TOKEN='secret-token',
 * GITHUB_PAT='pat', GITHUB_REPO='owner/repo'.
 *
 * - now: the fake clock's start (ms); `new Date()` and `Date.now()` follow clock.t.
 * - sheets: { tabName: rows } for the spreadsheet.
 * - spreadsheetName: getName() of the spreadsheet.
 * - timeZone: when given, the spreadsheet has getSpreadsheetTimeZone() and Utilities has
 *   formatDate() returning the date's UTC yyyy-MM-dd (the fake Sheet is in UTC). Leave it out
 *   for a script that doesn't use them, so a new dependency on them shows up as a failure.
 */
export function makeAppsScriptEnv({ code, now, sheets, spreadsheetName, timeZone }) {
  const clock = { t: now }
  const RealDate = Date
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(clock.t); else super(...a) }
    static now() { return clock.t }
  }
  const props = new Map()
  const cache = new Map()
  const fetches = []
  const triggers = []
  const sheetObj = name => ({ getName: () => name, getDataRange: () => ({ getValues: () => sheets[name] }) })
  const spreadsheet = { getName: () => spreadsheetName, getSheets: () => Object.keys(sheets).map(sheetObj) }
  if (timeZone !== undefined) spreadsheet.getSpreadsheetTimeZone = () => timeZone
  const utilities = {
    DigestAlgorithm: { SHA_256: 'sha256' },
    computeDigest: (_alg, text) => [...createHash('sha256').update(text).digest()].map(b => (b > 127 ? b - 256 : b)),
  }
  if (timeZone !== undefined) utilities.formatDate = (d, _tz, _fmt) => d.toISOString().slice(0, 10) // the fake Sheet is in UTC
  const ctx = {
    Date: FakeDate, JSON, Math, String, Object, Array, parseInt, isNaN, encodeURIComponent,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (props.has(k) ? props.get(k) : null),
      setProperty: (k, v) => { props.set(k, String(v)) },
      deleteProperty: k => { props.delete(k) },
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: k => cache.get(k) ?? null, put: (k, v) => { cache.set(k, v) } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet },
    DriveApp: { getFileById: id => {
      if (id === 'missingFile0001') throw new Error('No item with the given ID could be found')
      return { getLastUpdated: () => new RealDate('2026-01-01T00:00:00Z') }
    } },
    Utilities: utilities,
    UrlFetchApp: { fetch: (url, opts) => { fetches.push({ url, opts }); return { getResponseCode: () => 204, getHeaders: () => ({}), getContentText: () => '' } } },
    MailApp: { sendEmail: () => {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }) },
    Logger: { log: () => {} },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: t => triggers.splice(triggers.indexOf(t), 1),
      newTrigger: handler => {
        let kind = ''
        const b = { forSpreadsheet: () => b, onChange: () => { kind = 'change'; return b }, onFormSubmit: () => { kind = 'form'; return b },
          timeBased: () => { kind = 'time'; return b }, everyMinutes: () => b,
          create: () => { triggers.push({ getHandlerFunction: () => handler, getEventType: () => kind }) } }
        return b
      },
      getOAuthToken: () => 'oauth',
    },
  }
  vm.createContext(ctx)
  vm.runInContext(code, ctx)
  props.set('SYNC_TOKEN', 'secret-token')
  props.set('GITHUB_PAT', 'pat')
  props.set('GITHUB_REPO', 'owner/repo')
  return { ctx, clock, props, cache, fetches, triggers, sheets }
}

/** The sync's call: ?action=export with the test token. */
export const exportWith = env => env.ctx.doGet({ parameter: { action: 'export', token: 'secret-token' } })
