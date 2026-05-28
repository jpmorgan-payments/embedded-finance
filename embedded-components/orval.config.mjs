import { defineConfig } from 'orval';

export default defineConfig({
  'ef-v1': {
    input: './api-specs/embedded-finance-pub-ef-1.0.8.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ef-v1.ts',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
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
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
        },
      },
    },
  },
  'ep-recipients': {
    input: './api-specs/embedded-finance-pub-ep-recipients-1.0.47.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-recipients.ts',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'page',
        },
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
        },
      },
    },
  },
  'ep-transactions': {
    input: './api-specs/embedded-finance-pub-ep-transactions-2.0.47.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-transactions.ts',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
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
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
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
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/api/use-axios-instance.ts',
          name: 'useEbInstance',
        },
      },
    },
  },
});
