import { describe, expect, it } from 'vitest';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

import {
  canMakePayment,
  canVerifyMicrodeposits,
  doesRecipientNeedAction,
  filterRecipientsByStatus,
  formatRecipientDate,
  getAccountCountsByStatus,
  getAccountHolderType,
  getMaskedAccountNumber,
  getMissingPaymentMethods,
  getRecipientDisplayName,
  getRecipientStatusMessageKey,
  getSupportedPaymentMethods,
  hasRequiredInfoForPaymentType,
  isRecipientInFinalState,
  needsAdditionalRouting,
  sortRecipientsByPriority,
} from './recipientHelpers';

const mockIndividualRecipient = {
  id: 'rec-001',
  status: 'ACTIVE',
  type: 'RECIPIENT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '123456789',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '021000021',
        transactionType: 'ACH',
      },
      {
        routingCodeType: 'USABA',
        routingNumber: '021000089',
        transactionType: 'WIRE',
      },
    ],
  },
} as unknown as Recipient;

const mockBusinessRecipient = {
  id: 'rec-002',
  status: 'PENDING',
  type: 'RECIPIENT',
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Acme Corp',
  },
  account: {
    number: '987654321',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '021000021',
        transactionType: 'ACH',
      },
    ],
  },
} as unknown as Recipient;

describe('recipientHelpers', () => {
  describe('getSupportedPaymentMethods', () => {
    it('returns payment methods from routing information', () => {
      const methods = getSupportedPaymentMethods(mockIndividualRecipient);
      expect(methods).toEqual(['ACH', 'WIRE']);
    });

    it('returns empty array when no routing information', () => {
      const recipient = {
        ...mockIndividualRecipient,
        account: {},
      } as Recipient;
      expect(getSupportedPaymentMethods(recipient)).toEqual([]);
    });

    it('returns empty array when account is undefined', () => {
      const recipient = {
        ...mockIndividualRecipient,
        account: undefined,
      } as unknown as Recipient;
      expect(getSupportedPaymentMethods(recipient)).toEqual([]);
    });
  });

  describe('getMaskedAccountNumber', () => {
    it('masks account number showing last 4 digits', () => {
      expect(getMaskedAccountNumber(mockIndividualRecipient)).toBe('****6789');
    });

    it('returns N/A when no account number', () => {
      const recipient = {
        ...mockIndividualRecipient,
        account: {},
      } as Recipient;
      expect(getMaskedAccountNumber(recipient)).toBe('N/A');
    });
  });

  describe('getRecipientDisplayName', () => {
    it('returns individual name with masked account', () => {
      const name = getRecipientDisplayName(mockIndividualRecipient);
      expect(name).toContain('John Doe');
      expect(name).toContain('6789');
    });

    it('returns business name with masked account', () => {
      const name = getRecipientDisplayName(mockBusinessRecipient);
      expect(name).toContain('Acme Corp');
      expect(name).toContain('4321');
    });
  });

  describe('getAccountHolderType', () => {
    it('returns Individual for INDIVIDUAL type', () => {
      expect(getAccountHolderType(mockIndividualRecipient)).toBe('Individual');
    });

    it('returns Business for ORGANIZATION type', () => {
      expect(getAccountHolderType(mockBusinessRecipient)).toBe('Business');
    });
  });

  describe('canVerifyMicrodeposits', () => {
    it('returns true for READY_FOR_VALIDATION status', () => {
      const recipient = {
        ...mockIndividualRecipient,
        status: 'READY_FOR_VALIDATION',
      } as Recipient;
      expect(canVerifyMicrodeposits(recipient)).toBe(true);
    });

    it('returns false for ACTIVE status', () => {
      expect(canVerifyMicrodeposits(mockIndividualRecipient)).toBe(false);
    });
  });

  describe('canMakePayment', () => {
    it('returns true for ACTIVE status', () => {
      expect(canMakePayment(mockIndividualRecipient)).toBe(true);
    });

    it('returns false for PENDING status', () => {
      expect(canMakePayment(mockBusinessRecipient)).toBe(false);
    });
  });

  describe('needsAdditionalRouting', () => {
    it('returns true when missing RTP', () => {
      expect(needsAdditionalRouting(mockIndividualRecipient)).toBe(true);
    });

    it('returns false for non-active recipient', () => {
      expect(needsAdditionalRouting(mockBusinessRecipient)).toBe(false);
    });

    it('returns false when all methods are enabled', () => {
      const recipient = {
        ...mockIndividualRecipient,
        account: {
          number: '123',
          countryCode: 'US',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021000021',
              transactionType: 'ACH',
            },
            {
              routingCodeType: 'USABA',
              routingNumber: '021000089',
              transactionType: 'WIRE',
            },
            {
              routingCodeType: 'USABA',
              routingNumber: '021000089',
              transactionType: 'RTP',
            },
          ],
        },
      } as unknown as Recipient;
      expect(needsAdditionalRouting(recipient)).toBe(false);
    });
  });

  describe('getMissingPaymentMethods', () => {
    it('returns missing methods', () => {
      const missing = getMissingPaymentMethods(mockIndividualRecipient);
      expect(missing).toContain('RTP');
      expect(missing).not.toContain('ACH');
      expect(missing).not.toContain('Wire');
    });

    it('returns Wire and RTP when only ACH is available', () => {
      const missing = getMissingPaymentMethods(mockBusinessRecipient);
      expect(missing).toContain('Wire');
      expect(missing).toContain('RTP');
    });
  });

  describe('formatRecipientDate', () => {
    it('formats a valid date string', () => {
      const result = formatRecipientDate('2024-03-15T10:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('Mar');
    });

    it('returns N/A for undefined', () => {
      expect(formatRecipientDate(undefined)).toBe('N/A');
    });
  });

  describe('hasRequiredInfoForPaymentType', () => {
    it('returns true when payment type is supported', () => {
      expect(
        hasRequiredInfoForPaymentType(mockIndividualRecipient, 'ACH')
      ).toBe(true);
      expect(
        hasRequiredInfoForPaymentType(mockIndividualRecipient, 'WIRE')
      ).toBe(true);
    });

    it('returns false when payment type is not supported', () => {
      expect(
        hasRequiredInfoForPaymentType(mockIndividualRecipient, 'RTP')
      ).toBe(false);
    });
  });

  describe('isRecipientInFinalState', () => {
    it('returns true for ACTIVE', () => {
      expect(isRecipientInFinalState(mockIndividualRecipient)).toBe(true);
    });

    it('returns true for REJECTED', () => {
      const r = { ...mockIndividualRecipient, status: 'REJECTED' } as Recipient;
      expect(isRecipientInFinalState(r)).toBe(true);
    });

    it('returns false for PENDING', () => {
      expect(isRecipientInFinalState(mockBusinessRecipient)).toBe(false);
    });
  });

  describe('doesRecipientNeedAction', () => {
    it('returns true for READY_FOR_VALIDATION', () => {
      const r = {
        ...mockIndividualRecipient,
        status: 'READY_FOR_VALIDATION',
      } as Recipient;
      expect(doesRecipientNeedAction(r)).toBe(true);
    });

    it('returns false for ACTIVE', () => {
      expect(doesRecipientNeedAction(mockIndividualRecipient)).toBe(false);
    });
  });

  describe('getRecipientStatusMessageKey', () => {
    it('returns correct message key', () => {
      expect(getRecipientStatusMessageKey(mockIndividualRecipient)).toBe(
        'status.messages.ACTIVE'
      );
    });
  });

  describe('sortRecipientsByPriority', () => {
    it('sorts recipients by status priority', () => {
      const recipients = [
        { ...mockIndividualRecipient, id: 'active', status: 'ACTIVE' },
        {
          ...mockIndividualRecipient,
          id: 'validate',
          status: 'READY_FOR_VALIDATION',
        },
        { ...mockIndividualRecipient, id: 'pending', status: 'PENDING' },
      ] as Recipient[];

      const sorted = sortRecipientsByPriority(recipients);
      expect(sorted[0].id).toBe('validate');
      expect(sorted[1].id).toBe('active');
      expect(sorted[2].id).toBe('pending');
    });

    it('does not mutate original array', () => {
      const original = [mockIndividualRecipient, mockBusinessRecipient];
      const sorted = sortRecipientsByPriority(original);
      expect(sorted).not.toBe(original);
    });
  });

  describe('getAccountCountsByStatus', () => {
    it('counts recipients by status', () => {
      const recipients = [
        { ...mockIndividualRecipient, status: 'ACTIVE' },
        { ...mockIndividualRecipient, status: 'ACTIVE' },
        { ...mockIndividualRecipient, status: 'PENDING' },
      ] as Recipient[];

      const counts = getAccountCountsByStatus(recipients);
      expect(counts.ACTIVE).toBe(2);
      expect(counts.PENDING).toBe(1);
    });

    it('returns empty object for empty array', () => {
      expect(getAccountCountsByStatus([])).toEqual({});
    });
  });

  describe('filterRecipientsByStatus', () => {
    it('filters by specified statuses', () => {
      const recipients = [
        { ...mockIndividualRecipient, status: 'ACTIVE' },
        { ...mockBusinessRecipient, status: 'PENDING' },
        { ...mockIndividualRecipient, status: 'REJECTED' },
      ] as Recipient[];

      const result = filterRecipientsByStatus(recipients, [
        'ACTIVE',
        'REJECTED',
      ]);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no matches', () => {
      const result = filterRecipientsByStatus(
        [mockIndividualRecipient],
        ['INACTIVE']
      );
      expect(result).toHaveLength(0);
    });
  });
});
