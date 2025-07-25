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
    creditorAccountId: 'vendor-account-001',
    debtorAccountId: 'johns-shop-account',
    creditorName: 'Acme Supplies',
    debtorName: "John's Shop",
    postingVersion: 1,
    transactionReferenceId: 'Payout #1001',
    memo: 'Payout to Acme Supplies',
  },
  {
    id: 'txn-002',
    type: 'WIRE' as PaymentTypeResponse,
    status: 'PENDING' as TransactionStatus,
    amount: 2500.0,
    currency: 'USD',
    paymentDate: '2024-01-14',
    effectiveDate: '2024-01-15',
    creditorAccountId: 'vendor-account-002',
    debtorAccountId: 'johns-shop-account',
    creditorName: 'Bright Electronics',
    debtorName: "John's Shop",
    postingVersion: 1,
    transactionReferenceId: 'Payout #1002',
    memo: 'Payout to Bright Electronics',
  },
  {
    id: 'txn-003',
    type: 'RTP' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 750.5,
    currency: 'USD',
    paymentDate: '2024-01-13',
    effectiveDate: '2024-01-13',
    creditorAccountId: 'vendor-account-003',
    debtorAccountId: 'johns-shop-account',
    creditorName: 'Jane Smith',
    debtorName: "John's Shop",
    postingVersion: 1,
    transactionReferenceId: 'Payout #1003',
    memo: 'Instant payout to Jane Smith',
  },
  {
    id: 'txn-004',
    type: 'ACH' as PaymentTypeResponse,
    status: 'REJECTED' as TransactionStatus,
    amount: 500.0,
    currency: 'USD',
    paymentDate: '2024-01-12',
    effectiveDate: '2024-01-13',
    creditorAccountId: 'vendor-account-004',
    debtorAccountId: 'johns-shop-account',
    creditorName: 'Bob Wilson',
    debtorName: "John's Shop",
    postingVersion: 1,
    transactionReferenceId: 'Payout #1004',
    memo: 'Failed payout to Bob Wilson',
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
  limit: number = 10,
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
