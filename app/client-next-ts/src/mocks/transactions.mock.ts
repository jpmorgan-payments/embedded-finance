// Use types from the local generated schemas
import type {
  ListTransactionsSearchResponseV2,
  PaymentTypeResponse,
  TransactionsSearchResponseV2,
  TransactionStatus,
} from '../../../../embedded-components/src/api/generated/ep-transactions.schemas';

// Mock transaction data for TransactionsDisplay component.
//
// The showcase demo passes accountIds={['0030000131']} to TransactionsDisplay,
// so a transaction is treated as a PAYIN when its creditorAccountId matches the
// seller account and a PAYOUT otherwise. To keep the demo journey consistent:
// - Payins can only be from the platform (SellSense Marketplace).
// - Payouts are only made to the seller's linked account, held in the same
//   name as the onboarded entity (Neverland Books).
const SELLER_ACCOUNT_ID = '0030000131';
const LINKED_ACCOUNT_ID = 'neverland-books-linked-account';
const PLATFORM_ACCOUNT_ID = 'sellsense-platform-account';
const ENTITY_NAME = 'Neverland Books';
const PLATFORM_NAME = 'SellSense Marketplace';

export const mockTransactions: TransactionsSearchResponseV2[] = [
  {
    id: 'txn-001',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 2450.0,
    currency: 'USD',
    paymentDate: '2024-01-20',
    effectiveDate: '2024-01-21',
    creditorAccountId: SELLER_ACCOUNT_ID,
    debtorAccountId: PLATFORM_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: PLATFORM_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Settlement #90210',
    memo: 'Marketplace sales payin from SellSense',
  },
  {
    id: 'txn-002',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 1800.0,
    currency: 'USD',
    paymentDate: '2024-01-19',
    effectiveDate: '2024-01-20',
    creditorAccountId: LINKED_ACCOUNT_ID,
    debtorAccountId: SELLER_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: ENTITY_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Payout #1002',
    memo: 'Payout to linked bank account',
  },
  {
    id: 'txn-003',
    type: 'RTP' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 1275.5,
    currency: 'USD',
    paymentDate: '2024-01-18',
    effectiveDate: '2024-01-18',
    creditorAccountId: SELLER_ACCOUNT_ID,
    debtorAccountId: PLATFORM_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: PLATFORM_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Settlement #90188',
    memo: 'Marketplace sales payin from SellSense',
  },
  {
    id: 'txn-004',
    type: 'WIRE' as PaymentTypeResponse,
    status: 'PENDING' as TransactionStatus,
    amount: 2500.0,
    currency: 'USD',
    paymentDate: '2024-01-17',
    effectiveDate: '2024-01-18',
    creditorAccountId: LINKED_ACCOUNT_ID,
    debtorAccountId: SELLER_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: ENTITY_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Payout #1004',
    memo: 'Payout to linked bank account',
  },
  {
    id: 'txn-005',
    type: 'ACH' as PaymentTypeResponse,
    status: 'COMPLETED' as TransactionStatus,
    amount: 940.25,
    currency: 'USD',
    paymentDate: '2024-01-16',
    effectiveDate: '2024-01-17',
    creditorAccountId: SELLER_ACCOUNT_ID,
    debtorAccountId: PLATFORM_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: PLATFORM_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Settlement #90165',
    memo: 'Marketplace sales payin from SellSense',
  },
  {
    id: 'txn-006',
    type: 'ACH' as PaymentTypeResponse,
    status: 'REJECTED' as TransactionStatus,
    amount: 500.0,
    currency: 'USD',
    paymentDate: '2024-01-15',
    effectiveDate: '2024-01-16',
    creditorAccountId: LINKED_ACCOUNT_ID,
    debtorAccountId: SELLER_ACCOUNT_ID,
    creditorName: ENTITY_NAME,
    debtorName: ENTITY_NAME,
    postingVersion: 1,
    transactionReferenceId: 'Payout #1006',
    memo: 'Failed payout to linked bank account',
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
  (t) => t.status === 'COMPLETED'
);
export const mockPendingTransactions = mockTransactions.filter(
  (t) => t.status === 'PENDING'
);
export const mockFailedTransactions = mockTransactions.filter(
  (t) => t.status === 'REJECTED' || t.status === 'RETURNED'
);

// Function to create mock transaction
export const createMockTransaction = (
  overrides: Partial<TransactionsSearchResponseV2> = {}
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
  limit: number = 10
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
