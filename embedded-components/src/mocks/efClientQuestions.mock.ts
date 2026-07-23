export const efClientQuestionsMock = {
  metadata: { page: 0, total: 10 },
  questions: [
    {
      content: [
        {
          description: 'What is your Total Annual Revenue in local currency?',
          label: 'Total annual revenue/income:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'What is your Total Annual Revenue in local currency?',
      id: '30005',
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
            "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine?",
          label:
            "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine?",
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine?",
      id: '30026',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['30027'],
        },
      ],
    },
    {
      content: [
        {
          description: 'Select which ones apply.',
          label: 'Select which ones:',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Select which ones apply.',
      id: '30027',
      parentQuestionId: '30026',
      responseSchema: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          _enum: [
            'Cuba',
            'Iran',
            'North Korea',
            'Syria',
            'Russia',
            'Venezuela',
            'Belarus',
            'Crimea region of Ukraine',
            "Donetsk People's Republic region of Ukraine",
            "Luhansk People's Republic region of Ukraine",
          ],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Do you deal in covered goods or services valued at more than $50,000 per transaction?',
          label:
            'Do you deal in covered goods or services valued at more than $50,000 per transaction?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Do you deal in covered goods or services valued at more than $50,000 per transaction?',
      id: '30088',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['30089'],
        },
      ],
    },
    {
      content: [
        {
          description:
            'Do you sell covered goods or services to the general public?',
          label: 'Do you sell covered goods or services to the general public?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Do you sell covered goods or services to the general public?',
      id: '30089',
      parentQuestionId: '30088',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['30090'],
        },
      ],
    },
    {
      content: [
        {
          description:
            'Do you purchase covered goods or services valued at more than $50,000 from non-US sources?',
          label:
            'Do you purchase covered goods or services valued at more than $50,000 from non-US sources?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Do you purchase covered goods or services valued at more than $50,000 from non-US sources?',
      id: '30090',
      parentQuestionId: '30089',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description: 'Are you a FinTech?',
          label: 'Are you a FinTech?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Are you a FinTech?',
      id: '30095',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People’s Republic, or Luhansk People’s Republic regions of Ukraine?',
          label:
            'Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People’s Republic, or Luhansk People’s Republic regions of Ukraine?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, or the Crimea, Donetsk People’s Republic, or Luhansk People’s Republic regions of Ukraine?',
      id: '30158',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
        },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['30162'],
        },
      ],
    },
    {
      content: [
        {
          description: 'Please specify which countries from the above list.',
          label: 'Please specify which countries from the above list.',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description: 'Please specify which countries from the above list.',
      id: '30162',
      parentQuestionId: '30158',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string',
          _enum: [],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            'What is the total monthly processing volume of the business?',
          label: 'What is the total monthly processing volume of the business?',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        'What is the total monthly processing volume of the business?',
      id: '30194',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'integer',
          _enum: [],
        },
      },
      subQuestions: [],
    },
    {
      content: [
        {
          description:
            "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, Sudan, South Sudan, Myanmar, the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine, or the nongovernment-controlled areas of Ukraine in Kherson and Zaporizhzhia Oblasts.",
          label:
            "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, Sudan, South Sudan, Myanmar, the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine, or the nongovernment-controlled areas of Ukraine in Kherson and Zaporizhzhia Oblasts.",
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      description:
        "Are you planning to, or do you currently (i) operate or conduct business in; (ii) sell goods in or to; (iii) offer services in or to; (iv) have vendors or suppliers in; or (v) conduct business with entities domiciled or incorporated in, or with individuals domiciled in any of the following countries or regions which are subject to comprehensive or targeted sanctions: Cuba, Iran, North Korea, Syria, Russia, Venezuela, Belarus, Sudan, South Sudan, Myanmar, the Crimea, Donetsk People's Republic, or Luhansk People's Republic regions of Ukraine, or the nongovernment-controlled areas of Ukraine in Kherson and Zaporizhzhia Oblasts.",
      id: '30195',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'boolean',
          _enum: [],
        },
      },
      subQuestions: [
        {
          anyValuesMatch: 'true',
          questionIds: ['30198'],
        },
      ],
    },
  ],
};
