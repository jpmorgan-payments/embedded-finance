import type { ListAccountsResponse } from 'generated-api-models';

export const accountsMock: ListAccountsResponse = {
  metadata: { page: 0, limit: 25, total_items: 2 },
  items: [
    {
      id: '9he92llalh1ago16v66b5deyzyuoy8412',
      label: 'RAINYDAY',
      state: 'CLOSED',
      paymentRoutingInformation: {
        country: 'US',
        accountNumber: '09844712454750',
        routingInformation: [
          {
            value: '028000024',
            type: 'ABA',
          },
        ],
      },
    },
    {
      id: 'dc2eda9084bf40b7a1d8baa8c5e0ea0ax',
      label: 'TAXES1234',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000113278882',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000025',
          },
        ],
      },
    },
  ],
} as ListAccountsResponse;
