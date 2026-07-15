/**
 * PaymentFlowFX - Main export file
 *
 * Public API for the cross-border / multicurrency payout flow.
 * Internal components (orchestrator, hooks, utils) are not exported here.
 */

// Main components
export { PaymentFlowFX, PaymentFlowFXInline } from './PaymentFlowFX';

// Types (public API only)
export type {
  PaymentFlowFXProps,
  PaymentFlowFXInlineProps,
  FxConfig,
  FxQuote,
  FxProviderRateParams,
  FxIndicativeRateParams,
  TargetCurrencyV3,
} from './PaymentFlowFX.types';

// Constants (public API only)
export { SUPPORTED_TARGET_CURRENCIES } from './PaymentFlowFX.constants';
