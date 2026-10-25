import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = path.resolve('content')
const PAGES_DIRS  = [path.join(CONTENT_DIR, 'pages'), path.join(CONTENT_DIR, 'shared')]
const DATA_DIR    = path.resolve('src/data')

fs.mkdirSync(DATA_DIR, { recursive: true })

// Site-wide values that page text may reference as {token} (source: content/shared/site.yaml).
const SITE = yaml.load(fs.readFileSync(path.join(CONTENT_DIR, 'shared', 'site.yaml'), 'utf8'))
const TOKENS = { gradeRange: SITE.gradeRange }

let count = 0

function stripAssetSlashes(value) {
  if (typeof value === 'string' && value.startsWith('/assets/')) return value.slice(1)
  if (Array.isArray(value)) return value.map(stripAssetSlashes)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripAssetSlashes(v)]))
  return value
}

function fillTokens(value) {
  if (typeof value === 'string')
    return value.replace(/\{(\w+)\}/g, (match, key) => (key in TOKENS ? TOKENS[key] : match))
  if (Array.isArray(value)) return value.map(fillTokens)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v)]))
  return value
}

function processPageDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processPageDir(fullPath)
    } else if (/\.ya?ml$/.test(entry.name)) {
      const parsed  = fillTokens(stripAssetSlashes(yaml.load(fs.readFileSync(fullPath, 'utf8'))))
      const outName = entry.name.replace(/\.ya?ml$/, '.json')
      const outPath = path.join(DATA_DIR, outName)
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8')
      console.log(`  ✓ ${path.relative('.', fullPath)} → src/data/${outName}`)
      count++
    }
  }
}

console.log('\n📄 Syncing YAML → JSON...')

for (const dir of PAGES_DIRS) processPageDir(dir)

console.log(`   ${count} file(s) synced.\n`)
