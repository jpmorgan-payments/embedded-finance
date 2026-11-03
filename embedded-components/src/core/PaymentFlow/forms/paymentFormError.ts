import { tActive } from '@/i18n/activeI18n';
import type enUSMakePayment from '@/i18n/en-US/make-payment.json';

type PaymentFormValidationKey =
  keyof (typeof enUSMakePayment)['formValidation'];

/**
 * Lazy Zod error for PaymentFlow form schemas. Resolved at validation time so
 * module-level schemas follow the active provider's locale and content tokens.
 */
export const paymentFormError = (key: PaymentFormValidationKey) => ({
  error: () => tActive(`make-payment:formValidation.${key}`),
});
