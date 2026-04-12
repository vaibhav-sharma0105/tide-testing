import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'gu', label: 'ગુ' },
]

export default function LanguageSwitcher({ light = false }) {
  const { i18n } = useTranslation()

  const change = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('tide-lang', code)
  }

  return (
    <div className={`flex items-center gap-0.5 rounded-full px-1 py-1 transition-all duration-300 ${
      light
        ? 'border border-white/25 bg-white/10 backdrop-blur-sm'
        : 'border border-tide-border bg-tide-surface'
    }`}>
      {LANGS.map((lang) => {
        const active = i18n.language === lang.code || i18n.language?.startsWith(lang.code)
        return (
          <button
            key={lang.code}
            onClick={() => change(lang.code)}
            className={`px-2.5 py-1 text-xs font-body font-semibold rounded-full transition-all duration-200 ${
              active
                ? light
                  ? 'bg-white text-primary shadow-sm'
                  : 'bg-primary text-white shadow-sm'
                : light
                  ? 'text-white/70 hover:text-white'
                  : 'text-tide-muted hover:text-tide-text'
            }`}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}
