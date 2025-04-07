export const efDocumentRequestDetailsList = [
  {
    id: '68430',
    createdAt: '2022-11-18T12:28:11.232Z',
    description:
      "Please provide documents with the following options: 1. Provide passport and driver's license,\nor 2. Provide either a passport or driver's license and one of the below:\n- Credit card statement\n- Bank statement\n- Loan account statement\n- Utility bill\n- Insurance document",
    partyId: '2000000555',
    status: 'ACTIVE',
    requirements: [
      {
        documentTypes: ['PASSPORT', 'DRIVERS_LICENSE'],
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
          'INSURANCE_DOCUMENT',
        ],
        minRequired: 2,
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
        'INSURANCE_DOCUMENT',
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
  },
  {
    createdAt: '2025-01-10T14:32:21.456Z',
    id: '68803',
    partyId: '2000000113',
    description:
      'To verify your business, please provide the following documents:\n1. Articles of Incorporation or Formation\n2. Business License\n3. Operating Agreement\n4. EIN Document',
    outstanding: {
      documentTypes: [
        'ARTICLES_OF_INCORPORATION',
        'BUSINESS_LICENSE',
        'OPERATING_AGREEMENT',
        'EIN',
      ],
      requirements: [
        {
          documentTypes: [
            'ARTICLES_OF_INCORPORATION',
            'BUSINESS_LICENSE',
            'OPERATING_AGREEMENT',
            'EIN',
          ],
          missing: 1,
        },
      ],
    },
    requirements: [
      {
        documentTypes: [
          'ARTICLES_OF_INCORPORATION',
          'BUSINESS_LICENSE',
          'OPERATING_AGREEMENT',
          'EIN',
        ],
        minRequired: 1,
      },
    ],
    active: true,
    validForDays: 180,
  },
];
