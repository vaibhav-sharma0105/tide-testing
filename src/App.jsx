import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { Component, lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
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

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#c00', background: '#fff', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fee', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const Home                = lazy(() => import('./pages/Home'))
const WhyTide             = lazy(() => import('./pages/about/WhyTide'))
const OurTeam             = lazy(() => import('./pages/about/OurTeam'))
const OurPartners         = lazy(() => import('./pages/about/OurPartners'))
const OurResults          = lazy(() => import('./pages/about/OurResults'))
const PastPrograms        = lazy(() => import('./pages/about/PastPrograms'))
const PublicationsCombined = lazy(() => import('./pages/about/PublicationsCombined'))
const EducationForHarmony = lazy(() => import('./pages/EducationForHarmony'))
const BlockETI            = lazy(() => import('./pages/projects/BlockETI'))
const BetterED            = lazy(() => import('./pages/projects/BetterED'))
const EmpowerEd           = lazy(() => import('./pages/projects/EmpowerEd'))
const CompletEd           = lazy(() => import('./pages/projects/CompletEd'))
const OtherProjects       = lazy(() => import('./pages/projects/OtherProjects'))
const SdgDrives           = lazy(() => import('./pages/projects/SdgDrives'))
const Volunteer           = lazy(() => import('./pages/get-involved/Volunteer'))
const Donate              = lazy(() => import('./pages/get-involved/Donate'))
const WorkWithUs          = lazy(() => import('./pages/get-involved/WorkWithUs'))
const OrganizeMCCx        = lazy(() => import('./pages/get-involved/OrganizeMCCx'))
const THRIvE              = lazy(() => import('./pages/THRIvE'))
const SaralKadam          = lazy(() => import('./pages/resources/SaralKadam'))
const AnnualReports       = lazy(() => import('./pages/resources/AnnualReports'))
const Publications        = lazy(() => import('./pages/resources/Publications'))
const Contact             = lazy(() => import('./pages/Contact'))
const AblHome             = lazy(() => import('./pages/resources/AblHome'))
const AblResourceCenter   = lazy(() => import('./pages/resources/AblResourceCenter'))
const AblDetail           = lazy(() => import('./pages/resources/AblDetail'))
const AblContribute       = lazy(() => import('./pages/resources/AblContribute'))
const NotFound            = lazy(() => import('./pages/NotFound'))

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

              {/* ── Stranded routes — accessible via URL, not in nav ───── */}
              {/* Pending stakeholder decision on redirect/removal          */}
              <Route path="/about/our-results" element={<OurResults />} />
              <Route path="/projects/block-eti" element={<BlockETI />} />
              <Route path="/projects/bettered" element={<BetterED />} />
              <Route path="/projects/empowered" element={<EmpowerEd />} />
              <Route path="/projects/completed" element={<CompletEd />} />
              <Route path="/projects/other-projects" element={<OtherProjects />} />
              <Route path="/projects/sdg-drives" element={<SdgDrives />} />
              <Route path="/get-involved/work-with-us" element={<WorkWithUs />} />
              <Route path="/get-involved/mccx" element={<OrganizeMCCx />} />
              <Route path="/resources/saral-kadam" element={<SaralKadam />} />
              <Route path="/resources/annual-reports" element={<AnnualReports />} />
              <Route path="/resources/publications" element={<Publications />} />
              <Route path="/resources/abl-resources" element={<AblHome />} />
              <Route path="/resources/abl-resources/resource-center" element={<AblResourceCenter />} />
              <Route path="/resources/abl-resources/resource-center/:id" element={<AblDetail />} />
              <Route path="/resources/abl-resources/contribute" element={<AblContribute />} />

              {/* ── Catch-all — no other route matched ───────────────────── */}
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
