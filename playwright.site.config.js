// E2E against the SHIPPED site (audit P6): the base-path production build in dist/ (prerendered HTML,
// strict CSP, /tide-testing/ base), served the way GitHub Pages serves it (scripts/serve-pages.mjs).
// playwright.config.js (npm run test:e2e) keeps testing the dev server; only this config can catch
// prerender, CSP, base-path and 404.html regressions.
//
//   $env:GITHUB_ACTIONS='true'; npm run build        # once (PowerShell); Git Bash: GITHUB_ACTIONS=true npm run build
//   npm run check:dist                               # links, sitemap, bundle budget (no browser)
//   npm run test:e2e:site                            # Chromium, without the @matrix sizes: the CI must-pass set
//   npm run test:e2e:full                            # Chromium + Firefox + WebKit, full responsive matrix (nightly)
//   npm run test:e2e:visual                          # screenshot baselines (local, Windows; see e2e/visual/README.md)
//
// Every request to another host (fonts, YouTube, Drive, Maps) is answered locally with an empty
// response (e2e/site/fixtures.js), so runs are deterministic and need no network.
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT) || 4300
export const BASE_PATH = '/tide-testing/'
const CI = !!process.env.CI
// home/navigation/pramaan.spec.js are dev-server smoke tests (covered better by e2e/site/). A project's
// testIgnore replaces the top-level one, so every project lists them.
const DEV_ONLY = ['home.spec.js', 'navigation.spec.js', 'pramaan.spec.js', 'dev-warmup.js']

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/site/global-setup.js',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-site' }]] : [['list']],
  outputDir: 'test-results-site',
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: [...DEV_ONLY, 'visual/**'] },
    // axe results don't depend on the engine; the a11y spec runs on Chromium only.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: [...DEV_ONLY, 'visual/**', 'a11y.spec.js'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: [...DEV_ONLY, 'visual/**', 'a11y.spec.js'] },
    // Screenshot baselines are per platform (fonts render differently on Linux), so CI never runs them.
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: 'visual/**/*.spec.js' },
  ],
  webServer: {
    command: `node scripts/serve-pages.mjs dist ${BASE_PATH} ${PORT}`,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: !CI,
    timeout: 30_000,
    env: { MSYS_NO_PATHCONV: '1' },
  },
})
