import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// P5 (2026-11-24): the Resource Centre's filters and page live in the address. Test rows only
// (not real Sheet data): 20 worksheets + 1 game, so there are 3 pages of 9.
vi.mock('../../data/sheets/pramaan-library.json', () => {
  const row = (id, type) => ({
    id, name: `Item ${id}`, subject: 'Mathematics', type, ownership: 'Owner A', description: null, videoUrl: null,
    additionalInfo: null, photoUrl: null, concept: null, language: null, grades: ['GRADE 1'], chapters: {},
  })
  const resources = [...Array.from({ length: 20 }, (_, i) => row(`W${String(i + 1).padStart(2, '0')}`, 'Worksheet')), row('G01', 'Games')]
  return { default: { schemaVersion: 1, section: 'pramaan-library', success: true, lastUpdated: null, contentHash: 'x', meta: { total: resources.length }, resources } }
})

const { default: PramaanLibrary } = await import('../../pages/library/PramaanLibrary')

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search}</output>
}

function renderAt(path) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        {/* Stands in for the header / Pramaan tab bar link to the same page. */}
        <Link to="/pramaan/resource-centre">menu link</Link>
        <Where />
        <Routes>
          <Route path="/pramaan/resource-centre" element={<PramaanLibrary />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

const cardNames = () => screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent).filter(t => t.startsWith('Item '))
const pager = () => screen.getByRole('navigation', { name: /pag/i })

describe('Resource Centre address state', () => {
  it('page numbers are real links that keep the filters (crawlable, open in a new tab)', () => {
    renderAt('/pramaan/resource-centre?type=worksheet')
    const links = within(pager()).getAllByRole('link')
    const hrefs = links.map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/pramaan/resource-centre?type=worksheet&page=2')
    expect(hrefs).toContain('/pramaan/resource-centre?type=worksheet&page=3')
    expect(within(pager()).getByRole('link', { current: 'page' })).toHaveTextContent('1')
  })

  it('a click on a page number shows that page and writes it to the address', () => {
    Element.prototype.scrollIntoView ??= () => {} // not in jsdom
    renderAt('/pramaan/resource-centre')
    const first = cardNames()
    fireEvent.click(within(pager()).getByRole('link', { name: '2' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/pramaan/resource-centre?page=2')
    expect(cardNames()).toHaveLength(9)
    expect(cardNames().some(n => first.includes(n))).toBe(false)
    expect(within(pager()).getByRole('link', { current: 'page' })).toHaveTextContent('2')
  })

  it('keyboard: the page number used keeps focus after the page changes (same element)', () => {
    Element.prototype.scrollIntoView ??= () => {}
    renderAt('/pramaan/resource-centre')
    const two = within(pager()).getByRole('link', { name: '2' })
    two.focus()
    fireEvent.click(two)
    expect(document.activeElement).toBe(two)
    expect(two).toHaveAttribute('aria-current', 'page')
  })

  it('an out-of-range or invalid ?page= shows a real page, never an empty list', () => {
    renderAt('/pramaan/resource-centre?page=99')
    expect(cardNames().length).toBe(3) // last page: 21 = 9 + 9 + 3
    expect(within(pager()).getByRole('link', { current: 'page' })).toHaveTextContent('3')
    expect(screen.queryByText(/No resources match/i)).not.toBeInTheDocument()
  })

  it('a negative ?page= shows page 1', () => {
    renderAt('/pramaan/resource-centre?page=-2')
    expect(cardNames().length).toBe(9)
    expect(within(pager()).getByRole('link', { current: 'page' })).toHaveTextContent('1')
  })

  it('a link to the same page without a query (menu, tab bar) clears the filters and the page', () => {
    renderAt('/pramaan/resource-centre?type=games&page=1')
    expect(cardNames()).toEqual(['Item G01'])
    fireEvent.click(screen.getByRole('link', { name: 'menu link' }))
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/pramaan\/resource-centre$/)
    expect(cardNames().length).toBe(9)
    expect(screen.queryByRole('button', { name: /^Remove filter/ })).not.toBeInTheDocument()
  })
})
