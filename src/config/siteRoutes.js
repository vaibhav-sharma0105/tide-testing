// The site's public addresses, in one list that the build reads (scripts/prerender.mjs writes a real
// HTML file for each; scripts/siteDataPlugin.js builds sitemap.xml from it) and the app checks against
// (src/test/routing/siteRoutes.test.jsx renders every path through <App />). Paths only — the page
// components are registered in src/App.jsx.
//
// sources: the files a page's content comes from; the newest git commit touching them is the page's
// <lastmod> in sitemap.xml (never invented: no git history → no <lastmod>).
// sitemap: false keeps a page out of sitemap.xml (owner decision for Social Changemakers, while it is
// a placeholder: linked only from /education-for-harmony, not in the menus or the sitemap).

const page = (name) => `content/pages/${name}.yaml`
const LIBRARY = 'src/data/sheets/pramaan-library.json'
const PUBLICATIONS = 'src/data/sheets/publications.json'

export const PRIMARY_ROUTES = [
  { path: '/', sources: [page('home'), 'src/data/sheets/partners.json'] },
  { path: '/about/why-tide', sources: [page('about-why-tide')] },
  { path: '/about/past-programs', sources: [page('about-past-programs')] },
  { path: '/about/our-team', sources: [page('about-our-team')] },
  { path: '/about/our-partners', sources: [page('about-our-partners'), 'src/data/sheets/partners.json'] },
  { path: '/tide/publications', sources: [page('tide-publications'), PUBLICATIONS] },
  { path: '/education-for-harmony', sources: [page('education-for-harmony')] },
  { path: '/education-for-harmony/mccx', sources: [page('get-involved-mccx')] },
  {
    path: '/education-for-harmony/social-changemakers',
    sources: [page('social-changemakers'), 'src/data/sheets/social-changemakers.json'],
    sitemap: false,
  },
  { path: '/pramaan', sources: [page('abl-home'), LIBRARY] },
  { path: '/pramaan/resource-centre', sources: [page('pramaan-library'), LIBRARY] },
  { path: '/pramaan/contribute', sources: [page('abl-contribute')] },
  { path: '/get-involved/volunteer', sources: [page('get-involved-volunteer')] },
  { path: '/get-involved/donate', sources: [page('get-involved-donate')] },
  { path: '/thrive', sources: [page('thrive')] },
  { path: '/thrive/publications', sources: [page('thrive-publications'), PUBLICATIONS] },
  { path: '/contact', sources: [page('contact')] },
]

// One page per Resource Centre row (/pramaan/resource-centre/:id), listed from the snapshot.
export const RESOURCE_ROUTE = { prefix: '/pramaan/resource-centre/', sources: [page('pramaan-library'), LIBRARY] }

export function resourcePath(id) {
  return `${RESOURCE_ROUTE.prefix}${encodeURIComponent(id)}`
}

// Old addresses that forward in the browser (GitHub Pages cannot answer with a real 301). The build
// writes a small file for each that is noindex, names the new address as canonical and forwards to it,
// keeping the query string. /pramaan-library/:id is left to the app (404.html → the app's redirect).
export const REDIRECT_ROUTES = [
  { from: '/pramaan-library', to: '/pramaan/resource-centre' },
  { from: '/about/publications', to: '/tide/publications' },
]
