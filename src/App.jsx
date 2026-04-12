import { HashRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/layout/Layout'

import Home from './pages/Home'
import WhyTide from './pages/about/WhyTide'
import OurTeam from './pages/about/OurTeam'
import OurPartners from './pages/about/OurPartners'
import OurResults from './pages/about/OurResults'
import BlockETI from './pages/projects/BlockETI'
import BetterED from './pages/projects/BetterED'
import EmpowerEd from './pages/projects/EmpowerEd'
import CompletEd from './pages/projects/CompletEd'
import OtherProjects from './pages/projects/OtherProjects'
import Volunteer from './pages/get-involved/Volunteer'
import Donate from './pages/get-involved/Donate'
import WorkWithUs from './pages/get-involved/WorkWithUs'
import OrganizeMCCx from './pages/get-involved/OrganizeMCCx'
import THRIvE from './pages/THRIvE'
import SaralKadam from './pages/resources/SaralKadam'
import AnnualReports from './pages/resources/AnnualReports'
import Publications from './pages/resources/Publications'
import Contact from './pages/Contact'

export default function App() {
  return (
    <HelmetProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about/why-tide" element={<WhyTide />} />
            <Route path="/about/our-team" element={<OurTeam />} />
            <Route path="/about/our-partners" element={<OurPartners />} />
            <Route path="/about/our-results" element={<OurResults />} />
            <Route path="/projects/block-eti" element={<BlockETI />} />
            <Route path="/projects/bettered" element={<BetterED />} />
            <Route path="/projects/empowered" element={<EmpowerEd />} />
            <Route path="/projects/completed" element={<CompletEd />} />
            <Route path="/projects/other-projects" element={<OtherProjects />} />
            <Route path="/get-involved/volunteer" element={<Volunteer />} />
            <Route path="/get-involved/donate" element={<Donate />} />
            <Route path="/get-involved/work-with-us" element={<WorkWithUs />} />
            <Route path="/get-involved/mccx" element={<OrganizeMCCx />} />
            <Route path="/thrive" element={<THRIvE />} />
            <Route path="/resources/saral-kadam" element={<SaralKadam />} />
            <Route path="/resources/annual-reports" element={<AnnualReports />} />
            <Route path="/resources/publications" element={<Publications />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </HashRouter>
    </HelmetProvider>
  )
}
