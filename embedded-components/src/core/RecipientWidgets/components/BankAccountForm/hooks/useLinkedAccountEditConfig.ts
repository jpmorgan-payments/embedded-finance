import { useTranslation } from 'react-i18next';

import type { BankAccountFormConfig } from '../BankAccountForm.types';
import { useDefaultPaymentMethodConfigs } from './useDefaultPaymentMethodConfigs';

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
      prefillFromClient: false, // In edit mode, use recipient data, not client data
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
