import { render, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

function Dialog({ active = true, children }) {
  const ref = useFocusTrap(active)
  return <div ref={ref} data-testid="dialog">{children}</div>
}

function Page({ open: initial = false, inner = false }) {
  const [open, setOpen] = useState(initial)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>opener</button>
      <button type="button">outside</button>
      {open && (
        <Dialog>
          <h2 tabIndex={-1}>title</h2>
          <button type="button">first</button>
          <button type="button" disabled>disabled</button>
          <button type="button">last</button>
          <button type="button" aria-hidden="true" tabIndex={-1}>hidden</button>
          <button type="button" onClick={() => setOpen(false)}>close</button>
          {inner && <Dialog><button type="button">inner</button></Dialog>}
        </Dialog>
      )}
    </>
  )
}

const tab = (shift = false) => fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: shift })
const byText = (t) => [...document.querySelectorAll('button, h2')].find((b) => b.textContent === t)

describe('useFocusTrap', () => {
  it('moves focus to the first usable control when it opens', () => {
    const { getByText } = render(<Page />)
    getByText('opener').focus()
    fireEvent.click(getByText('opener'))
    expect(document.activeElement).toBe(byText('first'))
  })

  it('wraps Tab from the last usable control to the first, and Shift+Tab back', () => {
    render(<Page open />)
    byText('close').focus()
    tab()
    expect(document.activeElement).toBe(byText('first'))
    tab(true)
    expect(document.activeElement).toBe(byText('close'))
  })

  it('skips disabled and aria-hidden controls when finding the ends', () => {
    render(<Page open />)
    // "close" is the last usable control: the aria-hidden button after "last" is not counted.
    byText('last').focus()
    tab()
    // not wrapped: the browser moves on to "close" by itself (no preventDefault here)
    expect(document.activeElement).toBe(byText('last'))
  })

  it('wraps from a focused element that is not in the tab order (a heading with tabindex=-1)', () => {
    render(<Page open />)
    act(() => byText('title').focus())
    tab(true)
    expect(document.activeElement).toBe(byText('close'))
  })

  it('pulls focus back inside when it lands outside (e.g. leaving an iframe)', () => {
    render(<Page open />)
    act(() => byText('outside').focus())
    expect(document.activeElement).toBe(byText('first'))
  })

  it('only the topmost of two open dialogs acts', () => {
    // The inner one opens later (as the video player opens over a fellow's profile).
    const { rerender } = render(<Page open />)
    rerender(<Page open inner />)
    expect(document.activeElement).toBe(byText('inner'))
    act(() => byText('outside').focus())
    expect(document.activeElement).toBe(byText('inner'))
  })

  it('returns focus to the opener when it closes', () => {
    const { getByText } = render(<Page />)
    getByText('opener').focus()
    fireEvent.click(getByText('opener'))
    fireEvent.click(byText('close'))
    expect(document.activeElement).toBe(getByText('opener'))
  })
})
