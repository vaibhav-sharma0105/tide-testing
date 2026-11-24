// Shared fixtures for the built-site e2e suite (playwright.site.config.js).
//
// - Every request to another host is answered here with an empty 200 (fonts, YouTube, Drive, Maps,
//   Apps Script), so runs are deterministic and offline. CSP still applies: a blocked request is
//   reported by the browser before it reaches this handler.
// - Every test checks, when it ends, that the page logged no console error, threw no error, had no
//   CSP violation and no same-site request failed (status ≥ 400 or network error). A test that
//   expects one (a 404 page, a simulated outage) says so with site.allow(/pattern/).
// - go(page, '/about/why-tide') opens a site path under the base (/tide-testing/…), and waits until
//   the app has replaced the prerendered HTML (the build doesn't hydrate: clicking before that would
//   hit inert HTML).
import { test as base, expect } from '@playwright/test'

export { expect }

export const ORIGIN_RE = /^http:\/\/127\.0\.0\.1:\d+\//

export const test = base.extend({
  site: [async ({ context, page }, use, testInfo) => {
    const problems = []
    const allowed = []
    const record = (kind, text) => problems.push(`${kind}: ${text}`)

    await context.route((url) => !ORIGIN_RE.test(url.href), (route) => {
      const type = route.request().resourceType()
      const contentType = type === 'stylesheet' ? 'text/css' : type === 'script' ? 'text/javascript' : type === 'document' ? 'text/html' : 'text/plain'
      return route.fulfill({ status: 200, contentType, body: type === 'document' ? '<!doctype html><title>stub</title>' : '' })
    })
    const watch = (p) => {
      p.on('console', (m) => { if (m.type() === 'error') record('console', m.text()) })
      p.on('pageerror', (e) => record('pageerror', e.message))
      // A request the browser cancels itself (the page reloaded, an image was replaced mid-load) is not
      // a failure: Chromium/WebKit say ERR_ABORTED / "cancelled", Firefox NS_BINDING_ABORTED. A missing
      // file still fails the test through the HTTP status check below.
      p.on('requestfailed', (r) => {
        const why = r.failure()?.errorText ?? ''
        if (ORIGIN_RE.test(r.url()) && !/ABORTED|cancelled/i.test(why)) record('requestfailed', `${r.url()} ${why}`)
      })
      p.on('response', (r) => {
        if (r.status() >= 400 && ORIGIN_RE.test(r.url()) && !(r.request().isNavigationRequest() && r.status() === 404)) {
          record('http', `${r.status()} ${r.url()}`)
        }
      })
    }
    watch(page)
    context.on('page', watch)
    await context.exposeBinding('__e2eCsp', (_, text) => record('csp', text))
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__e2eCsp?.(`${e.violatedDirective} ${e.blockedURI}`)
      })
    })

    await use({
      allow: (re) => allowed.push(re),
      problems: () => problems.filter((p) => !allowed.some((re) => re.test(p))),
    })

    const left = problems.filter((p) => !allowed.some((re) => re.test(p)))
    if (left.length) testInfo.annotations.push({ type: 'page problems', description: left.join('\n') })
    expect(left, 'console errors, page errors, CSP violations or failed same-site requests').toEqual([])
  }, { auto: true }],
})

/** The app has rendered over the prerendered HTML (React's fiber is on the page heading). */
export async function ready(page) {
  await page.waitForFunction(() => {
    const h1 = document.querySelector('main#main-content h1')
    return !!h1 && Object.keys(h1).some((k) => k.startsWith('__reactFiber'))
  })
}

/** Open a site path ('/x?y') under the base path and wait for the app. Returns the response. */
export async function go(page, sitePath, { wait = true } = {}) {
  const res = await page.goto(sitePath.replace(/^\//, ''))
  if (wait) await ready(page)
  return res
}

/**
 * The current address as a site path ('/pramaan/resource-centre?type=games'), base and a trailing
 * slash removed: a path that is also a folder (pramaan/resource-centre/) is redirected to its slash
 * form by serve-pages.mjs (folder first; GitHub Pages' order is not verified, AGENTS.md §11) and the
 * app treats both forms as one page.
 */
export function sitePath(page) {
  const u = new URL(page.url())
  return (u.pathname.replace(/^\/tide-testing/, '').replace(/(.)\/$/, '$1') || '/') + u.search
}

/**
 * Waits until what is inside `scope` (a CSS selector) has stopped moving: no finite animation or CSS
 * transition is running on it, and every element's opacity is the same on two polls 150 ms apart.
 * Infinite decorative loops (the Partners banner lights) and scroll-linked effects are ignored: they
 * never settle and never fade what is being checked. Used before colour-contrast / target-size scans and screenshots. (Opacity
 * alone was not enough: the lightbox dot strip animates its width — axe then read a mid-transition
 * target size, P6.)
 */
export async function still(page, scope = 'body') {
  await page.waitForFunction((sel) => {
    const root = document.querySelector(sel)
    if (!root) return false
    const moving = document.getAnimations().some((a) => {
      const target = a.effect?.target
      // Scroll-linked effects (a ScrollTimeline, e.g. the home hero's fade on scroll) are "running"
      // as long as the page exists; they move only when the page scrolls, so they don't count.
      if (a.timeline && a.timeline !== document.timeline) return false
      return a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity
        && target instanceof Element && (root === target || root.contains(target))
    })
    const sig = [root, ...root.querySelectorAll('*')].slice(0, 6000).map((el) => getComputedStyle(el).opacity).join(',')
    const key = `__e2eStill:${sel}`
    const same = window[key] === sig
    window[key] = sig
    return same && !moving
  }, scope, { polling: 150 })
}
