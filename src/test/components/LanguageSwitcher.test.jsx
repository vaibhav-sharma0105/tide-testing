import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => { globalThis.__viMocks.changeLanguage.mockClear() })

  it('renders without crashing', () => {
    const { container } = render(<LanguageSwitcher />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders three language buttons: English, हिन्दी, ગુજરાતી', () => {
    render(<LanguageSwitcher />)
    // Accessible names are now descriptive (aria-label) rather than the bare
    // visible glyphs — WCAG 2.5.3 Label in Name is still satisfied since the
    // visible text is a prefix of each accessible name (EN -> English, etc).
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'हिन्दी (Hindi)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ગુજરાતી (Gujarati)' })).toBeInTheDocument()
  })

  it('highlights the currently active language (EN) with bg-primary', () => {
    render(<LanguageSwitcher />)
    // Active language button should have the active class
    const enButton = screen.getByRole('button', { name: 'English' })
    expect(enButton.className).toContain('bg-primary')
  })

  it('non-active language buttons do NOT have bg-primary', () => {
    render(<LanguageSwitcher />)
    const hiButton = screen.getByRole('button', { name: 'हिन्दी (Hindi)' })
    expect(hiButton.className).not.toContain('bg-primary')
  })

  it('calls i18n.changeLanguage with "hi" when हि is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी (Hindi)' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('hi')
  })

  it('calls i18n.changeLanguage with "gu" when ગુ is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'ગુજરાતી (Gujarati)' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('gu')
  })

  it('calls i18n.changeLanguage with "en" when EN is clicked', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(globalThis.__viMocks.changeLanguage).toHaveBeenCalledWith('en')
  })

  it('renders with light=true prop without crashing', () => {
    const { container } = render(<LanguageSwitcher light={true} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('applies light styling (border-white/25) when light=true', () => {
    render(<LanguageSwitcher light={true} />)
    // The wrapper div gets light-mode border class
    const enButton = screen.getByRole('button', { name: 'English' })
    // In light mode, active button uses bg-white
    expect(enButton.className).toContain('bg-white')
  })
})
