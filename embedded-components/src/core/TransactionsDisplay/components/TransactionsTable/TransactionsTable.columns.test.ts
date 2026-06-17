import { describe, expect, it } from 'vitest';

import type { ModifiedTransaction } from '../../utils';
import { getTransactionsColumns } from './TransactionsTable.columns';

const mockT = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue || key;

describe('TransactionsTable.columns', () => {
  const columns = getTransactionsColumns(mockT);

  it('returns an array of column definitions', () => {
    expect(columns.length).toBeGreaterThan(10);
  });

  describe('paymentDate column', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'paymentDate')!;

    it('accessorFn returns empty string for undefined date', () => {
      const row = {} as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe('');
    });

    it('accessorFn returns timestamp for valid date', () => {
      const row = {
        paymentDate: '2026-01-15T00:00:00Z',
      } as ModifiedTransaction;
      const result = (col as any).accessorFn(row);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('amount column', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'amount')!;

    it('accessorFn returns 0 for undefined amount', () => {
      const row = {} as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe(0);
    });

    it('accessorFn returns positive for PAYIN', () => {
      const row = {
        amount: 100,
        payinOrPayout: 'PAYIN',
      } as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe(100);
    });

    it('accessorFn returns negative for PAYOUT', () => {
      const row = {
        amount: 50,
        payinOrPayout: 'PAYOUT',
      } as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe(-50);
    });
  });

  describe('effectiveDate column', () => {
    const col = columns.find(
      (c) => (c as any).accessorKey === 'effectiveDate'
    )!;

    it('accessorFn returns empty string for undefined date', () => {
      const row = {} as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe('');
    });

    it('accessorFn returns timestamp for valid date', () => {
      const row = {
        effectiveDate: '2026-03-01T12:00:00Z',
      } as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBeGreaterThan(0);
    });
  });

  describe('createdAt column', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'createdAt')!;

    it('accessorFn returns empty string for undefined', () => {
      const row = {} as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBe('');
    });

    it('accessorFn returns timestamp for valid date', () => {
      const row = {
        createdAt: '2026-06-01T10:30:00Z',
      } as ModifiedTransaction;
      expect((col as any).accessorFn(row)).toBeGreaterThan(0);
    });
  });

  describe('filterFn functions', () => {
    it('debtorName filterFn matches case-insensitively', () => {
      const col = columns.find((c) => (c as any).accessorKey === 'debtorName')!;
      const mockRow = {
        getValue: (id: string) => (id === 'debtorName' ? 'John Smith' : ''),
      };
      expect((col as any).filterFn(mockRow, 'debtorName', 'john')).toBe(true);
      expect((col as any).filterFn(mockRow, 'debtorName', 'xyz')).toBe(false);
    });

    it('creditorName filterFn matches case-insensitively', () => {
      const col = columns.find(
        (c) => (c as any).accessorKey === 'creditorName'
      )!;
      const mockRow = {
        getValue: (id: string) => (id === 'creditorName' ? 'Acme Corp' : ''),
      };
      expect((col as any).filterFn(mockRow, 'creditorName', 'acme')).toBe(true);
    });

    it('counterpartName filterFn matches case-insensitively', () => {
      const col = columns.find(
        (c) => (c as any).accessorKey === 'counterpartName'
      )!;
      const mockRow = {
        getValue: (id: string) =>
          id === 'counterpartName' ? 'Test Company' : '',
      };
      expect((col as any).filterFn(mockRow, 'counterpartName', 'test')).toBe(
        true
      );
    });

    it('transactionReferenceId filterFn matches case-insensitively', () => {
      const col = columns.find(
        (c) => (c as any).accessorKey === 'transactionReferenceId'
      )!;
      const mockRow = {
        getValue: (id: string) =>
          id === 'transactionReferenceId' ? 'REF-12345' : '',
      };
      expect(
        (col as any).filterFn(mockRow, 'transactionReferenceId', 'ref-12')
      ).toBe(true);
    });

    it('memo filterFn matches case-insensitively', () => {
      const col = columns.find((c) => (c as any).accessorKey === 'memo')!;
      const mockRow = {
        getValue: (id: string) =>
          id === 'memo' ? 'Payment for Invoice #123' : '',
      };
      expect((col as any).filterFn(mockRow, 'memo', 'invoice')).toBe(true);
    });

    it('status filterFn uses array includes', () => {
      const col = columns.find((c) => (c as any).accessorKey === 'status')!;
      const mockRow = {
        getValue: (id: string) => (id === 'status' ? 'COMPLETED' : ''),
      };
      expect(
        (col as any).filterFn(mockRow, 'status', ['COMPLETED', 'PENDING'])
      ).toBe(true);
      expect((col as any).filterFn(mockRow, 'status', ['FAILED'])).toBe(false);
    });

    it('type filterFn uses array includes', () => {
      const col = columns.find((c) => (c as any).accessorKey === 'type')!;
      const mockRow = {
        getValue: (id: string) => (id === 'type' ? 'ACH' : ''),
      };
      expect((col as any).filterFn(mockRow, 'type', ['ACH', 'WIRE'])).toBe(
        true
      );
      expect((col as any).filterFn(mockRow, 'type', ['RTP'])).toBe(false);
    });

    it('filterFn handles undefined values gracefully', () => {
      const col = columns.find((c) => (c as any).accessorKey === 'debtorName')!;
      const mockRow = {
        getValue: () => undefined,
      };
      expect((col as any).filterFn(mockRow, 'debtorName', 'test')).toBe(false);
    });
  });

  describe('locale support', () => {
    it('accepts a custom locale parameter', () => {
      const frColumns = getTransactionsColumns(mockT, 'fr-CA');
      expect(frColumns.length).toBeGreaterThan(10);
    });
  });
});
