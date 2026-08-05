/**
 * Mock data for the C1 (efs-de-ui / Digital Enablement UI) test scenario.
 *
 * Values are aligned with the C1 production mock data
 * (`efs-de-ui/src/lib/services/mockData.ts` — `mockParticipantsData`).
 * Only the fields exercised by the two showcase views (platform participants
 * list + participant accounts drill-down) are kept, to stay minimal.
 */

export interface C1Account {
  id: string;
  category: 'LIMITED_DDA' | 'LIMITED_DDA_PAYMENTS';
  state: 'OPEN' | 'CLOSED' | 'PENDING_CLOSE';
  accountNumber: string;
  /** Payment Routing Network status */
  prnStatus: 'ACTIVE' | 'INACTIVE';
  abaRouting: string;
  balance: string;
  transactionCount: number;
}

export interface C1Participant {
  id: string;
  createdDate: string;
  clientId: string;
  businessName: string;
  onboardingStatus: string;
  epAccount: 'Y' | 'N';
  linkedAccount: string;
  transactionCount: string;
  balance: string;
  accounts: C1Account[];
}

const aba = (value: string, prnStatus: C1Account['prnStatus']): Pick<
  C1Account,
  'abaRouting' | 'prnStatus'
> => ({ abaRouting: value, prnStatus });

export const c1Participants: C1Participant[] = [
  {
    id: '1',
    createdDate: '2025-12-15',
    clientId: 'CLI-001',
    businessName: 'Acme Corporation',
    onboardingStatus: 'Approved',
    epAccount: 'Y',
    linkedAccount: 'Active',
    transactionCount: '274',
    balance: '$45,181.42',
    accounts: [
      {
        id: 'd5aaf0db11e747daa2d955806f6eb14e',
        category: 'LIMITED_DDA',
        state: 'OPEN',
        accountNumber: '20000057601234',
        balance: '$24,891.32',
        transactionCount: 156,
        ...aba('028000024', 'INACTIVE'),
      },
      {
        id: 'a7bc3f19e2454a8cb1d6ef8901234567',
        category: 'LIMITED_DDA_PAYMENTS',
        state: 'OPEN',
        accountNumber: '20000057605678',
        balance: '$12,400.00',
        transactionCount: 43,
        ...aba('028000024', 'ACTIVE'),
      },
    ],
  },
  {
    id: '2',
    createdDate: '2025-12-18',
    clientId: 'CLI-002',
    businessName: 'TechStart Inc',
    onboardingStatus: 'Review In Progress',
    epAccount: 'N',
    linkedAccount: 'Pending',
    transactionCount: '0',
    balance: '$0.00',
    accounts: [],
  },
  {
    id: '3',
    createdDate: '2025-12-20',
    clientId: 'CLI-003',
    businessName: 'Global Traders LLC',
    onboardingStatus: 'Approved',
    epAccount: 'Y',
    linkedAccount: 'Active',
    transactionCount: '401',
    balance: '$64,070.00',
    accounts: [
      {
        id: 'c9de5f31a4675c0eb3f80123456789ab',
        category: 'LIMITED_DDA_PAYMENTS',
        state: 'OPEN',
        accountNumber: '20000057607890',
        balance: '$45,320.00',
        transactionCount: 312,
        ...aba('028000024', 'ACTIVE'),
      },
      {
        id: 'd0ef6042b5786d1fc4091234567890cd',
        category: 'LIMITED_DDA',
        state: 'OPEN',
        accountNumber: '20000057602345',
        balance: '$18,750.00',
        transactionCount: 89,
        ...aba('028000024', 'INACTIVE'),
      },
    ],
  },
  {
    id: '4',
    createdDate: '2025-12-22',
    clientId: 'CLI-004',
    businessName: 'Sunshine Enterprises',
    onboardingStatus: 'Declined',
    epAccount: 'N',
    linkedAccount: 'Inactive',
    transactionCount: '0',
    balance: '$0.00',
    accounts: [],
  },
  {
    id: '5',
    createdDate: '2026-01-05',
    clientId: 'CLI-005',
    businessName: 'NextGen Solutions',
    onboardingStatus: 'Information Requested',
    epAccount: 'N',
    linkedAccount: 'Pending',
    transactionCount: '0',
    balance: '$0.00',
    accounts: [],
  },
  {
    id: '6',
    createdDate: '2026-01-08',
    clientId: 'CLI-006',
    businessName: 'Prime Finance Co',
    onboardingStatus: 'Approved',
    epAccount: 'Y',
    linkedAccount: 'Active',
    transactionCount: '789',
    balance: '$98,210.55',
    accounts: [
      {
        id: 'e1f07053b6897e2ad5012345678901ef',
        category: 'LIMITED_DDA_PAYMENTS',
        state: 'OPEN',
        accountNumber: '20000057606789',
        balance: '$98,210.55',
        transactionCount: 789,
        ...aba('028000024', 'ACTIVE'),
      },
    ],
  },
  {
    id: '7',
    createdDate: '2026-01-10',
    clientId: 'CLI-007',
    businessName: 'Digital Payments Ltd',
    onboardingStatus: 'Submitted',
    epAccount: 'N',
    linkedAccount: 'Pending',
    transactionCount: '0',
    balance: '$0.00',
    accounts: [],
  },
  {
    id: '8',
    createdDate: '2026-01-12',
    clientId: 'CLI-008',
    businessName: 'Merchant Services Pro',
    onboardingStatus: 'Approved',
    epAccount: 'Y',
    linkedAccount: 'Active',
    transactionCount: '1,567',
    balance: '$45,672.18',
    accounts: [
      {
        id: 'f2a18164c7908f3be6123456789012ab',
        category: 'LIMITED_DDA',
        state: 'OPEN',
        accountNumber: '20000057603456',
        balance: '$45,672.18',
        transactionCount: 1567,
        ...aba('028000024', 'INACTIVE'),
      },
    ],
  },
  {
    id: '9',
    createdDate: '2026-01-15',
    clientId: 'CLI-009',
    businessName: 'Harbor Logistics',
    onboardingStatus: 'Review In Progress',
    epAccount: 'N',
    linkedAccount: 'Pending',
    transactionCount: '0',
    balance: '$0.00',
    accounts: [],
  },
];

export const ONBOARDING_STATUS_OPTIONS = [
  'ALL',
  'Approved',
  'Declined',
  'Information Requested',
  'Review In Progress',
  'Submitted',
] as const;

export const LINKED_ACCOUNT_STATUS_OPTIONS = [
  'ALL',
  'Active',
  'Inactive',
  'Pending',
] as const;

export const HAS_BALANCE_OPTIONS = ['ALL', 'YES', 'NO'] as const;

export const SEARCH_BY_OPTIONS = ['Client ID'] as const;

export const ACCOUNT_CREATED_DATE_OPTIONS = ['ALL', '7 Days'] as const;

/** Selected/assumed platform for this scenario (no selection UI needed). */
export const C1_PLATFORM = {
  id: 'PLTF-0001',
  name: 'Embedded Payments Platform',
};

// --------------------------------------------------------------------------
// Platform-level processing accounts (aligned with mockPlatformAccountDetails)
// --------------------------------------------------------------------------

export type PlatformAccountCategory =
  | 'PROCESSING'
  | 'PROCESSING_OFFSET'
  | 'CLIENT_OFFSET'
  | 'MANAGEMENT';

export interface C1PlatformAccount {
  accountId: string;
  accountCategory: PlatformAccountCategory;
  accountNumber: string;
  accountState: 'OPEN' | 'CLOSED' | 'PENDING_CLOSE';
  startOfDayBalance: number;
  endOfDayBalance: number;
  achRouting: string;
  wireRouting: string;
  transactionTypes: string[];
  label?: string;
}

export const PLATFORM_ACCOUNT_CATEGORY_LABELS: Record<PlatformAccountCategory, string> = {
  PROCESSING: 'Processing',
  PROCESSING_OFFSET: 'Processing Offset',
  CLIENT_OFFSET: 'Client Offset',
  MANAGEMENT: 'Management',
};

export const c1PlatformAccounts: C1PlatformAccount[] = [
  {
    accountId: 'da7d4280d614465bb1aedeaeea1168f5',
    accountCategory: 'PROCESSING',
    accountNumber: '1234567890',
    accountState: 'OPEN',
    startOfDayBalance: 4850000.0,
    endOfDayBalance: 5234567.89,
    achRouting: '021000021',
    wireRouting: '021000021',
    transactionTypes: ['ACH', 'WIRE', 'RTP'],
    label: 'MAIN517',
  },
  {
    accountId: 'b79022374db1451f89ca6d80e1878aee',
    accountCategory: 'PROCESSING_OFFSET',
    accountNumber: '2345678901',
    accountState: 'OPEN',
    startOfDayBalance: 1200000.0,
    endOfDayBalance: 1185000.0,
    achRouting: '021000021',
    wireRouting: '021000021',
    transactionTypes: ['ACH', 'WIRE'],
    label: 'OFFSET517',
  },
  {
    accountId: '0734645088374d649e7d2c4a1e9d6798',
    accountCategory: 'CLIENT_OFFSET',
    accountNumber: '3456789012',
    accountState: 'OPEN',
    startOfDayBalance: 875000.0,
    endOfDayBalance: 912000.0,
    achRouting: '021000021',
    wireRouting: '021000021',
    transactionTypes: ['ACH', 'WIRE', 'RTP'],
  },
  {
    accountId: 'd0512afb10434aeb873107517493dce3',
    accountCategory: 'MANAGEMENT',
    accountNumber: '4567890123',
    accountState: 'OPEN',
    startOfDayBalance: 250000.0,
    endOfDayBalance: 248500.0,
    achRouting: '021000021',
    wireRouting: '021000021',
    transactionTypes: ['WIRE'],
  },
];

export const C1_PLATFORM_SUMMARY = {
  totalPayin: '$500,000.00',
  totalPayout: '$120,000.00',
};

// --------------------------------------------------------------------------
// Transactions (aligned with mockTransactionsData) — used by account detail
// --------------------------------------------------------------------------

export interface C1Transaction {
  id: string;
  createdDate: string;
  transactionId: string;
  transactionReferenceId: string;
  fromAccount: string;
  toAccount: string;
  status: string;
  type: string;
  amount: string;
  currency: string;
}

export const c1Transactions: C1Transaction[] = [
  { id: 'TXN001', createdDate: '2026-01-13 10:30 AM', transactionId: 'TXN001', transactionReferenceId: 'INV-PAY-1001', fromAccount: '****5678', toAccount: '****1234', status: 'Completed', type: 'Wire', amount: '+$25,000.00', currency: 'USD' },
  { id: 'TXN002', createdDate: '2026-01-13 09:15 AM', transactionId: 'TXN002', transactionReferenceId: 'INV-PAY-1002', fromAccount: '****1234', toAccount: '****9876', status: 'Pending', type: 'ACH', amount: '-$5,500.00', currency: 'USD' },
  { id: 'TXN003', createdDate: '2026-01-12 04:20 PM', transactionId: 'TXN003', transactionReferenceId: 'RTP-2026-0033', fromAccount: '****3344', toAccount: '****1234', status: 'Completed', type: 'RTP', amount: '+$10,250.50', currency: 'USD' },
  { id: 'TXN004', createdDate: '2026-01-12 02:10 PM', transactionId: 'TXN004', transactionReferenceId: 'INV-PAY-1004', fromAccount: '****1234', toAccount: '****7788', status: 'Failed', type: 'Wire', amount: '-$50,000.00', currency: 'USD' },
  { id: 'TXN005', createdDate: '2026-01-12 11:05 AM', transactionId: 'TXN005', transactionReferenceId: 'ACH-2026-0051', fromAccount: '****2211', toAccount: '****1234', status: 'Completed', type: 'ACH', amount: '+$8,750.25', currency: 'USD' },
  { id: 'TXN006', createdDate: '2026-06-23 09:15 AM', transactionId: 'TXN006', transactionReferenceId: 'GT-INV-6006', fromAccount: '****7890', toAccount: '****4411', status: 'Completed', type: 'Wire', amount: '-$12,500.00', currency: 'USD' },
  { id: 'TXN007', createdDate: '2026-06-22 03:45 PM', transactionId: 'TXN007', transactionReferenceId: 'GT-ACH-6007', fromAccount: '****6622', toAccount: '****7890', status: 'Completed', type: 'ACH', amount: '+$8,200.00', currency: 'USD' },
  { id: 'TXN008', createdDate: '2026-06-22 11:30 AM', transactionId: 'TXN008', transactionReferenceId: 'GT-RTP-6008', fromAccount: '****7890', toAccount: '****3399', status: 'Completed', type: 'RTP', amount: '-$3,750.00', currency: 'USD' },
  { id: 'TXN009', createdDate: '2026-06-21 02:20 PM', transactionId: 'TXN009', transactionReferenceId: 'GT-INV-6009', fromAccount: '****8855', toAccount: '****7890', status: 'Completed', type: 'Wire', amount: '+$22,000.00', currency: 'USD' },
  { id: 'TXN010', createdDate: '2026-06-21 10:05 AM', transactionId: 'TXN010', transactionReferenceId: 'GT-FEE-6010', fromAccount: '****7890', toAccount: '****1177', status: 'Completed', type: 'Fee', amount: '-$25.00', currency: 'USD' },
  { id: 'TXN011', createdDate: '2026-06-20 04:50 PM', transactionId: 'TXN011', transactionReferenceId: 'GT-RTP-6011', fromAccount: '****2233', toAccount: '****7890', status: 'Completed', type: 'RTP', amount: '+$15,800.00', currency: 'USD' },
];
