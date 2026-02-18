import './index.css';

export { LinkedAccountWidget } from './core/RecipientWidgets';
export type { LinkedAccountWidgetProps } from './core/RecipientWidgets';

export { RecipientsWidget } from './core/RecipientWidgets';
export type { RecipientsWidgetProps } from './core/RecipientWidgets';

export * from './core/EBComponentsProvider';

export { initEBComponentsManager } from './vanilla/EBComponentsManager';

export * from './core/TransactionsDisplay';
export * from './core/MakePayment/MakePayment';
/**
 * @deprecated The Recipients component is deprecated. Use RecipientsWidget instead.
 */
export * from './core/Recipients';
export * from './core/Accounts';

export { PaymentFlow, PaymentFlowInline } from './core/PaymentFlow';
export type {
  PaymentFlowProps,
  PaymentFlowInlineProps,
} from './core/PaymentFlow';

export * from './core/OnboardingWizardBasic/OnboardingWizardBasic';

export * from './core/OnboardingFlow';

export * from './core/ClientDetails';

export * as types from './api/generated/smbdo.schemas';
