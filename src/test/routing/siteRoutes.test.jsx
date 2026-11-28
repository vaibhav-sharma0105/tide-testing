/**
 * src/config/siteRoutes.js lists the public addresses the build prerenders and puts in sitemap.xml
 * (audit P3). This checks it against the real <Routes> table in src/App.jsx: every listed address
 * must render a real page (not NotFound), so the two lists can't drift apart unnoticed.
 */

import { render, screen, cleanup, act } from '@testing-library/react'
import App from '../../App'
import { preloadPage } from '../../routes'
import { lazyPage } from '../../utils/reloadOnStaleChunk'
import notFound from '../../data/not-found.json'
import library from '../../data/sheets/pramaan-library.json'
import { PRIMARY_ROUTES, REDIRECT_ROUTES, resourcePath } from '../../config/siteRoutes'

const PATHS = [...PRIMARY_ROUTES.map((r) => r.path), resourcePath(library.resources[0].id)]

describe('siteRoutes.js agrees with App.jsx', () => {
  afterEach(() => {
    cleanup()
    window.history.pushState({}, '', '/')
  })

  it.each(PATHS)('%s renders a page with one <h1>, not NotFound', async (path) => {
    window.history.pushState({}, '', path)
    render(<App />)
    await screen.findAllByRole('heading', { level: 1 }, { timeout: 20000 })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.queryByText(notFound.title)).not.toBeInTheDocument()
  })

  it.each(REDIRECT_ROUTES)('$from forwards to $to', async ({ from, to }) => {
    window.history.pushState({}, '', `${from}?q=1`)
    render(<App />)
    await screen.findAllByRole('heading', { level: 1 }, { timeout: 20000 })
    expect(window.location.pathname + window.location.search).toBe(`${to}?q=1`)
  })
})

describe('preloadPage / lazyPage.preload', () => {
  it('resolves with the page module for a known path, and NotFound for an unknown one', async () => {
    await expect(preloadPage('/contact')).resolves.toHaveProperty('default')
    await expect(preloadPage('/no/such/page')).resolves.toHaveProperty('default')
  })

  it('a preloaded page renders at once, with no Suspense fallback', async () => {
    const Page = lazyPage(() => Promise.resolve({ default: () => <h1>Ready</h1> }))
    await act(() => Page.preload())
    const { container } = render(<Page />)
    expect(container.textContent).toBe('Ready')
  })
})
