import i18n from 'i18next';
import _ from 'lodash';
import { initReactI18next } from 'react-i18next';

import enUS_common from './en-US/common.json';
import enUS_onboarding from './en-US/onboarding.json';
import frCA_common from './fr-CA/common.json';
import frCA_onboarding from './fr-CA/onboarding.json';

export const defaultResources = {
  enUS: {
    locale: 'en-US',
    common: enUS_common,
    onboarding: enUS_onboarding,
  },
  frCA: {
    locale: 'fr-CA',
    common: frCA_common,
    onboarding: frCA_onboarding,
  },
};

export const resources = _.cloneDeep(defaultResources);

i18n.use(initReactI18next).init({
  lng: 'enUS',
  fallbackLng: 'enUS',
  ns: ['common', 'onboarding'],
  resources,
});
