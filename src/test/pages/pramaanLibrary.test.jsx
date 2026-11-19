import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// Test rows only (not real Sheet data) — the committed snapshot is empty until the first sync.
vi.mock('../../data/sheets/pramaan-library.json', () => ({ default: {
  schemaVersion: 1, section: 'pramaan-library', success: true, lastUpdated: '2026-11-16T00:00:00.000Z', contentHash: 'x',
  meta: { total: 2 },
  resources: [
    { id: 'W1', name: 'Test worksheet', subject: 'Mathematics', type: 'Worksheet', ownership: 'Owner A', description: 'Test description one',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ', additionalInfo: 'See https://example.org/more', photoUrl: null, concept: null, language: null,
      grades: ['GRADE 1'], chapters: { 'GRADE 1': ['ch 2', 'ch 5'] } },
    { id: 'G1', name: 'Test game', subject: 'Language', type: 'Games', ownership: 'Owner B', description: null, videoUrl: null,
      additionalInfo: null, photoUrl: null, concept: null, language: null, grades: ['FOUNDATIONAL'], chapters: { FOUNDATIONAL: ['Sounds'] } },
  ],
} }))

const { default: PramaanLibrary } = await import('../../pages/library/PramaanLibrary')
const { default: PramaanLibraryDetail } = await import('../../pages/library/PramaanLibraryDetail')

function renderAt(path) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/pramaan/resource-centre" element={<PramaanLibrary />} />
          <Route path="/pramaan/resource-centre/:id" element={<PramaanLibraryDetail />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('Pramaan Library pages', () => {
  it('lists resources with name, description and owner, and filters by subject', () => {
    renderAt('/pramaan/resource-centre')
    expect(screen.getAllByText('Test worksheet').length).toBeGreaterThan(0)
    expect(screen.getByText('Test description one')).toBeInTheDocument()
    expect(screen.getAllByText('Owner B').length).toBeGreaterThan(0)
    // Subject is a compact picker: one field showing the choice; the ordered list opens inline.
    fireEvent.click(screen.getByRole('button', { name: /Subject All subjects/ }))
    expect(screen.getAllByRole('option').map(o => o.getAttribute('aria-label'))).toEqual(['All subjects, 2 resources', 'Language, 1 resources', 'Mathematics, 1 resources'])
    fireEvent.click(screen.getByRole('option', { name: /^Language,/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Test worksheet')).not.toBeInTheDocument()
    expect(screen.getAllByText('Test game').length).toBeGreaterThan(0)
  })

  it('sorts by the menu (rounded listbox, keyboard-operable) and keeps the choice in the URL', () => {
    renderAt('/pramaan/resource-centre?sort=owner')
    const trigger = screen.getByRole('button', { name: 'Sort by: Ownership' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    const names = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(names().indexOf('Test worksheet')).toBeLessThan(names().indexOf('Test game'))
    fireEvent.click(trigger)
    const list = screen.getByRole('listbox', { name: 'Sort by' })
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['Subject', 'Type of material', 'Ownership'])
    expect(screen.getByRole('option', { name: 'Ownership' })).toHaveAttribute('aria-selected', 'true')
    // Keyboard: ↑ from Ownership → Type of material, Enter chooses it.
    fireEvent.keyDown(list, { key: 'ArrowUp' })
    fireEvent.keyDown(list, { key: 'Enter' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort by: Type of material' })).toBeInTheDocument()
    expect(names().indexOf('Test game')).toBeLessThan(names().indexOf('Test worksheet'))
    fireEvent.click(screen.getByRole('button', { name: /Sort order: A → Z/ }))
    expect(names().indexOf('Test worksheet')).toBeLessThan(names().indexOf('Test game'))
    expect(screen.getByRole('button', { name: /Sort order: Z → A/ })).toBeInTheDocument()
  })

  it('ownership picker: keyboard choose, then clear with ×', () => {
    renderAt('/pramaan/resource-centre')
    const trigger = screen.getByRole('button', { name: /Ownership All owners/ })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    const list = screen.getByRole('listbox', { name: 'Ownership' })
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    fireEvent.keyDown(list, { key: 'Enter' })
    expect(screen.queryByText('Test game')).not.toBeInTheDocument()
    // The picker's × (first) and the chip above the cards both clear it.
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove filter: Owner A' })[0])
    expect(screen.getAllByText('Test game').length).toBeGreaterThan(0)
  })

  it('search sits in the toolbar and can be cleared', () => {
    renderAt('/pramaan/resource-centre')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search resources' }), { target: { value: 'game' } })
    expect(screen.queryByText('Test worksheet')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getAllByText('Test worksheet').length).toBeGreaterThan(0)
  })

  it('reads filters from the URL (grade)', () => {
    renderAt('/pramaan/resource-centre?grade=FOUNDATIONAL')
    expect(screen.queryByText('Test worksheet')).not.toBeInTheDocument()
  })

  it('accepts the former Resource Centre type names in the URL (?type=Games, ?type=Worksheets)', () => {
    renderAt('/pramaan/resource-centre?type=Worksheets')
    expect(screen.getAllByText('Test worksheet').length).toBeGreaterThan(0)
    expect(screen.queryByText('Test game')).not.toBeInTheDocument()
  })

  it('shows the Pramaan tab bar with Resource Centre active, on the list and the detail page', () => {
    renderAt('/pramaan/resource-centre')
    expect(screen.getByRole('link', { name: 'About Pramaan' })).toHaveAttribute('href', '/pramaan')
    expect(screen.getByRole('link', { name: 'Contribute' })).toHaveAttribute('href', '/pramaan/contribute')
    expect(screen.getByRole('link', { name: 'Resource Centre' }).className).toContain('bg-primary')
  })

  it('cards link to the detail page under /pramaan/resource-centre', () => {
    renderAt('/pramaan/resource-centre')
    expect(screen.getByRole('link', { name: /Test worksheet/ })).toHaveAttribute('href', '/pramaan/resource-centre/W1')
  })

  it('detail shows owner, video, linked extra info and chapters', () => {
    renderAt('/pramaan/resource-centre/W1')
    expect(screen.getByText('Owner A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play explanation video/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://example.org/more' })).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(screen.getByRole('button', { name: 'Grade 1: 2' }))
    expect(screen.getByText(/ch 2, ch 5/)).toBeInTheDocument()
    // Grades without chapters are not shown at all (no disabled tiles).
    for (const g of ['Foundational', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']) expect(screen.queryByRole('button', { name: new RegExp(`^${g}`) })).not.toBeInTheDocument()
  })

  it('unknown id shows not-found', () => {
    renderAt('/pramaan/resource-centre/NOPE')
    expect(screen.getByText(/No resource found with ID "NOPE"/)).toBeInTheDocument()
  })
})
