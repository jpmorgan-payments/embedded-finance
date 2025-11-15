import { useTranslation } from 'react-i18next';

import type { BankAccountFormConfig } from '../BankAccountForm.types';
import { useDefaultPaymentMethodConfigs } from './useDefaultPaymentMethodConfigs';

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
