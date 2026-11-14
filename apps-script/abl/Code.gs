/**
 * Pramaan (ABL) resource library — Google Apps Script, version 3.
 *
 * THIS FILE IS THE SOURCE OF TRUTH. To update the live script: open the Pramaan Google Sheet →
 * Extensions → Apps Script → replace all of Code.gs with this file → Save → Deploy → Manage
 * deployments → (pencil) Edit → Version: New version → Deploy. Then run `setup` once.
 * Step-by-step: docs/PRAMAAN-HARDENING-PLAN.md Phase 2, docs/ABL-APPSCRIPT-SETUP-GUIDE.md.
 *
 * What it does
 *  - doGet (Web App, "Execute as: Me", "Who has access: Anyone"):
 *      (no action)        public resource listing (cached 15 min) — kept for old browser tabs
 *      ?action=export     token-gated FRESH read: data + photo list + health  ← used by the sync
 *      ?action=fetchImage token-gated: one resource's photo (only ids that exist in the Sheet)
 *      ?action=manifest   token-gated: legacy photo list (older sync versions)
 *  - onSheetChange (installable "On change" trigger): clears the cache and asks GitHub to sync.
 *  - tick (every 5 minutes): sends the one final update after a burst of edits, a daily
 *    heartbeat sync, and token-expiry warnings.
 *  - setup(): installs exactly those two triggers (safe to run again any time).
 *
 * Script Properties (Project Settings → Script Properties):
 *   SYNC_TOKEN       required — same value as the GitHub secret ABL_SYNC_TOKEN
 *   GITHUB_PAT       required for instant updates — fine-grained token, this repo only,
 *                    permission "Actions: Read and write"
 *   GITHUB_REPO      required for instant updates — e.g. vaibhav-sharma0105/tide-testing
 *   GITHUB_WORKFLOW  optional — default sync-abl-thumbnails.yml
 *   GITHUB_REF       optional — default main
 *   ALERT_EMAIL      optional — where problem emails go (default: the script owner)
 *   SHEET_ID         optional — read this Sheet instead of the one the script is attached to
 *   (Everything else in Script Properties is bookkeeping written by this script.)
 *
 * Requires the "Drive API" advanced service (Services → Drive API → Add) for fetchImage.
 */

// ─── Configuration ───────────────────────────────────────────────────────────
var SCRIPT_VERSION = 3;          // the sync refuses to run against an older version
var SCHEMA_VERSION = 1;
var CACHE_DURATION_S = 900;      // 15 minutes (public listing only)
var SKIP_SHEETS = [];            // tab names never published (e.g. 'Form responses 1')
var ID_HEADER = /^UNIQUE ID NO FOR /i; // a tab is published only if a header cell matches this

var DEBOUNCE_MS = 2 * 60 * 1000;  // quiet time after the last edit before the final update
var MAX_WAIT_MS = 10 * 60 * 1000; // during constant edits, send anyway once pending this long (checked by the 5-min tick, so ≤ ~15 min in practice)
var BLOCK_MS = 60 * 60 * 1000;    // after an auth failure, retry at most hourly
var ALERT_EVERY_MS = 24 * 60 * 60 * 1000;
var HEARTBEAT_UTC_HOUR = 3;

var META_CACHE_KEY = 'abl_meta_v3';
function tabCacheKey(tabName) { return 'abl_tab_v3_' + tabName; }

function props_() { return PropertiesService.getScriptProperties(); }

// ─── Entry point ─────────────────────────────────────────────────────────────
function doGet(e) {
  var params = (e && e.parameter) || {};
  try {
    if (params.action === 'export') return jsonOutput(handleExport(e));
    if (params.action === 'fetchImage') return jsonOutput(handleFetchImage(e));
    if (params.action === 'manifest') return jsonOutput(handleManifest(e));
    return jsonOutput(getFromCacheOrFetch());
  } catch (err) {
    return jsonOutput({ success: false, error: String(err && err.message || err), tabs: [], resources: {}, meta: { counts: {}, total: 0 } });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function isAuthorizedSyncRequest(e) {
  var expected = props_().getProperty('SYNC_TOKEN');
  var provided = e && e.parameter && e.parameter.token;
  if (!expected || !provided || expected.length !== provided.length) return false;
  var diff = 0; // compare every character so timing doesn't reveal how much matched
  for (var i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

// ─── Sync actions (token-gated) ──────────────────────────────────────────────
function handleExport(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };
  var data = refreshCacheAndReturn(); // always a fresh read of the Sheet
  var photos = [];
  eachResource_(data, function (r) {
    var fileId = extractDriveFileId(r.photoUrl);
    if (!fileId) return;
    try {
      photos.push({ id: r.id, fileId: fileId, modifiedTime: DriveApp.getFileById(fileId).getLastUpdated().toISOString() });
    } catch (err) {
      photos.push({ id: r.id, fileId: fileId, error: String(err && err.message || err).slice(0, 200) });
    }
  });
  var p = props_();
  return {
    success: true,
    schemaVersion: SCHEMA_VERSION,
    scriptVersion: SCRIPT_VERSION,
    lastUpdated: data.lastUpdated,
    tabs: data.tabs,
    resources: data.resources,
    meta: data.meta,
    excludedTabs: data.excludedTabs,
    photos: photos,
    health: {
      patExpiresAt: p.getProperty('PAT_EXPIRES_AT'),
      lastDispatchStatus: p.getProperty('LAST_DISPATCH_STATUS'),
      pendingSince: p.getProperty('PENDING_SINCE'),
    },
  };
}

function handleManifest(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };
  var data = getFromCacheOrFetch();
  var manifest = [];
  eachResource_(data, function (r) {
    var fileId = extractDriveFileId(r.photoUrl);
    if (!fileId) return;
    try {
      manifest.push({ id: r.id, fileId: fileId, modifiedTime: DriveApp.getFileById(fileId).getLastUpdated().toISOString() });
    } catch (err) {
      Logger.log('Could not read file for resource ' + r.id + ': ' + (err && err.message));
    }
  });
  return { success: true, manifest: manifest };
}

function handleFetchImage(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };
  var id = e.parameter.id;
  if (!id) return { success: false, error: 'Missing id' };

  // Only ids that exist in the Sheet — never a client-supplied Drive fileId — so a leaked token
  // can't pull arbitrary Drive files. If the cache predates a new row, re-read once.
  var resource = findResource_(getFromCacheOrFetch(), id) || findResource_(refreshCacheAndReturn(), id);
  if (!resource) return { success: false, error: 'Unknown resource id' };
  var fileId = extractDriveFileId(resource.photoUrl);
  if (!fileId) return { success: false, error: 'Resource has no photo' };

  try {
    var file = DriveApp.getFileById(fileId);
    var meta = Drive.Files.get(fileId, { fields: 'thumbnailLink' });
    if (!meta.thumbnailLink) return { success: false, error: 'Drive has no thumbnail for this file' };
    // Google's own renderer turns any file (PDF, HEIC…) into a raster preview.
    var thumbUrl = meta.thumbnailLink.replace(/=s\d+$/, '=s1600');
    var resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      // Some thumbnail links need the script's own Google credentials.
      resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    }
    if (resp.getResponseCode() !== 200) return { success: false, error: 'Thumbnail render fetch failed: HTTP ' + resp.getResponseCode() };
    var blob = resp.getBlob();
    return { success: true, id: id, mimeType: blob.getContentType(), modifiedTime: file.getLastUpdated().toISOString(), base64: Utilities.base64Encode(blob.getBytes()) };
  } catch (err) {
    return { success: false, error: 'Could not read file: ' + (err && err.message) };
  }
}

function findResource_(data, id) {
  var found = null;
  eachResource_(data, function (r) { if (!found && r.id === id) found = r; });
  return found;
}

function eachResource_(data, fn) {
  (data.tabs || []).forEach(function (tab) { (data.resources[tab] || []).forEach(fn); });
}

function extractDriveFileId(url) {
  if (!url) return null;
  var match = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── Reading the Sheet + cache ───────────────────────────────────────────────
function getSpreadsheet_() {
  var id = props_().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No Sheet: set the Script Property SHEET_ID to the Pramaan Sheet id.');
  return ss;
}

function getFromCacheOrFetch() {
  var cache = CacheService.getScriptCache();
  var metaJson = cache.get(META_CACHE_KEY);
  if (metaJson) {
    var meta = JSON.parse(metaJson);
    var resources = {};
    var allHit = meta.tabs.every(function (tab) {
      var json = cache.get(tabCacheKey(tab));
      if (!json) return false;
      resources[tab] = JSON.parse(json);
      return true;
    });
    if (allHit) return { success: true, lastUpdated: meta.lastUpdated, tabs: meta.tabs, resources: resources, meta: meta.counts, excludedTabs: meta.excludedTabs || [] };
  }
  return refreshCacheAndReturn();
}

function refreshCacheAndReturn() {
  var cache = CacheService.getScriptCache();
  var tabs = [], resources = {}, excludedTabs = [];
  var counts = { counts: {}, total: 0 };
  var now = new Date().toISOString();

  getSpreadsheet_().getSheets().forEach(function (sheet) {
    var name = sheet.getName();
    if (SKIP_SHEETS.indexOf(name) !== -1) return;
    var parsed = parseSheet(sheet);
    if (!parsed.hasIdColumn) { excludedTabs.push(name); return; }
    if (parsed.rows.length === 0) return;
    tabs.push(name);
    resources[name] = parsed.rows;
    counts.counts[name] = parsed.rows.length;
    counts.total += parsed.rows.length;
    try { cache.put(tabCacheKey(name), JSON.stringify(parsed.rows), CACHE_DURATION_S); }
    catch (err) { Logger.log('Cache put failed for tab ' + name + ' (over 100 KB?): ' + (err && err.message)); }
  });

  cache.put(META_CACHE_KEY, JSON.stringify({ tabs: tabs, lastUpdated: now, counts: counts, excludedTabs: excludedTabs }), CACHE_DURATION_S);
  return { success: true, lastUpdated: now, tabs: tabs, resources: resources, meta: counts, excludedTabs: excludedTabs };
}

function invalidateCache_() {
  var cache = CacheService.getScriptCache();
  var keys = [META_CACHE_KEY];
  var metaJson = cache.get(META_CACHE_KEY);
  if (metaJson) {
    try { JSON.parse(metaJson).tabs.forEach(function (t) { keys.push(tabCacheKey(t)); }); } catch (err) { /* corrupt meta: removing it is enough */ }
  }
  cache.removeAll(keys);
}

// ─── Sheet parsing ───────────────────────────────────────────────────────────
function parseSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  if (!data.length) return { hasIdColumn: false, rows: [] };
  var headers = data[0].map(function (h) { return h ? String(h).trim() : ''; });
  var idCol = -1;
  for (var c = 0; c < headers.length; c++) { if (ID_HEADER.test(headers[c])) { idCol = c; break; } }
  if (idCol === -1) return { hasIdColumn: false, rows: [] };

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = str(row[idCol]);
    if (!id) continue;
    var obj = {};
    headers.forEach(function (header, idx) { if (header) obj[header] = row[idx]; });
    rows.push(buildResource(obj, id));
  }
  return { hasIdColumn: true, rows: rows };
}

function buildResource(obj, id) {
  return {
    id: id,
    name: str(obj['NAME OF RESOURCES']),
    type: str(obj['TYPE OF RESOURCES']),
    concept: str(obj['CONCEPT']),
    language: str(obj['LANGUAGE']),
    ownership: str(obj['OWNERSHIP']),
    quantity: obj['QUANTITY OF SET'] ? parseInt(obj['QUANTITY OF SET'], 10) || null : null,
    storageLocation: str(obj['STORAGE LOCATION']),
    photoUrl: str(obj['LINK OF Photos from drive'] || obj['LINK OF PHOTO FROM THE DRIVE']),
    videoUrl: str(obj['EXPLAINATION VIDEO LINK FROM THE DRIVE']),
    canvaUrl: str(obj['CANVA LINK FROM THE DRIVE'] || obj['CANVA LINK'] || obj['Canva/purchase']),
    grades: parseList(obj['GRADES'], true),
    chapters: {
      'GRADE 1': parseList(obj['Chapters in Grade 1'], false),
      'GRADE 2': parseList(obj['Chapters in Grade 2'], false),
      'GRADE 3': parseList(obj['Chapters in Grade 3'], false),
      'GRADE 4': parseList(obj['Chapters in Grade 4'], false),
      'GRADE 5': parseList(obj['Chapters in Grade 5'], false),
    },
    description: str(obj['BRIEF DESCRIPTION'] || obj['BRIFE DESCRIPTION']), // "BRIFE" typo exists in the Sheet
    referenceLink: str(obj['REFERENCE LINK IF NOT OWNED BY TIDE']),
  };
}

function str(val) {
  if (val === null || val === undefined || val === '') return null;
  var s = String(val).trim();
  return s === '' ? null : s;
}

function parseList(val, uppercase) {
  if (!val) return [];
  return String(val).split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; })
    .map(function (s) { return uppercase ? s.toUpperCase() : s; });
}

// ─── Telling GitHub to sync: leading + trailing debounce ─────────────────────
// Every edit either triggers an update right away (if none was sent in the last 2 minutes) or is
// marked PENDING; the 5-minute tick then sends exactly one final update once edits stop for 2
// minutes (≈ 2–7 min later), or — during constant editing — once edits have been pending 10
// minutes (≈ 10–15 min, since the tick runs every 5 minutes). PENDING is cleared only by a successful update sent after the
// last edit, so no edit can be dropped. See docs/PRAMAAN-HARDENING-PLAN.md §6.2.

function onSheetChange(e) {
  invalidateCache_();
  var p = props_();
  var now = Date.now();
  p.setProperty('LAST_EDIT_AT', String(now));

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { setIfAbsent_(p, 'PENDING_SINCE', now); return; }
  var fire = false;
  try {
    var last = num_(p.getProperty('LAST_DISPATCH_AT'));
    var blockedUntil = num_(p.getProperty('BLOCKED_UNTIL'));
    if (!p.getProperty('PENDING_SINCE') && now - last >= DEBOUNCE_MS && now >= blockedUntil) {
      p.setProperty('LAST_DISPATCH_AT', String(now));
      fire = true;
    } else {
      setIfAbsent_(p, 'PENDING_SINCE', now);
    }
  } finally { lock.releaseLock(); }
  if (fire) dispatch_(String(now), 'edit');
}

function tick() {
  var p = props_();
  var now = Date.now();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  var snap = null, reason = null;
  try {
    var pending = num_(p.getProperty('PENDING_SINCE'));
    var lastEdit = num_(p.getProperty('LAST_EDIT_AT'));
    var blockedUntil = num_(p.getProperty('BLOCKED_UNTIL'));
    var today = new Date(now).toISOString().slice(0, 10);
    if (pending && now >= blockedUntil && (now - lastEdit >= DEBOUNCE_MS || now - pending >= MAX_WAIT_MS)) {
      reason = 'pending edits';
    } else if (new Date(now).getUTCHours() === HEARTBEAT_UTC_HOUR && p.getProperty('LAST_HEARTBEAT_DAY') !== today && now >= blockedUntil) {
      p.setProperty('LAST_HEARTBEAT_DAY', today);
      reason = 'daily heartbeat';
    }
    if (reason) {
      snap = p.getProperty('LAST_EDIT_AT') || '';
      p.setProperty('LAST_DISPATCH_AT', String(now));
    }
  } finally { lock.releaseLock(); }
  if (reason) dispatch_(snap, reason);
  checkPatExpiry_();
}

/**
 * Calls GitHub's "run workflow" endpoint. Never throws. Returns the HTTP code (0 on exception).
 * Success is any 2xx: GitHub historically answered 204, and its current docs (checked 2026-11-15)
 * describe 200 with the new run's id — both must count, or a success would look like a failure
 * and be retried every 5 minutes.
 */
function dispatch_(snap, reason) {
  var p = props_();
  var token = p.getProperty('GITHUB_PAT');
  var repo = p.getProperty('GITHUB_REPO');
  var workflow = p.getProperty('GITHUB_WORKFLOW') || 'sync-abl-thumbnails.yml';
  var ref = p.getProperty('GITHUB_REF') || 'main';
  if (!token || !repo) {
    p.setProperty('LAST_DISPATCH_STATUS', 'not configured (GITHUB_PAT / GITHUB_REPO missing) @ ' + new Date().toISOString());
    setIfAbsent_(p, 'PENDING_SINCE', Date.now());
    return 0;
  }
  var code = 0;
  try {
    var resp = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/actions/workflows/' + encodeURIComponent(workflow) + '/dispatches', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      payload: JSON.stringify({ ref: ref }),
      muteHttpExceptions: true,
    });
    code = resp.getResponseCode();
    recordPatExpiry_(resp.getHeaders());
    if (code >= 200 && code < 300) {
      var lock = LockService.getScriptLock();
      if (lock.tryLock(5000)) {
        try { if ((p.getProperty('LAST_EDIT_AT') || '') === (snap || '')) p.deleteProperty('PENDING_SINCE'); }
        finally { lock.releaseLock(); }
      }
      p.setProperty('LAST_DISPATCH_STATUS', 'OK (' + reason + ') @ ' + new Date().toISOString());
    } else {
      setIfAbsent_(p, 'PENDING_SINCE', Date.now());
      p.setProperty('LAST_DISPATCH_STATUS', 'HTTP ' + code + ' (' + reason + ') @ ' + new Date().toISOString());
      if (code === 401 || code === 403 || code === 404) {
        p.setProperty('BLOCKED_UNTIL', String(Date.now() + BLOCK_MS));
        alert_('GitHub refused the update (HTTP ' + code + ')',
          'The Pramaan Sheet could not ask GitHub to update the website. Most likely the GitHub token (GITHUB_PAT) expired, was deleted, or lacks the "Actions: Read and write" permission, or GITHUB_REPO / GITHUB_WORKFLOW is wrong.\n\n' +
          'The website still updates every 6 hours on its own, so nothing is lost — edits will just be slower until this is fixed.\n\n' +
          'Fix: docs/MAINTENANCE-GITHUB-PAT-REFRESH.md in the website repository.\n\nGitHub said: ' + resp.getContentText().slice(0, 300));
      }
    }
  } catch (err) {
    setIfAbsent_(p, 'PENDING_SINCE', Date.now());
    p.setProperty('LAST_DISPATCH_STATUS', 'error: ' + String(err && err.message).slice(0, 200) + ' @ ' + new Date().toISOString());
  }
  return code;
}

// If GitHub reports the token's expiry in a response header (e.g. "2027-01-01 00:00:00 UTC"), keep it
// for the expiry warnings. Not documented on GitHub's REST pages (checked 2026-11-15) — when the
// header is absent nothing is recorded and the owner's calendar entry is the safeguard.
function recordPatExpiry_(headers) {
  if (!headers) return;
  var raw = null;
  Object.keys(headers).forEach(function (k) { if (k.toLowerCase() === 'github-authentication-token-expiration') raw = headers[k]; });
  if (!raw) return;
  var iso = new Date(String(raw).replace(' UTC', 'Z').replace(' ', 'T')).toISOString();
  var p = props_();
  if (p.getProperty('PAT_EXPIRES_AT') !== iso) {
    p.setProperty('PAT_EXPIRES_AT', iso);
    p.deleteProperty('PAT_WARNED_BUCKET'); // a renewed token starts warnings afresh
  }
}

function checkPatExpiry_() {
  var p = props_();
  var exp = p.getProperty('PAT_EXPIRES_AT');
  if (!exp) return;
  var days = Math.floor((Date.parse(exp) - Date.now()) / 86400000);
  var bucket = days <= 1 ? '1' : days <= 7 ? '7' : days <= 30 ? '30' : null;
  if (!bucket || p.getProperty('PAT_WARNED_BUCKET') === bucket) return;
  p.setProperty('PAT_WARNED_BUCKET', bucket);
  sendMail_('GitHub token expires in ' + Math.max(days, 0) + ' day(s)',
    'The GitHub token (GITHUB_PAT) that lets the Pramaan Sheet update the website expires on ' + exp + '.\n\n' +
    'Renew it before then: docs/MAINTENANCE-GITHUB-PAT-REFRESH.md in the website repository (about 10 minutes).');
}

function alert_(subject, body) {
  var p = props_();
  if (Date.now() - num_(p.getProperty('LAST_ALERT_AT')) < ALERT_EVERY_MS) return; // max one per day
  p.setProperty('LAST_ALERT_AT', String(Date.now()));
  sendMail_(subject, body);
}

function sendMail_(subject, body) {
  var to = props_().getProperty('ALERT_EMAIL') || Session.getEffectiveUser().getEmail();
  try { MailApp.sendEmail(to, '[Pramaan website] ' + subject, body); }
  catch (err) { Logger.log('Could not send alert email: ' + (err && err.message)); }
}

function setIfAbsent_(p, key, value) { if (!p.getProperty(key)) p.setProperty(key, String(value)); }
function num_(v) { var n = parseInt(v || '0', 10); return isNaN(n) ? 0 : n; }

// ─── One-click helpers for the owner (Run ▶ in the editor) ───────────────────

/** Installs exactly the two triggers this script needs and removes old ones. Safe to re-run. */
function setup() {
  var old = ['onSheetChange', 'tick', 'scheduledRefresh'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (old.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetChange').forSpreadsheet(getSpreadsheet_()).onChange().create();
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(5).create();
  showStatus();
}

/** Sends one update request to GitHub right now and logs the result (for diagnosis). */
function testDispatch() {
  var code = dispatch_(props_().getProperty('LAST_EDIT_AT') || '', 'manual test');
  Logger.log(code >= 200 && code < 300
    ? 'SUCCESS (HTTP ' + code + '): GitHub accepted. Open the repository → Actions — "Sync ABL Thumbnails" should start within a minute.'
    : 'FAILED (HTTP ' + code + '). Status: ' + props_().getProperty('LAST_DISPATCH_STATUS'));
}

/** Logs the current configuration (never the secret values) and trigger list. */
function showStatus() {
  var p = props_();
  var has = function (k) { return p.getProperty(k) ? 'set' : 'MISSING'; };
  Logger.log([
    'Pramaan Apps Script v' + SCRIPT_VERSION,
    'SYNC_TOKEN: ' + has('SYNC_TOKEN') + '   GITHUB_PAT: ' + has('GITHUB_PAT') + '   GITHUB_REPO: ' + (p.getProperty('GITHUB_REPO') || 'MISSING'),
    'GITHUB_WORKFLOW: ' + (p.getProperty('GITHUB_WORKFLOW') || 'sync-abl-thumbnails.yml (default)') + '   ALERT_EMAIL: ' + has('ALERT_EMAIL'),
    'Sheet: ' + getSpreadsheet_().getName(),
    'Token expires: ' + (p.getProperty('PAT_EXPIRES_AT') || 'unknown until the first successful update'),
    'Last update request: ' + (p.getProperty('LAST_DISPATCH_STATUS') || 'none yet'),
    'Pending edits since: ' + (p.getProperty('PENDING_SINCE') ? new Date(num_(p.getProperty('PENDING_SINCE'))).toISOString() : 'none'),
    'Triggers: ' + ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction() + ' (' + t.getEventType() + ')'; }).join(', '),
  ].join('\n'));
}
