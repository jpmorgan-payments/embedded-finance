/**
 * Recipients - Public API
 */

// Main component
export { Recipients } from './Recipients';

// Public types only
export type { RecipientsProps } from './Recipients.types';

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

// Export column configuration
export {
  defaultRecipientsColumnConfig,
  widgetRecipientsColumnConfig,
  mergeColumnConfig,
  getVisibleColumns,
  getSortableColumns,
} from './Recipients.columns';
export type {
  RecipientColumnKey,
  RecipientColumnConfig,
  RecipientsColumnConfiguration,
} from './Recipients.columns';
