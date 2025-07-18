import type { TransactionGetResponseV2 } from '@jpmorgan-payments/embedded-finance-components';

// Mock transaction data for TransactionsDisplay component
export const mockTransactions: TransactionGetResponseV2[] = [
  {
    id: 'txn-001',
    type: 'ACH',
    status: 'COMPLETED',
    amount: 1500.0,
    currency: 'USD',
    paymentDate: '2024-01-15T10:30:00Z',
    effectiveDate: '2024-01-16T10:30:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-001',
    creditorName: 'SellSense Marketplace',
    debtorName: 'John Doe',
    postingVersion: 1,
    reference: 'Sale #12345',
    description: 'Payment for product sale',
  },
  {
    id: 'txn-002',
    type: 'WIRE',
    status: 'PENDING',
    amount: 2500.0,
    currency: 'USD',
    paymentDate: '2024-01-14T14:20:00Z',
    effectiveDate: '2024-01-15T14:20:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-002',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Acme Corporation',
    postingVersion: 1,
    reference: 'Sale #12346',
    description: 'Large order payment',
  },
  {
    id: 'txn-003',
    type: 'RTP',
    status: 'COMPLETED',
    amount: 750.5,
    currency: 'USD',
    paymentDate: '2024-01-13T09:15:00Z',
    effectiveDate: '2024-01-13T09:15:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-003',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Jane Smith',
    postingVersion: 1,
    reference: 'Sale #12347',
    description: 'Instant payment',
  },
  {
    id: 'txn-004',
    type: 'ACH',
    status: 'FAILED',
    amount: 500.0,
    currency: 'USD',
    paymentDate: '2024-01-12T16:45:00Z',
    effectiveDate: '2024-01-13T16:45:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-004',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Bob Wilson',
    postingVersion: 1,
    reference: 'Sale #12348',
    description: 'Failed payment attempt',
  },
  {
    id: 'txn-005',
    type: 'WIRE',
    status: 'COMPLETED',
    amount: 10000.0,
    currency: 'USD',
    paymentDate: '2024-01-11T11:00:00Z',
    effectiveDate: '2024-01-11T11:00:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-005',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Enterprise Corp',
    postingVersion: 1,
    reference: 'Sale #12349',
    description: 'Enterprise order',
  },
  {
    id: 'txn-006',
    type: 'ACH',
    status: 'COMPLETED',
    amount: 125.75,
    currency: 'USD',
    paymentDate: '2024-01-10T13:30:00Z',
    effectiveDate: '2024-01-11T13:30:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-006',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Alice Johnson',
    postingVersion: 1,
    reference: 'Sale #12350',
    description: 'Small order payment',
  },
  {
    id: 'txn-007',
    type: 'RTP',
    status: 'PENDING',
    amount: 300.0,
    currency: 'USD',
    paymentDate: '2024-01-09T15:20:00Z',
    effectiveDate: '2024-01-09T15:20:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-007',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Mike Davis',
    postingVersion: 1,
    reference: 'Sale #12351',
    description: 'Pending instant payment',
  },
  {
    id: 'txn-008',
    type: 'ACH',
    status: 'COMPLETED',
    amount: 875.25,
    currency: 'USD',
    paymentDate: '2024-01-08T10:45:00Z',
    effectiveDate: '2024-01-09T10:45:00Z',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-008',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Sarah Brown',
    postingVersion: 1,
    reference: 'Sale #12352',
    description: 'Standard ACH payment',
  },
];

// Mock transactions response with pagination
export const mockTransactionsResponse = {
  items: mockTransactions,
  page: 0,
  limit: 10,
  total_items: mockTransactions.length,
  total_pages: Math.ceil(mockTransactions.length / 10),
};

// Mock empty transactions response
export const mockEmptyTransactionsResponse = {
  items: [],
  page: 0,
  limit: 10,
  total_items: 0,
  total_pages: 0,
};

// Mock transactions with different statuses
export const mockCompletedTransactions = mockTransactions.filter(
  (t) => t.status === 'COMPLETED',
);
export const mockPendingTransactions = mockTransactions.filter(
  (t) => t.status === 'PENDING',
);
export const mockFailedTransactions = mockTransactions.filter(
  (t) => t.status === 'FAILED',
);

// Function to create mock transaction
export const createMockTransaction = (
  overrides: Partial<TransactionGetResponseV2> = {},
): TransactionGetResponseV2 => {
  return {
    id: `txn-${Date.now()}`,
    type: 'ACH',
    status: 'COMPLETED',
    amount: 100.0,
    currency: 'USD',
    paymentDate: new Date().toISOString(),
    effectiveDate: new Date().toISOString(),
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-mock',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Mock Customer',
    postingVersion: 1,
    reference: `Sale #${Math.floor(Math.random() * 100000)}`,
    description: 'Mock transaction',
    ...overrides,
  };
};

// Function to create paginated transactions response
export const createMockTransactionsResponse = (
  transactions: TransactionGetResponseV2[] = mockTransactions,
  page: number = 1,
  limit: number = 10,
) => {
  // Convert 1-based page to 0-based index
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return {
    items: paginatedTransactions,
    page,
    limit,
    total_items: transactions.length,
    total_pages: Math.ceil(transactions.length / limit),
  };
};
