import type { Recipient } from 'generated-api-models';

export const recipientCreateResponseMock: Recipient = {
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
  id: 'a8eb71c9-7bbb-41f2-8d9e-b0f52d1ecd71',
} as Recipient;
