export const mockAccounts = {
  items: [
    {
      id: 'acc-001',
      clientId: '0030000131',
      label: 'Main Account',
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
      label: 'Payments Account',
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
