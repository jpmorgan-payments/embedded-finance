export const efDocumentRequestDetails = {
  createdAt: '2025-01-08T16:47:43.886Z',
  id: '68430',
  partyId: '2001145266',
  description:
    'To verify your identity, please provide any one of the below unexpired document which has Full Legal name, Address and Date of Birth.\n1. Drivers license\n2. Passport\n3. Government issued identity card\nIf address on your identification document is not current, please additionally provide a Utility Bill or Bank Statement dated within last 6 months.',
  outstanding: {
    documentTypes: [
      'DRIVERS_LICENSE',
      'GOV_ISSUED_ID_CARD',
      'BANK_STATEMENT',
      'PASSPORT',
      'UTILITY_BILL',
    ],
  },
  requirements: [
    {
      documentTypes: ['PASSPORT', 'DRIVERS_LICENSE', 'GOV_ISSUED_ID_CARD'],
      minRequired: 1,
    },
    {
      documentTypes: ['UTILITY_BILL', 'BANK_STATEMENT'],
      minRequired: 0,
    },
  ],
  status: 'ACTIVE',
  validForDays: 120,
};
