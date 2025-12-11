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
  'ep-recipients': {
    input: './api-specs/embedded-finance-pub-ep-recipients-1.0.27.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-recipients.ts',
      client: 'react-query',
      override: {
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'page',
        },
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
  'ep-transactions': {
    input: './api-specs/embedded-finance-pub-ep-transactions-2.0.27.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-transactions.ts',
      client: 'react-query',
      override: {
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'page',
        },
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
  'ep-accounts': {
    input: './api-specs/embedded-finance-pub-ep-accounts-1.0.27.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-accounts.ts',
      client: 'react-query',
      override: {
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'page',
        },
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'ebInstance',
        },
      },
    },
  },
  smbdo: {
    input: './api-specs/embedded-finance-pub-smbdo-1.0.18.yaml',
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
