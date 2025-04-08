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
      'To verify the identity of the business, please provide one or more of the following documents to validate EIN, Name and Address:\n\n- Articles of Incorporation\n- Certificate of Good Standing\n- Certificate of Incumbency\n- Memorandum/Articles of Association\n- Constitutional document\n- LLC Agreement\n- Filing receipt from state of organization\n- Operating Agreement',
    outstanding: {
      documentTypes: [
        'ARTICLES_OF_INCORPORATION',
        'CERTIFICATE_OF_GOOD_STANDING',
        'CERTIFICATE_OF_INCUMBENCY',
        'ARTICLES_OF_ASSOCIATION',
        'CONSTITUTIONAL_DOCUMENT',
        'LLC_AGREEMENT',
        'FILING_RECEIPT',
        'OPERATING_AGREEMENT',
      ],
      requirements: [
        {
          documentTypes: [
            'ARTICLES_OF_INCORPORATION',
            'CERTIFICATE_OF_GOOD_STANDING',
            'CERTIFICATE_OF_INCUMBENCY',
            'ARTICLES_OF_ASSOCIATION',
            'CONSTITUTIONAL_DOCUMENT',
            'LLC_AGREEMENT',
            'FILING_RECEIPT',
            'OPERATING_AGREEMENT',
          ],
          missing: 1,
        },
      ],
    },
    requirements: [
      {
        documentTypes: [
          'ARTICLES_OF_INCORPORATION',
          'CERTIFICATE_OF_GOOD_STANDING',
          'CERTIFICATE_OF_INCUMBENCY',
          'ARTICLES_OF_ASSOCIATION',
          'CONSTITUTIONAL_DOCUMENT',
          'LLC_AGREEMENT',
          'FILING_RECEIPT',
          'OPERATING_AGREEMENT',
        ],
        minRequired: 1,
      },
    ],
    active: true,
    validForDays: 180,
  },
];
