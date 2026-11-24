import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'button, a[href], iframe, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'

// Open traps, newest last: only the topmost one acts (a video player opened over a fellow's profile
// must keep focus, and the profile underneath must not pull it back).
const stack = []

// A control Tab can actually reach: not disabled, not hidden from assistive tech, not inert, and
// rendered (checkVisibility where the browser has it; jsdom and older Safari count everything).
function usable(el) {
  if (el.disabled || el.getAttribute('tabindex') === '-1') return false
  if (el.closest('[aria-hidden="true"], [inert]')) return false
  return typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true
}

/**
 * Standard modal focus behavior: when `active` becomes truthy, remembers
 * whatever was focused beforehand and moves focus into the dialog; while
 * active, Tab/Shift+Tab cycles within the dialog instead of escaping into
 * the page behind it; when `active` becomes falsy again (or the component
 * unmounts), returns focus to whatever was focused before the dialog opened.
 *
 * Focus that still lands outside (for example when Tab leaves a cross-origin
 * video iframe, whose key presses the page never sees) is brought back in.
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
    const token = {}
    stack.push(token)
    const isTop = () => stack[stack.length - 1] === token

    const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(usable)
    getFocusable()[0]?.focus()
    let backwards = false

    function handleKeyDown(e) {
      if (e.key !== 'Tab' || !isTop()) return
      backwards = e.shiftKey
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      // Wrap at the ends, and also from anything focused that is not in the list (a heading
      // focused on open, a control that just became disabled), so Tab never walks out.
      if (e.shiftKey && (current === first || !items.includes(current))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (current === last || !items.includes(current))) {
        e.preventDefault()
        first.focus()
      }
    }

    function handleFocusIn(e) {
      if (!isTop() || container.contains(e.target)) return
      const items = getFocusable()
      ;(backwards ? items[items.length - 1] : items[0])?.focus()
    }

    container.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      stack.splice(stack.indexOf(token), 1)
      previouslyFocused.current?.focus?.({ preventScroll: true })   // the page must not jump or glide as the dialog closes
    }
  }, [active])

  return containerRef
}
