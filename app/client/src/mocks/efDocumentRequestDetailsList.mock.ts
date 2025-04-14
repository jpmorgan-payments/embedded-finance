export const efDocumentRequestDetailsList = [
  {
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
  },
  {
    createdAt: '2025-01-10T14:32:21.456Z',
    id: '68803',
    partyId: '2000000113',
    status: 'ACTIVE',
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
    active: true,
    validForDays: 180,
  },
];
