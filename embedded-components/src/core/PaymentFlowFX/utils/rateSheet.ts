/**
 * FX rate sheet selection + conversion math.
 *
 * Pure functions (no React) carrying the money logic, unit tested to ~100%.
 * See SPECIFICATION.md §3.3.
 */
import type {
  CurrencyPair,
  Rate,
  RateSheetDetails,
} from '@/api/generated/fx-rate-sheet.schemas';

import { RATESHEET_METHOD_MAP } from '../PaymentFlowFX.constants';

/** A rate resolved from a rate sheet, normalised to target units per 1 USD. */
export interface SelectedRate {
  /** Units of target currency per 1 USD (normalised via step 6). */
  rate: number;
  /** Present only for EXECUTABLE rates. */
  rateId?: string;
  /** True for INDICATIVE (display-only) rates. */
  isIndicative: boolean;
  /** Whole-sheet expiry (`data.expiry`). */
  expiresAt?: Date;
  /** Legal disclaimer from `_metadata.disclaimer`. */
  disclaimer?: string;
}

/** Result of {@link selectRateFromSheet}. */
export type RateSelectionResult =
  | { status: 'ok'; rate: SelectedRate }
  | { status: 'unavailable'; reason: string };

export interface SelectRateParams {
  targetCurrency: string;
  paymentMethod: 'ACH' | 'WIRE';
  /** Payee recipient type, mapped to the sheet `beneficiaryType`. */
  beneficiaryType?: 'INDIVIDUAL' | 'BUSINESS';
  /** Entered USD amount (debit side), for bound checks. */
  amount?: number;
  /** Restrict to specific customer departments by name. */
  customerDepartment?: string[];
  /** Injectable clock for deterministic tests. Default: `new Date()`. */
  now?: Date;
}

/**
 * Detect an FX rate sheet error body. The rate sheet API returns HTTP 200 with an
 * `errors[]` array on failure; callers must treat that as a failure (§3.3 / §11).
 *
 * @returns array of `errorCode: errorMsg` strings, or `null` when there are none.
 */
export function getRateSheetErrors(body: unknown): string[] | null {
  if (!body || typeof body !== 'object') return null;

  // ErrorResponse = Errors[] OR a single Errors object with `errors[]`.
  const collect = (errs: unknown): string[] => {
    if (!Array.isArray(errs)) return [];
    return errs
      .filter((e): e is { errorCode?: string; errorMsg?: string } => !!e)
      .map((e) => [e.errorCode, e.errorMsg].filter(Boolean).join(': '))
      .filter(Boolean);
  };

  if (Array.isArray(body)) {
    const messages = body.flatMap((item) =>
      item && typeof item === 'object' && 'errors' in item
        ? collect((item as { errors?: unknown }).errors)
        : []
    );
    return messages.length > 0 ? messages : null;
  }

  if ('errors' in body) {
    const messages = collect((body as { errors?: unknown }).errors);
    return messages.length > 0 ? messages : null;
  }

  return null;
}

/**
 * Convert a USD amount to the target currency using a normalised rate
 * (target units per 1 USD).
 */
export function convertUsdToTarget(usdAmount: number, rate: number): number {
  return usdAmount * rate;
}

/**
 * Normalise a currency pair `clientRate` to "target units per 1 USD".
 *
 * `fromBuyCcyToSellCcy` is the authoritative conversion instruction (§3.3 step 6):
 * - `Divide`   ⇒ 1 USD = clientRate target ⇒ R = clientRate.
 * - `Multiply` ⇒ 1 target = clientRate USD ⇒ R = 1 / clientRate.
 */
function normaliseRate(pair: CurrencyPair, clientRate: number): number | null {
  if (!clientRate || clientRate <= 0) return null;
  return pair.fromBuyCcyToSellCcy === 'Multiply' ? 1 / clientRate : clientRate;
}

/** Does this rate satisfy the payment method / beneficiary filters? */
function rateMatchesFilters(rate: Rate, params: SelectRateParams): boolean {
  const wantMethod = RATESHEET_METHOD_MAP[params.paymentMethod];
  if (rate.paymentMethod && rate.paymentMethod !== wantMethod) return false;

  if (params.beneficiaryType && rate.beneficiaryType) {
    // Ignore eCom variants for the standard flow.
    if (rate.beneficiaryType !== params.beneficiaryType) return false;
  }

  return true;
}

/** Is the entered USD amount within this rate's min/max bounds? */
function rateWithinBounds(rate: Rate, amount?: number): boolean {
  if (amount === undefined) return true;
  // Bounds only comparable when expressed in USD (the entered/debit currency).
  if (
    rate.minMaxTransactionSizeCcy &&
    rate.minMaxTransactionSizeCcy !== 'USD'
  ) {
    return true;
  }
  if (
    rate.minTransactionSize !== undefined &&
    amount < rate.minTransactionSize
  ) {
    return false;
  }
  if (
    rate.maxTransactionSize !== undefined &&
    amount > rate.maxTransactionSize
  ) {
    return false;
  }
  return true;
}

/**
 * Select the best rate for a USD → target payout from a rate sheet.
 *
 * Algorithm (§3.3): expiry discard → pair match (`clientSellCcy==='USD'` &&
 * `clientBuyCcy===targetCurrency`) → method/beneficiary/bounds filter →
 * EXECUTABLE preference over INDICATIVE → normalise the rate.
 */
export function selectRateFromSheet(
  sheet: RateSheetDetails,
  params: SelectRateParams
): RateSelectionResult {
  const { data } = sheet;
  if (!data) {
    return { status: 'unavailable', reason: 'No rate sheet data' };
  }

  const now = params.now ?? new Date();
  const expiresAt = data.expiry ? new Date(data.expiry) : undefined;
  if (expiresAt && now.getTime() > expiresAt.getTime()) {
    return { status: 'unavailable', reason: 'All rates expired' };
  }

  // Sheet-level threshold (USD only): rates invalid above this amount.
  if (
    params.amount !== undefined &&
    data.thresholdAmount !== undefined &&
    (!data.thresholdCcy || data.thresholdCcy === 'USD') &&
    params.amount > data.thresholdAmount
  ) {
    return {
      status: 'unavailable',
      reason: 'Amount exceeds rate sheet threshold',
    };
  }

  const departments = (data.customerDepartment ?? []).filter((dept) =>
    params.customerDepartment && params.customerDepartment.length > 0
      ? dept.name !== undefined && params.customerDepartment.includes(dept.name)
      : true
  );

  const pairs: CurrencyPair[] = departments.flatMap(
    (dept) => dept.currencyPairs ?? []
  );

  const matchingPair = pairs.find(
    (pair) =>
      pair.clientSellCcy === 'USD' &&
      pair.clientBuyCcy === params.targetCurrency
  );

  if (!matchingPair) {
    return {
      status: 'unavailable',
      reason: `No rate for USD → ${params.targetCurrency}`,
    };
  }

  const candidates = (matchingPair.rates ?? []).filter(
    (rate) =>
      rate.clientRate !== undefined &&
      rateMatchesFilters(rate, params) &&
      rateWithinBounds(rate, params.amount)
  );

  if (candidates.length === 0) {
    return {
      status: 'unavailable',
      reason: 'No matching rate for the selected method / amount',
    };
  }

  // Prefer EXECUTABLE (lockable) over INDICATIVE.
  const chosen =
    candidates.find((r) => r.rateType === 'EXECUTABLE') ?? candidates[0];

  const normalised = normaliseRate(matchingPair, chosen.clientRate as number);
  if (normalised === null) {
    return { status: 'unavailable', reason: 'Invalid rate value' };
  }

  const isIndicative = chosen.rateType !== 'EXECUTABLE';

  return {
    status: 'ok',
    rate: {
      rate: normalised,
      isIndicative,
      // Only EXECUTABLE rates are lockable ⇒ carry the rateId.
      ...(isIndicative ? {} : chosen.rateId ? { rateId: chosen.rateId } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(sheet._metadata?.disclaimer
        ? { disclaimer: sheet._metadata.disclaimer }
        : {}),
    },
  };
}
