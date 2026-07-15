/**
 * useFxEligibility
 *
 * Thin memoised wrapper around the pure eligibility helpers so the orchestrator
 * can pass stable callbacks to the shared PayeeSelector / PaymentMethodSelector /
 * account list. See SPECIFICATION.md FR-FX-1/3/4.
 */
import { useMemo } from 'react';

import type {
  AccountResponse,
  PaymentMethodType,
} from '../../PaymentFlow/PaymentFlow.types';
import { SUPPORTED_TARGET_CURRENCIES } from '../PaymentFlowFX.constants';
import type { FXPayee } from '../PaymentFlowFX.types';
import {
  countEligibleAccounts,
  getAccountDisabledReasonFX,
  getMethodAvailabilityFX,
  getPayeeDisabledReasonFX,
  isFxActive,
  type MethodAvailability,
} from '../utils/eligibility';

export interface UseFxEligibilityParams {
  targetCurrency?: string;
  accounts: AccountResponse[];
  supportedTargetCurrencies?: string[];
}

export interface FxEligibility {
  fxActive: boolean;
  eligibleAccountCount: number;
  getAccountDisabledReason: (account: AccountResponse) => string | undefined;
  getMethodAvailability: (method: PaymentMethodType) => MethodAvailability;
  getPayeeDisabledReason: (payee: FXPayee) => string | undefined;
}

export function useFxEligibility({
  targetCurrency,
  accounts,
  supportedTargetCurrencies = SUPPORTED_TARGET_CURRENCIES,
}: UseFxEligibilityParams): FxEligibility {
  const fxActive = isFxActive(targetCurrency);

  return useMemo(
    () => ({
      fxActive,
      eligibleAccountCount: countEligibleAccounts(accounts, fxActive),
      getAccountDisabledReason: (account: AccountResponse) =>
        getAccountDisabledReasonFX(account, fxActive),
      getMethodAvailability: (method: PaymentMethodType) =>
        getMethodAvailabilityFX(method, fxActive),
      getPayeeDisabledReason: (payee: FXPayee) =>
        getPayeeDisabledReasonFX(payee, supportedTargetCurrencies),
    }),
    [fxActive, accounts, supportedTargetCurrencies]
  );
}
