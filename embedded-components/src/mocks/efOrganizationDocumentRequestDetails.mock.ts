export const efOrganizationDocumentRequestDetails = {
  createdAt: '2025-01-10T14:32:21.456Z',
  id: '68803',
  partyId: '2000000111',
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
  validForDays: 180,
};
