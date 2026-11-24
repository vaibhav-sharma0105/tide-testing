import { matchPath } from 'react-router-dom'
// lazyPage = React.lazy that reloads once (with the loader up) if a page's file is gone after a deploy,
// plus preload() (used by main.jsx before the first render of a prerendered page).
import { lazyPage } from './utils/reloadOnStaleChunk'

const Home                = lazyPage(() => import('./pages/Home'))
const WhyTide             = lazyPage(() => import('./pages/about/WhyTide'))
const OurTeam             = lazyPage(() => import('./pages/about/OurTeam'))
const OurPartners         = lazyPage(() => import('./pages/about/OurPartners'))
const PastPrograms        = lazyPage(() => import('./pages/about/PastPrograms'))
const TidePublications    = lazyPage(() => import('./pages/publications/TidePublications'))
const ThrivePublications  = lazyPage(() => import('./pages/publications/ThrivePublications'))
const TidePublicationsRedirect = lazyPage(() => import('./pages/publications/TidePublicationsRedirect'))
const EducationForHarmony = lazyPage(() => import('./pages/EducationForHarmony'))
const Volunteer           = lazyPage(() => import('./pages/get-involved/Volunteer'))
const Donate              = lazyPage(() => import('./pages/get-involved/Donate'))
const OrganizeMCCx        = lazyPage(() => import('./pages/get-involved/OrganizeMCCx'))
const SocialChangemakers  = lazyPage(() => import('./pages/SocialChangemakers'))
const THRIvE              = lazyPage(() => import('./pages/THRIvE'))
const Contact             = lazyPage(() => import('./pages/Contact'))
const AblHome             = lazyPage(() => import('./pages/resources/AblHome'))
const AblContribute       = lazyPage(() => import('./pages/resources/AblContribute'))
const PramaanLibrary      = lazyPage(() => import('./pages/library/PramaanLibrary'))
const PramaanLibraryDetail = lazyPage(() => import('./pages/library/PramaanLibraryDetail'))
const LibraryRedirect     = lazyPage(() => import('./pages/library/LibraryRedirect'))
const NotFound            = lazyPage(() => import('./pages/NotFound'))
const ComingSoon          = lazyPage(() => import('./pages/ComingSoon'))

// Every route, in matching order (React Router ranks paths anyway; "*" stays last by convention).
// Public addresses are also listed in src/config/siteRoutes.js for the build (prerender + sitemap);
// src/test/routing/siteRoutes.test.jsx checks that the two agree.
export const ROUTES = [
  ['/', Home],

  // About Us
  ['/about/why-tide', WhyTide],
  ['/about/past-programs', PastPrograms],
  ['/about/our-team', OurTeam],
  ['/about/our-partners', OurPartners],
  // TIDE and THRIvE publications: one Sheet snapshot, one shared listing (components/publications)
  ['/tide/publications', TidePublications],
  // The TIDE page's first address; forwards to /tide/publications, keeping the query string
  ['/about/publications', TidePublicationsRedirect],

  // Education for Harmony
  ['/education-for-harmony', EducationForHarmony],
  ['/education-for-harmony/mccx', OrganizeMCCx],
  // Not in the menu or footer: reached from the Social Changemakers row on /education-for-harmony
  ['/education-for-harmony/social-changemakers', SocialChangemakers],

  // Pramaan. The Resource Centre is the Pramaan Library (snapshot of the form-format Sheet)
  ['/pramaan', AblHome],
  ['/pramaan/resource-centre', PramaanLibrary],
  ['/pramaan/resource-centre/:id', PramaanLibraryDetail],
  ['/pramaan/contribute', AblContribute],
  // The library's former address — redirects, so old links keep working
  ['/pramaan-library', LibraryRedirect],
  ['/pramaan-library/:id', LibraryRedirect],

  // Get Involved
  ['/get-involved/volunteer', Volunteer],
  ['/get-involved/donate', Donate],

  // Other
  ['/thrive', THRIvE],
  ['/thrive/publications', ThrivePublications],
  ['/contact', Contact],

  // Functional / system pages
  ['/coming-soon', ComingSoon],
  ['/404', NotFound],
  // Catch-all: any unmatched path falls through to here
  ['*', NotFound],
]

/** Loads the code of the page at `pathname` (without the base path), so the first render needs no loading screen. */
export function preloadPage(pathname) {
  const hit = ROUTES.find(([path]) => path !== '*' && matchPath(path, pathname))
  return (hit ? hit[1] : NotFound).preload()
}

