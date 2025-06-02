import type { AccountResponse } from 'generated-api-models';

export const accountCreateResponseMock: AccountResponse = {
  id: 'dc2eda9084bf40b7a1d8baa8c5e0ea0ax',
  label: 'TAXES1234',
  state: 'OPEN',
  paymentRoutingInformation: {
    accountNumber: '20000113278882',
    country: 'US',
    routingInformation: [
      {
        type: 'ABA',
        value: '028000024',
      },
    ],
    status: 'ACTIVE',
  },
} as AccountResponse;
