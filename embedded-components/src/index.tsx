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

export * from './core/OnboardingWizardBasic/OnboardingWizardBasic';

export * from './core/OnboardingFlow';

export * as types from './api/generated/smbdo.schemas';
