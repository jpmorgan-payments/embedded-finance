/**
 * Fund management assessment questions for `/test-scenario-5`.
 * Questions triggered by NAICS codes 525996, 525995, 525991.
 */
export const testScenarioNaicsCodesQuestionsMock = {
  metadata: { page: 0, total: 25 },
  questions: [
    {
      content: [
        {
          description: 'For what purpose will the account be used?',
          label: 'Account purpose:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'For what purpose will the account be used?',
      id: '30012',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Investment Activities',
            'Operational Expenses',
            'Capital Calls',
            'Distributions',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'What is the source for the initial funds?',
          label: 'Source of initial funds:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What is the source for the initial funds?',
      id: '30013',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Limited Partners of funds',
            'General Partner contributions',
            'Institutional investors',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'What is the source for the ongoing funds?',
          label: 'Source of ongoing funds:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What is the source for the ongoing funds?',
      id: '30015',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Limited partner contributions',
            'Investment returns',
            'Capital calls',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'From what country(ies) will the ongoing funds routinely originate from?',
          label: 'Country of fund origin:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'From what country(ies) will the ongoing funds routinely originate from?',
      id: '30032',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'string',
          enum: [
            'United States',
            'United Kingdom',
            'Canada',
            'European Union',
            'Asia Pacific',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'What is the nature of the relationship with the customer and its affiliates?',
          label: 'Nature of relationship:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'What is the nature of the relationship with the customer and its affiliates?',
      id: '30075',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Fund administration services',
            'Investment management',
            'Custodial services',
            'Advisory services',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is the customer set up as part of a larger fund structure in order to facilitate transactions, investments, or other activities relating to the fund?',
          label: 'Part of larger fund structure:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is the customer set up as part of a larger fund structure in order to facilitate transactions, investments, or other activities relating to the fund?',
      id: '30163',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is your business completely owned by the fund and managed by the same advisors or people connected to them?',
          label: 'Fund ownership:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is your business completely owned by the fund and managed by the same advisors or people connected to them?',
      id: '30164',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'What is the purpose of your business?',
          label: 'Business purpose:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What is the purpose of your business?',
      id: '30165',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'string',
          enum: [
            'Special investment purposes',
            'Finance purposes',
            'Holding securities',
            'Real Estate Investment',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'What is the activity of your business?',
          label: 'Business activity:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What is the activity of your business?',
      id: '30167',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'string',
          enum: [
            'Buy and sell property and assets',
            'Buy and sell investments',
            'Buy and sell businesses',
            'Lending',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: "What is the business's fund strategy?",
          label: 'Fund strategy:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: "What is the business's fund strategy?",
      id: '30169',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 17,
        items: {
          type: 'string',
          enum: [
            'Long/Short',
            'Convertible Arbitrage',
            'Dedicated Short Bias',
            'Emerging Markets',
            'Risk Arbitrage',
            'Equity Dividend Fund',
            'Capital Appreciation Fund',
            'Global Small Cap Fund',
            'High Yield Bond Fund',
            'Strategic Income Opportunities Fund',
            'Balanced',
            'Equity',
            'Fixed Income',
            'Cash',
            'Alternatives',
            'Real Estate',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'What types of investors are in your fund?',
          label: 'Fund investor types:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What types of investors are in your fund?',
      id: '30171',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 18,
        items: {
          type: 'string',
          enum: [
            'Institutional Investors',
            'High Net Worth Individuals',
            'Fund of Funds',
            'Pension Funds',
            'Mass Market Individuals',
            'Non-US embassies missions and consulates',
            'MSBs from very high or high-risk countries',
            'New Customers who are bearer share companies except for those that are publicly traded on Level 1 exchange',
            'Non-Bank Financial Institutions/ Entities with Third Party Activity who resell their services to a third-party (e.g. agent or provider of Independent Sales Organization (ISO) opportunities or gateway arrangements)',
            'Provide downstream processing for MSBs financial institutions or other intermediaries within the JPMC account without an AML and Sanctions program in place',
            'Marijuana-Related Businesses (including MRB IPs)',
            'FinTech',
            'Virtual asset service providers',
            'Shell companies',
            'Government Entities',
            'Banking or Thrift Institutions',
            'Charitable Organizations or Foundations',
            'Insurance Companies',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'What is the estimated total amount of assets currently managed by your business in USD?',
          label: 'Total assets managed (USD):',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'What is the estimated total amount of assets currently managed by your business in USD?',
      id: '30173',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'integer' },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is your fund subject to anti-money laundering (AML) regulations?',
          label: 'Subject to AML regulations:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is your fund subject to anti-money laundering (AML) regulations?',
      id: '30174',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is the Investment Advisor/ General Partner/ Investment Manager performing AML Due Diligence on the investors in the fund?',
          label: 'AML due diligence on investors:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is the Investment Advisor/ General Partner/ Investment Manager performing AML Due Diligence on the investors in the fund?',
      id: '30178',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is the Investment Advisor/General Partner/Investment Manager Regulated?',
          label: 'Investment manager regulated:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is the Investment Advisor/General Partner/Investment Manager Regulated?',
      id: '30179',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Is the regulator(s) a Registered Investment Adviser ("RIA") or affiliated adviser?',
          label: 'RIA or affiliated adviser:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Is the regulator(s) a Registered Investment Adviser ("RIA") or affiliated adviser?',
      id: '30181',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'string',
          enum: ['Registered', 'Affiliated Adviser'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: "Describe your fund's lock-up/commitment period.",
          label: 'Lock-up/commitment period:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: "Describe your fund's lock-up/commitment period.",
      id: '30182',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'string' },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'Who is the external auditor for your business?',
          label: 'External auditor:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Who is the external auditor for your business?',
      id: '30183',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'string',
          enum: [
            'KPMG',
            'Deloitte & Touché',
            'Ernst & Young',
            'PwC',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'Where are your investors located?',
          label: 'Investor locations:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Where are your investors located?',
      id: '30185',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'string',
          enum: [
            'United States',
            'United Kingdom',
            'Canada',
            'European Union',
            'Asia Pacific',
            'Other',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Does the business process transactions with any third parties using your JPMC account(s)?',
          label: 'Third party transactions:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Does the business process transactions with any third parties using your JPMC account(s)?',
      id: '30187',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Do any of your investors or clients have direct access to your JPMC account(s)?',
          label: 'Investor direct access to accounts:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Do any of your investors or clients have direct access to your JPMC account(s)?',
      id: '30189',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'Is the business organized as a trust?',
          label: 'Organized as trust:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Is the business organized as a trust?',
      id: '30191',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, Sudan, South Sudan, Myanmar, the Crimea, Donetsk People\'s Republic, or Luhansk People\'s Republic regions of Ukraine, or the nongovernment-controlled areas of Ukraine in Kherson and Zaporizhzhia Oblasts.',
          label: 'Sanctioned countries business:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, Sudan, South Sudan, Myanmar, the Crimea, Donetsk People\'s Republic, or Luhansk People\'s Republic regions of Ukraine, or the nongovernment-controlled areas of Ukraine in Kherson and Zaporizhzhia Oblasts.',
      id: '30195',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
      },
      subQuestions: [],
    },
  ],
};
