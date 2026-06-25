/**
 * Document requests for `/test-scenario-5` fund management onboarding.
 * These are fund-specific documents different from standard LLC/individual doc requests.
 */
export const testScenario5FundDocumentRequests = [
  {
    id: 'ts5-doc-001',
    createdAt: '2026-06-01T10:00:00.000Z',
    description:
      'To verify the fund, please provide below documents as applicable.\n\n1. Evidence of registration - If registered/regulated, provide evidence of registered/regulated status. Could be obtained as a snapshot from the regulator website.\n\n2. Customer\'s organizational structure - Provide the link between the customer entity, control relationships and its beneficial owners. Could be one of these - Registration certificate, Certificate of existence, Partnership agreement, Trust agreement, Memorandum, Articles of Association, Company/Business Registry report.\n\n3. Funds offering Memorandum or Prospectus - Obtain the fund\'s Offering Memorandum or Prospectus or equivalent such as a determination letter or plan document.\n\n4. Fund AML Regulated information - If fund is AML regulated, it is registered to a regulatory authority for AML compliance; must have AML controls and procedures in place. Could be obtained as a snapshot from the regulator website. For SPVs, provide the AML regulation status of the pooled investment vehicle that owns the SPV.\n\n5. Evidence linking the fund to the Investment Advisor/General Partner/Investment Manager - Details showing connection between the fund and Investment Advisor, General Partner or Investment Manager. Could be one of these - Formation document, Regulatory filing, Offering memorandum, Prospectus.\n\n6. Evidence of Registered Investment advisor or Affiliated Advisor - If the Investment Advisor/General Partner/Investment Manager is a RIA or Affiliate Advisor, provide information regarding their registration status. Could be obtained as a snapshot from the regulator website.\n\n7. Evidence showing Investment Advisor/General Partner/Investment Manager is performing AML Due diligence on the investors of the fund - Could be one of these - Formation document, Regulatory filing, Offering memorandum, Prospectus.\n\n8. Evidence showing AML Service Provider is performing AML Due diligence on the investors of the fund (only required if the Investment Advisor/General Partner/Investment Manager is not conducting AML oversight) - Provide registration evidence of the AML Service Provider.',
    partyId: '2100535400',
    status: 'ACTIVE',
    requirements: [
      {
        documentTypes: [
          'REGULATORY_REGISTRATION',
          'CERTIFICATE_OF_GOOD_STANDING',
        ],
        level: 'PRIMARY',
        minRequired: 1,
        label: 'Evidence of registration',
      },
      {
        documentTypes: [
          'PARTNERSHIP_AGREEMENT',
          'ARTICLES_OF_ASSOCIATION',
          'CONSTITUTIONAL_DOCUMENT',
          'INCUMBENCY_CERTIFICATE',
          'CERTIFICATE_OF_GOOD_STANDING',
        ],
        level: 'PRIMARY',
        minRequired: 1,
        label: "Customer's organizational structure",
      },
      {
        documentTypes: ['OFFERING_MEMORANDUM', 'PROSPECTUS', 'OTHER'],
        level: 'PRIMARY',
        minRequired: 1,
        label: 'Funds offering Memorandum or Prospectus',
      },
      {
        documentTypes: ['REGULATORY_REGISTRATION', 'OTHER'],
        level: 'SECONDARY',
        minRequired: 0,
        label: 'Fund AML Regulated information',
      },
      {
        documentTypes: [
          'PARTNERSHIP_AGREEMENT',
          'OFFERING_MEMORANDUM',
          'PROSPECTUS',
          'OTHER',
        ],
        level: 'PRIMARY',
        minRequired: 1,
        label:
          'Evidence linking fund to Investment Advisor/General Partner/Investment Manager',
      },
      {
        documentTypes: ['REGULATORY_REGISTRATION', 'OTHER'],
        level: 'SECONDARY',
        minRequired: 0,
        label: 'Evidence of Registered Investment Advisor or Affiliated Advisor',
      },
      {
        documentTypes: [
          'PARTNERSHIP_AGREEMENT',
          'OFFERING_MEMORANDUM',
          'PROSPECTUS',
          'OTHER',
        ],
        level: 'SECONDARY',
        minRequired: 0,
        label:
          'Evidence showing Investment Advisor/GP/Investment Manager performing AML Due Diligence',
      },
      {
        documentTypes: ['REGULATORY_REGISTRATION', 'OTHER'],
        level: 'SECONDARY',
        minRequired: 0,
        label:
          'Evidence showing AML Service Provider performing AML Due Diligence on fund investors',
      },
    ],
    outstanding: {
      documentTypes: [
        'REGULATORY_REGISTRATION',
        'CERTIFICATE_OF_GOOD_STANDING',
        'PARTNERSHIP_AGREEMENT',
        'ARTICLES_OF_ASSOCIATION',
        'CONSTITUTIONAL_DOCUMENT',
        'INCUMBENCY_CERTIFICATE',
        'OFFERING_MEMORANDUM',
        'PROSPECTUS',
        'OTHER',
      ],
    },
    validForDays: 120,
  },
];
