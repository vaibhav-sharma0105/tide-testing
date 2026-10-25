import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'
import data from '../../data/error.json'

const SECRET = 'boom-secret-internal-message'

function Bomb() {
  throw new Error(SECRET)
}

function renderBroken() {
  return render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  )
}

describe('ErrorBoundary', () => {
  let errorSpy

  beforeEach(() => {
    // React and the boundary both log the caught error; keep test output clean
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    errorSpy.mockRestore()
  })

  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>all good</p></ErrorBoundary>)
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('shows the friendly screen with reload and home actions', () => {
    renderBroken()
    expect(screen.getByRole('heading', { name: data.heading })).toBeInTheDocument()
    expect(screen.getByText(data.body)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: data.reloadLabel })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: data.homeLabel })).toHaveAttribute('href', import.meta.env.BASE_URL)
  })

  it('logs the error to the console', () => {
    renderBroken()
    expect(errorSpy.mock.calls.some(args => args.some(a => a instanceof Error && a.message === SECRET))).toBe(true)
  })

  it('hides the error message and stack from visitors when DEV is false', () => {
    vi.stubEnv('DEV', false)
    const { container } = renderBroken()
    expect(screen.queryByText(new RegExp(SECRET))).not.toBeInTheDocument()
    expect(container.textContent).not.toContain(SECRET)
    expect(container.textContent).not.toMatch(/at Bomb|\.jsx/)
    expect(container.querySelector('pre')).toBeNull()
  })

  it('shows the error message for developers when DEV is true', () => {
    vi.stubEnv('DEV', true)
    renderBroken()
    expect(screen.getByText(new RegExp(SECRET))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: data.heading })).toBeInTheDocument()
  })
})
