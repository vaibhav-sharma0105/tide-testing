import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preloadPage } from './routes'
import { installImagePlaceholder } from './utils/imagePlaceholder'

installImagePlaceholder()

const container = document.getElementById('root')
const render = () => createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Pages are written in advance by the build (scripts/prerender.mjs), so crawlers that don't run
// JavaScript get the real text and head tags. The app does not hydrate that HTML: it renders the
// same page fresh. Before that, (1) the head tags the build wrote are removed (the app adds its own;
// leaving them could duplicate or outlive them), and (2) the page's code is loaded first, so the
// pre-written page stays on screen until the app's identical one replaces it — no blank moment.
// The page's <title> is rendered by the app (SeoHead → react-helmet-async → React 19). React did not
// reuse the <title> already in the HTML and added a second one (seen on the live staging site,
// 2026-11-24: "Why TIDE? — TIDE Foundation" + "TIDE Foundation"), so the HTML's title is removed first.
document.head.querySelectorAll('title').forEach((el) => el.remove())

if (container.hasChildNodes()) {
  document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove())
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname.slice(base.length) || '/'
  preloadPage(path).then(render, render)
} else {
  render()
}
