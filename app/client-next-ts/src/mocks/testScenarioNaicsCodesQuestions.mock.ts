/**
 * NAICS assessment questions for `/test-scenario-5`.
 * Four single-select enum questions (10–12 options) plus four varied compositions.
 */
export const testScenarioNaicsCodesQuestionsMock = {
  metadata: { page: 0, total: 8 },
  questions: [
    {
      content: [
        {
          description:
            '★ NAICS question: What is your primary online sales channel?',
          label: 'Primary online sales channel:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: What is your primary online sales channel?',
      id: '40501',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Owned e-commerce website',
            'Amazon Marketplace',
            'eBay',
            'Etsy',
            'Shopify storefront',
            'Walmart Marketplace',
            'Social commerce (Instagram / TikTok)',
            'Wholesale B2B portal',
            'Mobile app store',
            'Subscription box platform',
            'Flash sale / daily deals site',
            'Other third-party marketplace',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: Which product category best describes your catalog?',
          label: 'Primary product category:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: Which product category best describes your catalog?',
      id: '40502',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Apparel & accessories',
            'Health & beauty',
            'Home & garden',
            'Electronics & gadgets',
            'Food & beverage (non-perishable)',
            'Sporting goods',
            'Toys & hobbies',
            'Books & media',
            'Pet supplies',
            'Office & business supplies',
            'Handmade / artisan goods',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: What fulfillment model do you primarily use?',
          label: 'Primary fulfillment model:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: What fulfillment model do you primarily use?',
      id: '40503',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'In-house warehouse',
            'Third-party logistics (3PL)',
            'Dropship from suppliers',
            'Fulfillment by Amazon (FBA)',
            'Fulfillment by merchant (FBM)',
            'Retail store pickup',
            'Cross-dock / hub model',
            'Print-on-demand partner',
            'Co-packing partner',
            'Hybrid (multiple models)',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: Which payment acceptance method is most common at checkout?',
          label: 'Dominant checkout payment method:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: Which payment acceptance method is most common at checkout?',
      id: '40504',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          enum: [
            'Credit & debit cards',
            'Digital wallets (Apple Pay / Google Pay)',
            'Buy now, pay later (BNPL)',
            'ACH bank transfer',
            'Wire transfer',
            'Cash on delivery',
            'Gift cards / store credit',
            'Cryptocurrency',
            'Invoice / net terms (B2B)',
            'Marketplace-managed payments',
            'Subscription billing',
            'Mixed — no single dominant method',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: What is your expected monthly gross merchandise volume (USD)?',
          label: 'Expected monthly GMV (USD):',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: What is your expected monthly gross merchandise volume (USD)?',
      id: '40505',
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
            '★ NAICS question: Do you sell or ship products to customers outside the United States?',
          label: 'International sales or shipping:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: Do you sell or ship products to customers outside the United States?',
      id: '40506',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'boolean' },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['40507'],
        },
      ],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: Which regions do you ship to? (Select all that apply)',
          label: 'International shipping regions:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: Which regions do you ship to? (Select all that apply)',
      id: '40507',
      parentQuestionId: '40506',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 6,
        items: {
          type: 'string',
          enum: [
            'Canada',
            'Mexico & Central America',
            'South America',
            'Western Europe',
            'Eastern Europe',
            'Asia Pacific',
            'Middle East',
            'Africa',
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            '★ NAICS question: When did your business begin selling online?',
          label: 'Online selling start date:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        '★ NAICS question: When did your business begin selling online?',
      id: '40508',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'string' },
      },
      subQuestions: [],
    },
  ],
};
