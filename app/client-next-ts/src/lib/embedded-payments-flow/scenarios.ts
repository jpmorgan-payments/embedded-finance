/**
 * Embedded Payments integration scenarios — aligned with PDP capability docs
 * and the showcase “Experiences” section (onboarding, accounts, recipients, etc.).
 *
 * HTTP paths below match the published OpenAPI specs in
 * `embedded-components/api-specs/` (Digital Onboarding SMBDO, Embedded
 * Accounts/Recipients/Transactions, Embedded Banking EF).
 */

/** Base URLs from those specs (production examples). */
export const API_BASE_URLS = {
  /** Digital Onboarding API — clients, parties, documents, questions, verifications */
  digitalOnboarding: 'https://api.payments.jpmorgan.com/onboarding/v1',
  /** Accounts & recipients */
  embeddedV1: 'https://api.payments.jpmorgan.com/embedded/v1',
  /** Transactions */
  embeddedV2: 'https://api.payments.jpmorgan.com/embedded/v2',
  /** Webhooks / unified Embedded Banking surface */
  embeddedBankingEf: 'https://api.payments.jpmorgan.com/tsapi/ef/v1',
} as const;

export const PDP_OVERVIEW =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments';

export const CAPABILITY_COLUMNS = [
  {
    id: 'onboarding',
    label: 'Client onboarding',
    short: 'KYC / KYB',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    short: 'Accounts API',
  },
  {
    id: 'linkedAccount',
    label: 'Linked bank account',
    short: 'AVS / link',
  },
  {
    id: 'recipients',
    label: 'Recipients',
    short: 'Recipients',
  },
  {
    id: 'payments',
    label: 'Payouts & transfers',
    short: 'Transactions',
  },
  {
    id: 'transactions',
    label: 'Transaction history',
    short: 'List / filter',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    short: 'Webhooks',
  },
  {
    id: 'clientDetails',
    label: 'Client details',
    short: 'Read client',
  },
] as const;

export type CapabilityColumnId = (typeof CAPABILITY_COLUMNS)[number]['id'];

export type CapabilityPresence = 'yes' | 'no' | 'optional';

/** Core resources that appear across Embedded Payments + Digital Onboarding APIs. */
export type DataObjectId =
  | 'client'
  | 'party'
  | 'document'
  | 'account'
  | 'recipient'
  | 'transaction'
  | 'webhook';

export type ApiSurfaceKey =
  | 'digitalOnboarding'
  | 'embeddedV1'
  | 'embeddedV2'
  | 'efV1';

export const API_SURFACE_META: Record<
  ApiSurfaceKey,
  { label: string; pathSuffix: string; chipClass: string }
> = {
  digitalOnboarding: {
    label: 'Digital Onboarding',
    pathSuffix: '/onboarding/v1',
    chipClass:
      'border-blue-200 bg-blue-50/90 text-blue-950 ring-1 ring-blue-100',
  },
  embeddedV1: {
    label: 'Embedded (v1)',
    pathSuffix: '/embedded/v1',
    chipClass:
      'border-emerald-200 bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-100',
  },
  embeddedV2: {
    label: 'Embedded (v2)',
    pathSuffix: '/embedded/v2',
    chipClass:
      'border-violet-200 bg-violet-50/90 text-violet-950 ring-1 ring-violet-100',
  },
  efV1: {
    label: 'Embedded Banking (EF)',
    pathSuffix: '/tsapi/ef/v1',
    chipClass:
      'border-amber-200 bg-amber-50/90 text-amber-950 ring-1 ring-amber-100',
  },
};

export interface DataObjectEntity {
  id: DataObjectId;
  label: string;
  /** Primary identifier field in API payloads. */
  idField: string;
  apiSurface: ApiSurfaceKey;
  /** Representative fields for diagrams and tooling (not exhaustive). */
  keyFields: string[];
}

export const DATA_OBJECT_ENTITIES: DataObjectEntity[] = [
  {
    id: 'client',
    label: 'Client',
    idField: 'id',
    apiSurface: 'digitalOnboarding',
    keyFields: ['id', 'status', 'partyId', 'products', 'outstanding'],
  },
  {
    id: 'party',
    label: 'Party',
    idField: 'id',
    apiSurface: 'digitalOnboarding',
    keyFields: ['id', 'partyType', 'roles', 'organizationDetails'],
  },
  {
    id: 'document',
    label: 'Document',
    idField: 'id',
    apiSurface: 'digitalOnboarding',
    keyFields: ['id', 'documentType', 'status'],
  },
  {
    id: 'account',
    label: 'Account',
    idField: 'id',
    apiSurface: 'embeddedV1',
    keyFields: ['id', 'clientId', 'accountType', 'status'],
  },
  {
    id: 'recipient',
    label: 'Recipient',
    idField: 'id',
    apiSurface: 'embeddedV1',
    keyFields: ['id', 'clientId', 'type', 'partyId', 'account'],
  },
  {
    id: 'transaction',
    label: 'Transaction',
    idField: 'id',
    apiSurface: 'embeddedV2',
    keyFields: ['id', 'clientId', 'type', 'status', 'amount'],
  },
  {
    id: 'webhook',
    label: 'Webhook subscription',
    idField: 'id',
    apiSurface: 'efV1',
    keyFields: ['id', 'url', 'status', 'subscriptions'],
  },
];

/** How resources connect across APIs (conceptual foreign keys & event references). */
export const DATA_OBJECT_RELATIONSHIPS: Array<{
  from: DataObjectId;
  to: DataObjectId;
  via: string;
}> = [
  { from: 'client', to: 'party', via: 'roles / parent party graph' },
  { from: 'client', to: 'document', via: 'uploads & document requests' },
  { from: 'client', to: 'account', via: 'clientId query + create' },
  { from: 'client', to: 'recipient', via: 'clientId on recipient' },
  { from: 'account', to: 'transaction', via: 'debit / credit account ids' },
  { from: 'recipient', to: 'transaction', via: 'payout destination' },
  {
    from: 'webhook',
    to: 'client',
    via: 'notification payloads reference clientId',
  },
  {
    from: 'webhook',
    to: 'transaction',
    via: 'TRANSACTION_* events include transaction id',
  },
];

export const ALL_DATA_OBJECT_IDS: DataObjectId[] = DATA_OBJECT_ENTITIES.map(
  (e) => e.id
);

export interface FlowStep {
  id: string;
  title: string;
  description: string;
  /**
   * Operations from OAS (path only; see `API_BASE_URLS` for host + version).
   * Attestations are updated via `PATCH /clients/{id}` (`UpdateClientRequestSmbdo`),
   * not a separate `/attestations` sub-resource.
   */
  apiHints: string[];
  docsUrl: string;
  recipeUrl?: string;
}

export interface FlowBranch {
  title: string;
  subtitle: string;
  steps: FlowStep[];
}

export type ScenarioLayout = 'linear' | 'split';

export interface IntegrationScenario {
  id: string;
  name: string;
  /** Compact label for the capability matrix header. */
  matrixLabel: string;
  tagline: string;
  whenToUse: string;
  layout: ScenarioLayout;
  /** Primary ordered flow (linear scenarios). */
  steps: FlowStep[];
  /** Parallel flows (e.g. marketplace with two merchant models). */
  branches?: [FlowBranch, FlowBranch];
  capabilities: Record<CapabilityColumnId, CapabilityPresence>;
  /** Which core resources this scenario typically creates or relies on. */
  dataObjectsInvolved: DataObjectId[];
}

const DOCS = {
  onboard:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client',
  addAccount:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account',
  linkedAccount:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-linked-account',
  recipients:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient',
  makePayout:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/payments-without-onboarding/how-to/make-payout',
  transactions:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-display-transactions-v2',
  notificationsHowTo:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions/how-to/notifications',
  notificationsPayloads:
    'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions/how-to/notification-payloads',
} as const;

const RECIPE = {
  onboarding:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md',
  linked:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/RecipientWidgets/LINKED_ACCOUNTS_REQUIREMENTS.md',
  recipients:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/RecipientWidgets/RecipientsWidget/README.md',
  makePayment:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/MakePayment/MAKE_PAYMENT_REQUIREMENTS.md',
  transactions:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/TransactionsDisplay/TRANSACTIONS_DISPLAY_REQUIREMENTS.md',
  accounts:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/Accounts/ACCOUNTS_REQUIREMENTS.md',
  partiallyHosted:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md',
  webhook:
    'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md',
} as const;

const step = (
  id: string,
  title: string,
  description: string,
  apiHints: string[],
  docsUrl: string,
  recipeUrl?: string
): FlowStep => ({
  id,
  title,
  description,
  apiHints,
  docsUrl,
  recipeUrl,
});

export const INTEGRATION_SCENARIOS: IntegrationScenario[] = [
  {
    id: 'full-embedded-payments',
    name: 'Full Embedded Payments (with accounts)',
    matrixLabel: 'Full EP\n(accounts)',
    tagline: 'Onboard the business, open accounts, then move money.',
    whenToUse:
      'You custody or route funds in J.P. Morgan Embedded accounts and need the full Clients → Accounts → Recipients → Transactions lifecycle.',
    layout: 'linear',
    steps: [
      step(
        'create-client',
        'Create client',
        'Start the legal entity record; collect organization basics for KYB.',
        ['POST /clients'],
        DOCS.onboard,
        RECIPE.onboarding
      ),
      step(
        'parties',
        'Parties, documents & diligence',
        'Create parties, upload documents, answer diligence questions. Parties are first-class resources; link them to the client using fields in the request body (e.g. roles / parent party), not a nested `/clients/.../parties` path.',
        [
          'POST /parties',
          'PATCH /parties/{partyId}',
          'POST /documents',
          'GET /document-requests',
          'GET /questions',
          'PATCH /clients/{id} (addParties, questionResponses)',
        ],
        DOCS.onboard,
        RECIPE.onboarding
      ),
      step(
        'attest-submit',
        'Attestations & client updates',
        'Record attestations and any remaining client fields using the client update payload. The spec exposes `addAttestations` (and related fields) on the client update request — there is no `POST .../attestations` route.',
        [
          'PATCH /clients/{id} (addAttestations, questionResponses, …)',
          'POST /clients/{id}/verifications (when identity verification is required)',
        ],
        DOCS.onboard,
        RECIPE.onboarding
      ),
      step(
        'await-approval',
        'Underwriting & approval',
        'Poll client status or consume push notifications until the client is approved for Embedded Payments.',
        ['GET /clients/{id}', 'Incoming webhook deliveries (see POST /webhooks)'],
        DOCS.onboard,
        RECIPE.webhook
      ),
      step(
        'notifications',
        'Subscribe to webhooks (recommended)',
        'Register callback URLs and event filters for client, account, recipient, and transaction lifecycle events.',
        ['POST /webhooks', 'GET /webhooks', 'POST /webhooks/{id}'],
        DOCS.notificationsHowTo,
        RECIPE.webhook
      ),
      step(
        'accounts',
        'Create or fetch accounts',
        'Open processing or limited DDA style accounts needed for your product.',
        ['POST /accounts', 'GET /accounts?clientId=…', 'GET /accounts/{id}'],
        DOCS.addAccount,
        RECIPE.accounts
      ),
      step(
        'recipients',
        'Register recipients',
        'Add third-party payout destinations (ACH / Wire / RTP as applicable).',
        ['POST /recipients', 'GET /recipients?clientId=…', 'GET /recipients/{id}'],
        DOCS.recipients,
        RECIPE.recipients
      ),
      step(
        'linked',
        'Link external bank (optional)',
        'Complete micro-deposit verification when linking an external account as a recipient.',
        ['POST /recipients/{id}/verify-microdeposit'],
        DOCS.linkedAccount,
        RECIPE.linked
      ),
      step(
        'move-money',
        'Transfers & payouts',
        'Fund the operating account, move between internal accounts, then pay out to recipients.',
        ['POST /transactions'],
        DOCS.makePayout,
        RECIPE.makePayment
      ),
      step(
        'history',
        'Transaction history',
        'Expose status, filters, and reporting to your users for support and reconciliation.',
        ['GET /transactions'],
        DOCS.transactions,
        RECIPE.transactions
      ),
    ],
    capabilities: {
      onboarding: 'yes',
      accounts: 'yes',
      linkedAccount: 'optional',
      recipients: 'yes',
      payments: 'yes',
      transactions: 'yes',
      notifications: 'optional',
      clientDetails: 'yes',
    },
    dataObjectsInvolved: ALL_DATA_OBJECT_IDS,
  },
  {
    id: 'direct-payouts',
    name: 'Direct payouts (no client onboarding)',
    matrixLabel: 'Direct\npayouts',
    tagline: 'Recipients and payouts only — no Embedded account onboarding.',
    whenToUse:
      'You already have a program or debtor context and only need to pay out or move money without the full KYB stack in this integration.',
    layout: 'linear',
    steps: [
      step(
        'recipients-only',
        'Create or select recipients',
        'Stand up payout destinations your program is allowed to use.',
        ['POST /recipients'],
        DOCS.recipients,
        RECIPE.recipients
      ),
      step(
        'payout',
        'Initiate payout',
        'Create the payment instruction with amount, rail, and references.',
        ['POST /transactions'],
        DOCS.makePayout,
        RECIPE.makePayment
      ),
      step(
        'track',
        'Track & reconcile',
        'Read transaction status and history for operations and support.',
        ['GET /transactions'],
        DOCS.transactions,
        RECIPE.transactions
      ),
    ],
    capabilities: {
      onboarding: 'no',
      accounts: 'no',
      linkedAccount: 'no',
      recipients: 'yes',
      payments: 'yes',
      transactions: 'yes',
      notifications: 'optional',
      clientDetails: 'no',
    },
    dataObjectsInvolved: ['recipient', 'transaction'],
  },
  {
    id: 'partially-hosted',
    name: 'Partially hosted onboarding',
    matrixLabel: 'Partially\nhosted',
    tagline: 'Your UI for data collection; hosted UI for sensitive verification steps.',
    whenToUse:
      'You want a native feel for most of the flow but must hand off identity or verification to a hosted experience, then resume API flows.',
    layout: 'linear',
    steps: [
      step(
        'ph-create',
        'Create client in your backend',
        'Persist a client id you can correlate when the user returns from hosted UI.',
        ['POST /clients'],
        DOCS.onboard,
        RECIPE.partiallyHosted
      ),
      step(
        'ph-handoff',
        'Launch hosted verification',
        'Open the hosted session for steps you do not render in your own UI.',
        ['Hosted session URL / token pattern'],
        DOCS.onboard,
        RECIPE.partiallyHosted
      ),
      step(
        'ph-return',
        'Resume after completion',
        'On return, sync status via GET client and notifications.',
        ['GET /clients/{clientId}', 'webhooks'],
        DOCS.onboard,
        RECIPE.partiallyHosted
      ),
      step(
        'ph-continue',
        'Continue as full Embedded Payments',
        'After approval, follow the same accounts → recipients → transactions path as the full scenario.',
        ['POST /accounts', 'POST /recipients', 'POST /transactions'],
        DOCS.addAccount,
        RECIPE.accounts
      ),
    ],
    capabilities: {
      onboarding: 'yes',
      accounts: 'yes',
      linkedAccount: 'optional',
      recipients: 'yes',
      payments: 'yes',
      transactions: 'yes',
      notifications: 'optional',
      clientDetails: 'yes',
    },
    dataObjectsInvolved: [
      'client',
      'party',
      'document',
      'account',
      'recipient',
      'transaction',
    ],
  },
  {
    id: 'event-driven',
    name: 'Event-driven operations',
    matrixLabel: 'Event-\ndriven',
    tagline: 'Notifications as the backbone of status and ops.',
    whenToUse:
      'You prefer push over polling for underwriting, account opening, and money movement — typical for production-grade integrations.',
    layout: 'linear',
    steps: [
      step(
        'sub',
        'Subscribe early',
        'Create webhook subscriptions before high-volume status changes.',
        ['POST /webhooks'],
        DOCS.notificationsHowTo,
        RECIPE.webhook
      ),
      step(
        'payloads',
        'Handle payloads idempotently',
        'De-duplicate by event id; drive UI and workflows from canonical payload shapes.',
        ['HTTPS handler (your endpoint)'],
        DOCS.notificationsPayloads,
        RECIPE.webhook
      ),
      step(
        'reconcile',
        'Reconcile with GET APIs',
        'Use read APIs for support and edge cases when push delivery is delayed or ambiguous.',
        [
          'GET /clients',
          'GET /accounts',
          'GET /transactions',
        ],
        DOCS.transactions,
        RECIPE.transactions
      ),
    ],
    capabilities: {
      onboarding: 'optional',
      accounts: 'optional',
      linkedAccount: 'no',
      recipients: 'optional',
      payments: 'optional',
      transactions: 'yes',
      notifications: 'yes',
      clientDetails: 'optional',
    },
    dataObjectsInvolved: [
      'client',
      'account',
      'recipient',
      'transaction',
      'webhook',
    ],
  },
  {
    id: 'marketplace-hybrid',
    name: 'Marketplace / multi-product hybrid',
    matrixLabel: 'Marketplace\nhybrid',
    tagline: 'Two integration shapes on one platform.',
    whenToUse:
      'Some sellers are fully onboarded into Embedded accounts; others only receive payouts from your master program.',
    layout: 'split',
    steps: [],
    branches: [
      {
        title: 'Full Embedded path',
        subtitle: 'Sub-merchants that need accounts and treasury-style controls',
        steps: [
          step(
            'm1',
            'Onboard client',
            'Full KYB and approval for Embedded Payments.',
            [
              'POST /clients',
              'POST /parties',
              'PATCH /clients/{id}',
            ],
            DOCS.onboard,
            RECIPE.onboarding
          ),
          step(
            'm2',
            'Accounts & recipients',
            'Open accounts and register their payout rails.',
            ['POST /accounts', 'POST /recipients'],
            DOCS.addAccount,
            RECIPE.accounts
          ),
          step(
            'm3',
            'Operate',
            'Transfers, payouts, and transaction history inside their scope.',
            ['POST /transactions', 'GET /transactions'],
            DOCS.transactions,
            RECIPE.makePayment
          ),
        ],
      },
      {
        title: 'Direct payout path',
        subtitle: 'Participants that only need to be paid',
        steps: [
          step(
            'd1',
            'Recipient only',
            'Create or map recipients under your program.',
            ['POST /recipients'],
            DOCS.recipients,
            RECIPE.recipients
          ),
          step(
            'd2',
            'Payout',
            'Fund from your operating context without per-user onboarding.',
            ['POST /transactions'],
            DOCS.makePayout,
            RECIPE.makePayment
          ),
          step(
            'd3',
            'Reporting',
            'History and support views as needed.',
            ['GET /transactions'],
            DOCS.transactions,
            RECIPE.transactions
          ),
        ],
      },
    ],
    capabilities: {
      onboarding: 'optional',
      accounts: 'optional',
      linkedAccount: 'optional',
      recipients: 'yes',
      payments: 'yes',
      transactions: 'yes',
      notifications: 'optional',
      clientDetails: 'optional',
    },
    dataObjectsInvolved: ALL_DATA_OBJECT_IDS,
  },
];

