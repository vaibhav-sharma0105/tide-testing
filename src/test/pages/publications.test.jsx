import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import {
  applyPublicationFilters, facetPublicationOptions, formatPublicationDate, safeLink,
  groupByYear, publicationStats, splitShelf, yearOf, comparePublications, reportPeriod, formatPeriod,
  paginate, pageWindow, parsePublicationParams, publicationParamsToSearch, yearCounts, sourceOf,
  countOfTypes, isNew, typeIconKey, frameForSize, highlightParts, searchTerms, publicationsJsonLd,
} from '../../utils/publicationFilters'
import {
  THRIVE_PAGE_SIZE, TIDE_SHELF_VISIBLE, TIDE_OTHERS_PAGE_SIZE, TIDE_SEARCH_MIN_ITEMS, NEW_BADGE_DAYS,
} from '../../config/publications'

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
// n THRIvE rows, 3 per year from 2010 (so years run over page boundaries).
const manyThrive = (n) => Array.from({ length: n }, (_, i) => row({
  id: `M-${i}`, org: 'THRIvE', date: `${2040 - Math.floor(i / 3)}-01-0${3 - (i % 3)}`, title: `Paper ${String(i).padStart(2, '0')}`, type: 'Journal article',
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
          <Route path="/about/publications" element={<TidePublications />} />
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
const optionTexts = (select) => [...select.options].map(o => o.textContent)

afterEach(() => {
  vi.doUnmock('../../data/sheets/publications.json')
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('TIDE publications (document shelf)', () => {
  it('features the latest annual report, with stats in the hero and no chart', async () => {
    await renderAt('/about/publications')
    const featured = screen.getByRole('region', { name: 'Annual Report 2024-2025' })
    expect(within(featured).getByText('Latest annual report')).toBeInTheDocument()
    const read = within(featured).getByRole('link', { name: 'Read report: Annual Report 2024-2025 (opens in a new tab)' })
    expect(read).toHaveAttribute('href', 'https://example.org/ar25')
    expect(read).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(featured).getByText('29 September 2025').tagName).toBe('TIME')
    expect(within(featured).getByText('example.org')).toBeInTheDocument()
    // 6 rows, 3 types (case/space variants of "Annual report" are one), earliest 2019.
    const hero = screen.getByRole('heading', { level: 1 }).parentElement
    expect(within(hero).getAllByRole('listitem').map(li => li.textContent)).toEqual(['6 publications', '3 types', 'since 2019'])
    expect(screen.queryByText('Publications per year')).not.toBeInTheDocument()
    // 6 rows ≤ TIDE_SEARCH_MIN_ITEMS: no search box; ≤ 12 others: no pagination.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()
  })

  it('shelf: other annual reports, latest period first, each labelled with its period', async () => {
    await renderAt('/about/publications')
    const shelf = screen.getByRole('region', { name: 'Annual reports' })
    const items = within(shelf).getAllByRole('listitem')
    expect(items.map(li => li.textContent)).toEqual([
      expect.stringContaining('2023–24'),
      expect.stringContaining('2022–23'),
    ])
    expect(items[0]).toHaveTextContent('Period: 2023–24Annual Report 2023-2024')
    expect(within(shelf).queryByText('Annual Report 2024-2025')).not.toBeInTheDocument()
    expect(within(items[0]).queryByRole('link')).not.toBeInTheDocument()
    expect(within(items[1]).getByRole('link')).toHaveAttribute('target', '_blank')
    // ≤ TIDE_SHELF_VISIBLE reports: no toggle.
    expect(within(shelf).queryByRole('button')).not.toBeInTheDocument()
  })

  it(`shelf shows ${TIDE_SHELF_VISIBLE}, then "Show all {n} annual reports"`, async () => {
    const reports = Array.from({ length: TIDE_SHELF_VISIBLE + 3 }, (_, i) => row({
      id: `AR-${i}`, org: 'TIDE', date: `${2025 - i}-09-29`, title: `Annual Report ${2024 - i}-${2025 - i}`, type: 'Annual report', link: `https://example.org/${i}`,
    }))
    await renderAt('/about/publications', snap(reports))
    const shelf = screen.getByRole('region', { name: 'Annual reports' })
    expect(within(shelf).getAllByRole('listitem')).toHaveLength(TIDE_SHELF_VISIBLE)
    const toggle = within(shelf).getByRole('button', { name: `Show all ${TIDE_SHELF_VISIBLE + 2} annual reports` })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(within(shelf).getAllByRole('listitem')).toHaveLength(TIDE_SHELF_VISIBLE + 2)
    expect(within(shelf).getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('other types: buttons with counts filter the cards, kept in the URL; source shown', async () => {
    await renderAt('/about/publications')
    const others = screen.getByRole('region', { name: 'Reports, talks & more' })
    expect(titles(others)).toEqual(['Field project report', 'Harmony talk', 'Why I do'])
    const group = within(others).getByRole('group', { name: 'Show one type of material' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map(b => b.textContent)).toEqual(['All3', 'Presentation2', 'Project report1'])
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    const report = screen.getAllByRole('article').find(a => within(a).queryByText('Field project report'))
    expect(report).toHaveTextContent('Source: Google Drive folder')
    fireEvent.click(buttons[1])
    expect(titles(others)).toEqual(['Harmony talk', 'Why I do'])
    expect(search()).toBe('?type=presentation')
    const why = screen.getAllByRole('article').find(a => within(a).queryByText('Why I do'))
    expect(within(why).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open: Harmony talk (opens in a new tab)' })).toHaveAttribute('href', 'https://example.org/p1')
  })

  it('reads the type from the URL and ignores an unknown one', async () => {
    await renderAt('/about/publications?type=project%20report')
    expect(titles(screen.getByRole('region', { name: 'Reports, talks & more' }))).toEqual(['Field project report'])
    await renderAt('/about/publications?type=nope')
    expect(titles(screen.getAllByRole('region', { name: 'Reports, talks & more' }).at(-1))).toHaveLength(3)
  })

  it(`numbered pages appear above ${TIDE_OTHERS_PAGE_SIZE} other items; a too-high page is clamped`, async () => {
    const talks = Array.from({ length: TIDE_OTHERS_PAGE_SIZE + 2 }, (_, i) => row({
      id: `TK-${i}`, org: 'TIDE', date: `2020-01-${String(i + 1).padStart(2, '0')}`, title: `Talk ${i}`, type: 'Presentation',
    }))
    await renderAt('/about/publications?page=9', snap(talks))
    const others = screen.getByRole('region', { name: 'Reports, talks & more' })
    expect(titles(others)).toHaveLength(2)
    expect(within(others).getByText(`Showing ${TIDE_OTHERS_PAGE_SIZE + 1}–${TIDE_OTHERS_PAGE_SIZE + 2} of ${TIDE_OTHERS_PAGE_SIZE + 2}`)).toBeInTheDocument()
    const nav = within(others).getByRole('navigation', { name: 'Pages' })
    fireEvent.click(within(nav).getByRole('link', { name: 'Page 1' }))
    expect(titles(others)).toHaveLength(TIDE_OTHERS_PAGE_SIZE)
    expect(search()).toBe('')
  })

  it(`a search box appears above ${TIDE_SEARCH_MIN_ITEMS} rows and replaces the sections with results`, async () => {
    const lots = Array.from({ length: TIDE_SEARCH_MIN_ITEMS + 1 }, (_, i) => row({
      id: `L-${i}`, org: 'TIDE', date: `2020-02-${String((i % 28) + 1).padStart(2, '0')}`, title: i === 3 ? 'Harmony in schools' : `Item ${i}`, type: i % 2 ? 'Presentation' : 'Project report',
    }))
    await renderAt('/about/publications', snap(lots))
    const box = screen.getByRole('searchbox', { name: 'Search TIDE publications' })
    fireEvent.change(box, { target: { value: 'harmony' } })
    await waitFor(() => expect(search()).toBe('?search=harmony'))
    expect(screen.getByRole('region', { name: 'Search results' })).toBeInTheDocument()
    expect(screen.getByText('1 publication found')).toBeInTheDocument()
    expect(titles()).toEqual(['Harmony in schools'])
    expect(screen.getByText('Harmony').tagName).toBe('MARK')
    expect(screen.queryByRole('region', { name: 'Reports, talks & more' })).not.toBeInTheDocument()
  })

  it('without annual reports, the featured card and shelf are not rendered; one type → no buttons', async () => {
    await renderAt('/about/publications', snap(TIDE_ROWS.filter(r => r.type === 'Presentation')))
    expect(screen.queryByText('Latest annual report')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Annual reports' })).not.toBeInTheDocument()
    const others = screen.getByRole('region', { name: 'Reports, talks & more' })
    expect(titles(others)).toEqual(['Harmony talk', 'Why I do'])
    expect(within(others).queryByRole('group')).not.toBeInTheDocument()
  })

  it('shows the empty state when there is no TIDE row', async () => {
    await renderAt('/about/publications', snap(THRIVE_ROWS))
    expect(screen.getByText('No publications published yet')).toBeInTheDocument()
    expect(screen.getByText('Publications appear here as soon as they are added.')).toBeInTheDocument()
  })

  it('"New" badge for rows dated within the window (fixed clock)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-10-10T12:00:00Z'))
    await renderAt('/about/publications')
    const featured = screen.getByRole('region', { name: 'Annual Report 2024-2025' })
    expect(within(featured).getByText('New')).toBeInTheDocument()
    expect(screen.getAllByText('New')).toHaveLength(1)
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

  it('hero: per-year chart filters by year; social proof only when counted', async () => {
    await renderAt('/thrive/publications')
    expect(screen.getByText('Publications per year')).toBeInTheDocument()
    // 2021…2025, empty years (2022, 2024) are not buttons.
    const bars = screen.getAllByRole('button', { name: /Show only this year$/ })
    expect(bars.map(b => b.getAttribute('aria-label'))).toEqual([
      '2021: 1 publication. Show only this year', '2023: 1 publication. Show only this year', '2025: 2 publications. Show only this year',
    ])
    expect(screen.queryByText(/pieces? by others/)).not.toBeInTheDocument()
    fireEvent.click(bars[1])
    expect(search()).toBe('?year=2023')
    expect(titles()).toEqual(['Teacher study'])
    expect(screen.getByRole('button', { name: '2023: 1 publication. Show only this year' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Remove filter: 2023' })).toBeInTheDocument()
  })

  it('social proof counts rows of the listed types', async () => {
    const others = [
      row({ id: 'O1', org: 'THRIvE', date: '2024-01-01', title: 'Cited us', type: 'Published by others (TIDE acknowledged)' }),
      row({ id: 'O2', org: 'THRIvE', date: '2024-01-02', title: 'News', type: 'mass media coverage' }),
    ]
    await renderAt('/thrive/publications', snap([...THRIVE_ROWS, ...others]))
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '2 pieces by others citing or featuring our work')).toBeInTheDocument()
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

  it('type / field / year selects: visible labels, counts, zero-count options disabled', async () => {
    await renderAt('/thrive/publications')
    const type = screen.getByRole('combobox', { name: 'Type of material' })
    const field = screen.getByRole('combobox', { name: 'Field of work' })
    const year = screen.getByRole('combobox', { name: 'Year' })
    expect(screen.getByText('Year').tagName).toBe('LABEL')
    expect(optionTexts(type)).toEqual(['All types (5)', 'Blog (2)', 'Book (1)', 'Journal article (2)'])
    expect(optionTexts(field)).toEqual([
      'All fields (5)', 'Assessment (2)', 'Curriculum (1)', 'Holistic Education (1)', `${TEACHER_FIELD} (1)`, 'Other (1)',
    ])
    expect(optionTexts(year)).toEqual(['All years (5)', '2025 (2)', '2023 (1)', '2021 (1)', 'Undated (1)'])
    fireEvent.change(field, { target: { value: 'assessment' } })
    expect(titles()).toEqual(['Assessment brief', 'Teacher study'])
    expect(optionTexts(type)).toEqual(['All types (2)', 'Blog (0)', 'Book (0)', 'Journal article (2)'])
    expect([...type.options].map(o => o.disabled)).toEqual([false, true, true, false])
    fireEvent.change(type, { target: { value: 'journal article' } })
    fireEvent.change(year, { target: { value: '2023' } })
    expect(search()).toBe('?type=journal+article&field=assessment&year=2023')
    expect(titles()).toEqual(['Teacher study'])
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Assessment' }))
    expect(search()).toBe('?type=journal+article&year=2023')
  })

  it('URL values that no longer exist show as chips with (0) and clear easily; bad params are ignored', async () => {
    await renderAt('/thrive/publications?type=gone%20type&year=1999&foo=bar')
    expect(screen.getByRole('combobox', { name: 'Type of material' })).toHaveValue('gone type')
    expect(optionTexts(screen.getByRole('combobox', { name: 'Type of material' }))).toContain('gone type (0)')
    expect(optionTexts(screen.getByRole('combobox', { name: 'Year' }))).toContain('1999 (0)')
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
    expect(screen.getByRole('combobox', { name: 'Field of work' })).toHaveValue('assessment')
  })

  it('APA citation under the title; field tags; source; Read hidden without a link', async () => {
    const { container } = await renderAt('/thrive/publications')
    const card = screen.getAllByRole('article').find(a => within(a).queryByText('Teacher study'))
    const heading = within(card).getByRole('heading', { level: 3 })
    expect(heading.nextElementSibling.textContent).toBe('Citation: Doe, J. (2023). Teacher study. Journal of Tests.')
    expect(within(card).getByText(TEACHER_FIELD)).toBeInTheDocument()
    expect(within(card).queryByRole('link')).not.toBeInTheDocument()
    const linked = screen.getAllByRole('article').find(a => within(a).queryByText('Assessment brief'))
    const read = within(linked).getByRole('link', { name: 'Read: Assessment brief (opens in a new tab)' })
    expect(read).toHaveAttribute('href', 'https://example.org/a')
    expect(read).toHaveAttribute('target', '_blank')
    expect(read).toHaveAttribute('rel', 'noopener noreferrer')
    expect(linked).toHaveTextContent('Source: example.org')
    const book = screen.getAllByRole('article').find(a => within(a).queryByText('Second brief'))
    expect(book).toHaveTextContent('Source: DOI')
    const undated = screen.getAllByRole('article').find(a => within(a).queryByText('Undated note'))
    expect(within(undated).queryByRole('button', { name: /Copy citation/ })).not.toBeInTheDocument()
    expect(container.innerHTML).not.toContain('drive.google.com')
  })

  it('"Copy citation" copies the APA text and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await renderAt('/thrive/publications')
    const btn = screen.getByRole('button', { name: 'Copy citation for Teacher study' })
    await act(async () => { fireEvent.click(btn) })
    expect(writeText).toHaveBeenCalledWith('Doe, J. (2023). Teacher study. Journal of Tests.')
    expect(btn).toHaveTextContent('Copied')
    expect(screen.getByText('Citation copied to the clipboard')).toHaveAttribute('aria-live', 'polite')
    delete navigator.clipboard
  })

  it('description gets "Show more" only when it overflows 3 lines', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
      return this.textContent === 'About teachers' ? 200 : 0
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(72)
    await renderAt('/thrive/publications')
    const buttons = screen.getAllByRole('button', { name: 'Show more' })
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  })

  it(`numbered pages of ${THRIVE_PAGE_SIZE}: page in the URL, "continued" year heading, focus to results`, async () => {
    await renderAt('/thrive/publications', snap(manyThrive(47)))
    expect(screen.getAllByRole('article')).toHaveLength(THRIVE_PAGE_SIZE)
    expect(screen.getByText('Showing 1–20 of 47 publications')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Pages' })
    expect(within(nav).getByText('Page 1').closest('[aria-current="page"]')).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /Previous/ })).not.toBeInTheDocument()
    fireEvent.click(within(nav).getByRole('link', { name: 'Page 2' }))
    expect(search()).toBe('?page=2')
    expect(screen.getByText('Showing 21–40 of 47 publications')).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByText('Showing 21–40 of 47 publications'))
    // Rows 18–20 are 2034; row 20 (index) starts page 2 still in 2034 → "continued".
    expect(years()[0]).toBe('2034(continued)')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Pages' })).getByRole('link', { name: 'Page 3' }))
    expect(screen.getAllByRole('article')).toHaveLength(7)
    expect(search()).toBe('?page=3')
  })

  it('a page beyond the last is clamped; changing a filter returns to page 1', async () => {
    await renderAt('/thrive/publications?page=9', snap(manyThrive(27)))
    expect(screen.getByText('Showing 21–27 of 27 publications')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Year' }), { target: { value: '2040' } })
    expect(search()).toBe('?year=2040')
    expect(screen.getByText('3 publications')).toBeInTheDocument()
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
    expect(reportPeriod({ title: 'No period', date: null })).toBeNull()
    expect(formatPeriod(null)).toBeNull()
  })

  it('shelf: by period end, then date; featured is the latest period', () => {
    const s = splitShelf([
      ...TIDE_ROWS,
      row({ id: 'T-beti', org: 'TIDE', date: '2025-05-31', title: 'BETI year 24-25 report', type: 'Annual report' }),
      row({ id: 'T-ar26', org: 'TIDE', date: '2025-01-01', title: 'Annual Report 2025-2026', type: 'Annual report' }),
    ], 'Annual Report')
    expect(s.featured.id).toBe('T-ar26')
    expect(s.shelf.map(r => r.id)).toEqual(['T-ar25', 'T-beti', 'T-ar24', 'T-ar23'])
    expect(s.others.map(r => r.id)).toEqual(['T-pr', 'T-p1', 'T-p2'])
    expect(splitShelf(TIDE_ROWS, 'Nothing').featured).toBeNull()
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
      search: '', type: 'journal article', field: '', year: '2024', dir: 'asc', page: 2,
    })
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

  it('social-proof count, New window, icon families, frames', () => {
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
    expect(frameForSize(480, 210)).toBe('landscape')
    expect(frameForSize(321, 527)).toBe('portrait')
    expect(frameForSize(480, 400)).toBe('portrait')
    expect(frameForSize(undefined, undefined)).toBe('portrait')
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
