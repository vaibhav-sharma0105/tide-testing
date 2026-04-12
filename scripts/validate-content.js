// scripts/validate-content.js
// Validates all YAML files in content/ — checks syntax and image paths
// Run: npm run content:validate

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = path.resolve('content')
const PUBLIC_DIR  = path.resolve('public')
let warnings = 0
let errors   = 0

function warn(file, msg)  { console.warn(`  ⚠  ${file}: ${msg}`);  warnings++ }
function error(file, msg) { console.error(`  ✗  ${file}: ${msg}`); errors++ }

function checkImagePath(file, key, value) {
  if (typeof value !== 'string') return
  if (value.startsWith('http://') || value.startsWith('https://')) return
  if (!value.startsWith('/')) return
  const localPath = path.join(PUBLIC_DIR, value)
  if (!fs.existsSync(localPath)) {
    warn(file, `image not found on disk: ${key} = "${value}"`)
  }
}

function walkObject(file, obj, parentKey = '') {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => walkObject(file, item, `${parentKey}[${i}]`))
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}.${k}` : k
      if (['photo', 'src', 'logo', 'coverImage', 'image', 'poster', 'img',
           'heroPhoto', 'mainPhoto', 'diagramPhoto', 'backgroundImage',
           'donorPoster'].includes(k)) {
        checkImagePath(file, fullKey, v)
      }
      walkObject(file, v, fullKey)
    }
  }
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      const relPath = path.relative('.', fullPath)
      let parsed
      try {
        parsed = yaml.load(fs.readFileSync(fullPath, 'utf8'))
      } catch (e) {
        error(relPath, `YAML parse error: ${e.message}`)
        continue
      }
      walkObject(relPath, parsed)
    }
  }
}

console.log('\n🔍 Validating YAML content...\n')
processDir(CONTENT_DIR)
console.log(`\n   ${warnings} warning(s), ${errors} error(s)\n`)
if (errors > 0) process.exit(1)
