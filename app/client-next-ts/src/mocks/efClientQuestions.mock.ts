export const efClientQuestionsMock = {
  metadata: { page: 0, total: 3 },
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
  ],
};
