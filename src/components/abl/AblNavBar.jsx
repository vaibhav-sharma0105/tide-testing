import { Link, useLocation } from 'react-router-dom'
import ablData from '../../data/abl-home.json'

const TABS = [
  { label: ablData.nav.home,   to: '/pramaan',                   activeSlug: 'home'            },
  { label: ablData.nav.resourceCenter,  to: '/pramaan/resource-centre',   activeSlug: 'resource-centre' },
  { label: ablData.nav.contribute,       to: '/pramaan/contribute',         activeSlug: 'contribute'      },
]

export default function AblNavBar() {
  const { pathname } = useLocation()

  const activeSlug = pathname.includes('/contribute')
    ? 'contribute'
    : pathname.includes('/resource-centre') || pathname.includes('/resource-center')
    ? 'resource-centre'
    : 'home'

  // Phones (portrait): the three tabs share the width equally, a long label wraps to two lines,
  // so nothing is hidden off-screen. From sm up: a row of pills as before.
  // Short screens (phones held sideways, max-height 500px): the bar scrolls away with the page
  // instead of sticking under the fixed header, so the content keeps most of the screen.
  return (
    <div data-sticky-subnav="tall-only" className="sticky top-[70px] z-30 bg-white border-b border-tide-border shadow-sm [@media(max-height:500px)]:static">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-3 gap-1.5 py-2 sm:flex sm:items-center sm:gap-1">
          {TABS.map(tab => (
            <Link
              key={tab.activeSlug}
              to={tab.to}
              aria-current={activeSlug === tab.activeSlug ? 'page' : undefined}
              className={`hit-44 relative flex min-h-[40px] items-center justify-center rounded-lg px-2 py-1.5 text-center text-[13px] leading-tight font-body font-medium transition-colors duration-150 sm:flex-shrink-0 sm:px-4 sm:py-2 sm:text-sm ${
                activeSlug === tab.activeSlug
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
