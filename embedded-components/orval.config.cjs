module.exports = {
  'embedded-banking': {
    input: './api-specs/smb-do-api.oas3.yml',
    output: {
      mode: 'split',
      mock: true,
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
