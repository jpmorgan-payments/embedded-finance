import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from './en/common.json';
import onboarding from './en/onboarding.json';

export const resources = {
  en: {
    common,
    onboarding,
  },
};

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'onboarding'],
  resources,
});
