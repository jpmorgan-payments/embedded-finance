import { describe, expect, it } from 'vitest';

import { modifyTransactionsData } from './modifyTransactionsData';

describe('modifyTransactionsData', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      creditorAccountId: 'acct-001',
      debtorAccountId: 'acct-ext-001',
      creditorName: 'My Company',
      debtorName: 'External Corp',
      createdAt: '2024-03-15T10:00:00Z',
      effectiveDate: '2024-03-15',
      amount: 100,
    },
    {
      id: 'tx-2',
      creditorAccountId: 'acct-ext-002',
      debtorAccountId: 'acct-001',
      creditorName: 'Vendor LLC',
      debtorName: 'My Company',
      createdAt: '2024-03-16T10:00:00Z',
      effectiveDate: '2024-03-16',
      amount: 250,
    },
    {
      id: 'tx-3',
      creditorAccountId: 'acct-001',
      debtorAccountId: 'acct-ext-003',
      creditorName: 'My Company',
      debtorName: 'Another Sender',
      createdAt: '2024-03-14T10:00:00Z',
      effectiveDate: '2024-03-14',
      amount: 75,
    },
  ];

  it('sorts transactions by createdAt descending (most recent first)', () => {
    const result = modifyTransactionsData(mockTransactions as any, [
      'acct-001',
    ]);
    expect(result[0].id).toBe('tx-2');
    expect(result[1].id).toBe('tx-1');
    expect(result[2].id).toBe('tx-3');
  });

  it('marks PAYIN when creditorAccountId matches user account', () => {
    const result = modifyTransactionsData(mockTransactions as any, [
      'acct-001',
    ]);
    const tx1 = result.find((t) => t.id === 'tx-1');
    expect(tx1?.payinOrPayout).toBe('PAYIN');
  });

  it('marks PAYOUT when debtorAccountId matches user account', () => {
    const result = modifyTransactionsData(mockTransactions as any, [
      'acct-001',
    ]);
    const tx2 = result.find((t) => t.id === 'tx-2');
    expect(tx2?.payinOrPayout).toBe('PAYOUT');
  });

  it('sets counterpartName to debtorName for PAYIN', () => {
    const result = modifyTransactionsData(mockTransactions as any, [
      'acct-001',
    ]);
    const tx1 = result.find((t) => t.id === 'tx-1');
    expect(tx1?.counterpartName).toBe('External Corp');
  });

  it('sets counterpartName to creditorName for PAYOUT', () => {
    const result = modifyTransactionsData(mockTransactions as any, [
      'acct-001',
    ]);
    const tx2 = result.find((t) => t.id === 'tx-2');
    expect(tx2?.counterpartName).toBe('Vendor LLC');
  });

  it('returns undefined payin/payout when no accountIds', () => {
    const result = modifyTransactionsData(mockTransactions as any, []);
    expect(result[0].payinOrPayout).toBeUndefined();
    expect(result[0].counterpartName).toBeUndefined();
  });

  it('handles empty transactions array', () => {
    const result = modifyTransactionsData([], ['acct-001']);
    expect(result).toEqual([]);
  });

  it('sorts by effectiveDate when createdAt is equal', () => {
    const sameCreatedAt = [
      {
        id: 'a',
        createdAt: '2024-01-01T00:00:00Z',
        effectiveDate: '2024-01-02',
      },
      {
        id: 'b',
        createdAt: '2024-01-01T00:00:00Z',
        effectiveDate: '2024-01-03',
      },
    ];
    const result = modifyTransactionsData(sameCreatedAt as any, []);
    expect(result[0].id).toBe('b');
  });

  it('sorts by postingVersion when dates are equal', () => {
    const sameDates = [
      {
        id: 'a',
        createdAt: '2024-01-01T00:00:00Z',
        effectiveDate: '2024-01-01',
        postingVersion: 1,
      },
      {
        id: 'b',
        createdAt: '2024-01-01T00:00:00Z',
        effectiveDate: '2024-01-01',
        postingVersion: 3,
      },
    ];
    const result = modifyTransactionsData(sameDates as any, []);
    expect(result[0].id).toBe('b');
  });
});
