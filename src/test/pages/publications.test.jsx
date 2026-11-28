import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import {
  applyPublicationFilters, facetPublicationOptions, formatPublicationDate, safeLink,
  groupByYear, publicationStats, latestOfType, yearOf, comparePublications, reportPeriod, formatPeriod,
  paginate, pageWindow, parsePublicationParams, publicationParamsToSearch, yearCounts, sourceOf, sourceName,
  countOfTypes, isNew, typeIconKey, highlightParts, searchTerms, publicationsJsonLd,
} from '../../utils/publicationFilters'
import {
  THRIVE_PAGE_SIZE, TIDE_PAGE_SIZE, NEW_BADGE_DAYS,
} from '../../config/publications'

// Each page test resets modules and imports both pages fresh (to mock the snapshot); a cold import
// can pass Vitest's 5s default on a busy machine (seen 2026-11-21), so this file allows 15s.

// Test rows only (made up, not real Sheet data). The real snapshot is never written by tests.
const TEACHER_FIELD = 'Teacher agency, wellbeing, motivation, and professional development'
const row = (o) => ({ fields: [], description: null, citation: null, link: null, photoUrl: null, ...o })
const TIDE_ROWS = [
  row({ id: 'T-ar25', org: 'TIDE', date: '2025-09-29', title: 'Annual Report 2024-2025', type: 'Annual report', description: 'Latest year', link: 'https://example.org/ar25' }),
  row({ id: 'T-pr', org: 'TIDE', date: '2025-03-01', title: 'Field project report', type: 'Project report', link: 'https://drive.google.com/drive/folders/abc' }),
  row({ id: 'T-ar23', org: 'TIDE', date: '2023-09-29', title: 'Annual Report 2022-2023', type: 'annual report ', link: 'https://example.org/ar23' }),
  row({ id: 'T-ar24', org: 'TIDE', date: '2024-09-29', title: 'Annual Report 2023-2024', type: 'Annual report', link: null }),
  row({ id: 'T-p1', org: 'TIDE', date: '2022-01-07', title: 'Harmony talk', type: 'Presentation', link: 'https://example.org/p1' }),
  row({ id: 'T-p2', org: 'TIDE', date: '2019-01-24', title: 'Why I do', type: 'Presentation', link: null }),
]
const THRIVE_ROWS = [
  row({ id: 'H-a', org: 'THRIvE', date: '2025-02-02', title: 'Assessment brief', type: 'Journal article', fields: ['Assessment'],
    description: 'Short brief', citation: 'Roe, R. (2025). Assessment brief.', link: 'https://example.org/a' }),
  row({ id: 'H-b', org: 'THRIvE', date: '2025-06-01', title: 'Second brief', type: 'Book', fields: ['Holistic Education'],
    citation: 'Poe, P. (2025). Second brief.', link: 'https://doi.org/10.1/b' }),
  row({ id: 'H-c', org: 'THRIvE', date: '2023-03-01', title: 'Teacher study', type: 'Journal article', fields: [TEACHER_FIELD, 'Assessment'],
    description: 'About teachers', citation: 'Doe, J. (2023). Teacher study. Journal of Tests.', link: null }),
  row({ id: 'H-d', org: 'THRIvE', date: '2021-07-07', title: 'Other work', type: 'Blog', fields: ['Other', 'Curriculum'], link: 'https://example.org/d' }),
  row({ id: 'H-e', org: 'THRIvE', date: null, title: 'Undated note', type: 'Blog', fields: [] }),
]
const snap = (resources) => ({
  schemaVersion: 1, section: 'publications', success: true, lastUpdated: '2026-11-20T00:00:00.000Z', contentHash: 'x',
  meta: { total: resources.length }, resources,
})
const FIXTURE = snap([...TIDE_ROWS, ...THRIVE_ROWS])
// n THRIvE rows, 5 per year from 2040 down (so years run over page boundaries).
const manyThrive = (n) => Array.from({ length: n }, (_, i) => row({
  id: `M-${i}`, org: 'THRIvE', date: `${2040 - Math.floor(i / 5)}-01-0${5 - (i % 5)}`, title: `Paper ${String(i).padStart(2, '0')}`, type: 'Journal article',
}))

function LocationProbe() {
  return <output data-testid="search">{useLocation().search}</output>
}

async function renderAt(path, fixture = FIXTURE) {
  vi.resetModules()
  vi.doMock('../../data/sheets/publications.json', () => ({ default: fixture }))
  const { default: TidePublications } = await import('../../pages/publications/TidePublications')
  const { default: ThrivePublications } = await import('../../pages/publications/ThrivePublications')
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tide/publications" element={<TidePublications />} />
          <Route path="/thrive/publications" element={<ThrivePublications />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </HelmetProvider>,
  )
}

const titles = (root = document.body) => within(root).queryAllByRole('article').map(a => within(a).getByRole('heading', { level: 3 }).textContent.replace(' (opens in a new tab)', ''))
const search = () => screen.getByTestId('search').textContent
const years = () => screen.queryAllByRole('heading', { level: 2 }).map(h => h.textContent)
// The filter menus (FilterMenu): a button labelled by the visible label + the current value,
// opening a listbox whose options are "name" + right-aligned count.
const filterButton = (label) => screen.getAllByRole('button').find(b =>
  b.getAttribute('aria-haspopup') === 'listbox' && document.getElementById(b.getAttribute('aria-labelledby').split(' ')[0])?.textContent === label)
const openMenu = (label) => { fireEvent.click(filterButton(label)); return screen.getByRole('listbox', { name: label }) }
const optionCells = (o) => [o.children[1].textContent, o.children[2].textContent]
const menuOptions = (label) => {
  const list = openMenu(label)
  const out = within(list).getAllByRole('option').map(o => { const [name, n] = optionCells(o); return `${name} (${n})` })
  fireEvent.keyDown(list, { key: 'Escape' })
  return out
}
const menuDisabled = (label) => {
  const list = openMenu(label)
  const out = within(list).getAllByRole('option').map(o => o.getAttribute('aria-disabled') === 'true')
  fireEvent.keyDown(list, { key: 'Escape' })
  return out
}
const choose = (label, name) => {
  const list = openMenu(label)
  fireEvent.click(within(list).getAllByRole('option').find(o => optionCells(o)[0] === name))
}
const menuValue = (label) => filterButton(label).querySelector('[id$="-value"]').textContent

afterEach(() => {
  vi.doUnmock('../../data/sheets/publications.json')
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('TIDE publications (spotlight + one library)', () => {
  const library = () => screen.getAllByRole('region', { name: 'All publications' }).at(-1)

  it('spotlights the latest annual report (no source line), with stats in the hero and no chart', async () => {
    await renderAt('/tide/publications')
    const featured = screen.getByRole('region', { name: 'Annual Report 2024-2025' })
    expect(within(featured).getByText('Latest edition')).toBeInTheDocument()
    const read = within(featured).getByRole('link', { name: 'Read report: Annual Report 2024-2025 (opens in a new tab)' })
    expect(read).toHaveAttribute('href', 'https://example.org/ar25')
    expect(read).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(featured).getByText('29 September 2025').tagName).toBe('TIME')
    expect(featured).not.toHaveTextContent('Source')
    // 6 rows, 3 types (case/space variants of "Annual report" are one), earliest 2019.
    const hero = screen.getByRole('heading', { level: 1 }).parentElement
    expect(within(hero).getAllByRole('listitem').map(li => li.textContent)).toEqual(['6 publications', '3 types', 'since 2019'])
    expect(screen.queryByText('Publications per year')).not.toBeInTheDocument()
  })

  it('the library lists EVERY TIDE row (annual reports included) as cards, newest first, with search + Type + Year', async () => {
    await renderAt('/tide/publications')
    expect(titles(library())).toEqual([
      'Annual Report 2024-2025', 'Field project report', 'Annual Report 2023-2024', 'Annual Report 2022-2023', 'Harmony talk', 'Why I do',
    ])
    expect(within(library()).getByText('6 publications')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('searchbox', { name: 'Search TIDE publications' })).toBeInTheDocument()
    expect(filterButton('Type of material')).toBeTruthy()
    expect(filterButton('Year')).toBeTruthy()
    expect(filterButton('Field of work')).toBeUndefined()
    expect(library()).not.toHaveTextContent('Source')
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()
  })

  it('filters narrow the library only — the spotlight stays — and are kept in the URL', async () => {
    await renderAt('/tide/publications')
    expect(menuOptions('Type of material')).toEqual(['All types (6)', 'Annual report (3)', 'Presentation (2)', 'Project report (1)'])
    choose('Type of material', 'Presentation')
    expect(search()).toBe('?type=presentation')
    expect(titles(library())).toEqual(['Harmony talk', 'Why I do'])
    expect(screen.getByRole('region', { name: 'Annual Report 2024-2025' })).toBeInTheDocument()
    const why = screen.getAllByRole('article').find(a => within(a).queryByText('Why I do'))
    expect(within(why).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open: Harmony talk (opens in a new tab)' })).toHaveAttribute('href', 'https://example.org/p1')
    choose('Type of material', 'Annual report')
    choose('Year', '2023')
    expect(search()).toBe('?type=annual+report&year=2023')
    expect(titles(library())).toEqual(['Annual Report 2022-2023'])
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(search()).toBe('')
    expect(titles(library())).toHaveLength(6)
  })

  it('"See all {n} editions" filters the library to the featured type and moves focus to its results line', async () => {
    await renderAt('/tide/publications?year=2019')
    fireEvent.click(screen.getByRole('button', { name: 'See all 3 editions' }))
    expect(search()).toBe('?type=annual+report')
    expect(titles(library())).toEqual(['Annual Report 2024-2025', 'Annual Report 2023-2024', 'Annual Report 2022-2023'])
    expect(document.activeElement).toBe(within(library()).getByText('3 publications'))
  })

  it('reads the filters from the URL; an unknown type shows as a removable chip with no results', async () => {
    await renderAt('/tide/publications?type=project%20report')
    expect(titles(library())).toEqual(['Field project report'])
    await renderAt('/tide/publications?type=nope')
    expect(within(library()).getByText('No publications match your search or filters')).toBeInTheDocument()
    fireEvent.click(within(library()).getByRole('button', { name: 'Remove filter: nope' }))
    expect(titles(library())).toHaveLength(6)
  })

  it(`numbered pages of ${TIDE_PAGE_SIZE}; a too-high page is clamped`, async () => {
    const talks = Array.from({ length: TIDE_PAGE_SIZE + 2 }, (_, i) => row({
      id: `TK-${i}`, org: 'TIDE', date: `2020-01-${String(i + 1).padStart(2, '0')}`, title: `Talk ${i}`, type: 'Presentation',
    }))
    await renderAt('/tide/publications?page=9', snap(talks))
    expect(titles(library())).toHaveLength(2)
    expect(within(library()).getByText(`Showing ${TIDE_PAGE_SIZE + 1}–${TIDE_PAGE_SIZE + 2} of ${TIDE_PAGE_SIZE + 2} publications`)).toBeInTheDocument()
    const nav = within(library()).getByRole('navigation', { name: 'Pages' })
    fireEvent.click(within(nav).getByRole('link', { name: 'Page 1' }))
    expect(titles(library())).toHaveLength(TIDE_PAGE_SIZE)
    expect(search()).toBe('')
  })

  it('search (debounced) highlights matches in the library', async () => {
    await renderAt('/tide/publications')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search TIDE publications' }), { target: { value: 'harmony' } })
    await waitFor(() => expect(search()).toBe('?search=harmony'))
    expect(titles(library())).toEqual(['Harmony talk'])
    expect(within(library()).getByText('Harmony').tagName).toBe('MARK')
    expect(within(library()).getByText('1 publication')).toBeInTheDocument()
  })

  it('without a row of the featured type there is no spotlight, only the library', async () => {
    await renderAt('/tide/publications', snap(TIDE_ROWS.filter(r => r.type === 'Presentation')))
    expect(screen.queryByText('Latest edition')).not.toBeInTheDocument()
    expect(titles(library())).toEqual(['Harmony talk', 'Why I do'])
  })

  it('a single edition gets no "See all" button', async () => {
    await renderAt('/tide/publications', snap(TIDE_ROWS.filter(r => r.id !== 'T-ar23' && r.id !== 'T-ar24')))
    expect(screen.getByText('Latest edition')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^See all/ })).not.toBeInTheDocument()
  })

  it('the old address /about/publications forwards to /tide/publications with its filters', async () => {
    vi.resetModules()
    vi.doMock('../../data/sheets/publications.json', () => ({ default: FIXTURE }))
    const { default: TidePublications } = await import('../../pages/publications/TidePublications')
    const { default: Redirect } = await import('../../pages/publications/TidePublicationsRedirect')
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/about/publications?type=presentation']}>
          <Routes>
            <Route path="/about/publications" element={<Redirect />} />
            <Route path="/tide/publications" element={<TidePublications />} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </HelmetProvider>,
    )
    expect(search()).toBe('?type=presentation')
    expect(titles(library())).toEqual(['Harmony talk', 'Why I do'])
  })

  it('shows the empty state when there is no TIDE row', async () => {
    await renderAt('/tide/publications', snap(THRIVE_ROWS))
    expect(screen.getByText('No publications published yet')).toBeInTheDocument()
    expect(screen.getByText('Publications appear here as soon as they are added.')).toBeInTheDocument()
  })

  it('"New" badge for rows dated within the window (fixed clock)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-10-10T12:00:00Z'))
    await renderAt('/tide/publications')
    const featured = screen.getByRole('region', { name: 'Annual Report 2024-2025' })
    expect(within(featured).getByText('New')).toBeInTheDocument()
    // The spotlight and the same report's card in the library.
    expect(screen.getAllByText('New')).toHaveLength(2)
  })
})

describe('THRIvE publications (research archive)', () => {
  it('groups entries under year headings, newest first, undated last; only THRIvE rows', async () => {
    await renderAt('/thrive/publications')
    expect(years()).toEqual(['2025', '2023', '2021', 'Undated'])
    expect(titles()).toEqual(['Second brief', 'Assessment brief', 'Teacher study', 'Other work', 'Undated note'])
    expect(screen.queryByText('Harmony talk')).not.toBeInTheDocument()
    expect(screen.getByText('5 publications')).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()
  })

  it('same date: title A→Z', async () => {
    const same = [
      row({ id: 'S1', org: 'THRIvE', date: '2024-05-05', title: 'Zeta', type: 'Book' }),
      row({ id: 'S2', org: 'THRIvE', date: '2024-05-05', title: 'alpha', type: 'Book' }),
      row({ id: 'S3', org: 'THRIvE', date: '2024-05-05', title: 'Beta', type: 'Book' }),
    ]
    await renderAt('/thrive/publications', snap(same))
    expect(titles()).toEqual(['alpha', 'Beta', 'Zeta'])
  })

  it('hero: no per-year chart (config HERO_CHART off); social proof only when counted', async () => {
    await renderAt('/thrive/publications')
    expect(screen.queryByText('Publications per year')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show only this year$/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/pieces? by others/)).not.toBeInTheDocument()
  })

  it('hero figures: count and first year only — no types figure, no social-proof line (taken off 2026-11-28)', async () => {
    const others = [
      row({ id: 'O1', org: 'THRIvE', date: '2024-01-01', title: 'Cited us', type: 'Published by others (TIDE acknowledged)' }),
      row({ id: 'O2', org: 'THRIvE', date: '2024-01-02', title: 'News', type: 'mass media coverage' }),
    ]
    await renderAt('/thrive/publications', snap([...THRIVE_ROWS, ...others]))
    const hero = screen.getByRole('heading', { level: 1 }).closest('section')
    expect(within(hero).getAllByRole('listitem').map(li => li.textContent)).toEqual(['7 publications', 'since 2021'])
    expect(screen.queryByText(/pieces? by others/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+ types?$/)).not.toBeInTheDocument()
  })

  it('Type and Field are multi-select: options toggle with checkboxes, values widen within a menu and narrow across', async () => {
    await renderAt('/thrive/publications')
    const list = openMenu('Type of material')
    expect(list).toHaveAttribute('aria-multiselectable', 'true')
    expect(within(list).getByText('Choose one or more')).toBeInTheDocument()
    const opt = (name) => within(screen.getByRole('listbox', { name: 'Type of material' })).getAllByRole('option').find(o => optionCells(o)[0] === name)
    fireEvent.click(opt('Book'))
    // The list stays open for the next choice.
    fireEvent.click(opt('Blog'))
    expect(search()).toBe('?type=book&type=blog')
    expect(titles()).toEqual(['Second brief', 'Other work', 'Undated note'])
    expect(opt('Book')).toHaveAttribute('aria-selected', 'true')
    expect(menuValue('Type of material')).toBe('2 selected')
    fireEvent.click(opt('Book')) // toggles off
    expect(search()).toBe('?type=blog')
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Type of material' }), { key: 'Escape' })
    choose('Field of work', 'Curriculum')
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Field of work' })).getAllByRole('option').find(o => optionCells(o)[0] === 'Other'))
    expect(search()).toBe('?type=blog&field=curriculum&field=other')
    expect(titles()).toEqual(['Other work'])
    // One chip per value; removing one keeps the rest.
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Curriculum' }))
    expect(search()).toBe('?type=blog&field=other')
    expect(titles()).toEqual(['Other work'])
    // "All types" clears that menu's choices.
    choose('Type of material', 'All types')
    expect(search()).toBe('?field=other')
  })

  it('date toggle: oldest first keeps undated last and is kept in the URL', async () => {
    await renderAt('/thrive/publications')
    fireEvent.click(screen.getByRole('button', { name: /Order by date: Newest first/ }))
    expect(years()).toEqual(['2021', '2023', '2025', 'Undated'])
    expect(titles()).toEqual(['Other work', 'Teacher study', 'Assessment brief', 'Second brief', 'Undated note'])
    expect(search()).toBe('?dir=asc')
  })

  it('search (debounced) covers title, citation, description, type and fields; highlights; no-match; Clear all', async () => {
    await renderAt('/thrive/publications')
    const box = screen.getByRole('searchbox', { name: 'Search publications' })
    expect(box).toHaveAttribute('aria-keyshortcuts', '/')
    fireEvent.change(box, { target: { value: 'doe, j.' } })
    await waitFor(() => expect(titles()).toEqual(['Teacher study']))
    expect([...document.querySelectorAll('mark')].map(m => m.textContent)).toEqual(['Doe, J.'])
    fireEvent.change(box, { target: { value: 'curriculum' } })
    await waitFor(() => expect(titles()).toEqual(['Other work']))
    fireEvent.change(box, { target: { value: 'book' } })
    await waitFor(() => expect(titles()).toEqual(['Second brief']))
    expect(search()).toBe('?search=book')
    fireEvent.change(box, { target: { value: 'zzz-nothing' } })
    await waitFor(() => expect(titles()).toEqual([]))
    expect(screen.getByText('No publications match your search or filters')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(titles()).toHaveLength(5)
    expect(search()).toBe('')
    expect(box).toHaveValue('')
  })

  it('"/" focuses the search box', async () => {
    await renderAt('/thrive/publications')
    fireEvent.keyDown(document.body, { key: '/' })
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search publications' }))
  })

  it('type / field / year menus: visible labels, counts right of names, zero-count options disabled', async () => {
    await renderAt('/thrive/publications')
    for (const label of ['Type of material', 'Field of work', 'Year']) expect(filterButton(label)).toHaveAttribute('aria-expanded', 'false')
    expect(menuValue('Year')).toBe('All years')
    expect(menuOptions('Type of material')).toEqual(['All types (5)', 'Blog (2)', 'Book (1)', 'Journal article (2)'])
    expect(menuOptions('Field of work')).toEqual([
      'All fields (5)', 'Assessment (2)', 'Curriculum (1)', 'Holistic Education (1)', `${TEACHER_FIELD} (1)`, 'Other (1)',
    ])
    expect(menuOptions('Year')).toEqual(['All years (5)', '2025 (2)', '2023 (1)', '2021 (1)', 'Undated (1)'])
    choose('Field of work', 'Assessment')
    expect(titles()).toEqual(['Assessment brief', 'Teacher study'])
    expect(menuOptions('Type of material')).toEqual(['All types (2)', 'Blog (0)', 'Book (0)', 'Journal article (2)'])
    expect(menuDisabled('Type of material')).toEqual([false, true, true, false])
    choose('Type of material', 'Blog') // disabled: nothing happens
    expect(search()).toBe('?field=assessment')
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Type of material' }), { key: 'Escape' })
    choose('Type of material', 'Journal article')
    choose('Year', '2023')
    expect(search()).toBe('?type=journal+article&field=assessment&year=2023')
    expect(titles()).toEqual(['Teacher study'])
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Assessment' }))
    expect(search()).toBe('?type=journal+article&year=2023')
  })

  it('URL values that no longer exist show as chips with (0) and clear easily; bad params are ignored', async () => {
    await renderAt('/thrive/publications?type=gone%20type&year=1999&foo=bar')
    expect(menuValue('Type of material')).toBe('gone type')
    expect(menuOptions('Type of material')).toContain('gone type (0)')
    expect(menuOptions('Year')).toContain('1999 (0)')
    expect(screen.getByRole('button', { name: 'Remove filter: gone type' })).toBeInTheDocument()
    expect(titles()).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(titles()).toHaveLength(5)
    await renderAt('/thrive/publications?year=abc&page=-3')
    expect(screen.getAllByText('5 publications').at(-1)).toBeInTheDocument()
  })

  it('reads search, field and direction from the URL', async () => {
    await renderAt('/thrive/publications?field=assessment&dir=asc')
    expect(titles()).toEqual(['Teacher study', 'Assessment brief'])
    expect(menuValue('Field of work')).toBe('Assessment')
  })

  it('summary under the title; "Show more" opens the APA citation; field tags; source; Read named by type, hidden without a link', async () => {
    const { container } = await renderAt('/thrive/publications')
    const card = screen.getAllByRole('article').find(a => within(a).queryByText('Teacher study'))
    const heading = within(card).getByRole('heading', { level: 3 })
    const summary = heading.nextElementSibling
    expect(within(summary).getByRole('heading', { level: 4 })).toHaveTextContent('About this work')
    expect(summary).toHaveTextContent('About teachers')
    // The citation waits behind "Show more" (in the page but inert), which opens it.
    const citation = summary.nextElementSibling
    expect(citation).toHaveAttribute('inert')
    expect(within(citation).getByRole('heading', { level: 4, hidden: true })).toHaveTextContent('APA reference')
    expect(within(citation).getByRole('blockquote', { hidden: true }).textContent).toBe('Citation: Doe, J. (2023). Teacher study. Journal of Tests.')
    const more = within(card).getByRole('button', { name: 'Show more' })
    expect(more.getAttribute('aria-controls').split(' ')).toContain(citation.id)
    fireEvent.click(more)
    expect(citation).not.toHaveAttribute('inert')
    expect(within(card).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
    expect(within(card).getByText(TEACHER_FIELD)).toBeInTheDocument()
    expect(within(card).queryByRole('link')).not.toBeInTheDocument()
    const linked = screen.getAllByRole('article').find(a => within(a).queryByText('Assessment brief'))
    // A journal article: the button says what you'll do ("Read article", YAML entry.actions).
    const read = within(linked).getByRole('link', { name: 'Read article: Assessment brief (opens in a new tab)' })
    expect(read).toHaveTextContent('Read article')
    expect(read).toHaveAttribute('href', 'https://example.org/a')
    expect(read).toHaveAttribute('target', '_blank')
    expect(read).toHaveAttribute('rel', 'noopener noreferrer')
    // Compact source: arrow (tooltip "Source") + the address; screen readers hear "Source: …".
    const src = within(linked).getByText('example.org').parentElement
    expect(src.querySelector('.sr-only')).toHaveTextContent('Source:')
    expect(src).toHaveTextContent('Source')
    const book = screen.getAllByRole('article').find(a => within(a).queryByText('Second brief'))
    expect(within(book).getByText((_, el) => el?.firstChild?.nodeValue === 'DOI')).toBeInTheDocument()
    const undated = screen.getAllByRole('article').find(a => within(a).queryByText('Undated note'))
    expect(within(undated).queryByRole('button', { name: /Copy citation/ })).not.toBeInTheDocument()
    expect(container.innerHTML).not.toContain('drive.google.com')
  })

  it('"Copy citation" copies the APA text and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await renderAt('/thrive/publications')
    const card = screen.getAllByRole('article').find(a => within(a).queryByText('Teacher study'))
    fireEvent.click(within(card).getByRole('button', { name: 'Show more' }))
    const btn = screen.getByRole('button', { name: 'Copy citation for Teacher study' })
    await act(async () => { fireEvent.click(btn) })
    expect(writeText).toHaveBeenCalledWith('Doe, J. (2023). Teacher study. Journal of Tests.')
    expect(btn).toHaveTextContent('Copied')
    expect(screen.getByText('Citation copied to the clipboard')).toHaveAttribute('aria-live', 'polite')
    delete navigator.clipboard
  })

  it('"Show more" appears when there is a citation or the summary overflows 3 lines', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
      return this.textContent === 'Other work summary' ? 200 : 0
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(72)
    const rows = THRIVE_ROWS.map(r => (r.id === 'H-d' ? { ...r, description: 'Other work summary' } : r))
    await renderAt('/thrive/publications', snap(rows))
    const withMore = screen.getAllByRole('article').filter(a => within(a).queryByRole('button', { name: 'Show more' }))
    // H-a, H-b, H-c have citations; H-d's summary is cut; H-e (no citation, no summary) has none.
    expect(withMore.map(a => within(a).getByRole('heading', { level: 3 }).textContent.replace(' (opens in a new tab)', '')))
      .toEqual(['Second brief', 'Assessment brief', 'Teacher study', 'Other work'])
    const other = withMore.at(-1)
    fireEvent.click(within(other).getByRole('button', { name: 'Show more' }))
    expect(within(other).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
    expect(within(other).getByText('Other work summary')).not.toHaveClass('line-clamp-3')
  })

  it('a search that matches only a citation opens that entry so the match shows', async () => {
    await renderAt('/thrive/publications?search=journal%20of%20tests')
    const card = screen.getAllByRole('article').find(a => within(a).queryByText('Teacher study'))
    expect(within(card).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  })

  it(`numbered pages of ${THRIVE_PAGE_SIZE}: page in the URL, "continued" year heading, focus to results`, async () => {
    await renderAt('/thrive/publications', snap(manyThrive(47)))
    expect(screen.getAllByRole('article')).toHaveLength(THRIVE_PAGE_SIZE)
    expect(screen.getByText('Showing 1–12 of 47 publications')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Pages' })
    expect(within(nav).getByText('Page 1').closest('[aria-current="page"]')).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /Previous/ })).not.toBeInTheDocument()
    fireEvent.click(within(nav).getByRole('link', { name: 'Page 2' }))
    expect(search()).toBe('?page=2')
    expect(screen.getByText('Showing 13–24 of 47 publications')).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByText('Showing 13–24 of 47 publications'))
    // Rows 10–14 are 2038; row 12 (index) starts page 2 still in 2038 → "continued".
    expect(years()[0]).toBe('2038(continued)')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Pages' })).getByRole('link', { name: 'Page 3' }))
    expect(screen.getAllByRole('article')).toHaveLength(12)
    expect(search()).toBe('?page=3')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Pages' })).getByRole('link', { name: 'Page 4' }))
    expect(screen.getAllByRole('article')).toHaveLength(11)
  })

  it('a page beyond the last is clamped; changing a filter returns to page 1', async () => {
    await renderAt('/thrive/publications?page=9', snap(manyThrive(27)))
    expect(screen.getByText('Showing 25–27 of 27 publications')).toBeInTheDocument()
    choose('Year', '2040')
    expect(search()).toBe('?year=2040')
    expect(screen.getByText('5 publications')).toBeInTheDocument()
  })

  it('shows the empty state when there is no THRIvE row', async () => {
    await renderAt('/thrive/publications', snap(TIDE_ROWS))
    expect(screen.getByText('No publications published yet')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})

describe('publication utilities', () => {
  const rows = THRIVE_ROWS
  it('orders by date, ties by title A→Z, undated always last in both directions', () => {
    expect(applyPublicationFilters(rows, { dir: 'desc' }).map(r => r.id)).toEqual(['H-b', 'H-a', 'H-c', 'H-d', 'H-e'])
    expect(applyPublicationFilters(rows, { dir: 'asc' }).map(r => r.id)).toEqual(['H-d', 'H-c', 'H-a', 'H-b', 'H-e'])
    const tie = [{ title: 'b', date: '2020-01-01' }, { title: 'A', date: '2020-01-01' }, { title: 'z' }, { title: 'c' }, { title: 'x', date: '2021-01-01' }]
    expect([...tie].sort(comparePublications('desc')).map(r => r.title)).toEqual(['x', 'A', 'b', 'c', 'z'])
    expect([...tie].sort(comparePublications('asc')).map(r => r.title)).toEqual(['A', 'b', 'x', 'c', 'z'])
  })

  it('reads a report period from the title, else the date year', () => {
    const p = (title, date = '2020-05-05') => formatPeriod(reportPeriod({ title, date }))
    expect(p('Annual Report 2025-2026')).toBe('2025–26')
    expect(p('Annual Report 2025 - 2026')).toBe('2025–26')
    expect(p('BETI year 24-25 report')).toBe('2024–25')
    expect(p('Annual Report 2014-2019')).toBe('2014–19')
    expect(p('Report 2024–25')).toBe('2024–25')
    expect(p('Annual Report 1999-2001')).toBe('1999–2001')
    expect(p('Annual report', '2023-09-29')).toBe('2023')
    expect(p('Report 2025-2019')).toBe('2020')
    // Page and day ranges are not years; a 4-digit start must be 19xx/20xx.
    expect(p('Annual report 2023 (pages 10-15)', '2023-09-29')).toBe('2023')
    expect(p('Workshop held 10-12 March', '2024-03-12')).toBe('2024')
    expect(p('Report 1850-1852')).toBe('2020')
    expect(reportPeriod({ title: 'No period', date: null })).toBeNull()
    expect(formatPeriod(null)).toBeNull()
  })

  it('latest of a type: by the period in the title (not the date), then date', () => {
    const rows = [
      ...TIDE_ROWS,
      row({ id: 'T-beti', org: 'TIDE', date: '2025-05-31', title: 'BETI year 24-25 report', type: 'Annual report' }),
      row({ id: 'T-ar26', org: 'TIDE', date: '2025-01-01', title: 'Annual Report 2025-2026', type: 'Annual report' }),
    ]
    expect(latestOfType(rows, 'Annual Report').id).toBe('T-ar26')
    expect(latestOfType(TIDE_ROWS, ' annual  report ').id).toBe('T-ar25')
    expect(latestOfType(TIDE_ROWS, 'Nothing')).toBeNull()
    // A title without a period counts by the year of its date of publication.
    const untitled = (id, date) => row({ id, org: 'TIDE', date, title: 'Annual Report', type: 'Annual report' })
    expect(latestOfType([...rows, untitled('U-27', '2027-03-01')], 'Annual report').id).toBe('U-27')
    expect(latestOfType([...rows, untitled('U-25', '2025-03-01')], 'Annual report').id).toBe('T-ar26')
    // Same year as the titled one's end: the newer date wins.
    expect(latestOfType([...rows, untitled('U-26', '2026-10-01')], 'Annual report').id).toBe('U-26')
    expect(latestOfType(TIDE_ROWS, '')).toBeNull()
  })

  it('groups by year, marking a year continued from the previous page; stats; yearOf', () => {
    const ordered = applyPublicationFilters(rows, { dir: 'desc' })
    const g = groupByYear(ordered)
    expect(g.map(x => [x.year, x.rows.length, x.continued])).toEqual([[2025, 2, false], [2023, 1, false], [2021, 1, false], [null, 1, false]])
    expect(groupByYear(ordered.slice(1), ordered[0])[0]).toMatchObject({ year: 2025, continued: true })
    expect(groupByYear(ordered.slice(2), ordered[1])[0].continued).toBe(false)
    expect(publicationStats(rows)).toEqual({ count: 5, types: 3, firstYear: 2021 })
    expect(publicationStats([])).toEqual({ count: 0, types: 0, firstYear: null })
    expect(yearOf('2024-01-02')).toBe(2024)
    expect(yearOf(null)).toBeNull()
  })

  it('year filter and per-year counts (gaps as 0, undated left out)', () => {
    expect(applyPublicationFilters(rows, { year: '2025' }).map(r => r.id)).toEqual(['H-b', 'H-a'])
    expect(applyPublicationFilters(rows, { year: 'undated' }).map(r => r.id)).toEqual(['H-e'])
    expect(yearCounts(rows)).toEqual([
      { year: 2021, count: 1 }, { year: 2022, count: 0 }, { year: 2023, count: 1 }, { year: 2024, count: 0 }, { year: 2025, count: 2 },
    ])
    expect(yearCounts([])).toEqual([])
  })

  it('facets: all values listed with faceted counts; a removed chosen value kept with 0', () => {
    const o = facetPublicationOptions(rows, { type: 'book', field: 'curriculum' })
    expect(o.fields.find(f => f.value === 'curriculum').count).toBe(0)
    expect(o.types.find(t => t.value === 'book').count).toBe(0)
    expect(o.types.map(t => t.value)).toEqual(['blog', 'book', 'journal article'])
    const gone = facetPublicationOptions(rows, { type: 'poem', year: '1999' })
    expect(gone.types.at(-1)).toEqual({ value: 'poem', label: 'poem', count: 0, missing: true })
    expect(gone.years.at(-1)).toMatchObject({ value: '1999', count: 0 })
    expect(gone.totals.type).toBe(0)
  })

  it('URL params: robust parsing and a minimal round trip', () => {
    expect(parsePublicationParams('?type=Journal%20Article&year=2024&page=2&dir=asc&x=1')).toEqual({
      search: '', type: ['journal article'], field: [], year: '2024', dir: 'asc', page: 2,
    })
    // Several values: repeated params, normalised, duplicates dropped; written back the same way.
    const many = parsePublicationParams('?type=Book&type=blog&type=BOOK&field=Assessment')
    expect(many).toMatchObject({ type: ['book', 'blog'], field: ['assessment'] })
    expect(publicationParamsToSearch(many)).toBe('?type=book&type=blog&field=assessment')
    expect(parsePublicationParams('?year=24&page=abc')).toMatchObject({ year: '', page: 1 })
    expect(parsePublicationParams('?page=0').page).toBe(1)
    expect(parsePublicationParams('?year=undated').year).toBe('undated')
    expect(publicationParamsToSearch({ search: 'a b', type: '', year: '2024', dir: 'desc', page: 1 })).toBe('?search=a+b&year=2024')
    expect(publicationParamsToSearch({ dir: 'desc', page: 1 })).toBe('')
  })

  it('paginate clamps the page; pageWindow shows first, last and neighbours', () => {
    const items = Array.from({ length: 47 }, (_, i) => i)
    expect(paginate(items, 3, 20)).toMatchObject({ page: 3, totalPages: 3, from: 41, to: 47 })
    expect(paginate(items, 99, 20).page).toBe(3)
    expect(paginate(items, -1, 20)).toMatchObject({ page: 1, from: 1, to: 20 })
    expect(paginate([], 2, 20)).toMatchObject({ page: 1, totalPages: 1, from: 0, to: 0 })
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5, '…', 10])
    expect(pageWindow(6, 10)).toEqual([1, '…', 5, 6, 7, '…', 10])
    expect(pageWindow(10, 10)).toEqual([1, '…', 6, 7, 8, 9, 10])
  })

  it('source of a link, from the URL only', () => {
    expect(sourceOf('https://doi.org/10.1080/x')).toEqual({ kind: 'doi' })
    expect(sourceOf('https://www.doi.org/10.1080/x')).toEqual({ kind: 'doi' })
    expect(sourceOf('https://www.tandfonline.com/doi/full/1')).toEqual({ kind: 'host', host: 'tandfonline.com' })
    expect(sourceOf('https://drive.google.com/file/d/abc/view')).toEqual({ kind: 'driveFile' })
    expect(sourceOf('https://drive.google.com/drive/folders/abc')).toEqual({ kind: 'driveFolder' })
    expect(sourceOf('javascript:alert(1)')).toBeNull()
    expect(sourceOf(null)).toBeNull()
  })

  it('source name: listed address or its closest listed parent, else the address itself', () => {
    const names = { 'cam.ac.uk': 'University of Cambridge', 'news.educ.cam.ac.uk': 'Faculty of Education', 'osf.io': 'OSF', 'blank.org': ' ' }
    expect(sourceName('osf.io', names)).toBe('OSF')
    expect(sourceName('news.educ.cam.ac.uk', names)).toBe('Faculty of Education')
    expect(sourceName('www2.cam.ac.uk', names)).toBe('University of Cambridge')
    expect(sourceName('ac.uk', names)).toBe('ac.uk')
    expect(sourceName('example.org', names)).toBe('example.org')
    expect(sourceName('blank.org', names)).toBe('blank.org')
    expect(sourceName('osf.io', undefined)).toBe('osf.io')
  })

  it('social-proof count, New window, icon families', () => {
    const list = [{ type: 'Published by others (TIDE acknowledged)' }, { type: ' mass media  coverage' }, { type: 'Book' }]
    expect(countOfTypes(list, ['Published by others (TIDE acknowledged)', 'Mass media coverage'])).toBe(2)
    expect(countOfTypes(list, [])).toBe(0)
    const now = new Date(2026, 10, 20)
    expect(isNew('2026-11-20', now, NEW_BADGE_DAYS)).toBe(true)
    expect(isNew('2026-07-23', now, 120)).toBe(true)
    expect(isNew('2026-07-22', now, 120)).toBe(false)
    expect(isNew('2026-12-01', now, 120)).toBe(false)
    expect(isNew(null, now, 120)).toBe(false)
    expect(['Journal article', 'Book', 'Textbook chapter', 'Talk / Conference slides', 'Poster presentation', 'Series of public talks',
      'Blog', 'Teacher magazine', 'Published by others (TIDE acknowledged)', 'Mass media coverage', 'Annual report', 'Something new'].map(t => typeIconKey(t)))
      .toEqual(['article', 'book', 'book', 'presentation', 'presentation', 'presentation', 'newspaper', 'newspaper', 'quote', 'megaphone', 'report', 'file'])
  })

  it('search terms and highlight parts', () => {
    expect(searchTerms('  Doe,   J. ')).toEqual(['doe,', 'j.'])
    expect(highlightParts('Teacher study of teachers', ['teacher'])).toEqual([
      { text: 'Teacher', match: true }, { text: ' study of ', match: false }, { text: 'teacher', match: true }, { text: 's', match: false },
    ])
    expect(highlightParts('a+b (c)', ['(c)'])).toEqual([{ text: 'a+b ', match: false }, { text: '(c)', match: true }])
    expect(highlightParts('plain', [])).toEqual([{ text: 'plain', match: false }])
    expect(highlightParts('Reimagining teacher agency in', ['teacher', 'agency'])).toEqual([
      { text: 'Reimagining ', match: false }, { text: 'teacher agency', match: true }, { text: ' in', match: false },
    ])
  })

  it('JSON-LD ItemList: facts only', () => {
    const ld = publicationsJsonLd(applyPublicationFilters(rows, {}), { name: 'X', url: 'https://example.org/p' })
    expect(ld['@type']).toBe('ItemList')
    expect(ld.numberOfItems).toBe(5)
    expect(ld.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, item: { '@type': 'Book', name: 'Second brief', datePublished: '2025-06-01', url: 'https://doi.org/10.1/b' } })
    expect(ld.itemListElement[2].item).toEqual({ '@type': 'ScholarlyArticle', name: 'Teacher study', datePublished: '2023-03-01' })
    expect(ld.itemListElement[4].item).toEqual({ '@type': 'CreativeWork', name: 'Undated note' })
  })

  it('formats dates and accepts only http(s) links', () => {
    expect(formatPublicationDate('2024-03-05')).toBe('5 March 2024')
    expect(formatPublicationDate(null)).toBeNull()
    expect(safeLink('javascript:alert(1)')).toBeNull()
    expect(safeLink('https://example.org')).toBe('https://example.org')
  })
})

describe('publication controls and media (components)', () => {
  it('debounced search keeps characters typed while the URL catches up (no race)', async () => {
    vi.useFakeTimers()
    const { renderHook } = await import('@testing-library/react')
    const { useDebouncedSearch } = await import('../../hooks/usePublicationControls')
    const commit = vi.fn()
    const { result, rerender } = renderHook(({ url }) => useDebouncedSearch(url, commit, 150), { initialProps: { url: '' } })
    act(() => result.current[1]('ab'))
    act(() => { vi.advanceTimersByTime(150) })
    expect(commit).toHaveBeenLastCalledWith('ab')
    // The user types "c" before the URL shows "ab"; when it does, "abc" must survive.
    act(() => result.current[1]('abc'))
    rerender({ url: 'ab' })
    expect(result.current[0]).toBe('abc')
    act(() => { vi.advanceTimersByTime(150) })
    expect(commit).toHaveBeenLastCalledWith('abc')
    // A change from elsewhere (Clear all, a chip, Back) still updates the box.
    rerender({ url: '' })
    expect(result.current[0]).toBe('')
  })

  it('FilterMenu: keyboard opens it, arrows skip disabled options, Home/End, Escape returns focus, focus leaving closes it', async () => {
    const { FilterMenu } = await import('../../components/publications/PublicationControls')
    const onChange = vi.fn()
    render(
      <>
        <FilterMenu label="Type" value="" onChange={onChange} allLabel="All" total={3}
          options={[{ value: 'a', label: 'A', count: 2 }, { value: 'b', label: 'B', count: 0 }, { value: 'c', label: 'C', count: 1 }]} />
        <button type="button">Elsewhere</button>
      </>,
    )
    const button = screen.getByRole('button', { name: /^Type/ })
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    const list = screen.getByRole('listbox', { name: 'Type' })
    expect(document.activeElement).toBe(list)
    const active = () => document.getElementById(list.getAttribute('aria-activedescendant')).textContent
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    expect(active()).toMatch(/^A/)
    fireEvent.keyDown(list, { key: 'ArrowDown' }) // B has no matches: skipped
    expect(active()).toMatch(/^C/)
    fireEvent.keyDown(list, { key: 'Home' })
    expect(active()).toMatch(/^All/)
    fireEvent.keyDown(list, { key: 'End' })
    expect(active()).toMatch(/^C/)
    fireEvent.keyDown(list, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('c')
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    fireEvent.blur(screen.getByRole('listbox'), { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('PublicationMedia: full-size srcset only when both files have the same shape; a failed image falls back', async () => {
    const { default: PublicationMedia } = await import('../../components/publications/PublicationMedia')
    const same = { src: 't.webp', width: 480, height: 360, full: 'f.webp', fullWidth: 1200, fullHeight: 900 }
    const cropped = { ...same, fullHeight: 1600 }
    const { container, rerender } = render(<PublicationMedia thumb={same} type="Book" sizes="22rem" />)
    const front = () => container.querySelector('img[width]')
    expect(front().getAttribute('srcset')).toBe('t.webp 480w, f.webp 1200w')
    rerender(<PublicationMedia thumb={cropped} type="Book" sizes="22rem" />)
    expect(front().getAttribute('srcset')).toBeNull()
    rerender(<PublicationMedia thumb={same} type="Book" standin={<span data-testid="standin" />} />)
    fireEvent.error(front())
    expect(screen.getByTestId('standin')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
