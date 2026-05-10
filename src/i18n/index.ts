import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import de from './locales/de.json'

const browserLng = navigator.language.split('-')[0]
const supportedLngs = ['fr', 'en', 'es', 'pt', 'de']
const lng = supportedLngs.includes(browserLng) ? browserLng : 'en'

i18n.use(initReactI18next).init({
  lng,
  fallbackLng: 'en',
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
    de: { translation: de },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
