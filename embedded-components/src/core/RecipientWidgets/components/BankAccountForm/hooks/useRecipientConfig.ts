import { useTranslation } from 'react-i18next';

import type { BankAccountFormConfig } from '../BankAccountForm.types';
import { useDefaultPaymentMethodConfigs } from './useDefaultPaymentMethodConfigs';

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
