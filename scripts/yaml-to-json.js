import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = path.resolve('content')
const PAGES_DIRS  = [path.join(CONTENT_DIR, 'pages'), path.join(CONTENT_DIR, 'shared')]
const LOCALES_DIR = path.join(CONTENT_DIR, 'locales')
const DATA_DIR    = path.resolve('src/data')
const I18N_DIR    = path.resolve('src/i18n/locales')

fs.mkdirSync(DATA_DIR, { recursive: true })

let count = 0

function stripAssetSlashes(value) {
  if (typeof value === 'string' && value.startsWith('/assets/')) return value.slice(1)
  if (Array.isArray(value)) return value.map(stripAssetSlashes)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripAssetSlashes(v)]))
  return value
}

function deepMerge(target, source) {
  for (const key of Object.keys(source ?? {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] ?? {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

function processPageDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processPageDir(fullPath)
    } else if (/\.ya?ml$/.test(entry.name)) {
      const parsed  = stripAssetSlashes(yaml.load(fs.readFileSync(fullPath, 'utf8')))
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

if (fs.existsSync(LOCALES_DIR)) {
  const langs = fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name)

  for (const lang of langs) {
    const langDir = path.join(LOCALES_DIR, lang)
    const merged  = {}
    for (const file of fs.readdirSync(langDir).filter(f => /\.ya?ml$/.test(f)).sort()) {
      const parsed = yaml.load(fs.readFileSync(path.join(langDir, file), 'utf8'))
      if (parsed && typeof parsed === 'object') deepMerge(merged, parsed)
    }
    const outDir  = path.join(I18N_DIR, lang)
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'translation.json'), JSON.stringify(merged, null, 2), 'utf8')
    console.log(`  ✓ content/locales/${lang}/ → src/i18n/locales/${lang}/translation.json`)
    count++
  }
}

console.log(`   ${count} file(s) synced.\n`)
