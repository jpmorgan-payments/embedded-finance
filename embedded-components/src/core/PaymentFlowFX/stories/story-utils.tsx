/**
 * Shared utilities for PaymentFlowFX stories
 *
 * Builds on the domestic PaymentFlow story fixtures and layers in:
 * - International (non-USD) recipients that activate the FX flow (FR-FX-1)
 * - MSW handlers for the V3 transaction endpoints (create + enrich)
 * - An FX rate sheet handler for `fxConfig.mode = 'ratesheet'` stories
 * - Deterministic `getIndicativeRate` / `getRate` callbacks for realtime /
 *   provider mode stories
 *
 * Stories apply the EBComponentsProvider globally via decorator in preview.tsx.
 */

import { delay, http, HttpResponse } from 'msw';

import {
  createPaymentFlowHandlers,
  mockAccounts,
  mockLinkedAccounts,
  mockRecipients,
} from '../../PaymentFlow/stories/story-utils';
import type {
  FxConfig,
  FxIndicativeRateParams,
  FxProviderRateParams,
} from '../PaymentFlowFX.types';

// ============================================================================
// Mock Data - International Recipients (activate FX)
// ============================================================================

/**
 * Recipients whose account carries a non-USD `currencyCode`. usePaymentFlowFXData
 * reads this to mark the payee as cross-border (SPECIFICATION.md FR-FX-1).
 */
export const mockInternationalRecipients = [
  {
    id: 'recipient-eur-isabelle',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Isabelle',
      lastName: 'Moreau',
      address: {
        addressLine1: '10 Rue de Rivoli',
        city: 'Paris',
        postalCode: '75001',
        countryCode: 'FR',
      },
      contacts: [{ contactType: 'EMAIL', value: 'isabelle.moreau@email.fr' }],
    },
    account: {
      id: 'acc-eur-isabelle',
      number: 'FR7630006000011234567890189',
      type: 'CHECKING',
      currencyCode: 'EUR',
      countryCode: 'FR',
      routingInformation: [
        {
          routingCodeType: 'SWIFT',
          routingNumber: 'BNPAFRPP',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-02-01T08:15:00Z',
    updatedAt: '2024-02-01T08:15:00Z',
  },
  {
    id: 'recipient-gbp-thames',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Thames Trading Ltd',
      address: {
        addressLine1: '1 Canada Square',
        city: 'London',
        postalCode: 'E14 5AB',
        countryCode: 'GB',
      },
      contacts: [{ contactType: 'EMAIL', value: 'ap@thamestrading.co.uk' }],
    },
    account: {
      id: 'acc-gbp-thames',
      number: 'GB29NWBK60161331926819',
      type: 'CHECKING',
      currencyCode: 'GBP',
      countryCode: 'GB',
      routingInformation: [
        {
          routingCodeType: 'SWIFT',
          routingNumber: 'NWBKGB2L',
          transactionType: 'ACH',
        },
        {
          routingCodeType: 'SWIFT',
          routingNumber: 'NWBKGB2L',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-02-03T13:30:00Z',
    updatedAt: '2024-02-03T13:30:00Z',
  },
  {
    id: 'recipient-sgd-tan',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'mock-client-id',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Wei',
      lastName: 'Tan',
      address: {
        addressLine1: '1 Raffles Place',
        city: 'Singapore',
        postalCode: '048616',
        countryCode: 'SG',
      },
      contacts: [{ contactType: 'EMAIL', value: 'wei.tan@email.sg' }],
    },
    account: {
      id: 'acc-sgd-tan',
      number: 'SG1234567890',
      type: 'CHECKING',
      currencyCode: 'SGD',
      countryCode: 'SG',
      routingInformation: [
        {
          routingCodeType: 'SWIFT',
          routingNumber: 'DBSSSGSG',
          transactionType: 'WIRE',
        },
      ],
    },
    createdAt: '2024-02-05T10:30:00Z',
    updatedAt: '2024-02-05T10:30:00Z',
  },
];

/** Recipients list combining domestic + international payees. */
export const mockFxRecipients = [
  ...mockInternationalRecipients,
  ...mockRecipients,
];

// ============================================================================
// Mock Data - V3 Transaction Responses
// ============================================================================

/** Rough indicative rates (target units per 1 USD) for deterministic stories. */
export const MOCK_FX_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.35,
  CAD: 1.36,
  MXN: 17.1,
  INR: 83.2,
};

/**
 * In-memory store of FX transactions created during a story session, keyed by
 * the generated id. Lets the enrichment GET return settlement details that match
 * the recipient the user actually selected (currency + converted amount) instead
 * of a fixed EUR fixture.
 */
const createdFxTransactions = new Map<
  string,
  { amount: string; currency: string; targetCurrency: string }
>();

function buildV3CreateResponse(body: Record<string, unknown>) {
  const id = `txn-v3-${Date.now()}`;
  const targetCurrency =
    typeof body.targetCurrency === 'string' ? body.targetCurrency : undefined;
  if (targetCurrency && targetCurrency !== 'USD') {
    createdFxTransactions.set(id, {
      amount: typeof body.amount === 'string' ? body.amount : '0',
      currency: typeof body.currency === 'string' ? body.currency : 'USD',
      targetCurrency,
    });
  }
  return {
    id,
    transactionReferenceId:
      (body.transactionReferenceId as string) ?? `PHUI_${Date.now()}`,
    status: 'PENDING',
  };
}

function buildV3EnrichedResponse(id: string) {
  const created = createdFxTransactions.get(id);
  const targetCurrency = created?.targetCurrency ?? 'EUR';
  const sourceAmount = parseFloat(created?.amount ?? '100.00') || 0;
  const rate = MOCK_FX_RATES[targetCurrency] ?? 0.92;
  return {
    id,
    transactionReferenceId: id,
    status: 'COMPLETED',
    amount: created?.amount ?? '100.00',
    currency: created?.currency ?? 'USD',
    targetCurrency,
    targetAmount: (sourceAmount * rate).toFixed(2),
    fxInformation: { exchangeRate: rate.toString() },
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// Mock Data - FX Rate Sheet
// ============================================================================

const RATE_SHEET_CURRENCIES: Array<{ ccy: string; rate: number }> = [
  { ccy: 'EUR', rate: 0.92 },
  { ccy: 'GBP', rate: 0.79 },
  { ccy: 'SGD', rate: 1.35 },
];

/**
 * A minimal, valid rate sheet with EXECUTABLE + INDICATIVE rates per pair.
 *
 * Per the FX Rate Sheet API a published rate sheet — and every `rateId` extracted
 * from it — is valid for 24 hours. `data.expiry` is therefore set 24h out by
 * default so the mock reflects the real pre-agreed-rate lock window. Callers that
 * want to exercise the expiry / re-quote path can pass a shorter `expiryMs`.
 */
export function buildRateSheet(expiryMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  return {
    _metadata: {
      disclaimer:
        'Rates are held for 24 hours from publication. Executable rates may be ' +
        'locked for a transaction using their rateId; indicative rates are for ' +
        'information only and subject to change until the transaction is confirmed.',
    },
    data: {
      ratesheetId: 'mock-ratesheet-1',
      publicationTime: new Date(now).toISOString(),
      expiry: new Date(now + expiryMs).toISOString(),
      customerDepartment: [
        {
          name: 'DEFAULT',
          currencyPairs: RATE_SHEET_CURRENCIES.map(({ ccy, rate }) => ({
            clientSellCcy: 'USD',
            clientBuyCcy: ccy,
            fromBuyCcyToSellCcy: 'Divide',
            rates: [
              {
                rateType: 'EXECUTABLE',
                rateId: `rate-${ccy.toLowerCase()}-exec`,
                paymentMethod: 'ACH',
                clientRate: rate,
              },
              {
                rateType: 'EXECUTABLE',
                rateId: `rate-${ccy.toLowerCase()}-wire`,
                paymentMethod: 'WIRE_DRAFT_BOOK',
                clientRate: rate * 0.998,
              },
              {
                rateType: 'INDICATIVE',
                paymentMethod: 'ACH',
                clientRate: rate * 1.002,
              },
            ],
          })),
        },
      ],
    },
  };
}

// ============================================================================
// FX Config presets (SPECIFICATION.md FR-FX-6)
// ============================================================================

/** realtime mode with a deterministic indicative estimate. */
export const realtimeFxConfig: FxConfig = {
  mode: 'realtime',
  getIndicativeRate: async ({ targetCurrency }: FxIndicativeRateParams) => {
    await delay(200);
    return {
      rate: MOCK_FX_RATES[targetCurrency] ?? 1,
    };
  },
};

/** provider mode returning a locked (executable) rate. */
export const providerFxConfig: FxConfig = {
  mode: 'provider',
  getRate: async ({ targetCurrency }: FxProviderRateParams) => {
    await delay(300);
    return {
      rate: MOCK_FX_RATES[targetCurrency] ?? 1,
      rateId: `provider-${targetCurrency.toLowerCase()}-${Date.now()}`,
      isIndicative: false,
      expiresAt: new Date(Date.now() + 60_000),
    };
  },
};

/** ratesheet mode driven by the built-in getCurrentRatesheet endpoint. */
export const ratesheetFxConfig: FxConfig = {
  mode: 'ratesheet',
};

// ============================================================================
// MSW Handlers Factory
// ============================================================================

export interface PaymentFlowFXHandlerOptions {
  /** Network delay in milliseconds (default: 300ms). */
  delayMs?: number;
  /** Return an errored rate sheet body (200 with `errors[]`). */
  ratesheetError?: boolean;
  /** Fail the V3 create-transaction call. */
  simulateTransactionError?: boolean;
  /** Override the recipients list. */
  recipients?: typeof mockFxRecipients;
}

/**
 * Creates MSW handlers for PaymentFlowFX stories. Reuses the domestic handlers
 * (accounts, balances, recipient CRUD) and overrides the transaction endpoints
 * with V3 semantics plus the FX rate sheet endpoint.
 */
export function createPaymentFlowFXHandlers(
  options: PaymentFlowFXHandlerOptions = {}
): ReturnType<typeof http.get>[] {
  const {
    delayMs = 300,
    ratesheetError = false,
    simulateTransactionError = false,
    recipients = mockFxRecipients,
  } = options;

  const fxOverrides: ReturnType<typeof http.get>[] = [
    // FX rate sheet (ratesheet mode).
    http.get('*/accounts/:id/ratesheets/current', async () => {
      await delay(delayMs);
      if (ratesheetError) {
        return HttpResponse.json({
          errors: [
            { errorCode: 'RATE_UNAVAILABLE', errorMsg: 'No rate available' },
          ],
        });
      }
      return HttpResponse.json(buildRateSheet());
    }),

    // Create transaction (V3, 202 Accepted).
    http.post('*/transactions', async ({ request }) => {
      await delay(delayMs * 2);
      if (simulateTransactionError) {
        return HttpResponse.json(
          {
            title: 'Transaction failed',
            httpStatus: 422,
            context: [
              {
                code: 'FX_RATE_EXPIRED',
                message: 'The quoted rate has expired. Please retry.',
              },
            ],
          },
          { status: 422 }
        );
      }
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(buildV3CreateResponse(body), { status: 202 });
    }),

    // Enrich transaction (post-submit GET).
    http.get('*/transactions/:id', async ({ params }) => {
      await delay(delayMs);
      return HttpResponse.json(buildV3EnrichedResponse(params.id as string));
    }),
  ];

  // FX overrides first so they win over the domestic /transactions handler.
  return [
    ...fxOverrides,
    ...createPaymentFlowHandlers({
      recipients: recipients as unknown as typeof mockRecipients,
    }),
  ];
}

// ============================================================================
// Common Story Args
// ============================================================================

export { mockAccounts, mockLinkedAccounts };

export const commonFxArgs = {};

export const commonFxArgTypes = {
  supportedTargetCurrencies: {
    control: { type: 'object' as const },
    description: 'Currencies offered when adding an international recipient',
    table: { category: 'FX Configuration' },
  },
  fxConfig: {
    control: { type: 'object' as const },
    description: 'Rate acquisition mode: realtime | ratesheet | provider',
    table: { category: 'FX Configuration' },
  },
  enrichTransactionAfterSubmit: {
    control: { type: 'boolean' as const },
    description: 'Fetch settled FX details after submit for the success screen',
    table: { category: 'FX Configuration' },
  },
  showFees: {
    control: { type: 'boolean' as const },
    description: 'Whether to show fees in the review panel',
    table: { category: 'Configuration' },
  },
  initialAccountId: {
    control: { type: 'text' as const },
    description: 'Pre-selected account ID',
    table: { category: 'Initial State' },
  },
  initialPayeeId: {
    control: { type: 'text' as const },
    description: 'Pre-selected payee ID',
    table: { category: 'Initial State' },
  },
  onTransactionComplete: {
    action: 'transactionComplete',
    description: 'Callback when the transaction completes (success or error)',
    table: { category: 'Callbacks' },
  },
  onClose: {
    action: 'close',
    description: 'Callback when the flow is closed',
    table: { category: 'Callbacks' },
  },
  open: {
    control: { type: 'boolean' as const },
    description: 'Controlled open state',
    table: { category: 'Controlled Mode' },
  },
  onOpenChange: {
    action: 'openChange',
    description: 'Callback when open state changes',
    table: { category: 'Controlled Mode' },
  },
};
