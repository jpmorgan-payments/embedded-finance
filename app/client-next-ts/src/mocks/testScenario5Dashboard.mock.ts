import type {
  AccountBalanceResponse,
  AccountResponse,
} from '@ef-api/ep-accounts-schemas';
import type { Recipient } from '@ef-api/ep-recipients-schemas';

import { TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID } from '@/msw/test-scenario-5';

import type { TransactionsSearchResponseV2 } from '../../../../embedded-components/src/api/generated/ep-transactions.schemas';
import { TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID } from './testScenarioNaicsCodesClient.mock';

const clientId = TEST_SCENARIO_BUNDLE_NAICS_CODES_CLIENT_ID;

export const testScenario5DashboardAccount: AccountResponse = {
  id: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
  clientId,
  label: 'PAY8899',
  state: 'OPEN',
  category: 'LIMITED_DDA_PAYMENTS',
  createdAt: '2024-03-10T14:22:00.000Z',
  paymentRoutingInformation: {
    accountNumber: '445566778899',
    country: 'US',
    routingInformation: [{ type: 'ABA', value: '021000021' }],
  },
};

export const testScenario5DashboardBalance: AccountBalanceResponse & {
  accountId: string;
} = {
  id: 'ts5-balance-001',
  accountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
  date: '2024-05-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 48250.75 },
    { typeCode: 'ITBD', amount: 48250.75 },
  ],
};

export const testScenario5DashboardRecipients: Recipient[] = [
  {
    id: 'ts5-recipient-001',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Morgan',
      lastName: 'Chen',
      address: {
        addressLine1: '88 Market Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        countryCode: 'US',
      },
      contacts: [
        { contactType: 'EMAIL', value: 'morgan.chen@email.com' },
        { contactType: 'PHONE', value: '4155550198', countryCode: '+1' },
      ],
    },
    account: {
      number: '3344556677',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '121000248',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'ts5-recipient-002',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'PackRight Fulfillment',
      address: {
        addressLine1: '410 Logistics Park Dr',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        countryCode: 'US',
      },
      contacts: [
        { contactType: 'EMAIL', value: 'ap@packright.demo' },
        { contactType: 'PHONE', value: '2145550142', countryCode: '+1' },
      ],
    },
    account: {
      number: '7788990011',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '111000025',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-02-10T11:30:00Z',
    updatedAt: '2024-02-10T11:30:00Z',
  },
  {
    id: 'ts5-recipient-003',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'BrightLane Suppliers',
      address: {
        addressLine1: '75 Harbor View Rd',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        countryCode: 'US',
      },
      contacts: [{ contactType: 'EMAIL', value: 'payments@brightlane.demo' }],
    },
    account: {
      number: '9900112233',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '121000248',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'USABA',
          routingNumber: '121000248',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-02-18T09:15:00Z',
    updatedAt: '2024-03-05T16:40:00Z',
  },
  {
    id: 'ts5-linked-001',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'CommerceBridge Operating Account',
      address: {
        addressLine1: '200 Commerce Way',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        countryCode: 'US',
      },
      contacts: [
        { contactType: 'EMAIL', value: 'treasury@commercebridge.demo' },
      ],
    },
    account: {
      number: '8899001122',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '111000025',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-20T08:30:00Z',
    updatedAt: '2024-01-20T08:30:00Z',
  },
];

export const testScenario5DashboardTransactions: TransactionsSearchResponseV2[] =
  [
    {
      id: 'ts5-txn-001',
      type: 'ACH',
      status: 'COMPLETED',
      amount: 3250.0,
      currency: 'USD',
      paymentDate: '2024-05-28',
      effectiveDate: '2024-05-29',
      creditorAccountId: 'ts5-vendor-001',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'PackRight Fulfillment',
      debtorName: 'CommerceBridge Marketplace',
      postingVersion: 1,
      transactionReferenceId: 'Payout #5501',
      memo: 'Weekly marketplace payout',
    },
    {
      id: 'ts5-txn-002',
      type: 'ACH',
      status: 'COMPLETED',
      amount: 1875.5,
      currency: 'USD',
      paymentDate: '2024-05-21',
      effectiveDate: '2024-05-22',
      creditorAccountId: 'ts5-vendor-002',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'BrightLane Suppliers',
      debtorName: 'CommerceBridge Marketplace',
      postingVersion: 1,
      transactionReferenceId: 'Payout #5498',
      memo: 'Supplier settlement',
    },
    {
      id: 'ts5-txn-003',
      type: 'WIRE',
      status: 'PENDING',
      amount: 9200.0,
      currency: 'USD',
      paymentDate: '2024-05-30',
      effectiveDate: '2024-05-31',
      creditorAccountId: 'ts5-vendor-003',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'Global Freight Co.',
      debtorName: 'CommerceBridge Marketplace',
      postingVersion: 1,
      transactionReferenceId: 'Payout #5510',
      memo: 'International freight charges',
    },
  ];
