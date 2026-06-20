/**
 * Route smoke tests — every page must render without throwing.
 *
 * Each test:
 *  1. Lazy-loads the real page component
 *  2. Wraps it in MemoryRouter (no Layout/Header/Footer to keep tests fast)
 *  3. Waits for the Suspense boundary to resolve
 *  4. Asserts the container has content
 *
 * Mocks for framer-motion, react-i18next, react-helmet-async, and
 * IntersectionObserver are declared in src/test/setup.js.
 */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { vi } from 'vitest'

// ── Global mocks needed by several pages ─────────────────────────────────────

// useABLData — prevents real fetch during tests
vi.mock('../../hooks/useABLData', () => ({
  useABLData: () => ({
    data: null,
    allResources: [],
    loading: false,
    error: null,
    lastUpdated: null,
    refetch: vi.fn(),
  }),
}))

// ── Helper ────────────────────────────────────────────────────────────────────

async function renderRoute(importFn, path, routePath) {
  const Component = lazy(importFn)
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={routePath}
          element={
            <Suspense fallback={<div data-testid="loading">Loading</div>}>
              <Component />
            </Suspense>
          }
        />
      </Routes>
    </MemoryRouter>
  )

  // Wait for lazy component to load
  await waitFor(
    () => {
      expect(container.textContent).not.toBe('Loading')
    },
    { timeout: 5000 }
  )

  return container
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Route smoke tests', () => {
  it('/ — Home renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/Home'),
      '/',
      '/'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/why-tide — WhyTide renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/WhyTide'),
      '/about/why-tide',
      '/about/why-tide'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/our-team — OurTeam renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/OurTeam'),
      '/about/our-team',
      '/about/our-team'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/our-partners — OurPartners renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/OurPartners'),
      '/about/our-partners',
      '/about/our-partners'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/our-results — OurResults renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/OurResults'),
      '/about/our-results',
      '/about/our-results'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/past-programs — PastPrograms renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/PastPrograms'),
      '/about/past-programs',
      '/about/past-programs'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/about/publications — PublicationsCombined renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/about/PublicationsCombined'),
      '/about/publications',
      '/about/publications'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/education-for-harmony — EducationForHarmony renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/EducationForHarmony'),
      '/education-for-harmony',
      '/education-for-harmony'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/thrive — THRIvE renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/THRIvE'),
      '/thrive',
      '/thrive'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/contact — Contact renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/Contact'),
      '/contact',
      '/contact'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/get-involved/volunteer — Volunteer renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/get-involved/Volunteer'),
      '/get-involved/volunteer',
      '/get-involved/volunteer'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/get-involved/donate — Donate renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/get-involved/Donate'),
      '/get-involved/donate',
      '/get-involved/donate'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/get-involved/work-with-us — WorkWithUs renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/get-involved/WorkWithUs'),
      '/get-involved/work-with-us',
      '/get-involved/work-with-us'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/get-involved/mccx — OrganizeMCCx renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/get-involved/OrganizeMCCx'),
      '/get-involved/mccx',
      '/get-involved/mccx'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/pramaan — AblHome renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/AblHome'),
      '/pramaan',
      '/pramaan'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/pramaan/resource-centre — AblResourceCenter renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/AblResourceCenter'),
      '/pramaan/resource-centre',
      '/pramaan/resource-centre'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/pramaan/contribute — AblContribute renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/AblContribute'),
      '/pramaan/contribute',
      '/pramaan/contribute'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/resources/saral-kadam — SaralKadam renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/SaralKadam'),
      '/resources/saral-kadam',
      '/resources/saral-kadam'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/resources/annual-reports — AnnualReports renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/AnnualReports'),
      '/resources/annual-reports',
      '/resources/annual-reports'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/resources/publications — Publications renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/resources/Publications'),
      '/resources/publications',
      '/resources/publications'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/block-eti — BlockETI renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/BlockETI'),
      '/projects/block-eti',
      '/projects/block-eti'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/bettered — BetterED renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/BetterED'),
      '/projects/bettered',
      '/projects/bettered'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/empowered — EmpowerEd renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/EmpowerEd'),
      '/projects/empowered',
      '/projects/empowered'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/completed — CompletEd renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/CompletEd'),
      '/projects/completed',
      '/projects/completed'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/other-projects — OtherProjects renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/OtherProjects'),
      '/projects/other-projects',
      '/projects/other-projects'
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('/projects/sdg-drives — SdgDrives renders without crashing', async () => {
    const container = await renderRoute(
      () => import('../../pages/projects/SdgDrives'),
      '/projects/sdg-drives',
      '/projects/sdg-drives'
    )
    expect(container.firstChild).not.toBeNull()
  })
})
