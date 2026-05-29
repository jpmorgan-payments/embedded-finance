import { useTranslationWithTokens } from '@/i18n';

import { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';

import type { PaymentMethodConfig } from '../BankAccountForm.types';

/**
 * Hook to get payment method config with i18n translations
 */
export const usePaymentMethodConfig = (
  type: RoutingInformationTransactionType
): PaymentMethodConfig => {
  const { t, tString } = useTranslationWithTokens('bank-account-form');

  return {
    enabled: true,
    label: t(`paymentMethods.${type}.label`),
    labelString: tString(`paymentMethods.${type}.label`),
    shortLabel: t(`paymentMethods.${type}.shortLabel`),
    shortLabelString: tString(`paymentMethods.${type}.shortLabel`),
    description: t(`paymentMethods.${type}.description`),
    requiredFields: {
      accountNumber: true,
      routingNumber: true,
      bankAccountType: true,
      address: type === 'WIRE',
      contacts: [],
    },
    routingValidation: {
      length: 9,
      pattern: /^\d{9}$/,
      errorMessage: tString(`paymentMethods.${type}.routingError`),
    },
    helperText: t(`paymentMethods.${type}.helperText`),
  };
};
