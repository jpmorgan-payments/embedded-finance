import type { TransactionResponse } from 'generated-api-models';

export const transactionCreateResponseMock: TransactionResponse = {
  id: '123434534',
  status: 'PENDING',
  type: 'ACH',
  accountId: 'dc2eda9084bf40b7a1d8baa8c5e0ea0ax',
  accountNumber: '20000023556044',
  recipient: {
    partyDetails: {
      address: {
        addressLine1: '345 Wouda St',
        addressLine2: 'Malibu Point',
        addressLine3: 'Greater Woking',
        city: 'Springfield',
        countryCode: 'US',
        state: 'ND',
        zip: '58008',
      },
      type: 'INDIVIDUAL',
      firstName: 'Jon',
      lastName: 'Smith',
      businessName: 'Widget Co.',
      contacts: [
        {
          contactType: 'PHONE',
          countryCode: '+44',
          value: '5343245789',
        },
      ],
    },
    account: {
      number: '021000021',
      type: 'CHECKING',
      routingCodeType: 'USABA',
      routingNumber: '021000021',
      countryCode: 'US',
    },
  },
  amount: 100,
  currency: 'USD',
  memo: 'Invoice 1234',
  paymentDate: '2022-12-31',
  c2ProfileId: '0030000132',
  debitCardDetails: {
    cardPaymentRoutingNumber: '2000303444',
    cardLast4: '0000',
    cardSerialNumber: '100000158935',
    messageType: '1200',
    cardTransactionType: 'CR',
    isa: '0',
    surcharge: 1,
    merchant: {
      name: 'XYZ001',
      address: {
        addressLine1: '345 Wouda St',
        city: 'Springfield',
        countryCode: 'US',
        state: 'ND',
        zip: '58008',
      },
    },
  },
} as TransactionResponse;
