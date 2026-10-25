// scripts/siteDataPlugin.js
// Vite plugin: turns the site-wide facts in content/shared/site.yaml into the
// places that can't read them at runtime —
//   * index.html : <title>, og:site_name and the two JSON-LD blocks
//   * llms.txt   : rendered from content/shared/llms.txt, served in dev and
//                  emitted into the build output at the site root
// Reads the YAML directly (not src/data/site.json) so it never depends on
// `npm run content:sync` having run first.

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export const SITE_YAML = path.join('content', 'shared', 'site.yaml')
export const LLMS_TEMPLATE = path.join('content', 'shared', 'llms.txt')
export const JSONLD_MARKER = '<!-- site-jsonld -->'

export function loadSite(root = process.cwd()) {
  const site = yaml.load(fs.readFileSync(path.join(root, SITE_YAML), 'utf8'))
  for (const key of ['name', 'url', 'logo', 'email', 'livesImpacted', 'gradeRange', 'foundingYear', 'description']) {
    if (!site || typeof site[key] !== 'string' || !site[key]) {
      throw new Error(`${SITE_YAML}: missing required key "${key}"`)
    }
  }
  return site
}

export function siteDescription(site) {
  return site.description.replaceAll('{livesImpacted}', site.livesImpacted)
}

// Join the site URL and a root-relative path with exactly one slash.
function joinUrl(url, p) {
  return `${url.replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`
}

export function buildJsonLd(site) {
  const ngo = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: site.name,
    alternateName: site.alternateName,
    url: site.url,
    logo: joinUrl(site.url, site.logo),
    description: siteDescription(site),
    foundingDate: site.foundingYear,
    foundingLocation: { '@type': 'Place', name: site.location },
    areaServed: { '@type': 'Country', name: site.country },
    contactPoint: { '@type': 'ContactPoint', contactType: 'general', email: site.email },
    keywords: site.keywords,
  }
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.websiteDescription,
    inLanguage: [site.language],
  }
  return [ngo, website]
}

// "<" is escaped so no field value can ever close the <script> element.
function ldScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">\n${json}\n</script>`
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function transformHtml(html, site) {
  if (!html.includes(JSONLD_MARKER)) {
    throw new Error(`index.html: missing ${JSONLD_MARKER} marker for the JSON-LD blocks`)
  }
  const blocks = buildJsonLd(site).map(ldScript).join('\n    ')
  return html
    .replace(JSONLD_MARKER, () => blocks)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(site.name)}</title>`)
    .replace(
      /(<meta\s+property="og:site_name"\s+content=")[^"]*(")/,
      (_, a, b) => `${a}${escapeAttr(site.name)}${b}`,
    )
}

export function renderLlms(template, site) {
  const values = {
    name: site.name,
    url: site.url.replace(/\/+$/, ''),
    email: site.email,
    livesImpacted: site.livesImpacted,
    gradeRange: site.gradeRange,
    foundingYear: site.foundingYear,
    location: site.location,
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`${LLMS_TEMPLATE}: unknown token {{${key}}}`)
    return values[key]
  })
}

export default function siteDataPlugin() {
  let root = process.cwd()
  let base = '/'
  const readSite = () => loadSite(root)
  const readLlms = () =>
    renderLlms(fs.readFileSync(path.join(root, LLMS_TEMPLATE), 'utf8'), readSite())

  return {
    name: 'tide-site-data',
    configResolved(config) {
      root = config.root
      base = config.base || '/'
    },
    buildStart() {
      this.addWatchFile(path.join(root, SITE_YAML))
      this.addWatchFile(path.join(root, LLMS_TEMPLATE))
    },
    transformIndexHtml(html) {
      return transformHtml(html, readSite())
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: readLlms() })
    },
    configureServer(server) {
      const wanted = new Set(['/llms.txt', `${base.replace(/\/+$/, '')}/llms.txt`])
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        if (!wanted.has(pathname)) return next()
        try {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(readLlms())
        } catch (e) {
          next(e)
        }
      })
    },
  }
}
