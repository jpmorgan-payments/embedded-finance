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
    { typeCode: 'ITAV', amount: 5000000 },
    { typeCode: 'ITBD', amount: 5000000 },
  ],
};

export const testScenario5DashboardRecipients: Recipient[] = [
  {
    id: 'ts5-recipient-001',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId,
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Ramp AI LLC',
      address: {
        addressLine1: '500 Innovation Blvd',
        city: 'San Jose',
        state: 'CA',
        postalCode: '95112',
        countryCode: 'US',
      },
      contacts: [
        { contactType: 'EMAIL', value: 'payments@rampai.demo' },
        { contactType: 'PHONE', value: '4085550101', countryCode: '+1' },
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
      businessName: 'Chip Conductors Inc',
      address: {
        addressLine1: '820 Semiconductor Dr',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        countryCode: 'US',
      },
      contacts: [
        { contactType: 'EMAIL', value: 'ap@chipconductors.demo' },
        { contactType: 'PHONE', value: '5125550142', countryCode: '+1' },
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
      businessName: 'GPU Labs LLC',
      address: {
        addressLine1: '200 Compute Way',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        countryCode: 'US',
      },
      contacts: [{ contactType: 'EMAIL', value: 'finance@gpulabs.demo' }],
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
];

export const testScenario5DashboardTransactions: TransactionsSearchResponseV2[] =
  [
    {
      id: 'ts5-txn-001',
      type: 'WIRE',
      status: 'COMPLETED',
      amount: 8000000,
      currency: 'USD',
      paymentDate: '2024-05-25',
      effectiveDate: '2024-05-25',
      creditorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      debtorAccountId: 'ts5-ext-lp-001',
      creditorName: 'Leap Frog Investments',
      debtorName: 'Leap Frog General Partners',
      postingVersion: 1,
      transactionReferenceId: 'Capital Call #101',
      memo: 'Capital contribution from Leap Frog General Partners',
    },
    {
      id: 'ts5-txn-002',
      type: 'ACH',
      status: 'COMPLETED',
      amount: 1000000,
      currency: 'USD',
      paymentDate: '2024-05-27',
      effectiveDate: '2024-05-28',
      creditorAccountId: 'ts5-vendor-001',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'Ramp AI LLC',
      debtorName: 'Leap Frog Investments',
      postingVersion: 1,
      transactionReferenceId: 'Investment #201',
      memo: 'Investment disbursement to Ramp AI LLC',
    },
    {
      id: 'ts5-txn-003',
      type: 'ACH',
      status: 'COMPLETED',
      amount: 1000000,
      currency: 'USD',
      paymentDate: '2024-05-27',
      effectiveDate: '2024-05-28',
      creditorAccountId: 'ts5-vendor-002',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'Chip Conductors Inc',
      debtorName: 'Leap Frog Investments',
      postingVersion: 1,
      transactionReferenceId: 'Investment #202',
      memo: 'Investment disbursement to Chip Conductors Inc',
    },
    {
      id: 'ts5-txn-004',
      type: 'ACH',
      status: 'COMPLETED',
      amount: 1000000,
      currency: 'USD',
      paymentDate: '2024-05-28',
      effectiveDate: '2024-05-29',
      creditorAccountId: 'ts5-vendor-003',
      debtorAccountId: TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
      creditorName: 'GPU Labs LLC',
      debtorName: 'Leap Frog Investments',
      postingVersion: 1,
      transactionReferenceId: 'Investment #203',
      memo: 'Investment disbursement to GPU Labs LLC',
    },
  ];
