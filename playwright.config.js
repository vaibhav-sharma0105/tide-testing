import { defineConfig, devices } from '@playwright/test'

// Dev-server e2e (npm run test:e2e). The shipped build is tested by playwright.site.config.js.
const DEV_URL = process.env.E2E_DEV_URL || 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['site/**', 'visual/**'],
  // Opens every route once first, so Vite's dependency optimiser never reloads a page mid-test.
  globalSetup: './e2e/dev-warmup.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `${DEV_URL}/`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: DEV_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
