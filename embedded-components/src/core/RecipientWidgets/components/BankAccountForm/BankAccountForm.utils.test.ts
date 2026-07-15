import { describe, expect, it } from 'vitest';

import type { BankAccountFormData } from './BankAccountForm.types';
import {
  bankAccountFormDataToDisplayRecipient,
  mergeBankAccountDefaultValues,
  PREFILL_DISPLAY_RECIPIENT_ID,
  transformBankAccountFormToRecipientPayload,
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

  it('includes only ACH routing rows for linked-account display', () => {
    const data: BankAccountFormData = {
      ...base,
      routingNumbers: [
        { paymentType: 'ACH', routingNumber: '021000021' },
        { paymentType: 'WIRE', routingNumber: '021000022' },
      ],
      paymentTypes: ['ACH', 'WIRE'],
    };
    const r = bankAccountFormDataToDisplayRecipient(data);
    expect(
      r.account?.routingInformation?.map((x) => x.transactionType)
    ).toEqual(['ACH']);
  });
});

describe('transformBankAccountFormToRecipientPayload', () => {
  it('sends only ACH routing for LINKED_ACCOUNT even if form state has other types', () => {
    const data: BankAccountFormData = {
      ...base,
      routingNumbers: [
        { paymentType: 'WIRE', routingNumber: '111111111' },
        { paymentType: 'ACH', routingNumber: '021000021' },
      ],
      paymentTypes: ['WIRE', 'ACH'],
    };
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'LINKED_ACCOUNT'
    );
    expect(
      payload.account?.routingInformation?.map((x) => x.transactionType)
    ).toEqual(['ACH']);
  });

  it('preserves all routing types for RECIPIENT', () => {
    const data: BankAccountFormData = {
      ...base,
      routingNumbers: [
        { paymentType: 'ACH', routingNumber: '021000021' },
        { paymentType: 'WIRE', routingNumber: '021000022' },
      ],
      paymentTypes: ['ACH', 'WIRE'],
    };
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'RECIPIENT'
    );
    expect(
      payload.account?.routingInformation?.map((x) => x.transactionType)
    ).toEqual(['ACH', 'WIRE']);
  });

  it('defaults routingCodeType to USABA for domestic recipients', () => {
    const data: BankAccountFormData = {
      ...base,
      routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
      paymentTypes: ['ACH'],
    };
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'RECIPIENT'
    );
    expect(
      payload.account?.routingInformation?.map((x) => x.routingCodeType)
    ).toEqual(['USABA']);
  });

  it('applies the provided routingCodeType to every routing entry (international FX)', () => {
    const data: BankAccountFormData = {
      ...base,
      routingNumbers: [
        { paymentType: 'ACH', routingNumber: 'IFSC0001234' },
        { paymentType: 'WIRE', routingNumber: 'IFSC0001234' },
      ],
      paymentTypes: ['ACH', 'WIRE'],
    };
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'RECIPIENT',
      'INFSC'
    );
    expect(
      payload.account?.routingInformation?.map((x) => x.routingCodeType)
    ).toEqual(['INFSC', 'INFSC']);
  });
});
