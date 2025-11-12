/**
 * Pre-configured settings for different use cases
 *
 * Note: This file now provides React hooks for i18n-enabled configs.
 * Legacy static exports are kept for backward compatibility but should
 * be migrated to hooks.
 */

import { useTranslation } from 'react-i18next';

import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type {
  BankAccountFormConfig,
  PaymentMethodConfig,
} from './BankAccountForm.types';

/**
 * Hook to get payment method config with i18n translations
 */
export const usePaymentMethodConfig = (
  type: RoutingInformationTransactionType
): PaymentMethodConfig => {
  const { t } = useTranslation('bank-account-form');

  return {
    enabled: true,
    label: t(`paymentMethods.${type}.label`),
    shortLabel: t(`paymentMethods.${type}.shortLabel`),
    description: t(`paymentMethods.${type}.description`),
    requiredFields: {
      accountNumber: true,
      routingNumber: true,
      bankAccountType: true,
      address: type === 'WIRE',
      contacts: type === 'RTP' ? ['EMAIL'] : [],
    },
    routingValidation: {
      length: 9,
      pattern: /^\d{9}$/,
      errorMessage: t(`paymentMethods.${type}.routingError`),
    },
    helperText: t(`paymentMethods.${type}.helperText`),
  };
};

/**
 * Hook to get default payment method configurations
 */
export const useDefaultPaymentMethodConfigs = (): Record<
  RoutingInformationTransactionType,
  PaymentMethodConfig
> => {
  const achConfig = usePaymentMethodConfig('ACH');
  const wireConfig = usePaymentMethodConfig('WIRE');
  const rtpConfig = usePaymentMethodConfig('RTP');

  return {
    ACH: achConfig,
    WIRE: wireConfig,
    RTP: rtpConfig,
  };
};

/**
 * Hook to get linked account configuration with i18n
 *
 * Use this hook in components that need linked account form configuration.
 * The configuration will be properly translated based on the current locale.
 */
export const useLinkedAccountConfig = (): BankAccountFormConfig => {
  const { t } = useTranslation('bank-account-form');
  const defaultConfigs = useDefaultPaymentMethodConfigs();

  return {
    useCase: 'LINKED_ACCOUNT',
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      configs: {
        ACH: {
          ...defaultConfigs.ACH,
          locked: true, // Cannot be deselected for linked accounts
        },
        WIRE: {
          ...defaultConfigs.WIRE,
        },
        RTP: {
          ...defaultConfigs.RTP,
        },
      },
      allowMultiple: true,
      defaultSelected: ['ACH'],
    },
    accountHolder: {
      allowIndividual: true,
      allowOrganization: true,
      defaultType: 'INDIVIDUAL',
    },
    requiredFields: {
      certification: true,
    },
    content: {
      title: t('linkedAccount.title'),
      description: t('linkedAccount.description'),
      successTitle: t('linkedAccount.successTitle'),
      successDescription: t('linkedAccount.successDescription'),
      submitButtonText: t('linkedAccount.submitButton'),
      cancelButtonText: t('linkedAccount.cancelButton'),
      loadingMessage: t('linkedAccount.loadingMessage'),
      sections: {
        accountHolderType: t('sections.accountHolderType'),
        accountHolderInfo: t('sections.accountHolderInfo'),
        bankAccountDetails: t('sections.bankAccountDetails'),
        paymentMethods: t('sections.paymentMethods'),
        addressInfo: t('sections.addressInfo'),
        contactInfo: t('sections.contactInfo'),
      },
      certificationText: t('linkedAccount.certificationText'),
    },
  };
};

/**
 * Hook to get linked account edit configuration with i18n
 *
 * Use this hook in components that need to edit existing linked accounts.
 */
export const useLinkedAccountEditConfig = (): BankAccountFormConfig => {
  const { t } = useTranslation('bank-account-form');
  const defaultConfigs = useDefaultPaymentMethodConfigs();

  return {
    useCase: 'LINKED_ACCOUNT',
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      configs: {
        ACH: {
          ...defaultConfigs.ACH,
          locked: true, // Cannot be deselected for linked accounts
        },
        WIRE: {
          ...defaultConfigs.WIRE,
        },
        RTP: {
          ...defaultConfigs.RTP,
        },
      },
      allowMultiple: true,
      defaultSelected: ['ACH'],
    },
    accountHolder: {
      allowIndividual: true,
      allowOrganization: true,
      defaultType: 'INDIVIDUAL',
    },
    requiredFields: {
      certification: false, // No certification needed when editing
    },
    readonlyFields: {
      accountType: true,
      firstName: true,
      lastName: true,
      businessName: true,
      accountNumber: true,
      bankAccountType: true,
    },
    content: {
      title: t('linkedAccountEdit.title'),
      description: t('linkedAccountEdit.description'),
      successTitle: t('linkedAccountEdit.successTitle'),
      successDescription: t('linkedAccountEdit.successDescription'),
      submitButtonText: t('linkedAccountEdit.submitButton'),
      cancelButtonText: t('linkedAccountEdit.cancelButton'),
      loadingMessage: t('linkedAccountEdit.loadingMessage'),
      sections: {
        accountHolderType: t('sections.accountHolderType'),
        accountHolderInfo: t('sections.accountHolderInfo'),
        bankAccountDetails: t('sections.bankAccountDetails'),
        paymentMethods: t('sections.paymentMethods'),
        addressInfo: t('sections.addressInfo'),
        contactInfo: t('sections.contactInfo'),
      },
      certificationText: '', // Not used when certification is false
    },
  };
};

/**
 * Hook to get recipient configuration with i18n
 *
 * Use this hook in components that need to create new payment recipients.
 */
export const useRecipientConfig = (): BankAccountFormConfig => {
  const { t } = useTranslation('bank-account-form');
  const defaultConfigs = useDefaultPaymentMethodConfigs();

  return {
    useCase: 'RECIPIENT',
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      configs: {
        ACH: {
          ...defaultConfigs.ACH,
        },
        WIRE: {
          ...defaultConfigs.WIRE,
        },
        RTP: {
          ...defaultConfigs.RTP,
        },
      },
      allowMultiple: true,
      defaultSelected: ['ACH'],
    },
    accountHolder: {
      allowIndividual: true,
      allowOrganization: true,
      defaultType: 'INDIVIDUAL',
    },
    requiredFields: {
      certification: false,
    },
    content: {
      title: t('recipient.title'),
      description: t('recipient.description'),
      successTitle: t('recipient.successTitle'),
      successDescription: t('recipient.successDescription'),
      submitButtonText: t('recipient.submitButton'),
      cancelButtonText: t('recipient.cancelButton'),
      loadingMessage: t('recipient.loadingMessage'),
      sections: {
        accountHolderType: t('recipient.sections.accountHolderType'),
        accountHolderInfo: t('recipient.sections.accountHolderInfo'),
        bankAccountDetails: t('sections.bankAccountDetails'),
        paymentMethods: t('sections.paymentMethods'),
        addressInfo: t('sections.addressInfo'),
        contactInfo: t('sections.contactInfo'),
      },
    },
  };
};

/**
 * Helper function to create a custom config by merging with defaults
 */
export function createCustomConfig(
  baseConfig: BankAccountFormConfig,
  overrides: Partial<BankAccountFormConfig>
): BankAccountFormConfig {
  return {
    ...baseConfig,
    ...overrides,
    paymentMethods: {
      ...baseConfig.paymentMethods,
      ...overrides.paymentMethods,
      configs: {
        ...baseConfig.paymentMethods.configs,
        ...overrides.paymentMethods?.configs,
      },
    },
    accountHolder: {
      ...baseConfig.accountHolder,
      ...overrides.accountHolder,
    },
    requiredFields: {
      ...baseConfig.requiredFields,
      ...overrides.requiredFields,
    },
    content: {
      ...baseConfig.content,
      ...overrides.content,
      sections: {
        ...baseConfig.content.sections,
        ...overrides.content?.sections,
      },
      fieldLabels: {
        ...baseConfig.content.fieldLabels,
        ...overrides.content?.fieldLabels,
      },
    },
  };
}
