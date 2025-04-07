export const efOrganizationDocumentRequestDetails = {
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
};
