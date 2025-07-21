export { Recipients } from './Recipients';
export type { RecipientsProps } from './Recipients';

// Export payment configuration types and defaults
export type {
  PaymentMethodType,
  PaymentTypeFieldConfig,
  RecipientsConfig,
} from './types/paymentConfig';

export {
  defaultPaymentMethodConfigs,
  defaultRecipientsConfig,
} from './types/paymentConfig';

// Export sub-components if needed
export { RecipientForm } from './components/RecipientForm/RecipientForm';
export { RecipientDetails } from './components/RecipientDetails/RecipientDetails';

// Export hooks
export { useRecipientsFilters } from './hooks/useRecipientsFilters';
export type {
  RecipientsFilters,
  UseRecipientsFiltersReturn,
} from './hooks/useRecipientsFilters';

// Export utilities
export * from './utils/recipientHelpers';
