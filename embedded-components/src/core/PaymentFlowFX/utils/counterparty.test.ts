import { describe, expect, it, vi } from 'vitest';

import type { UnsavedRecipient } from '../../PaymentFlow/PaymentFlow.types';
import type { PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import {
  buildV3Request,
  mapUnsavedRecipientToCounterParty,
} from './counterparty';

const baseFormData: PaymentFlowFXFormData = {
  fromAccountId: 'acct-1',
  payeeId: 'payee-1',
  paymentMethod: 'ACH',
  amount: '100.50',
  currency: 'USD',
};

describe('buildV3Request', () => {
  it('passes the amount through as a string (never parseFloat)', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, amount: '100.50' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.amount).toBe('100.50');
    expect(typeof request.amount).toBe('string');
    expect(request.amount).toMatch(/^\d+(\.\d+)?$/);
  });

  it('builds a REGISTERED_ACCOUNT debtor and USD currency', () => {
    const request = buildV3Request({
      formData: baseFormData,
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.currency).toBe('USD');
    expect(request.type).toBe('ACH');
    expect(request.transactionReferenceId).toBe('PHUI_abc');
    expect(request.debtor?.account).toEqual({
      type: 'REGISTERED_ACCOUNT',
      registeredAccount: { id: 'acct-1' },
    });
  });

  it('uses payeeId as the creditor id for a saved recipient', () => {
    const request = buildV3Request({
      formData: baseFormData,
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.creditor).toEqual({ id: 'payee-1' });
  });

  it('omits memo when empty or whitespace only', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, memo: '   ' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.memo).toBeUndefined();
  });

  it('includes a trimmed memo when present', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, memo: '  invoice 42  ' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.memo).toBe('invoice 42');
  });

  it('adds targetCurrency for a non-USD payout', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, targetCurrency: 'EUR' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.targetCurrency).toBe('EUR');
  });

  it('never sends targetCurrency when it equals USD', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, targetCurrency: 'USD' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.targetCurrency).toBeUndefined();
  });

  it('carries fxInformation.rateId only for a locked (non-indicative) quote', () => {
    const request = buildV3Request({
      formData: {
        ...baseFormData,
        targetCurrency: 'EUR',
        fxQuote: {
          rate: 0.92,
          rateId: 'rate-123',
          isIndicative: false,
          fetchedAt: new Date(),
        },
      },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.fxInformation).toEqual({ rateId: 'rate-123' });
  });

  it('omits fxInformation for an indicative quote', () => {
    const request = buildV3Request({
      formData: {
        ...baseFormData,
        targetCurrency: 'EUR',
        fxQuote: {
          rate: 0.92,
          rateId: 'rate-123',
          isIndicative: true,
          fetchedAt: new Date(),
        },
      },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.fxInformation).toBeUndefined();
  });

  it('validates and includes paymentPurpose within length bounds', () => {
    const request = buildV3Request({
      formData: { ...baseFormData, targetCurrency: 'EUR' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
      paymentPurpose: { code: 'SALA', customCode: 'payroll' },
    });

    expect(request.paymentPurpose).toEqual({
      code: 'SALA',
      customCode: 'payroll',
    });
  });

  it('drops an over-length paymentPurpose.code with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const request = buildV3Request({
      formData: { ...baseFormData, targetCurrency: 'EUR' },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
      paymentPurpose: { code: 'TOOLONG' },
    });

    expect(request.paymentPurpose).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('maps an unsaved recipient to an external creditor counterparty', () => {
    const unsaved = {
      displayName: 'Jane Doe',
      accountNumber: '000123456',
      routingNumber: '021000021',
      enabledPaymentMethods: ['ACH'],
      recipientType: 'INDIVIDUAL',
      transactionRecipient: {
        partyDetails: {
          type: 'INDIVIDUAL',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        account: {
          countryCode: 'US',
          number: '000123456',
          type: 'CHECKING',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021000021',
              transactionType: 'ACH',
            },
          ],
        },
      },
    } as unknown as UnsavedRecipient;

    const request = buildV3Request({
      formData: {
        ...baseFormData,
        payeeId: undefined,
        unsavedRecipient: unsaved,
      },
      transactionReferenceId: 'PHUI_abc',
      paymentType: 'ACH',
    });

    expect(request.creditor?.partyDetails).toMatchObject({
      type: 'INDIVIDUAL',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(request.creditor?.account).toMatchObject({
      type: 'CHECKING',
      externalAccount: {
        number: '000123456',
        country: 'US',
      },
    });
  });
});

describe('mapUnsavedRecipientToCounterParty', () => {
  it('maps address and contacts onto the counterparty party details', () => {
    const unsaved = {
      displayName: 'Acme Inc',
      accountNumber: '999',
      routingNumber: '021',
      enabledPaymentMethods: ['WIRE'],
      recipientType: 'BUSINESS',
      transactionRecipient: {
        partyDetails: {
          type: 'ORGANIZATION',
          businessName: 'Acme Inc',
          address: {
            addressLine1: '1 Main St',
            city: 'NYC',
            state: 'NY',
            postalCode: '10001',
            countryCode: 'US',
          },
          contacts: [
            { contactType: 'EMAIL', value: 'ap@acme.test' },
            { contactType: 'PHONE', value: '+12125550000' },
          ],
        },
        account: {
          number: '999',
          type: 'CHECKING',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021',
              transactionType: 'WIRE',
            },
          ],
        },
      },
    } as unknown as UnsavedRecipient;

    const cp = mapUnsavedRecipientToCounterParty(unsaved);

    expect(cp.partyDetails?.businessName).toBe('Acme Inc');
    expect(cp.partyDetails?.address).toMatchObject({
      streetName: '1 Main St',
      city: 'NYC',
      country: 'US',
      countrySubDivision: 'NY',
      postalCode: '10001',
    });
    expect(cp.partyDetails?.contacts).toEqual({
      emailAddress: 'ap@acme.test',
      phoneNumber: '+12125550000',
    });
  });
});
