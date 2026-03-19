import { describe, expect, it } from 'vitest';

import type { BankAccountFormData } from './BankAccountForm.types';
import {
  bankAccountFormDataToDisplayRecipient,
  mergeBankAccountDefaultValues,
  PREFILL_DISPLAY_RECIPIENT_ID,
} from './BankAccountForm.utils';

const base: BankAccountFormData = {
  accountType: 'INDIVIDUAL',
  firstName: 'A',
  lastName: 'B',
  businessName: '',
  routingNumbers: [{ paymentType: 'ACH', routingNumber: '111' }],
  useSameRoutingNumber: true,
  accountNumber: '0001',
  bankAccountType: 'CHECKING',
  paymentTypes: ['ACH'],
  certify: false,
};

describe('mergeBankAccountDefaultValues', () => {
  it('returns base when override is undefined', () => {
    expect(mergeBankAccountDefaultValues(base, undefined)).toEqual(base);
  });

  it('merges top-level and nested address', () => {
    const merged = mergeBankAccountDefaultValues(base, {
      accountNumber: '9999',
      address: { addressLine1: '1 Main', city: 'NYC', countryCode: 'US' },
    });
    expect(merged.accountNumber).toBe('9999');
    expect(merged.firstName).toBe('A');
    expect(merged.address).toEqual({
      addressLine1: '1 Main',
      city: 'NYC',
      countryCode: 'US',
    });
  });

  it('replaces routingNumbers when provided in override', () => {
    const merged = mergeBankAccountDefaultValues(base, {
      routingNumbers: [{ paymentType: 'ACH', routingNumber: '222' }],
    });
    expect(merged.routingNumbers).toEqual([
      { paymentType: 'ACH', routingNumber: '222' },
    ]);
  });
});

describe('bankAccountFormDataToDisplayRecipient', () => {
  it('maps form data to a display Recipient with placeholder id', () => {
    const data: BankAccountFormData = {
      ...base,
      accountNumber: '12345678901234567',
      routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
    };
    const r = bankAccountFormDataToDisplayRecipient(data);
    expect(r.id).toBe(PREFILL_DISPLAY_RECIPIENT_ID);
    expect(r.type).toBe('LINKED_ACCOUNT');
    expect(r.partyDetails.type).toBe('INDIVIDUAL');
    expect(r.partyDetails.firstName).toBe('A');
    expect(r.account?.number).toBe('12345678901234567');
    expect(r.account?.routingInformation?.[0]?.routingNumber).toBe('021000021');
  });
});
