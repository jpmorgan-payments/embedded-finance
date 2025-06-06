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
      'To verify your identity, please provide requested documents.\n1. Formation Document - Listing the legal name and address of the company. Acceptable documents are Articles of Incorporation [OR] Certificate of Good Standing [OR] Certificate of Incumbency [OR] Memorandum/Articles of Association [OR] Constitutional document [OR] LLC Agreement [OR] Filing receipt from state of organization [OR] Operating Agreement',
    outstanding: {
      documentTypes: [
        'OPERATING_AGREEMENT',
        'INCUMBENCY_CERTIFICATE',
        'ARTICLES_OF_ASSOCIATION',
        'ARTICLES_OF_INCORPORATION',
        'LLC_AGREEMENT',
        'CERTIFICATE_OF_GOOD_STANDING',
        'CONSTITUTIONAL_DOCUMENT',
        'FILING_RECEIPT',
      ],
    },
    requirements: [
      {
        documentTypes: [
          'ARTICLES_OF_INCORPORATION',
          'CERTIFICATE_OF_GOOD_STANDING',
          'INCUMBENCY_CERTIFICATE',
          'ARTICLES_OF_ASSOCIATION',
          'CONSTITUTIONAL_DOCUMENT',
          'LLC_AGREEMENT',
          'FILING_RECEIPT',
          'OPERATING_AGREEMENT',
        ],
        level: 'PRIMARY',
        minRequired: 1,
      },
    ],
    validForDays: 120,
  },
];
