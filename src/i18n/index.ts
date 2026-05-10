import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const browserLng = navigator.language.split('-')[0]
const supportedLngs = ['fr', 'en']
const lng = supportedLngs.includes(browserLng) ? browserLng : 'fr'

i18n.use(initReactI18next).init({
  lng,
  fallbackLng: 'fr',
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
