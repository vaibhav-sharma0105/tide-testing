# ABL Resource Library — Apps Script Setup Guide

**Audience:** Site owner (non-developer)  
**Time required:** ~20 minutes  
**What you will set up:** A Google Apps Script Web App that reads your private Google Sheet and serves its data as a JSON API for the website.

---

## Before You Start — What You Need

- Access to the Google account that **owns** the sheet (`1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ`)
- A browser (Chrome recommended)

**Do NOT do this from a different Google account.** The script needs to run as the sheet owner to access a private sheet.

---

## Step 1 — Open the Sheet

1. Go to: `https://docs.google.com/spreadsheets/d/1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ`
2. Make sure you are signed in as the sheet owner.

---

## Step 2 — Open Apps Script

1. In the sheet, click the top menu: **Extensions**
2. Click **Apps Script**
3. A new browser tab opens — this is the Apps Script editor.
4. You will see a file called `Code.gs` in the left sidebar with some starter code.

---

## Step 3 — Replace the Code

1. Click inside the code editor area.
2. Press **Ctrl+A** (Windows) or **Cmd+A** (Mac) to select all existing code.
3. Delete it.
4. Paste the complete code block below:

```javascript
// ─── Configuration ───────────────────────────────────────────────────────────
var SHEET_ID         = '1Cdx2iVkzA_-mv9b0vKXmo1eTRdz3K7HmtBSKDrM8CgQ';
var CACHE_DURATION_S = 900; // 15 minutes
var SKIP_SHEETS      = []; // Add sheet tab names to exclude, e.g. ['Metadata', 'Config']

// ─── Cache keys ──────────────────────────────────────────────────────────────
var META_CACHE_KEY = 'abl_meta_v2';
function tabCacheKey(tabName) { return 'abl_tab_v2_' + tabName; }

// ─── Entry point (runs on every web request) ─────────────────────────────────
function doGet(e) {
  try {
    var result = getFromCacheOrFetch();
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errResponse = {
      success: false, error: err.message,
      tabs: [], resources: {}, meta: { counts: {}, total: 0 }
    };
    return ContentService
      .createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Cache logic ─────────────────────────────────────────────────────────────
function getFromCacheOrFetch() {
  var cache    = CacheService.getScriptCache();
  var metaJson = cache.get(META_CACHE_KEY);

  if (metaJson) {
    var meta      = JSON.parse(metaJson);
    var resources = {};
    var allHit    = true;
    for (var i = 0; i < meta.tabs.length; i++) {
      var tabJson = cache.get(tabCacheKey(meta.tabs[i]));
      if (!tabJson) { allHit = false; break; }
      resources[meta.tabs[i]] = JSON.parse(tabJson);
    }
    if (allHit) {
      return { success: true, lastUpdated: meta.lastUpdated, tabs: meta.tabs, resources: resources, meta: meta.counts };
    }
  }

  return refreshCacheAndReturn();
}

function refreshCacheAndReturn() {
  var cache     = CacheService.getScriptCache();
  var ss        = SpreadsheetApp.openById(SHEET_ID);
  var sheets    = ss.getSheets();
  var tabs      = [];
  var resources = {};
  var counts    = { counts: {}, total: 0 };
  var now       = new Date().toISOString();

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name  = sheet.getName();
    if (SKIP_SHEETS.indexOf(name) !== -1) continue;
    var rows = parseSheet(sheet);
    if (rows.length === 0) continue;

    tabs.push(name);
    resources[name] = rows;
    counts.counts[name] = rows.length;
    counts.total += rows.length;

    try {
      cache.put(tabCacheKey(name), JSON.stringify(rows), CACHE_DURATION_S);
    } catch(e) {
      Logger.log('Cache put failed for ' + name + ': ' + e.message);
    }
  }

  var meta = { tabs: tabs, lastUpdated: now, counts: counts };
  cache.put(META_CACHE_KEY, JSON.stringify(meta), CACHE_DURATION_S);

  return { success: true, lastUpdated: now, tabs: tabs, resources: resources, meta: counts };
}

// ─── Scheduled refresh (runs every 15 minutes via trigger) ───────────────────
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
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = [];
  for (var h = 0; h < data[0].length; h++) {
    headers.push(data[0][h] ? data[0][h].toString().trim() : '');
  }

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = row[j];
    }

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
    quantity:        obj['QUANTITY OF SET'] ? (parseInt(obj['QUANTITY OF SET']) || null) : null,
    storageLocation: str(obj['STORAGE LOCATION']),
    photoUrl:        str(obj['LINK OF Photos from drive'] || obj['LINK OF PHOTO FROM THE DRIVE']),
    videoUrl:        str(obj['EXPLAINATION VIDEO LINK FROM THE DRIVE']),
    canvaUrl:        str(obj['CANVA LINK FROM THE DRIVE'] || obj['CANVA LINK'] || obj['Canva/purchase']),
    grades:          parseList(obj['GRADES'], true),
    chapters: {
      'GRADE 1': parseList(obj['Chapters in Grade 1'], false),
      'GRADE 2': parseList(obj['Chapters in Grade 2'], false),
      'GRADE 3': parseList(obj['Chapters in Grade 3'], false),
      'GRADE 4': parseList(obj['Chapters in Grade 4'], false),
      'GRADE 5': parseList(obj['Chapters in Grade 5'], false),
    },
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

5. Click the **Save** icon (floppy disk) or press **Ctrl+S**.
6. You can name the project anything — e.g. `TIDE ABL Resource API`.

---

## Step 4 — Test the Script Before Deploying

1. In the function dropdown at the top (it might say `doGet` or `myFunction`), select **`scheduledRefresh`**.
2. Click the **Run** button (▶ triangle icon).
3. The first time, Google will ask for permissions. Click **Review permissions**.
4. Choose your Google account.
5. You may see a "Google hasn't verified this app" warning — click **Advanced**, then **Go to [project name] (unsafe)**.
6. Click **Allow**.
7. After it runs, click **Execution log** (bottom of screen). You should see: `ABL cache refreshed at [timestamp]`.

If you see an error instead, check that the Sheet ID in the code matches your sheet exactly.

---

## Step 5 — Deploy as a Web App

1. Click the **Deploy** button (top right, blue button).
2. Click **New deployment**.
3. Click the gear icon ⚙ next to "Select type" and choose **Web app**.
4. Fill in the settings:
   - **Description:** `ABL Resource API v1`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone`
5. Click **Deploy**.
6. Google will again ask for permissions — approve them (same process as Step 4).
7. You will see a screen with your **Web App URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycbXXXXXXXXXXXXXXXXXXXX/exec
   ```

**⚠️ CRITICAL: Copy this URL now and save it somewhere safe.** You will need to give this to the developer to put into the website code.

---

## Step 6 — Verify the API Works

1. Open a new browser tab.
2. Paste your Web App URL and press Enter.
3. You should see a page full of JSON data starting with `{"success":true, ...`.
4. If you see `{"success":false, ...}` or an HTML error page, go back to Step 4 and check the execution log for errors.

---

## Step 7 — Set Up the 15-Minute Auto-Refresh Trigger

This makes the script automatically refresh its data cache every 15 minutes, so users always see up-to-date resources.

1. In the Apps Script editor, click the **clock icon** in the left sidebar (Triggers).
2. Click **+ Add Trigger** (bottom right).
3. Configure the trigger:
   - **Choose which function to run:** `scheduledRefresh`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `Time-driven`
   - **Select type of time based trigger:** `Minutes timer`
   - **Select minute interval:** `Every 15 minutes`
4. Click **Save**.
5. You will see the trigger appear in the list.

The cache will now refresh every 15 minutes automatically, even with no web requests coming in.

---

## Step 8 — Give the URL to Your Developer

Share the Web App URL from Step 5 with your developer. They will add it to the environment config files — **not** hardcoded in source code.

**File:** `.env.development` (for local testing) and `.env.production` (for the live site)
```
VITE_ABL_API_URL=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

They will also add it as a **GitHub repository secret** (`VITE_ABL_API_URL`) so the GitHub Pages build picks it up automatically. See `docs/ABL-RESOURCE-LIBRARY-SPEC.md` Section 0.4 for details.

> **Note:** The Google Sheet URL (`1Cdx2iVkzA_...`) only ever lives inside your `Code.gs` script. It is never shared with or stored in the website codebase.

---

## What to Save — Important Credentials

Save these in a secure place (e.g. a private note or password manager):

| Item | Where to find it | Why you need it |
|---|---|---|
| **Web App URL** | Step 5 deployment screen | Goes into website code; needed if developer needs to reconfigure |
| **Script ID** | Apps Script editor → Project Settings (gear icon) → Script ID | Needed to find this script later if you lose the browser bookmark |
| **Google Account email** | The account you used | This account must stay active; if deleted, the API stops working |

---

## Updating the Script in the Future

If you need to update the script code (e.g. to add a new field):

1. Open the Apps Script editor (via Extensions → Apps Script in the sheet).
2. Make your code changes.
3. Click **Save**.
4. Click **Deploy** → **Manage deployments**.
5. Click the **pencil/edit icon** next to your existing deployment.
6. Change the **version** to "New version".
7. Click **Deploy**.

**The Web App URL does NOT change when you update an existing deployment.** The developer does not need to update the website code.

> ⚠️ Do NOT click "New deployment" for updates — that creates a new URL. Only use "Manage deployments" → edit existing.

---

## Monitoring & Troubleshooting

### Check if the cache is refreshing

1. Open Apps Script editor.
2. Click the **clock icon** (Triggers) in the left sidebar.
3. Click the three-dot menu next to your trigger.
4. Click **Executions** to see a log of every run.
5. Green = success. Red = error (click to see details).

### Check the execution log manually

1. Open Apps Script editor.
2. Click the **Execution log** icon (left sidebar, looks like a list).
3. Recent runs are shown here with timestamps and any log messages.

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `Exception: Spreadsheet not found` | Wrong Sheet ID in code | Double-check `SHEET_ID` matches your sheet URL |
| `Exception: You do not have permission` | Running as wrong Google account | Make sure you're logged in as the sheet owner |
| `CacheService quota exceeded` | Too much data in one cache entry | Developer issue — contact developer to split the cache keys |
| `Timeout` (execution > 30s) | Sheet is very large | Developer issue — contact developer to implement per-tab fetching |
| API URL returns HTML instead of JSON | Not deployed as Web App | Redo Step 5, make sure "Web app" type is selected |

### Test the API any time

Paste your Web App URL in any browser. A healthy response starts with:
```json
{"success":true,"lastUpdated":"...","tabs":["Worksheet","Games","Kits","Flashcards"],...}
```

---

## Adding a New Sheet Tab

If you add a new tab to the Google Sheet (e.g. "Posters"):

1. Make sure the new tab has data and follows the same column structure as existing tabs.
2. The script picks it up automatically on the next 15-minute refresh — no code changes needed.
3. Let your developer know so they can add the new tab's display name and colour to `src/config/abl.js` in the website.

---

## Removing a Sheet Tab

If you delete or rename a tab:

1. The tab disappears from the API response on the next 15-minute refresh.
2. The website will automatically stop showing that resource type.
3. Let your developer know so they can clean up `src/config/abl.js`.

---

## When the API Stops Working — Emergency Checklist

If users report that the resource library isn't loading:

1. ✅ Open the Web App URL in a browser — does it return JSON?
2. ✅ Check the trigger execution log — are recent runs green?
3. ✅ Check if the Google account that owns the script is still active
4. ✅ Check if the sheet still exists at the same ID
5. ✅ Check if the sheet is still accessible by the script (try running `scheduledRefresh` manually from the editor)
6. ✅ If all else fails: share the Web App URL with your developer — they can diagnose from the JSON response

---

*End of setup guide. Keep this document and the Web App URL in a safe place.*
