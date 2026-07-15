/**
 * PaymentFlowFX constants
 *
 * FX-specific constants layered on top of the existing PaymentFlow constants.
 * See SPECIFICATION.md §7.3.
 */
import type { PaymentMethodType } from '../PaymentFlow/PaymentFlow.types';

/**
 * Target currencies supported for cross-border payouts.
 *
 * These are the 16 cross-border credit currencies offered by the Embedded
 * Payments FX product, per the PDP "Availability" documentation. They mirror the
 * non-USD values of the recipients `CurrencyCode` enum (see
 * `embedded-finance-pub-ep-recipients-1.0.55-fx.yaml`). The PDP table lists the
 * Vietnam currency as "VDN", a typo for the ISO 4217 code `VND` used here.
 */
export const SUPPORTED_TARGET_CURRENCIES: string[] = [
  'AED',
  'AUD',
  'BRL',
  'CAD',
  'EUR',
  'GBP',
  'HKD',
  'INR',
  'KRW',
  'MXN',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'VND',
];

/**
 * Human-readable display names for the supported currencies (plus USD for the
 * domestic default). Used by the currency selector and the dual-currency amount
 * input so users see e.g. "EUR — Euro" rather than a bare code.
 */
export const CURRENCY_LABELS: Record<string, string> = {
  USD: 'US Dollar',
  AED: 'UAE Dirham',
  AUD: 'Australian Dollar',
  BRL: 'Brazilian Real',
  CAD: 'Canadian Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  HKD: 'Hong Kong Dollar',
  INR: 'Indian Rupee',
  KRW: 'South Korean Won',
  MXN: 'Mexican Peso',
  PHP: 'Philippine Peso',
  PLN: 'Polish Złoty',
  RON: 'Romanian Leu',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  VND: 'Vietnamese Dong',
};

/**
 * FX rails supported by the platform. Cross-border payouts are ACH or WIRE only
 * (never RTP). See SPECIFICATION.md §3.4.
 */
export const FX_ALLOWED_METHODS: PaymentMethodType[] = ['ACH', 'WIRE'];

/**
 * FX settlement estimates by method, used to override the delivery copy shown on
 * the method cards and review panel when a cross-border payout is active.
 */
export const FX_METHOD_DELIVERY: Record<'ACH' | 'WIRE', string> = {
  ACH: '2-5 business days',
  WIRE: 'Same or next business day',
};

/**
 * Debtor account categories eligible for FX debits (USD from the NY branch).
 * See SPECIFICATION.md §3.5. Compared as strings to avoid enum-union friction
 * with the un-retargeted accounts client.
 */
export const FX_ELIGIBLE_ACCOUNT_CATEGORIES: string[] = [
  'TRANSACTION_ACCOUNT',
  'LIMITED_DDA_PAYMENTS',
];

/**
 * Maps a UI payment method to the rate sheet `paymentMethod` enum value.
 * See SPECIFICATION.md §3.3 step 3.
 */
export const RATESHEET_METHOD_MAP = {
  ACH: 'ACH',
  WIRE: 'WIRE_DRAFT_BOOK',
} as const;

/**
 * Default currency ⇢ ISO 3166-1 alpha-2 country code, used to derive a flag for
 * the payee currency badge when the recipient country is unknown.
 */
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: 'AE',
  AUD: 'AU',
  BGN: 'BG',
  BRL: 'BR',
  CAD: 'CA',
  CHF: 'CH',
  CNY: 'CN',
  CZK: 'CZ',
  DKK: 'DK',
  EUR: 'EU',
  GBP: 'GB',
  HKD: 'HK',
  HUF: 'HU',
  ILS: 'IL',
  INR: 'IN',
  ISK: 'IS',
  JPY: 'JP',
  KES: 'KE',
  KRW: 'KR',
  MXN: 'MX',
  MYR: 'MY',
  NOK: 'NO',
  NZD: 'NZ',
  PEN: 'PE',
  PHP: 'PH',
  PLN: 'PL',
  RON: 'RO',
  SEK: 'SE',
  SGD: 'SG',
  TWD: 'TW',
  USD: 'US',
  VND: 'VN',
  ZAR: 'ZA',
};

/** Test-id / story namespace prefix for the FX flow. */
export const FX_TEST_ID_PREFIX = 'paymentflow-fx';
