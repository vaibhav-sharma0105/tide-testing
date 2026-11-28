// The Past SCF page's profiles (src/pages/SocialChangemakers.jsx + src/components/changemakers/).
// All rows are made up and only exist inside this test; the snapshot and photo manifest are mocked.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import data from '../../data/social-changemakers.json'
import { personInitials, firstName, posterIndex, matchesFellow } from '../../utils/changemakers'
import { FELLOWS_PAGE_SIZE } from '../../config/changemakers'

const t = data.profiles
const L = t.list
const fellow = (o) => ({ id: 'SC-x', batch: '23-24', order: 1, name: 'Fellow', project: 'Project', summary: null, nextSteps: null, videoUrl: null, testimonialUrl: null, writeupUrl: null, ...o })
const ROWS = [
  fellow({ id: 'SC-a', batch: '23-24', order: 2, name: 'Asha Patel', project: 'Second project' }),
  fellow({ id: 'SC-b', batch: '24-25', order: 1, name: 'Bina Shah', project: 'Clean water project', summary: 'A summary.', nextSteps: 'Plan one.', videoUrl: 'https://www.youtube-nocookie.com/embed/abcdefghijk', testimonialUrl: 'https://www.youtube-nocookie.com/embed/zyxwvutsrqp', writeupUrl: 'https://drive.google.com/file/d/writeupFile001/preview' }),
  fellow({ id: 'SC-c', batch: '23-24', order: 1, name: 'Chirag Rao', project: 'First project' }),
]
const MANIFEST = {
  'SC-b': { thumb: 'assets/images/social-changemakers/SC-b.webp', width: 800, height: 1000 },
  'SC-b__field': { thumb: 'assets/images/social-changemakers/SC-b__field.webp', width: 1000, height: 800 },
}
const snap = (resources) => ({ schemaVersion: 1, section: 'social-changemakers', success: true, lastUpdated: null, contentHash: 'x', meta: { total: resources.length }, resources })
function Where() { const l = useLocation(); return <span data-testid="where">{l.search}</span> }

async function renderPage(resources = ROWS, path = '/education-for-harmony/social-changemakers') {
  vi.resetModules()
  vi.doMock('../../data/sheets/social-changemakers.json', () => ({ default: snap(resources) }))
  vi.doMock('../../data/social-changemakers-photos.json', () => ({ default: resources.length ? MANIFEST : {} }))
  const { default: Page } = await import('../../pages/SocialChangemakers')
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/education-for-harmony/social-changemakers" element={<><Page /><Where /></>} /></Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}
const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
afterEach(() => { vi.useRealTimers(); vi.doUnmock('../../data/sheets/social-changemakers.json'); vi.doUnmock('../../data/social-changemakers-photos.json') })

describe('helpers', () => {
  it('makes initials, a first name, a stable poster, and searches name + project', () => {
    expect(personInitials('Mohammed Aamir Khan')).toBe('MK')
    expect(personInitials('Diya')).toBe('D')
    expect(firstName('Asha Patel')).toBe('Asha')
    expect(posterIndex('SC-a')).toBe(posterIndex('SC-a'))
    expect(matchesFellow(ROWS[1], 'bina water')).toBe(true)
    expect(matchesFellow(ROWS[1], 'bina library')).toBe(false)
    expect(matchesFellow({ name: 'José', project: '' }, 'jose')).toBe(true)
  })
})

describe('Past SCF list', () => {
  it('is one list under a heading: newest batch first, then the Sheet order, never showing the number', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { level: 2, name: L.heading })).toBeTruthy()
    expect(cardNames()).toEqual(['Bina Shah', 'Chirag Rao', 'Asha Patel'])
    for (const a of screen.getAllByRole('article')) expect(a.textContent).not.toMatch(/#\d|·\s*\d/)
    expect(screen.getByRole('status').textContent).toBe(L.results.replace('{from}', '1').replace('{to}', '3').replace('{count}', '3'))
  })

  it('filters by batch from the address and offers a chip to remove it', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?batch=23-24')
    expect(cardNames()).toEqual(['Chirag Rao', 'Asha Patel'])
    fireEvent.click(screen.getByRole('button', { name: L.removeFilter.replace('{name}', t.batchHeading.replace('{batch}', '23-24')) }))
    expect(screen.getByTestId('where').textContent).toBe('')
    expect(cardNames()).toHaveLength(3)
  })

  it('searches names and projects (kept in the address) and has a way out of no results', async () => {
    vi.useFakeTimers()
    await renderPage()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'water' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByTestId('where').textContent).toBe('?search=water')
    expect(cardNames()).toEqual(['Bina Shah'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing here' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByText(L.noMatch)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: L.noMatchClear }))
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(cardNames()).toHaveLength(3)
  })

  it('pages the list, keeping the filters in each page link', async () => {
    const many = Array.from({ length: FELLOWS_PAGE_SIZE + 2 }, (_, i) => fellow({ id: `SC-m${i}`, order: i + 1, name: `Person ${String(i).padStart(2, '0')}` }))
    await renderPage(many, '/education-for-harmony/social-changemakers?batch=23-24&page=2')
    expect(cardNames()).toEqual(['Person 12', 'Person 13'])
    const pages = screen.getByRole('navigation', { name: L.pagination.label })
    expect(within(pages).getByRole('link', { name: L.pagination.pageLabelTemplate.replace('{n}', '1') }).getAttribute('href')).toContain('batch=23-24')
  })

  it('reads a fractional ?page= as a whole page (P5: ?page=1.5 showed rows 7–18)', async () => {
    const many = Array.from({ length: FELLOWS_PAGE_SIZE + 2 }, (_, i) => fellow({ id: `SC-m${i}`, order: i + 1, name: `Person ${String(i).padStart(2, '0')}` }))
    await renderPage(many, '/education-for-harmony/social-changemakers?page=1.5')
    expect(cardNames()).toHaveLength(FELLOWS_PAGE_SIZE)
    expect(cardNames()[0]).toBe('Person 00')
  })

  it('shows a still photo on the card (no switch button) and opens the profile with a click anywhere on it', async () => {
    await renderPage()
    const card = screen.getByRole('heading', { level: 3, name: new RegExp('Bina Shah') }).closest('article')
    expect(within(card).getByText(t.cta)).toBeTruthy()
    expect(within(card).queryByRole('button', { name: t.flipToField })).toBeNull()
    expect(within(card).getByAltText(t.photoAlt.replace('{name}', 'Bina Shah'))).toBeTruthy()
    fireEvent.click(within(card).getByText('Clean water project'))
    expect(screen.getByTestId('where').textContent).toBe('?fellow=SC-b')
  })

  it('shows the profile: work first, the write-up as a new-tab link, previous / next in list order', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?fellow=SC-b')
    const dialog = screen.getByRole('dialog', { name: 'Bina Shah' })
    expect(within(dialog).getByRole('button', { name: t.work.videoLabel })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: t.work.testimonialLabel.replace('{firstName}', 'Bina') })).toBeTruthy()
    const writeup = within(dialog).getByRole('link', { name: new RegExp(t.work.writeupLabel) })
    expect(writeup.getAttribute('href')).toBe('https://drive.google.com/file/d/writeupFile001/view')
    expect(writeup.getAttribute('target')).toBe('_blank')
    fireEvent.click(within(dialog).getByRole('button', { name: new RegExp(`${t.profile.next}.*Chirag Rao`) }))
    expect(screen.getByTestId('where').textContent).toBe('?fellow=SC-c')
    fireEvent.click(screen.getByRole('button', { name: t.profile.close }))
    expect(screen.getByTestId('where').textContent).toBe('')
  })

  it('starts on the name (not a button, so no tooltip shows on open), moves with ← / →, and is disabled at the ends', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?fellow=SC-b')
    const dialog = screen.getByRole('dialog', { name: 'Bina Shah' })
    expect(document.activeElement).toBe(within(dialog).getByRole('heading', { level: 2 }))
    expect(within(dialog).getByRole('button', { name: t.profile.prev }).disabled).toBe(true)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByTestId('where').textContent).toBe('?fellow=SC-c')
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByTestId('where').textContent).toBe('?fellow=SC-b')
  })

  it('says more is coming when a profile has no text and no work yet', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?fellow=SC-c')
    expect(within(screen.getByRole('dialog', { name: 'Chirag Rao' })).getByText(t.profile.empty)).toBeTruthy()
  })

  it('shows where the fellow is in the list being looked at', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?fellow=SC-c')
    const dialog = screen.getByRole('dialog', { name: 'Chirag Rao' })
    expect(within(dialog).getByText(t.profile.position.replace('{at}', '2').replace('{total}', '3'))).toBeTruthy()
  })

  it('plays a film in the shared player', async () => {
    await renderPage(ROWS, '/education-for-harmony/social-changemakers?fellow=SC-b')
    fireEvent.click(screen.getByRole('button', { name: t.work.videoLabel }))
    expect([...document.querySelectorAll('iframe')].map(f => f.getAttribute('src'))).toContain('https://www.youtube-nocookie.com/embed/abcdefghijk')
  })

  it('counts fellows, batches and films in the banner', async () => {
    await renderPage()
    const hero = screen.getByRole('heading', { level: 1 }).parentElement.textContent
    for (const s of [t.stats.fellows.replace('{n}', '3'), t.stats.batches.replace('{n}', '2'), t.stats.filmsOne.replace('{n}', '1')]) expect(hero).toContain(s)
  })

  it('keeps the waiting grid while nothing is published', async () => {
    await renderPage([])
    expect(screen.getByText(data.grid.note)).toBeTruthy()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })
})

describe('Intro moving dot (WCAG 2.2.2)', () => {
  it('has a pause / play button whose name comes from YAML and flips on press', async () => {
    await renderPage()
    const btn = screen.getByRole('button', { name: data.intro.motion.pause })
    fireEvent.click(btn)
    expect(btn).toHaveAccessibleName(data.intro.motion.play)
    fireEvent.click(btn)
    expect(btn).toHaveAccessibleName(data.intro.motion.pause)
  })
})

describe('Search engines', () => {
  // Helmet is stubbed in src/test/setup.js, so read the props the page gives SeoHead.
  async function seoProps(path) {
    const seen = []
    vi.doMock('../../components/ui/SeoHead', () => ({ default: (props) => { seen.push(props); return null } }))
    await renderPage(ROWS, path)
    vi.doUnmock('../../components/ui/SeoHead')
    expect(seen.length).toBeGreaterThan(0)
    return seen.at(-1)
  }

  it('the list may be listed (keeps the old Fellowship pages\' reputation)', async () => {
    const p = await seoProps('/education-for-harmony/social-changemakers')
    expect(p.path).toBe('/education-for-harmony/social-changemakers')
    expect(p.noindex).toBe(false)
  })

  it('an open profile (?fellow=) is never listed: the fellows are students', async () => {
    const p = await seoProps('/education-for-harmony/social-changemakers?fellow=SC-b')
    expect(p.noindex).toBe(true)
  })
})
