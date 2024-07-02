module.exports = {
  'embedded-banking': {
    input: './api-specs/embedded-banking-solutions-api-v2-external.yml',
    output: {
      mode: 'split',
      target: './src/api/generated/embedded-banking.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
};
