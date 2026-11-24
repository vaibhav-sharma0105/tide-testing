import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { loadSite, buildRobots, buildSitemap, sitemapEntries, loadResources } from '../../../scripts/siteDataPlugin.js'
import { checkPage, outputFiles, redirectHtml } from '../../../scripts/lib/prerender-check.js'
import { PRIMARY_ROUTES, REDIRECT_ROUTES, resourcePath } from '../../config/siteRoutes.js'

// Audit P3 (2026-11-24): robots.txt, sitemap.xml and the prerendered pages are built, not hand-typed.
const ROOT = path.resolve(__dirname, '..', '..', '..')
const site = loadSite(ROOT)
const resources = loadResources(ROOT)
const SCF = '/education-for-harmony/social-changemakers'

describe('sitemap.xml', () => {
  const entries = sitemapEntries(resources)
  const xml = buildSitemap(site, entries)
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  it('lists every primary page except Social Changemakers (owner decision), at the site.yaml address', () => {
    for (const r of PRIMARY_ROUTES) {
      const url = `${site.url}${r.path}`
      if (r.path === SCF) expect(locs, r.path).not.toContain(url)
      else expect(locs, r.path).toContain(url)
    }
    expect(PRIMARY_ROUTES.find((r) => r.path === SCF).sitemap).toBe(false)
  })

  it('lists one page per Resource Centre row, and no redirect or removed address', () => {
    expect(resources.length).toBeGreaterThan(0)
    for (const r of resources) expect(locs).toContain(`${site.url}${resourcePath(r.id)}`)
    for (const r of REDIRECT_ROUTES) expect(locs).not.toContain(`${site.url}${r.from}`)
    expect(locs.some((l) => /\/projects\/|\/resources\/|our-results/.test(l))).toBe(false)
    expect(new Set(locs).size).toBe(locs.length)
  })

  it('writes <lastmod> only when a date is known (never invented)', () => {
    expect(xml).not.toContain('<lastmod>')
    const dated = buildSitemap(site, sitemapEntries(resources, () => '2026-11-20'))
    expect(dated).toContain('<lastmod>2026-11-20</lastmod>')
  })

  it('is not also kept as a hand-typed file in public/', () => {
    expect(fs.existsSync(path.join(ROOT, 'public', 'sitemap.xml'))).toBe(false)
    expect(fs.existsSync(path.join(ROOT, 'public', 'robots.txt'))).toBe(false)
  })
})

describe('robots.txt', () => {
  it('points to the sitemap at the site.yaml address and allows crawling', () => {
    const txt = buildRobots(site)
    expect(txt).toContain(`Sitemap: ${site.url}/sitemap.xml`)
    expect(txt).toMatch(/User-agent: \*\nAllow: \//)
    for (const a of site.crawlers.search) expect(txt).toContain(`User-agent: ${a}\nAllow: /`)
  })

  it('asks training crawlers to stay away only when allowTraining is false', () => {
    const on = buildRobots(site)
    for (const a of site.crawlers.training) expect(on).toContain(`User-agent: ${a}\n${site.crawlers.allowTraining === false ? 'Disallow' : 'Allow'}: /`)
    const off = buildRobots({ ...site, crawlers: { ...site.crawlers, allowTraining: false } })
    expect(off).toContain('User-agent: GPTBot\nDisallow: /')
    expect(off).toContain('User-agent: OAI-SearchBot\nAllow: /')
  })
})

describe('prerender rules', () => {
  const all = ['/', '/pramaan', '/pramaan/resource-centre', '/pramaan/resource-centre/W1', '/contact', '/404']

  it('maps routes to files, adding x/index.html when x is also a folder', () => {
    expect(outputFiles('/', all)).toEqual(['index.html'])
    expect(outputFiles('/404', all)).toEqual(['404.html'])
    expect(outputFiles('/contact', all)).toEqual(['contact.html'])
    expect(outputFiles('/pramaan', all)).toEqual(['pramaan.html', 'pramaan/index.html'])
    expect(outputFiles('/pramaan/resource-centre/W1', all)).toEqual(['pramaan/resource-centre/W1.html'])
  })

  const good = { title: 'Why TIDE? — TIDE Foundation', h1Count: 1, h1Text: 'Why TIDE?', mainTextLength: 900, canonical: 'https://x.org/about/why-tide', noindex: false, errors: [] }
  const opts = { path: '/about/why-tide', siteUrl: 'https://x.org' }

  it('accepts a page with title, one <h1>, text and its own canonical', () => {
    expect(checkPage(good, opts)).toEqual([])
    expect(checkPage({ ...good, canonical: null, noindex: true }, opts)).toEqual([])
  })

  it('rejects a missing title, zero or two <h1>, an empty page, a wrong canonical or a page error', () => {
    expect(checkPage({ ...good, title: '' }, opts)).toHaveLength(1)
    expect(checkPage({ ...good, h1Count: 2 }, opts)).toHaveLength(1)
    expect(checkPage({ ...good, h1Count: 0, h1Text: '' }, opts)).toHaveLength(2)
    expect(checkPage({ ...good, mainTextLength: 3 }, opts)).toHaveLength(1)
    expect(checkPage({ ...good, canonical: 'https://x.org/' }, opts)).toHaveLength(1)
    expect(checkPage({ ...good, errors: ['boom'] }, opts)).toHaveLength(1)
  })

  it('writes forwarding pages that are noindex, canonical to the new address and keep the query string', () => {
    const html = redirectHtml({ to: '/tide/publications', base: '/tide-testing/', siteUrl: 'https://x.org', siteName: 'A<B' })
    expect(html).toContain('<meta name="robots" content="noindex">')
    expect(html).toContain('<link rel="canonical" href="https://x.org/tide/publications">')
    expect(html).toContain('location.replace("/tide-testing/tide/publications" + location.search + location.hash)')
    expect(html).toContain('<title>A&lt;B</title>')
  })
})
