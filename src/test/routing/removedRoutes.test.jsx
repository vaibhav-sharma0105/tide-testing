/**
 * Removed routes — the 16 former "stranded" paths were deleted outright (no
 * redirects), so each one must now fall through to the catch-all NotFound page.
 *
 * Unlike routes.smoke.test.jsx (which mounts one page at a time), this renders
 * the real <App /> so it exercises the actual <Routes> table in src/App.jsx.
 * BrowserRouter reads window.location, so each case sets the URL first
 * (import.meta.env.BASE_URL is '/' under Vitest).
 */

import { render, screen, cleanup } from '@testing-library/react'
import App from '../../App'
import notFound from '../../data/not-found.json'
import { REMOVED_PATHS } from './removedPaths'


async function renderAppAt(path) {
  window.history.pushState({}, '', path)
  render(<App />)
}

describe('Removed (formerly stranded) routes', () => {
  afterEach(() => {
    cleanup()
    window.history.pushState({}, '', '/')
  })

  it.each(REMOVED_PATHS)('%s renders the NotFound page', async (path) => {
    await renderAppAt(path)
    expect(
      await screen.findByText(notFound.title, {}, { timeout: 4000 })
    ).toBeInTheDocument()
  })

  it('a live route does not render the NotFound page (control)', async () => {
    await renderAppAt('/contact')
    // Wait for the lazy Contact page to settle, then confirm NotFound is absent.
    await screen.findAllByRole('heading', {}, { timeout: 5000 })
    expect(screen.queryByText(notFound.title)).not.toBeInTheDocument()
  })
})
