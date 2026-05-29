import {
  AccountType,
  CountryCode,
  ListRecipientsResponse,
  PartyType,
  RecipientContactContactType,
  RecipientStatus,
  RecipientType,
} from '@/api/generated/ep-recipients.schemas';

export const linkedAccountListMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 4,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '451 Rose Garden',
          addressLine2: '11249312',
          addressLine3: 'Rose House',
          city: 'New York City',
          countryCode: CountryCode.US,
          state: 'NY',
          postalCode: '10007',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Alex',
        lastName: 'James',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'testemail1@test.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '7587819587',
          },
        ],
      },
      account: {
        number: '12345678901234567',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.ACTIVE,
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '123 Business Plaza',
          addressLine2: 'Suite 200',
          addressLine3: '',
          city: 'Los Angeles',
          countryCode: CountryCode.US,
          state: 'CA',
          postalCode: '90210',
        },
        type: PartyType.ORGANIZATION,
        businessName: 'TechCorp Solutions Inc.',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'finance@techcorp.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '3105550123',
          },
        ],
      },
      account: {
        number: '9876543210987654',
        type: AccountType.SAVINGS,
        countryCode: CountryCode.US,
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
      id: 'b8f9e7d6-c5a4-3b2c-1d0e-9f8e7d6c5b4a',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.ACTIVE,
      createdAt: '2024-02-20T14:45:00Z',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '789 Personal Lane',
          addressLine2: 'Apt 5B',
          addressLine3: '',
          city: 'Chicago',
          countryCode: CountryCode.US,
          state: 'IL',
          postalCode: '60601',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Sarah',
        lastName: 'Johnson',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'sarah.johnson@email.com',
          },
        ],
      },
      account: {
        number: '5555666677778888',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '071000013',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.READY_FOR_VALIDATION,
      createdAt: '2024-03-10T09:15:00Z',
      updatedAt: '2024-03-12T14:30:00Z',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '456 Elm Street',
          addressLine2: '',
          addressLine3: '',
          city: 'Boston',
          countryCode: CountryCode.US,
          state: 'MA',
          postalCode: '02101',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Michael',
        lastName: 'Chen',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'michael.chen@email.com',
          },
        ],
      },
      account: {
        number: '1111222233334444',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '011401533',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.MICRODEPOSITS_INITIATED,
      createdAt: '2024-03-15T11:20:00Z',
      updatedAt: '2024-03-15T11:25:00Z',
    },
  ],
};

export const linkedAccountMicrodepositListMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 1,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '451 Rose Garden',
          addressLine2: '11249312',
          addressLine3: 'Rose House',
          city: 'New York City',
          countryCode: CountryCode.US,
          state: 'NY',
          postalCode: '10007',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Alex',
        lastName: 'James',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'testemail1@test.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '7587819587',
          },
        ],
      },
      account: {
        number: '12345678901234567',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.MICRODEPOSITS_INITIATED,
      createdAt: '2024-01-15T10:30:00Z',
    },
  ],
};

export const linkedAccountReadyForValidationMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 1,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '451 Rose Garden',
          addressLine2: '11249312',
          addressLine3: 'Rose House',
          city: 'New York City',
          countryCode: CountryCode.US,
          state: 'NY',
          postalCode: '10007',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Alex',
        lastName: 'James',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,

            value: 'testemail1@test.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '7587819587',
          },
        ],
      },
      account: {
        number: '12345678901234567',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.READY_FOR_VALIDATION,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
    },
  ],
};

export const linkedAccountRejectedMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 1,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '451 Rose Garden',
          addressLine2: '11249312',
          addressLine3: 'Rose House',
          city: 'New York City',
          countryCode: CountryCode.US,
          state: 'NY',
          postalCode: '10007',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Alex',
        lastName: 'James',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,

            value: 'testemail1@test.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '7587819587',
          },
        ],
      },
      account: {
        number: '12345678901234567',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.REJECTED,
      createdAt: '2024-01-15T10:30:00Z',
    },
  ],
};

// New mock for business accounts
export const linkedAccountBusinessMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 2,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '456 Corporate Drive',
          addressLine2: 'Floor 10',
          addressLine3: '',
          city: 'San Francisco',
          countryCode: CountryCode.US,
          state: 'CA',
          postalCode: '94105',
        },
        type: PartyType.ORGANIZATION,
        businessName: 'Innovation Labs LLC',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'payments@innovationlabs.com',
          },
          {
            contactType: RecipientContactContactType.WEBSITE,
            value: 'https://innovationlabs.com',
          },
        ],
      },
      account: {
        number: '1111222233334444',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
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
      id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.ACTIVE,
      createdAt: '2024-01-05T16:20:00Z',
    },
    {
      partyDetails: {
        address: {
          addressLine1: '789 Startup Street',
          addressLine2: 'Unit 3',
          addressLine3: '',
          city: 'Austin',
          countryCode: CountryCode.US,
          state: 'TX',
          postalCode: '73301',
        },
        type: PartyType.ORGANIZATION,
        businessName: 'Green Energy Solutions',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'finance@greenenergy.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '5125550199',
          },
        ],
      },
      account: {
        number: '9999888877776666',
        type: AccountType.SAVINGS,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '111000025',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'e1d2c3b4-a5f6-7890-1234-567890abcdef',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.MICRODEPOSITS_INITIATED,
      createdAt: '2024-02-28T11:45:00Z',
    },
  ],
};

// Mock for single active account
export const linkedAccountActiveMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 1,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '451 Rose Garden',
          addressLine2: '11249312',
          addressLine3: 'Rose House',
          city: 'New York City',
          countryCode: CountryCode.US,
          state: 'NY',
          postalCode: '10007',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Alex',
        lastName: 'James',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'testemail1@test.com',
          },
          {
            contactType: RecipientContactContactType.PHONE,
            countryCode: '+1',
            value: '7587819587',
          },
        ],
      },
      account: {
        number: '12345678901234567',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.ACTIVE,
      createdAt: '2024-01-15T10:30:00Z',
    },
  ],
};

// Mock for inactive accounts
export const linkedAccountInactiveMock: ListRecipientsResponse = {
  metadata: {
    page: 0,
    limit: 10,
    total_items: 1,
  },
  recipients: [
    {
      partyDetails: {
        address: {
          addressLine1: '321 Old Account Ave',
          addressLine2: '',
          addressLine3: '',
          city: 'Miami',
          countryCode: CountryCode.US,
          state: 'FL',
          postalCode: '33101',
        },
        type: PartyType.INDIVIDUAL,
        firstName: 'Michael',
        lastName: 'Chen',
        contacts: [
          {
            contactType: RecipientContactContactType.EMAIL,
            value: 'michael.chen@email.com',
          },
        ],
      },
      account: {
        number: '4444333322221111',
        type: AccountType.CHECKING,
        countryCode: CountryCode.US,
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '067014822',
            transactionType: 'ACH',
          },
        ],
      },
      id: 'd4e5f6a7-b8c9-0123-4567-89abcdef0123',
      type: RecipientType.LINKED_ACCOUNT,
      status: RecipientStatus.INACTIVE,
      createdAt: '2023-12-01T08:00:00Z',
    },
  ],
};
