import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { loadSite, buildRobots, buildSitemap, sitemapEntries, loadResources } from '../../../scripts/siteDataPlugin.js'
import { checkPage, outputFiles, redirectHtml, relativePreloads } from '../../../scripts/lib/prerender-check.js'
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
  const live = { ...site, indexable: true }

  it('on staging (indexable: false) shuts every crawler out', () => {
    const txt = buildRobots({ ...site, indexable: false })
    expect(txt).toMatch(/User-agent: \*\nDisallow: \//)
    expect(txt).not.toMatch(/Allow: \//)
    expect(txt).not.toContain('Sitemap:')
  })

  it('once live: points to the sitemap at the site.yaml address and allows crawling', () => {
    const txt = buildRobots(live)
    expect(txt).toContain(`Sitemap: ${site.url}/sitemap.xml`)
    expect(txt).toMatch(/User-agent: \*\nAllow: \//)
    for (const a of site.crawlers.search) expect(txt).toContain(`User-agent: ${a}\nAllow: /`)
  })

  it('keeps every crawler, search ones included, off the private paths once live', () => {
    const txt = buildRobots(live)
    expect(live.crawlers.private).toContain('/education-for-harmony/social-changemakers')
    expect(txt).toContain('User-agent: *\nAllow: /\nDisallow: /education-for-harmony/social-changemakers')
    expect(txt).toContain('User-agent: OAI-SearchBot\nAllow: /\nDisallow: /education-for-harmony/social-changemakers')
  })

  it('asks training crawlers to stay away only when allowTraining is false', () => {
    const on = buildRobots(live)
    for (const a of live.crawlers.training) expect(on).toContain(`User-agent: ${a}\n${live.crawlers.allowTraining === false ? 'Disallow' : 'Allow'}: /`)
    const off = buildRobots({ ...live, crawlers: { ...live.crawlers, allowTraining: false } })
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
    // Ids with spaces or brackets (snapshot: "F22 repeat", "K 31", "K32 (26 in Gujarati)") arrive URL-encoded;
    // a static host decodes the request, so the file must have the decoded name (P6: found by check-dist).
    expect(outputFiles('/pramaan/resource-centre/K32%20(26%20in%20Gujarati)', all)).toEqual(['pramaan/resource-centre/K32 (26 in Gujarati).html'])
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

describe('relativePreloads (P5: saved pages work on any host)', () => {
  const html = [
    '<link rel="modulepreload" crossorigin="" href="/tide-testing/assets/vendor-react-x.js">',
    '<link rel="modulepreload" as="script" crossorigin="" href="https://owner.github.io/tide-testing/assets/WhyTide-a.js">',
    '<link rel="modulepreload" as="script" href="https://cdn.example.org/x.js">',
    '<meta property="og:image" content="https://owner.github.io/tide-testing/assets/images/shared/tide-logo.png">',
    '<link rel="canonical" href="https://owner.github.io/tide-testing/about">',
  ].join('\n')
  const out = relativePreloads(html, 'https://owner.github.io/')

  it('makes same-origin module preloads root-relative, keeping the base path', () => {
    expect(out).toContain('href="/tide-testing/assets/WhyTide-a.js"')
    expect(out).toContain('href="/tide-testing/assets/vendor-react-x.js"')
    expect(out).not.toMatch(/modulepreload[^>]*owner\.github\.io/)
  })

  it('leaves other hosts, og:image and canonical absolute', () => {
    expect(out).toContain('href="https://cdn.example.org/x.js"')
    expect(out).toContain('content="https://owner.github.io/tide-testing/assets/images/shared/tide-logo.png"')
    expect(out).toContain('<link rel="canonical" href="https://owner.github.io/tide-testing/about">')
  })
})
