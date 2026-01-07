/**
 * Shared BankAccountForm Component
 *
 * A configurable form component for collecting bank account information
 * Used across different use cases: Linked Accounts, Recipients, Settlement Accounts
 */

export { BankAccountForm } from './BankAccountForm';

// Configuration hooks (modern pattern - individual files)
export {
  useLinkedAccountConfig,
  useLinkedAccountEditConfig,
  useRecipientConfig,
  useRecipientEditConfig,
  usePaymentMethodConfig,
  useDefaultPaymentMethodConfigs,
} from './hooks';

// Utilities
export { createBankAccountFormSchema } from './BankAccountForm.schema';
export { transformBankAccountFormToRecipientPayload } from './BankAccountForm.utils';
export { createCustomConfig } from './utils';

// Types
export type {
  BankAccountFormConfig,
  BankAccountFormContent,
  BankAccountFormData,
  BankAccountFormProps,
  PaymentMethodConfig,
} from './BankAccountForm.types';
