export const efOrganizationDocumentRequestDetails = {
  createdAt: '2025-01-10T14:32:21.456Z',
  id: '68803',
  partyId: '2000000113',
  description:
    'To verify your business, please provide the following documents:\n1. Articles of Incorporation or Formation\n2. Business License\n3. Operating Agreement\n4. Utility Bill (dated within last 3 months)\n5. EIN Document',
  outstanding: {
    documentTypes: [
      'ARTICLES_OF_INCORPORATION',
      'BUSINESS_LICENSE',
      'OPERATING_AGREEMENT',
      'UTILITY_BILL',
      'EIN',
    ],
  },
  requirements: [
    {
      documentTypes: ['ARTICLES_OF_INCORPORATION', 'OPERATING_AGREEMENT'],
      minRequired: 1,
    },
  ],
  active: true,
  validForDays: 180,
};

// Mock for client-level document request (not tied to a specific party)
export const efClientDocumentRequestDetails = {
  createdAt: '2025-01-10T14:35:42.789Z',
  id: '68432',
  // No partyId for client-level document requests
  description:
    'Please provide the following additional business documentation to complete your application:\n1. Business Registration Certificate\n2. Bank Statement (last 3 months)\n3. Tax Document\n4. Certificate of Good Standing',
  outstanding: {
    documentTypes: [
      'BUSINESS_REGISTRATION_CERT',
      'BANK_STATEMENT',
      'TAX_DOCUMENT',
      'CERTIFICATE_OF_GOOD_STANDING',
    ],
  },
  requirements: [
    {
      documentTypes: ['BUSINESS_REGISTRATION_CERT'],
      minRequired: 1,
    },
    {
      documentTypes: ['BANK_STATEMENT'],
      minRequired: 1,
    },
    {
      documentTypes: ['TAX_DOCUMENT'],
      minRequired: 1,
    },
    {
      documentTypes: ['CERTIFICATE_OF_GOOD_STANDING'],
      minRequired: 1,
    },
  ],
  active: true,
  validForDays: 90,
};
