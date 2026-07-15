import { describe, expect, it } from 'vitest';

import type {
  AccountResponse,
  PaymentMethodType,
} from '../../PaymentFlow/PaymentFlow.types';
import type { FXPayee } from '../PaymentFlowFX.types';
import {
  countEligibleAccounts,
  getAccountDisabledReasonFX,
  getMethodAvailabilityFX,
  getPayeeDisabledReasonFX,
  getTargetCurrencyForPayee,
  isFxActive,
} from './eligibility';

const account = (category: string) =>
  ({ category }) as unknown as Pick<AccountResponse, 'category'>;

const payee = (currencyCode?: string) =>
  ({ id: 'p', currencyCode }) as unknown as FXPayee;

const SUPPORTED = ['EUR', 'GBP', 'CAD'];

describe('isFxActive', () => {
  it('is true for a non-USD currency', () => {
    expect(isFxActive('EUR')).toBe(true);
  });
  it('is false for USD or undefined', () => {
    expect(isFxActive('USD')).toBe(false);
    expect(isFxActive(undefined)).toBe(false);
  });
});

describe('getAccountDisabledReasonFX', () => {
  it('returns undefined for every account when FX is not active', () => {
    expect(getAccountDisabledReasonFX(account('OTHER'), false)).toBeUndefined();
  });

  it('allows eligible categories when FX is active', () => {
    expect(
      getAccountDisabledReasonFX(account('TRANSACTION_ACCOUNT'), true)
    ).toBeUndefined();
    expect(
      getAccountDisabledReasonFX(account('LIMITED_DDA_PAYMENTS'), true)
    ).toBeUndefined();
  });

  it('disables ineligible categories when FX is active', () => {
    expect(getAccountDisabledReasonFX(account('SAVINGS'), true)).toBeTruthy();
  });
});

describe('countEligibleAccounts', () => {
  it('counts only eligible accounts when FX is active', () => {
    const accounts = [
      account('TRANSACTION_ACCOUNT'),
      account('LIMITED_DDA_PAYMENTS'),
      account('SAVINGS'),
    ];
    expect(countEligibleAccounts(accounts, true)).toBe(2);
    expect(countEligibleAccounts(accounts, false)).toBe(3);
  });
});

describe('getMethodAvailabilityFX', () => {
  it('allows ACH and WIRE when FX is active', () => {
    expect(getMethodAvailabilityFX('ACH', true).available).toBe(true);
    expect(getMethodAvailabilityFX('WIRE', true).available).toBe(true);
  });

  it('disables RTP with a reason when FX is active', () => {
    const result = getMethodAvailabilityFX('RTP' as PaymentMethodType, true);
    expect(result.available).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('allows every method when FX is not active', () => {
    expect(
      getMethodAvailabilityFX('RTP' as PaymentMethodType, false).available
    ).toBe(true);
  });
});

describe('getPayeeDisabledReasonFX', () => {
  it('allows domestic (USD/undefined) payees', () => {
    expect(
      getPayeeDisabledReasonFX(payee(undefined), SUPPORTED)
    ).toBeUndefined();
    expect(getPayeeDisabledReasonFX(payee('USD'), SUPPORTED)).toBeUndefined();
  });

  it('allows a supported currency', () => {
    expect(getPayeeDisabledReasonFX(payee('EUR'), SUPPORTED)).toBeUndefined();
  });

  it('disables an unsupported currency', () => {
    expect(getPayeeDisabledReasonFX(payee('JPY'), SUPPORTED)).toBeTruthy();
  });
});

describe('getTargetCurrencyForPayee', () => {
  it('returns the currency for a non-USD payee', () => {
    expect(getTargetCurrencyForPayee(payee('EUR'))).toBe('EUR');
  });

  it('returns undefined for USD / missing currency / undefined payee', () => {
    expect(getTargetCurrencyForPayee(payee('USD'))).toBeUndefined();
    expect(getTargetCurrencyForPayee(payee(undefined))).toBeUndefined();
    expect(getTargetCurrencyForPayee(undefined)).toBeUndefined();
  });
});
