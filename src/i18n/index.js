import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { MULTILINGUAL_ENABLED } from '../config/features'

import hiTranslation from './locales/hi/translation.json'
import guTranslation from './locales/gu/translation.json'

if (!MULTILINGUAL_ENABLED) {
  localStorage.removeItem('tide-lang')
}

i18n.use(initReactI18next).init({
  resources: {
    hi: { translation: hiTranslation },
    gu: { translation: guTranslation },
  },
  lng: MULTILINGUAL_ENABLED ? (localStorage.getItem('tide-lang') || 'en') : 'en',
  // No EN resources — EN always uses the defaultValue arg in t('key', data.value).
  // HI/GU use locale files; missing keys fall through to the defaultValue too.
  fallbackLng: false,
  interpolation: { escapeValue: false },
})

export default i18n
