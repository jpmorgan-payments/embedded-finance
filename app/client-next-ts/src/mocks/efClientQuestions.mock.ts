export const efClientQuestionsMock = {
  metadata: { page: 0, total: 6 },
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
          _enum: [],
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
      id: '30198',
      parentQuestionId: '30195',
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
  ],
};
