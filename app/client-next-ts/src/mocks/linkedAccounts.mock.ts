// Mock linked accounts data for LinkedAccountWidget component
export const mockLinkedAccounts = {
  page: 0,
  limit: 10,
  total_items: 3,
  recipients: [
    {
      id: 'linked-account-003',
      type: 'LINKED_ACCOUNT',
      status: 'ACTIVE',
      clientId: 'client-001',
      partyDetails: {
        type: 'ORGANIZATION',
        businessName: 'Acme Corporation',
        address: {
          addressLine1: '789 Business Blvd',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: 'payments@acme.com',
          },
          {
            contactType: 'PHONE',
            value: '5559876543',
            countryCode: '+1',
          },
        ],
      },
      account: {
        number: '5555666677',
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '111000025',
            transactionType: 'ACH',
          },
        ],
      },
      createdAt: '2024-01-25T09:15:00Z',
      updatedAt: '2024-01-25T09:15:00Z',
    },
  ],
};

// Mock linked accounts with different statuses
export const mockActiveLinkedAccounts = {
  ...mockLinkedAccounts,
  recipients: mockLinkedAccounts.recipients.filter(
    (account: { status: string }) => account.status === 'ACTIVE'
  ),
  total_items: 1,
};

export const mockMicrodepositLinkedAccounts = {
  ...mockLinkedAccounts,
  recipients: mockLinkedAccounts.recipients.filter(
    (account: { status: string }) =>
      account.status === 'MICRODEPOSITS_INITIATED' ||
      account.status === 'READY_FOR_VALIDATION'
  ),
  total_items: 2,
};

export const mockEmptyLinkedAccounts = {
  page: 0,
  limit: 10,
  total_items: 0,
  recipients: [],
};

// Mock linked account with verification ready status
export const mockVerificationReadyAccount = {
  id: 'linked-account-verify',
  type: 'LINKED_ACCOUNT',
  status: 'READY_FOR_VALIDATION',
  clientId: 'client-001',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Mike',
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
        value: 'mike.johnson@email.com',
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
  createdAt: '2024-01-18T16:00:00Z',
  updatedAt: '2024-01-18T16:00:00Z',
};

// Mock microdeposit verification response
export const mockMicrodepositVerificationSuccess = {
  id: 'linked-account-verify',
  status: 'ACTIVE',
  message: 'Microdeposit verification successful',
  verifiedAt: new Date().toISOString(),
};

export const mockMicrodepositVerificationFailure = {
  id: 'linked-account-verify',
  status: 'REJECTED',
  message: 'Invalid microdeposit amounts provided',
  error: 'VERIFICATION_FAILED',
};

// Function to create mock linked account
export const createMockLinkedAccount = (overrides: any = {}) => {
  return {
    id: `linked-account-${Date.now()}`,
    type: 'LINKED_ACCOUNT',
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

// Function to create paginated linked accounts response
export const createMockLinkedAccountsResponse = (
  accounts: any[] = mockLinkedAccounts.recipients,
  page: number = 1,
  limit: number = 10
) => {
  // Convert 1-based page to 0-based index
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAccounts = accounts.slice(startIndex, endIndex);

  return {
    page,
    limit,
    total_items: accounts.length,
    recipients: paginatedAccounts,
  };
};

// Function to get linked account by ID
export const getLinkedAccountById = (id: string) => {
  return mockLinkedAccounts.recipients.find(
    (account: { id: string }) => account.id === id
  );
};

// Function to update linked account status
export const updateLinkedAccountStatus = (id: string, status: string) => {
  const account = getLinkedAccountById(id);
  if (account) {
    account.status = status;
    account.updatedAt = new Date().toISOString();
  }
  return account;
};
