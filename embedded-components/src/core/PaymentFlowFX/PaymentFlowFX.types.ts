/**
 * PaymentFlowFX types
 *
 * Extends the existing PaymentFlow types with cross-border / multicurrency (FX)
 * concepts. See SPECIFICATION.md §6 and §7.
 */
import type {
  ApiErrorV2,
  TargetCurrencyV3,
  TransactionGetResponseV3,
  TransactionResponseV3,
} from '@/api/generated/ep-transactions-v3.schemas';

import type {
  Payee,
  PaymentFlowFormData,
  PaymentFlowInlineProps,
  PaymentFlowProps,
  PaymentMethodType,
} from '../PaymentFlow/PaymentFlow.types';

/**
 * A payee enriched with FX metadata sourced from the recipient's account.
 * See SPECIFICATION.md §7.1.
 */
export interface FXPayee extends Payee {
  /**
   * From `recipient.account.currencyCode`; undefined ⇒ domestic/USD. Typed as an
   * open `string` rather than the recipients `CurrencyCode` enum so callers are
   * not coupled to a specific spec revision as new credit currencies are added.
   */
  currencyCode?: string;
  /** From `recipient.account.countryCode`. */
  countryCode?: string;
}

/**
 * A resolved FX quote for a USD → target-currency conversion.
 * See SPECIFICATION.md §6.
 */
export interface FxQuote {
  /** Units of target currency per 1 USD (already normalised via §3.3 step 6). */
  rate: number;
  /** Present only for EXECUTABLE rate-sheet rates or provider-locked rates. */
  rateId?: string;
  /** Quote validity end (rate sheet: `data.expiry`). */
  expiresAt?: Date;
  /** True when the rate cannot be locked (INDICATIVE / getIndicativeRate). */
  isIndicative: boolean;
  /** Rate sheet legal disclaimer, when sourced from getCurrentRatesheet. */
  disclaimer?: string;
}

/**
 * Params passed to a host-supplied provider rate callback.
 */
export interface FxProviderRateParams {
  baseCurrency: 'USD';
  targetCurrency: string;
  amount?: string;
  paymentMethod?: 'ACH' | 'WIRE';
}

/**
 * Params passed to a host-supplied indicative rate callback.
 */
export interface FxIndicativeRateParams {
  baseCurrency: 'USD';
  targetCurrency: string;
}

/**
 * Configuration for FX rate acquisition and payment purpose passthrough.
 * See SPECIFICATION.md §6.
 */
export interface FxConfig {
  /**
   * - `'realtime'` (default) — no rate call; submit without `rateId`; the
   *   conversion is shown as "determined at processing" unless
   *   `getIndicativeRate` is provided.
   * - `'ratesheet'` — built-in `getCurrentRatesheet` integration (§3.3);
   *   EXECUTABLE rates are locked (`rateId` submitted), INDICATIVE display-only.
   * - `'provider'` — host-supplied `getRate`; its `rateId` (if any) is submitted.
   */
  mode?: 'realtime' | 'ratesheet' | 'provider';
  /** `'provider'` mode. */
  getRate?: (
    params: FxProviderRateParams
  ) => Promise<Omit<FxQuote, 'isIndicative'> & { isIndicative?: boolean }>;
  /** `'realtime'` mode, optional display-only estimate. */
  getIndicativeRate?: (
    params: FxIndicativeRateParams
  ) => Promise<Pick<FxQuote, 'rate' | 'expiresAt'>>;
  /** `'ratesheet'` mode: `customerDepartment` filter passthrough. */
  customerDepartment?: string[];
  /** Re-quote interval (ms). Default: none (quote refreshes on expiry only). */
  refreshIntervalMs?: number;
  /** `paymentPurpose` passthrough on the V3 request (top-level object, §3.1). */
  paymentPurpose?: { code?: string; customCode?: string };
}

/**
 * FX form data. Extends PaymentFlowFormData with the resolved target currency
 * and current quote. See SPECIFICATION.md §7.2.
 */
export interface PaymentFlowFXFormData extends PaymentFlowFormData {
  /** undefined or 'USD' ⇒ pure parity mode. */
  targetCurrency?: string;
  /** Current quote incl. source metadata. */
  fxQuote?: FxQuote & { fetchedAt: Date };
}

/**
 * Summary object rendered by the shared ReviewPanel FX block.
 * See SPECIFICATION.md §5.3 / FR-FX-7.
 */
export interface FxReviewSummary {
  /** USD amount the client sends (debit side). */
  sendAmount: string;
  /** Target currency ISO code. */
  targetCurrency: string;
  /** Estimated target amount, or null when "determined at processing". */
  estimatedTargetAmount: number | null;
  /** Units of target currency per 1 USD. */
  rate?: number;
  /** True when the rate is indicative (not locked). */
  isIndicative: boolean;
  /** Quote expiry, when known. */
  expiresAt?: Date;
}

/**
 * Props for the PaymentFlowFX component (dialog mode).
 * See SPECIFICATION.md §6.
 */
export interface PaymentFlowFXProps
  extends Omit<PaymentFlowProps, 'onTransactionComplete'> {
  /**
   * Restrict selectable target currencies.
   * Default: {@link SUPPORTED_TARGET_CURRENCIES}.
   */
  supportedTargetCurrencies?: string[];
  /** FX rate & payment-purpose configuration. */
  fxConfig?: FxConfig;
  /**
   * Fetch `getTransactionV3` once after the 202 to enrich the success view with
   * status / FX details. Default: `true`. Failure degrades gracefully (FR-FX-9).
   */
  enrichTransactionAfterSubmit?: boolean;
  /** Callback when the transaction is completed (or fails). */
  onTransactionComplete?: (
    response?: TransactionResponseV3,
    error?: ApiErrorV2,
    /** Present when enrichment succeeded. */
    details?: TransactionGetResponseV3
  ) => void;
}

/**
 * Props for the PaymentFlowFXInline component (inline / embedded mode).
 * Mirrors PaymentFlowInlineProps with the same FX additions.
 */
export interface PaymentFlowFXInlineProps
  extends Omit<PaymentFlowInlineProps, 'onTransactionComplete'> {
  supportedTargetCurrencies?: string[];
  fxConfig?: FxConfig;
  enrichTransactionAfterSubmit?: boolean;
  onTransactionComplete?: (
    response?: TransactionResponseV3,
    error?: ApiErrorV2,
    details?: TransactionGetResponseV3
  ) => void;
}

/** Re-export of the generated target currency alias for convenience. */
export type { TargetCurrencyV3 };

/** Payment method restricted to FX-capable rails. */
export type FxPaymentMethod = Extract<PaymentMethodType, 'ACH' | 'WIRE'>;
