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
import { execFileSync } from 'node:child_process'
import yaml from 'js-yaml'
import { PRIMARY_ROUTES, RESOURCE_ROUTE, resourcePath } from '../src/config/siteRoutes.js'

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
  return site.description
    .replaceAll('{livesImpacted}', site.livesImpacted)
    .replaceAll('{foundingYear}', site.foundingYear)
}

// Join the site URL and a root-relative path with exactly one slash.
function joinUrl(url, p) {
  return `${url.replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`
}

const readYaml = (root, ...parts) => {
  try {
    return yaml.load(fs.readFileSync(path.join(root, ...parts), 'utf8')) || {}
  } catch {
    return {}
  }
}

/**
 * Organisation facts kept in other YAML files: the social profiles (footer.yaml `social[].href`,
 * the links the footer shows) and the postal address (contact.yaml `info.address`, as one line —
 * its parts are not stored separately, so it stays a text address).
 */
export function loadOrgFacts(root = process.cwd()) {
  const footer = readYaml(root, 'content', 'shared', 'footer.yaml')
  const contact = readYaml(root, 'content', 'pages', 'contact.yaml')
  const sameAs = (footer.social || []).map((s) => s && s.href).filter((h) => typeof h === 'string' && /^https:\/\//.test(h))
  const address = contact.info && typeof contact.info.address === 'string' ? contact.info.address : undefined
  return { sameAs, address }
}

export function buildJsonLd(site, facts = {}) {
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
    ...(facts.address ? { address: facts.address } : {}),
    ...(facts.sameAs && facts.sameAs.length ? { sameAs: facts.sameAs } : {}),
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

export function transformHtml(html, site, facts = {}) {
  if (!html.includes(JSONLD_MARKER)) {
    throw new Error(`index.html: missing ${JSONLD_MARKER} marker for the JSON-LD blocks`)
  }
  const blocks = buildJsonLd(site, facts).map(ldScript).join('\n    ')
  return html
    .replace(JSONLD_MARKER, () => blocks)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(site.name)}</title>`)
    .replace(
      /(<meta\s+property="og:site_name"\s+content=")[^"]*(")/,
      (_, a, b) => `${a}${escapeAttr(site.name)}${b}`,
    )
}

// ── robots.txt, sitemap.xml and the llms.txt page list ─────────────────────────────────────────

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** robots.txt from site.yaml: everyone may crawl; training crawlers are named so they can be turned off. */
export function buildRobots(site) {
  const c = site.crawlers || {}
  const group = (agents, rule) => (agents || []).map((a) => `User-agent: ${a}\n${rule}\n`).join('\n')
  return [
    '# Built from content/shared/site.yaml (crawlers, url) by scripts/siteDataPlugin.js. Do not edit dist/robots.txt.',
    '# Note: crawlers read robots.txt only at the root of a host, so this file takes effect once the site is',
    '# served from its own domain (on a GitHub Pages project address it is ignored).',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# Search engines and AI answer engines (fetch pages to show, link or cite them)',
    group(c.search, 'Allow: /'),
    `# AI training crawlers (allowTraining: ${c.allowTraining === false ? 'false' : 'true'})`,
    group(c.training, c.allowTraining === false ? 'Disallow: /' : 'Allow: /'),
    `Sitemap: ${joinUrl(site.url, 'sitemap.xml')}`,
    '',
  ].join('\n')
}

/** The newest commit date (ISO, YYYY-MM-DD) of `files`, or null without usable git history. */
export function gitLastmod(files, root = process.cwd()) {
  try {
    const opts = { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    if (execFileSync('git', ['rev-parse', '--is-shallow-repository'], opts).trim() === 'true') return null
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], opts).trim()
    return out ? out.slice(0, 10) : null
  } catch {
    return null
  }
}

/** Every URL that belongs in sitemap.xml: primary pages (minus sitemap: false) + one per resource. */
export function sitemapEntries(resources, lastmod = () => null) {
  const entries = PRIMARY_ROUTES.filter((r) => r.sitemap !== false).map((r) => ({ path: r.path, lastmod: lastmod(r.sources) }))
  const resLastmod = resources.length ? lastmod(RESOURCE_ROUTE.sources) : null
  for (const r of resources) entries.push({ path: resourcePath(r.id), lastmod: resLastmod })
  return entries
}

export function buildSitemap(site, entries) {
  const urls = entries.map(({ path: p, lastmod }) =>
    `  <url><loc>${xmlEscape(joinUrl(site.url, p))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Built from src/config/siteRoutes.js, the Resource Centre snapshot and site.yaml url by scripts/siteDataPlugin.js. English only: no hreflang. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

export function loadResources(root = process.cwd()) {
  try {
    const snap = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'sheets', 'pramaan-library.json'), 'utf8'))
    return Array.isArray(snap.resources) ? snap.resources.filter((r) => r && r.id) : []
  } catch {
    return []
  }
}

/**
 * The llms.txt "Key Pages" list: one line per sitemap page, link text = the page's breadcrumb name
 * (site.yaml breadcrumbs.home for "/"), description = its meta.seoDescription — both from the
 * generated src/data JSON of the page's YAML (the YAML→JSON sync has filled tokens such as {gradeRange}).
 */
export function llmsPages(site, root = process.cwd()) {
  return PRIMARY_ROUTES.filter((r) => r.sitemap !== false).map((r) => {
    const name = path.basename(r.sources[0], '.yaml')
    let meta = {}
    try {
      meta = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', `${name}.json`), 'utf8')).meta || {}
    } catch { /* page data missing: name falls back below */ }
    const label = r.path === '/' ? site.breadcrumbs?.home : meta.breadcrumbName
    return { path: r.path, label: label || meta.seoTitle || r.path, description: meta.seoDescription || '' }
  })
}

export function renderLlms(template, site, pages = []) {
  const values = {
    name: site.name,
    url: site.url.replace(/\/+$/, ''),
    email: site.email,
    livesImpacted: site.livesImpacted,
    gradeRange: site.gradeRange,
    foundingYear: site.foundingYear,
    location: site.location,
    pages: pages
      .map((p) => `- [${p.label}](${joinUrl(site.url, p.path)})${p.description ? ` — ${p.description}` : ''}`)
      .join('\n'),
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
  const readLlms = () => {
    const site = readSite()
    return renderLlms(fs.readFileSync(path.join(root, LLMS_TEMPLATE), 'utf8'), site, llmsPages(site, root))
  }
  const readRobots = () => buildRobots(readSite())
  const readSitemap = () =>
    buildSitemap(readSite(), sitemapEntries(loadResources(root), (files) => gitLastmod(files, root)))
  const served = { '/llms.txt': [readLlms, 'text/plain'], '/robots.txt': [readRobots, 'text/plain'], '/sitemap.xml': [readSitemap, 'application/xml'] }

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
      return transformHtml(html, readSite(), loadOrgFacts(root))
    },
    generateBundle() {
      for (const [file, [read]] of Object.entries(served)) {
        this.emitFile({ type: 'asset', fileName: file.slice(1), source: read() })
      }
    },
    configureServer(server) {
      const prefix = base.replace(/\/+$/, '')
      server.middlewares.use((req, res, next) => {
        let pathname = (req.url || '').split('?')[0]
        if (prefix && pathname.startsWith(`${prefix}/`)) pathname = pathname.slice(prefix.length)
        const hit = served[pathname]
        if (!hit) return next()
        try {
          res.setHeader('Content-Type', `${hit[1]}; charset=utf-8`)
          res.end(hit[0]())
        } catch (e) {
          next(e)
        }
      })
    },
  }
}
