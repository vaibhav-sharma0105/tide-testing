import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'button, a[href], iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Standard modal focus behavior: when `active` becomes truthy, remembers
 * whatever was focused beforehand and moves focus into the dialog; while
 * active, Tab/Shift+Tab cycles within the dialog instead of escaping into
 * the page behind it; when `active` becomes falsy again (or the component
 * unmounts), returns focus to whatever was focused before the dialog opened.
 *
 * Pass a component that's always mounted but conditionally shows a dialog
 * (e.g. `id &&` inside JSX) its truthy/falsy condition as `active` directly
 * — for a component that's conditionally MOUNTED instead, `active` can just
 * be `true`, since mount itself is the open signal.
 */
export function useFocusTrap(active = true) {
  const containerRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    previouslyFocused.current = document.activeElement
    const container = containerRef.current
    if (!container) return undefined

    const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    getFocusable()[0]?.focus()

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [active])

  return containerRef
}
