/**
 * PaymentFlow - Main export file
 *
 * This file exports the public API for the PaymentFlow feature.
 * Internal components should not be exported from here.
 */

// Main components
export { PaymentFlow, PaymentFlowInline } from './PaymentFlow';

// Types (public API only)
export type {
  PaymentFlowProps,
  PaymentFlowInlineProps,
  Payee,
  PaymentMethod,
  PaymentMethodType,
  PaymentFlowFormData,
  AccountResponse,
} from './PaymentFlow.types';

// Constants (public API only)
export {
  DEFAULT_PAYMENT_METHODS,
  PAYMENT_METHOD_REQUIREMENTS,
} from './PaymentFlow.constants';

// Flow Container components (for advanced usage)
export {
  FlowContainer,
  FlowView,
  FlowHeader,
  useFlowContext,
  FlowContextProvider,
} from './FlowContainer';

// Review Panel components (for advanced usage)
export { ReviewPanel, ReviewPanelMobile } from './ReviewPanel';

// Sub-components (for advanced customization)
export { PayeeSelector } from './PayeeSelector';
export { PaymentMethodSelector } from './PaymentMethodSelector';

// Forms (for standalone usage)
export {
  PayeeTypeSelector,
  AddRecipientForm,
  LinkAccountForm,
  EnablePaymentMethodForm,
  PaymentMethodSelection,
} from './forms';
