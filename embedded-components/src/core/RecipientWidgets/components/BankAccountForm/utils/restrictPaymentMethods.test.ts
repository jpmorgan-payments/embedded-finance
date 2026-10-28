import { describe, expect, it } from 'vitest';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

import type { BankAccountFormConfig } from '../BankAccountForm.types';
import { restrictPaymentMethods } from './restrictPaymentMethods';

const editConfig = {
  useCase: 'LINKED_ACCOUNT',
  paymentMethods: {
    available: ['ACH', 'WIRE', 'RTP'],
    configs: {},
    allowMultiple: true,
    defaultSelected: ['ACH'],
  },
} as unknown as BankAccountFormConfig;

const recipientWith = (...methods: string[]) =>
  ({
    account: {
      routingInformation: methods.map((transactionType) => ({
        transactionType,
        routingNumber: '021000021',
      })),
    },
  }) as unknown as Recipient;

describe('restrictPaymentMethods', () => {
  it('returns the config unchanged when no restriction is given', () => {
    expect(restrictPaymentMethods(editConfig, undefined)).toBe(editConfig);
  });

  it('limits available methods to the allowed list', () => {
    const result = restrictPaymentMethods(
      editConfig,
      ['ACH'],
      recipientWith('ACH')
    );

    expect(result.paymentMethods.available).toEqual(['ACH']);
    expect(result.paymentMethods.defaultSelected).toEqual(['ACH']);
    expect(result.paymentMethods.allowMultiple).toBe(true);
  });

  it('keeps methods the recipient already has, in the configured order', () => {
    const result = restrictPaymentMethods(
      editConfig,
      ['ACH'],
      recipientWith('RTP', 'ACH')
    );

    expect(result.paymentMethods.available).toEqual(['ACH', 'RTP']);
  });

  it('does not mutate the source config', () => {
    restrictPaymentMethods(editConfig, ['ACH'], recipientWith('ACH'));

    expect(editConfig.paymentMethods.available).toEqual(['ACH', 'WIRE', 'RTP']);
  });
});
