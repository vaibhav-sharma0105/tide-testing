# TIDE Foundation website

Static React rebuild of [tideinternational.org](https://tideinternational.org/) for the TIDE Foundation (Together in Development and Education), an NGO in Ahmedabad, India working on educational reform.

The site is a single-page app built with Vite and deployed as static files to GitHub Pages. Page copy lives in YAML files that a non-developer can edit. The "Pramaan" section (activity-based learning resources) reads live data from a Google Sheet through a Google Apps Script web app.

## Tech stack

- Vite 8, React 19, React Router v7 (`BrowserRouter`, clean URLs)
- Tailwind CSS v3, Framer Motion 12, Lucide icons
- react-helmet-async for page titles and meta tags
- Vitest + Testing Library (unit), Playwright (end-to-end), ESLint 9

## Quick start

Requires Node 20 (the version the CI workflows use) and npm.

```bash
npm ci                 # or npm install
cp .env.example .env.development   # then fill in the values (optional, see below)
npm run dev            # syncs content, then starts Vite on http://localhost:5173
```

### Environment variables

Both are optional for local development of everything except the Pramaan pages. `.env.development` and `.env.production` are gitignored.

| Variable | Purpose |
|---|---|
| `VITE_ABL_API_URL` | Apps Script web app URL that serves the Pramaan resource data. If unset, Pramaan pages show a "not configured" error. |
| `VITE_ABL_CONTRIBUTE_FORM_URL` | Google Form URL for the "Contribute a resource" page. |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (runs `content:sync` first via `predev`) |
| `npm run build` | Production build into `dist/` (runs `content:sync` first via `prebuild`) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint (includes a `react/jsx-no-literals` rule that blocks hardcoded visible text in `src/pages` and `src/components`) |
| `npm test` | Vitest unit tests (`src/test/`) |
| `npm run test:e2e` | Playwright specs in `e2e/` (starts the dev server on port 5173 if none is running) |
| `npm run test:all` | Unit tests, then e2e |
| `npm run content:sync` | Convert `content/**/*.yaml` into `src/data/*.json` |
| `npm run content:validate` | Check YAML syntax and that referenced image files exist (a missing image is a warning); fails if any email or lives-impacted total in `content/` differs from `content/shared/site.yaml` |
| `npm run content:bootstrap` | Write starter navigation/footer YAML if absent (safe to re-run) |
| `npm run content:sync-abl-thumbnails` | Download and optimise Pramaan thumbnails (normally run by CI; needs `ABL_SYNC_TOKEN`) |
| `node scripts/a11y-audit.cjs [port]` | axe accessibility scan of every route; needs a dev server already running on that port (default 5175, e.g. `npx vite --port 5175`); the report is written to the OS temp folder as `a11y-report.json` |

## Where content lives

```
content/pages/*.yaml     one file per page (edit these to change copy and image paths)
content/shared/*.yaml    navigation, footer, common/UI microcopy, loader, error, 404 and coming-soon pages,
                         and site.yaml (site-wide facts: name, URL, logo, placeholder image, email, lives-impacted figure)
content/shared/llms.txt  template (not YAML) for the generated /llms.txt
src/data/*.json          GENERATED from content/ - do not edit by hand
public/assets/           images
```

`npm run content:sync` (run automatically before `dev` and `build`) turns the YAML into the JSON that the React components import. Non-developers should start with [CONTENT-GUIDE.md](CONTENT-GUIDE.md).

`content/shared/site.yaml` is the single source for the site name, URL, contact email and lives-impacted figure. `scripts/siteDataPlugin.js` (a Vite plugin) uses it to generate the page title, `og:site_name` and the JSON-LD blocks in `index.html`, and to render `content/shared/llms.txt` to `/llms.txt` at build and in dev. `npm run content:validate` fails if an email or lives-impacted total elsewhere in `content/` disagrees with it.

Any image that fails to load is replaced at runtime by `public/assets/images/shared/placeholder.svg` (`placeholderImage` in `site.yaml`; installed once from `src/main.jsx` by `src/utils/imagePlaceholder.js`; an `<img data-no-placeholder>` opts out). The old `/projects/*`, `/resources/*` and similar URLs were removed and show the NotFound page.

## Language

The site is English only. Page text comes straight from the YAML-generated JSON. The multilingual (English / Hindi / Gujarati) framework was removed; the last commit that contains it is kept under the local git tag `archive/multilingual-framework`. Recover a file with `git show archive/multilingual-framework:<path>` (for example `src/i18n/index.js`) or browse it with `git checkout archive/multilingual-framework`. The tag is local; push it (`git push origin archive/multilingual-framework`) if it needs to survive on the remote.

`index.html` still loads the Noto Devanagari and Gujarati font families from Google Fonts, and `tailwind.config.js` lists them as glyph fallbacks after Playfair Display / Plus Jakarta Sans. Gujarati is needed because Pramaan resource data contains Gujarati titles; the owner chose to keep Devanagari as a fallback too.

## Deployment

Pushing to `main` (or running the workflow manually) triggers `.github/workflows/deploy.yml`: `npm ci`, `npm run build`, upload `dist/`, deploy to GitHub Pages. The build sets the Vite base path to `/tide-testing/` when `GITHUB_ACTIONS` is set (see `vite.config.js`). Before building it runs `npm run lint`, `npm run content:validate` and `npm test` (a failure stops the deploy); it does not run the Playwright e2e specs. The thumbnail-sync workflow starts this one itself after committing new thumbnails.

Repository secrets used by the workflows:

| Secret | Used by |
|---|---|
| `VITE_ABL_API_URL` | `deploy.yml`, `sync-abl-thumbnails.yml` |
| `VITE_ABL_CONTRIBUTE_FORM_URL` | `deploy.yml` |
| `ABL_SYNC_TOKEN` | `sync-abl-thumbnails.yml` |

Deep links and reloads on GitHub Pages work through `public/404.html` plus a restore script at the top of `index.html`. `404.html` assumes the site is served under a single path segment (the project-site URL `/<repo>/`); serving from a domain root would need that script changed.

A second workflow, `.github/workflows/sync-abl-thumbnails.yml`, keeps Pramaan thumbnails self-hosted: it runs on a `repository_dispatch` event (`abl-content-changed`) from the Apps Script, daily at 02:00 UTC, or manually, and commits optimised images and `src/data/abl-thumbnails-manifest.json` back to the repo.

## Documentation map

- [CLAUDE.md](CLAUDE.md) - project overview and orientation (also read by AI coding assistants)
- [AGENTS.md](AGENTS.md) - detailed component, pattern and design-system reference
- [CONTENT-GUIDE.md](CONTENT-GUIDE.md) - guide for non-technical content editors
- `docs/ABL-RESOURCE-LIBRARY-SPEC.md`, `docs/ABL-APPSCRIPT-SETUP-GUIDE.md`, `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` - the Pramaan / ABL resource library
- `docs/MIGRATION-OVERVIEW.md` (start here), `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md`, `docs/MIGRATION-GITHUB-REPOSITORY.md`, `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` - handover and maintenance
- `docs/ARCHITECTURE.html`, `docs/ARCHITECTURE-DATAFLOW.html` - system diagrams (open in a browser)
- `docs/specs/` - planning specs and reviews (the site restructure, a review of pages that have since been removed, and the multilingual spec for the removed framework)
