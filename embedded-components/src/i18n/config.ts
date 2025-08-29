import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import en_zod from 'zod-i18n-map/locales/en/zod.json';
import fr_zod from 'zod-i18n-map/locales/fr/zod.json';

import enUS_common from './en-US/common.json';
import enUS_makePayment from './en-US/make-payment.json';
import enUS_onboardingOverview from './en-US/onboarding-overview.json';
import enUS_onboarding from './en-US/onboarding.json';
import enUS_validation from './en-US/validation.json';
import frCA_common from './fr-CA/common.json';
import frCA_makePayment from './fr-CA/make-payment.json';
import frCA_onboarding from './fr-CA/onboarding.json';

export const defaultResources = {
  enUS: {
    locale: 'en-US',
    common: enUS_common,
    validation: enUS_validation,
    'onboarding-old': enUS_onboarding,
    'onboarding-overview': enUS_onboardingOverview,
    'make-payment': enUS_makePayment,
    zod: en_zod,
  },
  frCA: {
    locale: 'fr-CA',
    common: frCA_common,
    validation: enUS_validation,
    'onboarding-old': frCA_onboarding,
    'onboarding-overview': enUS_onboardingOverview,
    'make-payment': frCA_makePayment,
    zod: fr_zod,
  },
};

export const resources = JSON.parse(JSON.stringify(defaultResources));

i18n.use(initReactI18next).init({
  lng: 'enUS',
  fallbackLng: 'enUS',
  ns: ['common', 'onboarding', 'onboarding-overview', 'make-payment'],
  resources,
  interpolation: {
    escapeValue: false,
    format: (value, format) => {
      if (format === 'inc') {
        if (!Number.isNaN(Number(value))) {
          return Number(value) + 1;
        }
      }

      return value;
    },
  },
});

z.setErrorMap(zodI18nMap);

export { i18n };
