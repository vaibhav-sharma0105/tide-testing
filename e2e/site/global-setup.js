// Fails fast with a clear message when dist/ is missing or was built without the GitHub Pages base
// (then every asset would 404 under /tide-testing/ and every test would fail for the wrong reason).
import fs from 'node:fs'
import path from 'node:path'

export default function globalSetup() {
  const index = path.resolve('dist/index.html')
  if (!fs.existsSync(index)) {
    throw new Error('dist/ is missing. Build it with the GitHub Pages base first: GITHUB_ACTIONS=true npm run build')
  }
  if (!fs.readFileSync(index, 'utf8').includes('/tide-testing/assets/')) {
    throw new Error('dist/ was built without the /tide-testing/ base. Rebuild with GITHUB_ACTIONS=true npm run build')
  }
}
