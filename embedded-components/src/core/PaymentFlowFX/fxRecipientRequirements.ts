/**
 * FX recipient (payee) field requirements — per-currency configuration.
 *
 * The public "Make a cross-border FX payout" documentation defines which
 * payment **rails** are available per credit currency, but it does **not**
 * publish the per-currency matrix of beneficiary bank-account fields (what the
 * "account number" field should be called, whether a checking/savings account
 * type applies, which routing code is used, etc.).
 *
 * This module fills that gap: it encodes, per supported credit currency, the
 * information the FX create-recipient form needs to render the correct labels
 * and collect the right fields. The values are **best-effort**, derived from
 * standard international banking practice (IBAN countries, CLABE for Mexico,
 * BSB for Australia, IFSC for India, sort code for the UK, transit/institution
 * for Canada, etc.) and should be confirmed against the official onboarding
 * specification before production use.
 *
 * Rail availability (`rails`) is taken directly from the PDP "Availability"
 * table. Note that the settlement rails are named against the FX product's
 * generic tiers, **not** US domestic payment networks:
 *   - `ACH`  → "FX Low-value" rail (non-urgent, 2–5 business days)
 *   - `WIRE` → "FX High-value" rail (time-critical, same/next business day)
 *
 * @see https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/transactions/payouts/how-to/cross-border-fx-payout
 * @see SUPPORTED_TARGET_CURRENCIES in ./PaymentFlowFX.constants
 */
import type { RoutingCodeType } from '@/api/generated/ep-recipients.schemas';

/** FX settlement rails. Names map to product tiers, not US networks. */
export type FxRail = 'ACH' | 'WIRE';

/**
 * How the beneficiary account number is formatted / labelled.
 * - `IBAN`  — International Bank Account Number (letters + digits).
 * - `CLABE` — Mexican 18-digit standardized bank code (embeds bank/branch).
 * - `LOCAL` — Domestic account number, paired with a separate routing code.
 */
export type FxAccountNumberFormat = 'IBAN' | 'CLABE' | 'LOCAL';

/** Broad geographic region, mirroring the PDP availability table. */
export type FxRegion = 'NAMR' | 'APAC' | 'EMEA' | 'LATAM';

/** Descriptor for the routing / bank-identifier code a currency expects. */
export interface FxRoutingCodeInfo {
  /** Field label, e.g. "BSB code", "IFSC code", "Sort code". */
  label: string;
  /** Whether the routing code is mandatory to route the payout. */
  required: boolean;
  /**
   * Canonical routing-code type persisted to the recipients API
   * (`RoutingInformation.routingCodeType`). Ties the free-text {@link label} to a
   * typed value from the ep-recipients `RoutingCodeType` enum so international
   * recipients are created with the correct code (e.g. `AUBSB`, `INFSC`, `BIC`)
   * instead of the domestic `USABA` default.
   */
  routingCodeType: RoutingCodeType;
}

/** Per-currency beneficiary account requirements for FX payouts. */
export interface FxCurrencyRequirement {
  /** ISO 4217 credit currency code. */
  currency: string;
  /**
   * ISO 3166-1 alpha-2 country code used to resolve a flag. `EU` for the
   * Eurozone (no single-country flag; the UI falls back to a globe glyph).
   */
  countryCode: string;
  /** Human-readable destination name. */
  countryName: string;
  /** Geographic region (from the PDP availability table). */
  region: FxRegion;
  /** Account-number format, drives label + validation relaxation. */
  accountNumberFormat: FxAccountNumberFormat;
  /** Field label for the account number (e.g. "IBAN", "CLABE"). */
  accountNumberLabel: string;
  /**
   * Whether a US-style checking/savings account **type** is meaningful for
   * this destination. `false` for IBAN countries, CLABE (Mexico), and markets
   * like Brazil where the US checking/savings distinction does not apply.
   */
  requiresAccountType: boolean;
  /**
   * Whether the beneficiary bank name should be collected (data-only today;
   * the shared form does not yet render a dedicated bank-name input).
   */
  requiresBankName: boolean;
  /** Routing/bank-identifier code descriptor, when one applies. */
  routingCode?: FxRoutingCodeInfo;
  /** Available rails by funding (debtor) account type. */
  rails: {
    /** Rails available from a `LIMITED_DDA_PAYMENTS` account. */
    limited: FxRail[];
    /** Rails available from a `TRANSACTION_ACCOUNT`. */
    transaction: FxRail[];
  };
}

/**
 * Settlement metadata per rail, used by the rail disclaimer. Mirrors the PDP
 * "Rail eligibility" table.
 */
export const FX_RAIL_INFO: Record<
  FxRail,
  { tier: string; useCase: string; settlement: string }
> = {
  ACH: {
    tier: 'FX Low-value',
    useCase: 'Non-urgent cross-currency payouts',
    settlement: 'Two to five business days',
  },
  WIRE: {
    tier: 'FX High-value',
    useCase: 'Time-critical cross-currency payouts',
    settlement: 'Same or next business day',
  },
};

const IBAN_ROUTING: FxRoutingCodeInfo = {
  label: 'BIC / SWIFT',
  required: false,
  // IBAN embeds the domestic routing; the BIC/SWIFT identifies the bank.
  routingCodeType: 'BIC',
};

/**
 * Per-currency requirement matrix for the 16 supported FX credit currencies.
 *
 * Keyed by ISO 4217 code. Kept in sync with `SUPPORTED_TARGET_CURRENCIES`.
 */
export const FX_CURRENCY_REQUIREMENTS: Record<string, FxCurrencyRequirement> = {
  // — North America ————————————————————————————————————————————————
  CAD: {
    currency: 'CAD',
    countryCode: 'CA',
    countryName: 'Canada',
    region: 'NAMR',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: true, // Canada distinguishes chequing / savings
    requiresBankName: false,
    routingCode: {
      label: 'Transit & institution number',
      required: true,
      routingCodeType: 'CACPA',
    },
    rails: { limited: [], transaction: ['ACH'] },
  },

  // — Asia-Pacific —————————————————————————————————————————————————
  AUD: {
    currency: 'AUD',
    countryCode: 'AU',
    countryName: 'Australia',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: {
      label: 'BSB code',
      required: true,
      routingCodeType: 'AUBSB',
    },
    rails: { limited: ['WIRE', 'ACH'], transaction: ['WIRE', 'ACH'] },
  },
  HKD: {
    currency: 'HKD',
    countryCode: 'HK',
    countryName: 'Hong Kong',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: {
      label: 'Bank & branch code',
      required: true,
      routingCodeType: 'HKNCC',
    },
    rails: { limited: ['WIRE', 'ACH'], transaction: ['WIRE', 'ACH'] },
  },
  INR: {
    currency: 'INR',
    countryCode: 'IN',
    countryName: 'India',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: {
      label: 'IFSC code',
      required: true,
      routingCodeType: 'INFSC',
    },
    rails: { limited: ['WIRE', 'ACH'], transaction: ['WIRE', 'ACH'] },
  },
  PHP: {
    currency: 'PHP',
    countryCode: 'PH',
    countryName: 'Philippines',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: {
      label: 'SWIFT / BIC code',
      required: true,
      routingCodeType: 'BIC',
    },
    rails: { limited: ['WIRE', 'ACH'], transaction: ['WIRE', 'ACH'] },
  },
  KRW: {
    currency: 'KRW',
    countryCode: 'KR',
    countryName: 'South Korea',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: { label: 'Bank code', required: true, routingCodeType: 'BIC' },
    rails: { limited: ['WIRE'], transaction: ['WIRE'] },
  },
  SGD: {
    currency: 'SGD',
    countryCode: 'SG',
    countryName: 'Singapore',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: {
      label: 'Bank & branch code',
      required: true,
      routingCodeType: 'SGIBG',
    },
    rails: { limited: ['ACH'], transaction: ['ACH'] },
  },
  VND: {
    currency: 'VND',
    countryCode: 'VN',
    countryName: 'Vietnam',
    region: 'APAC',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: {
      label: 'SWIFT / BIC code',
      required: true,
      routingCodeType: 'BIC',
    },
    rails: { limited: ['WIRE'], transaction: ['WIRE'] },
  },

  // — Europe, Middle East & Africa ————————————————————————————————
  EUR: {
    currency: 'EUR',
    countryCode: 'EU',
    countryName: 'European Union (SEPA)',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: IBAN_ROUTING,
    rails: { limited: ['WIRE'], transaction: ['WIRE'] },
  },
  PLN: {
    currency: 'PLN',
    countryCode: 'PL',
    countryName: 'Poland',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: IBAN_ROUTING,
    rails: { limited: ['ACH'], transaction: ['ACH'] },
  },
  RON: {
    currency: 'RON',
    countryCode: 'RO',
    countryName: 'Romania',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: IBAN_ROUTING,
    rails: { limited: ['ACH'], transaction: ['ACH'] },
  },
  SEK: {
    currency: 'SEK',
    countryCode: 'SE',
    countryName: 'Sweden',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: IBAN_ROUTING,
    rails: { limited: [], transaction: ['ACH'] },
  },
  AED: {
    currency: 'AED',
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    routingCode: IBAN_ROUTING,
    rails: { limited: ['ACH'], transaction: ['ACH'] },
  },
  GBP: {
    currency: 'GBP',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    region: 'EMEA',
    accountNumberFormat: 'IBAN',
    accountNumberLabel: 'IBAN',
    requiresAccountType: false,
    requiresBankName: false,
    // UK domestic uses a 6-digit sort code; IBAN is standard for cross-border.
    routingCode: {
      label: 'Sort code (or BIC)',
      required: false,
      routingCodeType: 'BIC',
    },
    rails: { limited: ['WIRE'], transaction: ['ACH'] },
  },

  // — Latin America ————————————————————————————————————————————————
  BRL: {
    currency: 'BRL',
    countryCode: 'BR',
    countryName: 'Brazil',
    region: 'LATAM',
    accountNumberFormat: 'LOCAL',
    accountNumberLabel: 'Account number',
    // Brazil does not use the US checking/savings distinction; the bank +
    // branch (agência) identify the account instead.
    requiresAccountType: false,
    requiresBankName: true,
    routingCode: {
      label: 'Bank & branch (agência) code',
      required: true,
      routingCodeType: 'BRSTN',
    },
    rails: { limited: ['WIRE'], transaction: ['WIRE'] },
  },
  MXN: {
    currency: 'MXN',
    countryCode: 'MX',
    countryName: 'Mexico',
    region: 'LATAM',
    accountNumberFormat: 'CLABE',
    accountNumberLabel: 'CLABE',
    requiresAccountType: false,
    requiresBankName: false,
    // CLABE embeds the bank + branch, so no separate routing code is needed.
    rails: { limited: ['WIRE'], transaction: ['WIRE'] },
  },
};

/**
 * Returns the FX requirement descriptor for a currency, or `undefined` when the
 * currency is not a supported FX credit currency (e.g. `USD` / domestic).
 */
export function getFxCurrencyRequirement(
  currency?: string | null
): FxCurrencyRequirement | undefined {
  if (!currency) return undefined;
  return FX_CURRENCY_REQUIREMENTS[currency.toUpperCase()];
}

/**
 * Returns the de-duplicated union of rails available for a currency across both
 * funding account types (or, when `debtorAccountType` is given, just that type).
 * Order is stable: WIRE before ACH.
 */
export function getFxAvailableRails(
  currency?: string | null,
  debtorAccountType?: 'limited' | 'transaction'
): FxRail[] {
  const req = getFxCurrencyRequirement(currency);
  if (!req) return [];
  const source = debtorAccountType
    ? req.rails[debtorAccountType]
    : [...req.rails.limited, ...req.rails.transaction];
  const order: FxRail[] = ['WIRE', 'ACH'];
  return order.filter((rail) => source.includes(rail));
}

/** True when the currency's account number is an IBAN. */
export function isIbanCurrency(currency?: string | null): boolean {
  return getFxCurrencyRequirement(currency)?.accountNumberFormat === 'IBAN';
}

/**
 * Returns the canonical `RoutingCodeType` to persist for a currency's
 * beneficiary routing code, or `undefined` when the currency is domestic /
 * unsupported, or self-routing (e.g. MXN CLABE embeds the bank + branch, so no
 * separate routing code applies). Used by recipient creation to replace the
 * hard-coded `USABA` default with the correct international code.
 */
export function getFxRoutingCodeType(
  currency?: string | null
): RoutingCodeType | undefined {
  return getFxCurrencyRequirement(currency)?.routingCode?.routingCodeType;
}
