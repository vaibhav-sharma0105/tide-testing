import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import SearchField from '../listing/SearchField'
import { FOCUS_PILL } from '../library/LibraryDropdown'

// The bar that stays under the site header while the partner list scrolls: one tab per section
// (with its count) and the name search. It is the "table of contents" of the sliders below it:
//   - the tab of the section you are reading is marked (an underline that glides between tabs);
//   - a tab jumps to its section;
//   - any number of sections fit: the tabs scroll sideways (fading at the edge) instead of
//     wrapping into uneven rows, and the marked tab is kept in view;
//   - on phones the search folds into an icon so the tabs keep the row.
// `text` = the page YAML's `directory` block.

const FADE = {
  right: '[mask-image:linear-gradient(to_right,#000_calc(100%_-_40px),transparent)]',
  left: '[mask-image:linear-gradient(to_right,transparent,#000_40px)]',
  both: '[mask-image:linear-gradient(to_right,transparent,#000_40px,#000_calc(100%_-_40px),transparent)]',
}

export default function PartnerIndexBar({ groups, activeKey, onJump, headingId, search, text, searching }) {
  const listRef = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  const [mobileSearch, setMobileSearch] = useState(false)
  const searchOpen = mobileSearch || searching

  useEffect(() => {
    const el = listRef.current
    if (!el) return undefined
    const check = () => setEdges(prev => {
      const next = { left: el.scrollLeft > 2, right: el.scrollWidth - el.clientWidth - el.scrollLeft > 2 }
      return prev.left === next.left && prev.right === next.right ? prev : next
    })
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check)
    ro?.observe(el)
    return () => { el.removeEventListener('scroll', check); ro?.disconnect() }
  }, [searchOpen])

  // Keep the marked tab in view (scrolls the tab row only, never the page).
  useEffect(() => {
    const el = listRef.current
    const tab = el?.querySelector('[aria-current="location"]')
    if (!el || !tab) return
    const left = tab.offsetLeft - el.offsetLeft
    if (left < el.scrollLeft || left + tab.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, left - 24), behavior: 'smooth' })
    }
  }, [activeKey])

  const closeSearch = () => { search.setInput(''); setMobileSearch(false) }

  return (
    <div className="sticky top-[70px] z-30 border-b border-tide-border/80 bg-tide-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-8 lg:px-0">
        {/* While searching, the results are one grid — the tabs have nothing to point at. */}
        {searching ? <div className="hidden flex-1 sm:block" /> : (
        <nav aria-label={text.jumpLabel} className={`min-w-0 flex-1 ${searchOpen ? 'hidden sm:block' : ''}`}>
          <ul ref={listRef} className={`-mb-px flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${edges.left && edges.right ? FADE.both : edges.right ? FADE.right : edges.left ? FADE.left : ''}`}>
            {groups.map(g => {
              const active = g.key === activeKey
              return (
                <li key={g.key} className="flex-none">
                  <a
                    href={`#${headingId(g.key)}`}
                    onClick={(e) => onJump(e, g.key)}
                    aria-current={active ? 'location' : undefined}
                    className={`group relative flex h-16 items-center gap-1.5 whitespace-nowrap px-3 font-body text-sm font-semibold transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 focus-visible:rounded-lg ${active ? 'text-tide-text' : 'text-tide-muted hover:text-tide-text'}`}
                  >
                    {g.label}
                    <span className={`rounded-full px-1.5 py-px text-[11px] tabular-nums transition-colors ${active ? 'bg-primary text-white' : 'bg-tide-border/60 text-tide-mutedOnLight group-hover:bg-primary-light group-hover:text-primary-dark'}`}>
                      {g.partners.length}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="partners-index-underline"
                        className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-primary"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        )}

        {/* Phones: the search opens over the tabs; wider screens: always shown. */}
        <div className={`${searchOpen ? 'flex' : 'hidden'} min-w-0 flex-1 items-center gap-2 sm:flex sm:w-64 sm:flex-none lg:w-72`}>
          <SearchField
            value={search.input}
            onChange={search.setInput}
            placeholder={text.searchPlaceholder}
            label={text.searchLabel}
            clearLabel={text.clearSearch}
            className="w-full"
            inputRef={search.inputRef}
          />
          <button type="button" onClick={closeSearch} aria-label={text.searchClose} className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-tide-muted hover:bg-white hover:text-tide-text sm:hidden ${FOCUS_PILL}`}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {!searchOpen && (
          <button
            type="button"
            onClick={() => { setMobileSearch(true); requestAnimationFrame(() => search.inputRef.current?.focus()) }}
            aria-label={text.searchOpen}
            className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border border-tide-border bg-white text-tide-text shadow-sm sm:hidden ${FOCUS_PILL}`}
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
