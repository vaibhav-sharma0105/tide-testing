// scripts/check-dist.mjs (P6): the GitHub-Pages file resolution and URL extraction behind the
// broken-link / sitemap / bundle-budget check that CI runs on dist/.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { detectBase, resolves, referencedUrls, checkLinks, checkBudget } from '../../../scripts/check-dist.mjs'

function fakeDist(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-dist-'))
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    fs.writeFileSync(path.join(dir, rel), text)
  }
  return dir
}

describe('check-dist', () => {
  it('reads the base from index.html', () => {
    expect(detectBase('<script type="module" src="/tide-testing/assets/index-Ab_1.js"></script>')).toBe('/tide-testing/')
    expect(detectBase('<script src="/assets/index-x.js"></script>')).toBe('/')
  })

  it('resolves like GitHub Pages: file, x.html, x/index.html; a literal %20 name does not match', () => {
    const d = fakeDist({ 'index.html': '', 'a.html': '', 'b/index.html': '', 'K 31.html': '', 'F%20x.html': '', 'img/p.webp': '' })
    expect(resolves(d, '')).toBe(true)
    expect(resolves(d, 'a')).toBe(true)
    expect(resolves(d, 'b')).toBe(true)
    expect(resolves(d, 'b/')).toBe(true)
    expect(resolves(d, 'img/p.webp')).toBe(true)
    expect(resolves(d, 'K%2031')).toBe(true)
    expect(resolves(d, 'F%20x')).toBe(false)
    expect(resolves(d, 'missing')).toBe(false)
    expect(resolves(d, '../outside')).toBe(false)
  })

  it('collects href, src, poster and every srcset candidate', () => {
    expect(referencedUrls('<a href="/x?a=1&amp;b=2"><img src="/i.webp" srcset="/s.webp 400w, /l.webp 800w"><video poster="/p.jpg">'))
      .toEqual(['/x?a=1&b=2', '/i.webp', '/p.jpg', '/s.webp', '/l.webp'])
  })

  it('reports a missing asset, a link outside the base and a sitemap entry without a page', () => {
    const d = fakeDist({
      'index.html': '<script src="/b/assets/index-1.js"></script><a href="/b/ok">ok</a><img src="/b/gone.png"><a href="/elsewhere">x</a><a href="https://e.org">e</a>',
      'ok.html': '',
      'assets/index-1.js': 'x',
      'sitemap.xml': '<loc>https://site.org/b/ok</loc><loc>https://site.org/b/nope</loc>',
    })
    const { problems } = checkLinks(d)
    expect(problems).toHaveLength(3)
    expect(problems.join('\n')).toMatch(/gone\.png/)
    expect(problems.join('\n')).toMatch(/outside the base/)
    expect(problems.join('\n')).toMatch(/nope/)
  })

  it('fails a budget it exceeds', () => {
    const d = fakeDist({ 'index.html': '<script src="/assets/index-1.js"></script>', 'assets/index-1.js': 'x'.repeat(10) })
    expect(checkBudget(d, { firstLoadGzKb: 1, largestChunkGzKb: 1 }).problems).toEqual([])
    expect(checkBudget(d, { firstLoadGzKb: 0.001, largestChunkGzKb: 0.001 }).problems).toHaveLength(2)
  })
})
