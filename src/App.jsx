import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import CreativeLoader from './components/ui/CreativeLoader'
import { useDelayedVisible } from './hooks/useDelayedVisible'

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

const Home                = lazy(() => import('./pages/Home'))
const WhyTide             = lazy(() => import('./pages/about/WhyTide'))
const OurTeam             = lazy(() => import('./pages/about/OurTeam'))
const OurPartners         = lazy(() => import('./pages/about/OurPartners'))
const PastPrograms        = lazy(() => import('./pages/about/PastPrograms'))
const PublicationsCombined = lazy(() => import('./pages/about/PublicationsCombined'))
const EducationForHarmony = lazy(() => import('./pages/EducationForHarmony'))
const Volunteer           = lazy(() => import('./pages/get-involved/Volunteer'))
const Donate              = lazy(() => import('./pages/get-involved/Donate'))
const OrganizeMCCx        = lazy(() => import('./pages/get-involved/OrganizeMCCx'))
const THRIvE              = lazy(() => import('./pages/THRIvE'))
const Contact             = lazy(() => import('./pages/Contact'))
const AblHome             = lazy(() => import('./pages/resources/AblHome'))
const AblResourceCenter   = lazy(() => import('./pages/resources/AblResourceCenter'))
const AblDetail           = lazy(() => import('./pages/resources/AblDetail'))
const AblContribute       = lazy(() => import('./pages/resources/AblContribute'))
const NotFound            = lazy(() => import('./pages/NotFound'))
const ComingSoon          = lazy(() => import('./pages/ComingSoon'))

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
              <Route path="/about/publications" element={<PublicationsCombined />} />

              {/* Education for Harmony */}
              <Route path="/education-for-harmony" element={<EducationForHarmony />} />
              <Route path="/education-for-harmony/mccx" element={<OrganizeMCCx />} />

              {/* Pramaan (ABL Resources) */}
              <Route path="/pramaan" element={<AblHome />} />
              <Route path="/pramaan/resource-centre" element={<AblResourceCenter />} />
              <Route path="/pramaan/resource-centre/:id" element={<AblDetail />} />
              <Route path="/pramaan/contribute" element={<AblContribute />} />

              {/* Get Involved */}
              <Route path="/get-involved/volunteer" element={<Volunteer />} />
              <Route path="/get-involved/donate" element={<Donate />} />

              {/* Other */}
              <Route path="/thrive" element={<THRIvE />} />
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
