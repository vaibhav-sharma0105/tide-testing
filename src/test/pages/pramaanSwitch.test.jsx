import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// Test rows only (not real Sheet data): 3 worksheets, 1 kit, 2 flashcards, 1 type the Pramaan palette doesn't know.
vi.mock('../../data/sheets/pramaan-library.json', () => ({ default: {
  schemaVersion: 1, section: 'pramaan-library', success: true, lastUpdated: '2026-11-16T00:00:00.000Z', contentHash: 'x',
  meta: { total: 7 },
  resources: [
    ...['W1', 'W2', 'W3'].map(id => ({ id, name: id, type: 'Worksheet', grades: [], chapters: {} })),
    { id: 'K1', name: 'K1', type: 'Kit', grades: [], chapters: {} },
    { id: 'F1', name: 'F1', type: 'Flashcard', grades: [], chapters: {} },
    { id: 'F2', name: 'F2', type: 'flashcard ', grades: [], chapters: {} },
    { id: 'P1', name: 'P1', type: 'Puzzle', grades: [], chapters: {} },
  ],
} }))

const { default: AblHome } = await import('../../pages/resources/AblHome')
const { default: AblContribute } = await import('../../pages/resources/AblContribute')
const { default: LibraryRedirect } = await import('../../pages/library/LibraryRedirect')
const contribute = (await import('../../data/abl-contribute.json')).default

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

const renderAt = (path, routes) => render(
  <HelmetProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>{routes}</Routes>
    </MemoryRouter>
  </HelmetProvider>,
)

describe('/pramaan reads the Resource Centre snapshot', () => {
  it('type cards: Pramaan names and order, counts from the snapshot, links to the library type filter', () => {
    renderAt('/pramaan', <Route path="/pramaan" element={<AblHome />} />)
    const cards = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('/pramaan/resource-centre?type='))
    expect(cards.map(a => a.getAttribute('href'))).toEqual([
      '/pramaan/resource-centre?type=worksheet',
      '/pramaan/resource-centre?type=kit',
      '/pramaan/resource-centre?type=flashcard',
      '/pramaan/resource-centre?type=puzzle',
    ])
    expect(cards[0].textContent).toMatch(/Worksheets\s*3/)
    expect(cards[1].textContent).toMatch(/Kits\s*1/)
    expect(cards[2].textContent).toMatch(/Flashcards\s*2/)
    expect(cards[3].textContent).toMatch(/Puzzle\s*1/)
  })
})

describe('/pramaan/contribute', () => {
  it('the form button opens the link from abl-contribute.yaml (formUrl)', () => {
    renderAt('/pramaan/contribute', <Route path="/pramaan/contribute" element={<AblContribute />} />)
    expect(contribute.formUrl).toMatch(/^https:\/\/docs\.google\.com\/forms\//)
    expect(screen.getByRole('link', { name: new RegExp(contribute.cta) })).toHaveAttribute('href', contribute.formUrl)
  })
})

describe('/pramaan-library redirects to /pramaan/resource-centre', () => {
  const routes = [
    <Route key="a" path="/pramaan-library" element={<LibraryRedirect />} />,
    <Route key="b" path="/pramaan-library/:id" element={<LibraryRedirect />} />,
    <Route key="c" path="/pramaan/resource-centre/*" element={<Where />} />,
  ]
  it('keeps the filters', () => {
    renderAt('/pramaan-library?type=kit&page=2', routes)
    expect(screen.getByTestId('where').textContent).toBe('/pramaan/resource-centre?type=kit&page=2')
  })
  it('keeps the resource id', () => {
    renderAt('/pramaan-library/K32%20(26%20in%20Gujarati)', routes)
    expect(screen.getByTestId('where').textContent).toBe('/pramaan/resource-centre/K32%20(26%20in%20Gujarati)')
  })
})
