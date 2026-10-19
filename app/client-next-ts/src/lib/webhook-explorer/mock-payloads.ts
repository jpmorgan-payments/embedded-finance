/**
 * Mock Embedded Payments notification shapes for the showcase Webhook Explorer.
 * Event type names and semantics align with `embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md`
 * and the Manage notifications product documentation.
 */

export type EventPriority = 'critical' | 'high' | 'medium';

export type EventCategory =
  'transaction' | 'client' | 'account' | 'recipient' | 'program';

export interface WebhookEventDefinition {
  eventType: string;
  category: EventCategory;
  priority: EventPriority;
  /** Short description for the catalog */
  summary: string;
  /** When this notification typically fires */
  whenItFires: string;
  /** UX angle from the integration recipe (audience-specific) */
  uxNote: string;
}

export const WEBHOOK_EVENT_DEFINITIONS: WebhookEventDefinition[] = [
  {
    eventType: 'TRANSACTION_COMPLETED',
    category: 'transaction',
    priority: 'high',
    summary: 'Transaction completed (including ACH returns)',
    whenItFires:
      'When a payment reaches a terminal success state, including later ACH return cases surfaced as completed with return metadata.',
    uxNote:
      'Client-facing: success confirmation with details; surface returns prominently if applicable.',
  },
  {
    eventType: 'TRANSACTION_FAILED',
    category: 'transaction',
    priority: 'high',
    summary: 'Transaction failed to process',
    whenItFires: 'When processing cannot complete for the transaction.',
    uxNote:
      'Client-facing: clear error with reason and next steps; offer retry or alternate rails.',
  },
  {
    eventType: 'TRANSACTION_CHANGE_REQUESTED',
    category: 'transaction',
    priority: 'high',
    summary: 'Recipient / bank details need correction (NOC-style)',
    whenItFires:
      'When the bank requests updated recipient information after a payment.',
    uxNote:
      'Client-facing: explain that funds may have moved but details must be updated; link to recipient edit flow.',
  },
  {
    eventType: 'CLIENT_ONBOARDING',
    category: 'client',
    priority: 'high',
    summary: 'Client onboarding status changed',
    whenItFires:
      'When onboarding state transitions (e.g. review, information requested, approved).',
    uxNote:
      'Client-facing: linear progress, actionable panels when user input is required; poll `/clients/{id}` for authoritative state.',
  },
  {
    eventType: 'ACCOUNT_CREATED',
    category: 'account',
    priority: 'medium',
    summary: 'New account successfully created',
    whenItFires: 'When a new Embedded Payments account is opened for a client.',
    uxNote:
      'Client-facing: success state with account context and clear next steps.',
  },
  {
    eventType: 'ACCOUNT_CLOSED',
    category: 'account',
    priority: 'medium',
    summary: 'Account has been closed',
    whenItFires: 'When an account is closed in the program.',
    uxNote:
      'Client-facing: closure confirmation; guidance on balances or fund movement if applicable.',
  },
  {
    eventType: 'ACCOUNT_OVERDRAWN',
    category: 'account',
    priority: 'high',
    summary: 'Account has a negative balance',
    whenItFires: 'When the account balance goes below zero.',
    uxNote:
      'Client-facing: urgent alert with amount and resolution steps; treasury may need program-level monitoring.',
  },
  {
    eventType: 'RECIPIENT_ACCOUNT_VALIDATION',
    category: 'recipient',
    priority: 'medium',
    summary:
      'Linked account microdeposit validation: ready, reminder, or expired',
    whenItFires:
      'When microdeposits are ready to verify (status READY_FOR_VALIDATION), again when 3 days remain (daysUntilExpiry 3), and when the window expires (status INACTIVE).',
    uxNote:
      'Client-facing: branch on status and daysUntilExpiry, not eventType. Verification CTA while ready, deadline copy at 3 days, restart guidance once expired.',
  },
  {
    eventType: 'THRESHOLD_LIMIT',
    category: 'program',
    priority: 'critical',
    summary: 'Program-level negative balance threshold event',
    whenItFires:
      'When program utilization crosses alert or restrict thresholds for negative balance limits.',
    uxNote:
      'Partner ops / treasury: dashboards, banners, and drill-down by client exposure.',
  },
];

export function getEventDefinition(
  eventType: string
): WebhookEventDefinition | undefined {
  return WEBHOOK_EVENT_DEFINITIONS.find((e) => e.eventType === eventType);
}

/** Canonical inner notification body (after any OAuth/JWS verification in production). */
export interface CanonicalNotificationPayload {
  eventId: string;
  eventType: string;
  occurredAt: string;
  /** Domain payload — illustrative only */
  data: Record<string, unknown>;
}

const RECIPIENT_VALIDATION_DATA = {
  recipientId: 'rec-demo-77',
  clientId: 'cl-demo-01',
  type: 'LINKED_ACCOUNT',
  status: 'READY_FOR_VALIDATION',
  daysUntilExpiry: 18,
};

function baseDataForEvent(eventType: string): Record<string, unknown> {
  switch (eventType) {
    case 'TRANSACTION_COMPLETED':
      return {
        transactionId: 'txn-demo-1001',
        amount: { value: '1250.00', currency: 'USD' },
        direction: 'CREDIT',
        clientId: 'cl-demo-01',
      };
    case 'TRANSACTION_FAILED':
      return {
        transactionId: 'txn-demo-1002',
        reasonCode: 'INSUFFICIENT_FUNDS',
        clientId: 'cl-demo-01',
      };
    case 'TRANSACTION_CHANGE_REQUESTED':
      return {
        transactionId: 'txn-demo-1003',
        recipientId: 'rec-demo-77',
        changeReason: 'BANK_ACCOUNT_UPDATE_REQUIRED',
        clientId: 'cl-demo-01',
      };
    case 'CLIENT_ONBOARDING':
      return {
        clientId: 'cl-demo-01',
        status: 'INFORMATION_REQUESTED',
        hasOutstandingInformation: true,
        customerIdentityStatus: 'REVIEW_IN_PROGRESS',
      };
    case 'ACCOUNT_CREATED':
      return {
        accountId: 'acc-demo-500',
        clientId: 'cl-demo-01',
        productCode: 'EP_BUSINESS',
      };
    case 'ACCOUNT_CLOSED':
      return {
        accountId: 'acc-demo-500',
        clientId: 'cl-demo-01',
        closedReason: 'USER_REQUESTED',
      };
    case 'ACCOUNT_OVERDRAWN':
      return {
        accountId: 'acc-demo-500',
        clientId: 'cl-demo-01',
        balance: { value: '-42.10', currency: 'USD' },
      };
    case 'RECIPIENT_ACCOUNT_VALIDATION':
      return { ...RECIPIENT_VALIDATION_DATA };
    case 'THRESHOLD_LIMIT':
      return {
        programId: 'prg-demo-01',
        thresholdType: 'NEGATIVE_BALANCE_ALERT',
        utilizationPercent: 82,
        limitCurrency: 'USD',
      };
    default:
      return { note: 'illustrative payload' };
  }
}

export function buildCanonicalPayload(
  eventType: string,
  eventId: string,
  data?: Record<string, unknown>
): CanonicalNotificationPayload {
  return {
    eventId,
    eventType,
    occurredAt: new Date().toISOString(),
    data: data ? { ...data } : baseDataForEvent(eventType),
  };
}

/**
 * Simulated OAuth-signed envelope (structure only — not a real JWS).
 * In production you verify the signature using keys from webhook registration.
 */
export function buildOAuthWrappedDisplay(
  canonical: CanonicalNotificationPayload
) {
  const innerJson = JSON.stringify(canonical);
  const fakeSig = btoa('demo-signature-not-valid').replace(/=+$/, '');
  const compactJws = [
    btoa(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).replace(/=+$/, ''),
    btoa(innerJson).replace(/=+$/, ''),
    fakeSig,
  ].join('.');

  return {
    signedNotification: compactJws,
    headers: {
      'X-JPM-Public-Key-Identifier': 'pk-demo-placeholder',
    },
    decodedPayload: canonical,
    _demoNote:
      'Demonstration only. In production, verify the JWS using the public key from your webhook registration response, then parse JSON.',
  };
}

export interface LifecycleStep {
  eventType: string;
  /** Replaces the default illustrative payload for this step */
  data?: Record<string, unknown>;
}

export interface LifecyclePreset {
  id: string;
  label: string;
  description: string;
  /** Ordered sequence of events to simulate a flow */
  steps: LifecycleStep[];
}

export const LIFECYCLE_PRESETS: LifecyclePreset[] = [
  {
    id: 'onboard-to-account',
    label: 'Onboarding → account',
    description:
      'Typical progression from onboarding updates to a funded account being created.',
    steps: [
      { eventType: 'CLIENT_ONBOARDING' },
      { eventType: 'ACCOUNT_CREATED' },
    ],
  },
  {
    id: 'payout-happy-path',
    label: 'Payout success',
    description: 'A completed credit transaction after the client is active.',
    steps: [{ eventType: 'TRANSACTION_COMPLETED' }],
  },
  {
    id: 'recipient-verify',
    label: 'Recipient microdeposit flow',
    description:
      'Ready, reminder and expiry for linked-account verification. One event type; status and daysUntilExpiry change (timing illustrative).',
    steps: [
      { eventType: 'RECIPIENT_ACCOUNT_VALIDATION' },
      {
        eventType: 'RECIPIENT_ACCOUNT_VALIDATION',
        data: { ...RECIPIENT_VALIDATION_DATA, daysUntilExpiry: 3 },
      },
      {
        eventType: 'RECIPIENT_ACCOUNT_VALIDATION',
        data: {
          ...RECIPIENT_VALIDATION_DATA,
          status: 'INACTIVE',
          daysUntilExpiry: 0,
        },
      },
    ],
  },
  {
    id: 'ops-threshold',
    label: 'Program threshold',
    description:
      'Treasury-facing alert when negative balance limits are approached.',
    steps: [{ eventType: 'THRESHOLD_LIMIT' }],
  },
];
