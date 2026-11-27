// The homepage (src/pages/Home.jsx + src/components/home/) and the figure helpers it uses.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { splitFigure, formatFigure } from '../../utils/figures'
import home from '../../data/home.json'
import site from '../../data/site.json'

vi.setConfig({ testTimeout: 15000 })

// Made-up partner rows (not real Sheet data); logos come from a mocked manifest.
const rows = ['PA-1', 'PA-2', 'PA-3', 'PA-4'].map((id, i) => ({ id, type: 'Collaborators', priority: 'High', name: `Partner ${i + 1}`, website: null, photoUrl: null }))
const snap = (resources) => ({ schemaVersion: 1, section: 'partners', success: true, lastUpdated: null, contentHash: 'x', meta: { total: resources.length }, resources })

async function renderHome(resources = []) {
  vi.resetModules()
  vi.doMock('../../data/sheets/partners.json', () => ({ default: snap(resources) }))
  vi.doMock('../../data/partners-photos.json', () => ({
    default: Object.fromEntries(resources.map(r => [r.id, { thumb: `assets/images/partners/${r.id}-logo.webp`, thumbWidth: 100, thumbHeight: 50 }])),
  }))
  const { default: Home } = await import('../../pages/Home')
  return render(<HelmetProvider><MemoryRouter><Home /></MemoryRouter></HelmetProvider>)
}

afterEach(() => { vi.doUnmock('../../data/sheets/partners.json'); vi.doUnmock('../../data/partners-photos.json') })

describe('figures', () => {
  it('splits a figure written as text and keeps its grouping', () => {
    expect(splitFigure('52,500+')).toEqual({ before: '', value: 52500, grouped: true, after: '+' })
    expect(splitFigure('10,00,000 lives targeted')).toMatchObject({ value: 1000000, after: ' lives targeted' })
    expect(splitFigure('12 yrs')).toMatchObject({ value: 12, grouped: false, after: ' yrs' })
    expect(splitFigure('no number')).toBeNull()
    expect(formatFigure(1000000, true)).toBe('10,00,000')
    expect(formatFigure(2014, false)).toBe('2014')
  })
})

describe('Home page', () => {
  it('shows the banner figures from site.yaml and the pills, each with its label', async () => {
    await renderHome()
    const strip = screen.getByText(home.hero.floatLives).closest('ul')
    const text = strip.textContent
    // {years} in a pill = years since foundingYear (owner decision 2026-11-27: never typed, never stale).
    const years = String(new Date().getFullYear() - Number(site.foundingYear))
    for (const v of [site.livesImpacted, site.foundingYear, ...home.hero.pills.map(p => p.value.replace('{years}', years))]) expect(text).toContain(v)
    expect(text).not.toContain('{years}')
    for (const l of [home.hero.floatLives, home.hero.floatFounded, ...home.hero.pills.map(p => p.label)]) expect(within(strip).getByText(l)).toBeTruthy()
  })

  it('links the three approaches and keeps "Explore" visible on each', async () => {
    await renderHome()
    for (const p of home.programs.items) {
      const link = screen.getByRole('link', { name: new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
      expect(link.getAttribute('href')).toBe(p.to)
      expect(within(link).getByText(home.programs.explore)).toBeTruthy()
    }
  })

  it('lists every journey phase with its figure', async () => {
    await renderHome()
    for (const ph of home.journey.phases) expect(screen.getByText(ph.desc)).toBeTruthy()
    expect(screen.getAllByText(home.journey.phases.at(-1).lives).length).toBeGreaterThan(0)
  })

  it('hides "In good company" until the Partners snapshot has logos, then links to the Partners page', async () => {
    await renderHome([])
    expect(screen.queryByRole('heading', { name: home.partners.title })).toBeNull()
    await renderHome(rows)
    expect(screen.getAllByRole('heading', { name: home.partners.title }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: home.partners.linkLabel })[0].getAttribute('href')).toBe(home.partners.linkHref)
  })

  it('ends with the two ways to help', async () => {
    await renderHome()
    expect(screen.getByRole('link', { name: home.cta.volunteerLabel }).getAttribute('href')).toBe(home.cta.volunteerHref)
    expect(screen.getByRole('link', { name: home.cta.donateLabel }).getAttribute('href')).toBe(home.cta.donateHref)
  })
})
