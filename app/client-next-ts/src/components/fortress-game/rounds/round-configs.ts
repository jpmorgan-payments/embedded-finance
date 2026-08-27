// =============================================================================
// Round Configurations
// Each round teaches one Embedded Payments capability, then attacks it. The
// defence is always a real API call — the multiple-choice list is only a fallback.
// =============================================================================

import type {
  RoundConfig,
  AccountCategory,
  AccountClosureReason,
  OrganizationType,
  PaymentRail,
  WebhookEventType,
} from '../types';
import {
  HINT_REMOVE,
  ACCOUNT_CLOSURE_REASONS,
  CREATABLE_ACCOUNT_CATEGORIES,
  ORGANIZATION_TYPES,
  ORGANIZATION_ADDRESS_TYPES,
  PAYMENT_RAILS,
  WEBHOOK_EVENT_TYPES,
} from '../types';
import { getPersonaClient } from '../data/personas';
import { at, arr, str, isMissing, clientParty, orgAddresses, addressText, patchClientOrg } from './hint-helpers';

export const rounds: RoundConfig[] = [
  // ── Round 1: Client Onboarding ──────────────────────────────────────────
  {
    id: 1,
    title: 'KNOW YOUR CLIENT',
    subtitle: 'Create a profile for a business',
    briefing: `MISSION 1
━━━━━━━━━

GOAL
Create a client profile for Fairy Tale Book Shop.

KEY RULES
- The request body has only parties and products.
- Put the business in the party with role CLIENT.
- Put its details inside organizationDetails.
- Only one party can have the CLIENT role.
- Use BUSINESS_ADDRESS for the real business location.
- yearOfFormation is text, such as "1989".
- US tax IDs must have 9 digits.

The starter request contains mistakes. Open CLIENT FILE
to check the business type, address, tax ID, and people.
Use SHOW DOCS when you need the exact field names.

YOUR TASK
Fix the request and send it.`,
    apiEndpoint: '/v1/clients',
    apiMethod: 'POST',
    apiDocHint: 'createClient',
    requiredFields: [
      'parties',
      'products',
      'parties[].partyType',
      'parties[].roles',
      'organizationDetails.organizationName',
      'organizationDetails.organizationType',
      'organizationDetails.countryOfFormation',
      'individualDetails.firstName',
      'individualDetails.lastName',
      'individualDetails.countryOfResidence',
    ],
    buildTimeLimit: 120,
    hints: {
      clear:
        'The parties, business type, and address are correct. Send the request.',
      faults: [
        {
          id: 'r1-shape',
          detect: (p) => !Array.isArray(p.parties) || !Array.isArray(p.products),
          nudge: 'The request body should have only two main fields.',
          explain:
            'Use { "parties": [...], "products": ["EMBEDDED_PAYMENTS"] }. Put the business details inside the party with role CLIENT.',
          fix: (ctx) => {
            const client = getPersonaClient(ctx.persona);
            return { parties: client.parties, products: client.products };
          },
        },
        {
          id: 'r1-org-type',
          detect: (p) => {
            const type = str(clientParty(p), 'organizationDetails.organizationType');
            return type !== undefined && !ORGANIZATION_TYPES.includes(type as OrganizationType);
          },
          nudge: 'The organizationType in the CLIENT party is not valid.',
          explain:
            'Use LIMITED_LIABILITY_COMPANY for an LLC or SOLE_PROPRIETORSHIP for a sole proprietor. Check CLIENT FILE for this business.',
          fix: (ctx, payload) => ({
            parties: patchClientOrg(payload, ctx, (org, source) => ({
              ...org,
              organizationType: source.organizationType,
            })),
          }),
        },
        {
          id: 'r1-address',
          detect: (p) =>
            orgAddresses(p).some(
              (a) =>
                !ORGANIZATION_ADDRESS_TYPES.includes(String(a.addressType)) ||
                /wilmington|registered agent|po box|virtual office/.test(addressText(a))
            ),
          nudge:
            'The CLIENT party uses an address the API does not accept. Check CLIENT FILE.',
          explain:
            'Use the real business location from CLIENT FILE as BUSINESS_ADDRESS. A registered agent, PO box, or virtual office is not accepted.',
          fix: (ctx, payload) => ({
            parties: patchClientOrg(payload, ctx, (org, source) => ({
              ...org,
              addresses: source.addresses,
            })),
          }),
        },
      ],
    },
    emits: [
      {
        eventType: 'CLIENT_ONBOARDING',
        delayMs: 22000,
        summary: 'The ownership check found a possible undeclared owner.',
        severity: 'WARNING',
      },
    ],
    attack: {
      id: 'atk-indirect-ownership',
      name: 'HIDDEN OWNER',
      owaspCategory: 'Identification & Authentication Failures',
      owaspCode: 'A07:2021',
      type: 'BUSINESS',
      description:
        'The application lists a holding company but not the person who owns it.',
      narrative: `THREAT DETECTED
━━━━━━━━━━━━━━━

WHAT HAPPENED
Fairy Tale Book Shop lists Neverland Holdings LLC as a
60% owner. The ownership record stops at that company.

Public records show that J. Hook owns Neverland Holdings.
J. Hook has a 60% indirect interest in the client.

WHY IT MATTERS
An ownership check must end with a person, not a company.
Without J. Hook, screening cannot check the real owner.

STOP IT
Add J. Hook as a BENEFICIAL_OWNER under Neverland
Holdings. Mark natureOfOwnership as "Indirect".`,
      attackPayload: {
        parentPartyId: '{{clientId}}',
        parties: [
          {
            partyType: 'ORGANIZATION',
            roles: ['INTERMEDIARY_OWNER'],
            organizationDetails: {
              organizationName: 'Neverland Holdings LLC',
              organizationType: 'LIMITED_LIABILITY_COMPANY',
              countryOfFormation: 'US',
              natureOfOwnership: 'Direct',
            },
            note: 'Not a natural person — screening terminates here',
          },
        ],
      },
      defenseAction: {
        id: 'def-1-action',
        label: 'Add the person behind the holding company',
        method: 'POST',
        endpoint: '/v1/parties',
        expectedPayload: {
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { natureOfOwnership: 'Indirect' },
        },
        starterPayload: {
          partyType: 'INDIVIDUAL',
          // The intermediary's party id, so the chain reconnects.
          parentPartyId: 'pty-neverland-holdings',
          roles: ['__FILL_ME__'],
          individualDetails: {
            firstName: 'J',
            lastName: 'Hook',
            birthDate: '1953-11-02',
            countryOfResidence: 'US',
            jobTitle: 'Managing Member',
            natureOfOwnership: '__FILL_ME__',
            individualIds: [{ idType: 'SSN', value: '300060006', issuer: 'US' }],
          },
        },
        gradedFields: ['roles', 'individualDetails', 'parentPartyId'],
        successMessage:
          'J. Hook is now listed as the indirect owner. Screening can check the full ownership chain.',
        failureMessage:
          'The ownership record still stops at a company. Set roles to BENEFICIAL_OWNER and individualDetails.natureOfOwnership to "Indirect".',
        points: 150,
        docHint: 'createClient',
        hints: {
          clear: 'The role and ownership type are correct. Send the request.',
          faults: [
            {
              id: 'r1d-roles',
              detect: (p) => !arr(p, 'roles').includes('BENEFICIAL_OWNER'),
              nudge: 'The roles field does not say how J. Hook is connected to the business.',
              explain:
                'Set roles to BENEFICIAL_OWNER because J. Hook is the person who ultimately owns the business.',
              fix: () => ({ roles: ['BENEFICIAL_OWNER'] }),
            },
            {
              id: 'r1d-nature',
              detect: (p) => str(p, 'individualDetails.natureOfOwnership') !== 'Indirect',
              nudge:
                'J. Hook owns the client through the holding company, not directly.',
              explain:
                'Set individualDetails.natureOfOwnership to "Indirect" because the ownership passes through Neverland Holdings LLC.',
              fix: (_ctx, payload) => ({
                individualDetails: {
                  ...(typeof payload.individualDetails === 'object' && payload.individualDetails !== null
                    ? payload.individualDetails
                    : {}),
                  natureOfOwnership: 'Indirect',
                },
              }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-1a',
          label: 'Add J. Hook as the indirect beneficial owner',
          description:
            'Connect J. Hook to Neverland Holdings with parentPartyId so screening reaches the real owner.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-1b',
          label: 'Accept the holding company as the final owner',
          description:
            'This leaves the person behind the company unchecked.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-1c',
          label: 'Ask for ownership documents',
          description:
            'This may help an investigation, but it does not add the missing owner to the record.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-1d',
          label: 'Reject the client now',
          description:
            'This avoids the risk but rejects the client before collecting the missing information.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },

  // ── Round 2: Account Setup ──────────────────────────────────────────────
  {
    id: 2,
    title: 'FLOW OF FUNDS',
    subtitle: 'Open an account for the client',
    briefing: `MISSION 2
  ━━━━━━━━━

  GOAL
  Open an account for the client.

  KEY RULES
  - The request has clientId, label, and category.
  - Use category LIMITED_DDA for this account.
  - Use the 10-digit clientId from Mission 1.
  - Set label to "MAIN".
  - Do not send accountType or currency.

  LIMITED_DDA holds the client's money. The platform can
  move money in and out, but outside parties cannot pay
  directly into it.

  YOUR TASK
  Fix the request and send it.`,
    apiEndpoint: '/v2/accounts',
    apiMethod: 'POST',
    apiDocHint: 'createAccount',
    requiredFields: ['category', 'clientId (for limited accounts)', 'label'],
    buildTimeLimit: 90,
    hints: {
      clear: 'category, label, and clientId are correct. Send the request.',
      faults: [
        {
          id: 'r2-category',
          detect: (p) => !CREATABLE_ACCOUNT_CATEGORIES.includes(String(p.category) as AccountCategory),
          nudge: 'The request uses the wrong field for the account category.',
          explain:
            "Use 'category', not 'accountType'. Set it to LIMITED_DDA for this client account.",
          fix: () => ({ category: 'LIMITED_DDA', accountType: HINT_REMOVE }),
        },
        {
          id: 'r2-currency',
          detect: (p) => 'currency' in p,
          nudge: 'The request includes a field this endpoint does not accept.',
          explain:
            "Remove 'currency'. This endpoint does not accept it, and these accounts use USD.",
          fix: () => ({ currency: HINT_REMOVE }),
        },
        {
          id: 'r2-label',
          detect: (p) => !/^[A-Z]+$/.test(String(p.label ?? '')),
          nudge: 'The account needs a label.',
          explain: 'Set label to "MAIN". Labels use uppercase letters only.',
          fix: () => ({ label: 'MAIN' }),
        },
        {
          id: 'r2-client',
          detect: (p) => !/^\d{10}$/.test(String(p.clientId ?? '')),
          nudge: 'The account needs a valid clientId.',
          explain:
            'Use the 10-digit clientId returned in Mission 1.',
          fix: (ctx) => ({ clientId: ctx.clientId ?? '1000010400' }),
        },
      ],
    },
    emits: [
      {
        eventType: 'ACCOUNT_CREATED',
        delayMs: 15000,
        summary: 'Account opened. Its payment routing number is not active for outside deposits.',
        severity: 'INFO',
      },
    ],
    attack: {
      id: 'atk-chargeback-drain',
      name: 'ACCOUNT DRAIN',
      owaspCategory: 'Unrestricted Resource Consumption',
      owaspCode: 'API4:2023',
      type: 'BUSINESS',
      description:
        'Returns have pushed the account below zero while payouts continue to leave it.',
      narrative: `THREAT DETECTED
━━━━━━━━━━━━━━━

WHAT HAPPENED
Account: {{accountId}}
Booked balance:    12,400.00 USD
Available balance: -8,150.00 USD

In the last 20 minutes:
- 41 ACH returns removed 18,220.00
- 3 payouts removed 2,330.00
- 1 payout for 4,000.00 is still waiting

WHY IT MATTERS
Payments use the available balance, which is already
below zero. If the waiting payout leaves, the platform
must cover more of the loss.

STOP IT
Block debits on this account. Keep credits open so new
money can restore the balance.`,
      attackPayload: {
        accountId: '{{accountId}}',
        balances: { booked: 12400.0, available: -8150.0, expected: -8150.0 },
        pendingDebits: [{ transactionReferenceId: 'payout_9931', amount: 4000.0, type: 'ACH' }],
        returnsLast20Min: 41,
      },
      defenseAction: {
        id: 'def-2-action',
        label: 'Restrict debits on the account',
        method: 'POST',
        endpoint: '/v2/accounts/{{accountId}}/restrictions',
        expectedPayload: {
          restrictionType: 'DEBITS',
        },
        starterPayload: {
          restrictionType: '__FILL_ME__',
        },
        gradedFields: ['restrictionType'],
        successMessage:
          'Debits are blocked. The waiting payout cannot leave, and incoming money can still restore the balance.',
        failureMessage:
          'Money can still leave the account. Set restrictionType to DEBITS to block outgoing money only.',
        points: 150,
        docHint: 'accountRestrictions',
        hints: {
          clear: 'restrictionType is DEBITS. Send the request.',
          faults: [
            {
              id: 'r2d-restriction',
              detect: (p) => p.restrictionType !== 'DEBITS',
              nudge:
                'Block money from leaving, but keep incoming money open.',
              explain:
                'Set restrictionType to DEBITS. DEBIT_CREDIT would also block the incoming money needed to restore the balance.',
              fix: () => ({ restrictionType: 'DEBITS' }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-2a',
          label: 'Block debits on this account',
          description:
            'Outgoing money stops while incoming money can restore the balance.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-2b',
          label: 'Block both debits and credits',
          description:
            'This stops the drain, but it also blocks money that could restore the balance.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-2c',
          label: 'Turn off API access for the platform',
          description:
            'This stops every client just to contain one account.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-2d',
          label: 'Let the waiting payout leave',
          description:
            'The platform must cover an even larger shortfall.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },

  // ── Round 3: Link External Bank ─────────────────────────────────────────
  {
    id: 3,
    title: 'WHOSE ACCOUNT IS THIS?',
    subtitle: 'Connect the client’s bank account',
    briefing: `MISSION 3
━━━━━━━━━

GOAL
Connect the client's external bank account.

KEY RULES
- Use LINKED_ACCOUNT for the client's own account.
- LINKED_ACCOUNT checks that the client owns the account.
- RECIPIENT is for a third-party payee and skips that check.
- A business uses partyDetails.businessName, not name.

BANK DETAILS
Name: Fairy Tale Book Shop
Type: CHECKING
Routing number: 122199983 for ACH and WIRE
Account number: 93993289375

YOUR TASK
Fix the request and send it.`,
    apiEndpoint: '/v1/recipients',
    apiMethod: 'POST',
    apiDocHint: 'createRecipient',
    requiredFields: ['type', 'clientId', 'partyDetails', 'account'],
    buildTimeLimit: 90,
    hints: {
      clear: 'The account type, clientId, and business name are correct. Send the request.',
      faults: [
        {
          id: 'r3-type',
          detect: (p) => p.type !== 'LINKED_ACCOUNT',
          nudge:
            'The request does not say what kind of external account this is.',
          explain:
            'Set type to LINKED_ACCOUNT because this is the client\u2019s own account. This type checks ownership.',
          fix: () => ({ type: 'LINKED_ACCOUNT' }),
        },
        {
          id: 'r3-client',
          detect: (p) => !/^\d{10}$/.test(String(p.clientId ?? '')),
          nudge: 'The request needs to identify the client who owns this account.',
          explain: 'Use the 10-digit clientId from Mission 1.',
          fix: (ctx) => ({ clientId: ctx.clientId ?? '1000010400' }),
        },
        {
          id: 'r3-name',
          detect: (p) => at(p, 'partyDetails.name') !== undefined,
          nudge: 'partyDetails uses the wrong field for the account owner’s name.',
          explain:
            'A business uses partyDetails.businessName. A person uses firstName and lastName. There is no name field.',
          fix: (_ctx, payload) => {
            const details = at(payload, 'partyDetails');
            const record = typeof details === 'object' && details !== null ? { ...(details as Record<string, unknown>) } : {};
            const name = typeof record.name === 'string' ? record.name : '';
            delete record.name;
            if (record.type === 'INDIVIDUAL') {
              const [first, ...rest] = name.split(' ');
              record.firstName = record.firstName ?? first;
              record.lastName = record.lastName ?? rest.join(' ');
            } else {
              record.businessName = record.businessName ?? name;
            }
            return { partyDetails: record };
          },
        },
      ],
    },
    emits: [
      {
        eventType: 'RECIPIENT_ACCOUNT_VALIDATION',
        delayMs: 18000,
        summary: 'Ownership check passed. The linked account is active and ready for payments.',
        severity: 'INFO',
      },
    ],
    attack: {
      id: 'atk-avs-bypass',
      name: 'OWNERSHIP CHECK BYPASSED',
      owaspCategory: 'Broken Function Level Authorization',
      owaspCode: 'API5:2023',
      type: 'BUSINESS',
      description:
        'An attacker registers their bank account as a third-party payee, which skips the ownership check.',
      narrative: `THREAT DETECTED
━━━━━━━━━━━━━━━

WHAT HAPPENED
A new external account was registered as RECIPIENT.
The name says Fairy Tale Book Shop, but the account is
listed as belonging to a person.

Ownership check: NOT_PERFORMED

WHY IT MATTERS
RECIPIENT is for third-party payees, so it does not check
who owns the account. An attacker can use that type to add
their own account under the client's name.

STOP IT
Register the account as LINKED_ACCOUNT. That type checks
the account owner against the client.`,
      attackPayload: {
        type: 'RECIPIENT',
        partyDetails: { type: 'INDIVIDUAL', firstName: 'Fairy Tale', lastName: 'Book Shop' },
        account: {
          type: 'CHECKING',
          number: '2847561038842',
          countryCode: 'US',
          routingInformation: [
            { routingCodeType: 'USABA', routingNumber: '071000013', transactionType: 'ACH' },
          ],
        },
        accountValidationResponse: [{ code: 'AVS_OWNERSHIP', result: 'NOT_PERFORMED' }],
      },
      defenseAction: {
        id: 'def-3-action',
        label: 'Register the account with an ownership check',
        method: 'POST',
        endpoint: '/v1/recipients',
        expectedPayload: {
          type: 'LINKED_ACCOUNT',
        },
        starterPayload: {
          type: '__FILL_ME__',
          clientId: '{{clientId}}',
          partyDetails: { type: 'ORGANIZATION', businessName: 'Fairy Tale Book Shop' },
          account: {
            type: 'CHECKING',
            number: '93993289375',
            countryCode: 'US',
            routingInformation: [
              { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'ACH' },
            ],
          },
        },
        gradedFields: ['type', 'clientId'],
        successMessage:
          'The account is registered as LINKED_ACCOUNT. The ownership check catches the name mismatch and blocks payments.',
        failureMessage:
          'The account still skips ownership checks. Set type to LINKED_ACCOUNT and include clientId.',
        points: 150,
        docHint: 'createRecipient',
        hints: {
          clear: 'type and clientId are correct. Send the request.',
          faults: [
            {
              id: 'r3d-type',
              detect: (p) => p.type !== 'LINKED_ACCOUNT',
              nudge:
                'Choose the account type that checks ownership.',
              explain:
                'Set type to LINKED_ACCOUNT. RECIPIENT and SETTLEMENT_ACCOUNT do not check ownership.',
              fix: () => ({ type: 'LINKED_ACCOUNT' }),
            },
            {
              id: 'r3d-client',
              detect: (p) => !/^\d{10}$/.test(String(p.clientId ?? '')),
              nudge: 'The ownership check needs to know which client to compare with.',
              explain:
                'Include clientId so the API can compare the account owner with the client.',
              fix: (ctx) => ({ clientId: ctx.clientId ?? '1000010400' }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-3a',
          label: 'Register it as LINKED_ACCOUNT',
          description:
            'This checks ownership. The name mismatch fails, so the account cannot receive payments.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-3b',
          label: 'Require another sign-in check before adding a payee',
          description:
            'This protects access, but it does not fix the missing ownership check.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-3c',
          label: 'Block this routing number',
          description:
            'This stops one bank, but the same attack can use another account.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-3d',
          label: 'Allow it because this account cannot pay it',
          description:
            'A LIMITED_DDA_PAYMENTS account could still send money to it.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },

  // ── Round 4: Process Payments ───────────────────────────────────────────
  {
    id: 4,
    title: 'MOVE MONEY',
    subtitle: 'Send money to the linked account',
    briefing: `MISSION 4
━━━━━━━━━

GOAL
Send 5,000.00 USD to the linked account.

KEY RULES
- amount is text: "5000.00", not 5000.
- type is the payment method. Use ACH.
- For ACH, set localInstrumentCode to CCD.
- Put the source account in
  debtor.account.registeredAccount.id.
- Put the recipientId in creditor.id.
- transactionReferenceId allows letters, numbers, and _.
  It does not allow hyphens.
- Send an Idempotency-Key. It prevents a retry from
  creating a second payment.

YOUR TASK
Fix the request and send it.`,
    apiEndpoint: '/v3/transactions',
    apiMethod: 'POST',
    apiDocHint: 'createTransaction',
    requiredFields: [
      'amount (string)',
      'currency',
      'debtor.account.registeredAccount.id',
      'creditor.id',
      'transactionReferenceId',
      'type',
    ],
    buildTimeLimit: 120,
    hints: {
      clear: 'The payment method, amount, reference, and account IDs are correct. Send the request.',
      faults: [
        {
          id: 'r4-rail',
          detect: (p) => !PAYMENT_RAILS.includes(String(p.type) as PaymentRail),
          nudge: 'type should name the payment method, not the action.',
          explain:
            'Set type to ACH and localInstrumentCode to CCD for this business payment.',
          fix: () => ({ type: 'ACH', localInstrumentCode: 'CCD' }),
        },
        {
          id: 'r4-amount',
          detect: (p) => typeof p.amount !== 'string',
          nudge: 'The amount has the right value but the wrong JSON type.',
          explain:
            'amount must be text: "5000.00", not the number 5000.',
          fix: (_ctx, payload) => ({
            amount: typeof payload.amount === 'number' ? payload.amount.toFixed(2) : '5000.00',
          }),
        },
        {
          id: 'r4-reference',
          detect: (p) => !/^[_0-9A-Za-z]+$/.test(String(p.transactionReferenceId ?? '')),
          nudge: 'transactionReferenceId contains a character the API does not allow.',
          explain:
            'Use only letters, numbers, and underscores. Change "inv-pay-001" to "inv_pay_001".',
          fix: (_ctx, payload) => ({
            transactionReferenceId: String(payload.transactionReferenceId ?? 'inv_pay_001').replace(
              /[^_0-9A-Za-z]/g,
              '_'
            ),
          }),
        },
        {
          id: 'r4-debtor',
          detect: (p) => isMissing(p, 'debtor.account.registeredAccount.id'),
          nudge: 'The source account is in the wrong place.',
          explain:
            'Put it in debtor.account.registeredAccount.id and set debtor.account.type to REGISTERED_ACCOUNT.',
          fix: (ctx) => ({
            debtor: {
              account: {
                type: 'REGISTERED_ACCOUNT',
                registeredAccount: { id: ctx.accountId ?? 'acc-xxxxx' },
              },
            },
          }),
        },
        {
          id: 'r4-creditor',
          detect: (p) => isMissing(p, 'creditor.id'),
          nudge: 'The recipient ID is in the wrong field.',
          explain: 'Use creditor.id for the recipientId returned in Mission 3.',
          fix: (ctx) => ({ creditor: { id: ctx.recipientId ?? 'rcp-xxxxx' } }),
        },
      ],
    },
    emits: [
      {
        eventType: 'TRANSACTION_COMPLETED',
        delayMs: 20000,
        summary: 'Payout settled. Funds delivered to the linked account.',
        severity: 'INFO',
      },
    ],
    attack: {
      id: 'atk-idempotency-race',
      name: 'DUPLICATE PAYMENT ATTEMPT',
      owaspCategory: 'Unrestricted Access to Sensitive Business Flows',
      owaspCode: 'API6:2023',
      type: 'BUSINESS',
      description:
        'Three requests use the same retry key, and one changes the payment amount.',
      narrative: `THREAT DETECTED
  ━━━━━━━━━━━━━━━

  WHAT HAPPENED
  Three payment requests arrived with Idempotency-Key
  idem_9f2a.

  1. 5,000.00 was accepted.
  2. The same 5,000.00 request was blocked as a safe retry.
    Error 10107.
  3. A changed request for 50,000.00 was blocked.
    Error 10106.

  Fraud screening placed the original 5,000.00 payment on
  hold. It will not move until you decide what to do.

  WHY IT MATTERS
  The retry key blocked the duplicate requests, but the
  unusual activity still makes the original payment unsafe.

  STOP IT
  Reject the held payment. Investigate the requests, then
  send a clean payment with a new Idempotency-Key.`,
      attackPayload: {
        burst: [
          { idempotencyKey: 'idem_9f2a', transactionReferenceId: 'payout_0091', amount: '5000.00', result: '201 PENDING' },
          { idempotencyKey: 'idem_9f2a', transactionReferenceId: 'payout_0091', amount: '5000.00', result: '409 [10107] safe replay' },
          { idempotencyKey: 'idem_9f2a', transactionReferenceId: 'payout_0091', amount: '50000.00', result: '409 [10106] mutated payload' },
        ],
        hold: { id: 'hold_88213', amount: '5000.00', reasonCode: '11672', reason: 'Suspected fraud' },
      },
      defenseAction: {
        id: 'def-4-action',
        label: 'Reject the held payment',
        method: 'POST',
        endpoint: '/v1/holds/hold_88213/decision',
        expectedPayload: {
          action: 'REJECT',
          rejectReason: 'FRAUD',
          fraud: { type: 'OTHER' },
        },
        starterPayload: {
          action: '__FILL_ME__',
          rejectReason: 'FRAUD',
          fraud: {
            type: 'OTHER',
            additionalInformation: 'Mutated replay detected on idempotency key idem_9f2a',
          },
        },
        gradedFields: ['action', 'rejectReason', 'fraud'],
        successMessage:
          'The held payment is rejected. No money leaves while the duplicate requests are investigated.',
        failureMessage:
          'The unsafe payment could still leave. Set action to REJECT, investigate, and use a new key for any later payment.',
        points: 150,
        docHint: 'createTransaction',
        hints: {
          clear: 'action is REJECT. Send the request.',
          faults: [
            {
              id: 'r4d-decision',
              detect: (p) => p.action !== 'REJECT',
              nudge:
                'Do not release a payment while the duplicate requests are unexplained.',
              explain:
                'Set action to REJECT. APPROVE would send 5,000.00 while the activity is still under investigation.',
              fix: () => ({ action: 'REJECT' }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-4a',
          label: 'Reject the payment and use a new key later',
          description:
            'No money leaves until the requests are understood and a clean payment is ready.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-4b',
          label: 'Release the payment because 10106 blocked the duplicate',
          description:
            'This ignores the separate fraud warning on the original payment.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-4c',
          label: 'Slow the caller and leave the payment on hold',
          description:
            'This slows new requests but leaves the current payment unresolved.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-4d',
          label: 'Stop using Idempotency-Key',
          description:
            'Without the key, every retry can create another payment.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },

  // ── Round 5: Monitor & Scale ────────────────────────────────────────────
  {
    id: 5,
    title: 'SEE EVERYTHING',
    subtitle: 'Receive payment status updates',
    briefing: `MISSION 5
━━━━━━━━━

GOAL
Receive updates when a payment succeeds or fails.

A webhook sends an update to your callbackURL after an
event happens. A 201 response only accepts the request;
the webhook gives the final result.

KEY RULES
- subscriptions is a list of objects, such as
  [{ "eventType": "TRANSACTION_COMPLETED" }].
- The field is callbackURL with capital URL.
- Event names are singular: TRANSACTION_COMPLETED, not
  TRANSACTIONS_COMPLETED.
- securityPreferences tells the API how to authenticate
  with your callback endpoint.
- The response includes a signingKey. Use it to verify
  that each update is genuine.

YOUR TASK
Fix the subscription request and send it.`,
    apiEndpoint: '/v1/webhooks',
    apiMethod: 'POST',
    apiDocHint: 'createWebhook',
    requiredFields: ['subscriptions[].eventType', 'callbackURL'],
    buildTimeLimit: 90,
    hints: {
      clear: 'subscriptions, callbackURL, and the event names are correct. Send the request.',
      faults: [
        {
          id: 'r5-secret',
          detect: (p) => 'secret' in p,
          nudge: 'The request uses a shared secret field that this API does not accept.',
          explain:
            'Remove "secret". Use securityPreferences for callback authentication. The response returns a signingKey for verifying updates.',
          fix: () => ({
            secret: HINT_REMOVE,
            securityPreferences: {
              authorizationDetails: {
                clientId: 'ep-callback-client',
                clientSecret: 'rotate-me',
                tokenEndpoint: 'https://your-platform.com/oauth/token',
              },
            },
          }),
        },
        {
          id: 'r5-subscriptions',
          detect: (p) => !Array.isArray(p.subscriptions) || p.subscriptions.length === 0,
          nudge: 'The events are in the wrong field and format.',
          explain:
            'Use subscriptions: [{ "eventType": "TRANSACTION_COMPLETED" }]. Do not use an eventTypes list of strings.',
          fix: (_ctx, payload) => {
            const legacy = arr(payload, 'eventTypes').map(String);
            const events = legacy.length
              ? legacy.map((e) => e.replace(/^TRANSACTIONS_/, 'TRANSACTION_'))
              : ['TRANSACTION_COMPLETED', 'TRANSACTION_FAILED'];
            return {
              eventTypes: HINT_REMOVE,
              subscriptions: [...new Set(events)].map((eventType) => ({ eventType })),
            };
          },
        },
        {
          id: 'r5-callback',
          detect: (p) => typeof p.callbackURL !== 'string',
          nudge: 'The callback field has the wrong capital letters.',
          explain: 'Use callbackURL with capital URL. callbackUrl is not accepted.',
          fix: (_ctx, payload) => ({
            callbackUrl: HINT_REMOVE,
            callbackURL: str(payload, 'callbackUrl') ?? 'https://your-platform.com/webhooks/ep',
          }),
        },
        {
          id: 'r5-event-names',
          detect: (p) =>
            [...arr(p, 'eventTypes').map(String), ...arr(p, 'subscriptions').map((s) => String(at(s, 'eventType')))].some(
              (e) => !WEBHOOK_EVENT_TYPES.includes(e as WebhookEventType)
            ),
          nudge: 'At least one event name is not valid.',
          explain:
            'Use singular names such as TRANSACTION_COMPLETED and TRANSACTION_FAILED. Use RECIPIENT_ACCOUNT_VALIDATION for ownership-check updates.',
          fix: (_ctx, payload) => {
            const current = [
              ...arr(payload, 'eventTypes').map(String),
              ...arr(payload, 'subscriptions').map((s) => String(at(s, 'eventType'))),
            ].map((e) =>
              e.replace(/^TRANSACTIONS_/, 'TRANSACTION_').replace(/^RECIPIENT_READY_FOR_VALIDATION.*/, 'RECIPIENT_ACCOUNT_VALIDATION')
            );
            const valid = [...new Set(current)].filter((e) =>
              WEBHOOK_EVENT_TYPES.includes(e as WebhookEventType)
            );
            return {
              eventTypes: HINT_REMOVE,
              subscriptions: (valid.length ? valid : ['TRANSACTION_COMPLETED', 'TRANSACTION_FAILED']).map(
                (eventType) => ({ eventType })
              ),
            };
          },
        },
      ],
    },
    attack: {
      id: 'atk-forged-callback',
      name: 'FAKE AND REPEATED UPDATES',
      owaspCategory: 'Security Logging & Monitoring Failures',
      owaspCode: 'A09:2021',
      type: 'TECHNICAL',
      description:
        'The callback endpoint receives one fake update and the same real update five times.',
      narrative: `THREAT DETECTED
━━━━━━━━━━━━━━━

WHAT HAPPENED
Update A is fake:
- Claims a payment of 999,999.99 completed
- Has no authentication
- Fails signature verification

Update B is real but repeated:
- eventId: evt_1755500000_a91f
- Passes signature verification
- Arrived 5 times in 90 seconds

WHY IT MATTERS
An open callback endpoint can accept a fake payment.
A repeated real update can also add the same money more
than once if eventId is not checked.

STOP IT
Require authentication, verify the signingKey, and process
each eventId only once. Confirm payment status with
GET /v3/transactions before changing a balance.`,
      attackPayload: {
        forgedEvent: {
          eventType: 'TRANSACTION_COMPLETED',
          resourceId: 'txn_forged_0001',
          signatureValid: false,
          amount: '999999.99',
        },
        replayedEvent: {
          eventType: 'TRANSACTION_COMPLETED',
          eventId: 'evt_1755500000_a91f',
          signatureValid: true,
          timesReceived: 5,
        },
        subscription: { securityPreferences: null },
      },
      defenseAction: {
        id: 'def-5-action',
        label: 'Require authenticated and signed updates',
        method: 'POST',
        endpoint: '/v1/webhooks',
        expectedPayload: {
          securityPreferences: {
            authorizationDetails: { tokenEndpoint: 'https://your-platform.com/oauth/token' },
          },
        },
        starterPayload: {
          subscriptions: [
            { eventType: 'TRANSACTION_COMPLETED' },
            { eventType: 'TRANSACTION_FAILED' },
          ],
          callbackURL: 'https://your-platform.com/webhooks/ep',
          securityPreferences: {
            authorizationDetails: {
              clientId: 'ep-callback-client',
              clientSecret: 'rotate-me',
              tokenEndpoint: '__FILL_ME__',
            },
          },
        },
        gradedFields: ['securityPreferences', 'callbackURL'],
        successMessage:
          'Callback authentication is enabled and a signingKey is issued. Fake updates can be rejected, and repeated eventIds can be ignored.',
        failureMessage:
          'The callback endpoint still accepts unauthenticated requests. Add a tokenEndpoint under securityPreferences.authorizationDetails.',
        points: 150,
        docHint: 'createWebhook',
        hints: {
          clear: 'tokenEndpoint is filled in. Send the request.',
          faults: [
            {
              id: 'r5d-token',
              detect: (p) => isMissing(p, 'securityPreferences.authorizationDetails.tokenEndpoint'),
              nudge:
                'The request still needs the URL used to get an authentication token.',
              explain:
                'Set tokenEndpoint to https://your-platform.com/oauth/token. This enables callback authentication and returns a signingKey.',
              fix: () => ({
                securityPreferences: {
                  authorizationDetails: {
                    clientId: 'ep-callback-client',
                    clientSecret: 'rotate-me',
                    tokenEndpoint: 'https://your-platform.com/oauth/token',
                  },
                },
              }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-5a',
          label: 'Authenticate, verify, and ignore repeated eventIds',
          description:
            'Reject fake updates, process each real update once, and confirm the payment before changing a balance.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-5b',
          label: 'Accept updates only from known IP addresses',
          description:
            'This may block the fake update, but it does not stop a repeated real update.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-5c',
          label: 'Add a shared secret to the subscription',
          description:
            'This API does not accept a secret field. Use securityPreferences and the returned signingKey.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-5d',
          label: 'Log every update and review it later',
          description:
            'Logs help an investigation, but they do not stop a fake or repeated update.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },

  // ── Round 6: Documents & Closure ────────────────────────────────────────
  {
    id: 6,
    title: 'PAPER TRAIL',
    subtitle: 'Create a record before closing the account',
    briefing: `MISSION 6
━━━━━━━━━

GOAL
Create an account confirmation letter for the client.

KEY RULES
- Set type to ACCOUNT_CONFIRMATION_LETTER.
- Put the account ID in parameters.accountId.
- The request returns 202 Accepted with a documentId.
  This means the work has started, not finished.
- Wait for DOCUMENT_GENERATED, then download the PDF with
  GET /v1/documents/{documentId}.
- Documents are available only while the account is OPEN
  or PENDING_CLOSE.

YOUR TASK
Fix the request and send it before the account closes.`,
    apiEndpoint: '/v1/documents',
    apiMethod: 'POST',
    apiDocHint: 'generateDocument',
    requiredFields: ['type', 'parameters.accountId'],
    buildTimeLimit: 90,
    hints: {
      clear: 'type and parameters.accountId are correct. Send the request.',
      faults: [
        {
          id: 'r6-type',
          detect: (p) => p.type !== 'ACCOUNT_CONFIRMATION_LETTER',
          nudge: 'The document type is in the wrong field.',
          explain:
            "Use 'type', not 'documentType'. Set it to ACCOUNT_CONFIRMATION_LETTER.",
          fix: () => ({ type: 'ACCOUNT_CONFIRMATION_LETTER', documentType: HINT_REMOVE }),
        },
        {
          id: 'r6-parameters',
          detect: (p) => isMissing(p, 'parameters.accountId'),
          nudge: 'The account ID is in the wrong place.',
          explain:
            'Put accountId inside parameters. Use the account shown in FLOW OF FUNDS.',
          fix: (ctx, payload) => ({
            parameters: { accountId: str(payload, 'accountId') ?? ctx.accountId ?? 'acc-xxxxx' },
            accountId: HINT_REMOVE,
          }),
        },
      ],
    },
    emits: [
      {
        eventType: 'DOCUMENT_GENERATED',
        delayMs: 12000,
        summary: 'The confirmation letter is ready. Download it from GET /v1/documents/{id}.',
        severity: 'INFO',
      },
    ],
    attack: {
      id: 'atk-premature-closure',
      name: 'ACCOUNT CLOSED TOO SOON',
      owaspCategory: 'Improper Inventory Management',
      owaspCode: 'API9:2023',
      type: 'BUSINESS',
      description:
        'An automatic job tries to close the account before payments finish and before the letter is ready.',
      narrative: `THREAT DETECTED
━━━━━━━━━━━━━━━

WHAT HAPPENED
An automatic job queued account {{accountId}} for closure.
The request has no closureReason.

The account still has:
- One ACH payout of 4,120.00 waiting to settle
- Two ACH returns totaling 1,900.00 still expected
- No completed account confirmation letter

WHY IT MATTERS
Closure is not immediate. The account first moves to
PENDING_CLOSE so remaining payments can finish. A closed
account cannot receive those payments or create documents.

STOP IT
Finish the letter first. Then request closure with a valid
reason and let the account empty before it closes.`,
      attackPayload: {
        job: 'nightly-offboarding',
        request: { state: 'CLOSED' },
        inFlight: [
          { transactionReferenceId: 'payout_7781', amount: '4120.00', status: 'PENDING' },
          { expected: 'ACH returns', amount: '1900.00', settlesIn: 'T+2' },
        ],
        documentsGenerated: 0,
      },
      defenseAction: {
        id: 'def-6-action',
        label: 'Request closure after the letter is ready',
        method: 'PATCH',
        endpoint: '/v2/accounts/{{accountId}}',
        expectedPayload: {
          state: 'CLOSED',
          closureReason: 'ELECTIVE',
        },
        starterPayload: {
          state: '__FILL_ME__',
          closureReason: '__FILL_ME__',
        },
        gradedFields: ['state', 'closureReason'],
        successMessage:
          'The account moves to PENDING_CLOSE. Remaining payments can finish before it closes.',
        failureMessage:
          'The closure request needs state CLOSED and a valid closureReason. The account will move through PENDING_CLOSE first.',
        points: 150,
        docHint: 'closeAccount',
        hints: {
          clear: 'state and closureReason are correct. Send the request.',
          faults: [
            {
              id: 'r6d-state',
              detect: (p) => p.state !== 'CLOSED',
              nudge: 'The request does not name the final account state.',
              explain:
                'Set state to CLOSED. The API uses PENDING_CLOSE while remaining payments finish.',
              fix: () => ({ state: 'CLOSED' }),
            },
            {
              id: 'r6d-reason',
              detect: (p) => !ACCOUNT_CLOSURE_REASONS.includes(String(p.closureReason) as AccountClosureReason),
              nudge: 'The closure request needs a reason from the allowed list.',
              explain:
                'Set closureReason to ELECTIVE because the client chose to leave.',
              fix: () => ({ closureReason: 'ELECTIVE' }),
            },
          ],
        },
      },
      defenseOptions: [
        {
          id: 'def-6a',
          label: 'Finish the letter, then request closure',
          description:
            'The document stays available and remaining payments can finish before the account closes.',
          isCorrect: true,
          isPartial: false,
          points: 150,
        },
        {
          id: 'def-6b',
          label: 'Close now and create the letter later',
          description:
            'Documents cannot be created after the account is closed.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
        {
          id: 'def-6c',
          label: 'Freeze the account and leave it open',
          description:
            'This protects the money but never completes the client’s account closure.',
          isCorrect: false,
          isPartial: true,
          points: 75,
        },
        {
          id: 'def-6d',
          label: 'Cancel the waiting payout and close the account',
          description:
            'The client is owed that money, and a submitted ACH payment cannot simply be recalled.',
          isCorrect: false,
          isPartial: false,
          points: -50,
        },
      ],
      defenseTimeLimit: 45,
    },
  },
];

export const TOTAL_ROUNDS = rounds.length;

export function getRound(roundId: number): RoundConfig | undefined {
  return rounds.find((r) => r.id === roundId);
}

