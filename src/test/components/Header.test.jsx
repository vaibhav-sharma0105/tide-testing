import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { activeTopIndex, activeLeaf } from '../../utils/navActive'
import navData from '../../data/navigation.json'

const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><Header /></MemoryRouter>)
const labels = navData.items.map(i => i.label)

describe('Header menu', () => {
  it('About Us → Our Publications is a nested group (keyboard: Enter opens, ↓ moves, Esc closes only the sub-menu)', () => {
    renderAt('/')
    const about = screen.getAllByRole('button', { name: 'About Us' })[0]
    fireEvent.click(about)
    const group = screen.getByRole('button', { name: /^Our Publications/ })
    expect(group).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(group, { key: 'Enter' })
    expect(group).toHaveAttribute('aria-expanded', 'true')
    const tide = screen.getByRole('menuitem', { name: /^TIDE Publications/ })
    const thrive = screen.getByRole('menuitem', { name: /^THRIvE Publications/ })
    expect(tide).toHaveAttribute('href', '/tide/publications')
    expect(thrive).toHaveAttribute('href', '/thrive/publications')
    expect(document.activeElement).toBe(tide)
    fireEvent.keyDown(tide, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(thrive)
    fireEvent.keyDown(thrive, { key: 'Escape' })
    expect(group).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(group)
    expect(about).toHaveAttribute('aria-expanded', 'true')
  })

  it('THRIvE Research Centre is a dropdown with About THRIvE and THRIvE Publications', () => {
    renderAt('/')
    fireEvent.click(screen.getAllByRole('button', { name: 'THRIvE Research Centre' })[0])
    expect(screen.getByRole('link', { name: /^About THRIvE/ })).toHaveAttribute('href', '/thrive')
    expect(screen.getByRole('link', { name: /^THRIvE Publications/ })).toHaveAttribute('href', '/thrive/publications')
  })

  it('mobile menu: the nested group expands, and the current page is marked', () => {
    renderAt('/thrive/publications')
    fireEvent.click(screen.getByRole('button', { name: navData.menuToggleLabel }))
    const aboutButtons = screen.getAllByRole('button', { name: 'About Us' })
    fireEvent.click(aboutButtons[aboutButtons.length - 1])
    const group = screen.getAllByRole('button', { name: 'Our Publications' }).at(-1)
    fireEvent.click(group)
    expect(group).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'THRIvE Publications' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'TIDE Publications' })).not.toHaveAttribute('aria-current')
  })
})

describe('menu active state', () => {
  it('highlights one top-level entry, the most specific match', () => {
    expect(labels[activeTopIndex(navData.items, '/thrive/publications')]).toBe('THRIvE Research Centre')
    expect(labels[activeTopIndex(navData.items, '/thrive')]).toBe('THRIvE Research Centre')
    expect(labels[activeTopIndex(navData.items, '/tide/publications')]).toBe('About Us')
    expect(labels[activeTopIndex(navData.items, '/pramaan/resource-centre/X1')]).toBe('Pramaan')
    expect(activeTopIndex(navData.items, '/nowhere')).toBe(-1)
  })
  it('picks the deepest matching link, not every prefix', () => {
    expect(activeLeaf(navData.items, '/thrive/publications')).toBe('/thrive/publications')
    expect(activeLeaf(navData.items, '/thrive')).toBe('/thrive')
    expect(activeLeaf(navData.items, '/pramaan/resource-centre/X1')).toBe('/pramaan/resource-centre')
    expect(activeLeaf(navData.items, '/thriveX')).toBeNull()
  })
})
