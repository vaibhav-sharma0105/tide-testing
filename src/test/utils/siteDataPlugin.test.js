import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadSite,
  buildJsonLd,
  transformHtml,
  renderLlms,
  JSONLD_MARKER,
  LLMS_TEMPLATE,
} from '../../../scripts/siteDataPlugin.js'
import {
  checkConsistency,
  findEmails,
  findLivesTotals,
} from '../../../scripts/contentConsistency.js'

const ROOT = path.resolve(__dirname, '..', '..', '..')
const site = loadSite(ROOT)

// The JSON-LD that used to be hand-written in index.html (git HEAD before the
// site.yaml refactor). The generated output must equal this except for the two
// intended changes applied below.
const OLD_NGO = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: 'TIDE Foundation',
  alternateName: 'Together in Development and Education Foundation',
  url: 'https://tideinternational.org',
  logo: 'https://tideinternational.org/assets/images/shared/tide-logo.png',
  description:
    "TIDE Foundation is an NGO based in Ahmedabad, India working to bring sustainable, systemic change to India's education landscape since 2014. We have impacted 50,000+ lives across Gujarat.",
  foundingDate: '2014',
  foundingLocation: { '@type': 'Place', name: 'Ahmedabad, Gujarat, India' },
  areaServed: { '@type': 'Country', name: 'India' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'general', email: 'tidefoundation@gmail.com' },
  keywords:
    'education NGO India, activity-based learning, holistic education, Gujarat education, TIDE Foundation',
}
const OLD_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TIDE Foundation',
  url: 'https://tideinternational.org',
  description: 'Official website of TIDE Foundation — Together in Development and Education',
  inLanguage: ['en', 'hi', 'gu'],
}

describe('JSON-LD generated from site.yaml', () => {
  const [ngo, website] = buildJsonLd(site)

  it('NGO block equals the old hardcoded block except the lives figure', () => {
    expect(ngo).toEqual({
      ...OLD_NGO,
      description: OLD_NGO.description.replace('50,000+', '50,500+'),
    })
    // key order is preserved too (matters for readability of the served JSON)
    expect(Object.keys(ngo)).toEqual(Object.keys(OLD_NGO))
  })

  it('WebSite block equals the old block except inLanguage is now ["en"]', () => {
    expect(website).toEqual({ ...OLD_WEBSITE, inLanguage: ['en'] })
    expect(Object.keys(website)).toEqual(Object.keys(OLD_WEBSITE))
  })

  it('builds the logo URL with exactly one slash even with stray slashes', () => {
    const [a] = buildJsonLd({ ...site, url: 'https://x.org/', logo: '/a/b.png' })
    expect(a.logo).toBe('https://x.org/a/b.png')
    const [b] = buildJsonLd({ ...site, url: 'https://x.org', logo: 'a/b.png' })
    expect(b.logo).toBe('https://x.org/a/b.png')
  })
})

describe('transformHtml', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  const out = transformHtml(html, site)

  it('replaces the marker with two parseable JSON-LD scripts', () => {
    expect(html).toContain(JSONLD_MARKER)
    expect(out).not.toContain(JSONLD_MARKER)
    const blocks = [...out.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
    expect(blocks).toHaveLength(2)
    expect(JSON.parse(blocks[0][1])).toEqual(buildJsonLd(site)[0])
    expect(JSON.parse(blocks[1][1])).toEqual(buildJsonLd(site)[1])
  })

  it('fills <title> and og:site_name from site.yaml name', () => {
    expect(out).toContain(`<title>${site.name}</title>`)
    expect(out).toContain(`<meta property="og:site_name" content="${site.name}" />`)
  })

  it('does not leave a hardcoded old figure, language list or old brand colour', () => {
    expect(out).not.toContain('50,000+')
    expect(out).not.toContain('"hi"')
    expect(out).not.toContain('#3B7CB8')
  })

  it('throws when the marker is missing', () => {
    expect(() => transformHtml('<html></html>', site)).toThrow(/marker/)
  })

  it('escapes "<" so a field value cannot close the script element', () => {
    const o = transformHtml(html, { ...site, name: 'A</script><b>' })
    expect(o).not.toMatch(/"name":"A<\/script>/)
  })
})

describe('grade range', () => {
  const gradeNumbers = (fs.readFileSync(path.join(ROOT, 'src/config/abl.js'), 'utf8')
    .match(/export const GRADES = \[(.*?)\]/)[1].match(/\d+/g)).map(Number)

  it('site.yaml gradeRange matches the GRADES list in src/config/abl.js', () => {
    expect(site.gradeRange).toBe(`${Math.min(...gradeNumbers)}–${Math.max(...gradeNumbers)}`)
  })

  it('no generated JSON still contains the unreplaced {gradeRange} token', () => {
    const dir = path.join(ROOT, 'src/data')
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      expect(fs.readFileSync(path.join(dir, name), 'utf8'), name).not.toContain('{gradeRange}')
    }
  })

  it('fills the llms.txt grade range', () => {
    const rendered = renderLlms(fs.readFileSync(path.join(ROOT, LLMS_TEMPLATE), 'utf8'), site)
    expect(rendered).toContain(`Grades ${site.gradeRange},`)
  })
})

describe('llms.txt rendering', () => {
  const template = fs.readFileSync(path.join(ROOT, LLMS_TEMPLATE), 'utf8')
  const out = renderLlms(template, site)
  const count = (s, needle) => s.split(needle).length - 1

  it('leaves no unreplaced {{ tokens', () => {
    expect(out).not.toContain('{{')
    expect(out).not.toContain('}}')
  })

  it('contains the email once and the lives figure exactly twice', () => {
    expect(count(out, site.email)).toBe(1)
    expect(count(out, site.livesImpacted)).toBe(2)
    expect(out).not.toContain('50,000+')
  })

  it('keeps the different 15,000+ students metric and the 150+ resource count', () => {
    expect(out).toContain('15,000+ students')
    expect(out).toContain('150+ ABL materials')
  })

  it('states English only and uses the site URL', () => {
    expect(out).toContain('Site language: English only')
    expect(out).not.toMatch(/Hindi|Gujarati/)
    expect(out).toContain(`[Home](${site.url}/)`)
    expect(out).toContain(`${site.url}/pramaan/resource-centre`)
  })

  it('fails loudly on an unknown token', () => {
    expect(() => renderLlms('{{nope}}', site)).toThrow(/unknown token/)
  })
})

describe('content consistency detection', () => {
  const s = { email: 'tidefoundation@gmail.com', livesImpacted: '50,500+' }

  it('finds e-mail addresses, including inside mailto: links', () => {
    expect(findEmails('mailto:info@tideinternational.org?subject=Hi')).toEqual(['info@tideinternational.org'])
    expect(findEmails('image-1-e1699203683612.png')).toEqual([])
  })

  it('only counts totals that sit next to lives/people wording', () => {
    expect(findLivesTotals('We have impacted 40,000+ lives.')).toEqual(['40,000+'])
    expect(findLivesTotals('reaching 15,000+ students.')).toEqual([])
    expect(findLivesTotals('Community programs. Reaching 15,000+ students. 3 lives changed.')).toEqual([])
    expect(findLivesTotals('50,000+ people engaged')).toEqual(['50,000+'])
  })

  it('uses sibling fields for bare values like value: "50,000+"', () => {
    expect(findLivesTotals('50,000+', 'Lives impacted')).toEqual(['50,000+'])
    expect(findLivesTotals('15,000+', 'Students reached')).toEqual([])
  })

  it('accepts 50500+ and 50,500+ and rejects other totals and e-mails', () => {
    const ok = checkConsistency(s, [
      { file: 'a.yaml', data: { stats: [{ value: '50500+', label: 'Lives Impacted' }], mail: 'tidefoundation@gmail.com', cta: 'mailto:TideFoundation@Gmail.com' } },
      { file: 'llms.txt', text: 'We impacted 50,500+ lives. Reaching 15,000+ students.' },
    ])
    expect(ok).toEqual([])

    const bad = checkConsistency(s, [
      { file: 'b.yaml', data: { a: '40,000+ lives changed across Gujarat', b: { value: '50,000+', label: 'Lives impacted' }, c: 'info@tideinternational.org' } },
      { file: 'llms.txt', text: 'We have impacted 50,000+ lives.' },
    ])
    expect(bad.map((e) => e.file)).toEqual(['b.yaml', 'b.yaml', 'b.yaml', 'llms.txt'])
    expect(bad[0].message).toContain('40,000+')
    expect(bad[1].message).toContain('50,000+')
    expect(bad[2].message).toContain('info@tideinternational.org')
  })

  it('the repo template itself has no inconsistent literals', () => {
    const text = fs.readFileSync(path.join(ROOT, LLMS_TEMPLATE), 'utf8')
    expect(checkConsistency(site, [{ file: 'llms.txt', text }])).toEqual([])
  })
})
