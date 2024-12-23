module.exports = {
  'ef-v1': {
    input: './api-specs/embedded-finance-pub-ef-1.0.8.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ef-v1.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
  'ef-v2': {
    input: './api-specs/embedded-finance-pub-ef-2.0.8.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ef-v2.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
  smbdo: {
    input: './api-specs/embedded-finance-pub-smbdo-1.0.10.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/smbdo.ts',
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
