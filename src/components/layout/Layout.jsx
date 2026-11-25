import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import ErrorBoundary from '../ErrorBoundary'
import navData from '../../data/navigation.json'
import { EASE_OUT } from '../../utils/motionPresets'

// Changing page: the new page fades in quickly (0.2s) and the old one leaves almost at once, so a
// click never waits on an animation. The first page of a visit appears without any fade
// (AnimatePresence initial={false}) — motion rules in utils/motionPresets.js.
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.06 } },
}

// After a page change (not on the first page of a visit), keyboard and screen-reader focus moves to
// the new page's <h1>, so its title is read out and Tab continues from the top of the new content
// instead of from the link that was clicked (which may no longer exist). The page is lazy-loaded,
// so this waits for its <h1> (up to 3 s, then the <main> itself), and does nothing if the visitor
// has already moved focus somewhere else in the meantime.
function focusNewPage(main, from) {
  const untouched = () => document.activeElement === from || document.activeElement === document.body || !from?.isConnected
  const tryFocus = () => {
    const h1 = main.querySelector('h1')
    if (!h1) return false
    if (untouched()) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1')
      h1.focus({ preventScroll: true })
    }
    return true
  }
  if (tryFocus()) return () => {}
  const observer = new MutationObserver(() => { if (tryFocus()) stop() })
  const timer = setTimeout(() => { stop(); if (main.isConnected && untouched()) main.focus({ preventScroll: true }) }, 3000)
  function stop() { observer.disconnect(); clearTimeout(timer) }
  observer.observe(main, { childList: true, subtree: true })
  return stop
}

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const [firstPath] = useState(pathname)
  const [navigated, setNavigated] = useState(false)
  if (!navigated && pathname !== firstPath) setNavigated(true)   // React's "adjust state while rendering" pattern
  const stopFocus = useRef(() => {})
  // A new <main> mounts for each page (key = pathname). What has focus at that moment is the link
  // that was used (or <body>, if it was inside the old page). The first page of a visit is marked
  // data-first-page and left alone.
  const onMain = useCallback((el) => {
    if (!el || el.dataset.firstPage) return
    stopFocus.current()
    stopFocus.current = focusNewPage(el, document.activeElement)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-tide-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-dark focus:text-white focus:rounded-lg focus:font-body focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        {navData.skipLink}
      </a>
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main-content"
          role="main"
          tabIndex={-1}
          ref={onMain}
          data-first-page={navigated ? undefined : 'true'}
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1"
        >
          {/* One boundary per page (this <main> is keyed by address): a crash keeps the header. */}
          <ErrorBoundary inline>{children}</ErrorBoundary>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
