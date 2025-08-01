import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

void i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
    },
    supportedLngs: ['zh', 'en'],

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
