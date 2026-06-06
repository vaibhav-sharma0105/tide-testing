import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { label: 'Home',            to: '/resources/abl-resources',                key: 'home'            },
  { label: 'Resource Center', to: '/resources/abl-resources/resource-center', key: 'resource-center' },
  { label: 'Contribute',      to: '/resources/abl-resources/contribute',      key: 'contribute'      },
]

export default function AblNavBar() {
  const { pathname } = useLocation()

  const activeKey = pathname.includes('/contribute')
    ? 'contribute'
    : pathname.includes('/resource-center')
    ? 'resource-center'
    : 'home'

  return (
    <div className="sticky top-[70px] z-30 bg-white border-b border-tide-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <Link
              key={tab.key}
              to={tab.to}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors duration-150 ${
                activeKey === tab.key
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
