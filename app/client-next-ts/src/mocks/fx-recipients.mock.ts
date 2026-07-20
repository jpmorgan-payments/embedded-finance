import type {
  ListRecipientsResponse,
  Recipient,
} from '@ef-api/ep-recipients-schemas';

/**
 * International (non-USD) recipients for SellSense scenario #8 (FX payments).
 * Mirrors PaymentFlowFX Storybook fixtures so Pay opens the FX flow.
 */
export const mockFxRecipientsResponse: ListRecipientsResponse = {
  recipients: [
    {
      id: 'recipient-eur-isabelle',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: '0030000132',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Isabelle',
        lastName: 'Moreau',
        address: {
          addressLine1: '10 Rue de Rivoli',
          city: 'Paris',
          postalCode: '75001',
          countryCode: 'FR',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'isabelle.moreau@email.fr',
          },
        ],
      },
      account: {
        number: 'FR7630006000011234567890189',
        type: 'CHECKING',
        currencyCode: 'EUR',
        countryCode: 'FR',
        routingInformation: [
          {
            routingCodeType: 'SWIFT',
            routingNumber: 'BNPAFRPP',
            transactionType: 'WIRE',
          },
        ],
      },
      createdAt: '2024-02-01T08:15:00Z',
      updatedAt: '2024-02-01T08:15:00Z',
    },
    {
      id: 'recipient-gbp-thames',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: '0030000132',
      partyDetails: {
        type: 'ORGANIZATION',
        businessName: 'Thames Trading Ltd',
        address: {
          addressLine1: '1 Canada Square',
          city: 'London',
          postalCode: 'E14 5AB',
          countryCode: 'GB',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'ap@thamestrading.co.uk',
          },
        ],
      },
      account: {
        number: 'GB29NWBK60161331926819',
        type: 'CHECKING',
        currencyCode: 'GBP',
        countryCode: 'GB',
        routingInformation: [
          {
            routingCodeType: 'SWIFT',
            routingNumber: 'NWBKGB2L',
            transactionType: 'ACH',
          },
          {
            routingCodeType: 'SWIFT',
            routingNumber: 'NWBKGB2L',
            transactionType: 'WIRE',
          },
        ],
      },
      createdAt: '2024-02-03T13:30:00Z',
      updatedAt: '2024-02-03T13:30:00Z',
    },
    {
      id: 'recipient-sgd-tan',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: '0030000132',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Wei',
        lastName: 'Tan',
        address: {
          addressLine1: '1 Raffles Place',
          city: 'Singapore',
          postalCode: '048616',
          countryCode: 'SG',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'wei.tan@email.sg',
          },
        ],
      },
      account: {
        number: 'SG1234567890',
        type: 'CHECKING',
        currencyCode: 'SGD',
        countryCode: 'SG',
        routingInformation: [
          {
            routingCodeType: 'SWIFT',
            routingNumber: 'DBSSSGSG',
            transactionType: 'WIRE',
          },
        ],
      },
      createdAt: '2024-02-05T10:30:00Z',
      updatedAt: '2024-02-05T10:30:00Z',
    },
    // Domestic USD recipient for parity comparison in the FX scenario
    {
      id: 'recipient-usd-acme',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: '0030000132',
      partyDetails: {
        type: 'ORGANIZATION',
        businessName: 'Acme Corporation',
        address: {
          addressLine1: '456 Business Ave',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'payments@acme.com',
          },
        ],
      },
      account: {
        number: '9876543210',
        type: 'CHECKING',
        currencyCode: 'USD',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '121000248',
            transactionType: 'ACH',
          },
          {
            routingCodeType: 'USABA',
            routingNumber: '121000248',
            transactionType: 'WIRE',
          },
        ],
      },
      createdAt: '2024-01-10T14:20:00Z',
      updatedAt: '2024-01-16T09:15:00Z',
    },
  ] as Recipient[],
  page: 0,
  limit: 10,
  total_items: 4,
  metadata: {
    page: 0,
    limit: 10,
    total_items: 4,
  },
};
