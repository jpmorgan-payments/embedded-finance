export const efDocumentRequestDetails = {
  id: '68430',
  createdAt: '2022-11-18T12:28:11.232Z',
  description:
    "To verify your identity, please provide any one of the below unexpired document which has Full Legal name, Address and Date of Birth.\n1. Drivers license\n2. Passport\n3. Government issued identity card\nIf address on your identification document is not current, please additionally provide a Utility Bill or Bank Statement dated within last 6 months.",
  partyId: '2000000555',
  status: 'ACTIVE',
  requirements: [
    {
      documentTypes: ['PASSPORT', 'DRIVERS_LICENSE', 'GOV_ISSUED_ID_CARD'],
      minRequired: 1,
    },
    {
      documentTypes: ['BANK_STATEMENT', 'UTILITY_BILL'],
      minRequired: 0,
    },
  ],
  outstanding: {
    documentTypes: [
      'PASSPORT',
      'DRIVERS_LICENSE',
      'GOV_ISSUED_ID_CARD',
      'BANK_STATEMENT',
      'UTILITY_BILL',
    ],
  },
  validForDays: 120,
};

export const efDocumentRequestComplexDetails = {
  id: '68430',
  createdAt: '2022-11-18T12:28:11.232Z',
  description:
    "Please provide documents with the following options: 1. Provide passport and driver's license,\nor 2. Provide either a passport or driver's license and one of the below:\n- Credit card statement\n- Bank statement\n- Loan account statement\n- Utility bill\n- Insurance document",
  partyId: '2000000555',
  status: 'ACTIVE',
  requirements: [
    {
      documentTypes: ['PASSPORT', 'DRIVERS_LICENSE', 'INSURANCE_DOCUMENT'],
      minRequired: 1,
    },
    {
      documentTypes: [
        'PASSPORT',
        'DRIVERS_LICENSE',
        'CREDIT_CARD_STATEMENT',
        'BANK_STATEMENT',
        'LOAN_ACCOUNT_STATEMENT',
        'UTILITY_BILL',
      ],
      minRequired: 3,
    },
  ],
  outstanding: {
    documentTypes: [
      'PASSPORT',
      'DRIVERS_LICENSE',
      'CREDIT_CARD_STATEMENT',
      'BANK_STATEMENT',
      'LOAN_ACCOUNT_STATEMENT',
      'UTILITY_BILL',
    ],
    requirements: [
      {
        documentTypes: ['PASSPORT', 'DRIVERS_LICENSE'],
        missing: 1,
      },
      {
        documentTypes: [
          'PASSPORT',
          'DRIVERS_LICENSE',
          'CREDIT_CARD_STATEMENT',
          'BANK_STATEMENT',
          'LOAN_ACCOUNT_STATEMENT',
          'UTILITY_BILL',
          'INSURANCE_DOCUMENT',
        ],
        missing: 2,
      },
    ],
  },
  validForDays: 120,
};
