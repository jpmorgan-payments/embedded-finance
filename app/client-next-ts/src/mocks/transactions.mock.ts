// Use types from the local generated schemas
import type {
  TransactionsSearchResponseV2,
  ListTransactionsSearchResponseV2,
  TransactionStatus,
  PaymentTypeResponse,
} from '../../../../embedded-components/src/api/generated/ep-transactions.schemas';

// Mock transaction data for TransactionsDisplay component
export const mockTransactions: TransactionsSearchResponseV2[] = [
  {
    id: 'txn-001',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 1500.0,
    currency: 'USD',
    paymentDate: '2024-01-15',
    effectiveDate: '2024-01-16',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-001',
    creditorName: 'SellSense Marketplace',
    debtorName: 'John Doe',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12345',
    memo: 'Payment for product sale',
  },
  {
    id: 'txn-002',
    type: 'WIRE' as PaymentTypeResponse,
    status: 'PENDING' as TransactionStatus,
    amount: 2500.0,
    currency: 'USD',
    paymentDate: '2024-01-14',
    effectiveDate: '2024-01-15',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-002',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Acme Corporation',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12346',
    memo: 'Large order payment',
  },
  {
    id: 'txn-003',
    type: 'RTP' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 750.5,
    currency: 'USD',
    paymentDate: '2024-01-13',
    effectiveDate: '2024-01-13',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-003',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Jane Smith',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12347',
    memo: 'Instant payment',
  },
  {
    id: 'txn-004',
    type: 'ACH' as PaymentTypeResponse,
    status: 'FAILED' as TransactionStatus, // Not in enum, should use REJECTED or RETURNED
    amount: 500.0,
    currency: 'USD',
    paymentDate: '2024-01-12',
    effectiveDate: '2024-01-13',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-004',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Bob Wilson',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12348',
    memo: 'Failed payment attempt',
  },
  {
    id: 'txn-005',
    type: 'WIRE' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 10000.0,
    currency: 'USD',
    paymentDate: '2024-01-11',
    effectiveDate: '2024-01-11',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-005',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Enterprise Corp',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12349',
    memo: 'Enterprise order',
  },
  {
    id: 'txn-006',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 125.75,
    currency: 'USD',
    paymentDate: '2024-01-10',
    effectiveDate: '2024-01-11',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-006',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Alice Johnson',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12350',
    memo: 'Small order payment',
  },
  {
    id: 'txn-007',
    type: 'RTP' as PaymentTypeResponse,
    status: 'PENDING' as TransactionStatus,
    amount: 300.0,
    currency: 'USD',
    paymentDate: '2024-01-09',
    effectiveDate: '2024-01-09',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-007',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Mike Davis',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12351',
    memo: 'Pending instant payment',
  },
  {
    id: 'txn-008',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 875.25,
    currency: 'USD',
    paymentDate: '2024-01-08',
    effectiveDate: '2024-01-09',
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-008',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Sarah Brown',
    postingVersion: 1,
    transactionReferenceId: 'Sale #12352',
    memo: 'Standard ACH payment',
  },
];

// Mock transactions response with pagination (align with ListTransactionsSearchResponseV2)
export const mockTransactionsResponse: ListTransactionsSearchResponseV2 = {
  items: mockTransactions,
  metadata: {
    page: 0,
    limit: 10,
    total_items: mockTransactions.length,
  },
};

// Mock empty transactions response
export const mockEmptyTransactionsResponse: ListTransactionsSearchResponseV2 = {
  items: [],
  metadata: {
    page: 0,
    limit: 10,
    total_items: 0,
  },
};

// Mock transactions with different statuses
export const mockCompletedTransactions = mockTransactions.filter(
  (t) => t.status === 'COMPLETED',
);
export const mockPendingTransactions = mockTransactions.filter(
  (t) => t.status === 'PENDING',
);
export const mockFailedTransactions = mockTransactions.filter(
  (t) => t.status === 'REJECTED' || t.status === 'RETURNED',
);

// Function to create mock transaction
export const createMockTransaction = (
  overrides: Partial<TransactionsSearchResponseV2> = {},
): TransactionsSearchResponseV2 => {
  return {
    id: `txn-${Date.now()}`,
    type: 'ACH',
    status: 'COMPLETED',
    amount: 100.0,
    currency: 'USD',
    paymentDate: new Date().toISOString().slice(0, 10),
    effectiveDate: new Date().toISOString().slice(0, 10),
    creditorAccountId: 'd3371713f14e423f82065c9486ebe15b',
    debtorAccountId: 'debtor-account-mock',
    creditorName: 'SellSense Marketplace',
    debtorName: 'Mock Customer',
    postingVersion: 1,
    transactionReferenceId: `Sale #${Math.floor(Math.random() * 100000)}`,
    memo: 'Mock transaction',
    ...overrides,
  };
};

// Function to create paginated transactions response
export const createMockTransactionsResponse = (
  transactions: TransactionsSearchResponseV2[] = mockTransactions,
  page: number = 1,
  limit: number = 4,
): ListTransactionsSearchResponseV2 => {
  // Convert 1-based page to 0-based index
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return {
    items: paginatedTransactions,
    metadata: {
      page,
      limit,
      total_items: transactions.length,
    },
  };
};
