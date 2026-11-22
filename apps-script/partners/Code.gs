/**
 * TIDE / THRIvE Partners — Google Apps Script, version 1.
 *
 * THIS FILE IS THE SOURCE OF TRUTH. It belongs to the Sheet
 * "TIDE/THRIvE Partners (Responses)" (the responses of the partners Google Form).
 * Click-by-click install: docs/PARTNERS-SETUP-GUIDE.md. Column rules: docs/PARTNERS-SHEET-SCHEMA.md.
 *
 * PRIVACY: only the columns in COLUMNS are read. The internal columns ("Column 2", "Notes for …")
 * are never read, and the Timestamp is never output (it only becomes an anonymous id). There is NO
 * public listing at all — every action needs the SYNC_TOKEN.
 *
 * Which rows are published (owner decision, 2026-11-21): every response with a "Type of partner"
 * and a "Name of the partner". To take a row off the website without deleting the response, add a
 * column headed "Hide from website" and type Yes in it.
 *
 * What it does
 *  - doGet (Web App, "Execute as: Me", "Who has access: Anyone" — the token is the lock):
 *      ?action=export      token-gated FRESH read: publishable rows + logo list + counts + health
 *      ?action=fetchImage  token-gated: one partner's logo (only ids that are publishable now)
 *      anything else       { success: false }
 *  - onSheetChange (installable "On change" AND "On form submit" triggers): asks GitHub to sync.
 *  - tick (every 5 minutes): sends the final update after a burst of edits, a daily heartbeat,
 *    and token-expiry warnings.
 *  - setup(): installs exactly those three triggers (safe to run again any time).
 *
 * Script Properties (Project Settings → Script Properties):
 *   SYNC_TOKEN       required — same value as the GitHub secret PARTNERS_SYNC_TOKEN
 *   GITHUB_PAT       required for instant updates — fine-grained token, this repo only,
 *                    permission "Actions: Read and write"
 *   GITHUB_REPO      required for instant updates — e.g. owner/repository
 *   GITHUB_WORKFLOW  optional — default sync-partners.yml
 *   GITHUB_REF       optional — default main
 *   ALERT_EMAIL      optional — where problem emails go (default: the script owner)
 *   SHEET_ID         optional — read this Sheet instead of the one the script is attached to
 *   (Everything else in Script Properties is bookkeeping written by this script.)
 *
 * Requires the "Drive API" advanced service (Services → Drive API → Add) for fetchImage.
 */

// ─── Configuration ───────────────────────────────────────────────────────────
var SCRIPT_VERSION = 1;          // the sync refuses to run against an older version
var SCHEMA_VERSION = 1;

var DEBOUNCE_MS = 2 * 60 * 1000;  // quiet time after the last edit before the final update
var MAX_WAIT_MS = 10 * 60 * 1000; // during constant edits, send anyway once pending this long
var BLOCK_MS = 60 * 60 * 1000;    // after an auth failure, retry at most hourly
var ALERT_EVERY_MS = 24 * 60 * 60 * 1000;
var HEARTBEAT_UTC_HOUR = 6;       // Pramaan Library uses 04:00, Publications 05:00
var PHOTO_CACHE_KEY = 'partners_logos_v1';
var PHOTO_CACHE_S = 1800;
// Logos up to this size are sent as the original file (keeps transparency); anything else (bigger
// files, SVG, PDF…) goes through Google's own thumbnail renderer.
var ORIGINAL_MAX_BYTES = 8 * 1024 * 1024;
var ORIGINAL_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Columns are found by their header TEXT (case-insensitive, start of the header), never by
// letter, so inserting or moving a column is safe. If a REQUIRED header can't be found, export
// fails loudly and nothing is published. Columns not listed here are never read.
var COLUMNS = {
  timestamp: { re: /^timestamp$/i },  // used ONLY to make an anonymous id; never output
  type:      { re: /^type of partner/i, required: true },
  priority:  { re: /^priority/i, required: true },
  name:      { re: /^name of the partner/i, required: true },
  website:   { re: /^website/i },
  logo:      { re: /^logo/i, required: true },
  hide:      { re: /^hide from (the )?website/i },
};
var YES = /^\s*yes\b/i;

function props_() { return PropertiesService.getScriptProperties(); }

// ─── Entry point ─────────────────────────────────────────────────────────────
function doGet(e) {
  var params = (e && e.parameter) || {};
  try {
    if (params.action === 'export') return jsonOutput(handleExport(e));
    if (params.action === 'fetchImage') return jsonOutput(handleFetchImage(e));
    return jsonOutput({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOutput({ success: false, error: String(err && err.message || err) });
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
  var data = readSheet_();
  var photos = [];
  var photoMap = {};
  data.resources.forEach(function (r) {
    var fileId = extractDriveFileId(r.photoUrl);
    if (!fileId) return;
    photoMap[r.id] = fileId;
    try {
      photos.push({ id: r.id, fileId: fileId, modifiedTime: DriveApp.getFileById(fileId).getLastUpdated().toISOString() });
    } catch (err) {
      photos.push({ id: r.id, fileId: fileId, error: String(err && err.message || err).slice(0, 200) });
    }
  });
  putPhotoMap_(photoMap);
  var p = props_();
  return {
    success: true,
    schemaVersion: SCHEMA_VERSION,
    scriptVersion: SCRIPT_VERSION,
    resources: data.resources,
    stats: data.stats,
    problems: data.problems,
    photos: photos,
    health: {
      patExpiresAt: p.getProperty('PAT_EXPIRES_AT'),
      lastDispatchStatus: p.getProperty('LAST_DISPATCH_STATUS'),
      pendingSince: p.getProperty('PENDING_SINCE'),
    },
  };
}

function handleFetchImage(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };
  var id = e.parameter.id;
  if (!id) return { success: false, error: 'Missing id' };

  // Only ids of publishable rows — never a client-supplied Drive fileId — so a leaked token can't
  // pull arbitrary Drive files. The map is cached by export; re-read once if missing.
  var map = getPhotoMap_();
  var fileId = map && map[id];
  if (!fileId) {
    map = {};
    readSheet_().resources.forEach(function (r) { var f = extractDriveFileId(r.photoUrl); if (f) map[r.id] = f; });
    putPhotoMap_(map);
    fileId = map[id];
  }
  if (!fileId) return { success: false, error: 'Unknown partner id or no logo' };

  try {
    var file = DriveApp.getFileById(fileId);
    var modified = file.getLastUpdated().toISOString();
    // A plain raster logo is sent as the original file, so a transparent background stays transparent.
    if (ORIGINAL_TYPES.indexOf(file.getMimeType()) !== -1 && file.getSize() <= ORIGINAL_MAX_BYTES) {
      var original = file.getBlob();
      return { success: true, id: id, mimeType: original.getContentType(), modifiedTime: modified, base64: Utilities.base64Encode(original.getBytes()) };
    }
    var meta = Drive.Files.get(fileId, { fields: 'thumbnailLink' });
    if (!meta.thumbnailLink) return { success: false, error: 'Drive has no thumbnail for this file' };
    // Google's own renderer turns any file (SVG, PDF, HEIC…) into a raster preview.
    var thumbUrl = meta.thumbnailLink.replace(/=s\d+$/, '=s1600');
    var resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    }
    if (resp.getResponseCode() !== 200) return { success: false, error: 'Thumbnail render fetch failed: HTTP ' + resp.getResponseCode() };
    var blob = resp.getBlob();
    return { success: true, id: id, mimeType: blob.getContentType(), modifiedTime: modified, base64: Utilities.base64Encode(blob.getBytes()) };
  } catch (err) {
    return { success: false, error: 'Could not read file: ' + (err && err.message) };
  }
}

function getPhotoMap_() {
  var json = CacheService.getScriptCache().get(PHOTO_CACHE_KEY);
  if (!json) return null;
  try { return JSON.parse(json); } catch (err) { return null; }
}

function putPhotoMap_(map) {
  try { CacheService.getScriptCache().put(PHOTO_CACHE_KEY, JSON.stringify(map), PHOTO_CACHE_S); }
  catch (err) { Logger.log('Logo map cache put failed: ' + (err && err.message)); }
}

// Accepts both Drive link styles: …/file/d/<id>/view and …/open?id=<id> (Google Form uploads).
function extractDriveFileId(url) {
  if (!url) return null;
  var s = String(url);
  var match = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return match ? match[1] : null;
}

// ─── Reading the Sheet ───────────────────────────────────────────────────────
function getSpreadsheet_() {
  var id = props_().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No Sheet: set the Script Property SHEET_ID to the partners Sheet id.');
  return ss;
}

/** The responses tab is the one whose header row has the "Type of partner" question. */
function findResponsesSheet_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var values = sheets[i].getDataRange().getValues();
    if (!values.length) continue;
    var headers = values[0].map(function (h) { return h ? String(h).trim() : ''; });
    if (headers.some(function (h) { return COLUMNS.type.re.test(h); })) return { name: sheets[i].getName(), values: values };
  }
  throw new Error('No tab has the "Type of partner" header. Was the question renamed?');
}

/**
 * Reads the responses tab. Returns { resources, stats, problems }.
 * A row is published when it has a type and a name and is not marked "Hide from website".
 * Only the cells of the columns in COLUMNS are looked at.
 */
function readSheet_() {
  var ss = getSpreadsheet_();
  var tab = findResponsesSheet_(ss);
  var data = tab.values;
  var headers = data[0].map(function (h) { return h ? String(h).trim() : ''; });

  var col = {};
  var missing = [];
  Object.keys(COLUMNS).forEach(function (key) {
    col[key] = -1;
    for (var c = 0; c < headers.length; c++) { if (COLUMNS[key].re.test(headers[c])) { col[key] = c; break; } }
    if (col[key] === -1 && COLUMNS[key].required) missing.push(key);
  });
  if (missing.length) throw new Error('Required column(s) not found in the header row: ' + missing.join(', ') + '. Was a question renamed?');
  var used = Object.keys(col).map(function (k) { return col[k]; }).filter(function (c) { return c !== -1; });

  var resources = [];
  var problems = [];
  var stats = { rows: 0, published: 0, noType: 0, noName: 0, hidden: 0, noLogo: 0, idFromContent: 0 };
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var cell = function (key) { return col[key] === -1 ? null : str(row[col[key]]); };
    // A line with nothing in the columns we use is not a submission (notes columns are not looked at).
    if (!used.some(function (c) { return str(row[c]); })) continue;
    stats.rows++;
    var rowNo = i + 1;

    if (col.hide !== -1 && YES.test(cell('hide') || '')) { stats.hidden++; continue; }
    var type = cell('type');
    if (!type) { stats.noType++; problems.push({ kind: 'missing-type', row: rowNo, message: 'row ' + rowNo + ' has no "Type of partner" — not published' }); continue; }
    var name = cell('name');
    if (!name) { stats.noName++; problems.push({ kind: 'missing-name', row: rowNo, message: 'row ' + rowNo + ' (' + type + ') has no partner name — not published' }); continue; }

    var ts = col.timestamp === -1 ? null : row[col.timestamp];
    var id;
    if (ts) {
      id = 'PA-' + shortHash_(isDate_(ts) ? ts.toISOString() : String(ts));
    } else {
      // A row typed into the Sheet by hand has no Timestamp: its id comes from what it says instead.
      id = 'PA-' + shortHash_('row|' + type + '|' + name);
      stats.idFromContent++;
    }
    if (seen[id]) { problems.push({ kind: 'duplicate-id', row: rowNo, id: id, message: 'rows ' + seen[id] + ' and ' + rowNo + ' have the same ' + (ts ? 'Timestamp' : 'type and name') + ' — the later one was skipped' }); continue; }
    seen[id] = rowNo;

    var website = firstUrl_(cell('website'));
    if (!website && cell('website')) problems.push({ kind: 'website-not-a-link', row: rowNo, id: id, message: 'row ' + rowNo + ' (' + name + '): the Website cell has text but no web link — the name is shown without a link' });
    var photoUrl = firstUrl_(cell('logo'));
    if (!photoUrl) stats.noLogo++;
    resources.push({
      id: id,
      type: type,
      priority: cell('priority'),
      name: name,
      website: website,
      photoUrl: photoUrl,
    });
  }
  stats.published = resources.length;
  return { resources: resources, stats: stats, problems: problems };
}

function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]'; }

function shortHash_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  var hex = '';
  for (var i = 0; i < 5; i++) { var b = (bytes[i] + 256) % 256; hex += (b < 16 ? '0' : '') + b.toString(16); }
  return hex;
}

// A cell can hold several links; the first web link is used. A link typed without "https://"
// ("www.…") gets it added. Text without any link gives null.
function firstUrl_(text) {
  if (!text) return null;
  var s = String(text);
  var m = s.match(/https?:\/\/[^\s,]+/i);
  if (m) return m[0];
  m = s.match(/(?:^|\s)(www\.[^\s,]+)/i);
  return m ? 'https://' + m[1] : null;
}

function str(val) {
  if (val === null || val === undefined || val === '') return null;
  var s = String(val).trim();
  return s === '' ? null : s;
}

// ─── Telling GitHub to sync: leading + trailing debounce ─────────────────────
// Same design as the Pramaan Library script (docs/PRAMAAN-HARDENING-PLAN.md §6.2): every edit either
// triggers an update right away or is marked PENDING; the 5-minute tick sends one final update
// once edits stop for 2 minutes (or after 10 minutes of constant editing). No edit is dropped.

function onSheetChange(e) {
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

/** Calls GitHub's "run workflow" endpoint. Never throws. Returns the HTTP code (0 on exception). Any 2xx is success. */
function dispatch_(snap, reason) {
  var p = props_();
  var token = p.getProperty('GITHUB_PAT');
  var repo = p.getProperty('GITHUB_REPO');
  var workflow = p.getProperty('GITHUB_WORKFLOW') || 'sync-partners.yml';
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
          'The Partners Sheet could not ask GitHub to update the website. Most likely the GitHub token (GITHUB_PAT) expired, was deleted, or lacks the "Actions: Read and write" permission, or GITHUB_REPO / GITHUB_WORKFLOW is wrong.\n\n' +
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

// Not documented on GitHub's REST pages (checked 2026-11-15): when the header is absent nothing
// is recorded and the owner's calendar entry is the safeguard.
function recordPatExpiry_(headers) {
  if (!headers) return;
  var raw = null;
  Object.keys(headers).forEach(function (k) { if (k.toLowerCase() === 'github-authentication-token-expiration') raw = headers[k]; });
  if (!raw) return;
  var iso = new Date(String(raw).replace(' UTC', 'Z').replace(' ', 'T')).toISOString();
  var p = props_();
  if (p.getProperty('PAT_EXPIRES_AT') !== iso) {
    p.setProperty('PAT_EXPIRES_AT', iso);
    p.deleteProperty('PAT_WARNED_BUCKET');
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
    'The GitHub token (GITHUB_PAT) that lets the Partners Sheet update the website expires on ' + exp + '.\n\n' +
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
  try { MailApp.sendEmail(to, '[Partners website] ' + subject, body); }
  catch (err) { Logger.log('Could not send alert email: ' + (err && err.message)); }
}

function setIfAbsent_(p, key, value) { if (!p.getProperty(key)) p.setProperty(key, String(value)); }
function num_(v) { var n = parseInt(v || '0', 10); return isNaN(n) ? 0 : n; }

// ─── One-click helpers for the owner (Run ▶ in the editor) ───────────────────

/** Installs exactly the triggers this script needs and removes old ones. Safe to re-run. */
function setup() {
  var old = ['onSheetChange', 'tick'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (old.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  var ss = getSpreadsheet_();
  ScriptApp.newTrigger('onSheetChange').forSpreadsheet(ss).onChange().create();
  // A Google Form submission is not an "edit", so it gets its own trigger.
  ScriptApp.newTrigger('onSheetChange').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(5).create();
  showStatus();
}

/**
 * Creates a long random SYNC_TOKEN, saves it as the Script Property, and shows it ONCE in the log
 * so it can be pasted into the GitHub secret PARTNERS_SYNC_TOKEN. Running it again makes a
 * NEW token (the GitHub secret must then be updated too).
 */
function makeSyncToken() {
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('SYNC_TOKEN', token);
  Logger.log('SYNC_TOKEN saved. Copy this value into the GitHub secret PARTNERS_SYNC_TOKEN, then clear this log:\n' + token);
}

/** Sends one update request to GitHub right now and logs the result (for diagnosis). */
function testDispatch() {
  var code = dispatch_(props_().getProperty('LAST_EDIT_AT') || '', 'manual test');
  Logger.log(code >= 200 && code < 300
    ? 'SUCCESS (HTTP ' + code + '): GitHub accepted. Open the repository → Actions — "Sync Partners" should start within a minute.'
    : 'FAILED (HTTP ' + code + '). Status: ' + props_().getProperty('LAST_DISPATCH_STATUS'));
}

/** Logs the configuration (never secret values), the triggers, and what export would publish (counts only). */
function showStatus() {
  var p = props_();
  var has = function (k) { return p.getProperty(k) ? 'set' : 'MISSING'; };
  var counts;
  try {
    var s = readSheet_().stats;
    counts = s.rows + ' filled rows → ' + s.published + ' would be published (' + s.noLogo + ' of them without a logo link); ' + s.noType + ' without a type, ' + s.noName + ' without a name, ' + s.hidden + ' hidden; ' + s.idFromContent + ' typed in without a Timestamp (id made from type + name)';
  } catch (err) {
    counts = 'ERROR reading the Sheet: ' + (err && err.message);
  }
  Logger.log([
    'Partners Apps Script v' + SCRIPT_VERSION,
    'SYNC_TOKEN: ' + has('SYNC_TOKEN') + '   GITHUB_PAT: ' + has('GITHUB_PAT') + '   GITHUB_REPO: ' + (p.getProperty('GITHUB_REPO') || 'MISSING'),
    'GITHUB_WORKFLOW: ' + (p.getProperty('GITHUB_WORKFLOW') || 'sync-partners.yml (default)') + '   ALERT_EMAIL: ' + has('ALERT_EMAIL'),
    'Sheet: ' + getSpreadsheet_().getName(),
    'Rows: ' + counts,
    'Token expires: ' + (p.getProperty('PAT_EXPIRES_AT') || 'unknown until the first successful update'),
    'Last update request: ' + (p.getProperty('LAST_DISPATCH_STATUS') || 'none yet'),
    'Pending edits since: ' + (p.getProperty('PENDING_SINCE') ? new Date(num_(p.getProperty('PENDING_SINCE'))).toISOString() : 'none'),
    'Triggers: ' + ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction() + ' (' + t.getEventType() + ')'; }).join(', '),
  ].join('\n'));
}
