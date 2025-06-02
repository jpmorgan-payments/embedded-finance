import type { ListRecipientsResponse } from 'generated-api-models';

export const recipientsMock: ListRecipientsResponse = {
  page: 0,
  limit: 25,
  total_items: 3,
  recipients: [
    {
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Luella',
        lastName: 'Feeney',
        contacts: [
          {
            contactType: 'PHONE',
            countryCode: '+44',
            value: '5343245789',
          },
          {
            contactType: 'EMAIL',
            value: 'luella.doe@company.com',
          },
        ],
      },
      account: {
        number: '021000021',
        type: 'CHECKING',
        routingCodeType: 'USABA',
        routingNumber: '021000028',
        countryCode: 'US',
      },
      id: 'a8eb71c9-7bbb-41f2-8d9e-b0f52d1ecd71',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '123 Wouda St',
          addressLine2: 'Malibu Point',
          addressLine3: 'Greater Woking',
          city: 'Springfield',
          countryCode: 'US',
          state: 'NY',
          zip: '12222',
        },
        type: 'INDIVIDUAL',
        firstName: 'Jon',
        lastName: 'Smith',
        contacts: [
          {
            contactType: 'PHONE',
            countryCode: '+44',
            value: '5343245123',
          },
        ],
      },
      account: {
        number: '021000022',
        type: 'CHECKING',
        routingCodeType: 'USABA',
        routingNumber: '021000023',
        countryCode: 'US',
      },
      id: 'a8eb71c9-7bbb-41f2-8d9e-b0f52d1ecd72',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '123 Wouda St',
          addressLine2: 'Malibu Point',
          addressLine3: 'Greater Woking',
          city: 'Springfield',
          countryCode: 'US',
          state: 'NY',
          zip: '12222',
        },
        type: 'ORGANIZATION',
        businessName: 'Widget Co.',
      },
      account: {
        number: '021000024',
        type: 'CHECKING',
        routingCodeType: 'USABA',
        routingNumber: '021000025',
        countryCode: 'US',
      },
      id: 'a8eb71c9-7bbb-41f2-8d9e-b0f52d1ecd73',
    },
  ],
} as ListRecipientsResponse;
