// scripts/serve-pages.mjs — serve the built site (dist/) the way GitHub Pages does, for the e2e tests
// against the shipped output (playwright.pages.config.js) and for checking a build by hand.
//
//   node scripts/serve-pages.mjs [root=dist] [base=/tide-testing/] [port=4300]
//
// Rules copied from GitHub Pages' observed behaviour (AGENTS.md §11 "BrowserRouter on a static host"):
//   /base/x            → x if it is a file, else x/ → 301 if x is a folder, else x.html, else 404.html (HTTP 404)
//   /base/x/           → x/index.html, else x.html
//   anything outside /base/ → 404.html (HTTP 404)
// `vite preview` is not a substitute: it answers 200 + index.html for every path and never maps
// /x → x.html, so the prerendered pages and the real 404 status go untested there.
// Local use only: listens on 127.0.0.1 and refuses paths that leave the root.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [rootArg = 'dist', baseArg = '/tide-testing/', portArg = '4300'] = process.argv.slice(2)
const ROOT = path.resolve(rootArg)
const BASE = `/${baseArg.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')
const PORT = Number(portArg)

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json',
}

const isFile = (f) => { try { return fs.statSync(f).isFile() } catch { return false } }
const isDir = (f) => { try { return fs.statSync(f).isDirectory() } catch { return false } }
const inside = (f) => f === ROOT || f.startsWith(ROOT + path.sep)

function send(res, file, status = 200, head = false) {
  res.writeHead(status, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
  if (head) return res.end()
  fs.createReadStream(file).pipe(res)
}

const server = http.createServer((req, res) => {
  const head = req.method === 'HEAD'
  const notFound = () => send(res, path.join(ROOT, '404.html'), 404, head)
  const [rawPath, query = ''] = req.url.split(/\?(.*)/s)
  let url
  try { url = decodeURIComponent(rawPath) } catch { return notFound() }
  if (`${url}/` === BASE) { res.writeHead(301, { location: `${BASE}${query ? `?${query}` : ''}` }); return res.end() }
  if (!url.startsWith(BASE)) return notFound()
  const rel = url.slice(BASE.length)
  const p = path.resolve(ROOT, rel)
  if (!inside(p)) return notFound()
  if (rel && !rel.endsWith('/') && isFile(p)) return send(res, p, 200, head)
  if (rel && !rel.endsWith('/') && isDir(p)) {
    res.writeHead(301, { location: `${rawPath}/${query ? `?${query}` : ''}` })
    return res.end()
  }
  if (isFile(path.join(p, 'index.html'))) return send(res, path.join(p, 'index.html'), 200, head)
  const html = `${p.replace(/[\\/]+$/, '')}.html`
  if (inside(html) && isFile(html)) return send(res, html, 200, head)
  return notFound()
})

server.listen(PORT, '127.0.0.1', () => console.log(`serve-pages: ${ROOT} at http://127.0.0.1:${PORT}${BASE}`))
