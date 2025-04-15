export const efOrganizationDocumentRequestDetails = {
  createdAt: '2025-01-10T14:32:21.456Z',
  id: '68803',
  partyId: '2000000111',
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
};
