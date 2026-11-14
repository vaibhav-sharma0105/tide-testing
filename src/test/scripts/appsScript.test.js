// Runs the real apps-script/abl/Code.gs inside a Node vm sandbox with fake Google services and a
// controllable clock, so the debounce / cache / dispatch logic is tested here — it can't be run on
// Google from CI. If Code.gs gains a dependency on another Google service, add a fake below.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const CODE = fs.readFileSync(path.resolve('apps-script/abl/Code.gs'), 'utf8')
const T0 = Date.parse('2026-11-15T10:00:00.000Z')
const MIN = 60_000

function header(tabKind) {
  return [`UNIQUE ID NO FOR ${tabKind}`, 'NAME OF RESOURCES', 'TYPE OF RESOURCES', 'LINK OF PHOTO FROM THE DRIVE', 'GRADES']
}

function makeEnv() {
  const clock = { t: T0 }
  const RealDate = Date
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(clock.t); else super(...a) }
    static now() { return clock.t }
  }

  const props = new Map()
  const cache = new Map()
  const fetches = []
  const mails = []
  const triggers = []
  let fetchImpl = () => ({ code: 204, headers: {} })
  const sheets = {
    Worksheet: [header('WORKSHEET'), ['W1', 'Counting', 'Worksheet', 'https://drive.google.com/file/d/fileW1/view', 'grade 1, Grade 2'], ['W2', 'Shapes', 'Worksheet', '', 'GRADE 3']],
    Games: [header('GAMES'), ['G1', 'Dice', 'Game', 'https://drive.google.com/file/d/badFile/view', '']],
    Notes: [['Anything', 'Else'], ['x', 'y']],
  }
  const sheetObj = name => ({ getName: () => name, getDataRange: () => ({ getValues: () => sheets[name] }) })
  const spreadsheet = { getName: () => 'Pramaan', getSheets: () => Object.keys(sheets).map(sheetObj) }

  const ctx = {
    Date: FakeDate, JSON, Math, String, Object, Array, parseInt, isNaN, encodeURIComponent,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (props.has(k) ? props.get(k) : null),
      setProperty: (k, v) => { props.set(k, String(v)) },
      deleteProperty: k => { props.delete(k) },
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({
      get: k => (cache.has(k) ? cache.get(k) : null),
      put: (k, v) => { cache.set(k, v) },
      removeAll: keys => keys.forEach(k => cache.delete(k)),
    }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet },
    DriveApp: { getFileById: id => {
      if (id === 'badFile') throw new Error('No item with the given ID could be found')
      return { getLastUpdated: () => new RealDate('2026-01-01T00:00:00Z') }
    } },
    UrlFetchApp: { fetch: (url, opts) => {
      fetches.push({ url, opts })
      const r = fetchImpl(url, opts)
      return { getResponseCode: () => r.code, getHeaders: () => r.headers || {}, getContentText: () => r.body || '' }
    } },
    MailApp: { sendEmail: (to, subject, body) => mails.push({ to, subject, body }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }) },
    Logger: { log: () => {} },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: t => triggers.splice(triggers.indexOf(t), 1),
      newTrigger: handler => {
        const b = { forSpreadsheet: () => b, onChange: () => b, timeBased: () => b, everyMinutes: () => b,
          create: () => { triggers.push({ getHandlerFunction: () => handler, getEventType: () => 'X' }) } }
        return b
      },
      getOAuthToken: () => 'oauth',
    },
  }
  vm.createContext(ctx)
  vm.runInContext(CODE, ctx)
  props.set('SYNC_TOKEN', 'secret-token')
  props.set('GITHUB_PAT', 'pat')
  props.set('GITHUB_REPO', 'owner/repo')
  return { ctx, clock, props, cache, fetches, mails, triggers, sheets, setFetch: f => { fetchImpl = f } }
}

const dispatches = env => env.fetches.filter(f => f.url.includes('/dispatches'))

describe('Apps Script v3 — reading the Sheet', () => {
  let env
  beforeEach(() => { env = makeEnv() })

  it('publishes only tabs with a "UNIQUE ID NO FOR" header and reports the others', () => {
    const out = env.ctx.doGet({ parameter: {} })
    expect(out.tabs).toEqual(['Worksheet', 'Games'])
    expect(out.excludedTabs).toEqual(['Notes'])
    expect(out.resources.Worksheet[0]).toMatchObject({ id: 'W1', name: 'Counting', grades: ['GRADE 1', 'GRADE 2'] })
    expect(out.meta).toEqual({ counts: { Worksheet: 2, Games: 1 }, total: 3 })
  })

  it('export needs the token (wrong value and wrong length both rejected)', () => {
    expect(env.ctx.doGet({ parameter: { action: 'export' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-tokeX' } }).success).toBe(false)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'short' } }).success).toBe(false)
  })

  it('export returns version, data and per-photo results including Drive errors', () => {
    const out = env.ctx.doGet({ parameter: { action: 'export', token: 'secret-token' } })
    expect(out.success).toBe(true)
    expect(out.scriptVersion).toBe(3)
    expect(out.photos).toEqual([
      { id: 'W1', fileId: 'fileW1', modifiedTime: '2026-01-01T00:00:00.000Z' },
      { id: 'G1', fileId: 'badFile', error: expect.stringContaining('No item') },
    ])
  })

  it('GAP 1: export is always fresh even while the public listing is cached', () => {
    env.ctx.doGet({ parameter: {} }) // primes the cache
    env.sheets.Worksheet.push(['W3', 'New one', 'Worksheet', '', ''])
    expect(env.ctx.doGet({ parameter: {} }).meta.total).toBe(3) // cached (old)
    expect(env.ctx.doGet({ parameter: { action: 'export', token: 'secret-token' } }).meta.total).toBe(4)
  })

  it('GAP 1: an edit clears the cache so the public listing is fresh too', () => {
    env.ctx.doGet({ parameter: {} })
    env.sheets.Worksheet.push(['W3', 'New one', 'Worksheet', '', ''])
    env.ctx.onSheetChange({})
    expect(env.ctx.doGet({ parameter: {} }).meta.total).toBe(4)
  })

  it('fetchImage re-reads once when the cache predates a new row', () => {
    env.ctx.doGet({ parameter: {} })
    env.sheets.Worksheet.push(['W9', 'Late row', 'Worksheet', '', ''])
    const out = env.ctx.doGet({ parameter: { action: 'fetchImage', id: 'W9', token: 'secret-token' } })
    expect(out.error).toBe('Resource has no photo') // found after the fresh re-read (not "Unknown resource id")
  })
})

describe('Apps Script v3 — GAP 2: no edit is ever dropped', () => {
  let env
  beforeEach(() => { env = makeEnv() })

  it('treats HTTP 200 (current GitHub docs) as success — no endless re-sending', () => {
    env.setFetch(() => ({ code: 200, body: '{"workflow_run_id":1}' }))
    env.ctx.onSheetChange({})
    env.clock.t += 30_000; env.ctx.onSheetChange({}) // pending
    env.clock.t += 3 * MIN; env.ctx.tick()
    expect(env.props.has('PENDING_SINCE')).toBe(false)
    expect(env.props.get('LAST_DISPATCH_STATUS')).toMatch(/^OK/)
    for (let i = 0; i < 6; i++) { env.clock.t += 5 * MIN; env.ctx.tick() }
    expect(dispatches(env)).toHaveLength(2) // nothing re-sent afterwards
  })

  it('dispatches to the workflow_dispatch endpoint with ref main', () => {
    env.ctx.onSheetChange({})
    const d = dispatches(env)
    expect(d).toHaveLength(1)
    expect(d[0].url).toBe('https://api.github.com/repos/owner/repo/actions/workflows/sync-abl-thumbnails.yml/dispatches')
    expect(JSON.parse(d[0].opts.payload)).toEqual({ ref: 'main' })
  })

  it('first edit fires at once; a second edit 30 s later is sent by the tick after 2 quiet minutes', () => {
    env.ctx.onSheetChange({})
    expect(dispatches(env)).toHaveLength(1)
    env.clock.t += 30_000
    env.ctx.onSheetChange({})
    expect(dispatches(env)).toHaveLength(1)
    expect(env.props.get('PENDING_SINCE')).toBeTruthy()
    env.clock.t += 1 * MIN; env.ctx.tick() // only 1 min since the last edit
    expect(dispatches(env)).toHaveLength(1)
    env.clock.t += 2 * MIN; env.ctx.tick()
    expect(dispatches(env)).toHaveLength(2)
    expect(env.props.has('PENDING_SINCE')).toBe(false)
    env.clock.t += 5 * MIN; env.ctx.tick() // nothing more to send
    expect(dispatches(env)).toHaveLength(2)
  })

  it('an edit that lands while a dispatch is in flight keeps the pending flag', () => {
    env.ctx.onSheetChange({})
    env.clock.t += 30_000
    env.ctx.onSheetChange({}) // pending
    env.clock.t += 3 * MIN
    env.setFetch(() => { env.props.set('LAST_EDIT_AT', String(env.clock.t + 1)); return { code: 204 } }) // edit during the call
    env.ctx.tick()
    expect(env.props.get('PENDING_SINCE')).toBeTruthy()
    env.setFetch(() => ({ code: 204 }))
    env.clock.t += 5 * MIN; env.ctx.tick()
    expect(env.props.has('PENDING_SINCE')).toBe(false)
  })

  it('constant editing still sends an update: pending 10+ min, sent by the next 5-minute tick (≤ 15 min)', () => {
    env.ctx.onSheetChange({})
    const start = env.clock.t
    let sentAt = null
    for (let i = 1; i <= 15 && sentAt === null; i++) {
      env.clock.t = start + i * MIN
      env.ctx.onSheetChange({})
      if (i % 5 === 0) { env.ctx.tick(); if (dispatches(env).length === 2) sentAt = i }
    }
    // pending began at minute 1, so the max-wait threshold passes at 11 and the tick at 15 sends it
    expect(sentAt).toBe(15)
  })

  it('auth failure: keeps edits pending, blocks for an hour, emails once a day', () => {
    env.props.set('ALERT_EMAIL', 'alerts@example.com')
    env.setFetch(() => ({ code: 401, body: 'Bad credentials' }))
    env.ctx.onSheetChange({})
    expect(env.props.get('PENDING_SINCE')).toBeTruthy()
    expect(Number(env.props.get('BLOCKED_UNTIL'))).toBe(T0 + 60 * MIN)
    expect(env.mails).toHaveLength(1)
    expect(env.mails[0].to).toBe('alerts@example.com')
    env.clock.t += 61 * MIN; env.ctx.tick() // retries after the block, fails again
    expect(dispatches(env)).toHaveLength(2)
    expect(env.mails).toHaveLength(1) // still one email within 24 h
    env.setFetch(() => ({ code: 204 }))
    env.clock.t += 61 * MIN; env.ctx.tick()
    expect(env.props.has('PENDING_SINCE')).toBe(false)
  })

  it('missing GitHub settings: nothing is sent, edits stay pending, status explains why', () => {
    env.props.delete('GITHUB_PAT')
    env.ctx.onSheetChange({})
    expect(dispatches(env)).toHaveLength(0)
    expect(env.props.get('PENDING_SINCE')).toBeTruthy()
    expect(env.props.get('LAST_DISPATCH_STATUS')).toMatch(/not configured/)
  })

  it('daily heartbeat dispatch at 03:xx UTC, once per day', () => {
    env.clock.t = Date.parse('2026-11-16T03:02:00Z')
    env.ctx.tick(); env.clock.t += 5 * MIN; env.ctx.tick()
    expect(dispatches(env)).toHaveLength(1)
    env.clock.t = Date.parse('2026-11-17T03:01:00Z'); env.ctx.tick()
    expect(dispatches(env)).toHaveLength(2)
  })
})

describe('Apps Script v3 — token expiry and setup', () => {
  it('records the expiry header and warns at 30 / 7 / 1 days, once each', () => {
    const env = makeEnv()
    env.setFetch(() => ({ code: 204, headers: { 'GitHub-Authentication-Token-Expiration': '2026-12-10 00:00:00 UTC' } }))
    env.ctx.onSheetChange({})
    expect(env.props.get('PAT_EXPIRES_AT')).toBe('2026-12-10T00:00:00.000Z')
    env.ctx.tick() // 24 days left → 30-day warning
    env.clock.t += 5 * MIN; env.ctx.tick()
    expect(env.mails.filter(m => m.subject.includes('expires'))).toHaveLength(1)
    env.clock.t = Date.parse('2026-12-05T10:00:00Z'); env.ctx.tick() // 4 days → 7-day warning
    env.clock.t = Date.parse('2026-12-09T10:00:00Z'); env.ctx.tick() // 0 days → 1-day warning
    expect(env.mails.filter(m => m.subject.includes('expires'))).toHaveLength(3)
  })

  it('setup installs exactly two triggers and is safe to re-run', () => {
    const env = makeEnv()
    env.ctx.setup(); env.ctx.setup()
    expect(env.triggers.map(t => t.getHandlerFunction()).sort()).toEqual(['onSheetChange', 'tick'])
  })
})
