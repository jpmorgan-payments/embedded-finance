import type { ListRecipientsResponse, Recipient } from '@ef-api/ep-recipients-schemas';

// Mock recipients data for Recipients component (OAS ListRecipientsResponse)
export const mockRecipientsResponse: ListRecipientsResponse = {
  recipients: [
    {
      id: 'recipient-001',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: 'client-001',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        address: {
          addressLine1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'john.doe@email.com',
          },
          {
            contactType: 'PHONE',
            value: '5551234567',
            countryCode: '+1',
          },
        ],
      },
      account: {
        number: '1234567890',
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '021000021',
            transactionType: 'ACH',
          },
        ],
      },
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'recipient-002',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: 'client-001',
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
          {
            contactType: 'WEBSITE',
            value: 'https://www.acme.com',
          },
        ],
      },
      account: {
        number: '9876543210',
        type: 'CHECKING',
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
    {
      id: 'recipient-004',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      clientId: 'client-001',
      partyDetails: {
        type: 'ORGANIZATION',
        businessName: 'Tech Solutions Inc',
        address: {
          addressLine1: '321 Tech Blvd',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'payments@techsolutions.com',
          },
          {
            contactType: 'PHONE',
            value: '5559876543',
            countryCode: '+1',
          },
        ],
      },
      account: {
        number: '4444555566',
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '122105278',
            transactionType: 'ACH',
          },
        ],
      },
      createdAt: '2024-01-12T09:00:00Z',
      updatedAt: '2024-01-24T10:30:00Z',
    },
  ],
  page: 0,
  limit: 4,
  total_items: 3,
  metadata: {
    page: 0,
    limit: 4,
    total_items: 3,
  },
};

// Mock empty recipients response
export const mockEmptyRecipientsResponse = {
  recipients: [],
  page: 0,
  limit: 10,
  total_items: 0,
  metadata: {
    page: 0,
    limit: 10,
    total_items: 0,
  },
};

// Mock recipients with different statuses
export const mockActiveRecipients = (mockRecipientsResponse.recipients ?? []).filter(
  (r) => r.status === 'ACTIVE'
);

// Mock verification responses
export const mockVerificationSuccess = {
  id: 'recipient-001',
  status: 'ACTIVE',
  message: 'Microdeposit verification successful',
  verifiedAt: new Date().toISOString(),
};

export const mockVerificationFailure = {
  id: 'recipient-001',
  status: 'REJECTED',
  message: 'Invalid microdeposit amounts provided',
  error: 'VERIFICATION_FAILED',
};

// Function to create mock recipient
export const createMockRecipient = (
  overrides: Partial<Recipient> = {}
): Recipient => {
  return {
    id: `recipient-${Date.now()}`,
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Mock',
      lastName: 'User',
      address: {
        addressLine1: '123 Mock Street',
        city: 'Mock City',
        state: 'MC',
        postalCode: '12345',
        countryCode: 'US',
      },
      contacts: [
        {
          contactType: 'EMAIL',
          value: 'mock@email.com',
        },
      ],
    },
    account: {
      number: '1234567890',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '021000021',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

// Function to create paginated recipients response
export const createMockRecipientsResponse = (
  recipients: Recipient[] = mockRecipientsResponse.recipients ?? [],
  page: number = 0,
  limit: number = 25
): ListRecipientsResponse => {
  // Use 0-based page index (OAS-aligned)
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedRecipients = recipients.slice(startIndex, endIndex);

  return {
    recipients: paginatedRecipients,
    page,
    limit,
    total_items: recipients.length,
    metadata: {
      page,
      limit,
      total_items: recipients.length,
    },
  };
};
