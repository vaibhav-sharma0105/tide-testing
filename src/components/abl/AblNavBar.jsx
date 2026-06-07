import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TABS = [
  { i18nKey: 'home',           label: 'Home',            to: '/resources/abl-resources',                activeSlug: 'home'            },
  { i18nKey: 'resourceCenter', label: 'Resource Center', to: '/resources/abl-resources/resource-center', activeSlug: 'resource-center' },
  { i18nKey: 'contribute',     label: 'Contribute',      to: '/resources/abl-resources/contribute',      activeSlug: 'contribute'      },
]

export default function AblNavBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const activeSlug = pathname.includes('/contribute')
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
              key={tab.i18nKey}
              to={tab.to}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors duration-150 ${
                activeSlug === tab.activeSlug
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-tide-muted hover:bg-tide-subtle hover:text-tide-text'
              }`}
            >
              {t(`abl.nav.${tab.i18nKey}`, tab.label)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
