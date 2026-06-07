import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Button from '../../components/ui/Button'

// Helper: wrap in MemoryRouter so <Link to=...> works
function renderButton(props = {}) {
  return render(
    <MemoryRouter>
      <Button {...props} />
    </MemoryRouter>
  )
}

describe('Button', () => {
  // --- basic rendering ---
  it('renders with default props without crashing', () => {
    renderButton({ children: 'Click me' })
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders children text correctly', () => {
    renderButton({ children: 'Hello World' })
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders a <button> element by default (no href or to)', () => {
    renderButton({ children: 'Btn' })
    const el = screen.getByRole('button', { name: 'Btn' })
    expect(el.tagName).toBe('BUTTON')
  })

  // --- variants ---
  it('renders primary variant with gradient class', () => {
    renderButton({ children: 'Primary', variant: 'primary' })
    const el = screen.getByRole('button')
    expect(el.className).toContain('bg-gradient-to-br')
  })

  it('renders ghost variant with text-primary class', () => {
    renderButton({ children: 'Ghost', variant: 'ghost' })
    const el = screen.getByRole('button')
    expect(el.className).toContain('text-primary')
  })

  it('renders accent variant', () => {
    renderButton({ children: 'Accent', variant: 'accent' })
    const el = screen.getByRole('button')
    expect(el.className).toContain('bg-gradient-to-br')
  })

  // --- sizes ---
  it('applies sm size classes', () => {
    renderButton({ children: 'Sm', size: 'sm' })
    expect(screen.getByRole('button').className).toContain('px-4')
  })

  it('applies lg size classes', () => {
    renderButton({ children: 'Lg', size: 'lg' })
    expect(screen.getByRole('button').className).toContain('px-8')
  })

  // --- click handler ---
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    renderButton({ children: 'Clickable', onClick: handleClick })
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when button is disabled', () => {
    const handleClick = vi.fn()
    renderButton({ children: 'Disabled', onClick: handleClick, disabled: true })
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(handleClick).not.toHaveBeenCalled()
  })

  // --- link rendering ---
  it('renders as an <a> tag when href prop is provided', () => {
    renderButton({ children: 'Link', href: 'https://example.com' })
    const el = screen.getByRole('link', { name: 'Link' })
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe('https://example.com')
  })

  it('sets target=_blank and rel for external href', () => {
    renderButton({ children: 'Ext', href: 'https://ext.com', external: true })
    const el = screen.getByRole('link', { name: 'Ext' })
    expect(el.getAttribute('target')).toBe('_blank')
    expect(el.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('does NOT set target=_blank for non-external href', () => {
    renderButton({ children: 'Internal', href: '/about' })
    const el = screen.getByRole('link', { name: 'Internal' })
    expect(el.getAttribute('target')).toBeNull()
  })

  it('renders as a React Router <Link> when `to` prop is provided', () => {
    renderButton({ children: 'Router Link', to: '/contact' })
    const el = screen.getByRole('link', { name: 'Router Link' })
    expect(el.tagName).toBe('A')
    // React Router sets href on the anchor
    expect(el.getAttribute('href')).toBe('/contact')
  })

  // --- extra className ---
  it('merges extra className prop', () => {
    renderButton({ children: 'Styled', className: 'custom-class' })
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  // --- base classes always present ---
  it('always includes font-semibold and rounded-full base classes', () => {
    renderButton({ children: 'Base' })
    const cls = screen.getByRole('button').className
    expect(cls).toContain('font-semibold')
    expect(cls).toContain('rounded-full')
  })
})
