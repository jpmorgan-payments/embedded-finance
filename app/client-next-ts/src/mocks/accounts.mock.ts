import type {
  AccountBalanceDto,
  AccountBalanceResponse,
  AccountResponse,
} from '@ef-api/ep-accounts-schemas';

/** OAS-aligned account list (e.g. for ListAccountsResponse.items). */
export const mockAccounts: { items: AccountResponse[] } = {
  items: [
    {
      id: 'acc-001',
      clientId: '0030000131',
      label: 'MAIN9012',
      state: 'OPEN',
      category: 'LIMITED_DDA',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '123456789012',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '987654321' }],
      },
    },
    {
      id: 'acc-002',
      clientId: '0030000131',
      label: 'MAIN1098',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '987654321098',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '123456789' }],
      },
    },
    ],
};

// Scenario-based account initialization (OAS AccountResponse[])
export const mockActiveAccounts: { items: AccountResponse[] } = {
  items: [
    {
      id: 'acc-001',
      clientId: '0030000131',
      label: 'MAIN9012',
      state: 'OPEN',
      category: 'LIMITED_DDA',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '123456789012',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '987654321' }],
      },
    },
  ],
};

export const mockActiveWithRecipientsAccounts: { items: AccountResponse[] } = {
  items: [
    {
      id: 'acc-002',
      clientId: '0030000131',
      label: 'MAIN1098',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      createdAt: '2023-10-28T20:56:55.074Z',
      paymentRoutingInformation: {
        accountNumber: '987654321098',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '123456789' }],
      },
    },
  ],
};

/** OAS AccountBalanceResponse + accountId for DB linkage. */
type AccountBalanceWithAccountId = AccountBalanceResponse & { accountId: string };

export const mockAccountBalance: AccountBalanceWithAccountId = {
  id: 'bal-001',
  accountId: 'acc-001',
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 5558.42 },
    { typeCode: 'ITBD', amount: 5758.42 },
  ] as AccountBalanceDto[],
};

export const mockAccountBalance2: AccountBalanceWithAccountId = {
  id: 'bal-002',
  accountId: 'acc-002',
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 1234.56 },
    { typeCode: 'ITBD', amount: 1345.67 },
  ] as AccountBalanceDto[],
};

// Scenario-based balance initialization
export const mockActiveBalances = [
  // Only balance for acc-001
  mockAccountBalance,
];

export const mockActiveWithRecipientsBalances = [
  // Both balances for ACTIVE_WITH_RECIPIENTS scenario
  mockAccountBalance,
];
