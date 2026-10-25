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

  return (
    <div className="sticky top-[70px] z-30 bg-white border-b border-tide-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <Link
              key={tab.activeSlug}
              to={tab.to}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors duration-150 ${
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
