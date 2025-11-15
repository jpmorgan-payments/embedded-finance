import { useTranslation } from 'react-i18next';

import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type { PaymentMethodConfig } from '../BankAccountForm.types';

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
