import { HashRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Component } from 'react'
import Layout from './components/layout/Layout'

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

import Home from './pages/Home'
import WhyTide from './pages/about/WhyTide'
import OurTeam from './pages/about/OurTeam'
import OurPartners from './pages/about/OurPartners'
import OurResults from './pages/about/OurResults'
import PastPrograms from './pages/about/PastPrograms'
import PublicationsCombined from './pages/about/PublicationsCombined'
import EducationForHarmony from './pages/EducationForHarmony'
import BlockETI from './pages/projects/BlockETI'
import BetterED from './pages/projects/BetterED'
import EmpowerEd from './pages/projects/EmpowerEd'
import CompletEd from './pages/projects/CompletEd'
import OtherProjects from './pages/projects/OtherProjects'
import SdgDrives from './pages/projects/SdgDrives'
import Volunteer from './pages/get-involved/Volunteer'
import Donate from './pages/get-involved/Donate'
import WorkWithUs from './pages/get-involved/WorkWithUs'
import OrganizeMCCx from './pages/get-involved/OrganizeMCCx'
import THRIvE from './pages/THRIvE'
import SaralKadam from './pages/resources/SaralKadam'
import AnnualReports from './pages/resources/AnnualReports'
import Publications from './pages/resources/Publications'
import Contact from './pages/Contact'
import AblHome           from './pages/resources/AblHome'
import AblResourceCenter from './pages/resources/AblResourceCenter'
import AblDetail         from './pages/resources/AblDetail'
import AblContribute     from './pages/resources/AblContribute'

export default function App() {
  return (
    <ErrorBoundary>
    <HelmetProvider>
      <HashRouter>
        <Layout>
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
          </Routes>
        </Layout>
      </HashRouter>
    </HelmetProvider>
    </ErrorBoundary>
  )
}
