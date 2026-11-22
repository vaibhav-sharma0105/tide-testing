import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { groupPartners, filterGroups, priorityRank, matchesPartner, partnerInitials, partnerTier, websiteLabel } from '../../utils/partnerFilters'
import { PRIORITY_ORDER } from '../../config/partners'
import data from '../../data/about-our-partners.json'

vi.setConfig({ testTimeout: 15000 })

// Test rows only (made up, not real Sheet data). The real snapshot is never written by tests.
const p = (id, type, priority, name, website = null) => ({ id, type, priority, name, website, photoUrl: null })
const ROWS = [
  p('PA-1', 'Others', 'High', 'Zeta School'),
  p('PA-2', 'Collaborators', 'Low', 'Alpha Trust', 'https://example.org/alpha'),
  p('PA-3', 'Collaborators', 'Extremely high', 'Omega Foundation'),
  p('PA-4', 'Collaborators', 'High', 'Beta Society'),
  p('PA-5', 'Beneficiaries', 'Mediun', 'Early School'),
  p('PA-6', 'Beneficiaries', 'Medium', 'Late School'),
  p('PA-7', 'beneficiaries ', 'High', 'Café Académie'),
]
const snap = (resources) => ({ schemaVersion: 1, section: 'partners', success: true, lastUpdated: null, contentHash: 'x', meta: { total: resources.length }, resources })

function LocationProbe() {
  const { search } = useLocation()
  return <span data-testid="search">{search}</span>
}

async function renderAt(path, resources = ROWS) {
  vi.resetModules()
  vi.doMock('../../data/sheets/partners.json', () => ({ default: snap(resources) }))
  const { default: OurPartners } = await import('../../pages/about/OurPartners')
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/about/our-partners" element={<><OurPartners /><LocationProbe /></>} /></Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

afterEach(() => { vi.useRealTimers(); vi.doUnmock('../../data/sheets/partners.json') })

describe('partnerFilters', () => {
  it('ranks priorities highest first, unknown/empty last', () => {
    expect(PRIORITY_ORDER.map(priorityRank)).toEqual([0, 1, 2, 3])
    expect(priorityRank(' extremely HIGH')).toBe(0)
    expect(priorityRank('Mediun')).toBe(4)
    expect(priorityRank(null)).toBe(4)
  })

  it('groups by type (capitals/spaces ignored), A→Z with Others last, partners by priority then name', () => {
    const groups = groupPartners(ROWS)
    expect(groups.map(g => g.label)).toEqual(['Beneficiaries', 'Collaborators', 'Others'])
    expect(groups[0].partners.map(x => x.name)).toEqual(['Café Académie', 'Late School', 'Early School'])
    expect(groups[1].partners.map(x => x.name)).toEqual(['Omega Foundation', 'Beta Society', 'Alpha Trust'])
  })

  it('searches names by every word, ignoring case and accents, and drops empty sections', () => {
    expect(matchesPartner({ name: 'Café Académie' }, 'cafe acad')).toBe(true)
    expect(matchesPartner({ name: 'Café Académie' }, 'cafe trust')).toBe(false)
    expect(filterGroups(groupPartners(ROWS), 'school').map(g => g.label)).toEqual(['Beneficiaries', 'Others'])
    expect(filterGroups(groupPartners(ROWS), '  ')).toHaveLength(3)
  })

  it('gives the top two priorities more visual weight (never a label) and shows a website as its domain', () => {
    expect(['Extremely high', ' HIGH', 'Medium', 'Low', 'Mediun', null].map(partnerTier)).toEqual(['feature', 'high', '', '', '', ''])
    expect(websiteLabel('https://www.cam.ac.uk/research?x=1')).toBe('cam.ac.uk')
    expect(websiteLabel('http://example.org')).toBe('example.org')
    expect(websiteLabel('javascript:alert(1)')).toBe('')
    expect(websiteLabel('not a link')).toBe('')
  })

  it('makes one or two initials for partners without a usable logo', () => {
    expect(partnerInitials('Ahmedabad University')).toBe('AU')
    expect(partnerInitials('Society for the Deaf')).toBe('SD')
    expect(partnerInitials('The Mind & Life Institute')).toBe('ML')
    expect(partnerInitials('einfochips')).toBe('E')
    expect(partnerInitials("St. Xavier's School")).toBe('SX')
    expect(partnerInitials('https://www.example.edu.in/')).toBe('E')
    expect(partnerInitials('  ')).toBe('')
    expect(partnerInitials(null)).toBe('')
  })
})

describe('OurPartners page', () => {
  it('shows one section per type in order, with counts, and links names that have a website', async () => {
    await renderAt('/about/our-partners')
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent).slice(0, 3)).toEqual(['Beneficiaries', 'Collaborators', 'Others'])
    const stats = data.meta.stats
    const hero = screen.getByRole('heading', { level: 1 }).parentElement
    expect(hero.textContent).toContain(stats.partners.replace('{n}', '7'))
    expect(hero.textContent).toContain(stats.groups.replace('{n}', '3'))
    const jump = screen.getByRole('navigation', { name: data.directory.jumpLabel })
    expect(within(jump).getAllByRole('link').map(a => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Beneficiaries3', '#partners-section-0'], ['Collaborators3', '#partners-section-1'], ['Others1', '#partners-section-2'],
    ])
    // Exactly one tab marks the section being read (which one depends on layout; jsdom has none).
    expect(within(jump).getAllByRole('link').filter(a => a.getAttribute('aria-current') === 'location')).toHaveLength(1)
    const collab = screen.getByRole('region', { name: 'Collaborators' })
    expect(within(collab).getByText(data.directory.sectionCount.replace('{count}', '3'))).toBeTruthy()
    const link = within(collab).getByRole('link', { name: new RegExp(`Alpha Trust.*${data.directory.opensInNewTab.replace(/[()]/g, '\\$&')}`) })
    expect(link.getAttribute('href')).toBe('https://example.org/alpha')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.textContent).toContain('example.org') // the website's domain under the name
    // Rows start paused: motion is the visitor's choice.
    for (const b of screen.queryAllByRole('button', { name: /^(Pause|Play) the / })) expect(b.getAttribute('aria-label')).toMatch(/^Play the /)
    expect(within(collab).queryAllByRole('link')).toHaveLength(1)
  })

  it('shows the matches of the search in the address as one grid, each card naming its section', async () => {
    await renderAt('/about/our-partners?search=school')
    const line = data.directory.resultCount.replace('{count}', '3').replace('{total}', '7')
    expect(screen.getByRole('status').textContent).toBe(line)
    expect(screen.queryByRole('region', { name: 'Beneficiaries' })).toBeNull() // no sliders while searching
    const items = within(screen.getByRole('list', { name: line })).getAllByRole('listitem')
    expect(items.map(li => li.querySelector('figcaption').textContent)).toEqual(['Late SchoolBeneficiaries', 'Early SchoolBeneficiaries', 'Zeta SchoolOthers'])
    expect(screen.queryByRole('navigation', { name: data.directory.jumpLabel })).toBeNull()
  })

  it('ends with the invitation band linking to pages on this site', async () => {
    await renderAt('/about/our-partners')
    expect(screen.getByRole('heading', { level: 2, name: data.cta.title })).toBeTruthy()
    expect(screen.getByRole('link', { name: data.cta.primary.label }).getAttribute('href')).toBe(data.cta.primary.to)
    expect(screen.getByRole('link', { name: data.cta.secondary.label }).getAttribute('href')).toBe(data.cta.secondary.to)
  })

  it('writes the typed search to the address and clears it again', async () => {
    vi.useFakeTimers()
    await renderAt('/about/our-partners')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing-like-this' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByTestId('search').textContent).toBe('?search=nothing-like-this')
    expect(screen.getByText(data.directory.noMatch.replace('{query}', 'nothing-like-this'))).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: data.directory.noMatchClear }).at(-1))
    expect(document.activeElement).toBe(screen.getByRole("searchbox")) // focus is not lost with the button
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByTestId('search').textContent).toBe('')
    expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByRole('region', { name: 'Others' })).toBeTruthy()
  })

  it('shows the "being updated" text when nothing has been published', async () => {
    await renderAt('/about/our-partners', [])
    expect(screen.getByText(data.directory.empty)).toBeTruthy()
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).parentElement.querySelector('ul')).toBeNull() // no figures for 0
  })
})
