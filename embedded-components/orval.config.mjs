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
    // Targets recipients 1.0.55-latest: the team's published spec that supersedes
    // the local FX variant. `CurrencyCode` is widened to USD + 41 currencies
    // (superset of the FX variant's 16 cross-border credit currencies),
    // `CountryCode` is widened from US-only to 70 countries, and `RoutingCodeType`
    // now includes international codes (BIC, CLABE, CNAPS, INFSC, GBDSC, ...) in
    // addition to USABA. Additive/non-breaking vs the FX variant.
    input: './api-specs/embedded-finance-pub-ep-recipients-1.0.55-latest.yml',
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
  // V3 transactions (cross-border / multicurrency FX). Additive, non-breaking:
  // produces a NEW output file used only by PaymentFlowFX. The existing
  // `ep-transactions` (V2) target above is left untouched.
  'ep-transactions-v3': {
    input: './api-specs/embedded-finance-pub-ep-transactions-3.0.55.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/ep-transactions-v3.ts',
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
  // FX Rate Sheet (Treasury Services API). Additive, non-breaking new target.
  'fx-rate-sheet': {
    input: './api-specs/fx-rate-sheet-1.0.2.yaml',
    output: {
      mode: 'split',
      target: './src/api/generated/fx-rate-sheet.ts',
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
