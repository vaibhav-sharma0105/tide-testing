import { useState, useEffect, useRef, useId } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, ChevronRight, Heart } from 'lucide-react'

import navData from '../../data/navigation.json'
import { activeTopIndex, activeLeaf } from '../../utils/navActive'

/* ── Nested group inside a dropdown (third menu level) ─────────────────── */
// A button that opens a small sub-menu to the right. Mouse: hover opens. Keyboard: Enter, Space
// or → opens it and focuses the first link; ↑ ↓ Home End move; ← or Esc closes it and returns
// focus to the button (Esc does not also close the outer dropdown); leaving it closes it.
function SubGroup({ item, onClose, currentLeaf }) {
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const pendingFocus = useRef(null)
  const id = useId()

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open || pendingFocus.current === null) return
    listRef.current?.querySelectorAll('a')[pendingFocus.current]?.focus()
    pendingFocus.current = null
  }, [open])

  const close = (refocus) => { setOpen(false); if (refocus) buttonRef.current?.focus() }

  const onButtonKeyDown = (e) => {
    if (['Enter', ' ', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      if (open && e.key !== 'ArrowRight') close(false)
      else if (open) listRef.current?.querySelector('a')?.focus()
      else { pendingFocus.current = 0; setOpen(true) }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault(); e.stopPropagation(); close(true)
    }
  }
  const onListKeyDown = (e) => {
    const links = [...(listRef.current?.querySelectorAll('a') ?? [])]
    const i = links.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); links[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); links[links.length - 1]?.focus() }
    else if (e.key === 'ArrowLeft' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true) }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 100) }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onButtonKeyDown}
        className="group flex w-[calc(100%-1rem)] items-start gap-3 px-4 py-3 mx-2 rounded-xl text-left hover:bg-primary-faint transition-colors duration-150"
      >
        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary flex-shrink-0 transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-body font-semibold text-tide-text group-hover:text-primary-dark transition-colors leading-tight">
            {item.label}
          </div>
          {item.desc && (
            <div className="text-xs font-body text-tide-muted mt-0.5 leading-snug">{item.desc}</div>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-tide-muted mt-1.5 flex-shrink-0" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            id={id}
            initial={{ opacity: 0, x: -8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            role="menu"
            aria-label={item.label}
            onKeyDown={onListKeyDown}
            className="absolute left-full top-0 ml-2 w-64 bg-white rounded-2xl shadow-float border border-tide-border/60 py-2 z-50 overflow-hidden"
          >
            <div className="absolute top-0 left-4 right-4 h-[3px] rounded-full gradient-primary-soft pointer-events-none" />
            {item.subItems.map(sub => (
              <Link
                key={sub.to}
                to={sub.to}
                onClick={onClose}
                role="menuitem"
                aria-current={sub.to === currentLeaf ? 'page' : undefined}
                className="group flex items-start gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-primary-faint transition-colors duration-150"
              >
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary flex-shrink-0 transition-colors" />
                <div>
                  <div className="text-sm font-body font-semibold text-tide-text group-hover:text-primary-dark transition-colors leading-tight">
                    {sub.label}
                  </div>
                  {sub.desc && (
                    <div className="text-xs font-body text-tide-muted mt-0.5 leading-snug">{sub.desc}</div>
                  )}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Dropdown ──────────────────────────────────────────────────────────── */
// A disclosure list of links (not an ARIA menu: these are page links reached with Tab). The nested
// "Our Publications" group inside it is a small menu of its own (SubGroup, with arrow keys).
function Dropdown({ id, items, onClose, currentLeaf }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-float border border-tide-border/60 py-2 z-50 overflow-visible"
    >
      {/* top accent bar */}
      <div className="absolute top-0 left-4 right-4 h-[3px] rounded-full gradient-primary-soft pointer-events-none" />

      {items.map((item) =>
        item.subItems ? (
          <SubGroup key={item.label} item={item} onClose={onClose} currentLeaf={currentLeaf} />
        ) : (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClose}
            aria-current={item.to === currentLeaf ? 'page' : undefined}
            className="group flex items-start gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-primary-faint transition-colors duration-150"
          >
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary flex-shrink-0 transition-colors" />
            <div>
              <div className="text-sm font-body font-semibold text-tide-text group-hover:text-primary-dark transition-colors leading-tight">
                {item.label}
              </div>
              {item.desc && (
                <div className="text-xs font-body text-tide-muted mt-0.5 leading-snug">{item.desc}</div>
              )}
            </div>
          </Link>
        )
      )}
    </motion.div>
  )
}

/* ── Header ────────────────────────────────────────────────────────────── */
export default function Header() {
  const location = useLocation()
  const [scrolled, setScrolled]       = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [mobileSubExpanded, setMobileSubExpanded] = useState(null)
  const [prevLocation, setPrevLocation] = useState(location)
  const leaveTimer = useRef(null)
  const hamburgerRef = useRef(null)

  /* close on route change */
  if (location !== prevLocation) {
    setPrevLocation(location)
    setMobileOpen(false)
    setOpenDropdown(null)
    setMobileExpanded(null)
    setMobileSubExpanded(null)
  }

  /* scroll detection */
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      setScrolled(y > 20)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const nav = navData.items

  const handleMouseEnter = (idx) => {
    clearTimeout(leaveTimer.current)
    setOpenDropdown(idx)
  }
  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setOpenDropdown(null), 100)
  }
  // The dropdown trigger button previously had no onClick at all — it only
  // opened via onMouseEnter on the parent div, which means a keyboard user
  // tabbing to it (or any non-mouse interaction) could not open it at all,
  // despite the correct-looking aria-expanded/aria-haspopup/aria-controls.
  const toggleDropdown = (idx) => setOpenDropdown(prev => (prev === idx ? null : idx))
  const closeDropdownOnEscape = (e, idx) => {
    if (e.key === 'Escape' && openDropdown === idx) {
      setOpenDropdown(null)
      e.currentTarget.querySelector('button')?.focus()
    }
  }

  /* which entry is active? (most specific match only — see activeTopIndex / activeLeaf) */
  const activeIdx = activeTopIndex(nav, location.pathname)
  const currentLeaf = activeLeaf(nav, location.pathname)
  const isActive = (item) => nav.indexOf(item) === activeIdx

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-tide-border/60 shadow-nav'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-[70px] flex items-center justify-between gap-6">

        {/* ── Logo ───────────────────────────────────────────────────── */}
        {/* No aria-label override — the image's alt + visible "TIDE
            Foundation" text already form a clear, correct accessible name.
            An explicit aria-label here previously replaced that with "Go to
            homepage", which shares no text with what's visibly shown
            (WCAG 2.5.3 Label in Name violation, flagged by Lighthouse). */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}${navData.logo}`}
              alt={navData.logoAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="leading-none">
            <div className={`font-display font-bold text-base leading-none transition-colors duration-300 ${scrolled ? 'text-tide-text' : 'text-white'}`}>
              {navData.brandName}
            </div>
            <div className={`font-body text-[11px] mt-0.5 tracking-wide transition-colors duration-300 ${scrolled ? 'text-tide-muted' : 'text-white/70'}`}>
              {navData.brandSuffix}
            </div>
          </div>
        </Link>

        {/* ── Desktop Nav ────────────────────────────────────────────── */}
        <nav aria-label={navData.ariaMain} className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {nav.map((item, idx) => (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => item.children && handleMouseEnter(idx)}
              onMouseLeave={item.children ? handleMouseLeave : undefined}
              onKeyDown={item.children ? (e) => closeDropdownOnEscape(e, idx) : undefined}
            >
              {item.to ? (
                <Link
                  to={item.to}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={`hit-44 relative px-3.5 py-2 text-sm font-body font-medium rounded-lg flex items-center gap-1 transition-colors duration-200 ${
                    isActive(item)
                      ? scrolled ? 'text-primary-dark' : 'text-white font-semibold'
                      : scrolled ? 'text-tide-muted hover:text-tide-text' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive(item) && scrolled && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleDropdown(idx)}
                  aria-expanded={openDropdown === idx}
                  aria-controls={`dropdown-${idx}`}
                  className={`hit-44 relative px-3.5 py-2 text-sm font-body font-medium rounded-lg flex items-center gap-1 transition-colors duration-200 ${
                    isActive(item)
                      ? scrolled ? 'text-primary-dark' : 'text-white font-semibold'
                      : scrolled ? 'text-tide-muted hover:text-tide-text' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${openDropdown === idx ? 'rotate-180' : ''}`} />
                  {isActive(item) && scrolled && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              )}
              <AnimatePresence>
                {item.children && openDropdown === idx && (
                  <Dropdown id={`dropdown-${idx}`} items={item.children} onClose={() => setOpenDropdown(null)} currentLeaf={currentLeaf} />
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* ── Right side ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link
            to="/get-involved/donate"
            className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-body font-semibold rounded-full
                       gradient-accent text-tide-text shadow-sm hover:shadow-glow-amber hover:scale-[1.03]
                       transition-all duration-200"
          >
            <Heart className="w-3.5 h-3.5" />
            {navData.donateLabel}
          </Link>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-tide-text hover:bg-tide-subtle' : 'text-white hover:bg-white/10'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={navData.menuToggleLabel}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen
                ? <motion.div key="x"    initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 45, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setMobileOpen(false)
                hamburgerRef.current?.focus()
              }
            }}
            className="lg:hidden bg-white border-t border-tide-border overflow-hidden shadow-float"
          >
            <div className="px-4 py-5 space-y-1 max-h-[78vh] overflow-y-auto">
              {nav.map((item, idx) => (
                <div key={idx}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-body font-medium transition-colors ${
                        isActive(item)
                          ? 'bg-primary-faint text-primary-dark font-semibold'
                          : 'text-tide-text hover:bg-tide-subtle'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
                        aria-expanded={mobileExpanded === idx}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-body font-semibold text-tide-text hover:bg-tide-subtle transition-colors"
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 text-tide-muted transition-transform duration-200 ${mobileExpanded === idx ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileExpanded === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pb-1 space-y-0.5">
                              {item.children.map((child) => (
                                <div key={child.to ?? child.label}>
                                  {child.subItems ? (
                                    /* Nested group: a button that shows its links underneath */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setMobileSubExpanded(mobileSubExpanded === child.label ? null : child.label)}
                                        aria-expanded={mobileSubExpanded === child.label}
                                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-body text-left transition-colors ${
                                          child.subItems.some(sub => sub.to === currentLeaf)
                                            ? 'text-primary-dark font-semibold'
                                            : 'text-tide-muted hover:text-tide-text hover:bg-tide-subtle'
                                        }`}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-current opacity-50 flex-shrink-0" />
                                        <span className="flex-1">{child.label}</span>
                                        <ChevronDown className={`w-4 h-4 text-tide-muted transition-transform duration-200 ${mobileSubExpanded === child.label ? 'rotate-180' : ''}`} aria-hidden="true" />
                                      </button>
                                      <AnimatePresence>
                                        {mobileSubExpanded === child.label && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="pl-6 pb-1 space-y-0.5">
                                              {child.subItems.map(sub => (
                                                <Link
                                                  key={sub.to}
                                                  to={sub.to}
                                                  aria-current={sub.to === currentLeaf ? 'page' : undefined}
                                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body transition-colors ${
                                                    sub.to === currentLeaf
                                                      ? 'text-primary-dark font-semibold bg-primary-faint'
                                                      : 'text-tide-muted hover:text-tide-text hover:bg-tide-subtle'
                                                  }`}
                                                >
                                                  <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                                                  {sub.label}
                                                </Link>
                                              ))}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </>
                                  ) : (
                                    <Link
                                      to={child.to}
                                      aria-current={child.to === currentLeaf ? 'page' : undefined}
                                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-body transition-colors ${
                                        child.to === currentLeaf
                                          ? 'text-primary-dark font-semibold bg-primary-faint'
                                          : 'text-tide-muted hover:text-tide-text hover:bg-tide-subtle'
                                      }`}
                                    >
                                      <span className="w-1 h-1 rounded-full bg-current opacity-50 flex-shrink-0" />
                                      {child.label}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-tide-border mt-2">
                <Link
                  to="/get-involved/donate"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-body font-semibold
                             gradient-accent text-tide-text rounded-full shadow-sm"
                >
                  <Heart className="w-4 h-4" /> {navData.donateMobileLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
