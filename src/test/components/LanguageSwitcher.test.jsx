import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => { globalThis.__viMocks.changeLanguage.mockClear() })

  it('renders without crashing', () => {
    const { container } = render(<LanguageSwitcher />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders three language buttons: EN, हि, ગુ', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'हि' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ગુ' })).toBeInTheDocument()
  })

  it('highlights the currently active language (EN) with bg-primary', () => {
    render(<LanguageSwitcher />)
    // Active language button should have the active class
    const enButton = screen.getByRole('button', { name: 'EN' })
    expect(enButton.className).toContain('bg-primary')
  })

  it('non-active language buttons do NOT have bg-primary', () => {
    render(<LanguageSwitcher />)
    const hiButton = screen.getByRole('button', { name: 'हि' })
    expect(hiButton.className).not.toContain('bg-primary')
  })

  it('calls i18n.changeLanguage with "hi" when हि is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'हि' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('hi')
  })

  it('calls i18n.changeLanguage with "gu" when ગુ is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'ગુ' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('gu')
  })

  it('calls i18n.changeLanguage with "en" when EN is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('en')
  })

  it('renders with light=true prop without crashing', () => {
    const { container } = render(<LanguageSwitcher light={true} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('applies light styling (border-white/25) when light=true', () => {
    render(<LanguageSwitcher light={true} />)
    // The wrapper div gets light-mode border class
    const enButton = screen.getByRole('button', { name: 'EN' })
    // In light mode, active button uses bg-white
    expect(enButton.className).toContain('bg-white')
  })
})
