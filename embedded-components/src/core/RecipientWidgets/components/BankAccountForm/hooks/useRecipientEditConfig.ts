import { useTranslation } from 'react-i18next';

import type { BankAccountFormConfig } from '../BankAccountForm.types';
import { useDefaultPaymentMethodConfigs } from './useDefaultPaymentMethodConfigs';

/**
 * Hook to get recipient edit configuration with i18n
 *
 * Use this hook in components that need to edit existing payment recipients.
 */
export const useRecipientEditConfig = (): BankAccountFormConfig => {
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
      defaultSelected: [], // No auto-selection for editing recipients - preserves existing methods
    },
    accountHolder: {
      allowIndividual: true,
      allowOrganization: true,
      defaultType: 'INDIVIDUAL',
      prefillFromClient: false, // In edit mode, use recipient data, not client data
    },
    requiredFields: {
      certification: false, // No certification needed when editing
    },
    readonlyFields: {
      // Allow editing most fields for recipients
      accountType: false,
      firstName: false,
      lastName: false,
      businessName: false,
      accountNumber: false,
      bankAccountType: false,
    },
    content: {
      submitButtonText: t('recipientEdit.submitButton'),
      cancelButtonText: t('recipientEdit.cancelButton'),
      loadingMessage: t('recipientEdit.loadingMessage'),
      sections: {
        accountHolderType: t('recipientEdit.sections.accountHolderType'),
        accountHolderInfo: t('recipientEdit.sections.accountHolderInfo'),
        bankAccountDetails: t('sections.bankAccountDetails'),
        paymentMethods: t('sections.paymentMethods'),
        addressInfo: t('sections.addressInfo'),
        contactInfo: t('sections.contactInfo'),
      },
    },
  };
};
