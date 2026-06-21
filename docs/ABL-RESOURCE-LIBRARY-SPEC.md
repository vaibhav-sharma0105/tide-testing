# ABL Resource Library — Developer Specification

**Version:** 2.1  
**Status:** Implemented ✓  
**Target hosting:** GitHub Pages (static, `BrowserRouter` + `public/404.html` SPA fallback — not HashRouter)  
**Architecture:** Apps Script JSON API + React frontend (no iframe, no gviz/tq)

> **As-built notes:** The spec was implemented faithfully with these deviations from the original design:
> - `ResourceFilters` is a **left sidebar** (not a horizontal filter bar as in section 7.5) — collapsible sections with independent scroll
> - `DriveImage` uses **`aspect-[3/4]` (portrait)** rather than `aspect-[4/3]` — all images are portrait-oriented
> - **(2026-06-20/21)** Thumbnails are self-hosted via an automated sync pipeline rather than built from a live Drive URL at runtime (§2.4–2.5, §5) — see `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`. `AblDetail.jsx`'s layout has also been substantially redesigned beyond what §7–8 describe; the component file is the source of truth for current UI, the Apps Script code in §2.5 remains the source of truth for `Code.gs`.
> - `ImageLightbox` is present on the **detail page only** (`AblDetail.jsx`), not on the listings page
> - Filter logic is extracted to `src/utils/filterResources.js` (`applyResourceFilters`)
> 
> All other sections (API schema, Apps Script code, routing, edge cases) reflect exactly what was built.

---

## 0. Environment Configuration — Single Source of Truth

All environment-specific URLs live in `.env` files at the project root. **No URLs are hardcoded anywhere else in the React codebase.** Components and hooks import from `src/config/abl.js`, which reads from `import.meta.env`.

### 0.1 URL ownership — which URL lives where

| URL | Lives in | Never in |
|---|---|---|
| Google Sheet URL | `Code.gs` (Apps Script only) | React codebase |
| Apps Script Web App URL (DEV) | `.env.development` | Hardcoded in source |
| Apps Script Web App URL (PRD) | `.env.production` | Hardcoded in source |
| Google Form URL (Contribute) | `.env.development` + `.env.production` | Hardcoded in source |

The React app has **zero knowledge** of the sheet URL — it only knows the Apps Script endpoint. This means the underlying data source can be swapped (different sheet, different account) by updating GAS alone, with no React changes needed.

### 0.2 `.env` file structure

Create these files at the project root. They are **not committed to git** (add to `.gitignore`).

**`.env.development`** — used by `npm run dev`
```
VITE_ABL_API_URL=https://script.google.com/macros/s/DEV_DEPLOYMENT_ID/exec
VITE_ABL_CONTRIBUTE_FORM_URL=REPLACE_WITH_GOOGLE_FORM_URL
```

**`.env.production`** — used by `npm run build`
```
VITE_ABL_API_URL=https://script.google.com/macros/s/PROD_DEPLOYMENT_ID/exec
VITE_ABL_CONTRIBUTE_FORM_URL=REPLACE_WITH_GOOGLE_FORM_URL
```

**`.env.example`** — **committed to git**, documents what variables are needed (no real values):
```
# Apps Script Web App URL (get from GAS deploy screen — see docs/ABL-APPSCRIPT-SETUP-GUIDE.md)
VITE_ABL_API_URL=

# Google Form URL for the Contribute page
VITE_ABL_CONTRIBUTE_FORM_URL=
```

### 0.3 `.gitignore` addition

Add these lines to `.gitignore` (create if missing):
```
.env.development
.env.production
.env.local
```

Do **not** gitignore `.env.example` — it serves as documentation.

### 0.4 GitHub Pages deployment

Since `.env.production` is gitignored, the GitHub Actions workflow must inject the variables as repository secrets:

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**
- Name: `VITE_ABL_API_URL` — Value: the production Apps Script URL
- Name: `VITE_ABL_CONTRIBUTE_FORM_URL` — Value: the Google Form URL

The existing `.github/workflows/` deploy file needs this addition in the build step:
```yaml
- name: Build
  run: npm run build
  env:
    VITE_ABL_API_URL: ${{ secrets.VITE_ABL_API_URL }}
    VITE_ABL_CONTRIBUTE_FORM_URL: ${{ secrets.VITE_ABL_CONTRIBUTE_FORM_URL }}
```

### 0.5 `src/config/abl.js` — reads from env

```js
// src/config/abl.js
// All ABL feature configuration in one place.
// URLs come from .env files — never hardcode them here.

export const ABL_API_URL           = import.meta.env.VITE_ABL_API_URL           ?? ''
export const CONTRIBUTE_FORM_URL   = import.meta.env.VITE_ABL_CONTRIBUTE_FORM_URL ?? ''

export const ABL_CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutes — matches GAS cache TTL
export const ABL_PAGE_SIZE    = 24

// Maps GAS tab name → display config.
// Add a new entry when a new sheet tab is added; unknown tabs fall back to _default.
export const TAB_STYLE_MAP = {
  'Worksheet':  { color: 'blue',    label: 'Worksheet',  pluralLabel: 'Worksheets'  },
  'Games':      { color: 'emerald', label: 'Game',       pluralLabel: 'Games'       },
  'Kits':       { color: 'violet',  label: 'Kit',        pluralLabel: 'Kits'        },
  'Flashcards': { color: 'amber',   label: 'Flashcard',  pluralLabel: 'Flashcards'  },
  _default:     { color: 'gray',    label: 'Resource',   pluralLabel: 'Resources'   },
}
```

If `ABL_API_URL` is empty (env var not set), `useABLData` must detect this and show a clear developer-facing error in the console: `[ABL] VITE_ABL_API_URL is not set. Add it to your .env.development file.` — and return `{ loading: false, error: 'API not configured', data: null }` so the UI shows the error state rather than a broken blank page.

---

## 1. Architecture Overview

```
Google Sheet (private)
        │
        │  [15-min GAS time trigger refreshes server-side cache]
        ▼
Google Apps Script Web App
  • Reads sheet using owner credentials (sheet stays private)
  • Caches parsed JSON in CacheService (split by tab, 15-min TTL)
  • doGet() returns combined JSON with CORS headers
  • Endpoint: https://script.google.com/macros/s/DEPLOYMENT_ID/exec
        │
        │  [React fetch() on app load — one request per session]
        ▼
useABLData() hook
  • Checks sessionStorage cache (15-min TTL)
  • On cache miss: fetches from GAS endpoint, stores result
  • Returns { data, loading, error, lastUpdated, refetch }
        │
        ▼
React components render natively
  • Full browser routing (no iframe)
  • Shareable URLs, back button, deep links all work
  • Perfect UI consistency with rest of site
```

**Why this architecture beats alternatives:**
- Sheet stays private (never exposed to browser)
- 15-min proactive server-side cache means most users see ~100ms response
- React renders UI natively — no iframe UX breakdowns
- Single API call fetches all data; client paginates/filters locally
- Zero infrastructure cost (GAS free tier)

---

## 2. Google Apps Script — API Specification

### 2.1 Endpoint

```
GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

No authentication, no API key. GAS Web App deployed as "Anyone (even anonymous)".

### 2.2 Response Schema

```json
{
  "success": true,
  "lastUpdated": "2026-06-07T10:30:00.000Z",
  "tabs": ["Worksheet", "Games", "Kits", "Flashcards"],
  "resources": {
    "Worksheet":  [ ...52 ResourceObjects... ],
    "Games":      [ ...32 ResourceObjects... ],
    "Kits":       [ ...32 ResourceObjects... ],
    "Flashcards": [ ...45 ResourceObjects... ]
  },
  "meta": {
    "counts": { "Worksheet": 52, "Games": 32, "Kits": 32, "Flashcards": 45 },
    "total": 161
  }
}
```

Error response (never throws, always returns JSON):
```json
{ "success": false, "error": "Error message", "tabs": [], "resources": {}, "meta": { "counts": {}, "total": 0 } }
```

### 2.3 Normalized ResourceObject (same shape for all tabs)

```json
{
  "id":              "W1",
  "name":            "૧૫ નો મેળાપ",
  "type":            "Worksheet",
  "concept":         "Addition",
  "language":        "Gujarati",
  "ownership":       "TIDE",
  "quantity":        20,
  "storageLocation": "Central file",
  "photoUrl":        "https://drive.google.com/file/d/FILE_ID/view?usp=sharing",
  "videoUrl":        "https://drive.google.com/file/d/FILE_ID/view?usp=drive_link",
  "canvaUrl":        "https://www.canva.com/design/...",
  "grades":          ["GRADE 1", "GRADE 3", "GRADE 4"],
  "chapters": {
    "GRADE 1": ["ch 2", "ch 5"],
    "GRADE 2": [],
    "GRADE 3": [],
    "GRADE 4": ["ch 3", "ch 6", "ch 10"],
    "GRADE 5": []
  },
  "description":     "Description text or null",
  "referenceLink":   null
}
```

Fields that may be `null`: `quantity`, `storageLocation`, `photoUrl`, `videoUrl`, `canvaUrl`, `description`, `referenceLink`.  
`grades` and `chapters[grade]` are always arrays (never null — empty array if no data).

### 2.4 Thumbnail Sync Endpoints (`?action=manifest` / `?action=fetchImage`)

These two actions exist **only** to support the automated thumbnail-sync pipeline
described in `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` — they are not used by the
public React site. They are gated by a shared secret (`SYNC_TOKEN`, stored in
Script Properties, never in source) so they don't widen the Web App's existing
"Anyone can access" surface beyond the original read-only resource listing.

**`GET ?action=manifest&token=SYNC_TOKEN`**

Returns `{id, fileId, modifiedTime}` for every resource that has a `photoUrl`,
so the sync job can diff cheaply against its local manifest instead of
re-downloading all 161+ images on every run.

```json
{ "success": true, "manifest": [
  { "id": "W1", "fileId": "1zSvZ...", "modifiedTime": "2026-06-20T07:54:05.909Z" }
] }
```

**`GET ?action=fetchImage&id=W1&token=SYNC_TOKEN`**

Returns base64 bytes for exactly one resource's photo. `id` must be a real,
known resource id from the current sheet — the endpoint never accepts a raw
Drive `fileId` directly. This is a deliberate allowlist: even if `SYNC_TOKEN`
ever leaked, it could only be used to pull images that are already public
resources, never arbitrary files elsewhere in the linked Drive.

```json
{ "success": true, "id": "W1", "mimeType": "image/png",
  "modifiedTime": "2026-06-20T07:54:05.909Z", "base64": "iVBORw0KG..." }
```

Both actions return `{ "success": false, "error": "Unauthorized" }` (still
HTTP 200 — Apps Script `doGet` cannot set a custom status code) when the
token is missing or wrong. The sync job treats `success: false` as a hard
failure and aborts the run rather than committing partial data.

### 2.5 Complete Apps Script Code

**File: `Code.gs`** — paste this in full when setting up.

> **Requires the "Drive API" advanced service** (used by `handleFetchImage`
> for `Drive.Files.get(...).thumbnailLink`) — the basic `DriveApp` service
> doesn't expose it. In the Apps Script editor: **Services** (+ icon in the
> left sidebar) → **Drive API** → **Add**. See
> `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` for the full walkthrough.

```javascript
// ─── Configuration ───────────────────────────────────────────────────────────
const SHEET_ID         = '1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ';
const CACHE_DURATION_S = 900; // 15 minutes
const SKIP_SHEETS      = []; // Sheet tab names to exclude (add if you add metadata tabs)

// ─── Cache keys (split by tab to stay under 100KB CacheService limit) ────────
const META_CACHE_KEY   = 'abl_meta_v2';
function tabCacheKey(tabName) { return 'abl_tab_v2_' + tabName; }

// ─── Entry point ─────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'manifest')   return jsonOutput(handleManifest(e));
    if (action === 'fetchImage') return jsonOutput(handleFetchImage(e));

    // Default: public resource listing (unchanged, no auth)
    const result = getFromCacheOrFetch();
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({
      success: false, error: err.message,
      tabs: [], resources: {}, meta: { counts: {}, total: 0 }
    });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Thumbnail sync — token-gated, allowlisted to known resource ids ─────────
// See docs/ABL-RESOURCE-LIBRARY-SPEC.md §2.4 and
// docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md for the full setup procedure.

function isAuthorizedSyncRequest(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('SYNC_TOKEN');
  const provided = e.parameter.token;
  return !!expected && !!provided && expected === provided;
}

function handleManifest(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };

  const data = getFromCacheOrFetch();
  const manifest = [];

  Object.keys(data.resources).forEach(function(tab) {
    data.resources[tab].forEach(function(resource) {
      const fileId = extractDriveFileId(resource.photoUrl);
      if (!fileId) return;
      try {
        const modifiedTime = DriveApp.getFileById(fileId).getLastUpdated().toISOString();
        manifest.push({ id: resource.id, fileId: fileId, modifiedTime: modifiedTime });
      } catch (err) {
        Logger.log('Could not read file for resource ' + resource.id + ': ' + err.message);
      }
    });
  });

  return { success: true, manifest: manifest };
}

function handleFetchImage(e) {
  if (!isAuthorizedSyncRequest(e)) return { success: false, error: 'Unauthorized' };

  const id = e.parameter.id;
  if (!id) return { success: false, error: 'Missing id' };

  // Look up the id against the CURRENT resource list — never trust a
  // client-supplied Drive fileId directly. This is what keeps a leaked
  // SYNC_TOKEN from being usable to pull arbitrary files out of Drive.
  const data = getFromCacheOrFetch();
  let resource = null;
  Object.keys(data.resources).some(function(tab) {
    const found = data.resources[tab].find(function(r) { return r.id === id; });
    if (found) { resource = found; return true; }
    return false;
  });
  if (!resource) return { success: false, error: 'Unknown resource id' };

  const fileId = extractDriveFileId(resource.photoUrl);
  if (!fileId) return { success: false, error: 'Resource has no photo' };

  // Fetch Google's own pre-rendered thumbnail rather than the file's raw
  // bytes. Source files are heterogeneous in practice (worksheet "photos"
  // are often actually PDFs; some phone-camera HEIC files exceed libheif's
  // safety limits) — Google's thumbnail renderer already solves "turn any
  // file into a raster preview" reliably, the same renderer the site used
  // to hot-link to directly from every visitor's browser. Calling it here,
  // once per sync, from the server, is a fundamentally different load
  // profile than the original problem.
  try {
    const file = DriveApp.getFileById(fileId);
    const meta = Drive.Files.get(fileId, { fields: 'thumbnailLink' });
    if (!meta.thumbnailLink) return { success: false, error: 'Drive has no thumbnail for this file' };

    const thumbUrl = meta.thumbnailLink.replace(/=s\d+$/, '=s1600');
    const resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      return { success: false, error: 'Thumbnail render fetch failed: HTTP ' + resp.getResponseCode() };
    }

    const blob = resp.getBlob();
    return {
      success: true,
      id: id,
      mimeType: blob.getContentType(),
      modifiedTime: file.getLastUpdated().toISOString(),
      base64: Utilities.base64Encode(blob.getBytes())
    };
  } catch (err) {
    return { success: false, error: 'Could not read file: ' + err.message };
  }
}

function extractDriveFileId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── onChange dispatch trigger ────────────────────────────────────────────────
// Install via Triggers UI (NOT the automatic onEdit simple trigger — this
// needs full authorization to call UrlFetchApp with a stored credential):
//   Add Trigger → function "onSheetChange" → event source "From spreadsheet"
//   → event type "On edit".
// Fires a GitHub repository_dispatch the moment the sheet actually changes,
// so the thumbnail sync workflow reacts within seconds instead of waiting
// for the daily cron safety net.
function onSheetChange(e) {
  const props = PropertiesService.getScriptProperties();
  const now   = Date.now();
  const last  = parseInt(props.getProperty('LAST_DISPATCH_AT') || '0', 10);

  if (now - last < 2 * 60 * 1000) return; // debounce: skip if dispatched <2 min ago
  props.setProperty('LAST_DISPATCH_AT', String(now));

  const token = props.getProperty('GITHUB_PAT');
  const repo  = props.getProperty('GITHUB_REPO'); // "owner/repo"
  if (!token || !repo) {
    Logger.log('GitHub dispatch skipped — GITHUB_PAT/GITHUB_REPO not set');
    return;
  }

  try {
    const resp = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/dispatches', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json'
      },
      payload: JSON.stringify({ event_type: 'abl-content-changed' }),
      muteHttpExceptions: true
    });
    // muteHttpExceptions means a bad response (e.g. an expired GITHUB_PAT)
    // would otherwise fail completely silently — log it so there's at
    // least a trace in the Apps Script execution log.
    if (resp.getResponseCode() !== 204) {
      Logger.log('GitHub dispatch returned HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText());
    }
  } catch (err) {
    Logger.log('GitHub dispatch failed: ' + err.message);
  }
}

// ─── Cache logic ─────────────────────────────────────────────────────────────
function getFromCacheOrFetch() {
  const cache    = CacheService.getScriptCache();
  const metaJson = cache.get(META_CACHE_KEY);

  if (metaJson) {
    const meta = JSON.parse(metaJson);
    // Try to assemble from per-tab cache
    const resources = {};
    let allTabsHit  = true;
    for (const tab of meta.tabs) {
      const tabJson = cache.get(tabCacheKey(tab));
      if (!tabJson) { allTabsHit = false; break; }
      resources[tab] = JSON.parse(tabJson);
    }
    if (allTabsHit) {
      return { success: true, lastUpdated: meta.lastUpdated, tabs: meta.tabs, resources, meta: meta.counts };
    }
  }

  return refreshCacheAndReturn();
}

function refreshCacheAndReturn() {
  const cache     = CacheService.getScriptCache();
  const ss        = SpreadsheetApp.openById(SHEET_ID);
  const sheets    = ss.getSheets();
  const tabs      = [];
  const resources = {};
  const counts    = { counts: {}, total: 0 };
  const now       = new Date().toISOString();

  sheets.forEach(function(sheet) {
    const name = sheet.getName();
    if (SKIP_SHEETS.indexOf(name) !== -1) return;
    const rows = parseSheet(sheet);
    if (rows.length === 0) return;

    tabs.push(name);
    resources[name] = rows;
    counts.counts[name] = rows.length;
    counts.total += rows.length;

    // Store each tab separately (avoids 100KB CacheService limit)
    try {
      cache.put(tabCacheKey(name), JSON.stringify(rows), CACHE_DURATION_S);
    } catch(e) {
      // If tab data exceeds 100KB (future-proofing), fall back to no-cache for this tab
      Logger.log('Cache put failed for tab ' + name + ': ' + e.message);
    }
  });

  const meta = { tabs: tabs, lastUpdated: now, counts: counts };
  cache.put(META_CACHE_KEY, JSON.stringify(meta), CACHE_DURATION_S);

  return { success: true, lastUpdated: now, tabs, resources, meta: counts };
}

// Triggered every 15 minutes by a time-based trigger
function scheduledRefresh() {
  try {
    refreshCacheAndReturn();
    Logger.log('ABL cache refreshed at ' + new Date().toISOString());
  } catch(e) {
    Logger.log('ABL cache refresh failed: ' + e.message);
  }
}

// ─── Sheet parsing ────────────────────────────────────────────────────────────
function parseSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(function(h) { return h ? h.toString().trim() : ''; });
  const rows    = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Build a label→value map for this row
    var obj = {};
    headers.forEach(function(header, idx) {
      if (header) obj[header] = row[idx];
    });

    // Skip rows with no ID
    var id = getAnyField(obj, [
      'UNIQUE ID NO FOR WORKSHEET',
      'UNIQUE ID NO FOR GAMES',
      'UNIQUE ID NO FOR KITS',
      'UNIQUE ID NO FOR FLASHCARDS'
    ]);
    if (!id || str(id) === '') continue;

    rows.push(buildResource(obj, str(id)));
  }

  return rows;
}

function buildResource(obj, id) {
  return {
    id:              id,
    name:            str(obj['NAME OF RESOURCES']),
    type:            str(obj['TYPE OF RESOURCES']),
    concept:         str(obj['CONCEPT']),
    language:        str(obj['LANGUAGE']),
    ownership:       str(obj['OWNERSHIP']),
    quantity:        obj['QUANTITY OF SET'] ? parseInt(obj['QUANTITY OF SET']) || null : null,
    storageLocation: str(obj['STORAGE LOCATION']),

    // Photo URL — different header label in Worksheets vs other tabs
    photoUrl: str(obj['LINK OF Photos from drive'] || obj['LINK OF PHOTO FROM THE DRIVE']),

    // Video URL
    videoUrl: str(obj['EXPLAINATION VIDEO LINK FROM THE DRIVE']),

    // Canva URL — different header labels across tabs
    canvaUrl: str(obj['CANVA LINK FROM THE DRIVE'] || obj['CANVA LINK'] || obj['Canva/purchase']),

    // Grades: comma-separated string → array
    grades: parseList(obj['GRADES'], true),

    // Chapters per grade
    chapters: {
      'GRADE 1': parseList(obj['Chapters in Grade 1'], false),
      'GRADE 2': parseList(obj['Chapters in Grade 2'], false),
      'GRADE 3': parseList(obj['Chapters in Grade 3'], false),
      'GRADE 4': parseList(obj['Chapters in Grade 4'], false),
      'GRADE 5': parseList(obj['Chapters in Grade 5'], false),
    },

    // Description — note "BRIFE" typo exists in sheet, match both
    description:   str(obj['BRIEF DESCRIPTION'] || obj['BRIFE DESCRIPTION']),
    referenceLink: str(obj['REFERENCE LINK IF NOT OWNED BY TIDE']),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function str(val) {
  if (val === null || val === undefined || val === '') return null;
  var s = val.toString().trim();
  return s === '' ? null : s;
}

function getAnyField(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== '') return obj[keys[i]];
  }
  return null;
}

function parseList(val, uppercase) {
  if (!val) return [];
  return val.toString().split(',')
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s !== ''; })
    .map(function(s) { return uppercase ? s.toUpperCase() : s; });
}
```

---

## 3. React Implementation

### 3.1 Configuration Constant

Create `src/config/abl.js` — see **Section 0.5** for the full content. All URLs are read from `import.meta.env`; never hardcode them in this file or anywhere else in the React codebase.

### 3.2 New Files to Create

```
src/
  config/
    abl.js                            # API URL, cache TTL, tab config
  hooks/
    useABLData.js                     # fetch + sessionStorage cache hook
  utils/
    driveUtils.js                     # Drive URL → thumbnail/embed transforms
  pages/
    resources/
      AblHome.jsx                     # static home with dynamic stats
      AblResourceCenter.jsx           # listings page (all types, filters, pagination)
      AblDetail.jsx                   # single resource detail page
      AblContribute.jsx               # static contribute page + form CTA
  components/
    abl/
      AblNavBar.jsx                   # sticky sub-nav: Home | Resource Center | Contribute
      ResourceCard.jsx                # card for listing grid
      ResourceFilters.jsx             # filter + search bar
      ResourceGrid.jsx                # 3-col grid with loading/error/empty states
      Pagination.jsx                  # page number + prev/next bar
      DriveImage.jsx                  # Drive thumbnail with fallback
      ResourceTypeBadge.jsx           # coloured type pill (Worksheet / Games / etc.)
```

### 3.3 Files to Modify

```
src/App.jsx                           # add routes + imports
src/components/layout/Header.jsx      # add nested flyout for ABL Resources
content/shared/navigation.yaml       # add ABL Resources with subItems
content/shared/footer.yaml           # add ABL Resources to Resources column
```

### 3.4 Routes (App.jsx)

Add after the existing `/resources/publications` route, in this exact order:

```jsx
import { Navigate } from 'react-router-dom'
import AblHome           from './pages/resources/AblHome'
import AblResourceCenter from './pages/resources/AblResourceCenter'
import AblDetail         from './pages/resources/AblDetail'
import AblContribute     from './pages/resources/AblContribute'

// Inside <Routes>:
<Route path="/resources/abl-resources"                      element={<AblHome />} />
<Route path="/resources/abl-resources/resource-center"      element={<AblResourceCenter />} />
<Route path="/resources/abl-resources/resource-center/:id"  element={<AblDetail />} />
<Route path="/resources/abl-resources/contribute"           element={<AblContribute />} />
```

Order matters: `:id` must not shadow `resource-center` — it won't because `/resource-center/:id` is more specific than a bare `:id` segment.

---

## 4. Data Hook — `useABLData.js`

```js
// src/hooks/useABLData.js
import { useState, useEffect, useCallback } from 'react'
import { ABL_API_URL, ABL_CACHE_TTL_MS } from '../config/abl'

// Guard: surface a clear error if the env var was never set
if (!ABL_API_URL) {
  console.error('[ABL] VITE_ABL_API_URL is not set. Add it to .env.development — see docs/ABL-APPSCRIPT-SETUP-GUIDE.md')
}

const STORAGE_KEY = 'abl_api_cache_v2'

function readCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { payload, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > ABL_CACHE_TTL_MS) return null
    return payload
  } catch { return null }
}

function writeCache(payload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ payload, timestamp: Date.now() }))
  } catch { /* sessionStorage unavailable (e.g. private mode) — degrade gracefully */ }
}

export function useABLData() {
  const [data,        setData]        = useState(null)   // full API response
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async (bypassCache = false) => {
    setLoading(true)
    setError(null)

    if (!bypassCache) {
      const cached = readCache()
      if (cached) {
        setData(cached)
        setLastUpdated(cached.lastUpdated)
        setLoading(false)
        return
      }
    }

    try {
      const controller = new AbortController()
      const timeout    = setTimeout(() => controller.abort(), 10_000) // 10s timeout

      const res  = await fetch(ABL_API_URL, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      if (!json.success) throw new Error(json.error || 'API returned success: false')

      writeCache(json)
      setData(json)
      setLastUpdated(json.lastUpdated)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError('Failed to load resources. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const refetch = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    fetchData(true)
  }, [fetchData])

  // Derive a flat array of all resources across all tabs
  const allResources = data
    ? data.tabs.flatMap(tab => (data.resources[tab] || []).map(r => ({ ...r, tab })))
    : []

  return { data, allResources, loading, error, lastUpdated, refetch }
}
```

---

## 5. Drive URL Utilities — `driveUtils.js` / `ablThumbnails.js`

> **Update (thumbnail sync migration):** Earlier versions of this spec built
> card/detail/lightbox thumbnail URLs at runtime via the unofficial
> `lh3.googleusercontent.com/d/<id>=wN` endpoint. That endpoint has no
> published quota and rate-limited (`HTTP 429` → Chrome `ERR_BLOCKED_BY_ORB`)
> under ordinary page-load traffic. Thumbnails are now synced ahead of time
> into self-hosted WebP assets by `scripts/sync-abl-thumbnails.js` — see
> `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md`. `driveUtils.js` now only handles
> explicit outbound links (preview/download), not passive image loads.

```js
// src/utils/driveUtils.js

export function extractDriveFileId(url) {
  if (!url) return null
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// For iframe embed (video/doc preview)
export function getDrivePreviewUrl(url) {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/file/d/${id}/preview` : null
}

// For direct download link
export function getDriveDownloadUrl(url) {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null
}
```

```js
// src/utils/ablThumbnails.js
import manifest from '../data/abl-thumbnails-manifest.json'
import { imgSrc } from './imgSrc'

// Resolves a resource id to a self-hosted thumbnail path, synced ahead of
// time by scripts/sync-abl-thumbnails.js. Returns null if the resource has
// no photo, or hasn't been synced yet — callers fall back to a placeholder.
export function getAblThumbnail(id, variant = 'thumb') {
  const entry = manifest[id]
  if (!entry) return null
  return imgSrc(entry[variant])
}
```

---

## 6. Navigation Changes

### 6.1 content/shared/navigation.yaml

Add `ABL Resources` with `subItems` to the Resources section. The `subItems` key is new and requires a Header.jsx change (see 6.3).

```yaml
  - label: "Resources"
    children:
      - label: "Saral Kadam Materials"
        to: "/resources/saral-kadam"
        desc: "Foundational learning booklets"
      - label: "Annual Reports"
        to: "/resources/annual-reports"
        desc: "Reports from 2014 to present"
      - label: "Our Publications"
        to: "/resources/publications"
        desc: "Research papers & articles"
      - label: "ABL Resources"
        to: "/resources/abl-resources"
        desc: "Activity-Based Learning resource library"
        subItems:
          - label: "Home"
            to: "/resources/abl-resources"
          - label: "Resource Center"
            to: "/resources/abl-resources/resource-center"
          - label: "Contribute"
            to: "/resources/abl-resources/contribute"
```

Run `npm run content:sync` after editing.

### 6.2 content/shared/footer.yaml

Under the Resources column, add:
```yaml
      - label: "ABL Resources"
        to: "/resources/abl-resources"
```

Run `npm run content:sync` after editing.

### 6.3 Header.jsx — Nested Flyout Support

Modify the existing `Dropdown` component to detect `item.subItems`. When present, render a right-side flyout on hover. **Do not change behaviour for items without `subItems`.**

**Implementation requirements:**
- Wrap the item `<Link>` in `<div className="relative group/sub">` when `item.subItems` exists
- Add `<ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />` to the right of the item label
- Flyout: `<motion.div className="absolute left-full top-0 ml-2 w-52 bg-white rounded-2xl shadow-float border border-tide-border/60 py-2 z-50 overflow-hidden">` — shown via `group/sub-hover:block`
- Flyout items: same `<Link>` styling as parent dropdown items but without `desc` text
- Add accent bar to flyout top (same `gradient-primary-soft` line as parent dropdown)
- Use `AnimatePresence` + Framer Motion for the flyout animation (same as parent: `opacity 0→1, y 10→0, scale 0.97→1`)
- On mobile (hamburger menu): render `subItems` as an indented list directly below the parent item (no flyout — just a 2-level accordion)
- Clicking any sub-item closes the entire menu (call `onClose`)
- Keyboard: `subItems` items are focusable; Escape closes flyout and returns focus to parent item

---

## 7. Component Specifications

### 7.1 `AblNavBar.jsx`

Sticky sub-navigation bar shown on all 3 ABL pages.

```
Props: { active: 'home' | 'resource-center' | 'contribute' }
```

Layout: horizontal pill tabs. Sticky at `top-[72px]` (below main header), `z-30`, `bg-white border-b border-tide-border`.

| Tab | Active route contains |
|---|---|
| Home | `/resources/abl-resources` (exact) |
| Resource Center | `/resources/abl-resources/resource-center` |
| Contribute | `/resources/abl-resources/contribute` |

Detect active from `useLocation()` — do not rely on the `active` prop alone so back-navigation stays in sync.

### 7.2 `DriveImage.jsx`

```
Props: { id: string, alt: string, className?: string, variant?: 'thumb' | 'full', imgClassName?: string }
```

- Resolve `id` → `getAblThumbnail(id, variant ?? 'thumb')` (self-hosted, synced ahead of time — see §5)
- Render `<img loading="lazy" />`
- `onError` or no manifest entry yet: fallback `<div className="w-full h-full bg-gradient-to-br from-primary-light to-primary/20 flex items-center justify-center"><BookOpen className="w-10 h-10 text-primary/40" /></div>`
- The outer container must have a defined aspect ratio so layout does not shift: `aspect-[3/4]` (portrait), pass `className` to override

### 7.3 `ResourceTypeBadge.jsx`

```
Props: { type: string }
```

Maps type string to colour class using `TAB_STYLE_MAP` from `src/config/abl.js`. Falls back to `_default` for unknown types. Renders as a small pill: `px-2.5 py-0.5 text-xs font-semibold rounded-full border`.

Colour class map:
```js
const COLOR_MAP = {
  blue:    'bg-blue-50    text-blue-700    border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet:  'bg-violet-50  text-violet-700  border-violet-200',
  amber:   'bg-amber-50   text-amber-700   border-amber-200',
  gray:    'bg-gray-50    text-gray-700    border-gray-200',
}
```

### 7.4 `ResourceCard.jsx`

```
Props: { resource: ResourceObject }
Navigates to: /resources/abl-resources/resource-center/:id
```

Full card is a `<Link>` for keyboard accessibility.

```
┌──────────────────────────────┐
│  DriveImage (aspect-[4/3])   │  ← thumbnail, fallback gradient if null/error
├──────────────────────────────┤
│  [TypeBadge]  [Lang badge]   │  ← top badges row
│                              │
│  Resource Name               │  ← font-display, text-base font-semibold, line-clamp-2
│                              │
│  Concept (short tabs only)   │  ← text-xs text-tide-muted, line-clamp-1
│  (Omit for Flashcards where  │
│   concept is a full sentence)│
│                              │
│  [G1] [G2] [G4]             │  ← grade chips, max show 3, then "+N more"
│                              │
│  Ownership: TIDE / External  │  ← text-xs, dot indicator
└──────────────────────────────┘
```

Language badge: if comma-separated (e.g. "Gujarati, English"), show first value + `+N` indicator.  
Grade chips: `bg-primary-light text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20`.  
Card: `bg-white rounded-2xl border border-tide-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden`.

### 7.5 `ResourceFilters.jsx`

```
Props: { allResources: ResourceObject[], filters: FilterState, onChange: fn, onClear: fn, tabs: string[] }
```

FilterState shape:
```ts
{
  search:    string,   // free text, matches resource.name (case-insensitive)
  type:      string,   // "" = all types; values come from data.tabs (dynamic)
  grades:    string[], // ["GRADE 1", "GRADE 3"] — multi-select
  language:  string,   // "" = all
  ownership: string,   // "" | "TIDE" | "external"
}
```

**Derive filter options dynamically from `allResources`** — never hardcode:
- `types`: `data.tabs` array from API (passed as `tabs` prop)
- `languages`: `[...new Set(allResources.flatMap(r => r.language?.split(',').map(s=>s.trim()) ?? []))]` sorted
- `ownerships`: `[...new Set(allResources.map(r => r.ownership))]` — group non-TIDE as "External"

**Layout (desktop, single bar):**
```
[🔍 Search...] [Type ▾] [Grades: G1 G2 G3 G4 G5] [Language ▾] [Ownership ▾] [Clear ×]
```

**Mobile:** Stack vertically, full-width inputs.

**Showing X of Y results:** Rendered below the filter bar, always visible. "Showing 24 of 52 results" (showing = displayed on current page, of = total matching filters).

**URL param sync:** All filter state persists in URL search params so filtered views are shareable and back-button works:
- `?type=Worksheet&grade=GRADE+1,GRADE+3&lang=Gujarati&own=TIDE&search=Addition&page=2`
- On mount: read URL params to initialise filter state
- On filter change: update URL params (use `useNavigate` with `replace: true`)

### 7.6 `Pagination.jsx`

```
Props: { total: number, page: number, perPage?: number, onChange: (page: number) => void }
perPage defaults to ABL_PAGE_SIZE (24)
```

- Total pages = `Math.ceil(total / perPage)`
- Show up to 7 page numbers: `[1] [2] ... [5] [6] [7] ... [12]` with `…` ellipsis beyond 7
- Previous / Next buttons, visually disabled + `aria-disabled` at bounds
- "Showing X–Y of Z" text
- On page change: scroll to top of grid using `gridRef` (passed from parent or window scroll)
- Page syncs to URL param `?page=N`

### 7.7 `ResourceGrid.jsx`

```
Props: { resources: ResourceObject[], loading: boolean, error: string | null, onRetry: fn }
```

**Loading:** 24 skeleton cards (`animate-pulse`, same height as real card).  
**Error:** Centred card with warning icon, error message, "Try again" button → calls `onRetry`.  
**Empty (after filters):** Centred illustration area, "No resources match your filters", "Clear all filters" button.  
**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.

---

## 8. Page Specifications

### 8.1 `AblHome.jsx`

```
<PageHero
  badge="Resources · ABL"
  title="ABL Resource Library"
  subtitle="A curated library of Activity-Based Learning resources for Grades 1–5, developed and used by TIDE Foundation educators."
  gradient
/>
<AblNavBar active="home" />

{/* Stats bar — dynamic from API meta */}
<section className="py-10 bg-white border-b border-tide-border">
  <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <AnimatedCounter value={data?.meta.total ?? 0}    label="Total Resources" />
      <AnimatedCounter value={data?.tabs.length ?? 0}   label="Resource Types" />
      <div><span className="text-3xl font-display font-semibold text-primary">1–5</span><p>Grades Covered</p></div>
      {/* lastUpdated formatted as "Jun 7, 2026 10:30 AM" */}
      <div><span>Last Synced</span><p>{formattedLastUpdated}</p></div>
    </div>
  </div>
</section>

{/* About section — static placeholder */}
<section className="section-padding bg-tide-bg">
  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h2>What is ABL?</h2>
      <p>{PLACEHOLDER: Description of Activity-Based Learning and TIDE's approach}</p>
      <Button to="/resources/abl-resources/resource-center">Browse All Resources →</Button>
    </div>
    <div>{PLACEHOLDER: image / illustration}</div>
  </div>
</section>

{/* Resource type cards — dynamic, one per tab from API */}
<section className="section-padding bg-white border-t border-tide-border">
  <div className="max-w-5xl mx-auto">
    <SectionHeader badge="Browse by Type" title="Explore Resource Types" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {data?.tabs.map(tab => (
        <Link to={`/resources/abl-resources/resource-center?type=${tab}`}>
          <Card> [TypeBadge] {TAB_STYLE_MAP[tab].pluralLabel} · {data.meta.counts[tab]} resources </Card>
        </Link>
      ))}
    </div>
  </div>
</section>
```

Loading state: show skeleton counters and skeleton type cards.

### 8.2 `AblResourceCenter.jsx`

```
<PageHero badge="Resources · ABL" title="Resource Center" subtitle="..." gradient />
<AblNavBar active="resource-center" />

<section className="section-padding bg-tide-bg">
  <div className="max-w-7xl mx-auto">    ← max-w-7xl (wider for 3-col grid)
    <ResourceFilters ... />
    <ResourceGrid ... />
    <Pagination ... />
  </div>
</section>
```

**Filter logic (applied client-side before pagination):**

```js
let filtered = allResources

if (filters.type)
  filtered = filtered.filter(r => r.type === filters.type || r.type + 's' === filters.type)

if (filters.grades.length)
  filtered = filtered.filter(r => filters.grades.some(g => r.grades.includes(g)))

if (filters.language)
  filtered = filtered.filter(r => r.language && r.language.toLowerCase().includes(filters.language.toLowerCase()))

if (filters.ownership === 'TIDE')
  filtered = filtered.filter(r => r.ownership === 'TIDE')
else if (filters.ownership === 'external')
  filtered = filtered.filter(r => r.ownership !== 'TIDE')

if (filters.search)
  filtered = filtered.filter(r => r.name && r.name.toLowerCase().includes(filters.search.toLowerCase()))

// Paginate
const startIdx = (page - 1) * ABL_PAGE_SIZE
const pageItems = filtered.slice(startIdx, startIdx + ABL_PAGE_SIZE)
```

**On tab/type filter change:** Reset `page` to 1 and scroll to top.

### 8.3 `AblDetail.jsx`

Route: `/resources/abl-resources/resource-center/:id`

On mount: read all resources from `useABLData()`, find `allResources.find(r => r.id === id)`. If not found after loading: show "Resource not found" with back link.

**Back link preserves filter state:** Read previous URL from `document.referrer` or pass filter params forward. Simplest: render `← Back to Resource Center` linking to `/resources/abl-resources/resource-center` (user's filters are in their browser history via URL params).

```
<PageHero badge={`Resources · ${resource.type}`} title={resource.name} gradient />
<AblNavBar active="resource-center" />

<section className="section-padding bg-tide-bg">
  <div className="max-w-5xl mx-auto">

    {/* Back */}
    <Link to="/resources/abl-resources/resource-center">← Back to Resource Center</Link>

    <div className="grid md:grid-cols-5 gap-10 mt-8">

      {/* Left (3 cols) — media */}
      <div className="md:col-span-3">
        <DriveImage id={resource.id} alt={resource.name} className="w-full" variant="thumb" />

        {/* Action links */}
        <div className="flex gap-3 mt-5 flex-wrap">
          {resource.videoUrl && (
            <a href={getDrivePreviewUrl(resource.videoUrl)} target="_blank" rel="noopener noreferrer">
              <PlayCircle /> Watch Video
            </a>
          )}
          {resource.canvaUrl && (
            <a href={resource.canvaUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> View in Canva
            </a>
          )}
          {resource.referenceLink && (
            <a href={resource.referenceLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Source Reference
            </a>
          )}
        </div>
      </div>

      {/* Right (2 cols) — metadata */}
      <div className="md:col-span-2 space-y-6">
        <ResourceTypeBadge type={resource.type} />

        {/* Concept */}
        <MetaField label="Concept" value={resource.concept} />

        {/* Language — split and badge each */}
        <MetaField label="Language">
          {resource.language?.split(',').map(lang => <Badge>{lang.trim()}</Badge>)}
        </MetaField>

        {/* Grades */}
        <MetaField label="Grades">
          {resource.grades.map(g => <GradeChip grade={g} />)}
        </MetaField>

        {/* Chapters per grade — only grades with data */}
        {Object.entries(resource.chapters)
          .filter(([, chs]) => chs.length > 0)
          .map(([grade, chs]) => (
            <details key={grade} className="border border-tide-border rounded-xl px-4 py-3">
              <summary className="font-body text-sm font-semibold text-tide-text cursor-pointer">
                {grade} — Chapters
              </summary>
              <p className="text-sm text-tide-muted mt-2">{chs.join(', ')}</p>
            </details>
          ))}

        {/* Ownership */}
        <MetaField label="Ownership" value={resource.ownership ?? '—'} />

        {/* Internal (de-emphasised) */}
        {resource.storageLocation && <p className="text-xs text-tide-muted">Storage: {resource.storageLocation}</p>}
        {resource.quantity && <p className="text-xs text-tide-muted">Quantity: {resource.quantity} set(s)</p>}
        <p className="text-xs text-tide-muted font-mono">ID: {resource.id}</p>
      </div>
    </div>

    {/* Description */}
    {resource.description && (
      <div className="mt-10 bg-white rounded-2xl p-8 border border-tide-border">
        <h3 className="font-display text-xl font-semibold mb-4">About This Resource</h3>
        <p className="text-tide-muted font-body leading-relaxed">{resource.description}</p>
      </div>
    )}

  </div>
</section>
```

### 8.4 `AblContribute.jsx`

```
<PageHero
  badge="Resources · ABL"
  title="Contribute a Resource"
  subtitle="Help grow the ABL library. Share a resource you've used in your classroom and it will be reviewed by the TIDE team."
  gradient
/>
<AblNavBar active="contribute" />

<section className="section-padding bg-tide-bg">
  <div className="max-w-3xl mx-auto text-center">

    {/* Static content — placeholder */}
    <h2>Share What Works</h2>
    <p>{PLACEHOLDER: paragraph about why contributing matters}</p>

    {/* Process steps */}
    <div className="grid sm:grid-cols-3 gap-6 mt-10 text-left">
      <StepCard step={1} title="Fill the Form"        desc="Share details about your resource, including photos and concept." />
      <StepCard step={2} title="TIDE Reviews"         desc="Our team reviews and verifies the resource for quality and accuracy." />
      <StepCard step={3} title="Gets Published"       desc="Approved resources are added to the library for all educators." />
    </div>

    {/* CTA */}
    <Button
      href={CONTRIBUTE_FORM_URL}   {/* from src/config/abl.js */}
      external
      size="lg"
      className="mt-10"
    >
      Open Contribution Form ↗
    </Button>
    <p className="text-xs text-tide-muted mt-3">
      Opens in a new tab. {/* CONTRIBUTE_FORM_URL === placeholder → show note below */}
      {CONTRIBUTE_FORM_URL === 'REPLACE_WITH_GOOGLE_FORM_URL' && (
        <span className="text-accent font-semibold">Form link coming soon.</span>
      )}
    </p>

  </div>
</section>
```

---

## 9. Design & Accessibility

### Design tokens (use existing only)
All existing Tailwind tokens apply. Do not add new colours to `tailwind.config.js`.

### Accessibility requirements
- Every `<Link>` and `<a>` that contains only an icon must have `aria-label`
- `DriveImage` must always have a non-empty `alt` text
- `ResourceCard` wraps entire card in `<Link>` — add `aria-label={`View ${resource.name}`}` on the Link
- Flyout nav: `role="menu"`, items `role="menuitem"`, `aria-expanded` on trigger
- Pagination: `aria-label="Pagination"` on nav, `aria-current="page"` on active page button
- Filter dropdowns: associated labels via `htmlFor` / `aria-label`
- Loading skeletons: `aria-busy="true"` on the grid container, `aria-label="Loading resources"` 
- Colour contrast: all text on white or `bg-tide-bg` must pass WCAG AA (4.5:1)

### Responsiveness
- Mobile: single column grid, filters stacked, tab nav scrollable horizontally
- Tablet: 2-col grid
- Desktop: 3-col grid
- Detail page: single column on mobile, 5-col split on `md`+
- Flyout nav: hidden on mobile, replaced by accordion in hamburger menu

### Performance
- `DriveImage` always uses `loading="lazy"` — images below the fold never block page load
- First meaningful paint: the filter bar and skeleton cards render before the API response arrives
- `useABLData` fetches on component mount — do not await in router/layout; the listing page handles its own loading state

---

## 10. Security

- **GAS Web App** deployed as "Execute as: Me, Anyone can access" — exposes only what the script explicitly returns. Sheet data is filtered server-side before returning.
- **No write path** exists in the GAS script — `doGet` only. `doPost` is not implemented.
- **No credentials in frontend** — `ABL_API_URL` is a public URL, not a secret. The sheet itself is private.
- **External links** (Drive, Canva, Form): always use `target="_blank" rel="noopener noreferrer"`.
- **XSS**: all resource data is rendered via React JSX (auto-escaped). No `dangerouslySetInnerHTML` anywhere.
- **CORS**: GAS sets appropriate CORS headers for GET requests when deployed as "Anyone". No proxy needed.
- **Content validation**: the GAS script's `buildResource()` function normalises all fields before returning — null-coerces instead of passing raw sheet values.
- **Thumbnail sync endpoints** (`?action=manifest`, `?action=fetchImage`) are gated by `SYNC_TOKEN`, a shared secret stored only in Script Properties (Apps Script) and a GitHub Actions encrypted secret — never in source. `fetchImage` additionally allowlists against the live resource list by `id`; it never accepts a raw Drive `fileId`, so a leaked token can only ever read images that are already public resources, not arbitrary files in the linked Drive.
- **`GITHUB_PAT`** (used by `onSheetChange` to trigger the sync workflow) must be a *fine-grained* token scoped to this one repository with only the "Actions: Read and write" permission — no `contents`, no `admin`, no access to other repos. If it ever leaks, the blast radius is "can trigger a workflow run," nothing more.
- **Downloaded image bytes are never trusted blindly**: the sync job lets `sharp` validate the bytes actually decode as an image (not a hand-rolled magic-byte check — `sharp` covers far more real-world formats) and enforces a 25MB size cap before writing anything into the deployed site, since the Sheet is editable by non-developer staff and is a softer trust boundary than the codebase itself.
- **Resource ids are not trusted as filesystem-safe** (2026-06-21): the sync script allowlist-validates every `id` (letters, digits, space, `_()-` only) before it reaches `path.join`/`fs.rm`, and independently verifies any path about to be deleted actually resolves inside the assets directory. Without this, a Sheet-supplied id containing `../` — malicious or just a typo — could write or delete files outside the intended directory.
- **The sync script never lets `ABL_SYNC_TOKEN` reach a thrown `Error` or log line** (2026-06-21): error messages use a token-redacted copy of the request URL. This repo is public, so anything printed to a GitHub Actions log is publicly readable — GitHub's own secret redaction is a backstop, not something this code relies on.

---

## 11. Edge Cases

| Edge case | Handling |
|---|---|
| GAS cold start (first request after idle) | Loading skeleton shows; data arrives in 2–5s. Acceptable. |
| Resource not yet synced (new sheet row before next sync run) | No manifest entry → `DriveImage` renders gradient fallback immediately. Never show broken img. |
| Resource with no photo | `url=null` → fallback rendered immediately, no HTTP request made. |
| Gujarati script in name/concept | Rendered as-is; Noto Sans Gujarati is already loaded globally. |
| Flashcard concept is a full sentence | `ResourceCard` detects `type === 'Flashcard'` and omits concept line. `AblDetail` always renders concept in full. |
| Language field comma-separated ("Gujarati, English") | Split on comma, render each as a badge. |
| "No Language" value | Display as "Language Independent" badge. |
| Unknown ownership (not TIDE) | Group as "External" in ownership filter; display as-is on detail page. |
| `grades` is null/empty | Show no grade chips; hide chapters accordion on detail page. |
| GAS returns `success: false` | Show error state with retry button. Log `error` field to console. |
| GAS times out (10s client-side) | Show timeout error message with retry button. |
| sessionStorage unavailable | `writeCache` silently fails (try/catch). Data still renders; just refetched each navigation. |
| New sheet tab added | GAS picks it up automatically on next refresh. React uses `TAB_STYLE_MAP[tab] ?? TAB_STYLE_MAP._default` — renders with gray badge until `TAB_STYLE_MAP` in `abl.js` is updated. No crash. |
| Empty sheet tab | `rows.length === 0` → tab not included in response `tabs` array → not shown in filters. |
| Row with blank ID | Skipped in `buildResource` — GAS level check. Never reaches React. |
| Filter produces 0 results | Empty state: "No resources match your filters" + "Clear filters" button. |
| `id` in URL doesn't match any resource | "Resource not found" card with link back to Resource Center. |
| Navigate to `/resources/abl-resources/resource-center/W99` (valid tab, non-existent ID) | After data loads: "not found" state. |

---

## 12. Implementation Order

Implement strictly in this order. Do not skip ahead.

**Phase 1 — Foundation (no UI)**
1. Create `src/config/abl.js` (put a placeholder `ABL_API_URL = 'PENDING'`)
2. Create `src/utils/driveUtils.js`
3. Create `src/hooks/useABLData.js`
4. ✅ Test: in browser console, `import('/src/hooks/useABLData.js')` should not throw syntax errors

**Phase 2 — Atomic components**
5. `DriveImage.jsx`
6. `ResourceTypeBadge.jsx`
7. `Pagination.jsx`
8. `AblNavBar.jsx`
9. `ResourceCard.jsx`
10. `ResourceFilters.jsx`
11. `ResourceGrid.jsx`

**Phase 3 — Pages**
12. `AblContribute.jsx` (static, no data dependency — easiest to verify)
13. `AblHome.jsx`
14. `AblResourceCenter.jsx`
15. `AblDetail.jsx`

**Phase 4 — Routing and navigation**
16. Update `src/App.jsx` with routes
17. Update `content/shared/navigation.yaml`
18. Update `content/shared/footer.yaml`
19. Run `npm run content:sync`
20. Update `src/components/layout/Header.jsx` (flyout support)

**Phase 5 — Wire up real API URL**
21. Owner completes Apps Script setup (see `ABL-APPSCRIPT-SETUP-GUIDE.md`)
22. Update `ABL_API_URL` in `src/config/abl.js` with the real deployment URL
23. Update `CONTRIBUTE_FORM_URL` if form URL is available

**Phase 6 — Verify**
24. `npm run build` — zero errors required
25. Run all tests (see Section 13)

---

## 13. Testing

### Unit tests — `driveUtils.js`

| Input | Expected |
|---|---|
| `extractDriveFileId('https://drive.google.com/file/d/ABC123/view?usp=sharing')` | `'ABC123'` |
| `extractDriveFileId(null)` | `null` |
| `extractDriveFileId('https://example.com')` | `null` |
| `getAblThumbnail('W1', 'thumb')` (synced) | `'/assets/images/abl/W1-thumb.webp'` (base-path resolved) |
| `getAblThumbnail('UNKNOWN_ID')` | `null` |
| `getDrivePreviewUrl('https://drive.google.com/file/d/XYZ/view')` | `'https://drive.google.com/file/d/XYZ/preview'` |

### Integration tests (after Phase 4)

| Test | Expected |
|---|---|
| Navigate to `/#/resources/abl-resources` | Renders AblHome |
| Navigate to `/#/resources/abl-resources/resource-center` | Renders AblResourceCenter, loading state visible, then resources appear |
| Navigate to `/#/resources/abl-resources/contribute` | Renders AblContribute (does NOT render AblResourceCenter with `:id='contribute'`) |
| Navigate to `/#/resources/abl-resources/resource-center/W1` | Renders AblDetail for W1 |
| Filter by type "Worksheet" | Only Worksheet type resources shown |
| Filter by grade G3 | Only resources with GRADE 3 in grades array |
| Combined filter (type + grade) | Both filters applied |
| Page 2 | Shows resources 25–48, URL has `?page=2` |
| Reload page 2 with filter | Filter and page state restored from URL params |
| Click resource card | Navigates to detail page |
| Back button from detail | Returns to resource center with previous filter params |
| `sessionStorage` cache | Second visit to Resource Center returns data instantly (no loading spinner) |
| Retry button | Clears cache and re-fetches |

### E2E tests

| Test | Steps | Expected |
|---|---|---|
| Nav flyout | Hover Resources → hover ABL Resources | Flyout shows Home / Resource Center / Contribute |
| Nav flyout click | Click "Resource Center" in flyout | Navigates, flyout closes |
| Footer link | Scroll to footer, click ABL Resources | Navigates to AblHome |
| Mobile nav | Resize to 375px, open hamburger | ABL Resources shows inline sub-items |
| Image fallback | Use DevTools to block `lh3.googleusercontent.com` | Gradient fallback shows on all cards, no broken icons |
| Full user journey | Home → Resources → ABL Resources → Resource Center → filter by Kits → click a Kit → read detail → back button | All steps work, filter preserved on back |
| Build check | `npm run build` | Zero errors, zero warnings about missing files |

---

## 14. Reusable Pattern Note

The **Apps Script JSON API + sessionStorage cache** pattern used here is reusable for any future feature that needs dynamic Google Sheets data:

1. Copy `src/hooks/useABLData.js` as a template
2. Change the API URL constant
3. Adapt `buildResource()` in GAS for the new schema
4. Set up a new GAS Web App per feature (or add a `?dataset=name` param to one shared GAS)

Document this pattern in `memory/` when this feature ships.

---

*End of developer specification. An implementing agent can build this feature end-to-end from this document. For Apps Script setup, see `docs/ABL-APPSCRIPT-SETUP-GUIDE.md`.*
