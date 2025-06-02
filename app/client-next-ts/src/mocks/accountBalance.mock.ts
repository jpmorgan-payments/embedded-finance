import type { AccountBalanceResponse } from 'generated-api-models';

export const accountBalanceMock: AccountBalanceResponse = {
  id: '9he92llalh1ago16v66b5deyzyuoy8412',
  date: '2020-03-12',
  currency: 'USD',
  balanceTypes: [
    {
      amount: 5655.3,
      typeCode: 'ITAV',
    },
    {
      amount: 5695.67,
      typeCode: 'ITBD',
    },
  ],
} as AccountBalanceResponse;
