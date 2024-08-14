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
    debug: true,
    detection: {
      order: ['localStorage', 'navigator'],
      convertDetectedLanguage: (lng: string) => (lng.includes('-') ? lng.split('-')[0] : lng),
    },
    supportedLngs: ['zh', 'en'],

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
