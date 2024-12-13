import i18n from 'i18next';
import _ from 'lodash';
import { initReactI18next } from 'react-i18next';

import enCommon from './en/common.json';
import enOnboarding from './en/onboarding.json';
import frCommon from './fr/common.json';
import frOnboarding from './fr/onboarding.json';

export const defaultResources = {
  en: {
    common: enCommon,
    onboarding: enOnboarding,
  },
  fr: {
    common: frCommon,
    onboarding: frOnboarding,
  },
};

export const resources = _.cloneDeep(defaultResources);

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'onboarding'],
  resources,
});
