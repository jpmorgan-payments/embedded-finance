import type {
  ListRecipientsResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';

// Mock individual recipient
export const mockIndividualRecipient: Recipient = {
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
      addressLine2: 'Apt 4B',
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
};

// Mock organization recipient
export const mockOrganizationRecipient: Recipient = {
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
};

// Mock linked account recipient
export const mockLinkedAccountRecipient: Recipient = {
  id: 'recipient-004',
  type: 'LINKED_ACCOUNT',
  status: 'ACTIVE',
  clientId: 'client-001',
  partyId: 'party-001',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Michael',
    lastName: 'Johnson',
    address: {
      addressLine1: '321 Pine Street',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      countryCode: 'US',
    },
    contacts: [
      {
        contactType: 'EMAIL',
        value: 'michael.johnson@email.com',
      },
    ],
  },
  account: {
    number: '1111222233',
    type: 'CHECKING',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '125008547',
        transactionType: 'ACH',
      },
    ],
  },
  accountValidationResponse: [
    {
      profileName: 'Standard Validation',
      requestId: 'req-001',
      responses: [
        {
          provider: 'ValidationProvider',
          codes: {
            verification: {
              code: 1,
              description: 'Account verified',
              message: 'Account details are valid',
            },
            authentication: {
              code: 1,
              description: 'Authentication successful',
              message: 'Account authentication completed',
            },
          },
          details: {
            accountNumber: '1111222233',
            financialInstitutionId: {
              clearingSystemId: {
                id: '125008547',
                idType: 'USABA',
              },
            },
            paymentCheckContributingStatus: 'ACTIVE',
          },
        },
      ],
    },
  ],
  createdAt: '2024-01-18T16:00:00Z',
  updatedAt: '2024-01-18T16:00:00Z',
};

// Mock inactive recipient
export const mockInactiveRecipient: Recipient = {
  id: 'recipient-005',
  type: 'RECIPIENT',
  status: 'INACTIVE',
  clientId: 'client-001',
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Inactive Corp',
    address: {
      addressLine1: '999 Closed Street',
      city: 'Boston',
      state: 'MA',
      postalCode: '02101',
      countryCode: 'US',
    },
    contacts: [
      {
        contactType: 'EMAIL',
        value: 'info@inactivecorp.com',
      },
    ],
  },
  account: {
    number: '9999888877',
    type: 'CHECKING',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '011401533',
        transactionType: 'ACH',
      },
    ],
  },
  createdAt: '2024-01-05T08:30:00Z',
  updatedAt: '2024-01-22T12:00:00Z',
};

// Mock rejected recipient
export const mockRejectedRecipient: Recipient = {
  id: 'recipient-007',
  type: 'RECIPIENT',
  status: 'REJECTED',
  clientId: 'client-001',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'David',
    lastName: 'Brown',
    address: {
      addressLine1: '123 Rejected Lane',
      city: 'Phoenix',
      state: 'AZ',
      postalCode: '85001',
      countryCode: 'US',
    },
    contacts: [
      {
        contactType: 'EMAIL',
        value: 'david.brown@email.com',
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
};

// Mock settlement account recipient
export const mockSettlementRecipient: Recipient = {
  id: 'recipient-008',
  type: 'SETTLEMENT_ACCOUNT',
  status: 'ACTIVE',
  clientId: 'client-001',
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Settlement Bank',
    address: {
      addressLine1: '100 Settlement Plaza',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      countryCode: 'US',
    },
    contacts: [
      {
        contactType: 'EMAIL',
        value: 'settlement@bank.com',
      },
    ],
  },
  account: {
    number: '3333444455',
    type: 'CHECKING',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '071000013',
        transactionType: 'ACH',
      },
      {
        routingCodeType: 'USABA',
        routingNumber: '071000013',
        transactionType: 'WIRE',
      },
    ],
  },
  createdAt: '2024-01-08T12:00:00Z',
  updatedAt: '2024-01-08T12:00:00Z',
};

// Array of all mock recipients
export const mockRecipients: Recipient[] = [
  mockIndividualRecipient,
  mockOrganizationRecipient,
  mockLinkedAccountRecipient,
  mockInactiveRecipient,
  mockRejectedRecipient,
  mockSettlementRecipient,
];

// Mock paginated response
export const mockRecipientsResponse: ListRecipientsResponse = {
  recipients: mockRecipients,
  limit: 10,
  page: 1,
  total_items: mockRecipients.length,
};

// Mock response for specific recipient types
export const mockActiveRecipients = mockRecipients.filter(
  (r) => r.status === 'ACTIVE'
);
export const mockInactiveRecipients = mockRecipients.filter(
  (r) => r.status === 'INACTIVE'
);

// Mock response for specific recipient types
export const mockRecipientTypeResponse = mockRecipients.filter(
  (r) => r.type === 'RECIPIENT'
);
export const mockLinkedAccountTypeResponse = mockRecipients.filter(
  (r) => r.type === 'LINKED_ACCOUNT'
);
export const mockSettlementTypeResponse = mockRecipients.filter(
  (r) => r.type === 'SETTLEMENT_ACCOUNT'
);

// Mock empty response
export const mockEmptyRecipientsResponse: ListRecipientsResponse = {
  recipients: [],
  limit: 10,
  page: 1,
  total_items: 0,
};

// Mock microdeposit verification responses
export const mockVerificationSuccess = {
  status: 'VERIFIED' as const,
};

export const mockVerificationFailure = {
  status: 'FAILED' as const,
};

export const mockVerificationMaxAttemptsExceeded = {
  status: 'FAILED_MAX_ATTEMPTS_EXCEEDED' as const,
};

// Function to generate mock recipient
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

// Function to generate paginated mock response
export const createMockRecipientsResponse = (
  recipients: Recipient[],
  page: number = 1,
  limit: number = 10
): ListRecipientsResponse => {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedRecipients = recipients.slice(start, end);

  return {
    recipients: paginatedRecipients,
    limit,
    page,
    total_items: recipients.length,
  };
};
