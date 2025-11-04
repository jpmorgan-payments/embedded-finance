/**
 * Shared BankAccountForm Component
 *
 * A configurable form component for collecting bank account information
 * Used across different use cases: Linked Accounts, Recipients, Settlement Accounts
 */

export { BankAccountForm, BankAccountFormDialog } from './BankAccountForm';
export {
  linkedAccountConfig,
  recipientConfig,
  createCustomConfig,
} from './BankAccountForm.configs';
export { createBankAccountFormSchema } from './BankAccountForm.schema';
export type {
  BankAccountFormConfig,
  BankAccountFormContent,
  BankAccountFormData,
  BankAccountFormDialogProps,
  BankAccountFormProps,
  PaymentMethodConfig,
  PaymentMethodType,
  BankAccountType,
  Contact,
  ContactType,
  Address,
} from './BankAccountForm.types';
