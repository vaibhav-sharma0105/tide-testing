import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import data from '../../data/error.json'

// P5 (2026-11-24): a crash inside one page shows the friendly screen INSIDE the page area; the
// header (with the menu) stays, and moving to another page clears the error.
function Bomb() { throw new Error('page crashed') }
function Fine() { return <h1>Fine page</h1> }

describe('per-page error boundary (Layout)', () => {
  let spy
  beforeEach(() => { spy = vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => spy.mockRestore())

  it('keeps the site header, shows the error in <main>, and recovers on navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Link to="/fine">go fine</Link>
        <Layout>
          <Routes>
            <Route path="/broken" element={<Bomb />} />
            <Route path="/fine" element={<Fine />} />
          </Routes>
        </Layout>
      </MemoryRouter>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument() // the header survived
    const main = screen.getByRole('main')
    expect(main).toHaveTextContent(data.heading)
    expect(main.querySelectorAll('main')).toHaveLength(0) // no <main> inside <main>
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'go fine' })) })
    expect(await screen.findByRole('heading', { name: 'Fine page' })).toBeInTheDocument()
    expect(screen.queryByText(data.heading)).not.toBeInTheDocument()
  })
})
