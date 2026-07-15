/**
 * FX eligibility rules (pure).
 *
 * Determines which debtor accounts, payment methods and payees are usable for a
 * cross-border payout. See SPECIFICATION.md FR-FX-1/3/4.
 */
import type {
  AccountResponse,
  PaymentMethodType,
} from '../../PaymentFlow/PaymentFlow.types';
import {
  FX_ALLOWED_METHODS,
  FX_ELIGIBLE_ACCOUNT_CATEGORIES,
} from '../PaymentFlowFX.constants';
import type { FXPayee } from '../PaymentFlowFX.types';
import { isFxCurrency } from './format';

/** Is an FX payout active? True when a non-USD target currency is set. */
export function isFxActive(targetCurrency?: string): boolean {
  return !!targetCurrency && targetCurrency !== 'USD';
}

/**
 * Reason a debtor account is unavailable for the current (FX or domestic) flow,
 * or `undefined` when it is eligible. Only applies FX category restrictions when
 * a target currency is active (FR-FX-3).
 */
export function getAccountDisabledReasonFX(
  account: Pick<AccountResponse, 'category'>,
  fxActive: boolean
): string | undefined {
  if (!fxActive) return undefined;
  const category = account.category as string | undefined;
  if (!category || !FX_ELIGIBLE_ACCOUNT_CATEGORIES.includes(category)) {
    return 'Not available for international payments';
  }
  return undefined;
}

/** Number of accounts usable given the current FX state (FR-FX-3). */
export function countEligibleAccounts(
  accounts: Array<Pick<AccountResponse, 'category'>>,
  fxActive: boolean
): number {
  return accounts.filter(
    (account) => !getAccountDisabledReasonFX(account, fxActive)
  ).length;
}

export interface MethodAvailability {
  available: boolean;
  reason?: string;
}

/**
 * Availability of a payment method for the current flow. FX payouts allow only
 * ACH / WIRE; RTP is disabled with a reason (FR-FX-4). The per-recipient routing
 * check still applies on top of this in the selector.
 */
export function getMethodAvailabilityFX(
  method: PaymentMethodType,
  fxActive: boolean
): MethodAvailability {
  if (fxActive && !FX_ALLOWED_METHODS.includes(method)) {
    return {
      available: false,
      reason: 'Not available for international payments',
    };
  }
  return { available: true };
}

/**
 * Reason a payee is not selectable, or `undefined` when selectable. A payee whose
 * account currency is outside `supportedTargetCurrencies` is disabled (FR-FX-1).
 */
export function getPayeeDisabledReasonFX(
  payee: FXPayee,
  supportedTargetCurrencies: string[]
): string | undefined {
  const currency = payee.currencyCode;
  if (!currency || currency === 'USD') return undefined;
  if (!isFxCurrency(currency, supportedTargetCurrencies)) {
    return `Currency ${currency} not enabled`;
  }
  return undefined;
}

/** The target currency implied by a payee, or `undefined` for domestic. */
export function getTargetCurrencyForPayee(
  payee: Pick<FXPayee, 'currencyCode'> | undefined
): string | undefined {
  const currency = payee?.currencyCode;
  return currency && currency !== 'USD' ? currency : undefined;
}
