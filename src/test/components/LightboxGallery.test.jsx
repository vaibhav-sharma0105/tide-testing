import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LightboxGallery from '../../components/ui/LightboxGallery'

const images = [
  { src: 'assets/images/a.jpg', label: 'First' },
  { src: 'assets/images/b.jpg', label: 'Second' },
  { src: 'assets/images/c.jpg', label: 'Third' },
]

function setup(props = {}) {
  return render(
    <LightboxGallery
      images={images}
      gridClassName="grid-x"
      itemClassName="item-x"
      ringClassName="ring-x"
      spanClassName={(i) => (i === 0 ? 'span-first' : 'span-rest')}
      itemMotion={() => ({})}
      {...props}
    >
      {(grid) => <section data-testid="sec">{grid}</section>}
    </LightboxGallery>
  )
}

describe('LightboxGallery', () => {
  it('renders the grid inside the children wrapper with one button per image', () => {
    setup()
    const grid = screen.getByTestId('sec').firstChild
    expect(grid).toHaveClass('grid-x')
    expect(grid.children).toHaveLength(3)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('builds the button class string in the original order', () => {
    setup()
    const [first, second] = screen.getAllByRole('button')
    expect(first.className).toBe('item-x cursor-zoom-in focus:outline-none focus-visible:ring-2 ring-x span-first')
    expect(second.className).toBe('item-x cursor-zoom-in focus:outline-none focus-visible:ring-2 ring-x span-rest')
  })

  it('omits the trailing span class when spanClassName is not given', () => {
    setup({ spanClassName: undefined })
    expect(screen.getAllByRole('button')[0].className).toBe('item-x cursor-zoom-in focus:outline-none focus-visible:ring-2 ring-x')
  })

  it('lazy-loads thumbnails and picks the hover duration class', () => {
    setup({ hoverDuration: 500 })
    const img = screen.getByAltText('First')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img.className).toContain('duration-500')
  })

  it('renders no dialog while closed and opens it as a sibling after the wrapper', () => {
    const { container } = setup()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByAltText('Second').closest('button'))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByTestId('sec')).not.toContainElement(dialog)
    expect(container.lastChild).toBe(dialog)
  })
})
