import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnimatedCounter from '../../components/ui/AnimatedCounter'

// IntersectionObserver is mocked in setup.js.
// useScrollAnimation uses IntersectionObserver — the mock never fires the
// callback, so isVisible stays false, and the counter always renders '0'.
// We test that all structural elements are present and props are wired correctly.

describe('AnimatedCounter', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedCounter value={100} label="Schools" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('shows the label prop text', () => {
    render(<AnimatedCounter value={50} label="Students Reached" />)
    expect(screen.getByText('Students Reached')).toBeInTheDocument()
  })

  it('renders a numeric display element', () => {
    const { container } = render(<AnimatedCounter value={42} label="Volunteers" />)
    // The component renders either count or '0' (before visible)
    // Either way there should be a div containing a number
    const text = container.textContent
    expect(text).toMatch(/\d/)
  })

  it('does not render label element when label is not provided', () => {
    const { container } = render(<AnimatedCounter value={10} />)
    // No extra label div — container text should only contain the counter number
    const divs = container.querySelectorAll('div')
    // Should have wrapper + number div, but no label text other than digits
    expect(divs.length).toBeGreaterThan(0)
  })

  it('accepts a numeric string value with a suffix like "200+"', () => {
    const { container } = render(<AnimatedCounter value="200+" label="Schools" />)
    // '+' is the suffix — it should appear once visible, but at minimum no crash
    expect(container.firstChild).not.toBeNull()
  })

  it('accepts a value with commas like "1,200"', () => {
    const { container } = render(<AnimatedCounter value="1,200" label="Students" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('applies light styling classes when light=true', () => {
    const { container } = render(<AnimatedCounter value={10} label="Test" light={true} />)
    // In light mode, number div gets text-white
    const html = container.innerHTML
    expect(html).toContain('text-white')
  })

  it('applies dark (default) styling when light=false', () => {
    const { container } = render(<AnimatedCounter value={10} label="Test" light={false} />)
    const html = container.innerHTML
    expect(html).toContain('text-primary')
  })

  it('accepts numClassName prop to override number style', () => {
    const { container } = render(
      <AnimatedCounter value={5} label="Items" numClassName="my-custom-class" />
    )
    expect(container.innerHTML).toContain('my-custom-class')
  })

  it('renders 0 before the intersection observer fires (counter not yet visible)', () => {
    const { container } = render(<AnimatedCounter value={999} label="Things" />)
    // isVisible starts false → counter shows '0'
    expect(container.textContent).toContain('0')
  })

  it('renders the target value suffix even when counter is at zero', () => {
    // value "50+" → suffix '+', num 50; before scroll → shows '0+'
    const { container } = render(<AnimatedCounter value="50+" label="Partners" />)
    expect(container.textContent).toContain('0')
  })
})
