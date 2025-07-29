export const mockAccounts = {
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

// Scenario-based account initialization
export const mockActiveAccounts = {
  items: [
    // Only acc-001 for ACTIVE scenario (similar to linked accounts only)
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

export const mockActiveWithRecipientsAccounts = {
  items: [
    // Both accounts for ACTIVE_WITH_RECIPIENTS scenario

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

export const mockAccountBalance = {
  id: 'bal-001', // Unique balance record ID
  accountId: 'acc-001', // Foreign key reference to account
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 5558.42 },
    { typeCode: 'ITBD', amount: 5758.42 },
  ],
};

export const mockAccountBalance2 = {
  id: 'bal-002', // Unique balance record ID
  accountId: 'acc-002', // Foreign key reference to account
  date: '2023-10-28',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 1234.56 },
    { typeCode: 'ITBD', amount: 1345.67 },
  ],
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
