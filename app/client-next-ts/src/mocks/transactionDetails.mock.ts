import type { TransactionGetResponse } from 'generated-api-models';

export const transactionDetailsMock: TransactionGetResponse = {
  id: '123434534',
  creditorAccount: '20000023556044',
  creditorName: 'JPMC',
  debtorAccount: '20000023556044',
  debtorName: 'JPMC',
  amount: 100,
  currency: 'USD',
  memo: 'Invoice 1234',
  paymentDate: '01-01-2022',
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
  accountingType: 'DR',
  status: 'PENDING',
  transactionType: 'PAYIN',
} as TransactionGetResponse;
