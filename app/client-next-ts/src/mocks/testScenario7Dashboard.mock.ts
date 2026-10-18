import type {
  AccountBalanceResponse,
  AccountResponse,
} from '@ef-api/ep-accounts-schemas';
import type { Recipient } from '@ef-api/ep-recipients-schemas';

import type { TransactionsSearchResponseV2 } from '../../../../embedded-components/src/api/generated/ep-transactions.schemas';
import { TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID } from './testScenarioBigSellerClient.mock';

/** `/test-scenario-7` approved-client dashboard: marketplace payouts in, supplier payments out. */
export const TEST_SCENARIO_7_DASHBOARD_ACCOUNT_ID = 'ts7-acc-payments';

const clientId = TEST_SCENARIO_BUNDLE_BIG_SELLER_CLIENT_ID;
const accountId = TEST_SCENARIO_7_DASHBOARD_ACCOUNT_ID;

export const testScenario7DashboardAccount: AccountResponse = {
  id: accountId,
  clientId,
  label: 'PAY4521',
  state: 'OPEN',
  category: 'LIMITED_DDA_PAYMENTS',
  createdAt: '2026-09-02T15:20:00.000Z',
  paymentRoutingInformation: {
    accountNumber: '771234564521',
    country: 'US',
    routingInformation: [{ type: 'ABA', value: '021000021' }],
  },
};

export const testScenario7DashboardBalance: AccountBalanceResponse & {
  accountId: string;
} = {
  id: 'ts7-balance-001',
  accountId,
  date: '2026-10-15',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 220084.65 },
    { typeCode: 'ITBD', amount: 222225.15 },
  ],
};

function supplier(
  id: string,
  businessName: string,
  address: NonNullable<Recipient['partyDetails']>['address'],
  email: string,
  accountNumber: string,
  transactionTypes: Array<'ACH' | 'WIRE'>
): Recipient {
  return {
    id,
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'ORGANIZATION',
      businessName,
      address,
      contacts: [{ contactType: 'EMAIL', value: email }],
    },
    account: {
      number: accountNumber,
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: transactionTypes.map((transactionType) => ({
        routingCodeType: 'USABA',
        routingNumber: '121000248',
        transactionType,
      })),
    },
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
  };
}

export const testScenario7DashboardRecipients: Recipient[] = [
  supplier(
    'ts7-recipient-001',
    'Northwind Home Goods LLC',
    {
      addressLine1: '1500 Commerce Pkwy',
      city: 'Columbus',
      state: 'OH',
      postalCode: '43215',
      countryCode: 'US',
    },
    'ar@northwind-home.demo',
    '5566771042',
    ['ACH']
  ),
  supplier(
    'ts7-recipient-002',
    'Pacific Packaging Co',
    {
      addressLine1: '42 Harbor Industrial Rd',
      city: 'Oakland',
      state: 'CA',
      postalCode: '94607',
      countryCode: 'US',
    },
    'billing@pacific-packaging.demo',
    '6677887781',
    ['ACH']
  ),
  supplier(
    'ts7-recipient-003',
    'Coastal Freight Logistics Inc',
    {
      addressLine1: '900 Terminal Way',
      city: 'Long Beach',
      state: 'CA',
      postalCode: '90802',
      countryCode: 'US',
    },
    'finance@coastal-freight.demo',
    '7788993310',
    ['ACH', 'WIRE']
  ),
];

function transaction(
  id: string,
  direction: 'in' | 'out',
  counterparty: { id: string; name: string },
  details: Pick<
    TransactionsSearchResponseV2,
    'type' | 'status' | 'amount' | 'paymentDate' | 'effectiveDate'
  > & { reference: string; memo: string }
): TransactionsSearchResponseV2 {
  const ours = { id: accountId, name: 'Big Seller Corp' };
  const [creditor, debtor] =
    direction === 'in' ? [ours, counterparty] : [counterparty, ours];
  return {
    id,
    type: details.type,
    status: details.status,
    amount: details.amount,
    currency: 'USD',
    paymentDate: details.paymentDate,
    effectiveDate: details.effectiveDate,
    creditorAccountId: creditor.id,
    creditorName: creditor.name,
    debtorAccountId: debtor.id,
    debtorName: debtor.name,
    postingVersion: 1,
    transactionReferenceId: details.reference,
    memo: details.memo,
  };
}

const marketplace = { id: 'ts7-ext-marketplace', name: 'Platform, Inc.' };

export const testScenario7DashboardTransactions: TransactionsSearchResponseV2[] =
  [
    transaction('ts7-txn-001', 'in', marketplace, {
      type: 'ACH',
      status: 'COMPLETED',
      amount: 125000,
      paymentDate: '2026-09-16',
      effectiveDate: '2026-09-17',
      reference: 'Payout 2026-09A',
      memo: 'Marketplace payout — sales Sep 1–15',
    }),
    transaction(
      'ts7-txn-002',
      'out',
      { id: 'ts7-recipient-001', name: 'Northwind Home Goods LLC' },
      {
        type: 'ACH',
        status: 'COMPLETED',
        amount: 18450.25,
        paymentDate: '2026-09-19',
        effectiveDate: '2026-09-22',
        reference: 'PO-1042',
        memo: 'Inventory restock — home goods',
      }
    ),
    transaction(
      'ts7-txn-003',
      'out',
      { id: 'ts7-recipient-002', name: 'Pacific Packaging Co' },
      {
        type: 'ACH',
        status: 'COMPLETED',
        amount: 6320,
        paymentDate: '2026-09-24',
        effectiveDate: '2026-09-25',
        reference: 'INV-7781',
        memo: 'Shipping boxes and mailers',
      }
    ),
    transaction('ts7-txn-004', 'in', marketplace, {
      type: 'ACH',
      status: 'COMPLETED',
      amount: 131870.4,
      paymentDate: '2026-10-01',
      effectiveDate: '2026-10-02',
      reference: 'Payout 2026-09B',
      memo: 'Marketplace payout — sales Sep 16–30',
    }),
    transaction(
      'ts7-txn-005',
      'out',
      { id: 'ts7-recipient-003', name: 'Coastal Freight Logistics Inc' },
      {
        type: 'WIRE',
        status: 'COMPLETED',
        amount: 9875,
        paymentDate: '2026-10-06',
        effectiveDate: '2026-10-06',
        reference: 'FRT-10-2026',
        memo: 'Freight — October inbound containers',
      }
    ),
    transaction(
      'ts7-txn-006',
      'out',
      { id: 'ts7-recipient-001', name: 'Northwind Home Goods LLC' },
      {
        type: 'ACH',
        status: 'PENDING',
        amount: 2140.5,
        paymentDate: '2026-10-15',
        effectiveDate: '2026-10-16',
        reference: 'PO-1057',
        memo: 'Inventory restock — seasonal decor',
      }
    ),
  ];
