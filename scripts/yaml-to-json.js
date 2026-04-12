// scripts/yaml-to-json.js
// Converts all YAML files in content/ to JSON in src/data/
// Run: npm run content:sync
// Auto-runs via predev / prebuild npm hooks

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = path.resolve('content')
const OUTPUT_DIR  = path.resolve('src/data')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

let count = 0

// Strip leading '/' from asset paths so they work as relative URLs on any base path.
// e.g. '/assets/images/photo.jpg' → 'assets/images/photo.jpg'
// This lets HashRouter-based deployments (GitHub Pages subpaths) resolve images correctly.
function stripAssetSlashes(value) {
  if (typeof value === 'string' && value.startsWith('/assets/')) {
    return value.slice(1)
  }
  if (Array.isArray(value)) return value.map(stripAssetSlashes)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripAssetSlashes(v)]))
  }
  return value
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      const raw    = fs.readFileSync(fullPath, 'utf8')
      const parsed = stripAssetSlashes(yaml.load(raw))
      const outName = entry.name.replace(/\.ya?ml$/, '.json')
      const outPath = path.join(OUTPUT_DIR, outName)
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8')
      console.log(`  ✓ ${path.relative('.', fullPath)} → src/data/${outName}`)
      count++
    }
  }
}

console.log('\n📄 Syncing YAML → JSON...')
processDir(CONTENT_DIR)
console.log(`   ${count} file(s) synced.\n`)
