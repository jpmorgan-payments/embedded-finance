import i18n, { createInstance } from 'i18next';
import { cloneDeep } from 'lodash';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import en_zod from 'zod-i18n-map/locales/en/zod.json';
import fr_zod from 'zod-i18n-map/locales/fr/zod.json';

import type { EBConfig } from '@/core/EBComponentsProvider/config.types';

import enUS_bankAccountForm from './en-US/bank-account-form.json';
import enUS_common from './en-US/common.json';
import enUS_linkedAccounts from './en-US/linked-accounts.json';
import enUS_makePayment from './en-US/make-payment.json';
import enUS_onboardingOverview from './en-US/onboarding-overview.json';
import enUS_onboarding from './en-US/onboarding.json';
import enUS_transactions from './en-US/transactions.json';
import enUS_validation from './en-US/validation.json';
import frCA_bankAccountForm from './fr-CA/bank-account-form.json';
import frCA_common from './fr-CA/common.json';
import frCA_linkedAccounts from './fr-CA/linked-accounts.json';
import frCA_makePayment from './fr-CA/make-payment.json';
import frCA_onboarding from './fr-CA/onboarding.json';
import frCA_transactions from './fr-CA/transactions.json';

export const defaultResources = {
  enUS: {
    locale: 'en-US',
    common: enUS_common,
    validation: enUS_validation,
    'onboarding-old': enUS_onboarding,
    'onboarding-overview': enUS_onboardingOverview,
    'make-payment': enUS_makePayment,
    'linked-accounts': enUS_linkedAccounts,
    'bank-account-form': enUS_bankAccountForm,
    transactions: enUS_transactions,
    zod: en_zod,
  },
  frCA: {
    locale: 'fr-CA',
    common: frCA_common,
    validation: enUS_validation,
    'onboarding-old': frCA_onboarding,
    'onboarding-overview': enUS_onboardingOverview,
    'make-payment': frCA_makePayment,
    'linked-accounts': frCA_linkedAccounts,
    'bank-account-form': frCA_bankAccountForm,
    transactions: frCA_transactions,
    zod: fr_zod,
  },
};

export const resources = cloneDeep(defaultResources);

/**
 * Global i18n instance - LEGACY
 *
 * ⚠️ This global instance is maintained for backward compatibility.
 *
 * For new code, prefer using:
 * - `useTranslation()` hook in React components (uses provider-scoped instance)
 * - `createI18nInstance()` for creating isolated instances
 *
 * This global instance should only be used in:
 * - Utility functions outside React components
 * - Legacy code that hasn't been migrated yet
 * - Test setup
 */
i18n.use(initReactI18next).init({
  lng: 'enUS',
  fallbackLng: 'enUS',
  ns: [
    'common',
    'onboarding',
    'onboarding-overview',
    'make-payment',
    'linked-accounts',
    'bank-account-form',
    'transactions',
  ],
  resources,
  interpolation: {
    escapeValue: false,
    format: (value, format, lng) => {
      if (format === 'inc') {
        if (!Number.isNaN(Number(value))) {
          return Number(value) + 1;
        }
      }

      // Format dateOnly as date without time
      if (format === 'dateOnly' && value instanceof Date) {
        const locale =
          (lng &&
            defaultResources[lng as keyof typeof defaultResources]?.locale) ||
          'en-US';
        return value.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      return value;
    },
  },
});

z.setErrorMap(zodI18nMap);

export { i18n };

/**
 * Creates a provider-scoped i18n instance to avoid global state pollution.
 * This ensures that each EBComponentsProvider has its own isolated i18n configuration,
 * preventing issues with multiple providers or route transitions.
 *
 * @param contentTokens - Custom content tokens to override default translations
 * @returns A new i18n instance configured with default resources and custom tokens
 */
export const createI18nInstance = (
  contentTokens: EBConfig['contentTokens']
) => {
  const instance = createInstance();

  instance.use(initReactI18next).init({
    lng: contentTokens?.name || 'enUS',
    fallbackLng: 'enUS',
    ns: [
      'common',
      'validation',
      'onboarding-old',
      'onboarding-overview',
      'make-payment',
      'linked-accounts',
      'bank-account-form',
      'transactions',
    ],
    // Deep clone to avoid mutating the original defaults
    resources: cloneDeep(defaultResources),
    interpolation: {
      escapeValue: false,
      format: (value: any, format?: any, lng?: any) => {
        if (format === 'inc') {
          if (!Number.isNaN(Number(value))) {
            return Number(value) + 1;
          }
        }

        // Format dateOnly as date without time
        if (format === 'dateOnly' && value instanceof Date) {
          const locale =
            (lng &&
              defaultResources[lng as keyof typeof defaultResources]?.locale) ||
            'en-US';
          return value.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }

        return value;
      },
    },
  });

  // Apply custom tokens ONLY to this instance
  if (contentTokens?.tokens) {
    Object.keys(defaultResources).forEach((langKey) => {
      const lang = langKey as keyof typeof defaultResources;
      Object.keys(defaultResources[lang]).forEach((namespace) => {
        const ns = namespace as keyof (typeof defaultResources)[typeof lang];
        if (contentTokens.tokens?.[ns]) {
          instance.addResourceBundle(
            lang,
            ns,
            contentTokens.tokens[ns],
            true, // deep merge
            true // overwrite
          );
        }
      });
    });
  }

  return instance;
};
