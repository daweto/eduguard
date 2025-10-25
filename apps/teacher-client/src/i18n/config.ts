import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/es/common.json';
import enrollment from './locales/es/enrollment.json';
import roster from './locales/es/roster.json';
import navigation from './locales/es/navigation.json';
import errors from './locales/es/errors.json';
import guardians from './locales/es/guardians.json';

const resources = {
  es: {
    common,
    enrollment,
    roster,
    navigation,
    errors,
    guardians,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
