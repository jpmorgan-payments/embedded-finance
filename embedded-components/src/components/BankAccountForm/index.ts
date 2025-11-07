/**
 * Shared BankAccountForm Component
 *
 * A configurable form component for collecting bank account information
 * Used across different use cases: Linked Accounts, Recipients, Settlement Accounts
 */

export { BankAccountForm } from './BankAccountForm';
export {
  linkedAccountConfig,
  linkedAccountEditConfig,
  recipientConfig,
  createCustomConfig,
} from './BankAccountForm.configs';
export { createBankAccountFormSchema } from './BankAccountForm.schema';
export { transformBankAccountFormToRecipientPayload } from './BankAccountForm.utils';
export type {
  BankAccountFormConfig,
  BankAccountFormContent,
  BankAccountFormData,
  BankAccountFormProps,
  PaymentMethodConfig,
} from './BankAccountForm.types';
