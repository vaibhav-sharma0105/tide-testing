/**
 * Social Changemakers (Past SCF) — Google Apps Script, version 1.
 *
 * THIS FILE IS THE SOURCE OF TRUTH. It belongs to the Sheet
 * "Social Changemakers' Fellowship Completion Form (Responses)".
 * Click-by-click install: docs/SOCIAL-CHANGEMAKERS-SETUP-GUIDE.md.
 * Column rules: docs/SOCIAL-CHANGEMAKERS-SHEET-SCHEMA.md.
 *
 * PRIVACY: only the columns in COLUMNS are read. The two email columns and every other question
 * (event, certificate, continuation plans, …) are never read, and the Timestamp is never
 * output (it only becomes an anonymous id). There is NO public listing at all — every action needs
 * the SYNC_TOKEN. A Drive video is exported only when the file itself is shared publicly.
 *
 * Which rows are published (owner decision, 2026-11-23): every response with a "Name" and an
 * "SCF Batch". To take a profile off the website without deleting the response, add a column
 * headed "Hide from website" and type Yes in it.
 *
 * What it does
 * The write-up (a Word document) and the videos are exported only when the Drive file is shared
 * publicly, as Drive's own viewer links.
 *
 *  - doGet (Web App, "Execute as: Me", "Who has access: Anyone" — the token is the lock):
 *      ?action=export      token-gated FRESH read: publishable rows + photo list + counts + health
 *      ?action=fetchImage  token-gated: one photo of one profile (only ids that are publishable now;
 *                          "<id>" = the fellow's photo, "<id>__field" = the field-work photo,
 *                          "<id>__video" / "<id>__testimonial" = a public Drive video's poster frame)
 *      anything else       { success: false }
 *  - onSheetChange (installable "On change" AND "On form submit" triggers): asks GitHub to sync.
 *  - tick (every 5 minutes): sends the final update after a burst of edits, a daily heartbeat,
 *    and token-expiry warnings.
 *  - setup(): installs exactly those three triggers (safe to run again any time).
 *
 * Script Properties (Project Settings → Script Properties):
 *   SYNC_TOKEN       required — same value as the GitHub secret SOCIAL_CHANGEMAKERS_SYNC_TOKEN
 *   GITHUB_PAT       required for instant updates — fine-grained token, this repo only,
 *                    permission "Actions: Read and write"
 *   GITHUB_REPO      required for instant updates — e.g. owner/repository
 *   GITHUB_WORKFLOW  optional — default sync-social-changemakers.yml
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
var HEARTBEAT_UTC_HOUR = 7;       // Pramaan Library uses 04:00, Publications 05:00, Partners 06:00
var PHOTO_CACHE_KEY = 'scf_photos_v1';
var PHOTO_CACHE_S = 1800;
var FIELD_SUFFIX = '__field';     // photo id of a profile's field-work photo
// Photos up to this size are sent as the original file; anything else (bigger files, HEIC…)
// goes through Google's own thumbnail renderer.
var ORIGINAL_MAX_BYTES = 8 * 1024 * 1024;
var ORIGINAL_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Columns are found by their header TEXT (case-insensitive, start of the header), never by
// letter, so inserting or moving a column is safe. If a REQUIRED header can't be found, export
// fails loudly and nothing is published. Columns not listed here are never read.
var COLUMNS = {
  timestamp:   { re: /^timestamp$/i },  // used ONLY to make an anonymous id; never output
  order:       { re: /^order to post/i, required: true },
  batch:       { re: /^scf batch/i, required: true },
  name:        { re: /^name$/i, required: true },
  project:     { re: /^project name/i, required: true },
  summary:     { re: /^write 50-100 words summary/i },
  photo:       { re: /^upload your photo/i },
  fieldPhoto:  { re: /^upload one photo that captures/i },
  video:       { re: /^submit the final video/i },
  nextSteps:   { re: /^what are the next steps/i },
  testimonial: { re: /^upload your testimonial video/i },
  writeup:     { re: /^upload webpage write-up/i },
  hide:        { re: /^hide from (the )?website/i },
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
/**
 * photo id → Drive file id, for every image the website keeps of a publishable profile: the two
 * photos ("<id>", "<id>__field") and a poster frame of each PUBLIC Drive video ("<id>__video",
 * "<id>__testimonial" — videoUrl / testimonialUrl are set only for public files; Drive renders the
 * frame through fetchImage's thumbnail path).
 */
function photoFiles_(resources) {
  var map = {};
  resources.forEach(function (r) {
    var a = extractDriveFileId(r.photoUrl);
    var b = extractDriveFileId(r.fieldPhotoUrl);
    var v = extractDriveFileId(r.videoUrl);
    var t = extractDriveFileId(r.testimonialUrl);
    if (a) map[r.id] = a;
    if (b) map[r.id + FIELD_SUFFIX] = b;
    if (v) map[r.id + '__video'] = v;
    if (t) map[r.id + '__testimonial'] = t;
  });
  return map;
}

function handleExport(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };
  var data = readSheet_();
  var photoMap = photoFiles_(data.resources);
  var photos = [];
  Object.keys(photoMap).forEach(function (photoId) {
    var fileId = photoMap[photoId];
    try {
      photos.push({ id: photoId, fileId: fileId, modifiedTime: DriveApp.getFileById(fileId).getLastUpdated().toISOString() });
    } catch (err) {
      photos.push({ id: photoId, fileId: fileId, error: String(err && err.message || err).slice(0, 200) });
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

  // Only photo ids of publishable rows — never a client-supplied Drive fileId — so a leaked token
  // can't pull arbitrary Drive files. The map is cached by export; re-read once if missing.
  var map = getPhotoMap_();
  var fileId = map && map[id];
  if (!fileId) {
    map = photoFiles_(readSheet_().resources);
    putPhotoMap_(map);
    fileId = map[id];
  }
  if (!fileId) return { success: false, error: 'Unknown profile id or no photo' };

  try {
    var file = DriveApp.getFileById(fileId);
    var modified = file.getLastUpdated().toISOString();
    if (ORIGINAL_TYPES.indexOf(file.getMimeType()) !== -1 && file.getSize() <= ORIGINAL_MAX_BYTES) {
      var original = file.getBlob();
      return { success: true, id: id, mimeType: original.getContentType(), modifiedTime: modified, base64: Utilities.base64Encode(original.getBytes()) };
    }
    var meta = Drive.Files.get(fileId, { fields: 'thumbnailLink' });
    if (!meta.thumbnailLink) return { success: false, error: 'Drive has no thumbnail for this file' };
    // Google's own renderer turns any image (HEIC, very large JPEG…) into a raster preview.
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
  catch (err) { Logger.log('Photo map cache put failed: ' + (err && err.message)); }
}

// Accepts both Drive link styles: …/file/d/<id>/view and …/open?id=<id> (Google Form uploads).
function extractDriveFileId(url) {
  if (!url) return null;
  var s = String(url);
  if (!/drive\.google\.com|docs\.google\.com/i.test(s)) return null;
  var match = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return match ? match[1] : null;
}

/**
 * The write-up cell (a Word document uploaded to Drive) → Drive's own viewer link, only if the file is
 * shared "Anyone with the link" (or public); otherwise null + a problem.
 */
function documentEmbed_(cellText, report) {
  var url = firstUrl_(cellText);
  if (!url) { if (cellText) report('writeup-not-a-link', 'has text but no link'); return null; }
  var fileId = extractDriveFileId(url);
  if (!fileId) { report('writeup-unsupported', 'is not a Drive file'); return null; }
  try {
    var access = DriveApp.getFileById(fileId).getSharingAccess();
    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      return 'https://drive.google.com/file/d/' + fileId + '/preview';
    }
    report('writeup-not-public', 'is not shared "Anyone with the link" — not shown');
  } catch (err) {
    report('writeup-unavailable', 'could not be read from Drive (' + String(err && err.message).slice(0, 120) + ')');
  }
  return null;
}

/**
 * A video cell → a player link that is safe to publish, or null.
 *  - Drive file: only if the file is shared "Anyone with the link" (or public); its /preview link.
 *  - YouTube link: its youtube-nocookie.com embed link.
 * `report(kind, message)` is called when a link can't be used.
 */
function videoEmbed_(cellText, report) {
  var url = firstUrl_(cellText);
  if (!url) { if (cellText) report('video-not-a-link', 'has text but no link'); return null; }
  var yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1];
  var fileId = extractDriveFileId(url);
  if (!fileId) { report('video-unsupported', 'is not a Drive or YouTube link'); return null; }
  try {
    var access = DriveApp.getFileById(fileId).getSharingAccess();
    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      return 'https://drive.google.com/file/d/' + fileId + '/preview';
    }
    report('video-not-public', 'is not shared "Anyone with the link" — not shown');
  } catch (err) {
    report('video-unavailable', 'could not be read from Drive (' + String(err && err.message).slice(0, 120) + ')');
  }
  return null;
}

// ─── Reading the Sheet ───────────────────────────────────────────────────────
function getSpreadsheet_() {
  var id = props_().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No Sheet: set the Script Property SHEET_ID to the Social Changemakers Sheet id.');
  return ss;
}

/** The responses tab is the one whose header row has the "SCF Batch" question. */
function findResponsesSheet_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var values = sheets[i].getDataRange().getValues();
    if (!values.length) continue;
    var headers = values[0].map(function (h) { return h ? String(h).trim() : ''; });
    if (headers.some(function (h) { return COLUMNS.batch.re.test(h); })) return { name: sheets[i].getName(), values: values };
  }
  throw new Error('No tab has the "SCF Batch" header. Was the question renamed?');
}

/**
 * Reads the responses tab. Returns { resources, stats, problems }.
 * A row is published when it has a name and a batch and is not marked "Hide from website".
 * Only the cells of the columns in COLUMNS are looked at.
 */
function readSheet_() {
  var ss = getSpreadsheet_();
  var tab = findResponsesSheet_(ss);
  var data = tab.values;
  var headers = data[0].map(function (h) { return h ? String(h).trim().replace(/\s+/g, ' ') : ''; });

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
  var stats = { rows: 0, published: 0, noName: 0, noBatch: 0, hidden: 0, noPhoto: 0, videos: 0, idFromContent: 0 };
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var cell = function (key) { return col[key] === -1 ? null : str(row[col[key]]); };
    // A line with nothing in the columns we use is not a submission.
    if (!used.some(function (c) { return str(row[c]); })) continue;
    stats.rows++;
    var rowNo = i + 1;

    if (col.hide !== -1 && YES.test(cell('hide') || '')) { stats.hidden++; continue; }
    var name = cell('name');
    if (!name) { stats.noName++; problems.push({ kind: 'missing-name', row: rowNo, message: 'row ' + rowNo + ' has no Name — not published' }); continue; }
    var batch = cell('batch');
    if (!batch) { stats.noBatch++; problems.push({ kind: 'missing-batch', row: rowNo, message: 'row ' + rowNo + ' (' + name + ') has no SCF Batch — not published' }); continue; }

    var ts = col.timestamp === -1 ? null : row[col.timestamp];
    var id;
    if (ts) {
      id = 'SC-' + shortHash_(isDate_(ts) ? ts.toISOString() : String(ts));
    } else {
      // A row typed into the Sheet by hand has no Timestamp: its id comes from what it says instead.
      id = 'SC-' + shortHash_('row|' + batch + '|' + name);
      stats.idFromContent++;
    }
    if (seen[id]) { problems.push({ kind: 'duplicate-id', row: rowNo, id: id, message: 'rows ' + seen[id] + ' and ' + rowNo + ' have the same ' + (ts ? 'Timestamp' : 'batch and name') + ' — the later one was skipped' }); continue; }
    seen[id] = rowNo;

    var report = function (field) {
      return function (kind, message) { problems.push({ kind: kind, row: rowNo, id: id, message: 'row ' + rowNo + ' (' + name + '): the ' + field + ' ' + message }); };
    };
    var video = videoEmbed_(cell('video'), report('project video'));
    var testimonial = videoEmbed_(cell('testimonial'), report('testimonial video'));
    var writeup = documentEmbed_(cell('writeup'), report('write-up'));
    if (video || testimonial) stats.videos++;
    var photoUrl = firstUrl_(cell('photo'));
    var fieldPhotoUrl = firstUrl_(cell('fieldPhoto'));
    if (!photoUrl && !fieldPhotoUrl) stats.noPhoto++;
    resources.push({
      id: id,
      batch: batch,
      order: cell('order'),
      name: name,
      project: cell('project'),
      summary: cell('summary'),
      nextSteps: cell('nextSteps'),
      photoUrl: photoUrl,
      fieldPhotoUrl: fieldPhotoUrl,
      videoUrl: video,
      testimonialUrl: testimonial,
      writeupUrl: writeup,
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
  var workflow = p.getProperty('GITHUB_WORKFLOW') || 'sync-social-changemakers.yml';
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
          'The Social Changemakers Sheet could not ask GitHub to update the website. Most likely the GitHub token (GITHUB_PAT) expired, was deleted, or lacks the "Actions: Read and write" permission, or GITHUB_REPO / GITHUB_WORKFLOW is wrong.\n\n' +
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
    'The GitHub token (GITHUB_PAT) that lets the Social Changemakers Sheet update the website expires on ' + exp + '.\n\n' +
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
  try { MailApp.sendEmail(to, '[Social Changemakers website] ' + subject, body); }
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
 * so it can be pasted into the GitHub secret SOCIAL_CHANGEMAKERS_SYNC_TOKEN. Running it again makes a
 * NEW token (the GitHub secret must then be updated too).
 */
function makeSyncToken() {
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('SYNC_TOKEN', token);
  Logger.log('SYNC_TOKEN saved. Copy this value into the GitHub secret SOCIAL_CHANGEMAKERS_SYNC_TOKEN, then clear this log:\n' + token);
}

/** Sends one update request to GitHub right now and logs the result (for diagnosis). */
function testDispatch() {
  var code = dispatch_(props_().getProperty('LAST_EDIT_AT') || '', 'manual test');
  Logger.log(code >= 200 && code < 300
    ? 'SUCCESS (HTTP ' + code + '): GitHub accepted. Open the repository → Actions — "Sync Social Changemakers" should start within a minute.'
    : 'FAILED (HTTP ' + code + '). Status: ' + props_().getProperty('LAST_DISPATCH_STATUS'));
}

/** Logs the configuration (never secret values), the triggers, and what export would publish (counts only). */
function showStatus() {
  var p = props_();
  var has = function (k) { return p.getProperty(k) ? 'set' : 'MISSING'; };
  var counts;
  try {
    var s = readSheet_().stats;
    counts = s.rows + ' filled rows → ' + s.published + ' would be published (' + s.noPhoto + ' of them without any photo, ' + s.videos + ' with a public video); ' + s.noName + ' without a name, ' + s.noBatch + ' without a batch, ' + s.hidden + ' hidden; ' + s.idFromContent + ' typed in without a Timestamp (id made from batch + name)';
  } catch (err) {
    counts = 'ERROR reading the Sheet: ' + (err && err.message);
  }
  Logger.log([
    'Social Changemakers Apps Script v' + SCRIPT_VERSION,
    'SYNC_TOKEN: ' + has('SYNC_TOKEN') + '   GITHUB_PAT: ' + has('GITHUB_PAT') + '   GITHUB_REPO: ' + (p.getProperty('GITHUB_REPO') || 'MISSING'),
    'GITHUB_WORKFLOW: ' + (p.getProperty('GITHUB_WORKFLOW') || 'sync-social-changemakers.yml (default)') + '   ALERT_EMAIL: ' + has('ALERT_EMAIL'),
    'Sheet: ' + getSpreadsheet_().getName(),
    'Rows: ' + counts,
    'Token expires: ' + (p.getProperty('PAT_EXPIRES_AT') || 'unknown until the first successful update'),
    'Last update request: ' + (p.getProperty('LAST_DISPATCH_STATUS') || 'none yet'),
    'Pending edits since: ' + (p.getProperty('PENDING_SINCE') ? new Date(num_(p.getProperty('PENDING_SINCE'))).toISOString() : 'none'),
    'Triggers: ' + ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction() + ' (' + t.getEventType() + ')'; }).join(', '),
  ].join('\n'));
}
