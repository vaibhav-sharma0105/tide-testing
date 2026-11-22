import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { Suspense } from 'react'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import CreativeLoader from './components/ui/CreativeLoader'
import { useDelayedVisible } from './hooks/useDelayedVisible'
// lazyPage = React.lazy that reloads once (with the loader up) if a page's file is gone after a deploy.
import { lazyPage } from './utils/reloadOnStaleChunk'

/* Suspense renders this the instant a lazy route suspends, and unmounts it
   the instant the import resolves — useDelayedVisible(true, ...) means it
   only actually shows anything if that window lasts longer than the delay,
   so a fast chunk load never flashes the loader at all. */
function RouteLoadingFallback() {
  const show = useDelayedVisible(true, 200)
  return (
    <div className="min-h-screen flex items-center justify-center bg-tide-bg">
      {show && <CreativeLoader />}
    </div>
  )
}

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

export default function App() {
  return (
    <ErrorBoundary>
    <HelmetProvider>
      {/* reducedMotion="user" makes every motion.* animation in the app
          respect the OS-level prefers-reduced-motion setting automatically —
          the CSS media query in index.css only covers actual CSS animations/
          transitions, not Framer Motion's JS-driven ones, which is everything
          used throughout this site (motion.div, whileInView, etc). */}
      <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* ── Active routes ───────────────────────────────────────── */}
              <Route path="/" element={<Home />} />

              {/* About Us */}
              <Route path="/about/why-tide" element={<WhyTide />} />
              <Route path="/about/past-programs" element={<PastPrograms />} />
              <Route path="/about/our-team" element={<OurTeam />} />
              <Route path="/about/our-partners" element={<OurPartners />} />
              {/* TIDE and THRIvE publications: one Sheet snapshot, one shared listing (components/publications) */}
              <Route path="/tide/publications" element={<TidePublications />} />
              {/* The TIDE page's first address; forwards to /tide/publications, keeping the query string */}
              <Route path="/about/publications" element={<TidePublicationsRedirect />} />

              {/* Education for Harmony */}
              <Route path="/education-for-harmony" element={<EducationForHarmony />} />
              <Route path="/education-for-harmony/mccx" element={<OrganizeMCCx />} />
              {/* Not in the menu or footer: reached from the Social Changemakers row on /education-for-harmony */}
              <Route path="/education-for-harmony/social-changemakers" element={<SocialChangemakers />} />

              {/* Pramaan. The Resource Centre is the Pramaan Library (snapshot of the form-format Sheet) */}
              <Route path="/pramaan" element={<AblHome />} />
              <Route path="/pramaan/resource-centre" element={<PramaanLibrary />} />
              <Route path="/pramaan/resource-centre/:id" element={<PramaanLibraryDetail />} />
              <Route path="/pramaan/contribute" element={<AblContribute />} />
              {/* The library's former address — redirects, so old links keep working */}
              <Route path="/pramaan-library" element={<LibraryRedirect />} />
              <Route path="/pramaan-library/:id" element={<LibraryRedirect />} />

              {/* Get Involved */}
              <Route path="/get-involved/volunteer" element={<Volunteer />} />
              <Route path="/get-involved/donate" element={<Donate />} />

              {/* Other */}
              <Route path="/thrive" element={<THRIvE />} />
              <Route path="/thrive/publications" element={<ThrivePublications />} />
              <Route path="/contact" element={<Contact />} />

              {/* ── Functional / system pages ────────────────────────────── */}
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/404" element={<NotFound />} />
              {/* Catch-all — must stay last: any unmatched path falls through to here */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      </MotionConfig>
    </HelmetProvider>
    </ErrorBoundary>
  )
}
