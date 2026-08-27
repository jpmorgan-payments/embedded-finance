// =============================================================================
// API documentation snippets shown to players during a round
// Mirrors https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments
// =============================================================================

export interface ApiDoc {
  endpoint: string;
  method: string;
  description: string;
  requiredFields: string[];
  example: string;
  docUrl: string;
  /** Surfaced after a failed attempt — the one sentence that would have prevented it. */
  docQuote: string;
}

const DOCS_ROOT = 'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments';

export const apiDocs: Record<string, ApiDoc> = {
  createClient: {
    endpoint: '/v1/clients',
    method: 'POST',
    description:
      'Create a business client profile. The body has only parties and products. Put the business details in organizationDetails for the party with role CLIENT.',
    requiredFields: [
      'parties[] (1 to 10) and products[] ("EMBEDDED_PAYMENTS")',
      'Each party: partyType (ORGANIZATION | INDIVIDUAL) and roles[]',
      'roles: CLIENT | CONTROLLER | BENEFICIAL_OWNER | INTERMEDIARY_OWNER | DIRECTOR | PRIMARY_CONTACT | AUTHORIZED_USER',
      'Exactly one party has CLIENT, with no other role',
      'organizationDetails: organizationName, organizationType, countryOfFormation',
      'organizationType: LIMITED_LIABILITY_COMPANY | C_CORPORATION | S_CORPORATION | SOLE_PROPRIETORSHIP | LIMITED_LIABILITY_PARTNERSHIP | LIMITED_PARTNERSHIP | GENERAL_PARTNERSHIP | NON_PROFIT_CORPORATION | GOVERNMENT_ENTITY | UNINCORPORATED_ASSOCIATION',
      'organizationDetails.addresses[]: BUSINESS_ADDRESS for the real business location; do not use a PO box, virtual office, or registered agent',
      'organizationDetails.yearOfFormation is text, for example "1989"',
      'organizationIds[] / individualIds[]: US EIN, SSN, and ITIN values have 9 digits',
      'individualDetails: firstName, lastName, countryOfResidence',
    ],
    example: `{
  "parties": [
    {
      "partyType": "ORGANIZATION",
      "email": "hello@fairytalebooks500.com",
      "roles": ["CLIENT"],
      "organizationDetails": {
        "organizationName": "Fairy Tale Book Shop",
        "organizationType": "LIMITED_LIABILITY_COMPANY",
        "countryOfFormation": "US",
        "dbaName": "FT Books",
        "organizationDescription": "Step into a world of stories",
        "industryCategory": "Sporting Goods, Hobby, Musical Instrument, and Book Stores",
        "industryType": "Book Retailers and News Dealers",
        "yearOfFormation": "1989",
        "addresses": [{
          "addressType": "BUSINESS_ADDRESS",
          "addressLines": ["2029 Century Park E"],
          "city": "Los Angeles", "state": "CA",
          "postalCode": "90067", "country": "US"
        }],
        "phone": {"phoneType": "BUSINESS_PHONE", "countryCode": "+1", "phoneNumber": "7606810558"},
        "organizationIds": [{"idType": "EIN", "value": "300030003", "issuer": "US"}]
      }
    },
    {
      "partyType": "INDIVIDUAL",
      "roles": ["CONTROLLER"],
      "individualDetails": {
        "firstName": "Peiter", "lastName": "Pan",
        "countryOfResidence": "US", "birthDate": "1945-01-30",
        "addresses": [{"addressType": "RESIDENTIAL_ADDRESS", ...}],
        "individualIds": [{"idType": "SSN", "value": "300040004", "issuer": "US"}]
      }
    }
  ],
  "products": ["EMBEDDED_PAYMENTS"]
}`,
    docUrl: `${DOCS_ROOT}/capabilities/onboard-a-client/how-to/create-a-client-profile`,
    docQuote:
      'Use BUSINESS_ADDRESS for the real business location. Do not use a PO box, virtual office, or registered agent address.',
  },

  createAccount: {
    endpoint: '/v2/accounts',
    method: 'POST',
    description:
      'Open an account. Use LIMITED_DDA for this client account. The request uses category, not accountType, and does not include currency.',
    requiredFields: [
      'category (LIMITED_DDA | LIMITED_DDA_PAYMENTS | SUMMARY_ACCOUNT | TRANSACTION_ACCOUNT)',
      'clientId: exactly 10 digits for LIMITED_DDA and LIMITED_DDA_PAYMENTS',
      'label: uppercase letters only, for example "MAIN"',
      'parentAccountId for TRANSACTION_ACCOUNT',
    ],
    example: `{
  "clientId": "1000010400",
  "label": "MAIN",
  "category": "LIMITED_DDA"
}

// Do not send currency. These accounts use USD.`,
    docUrl: `${DOCS_ROOT}/capabilities/accounts/account-setup/create-accounts`,
    docQuote:
      'Use category LIMITED_DDA for this client account. EMBEDDED_DDA is a retired category.',
  },

  accountRestrictions: {
    endpoint: '/v2/accounts/{id}/restrictions',
    method: 'POST',
    description:
      'Block money entering or leaving one account. Use DEBITS to stop outgoing money while incoming money remains open.',
    requiredFields: ['restrictionType (DEBITS | CREDITS | DEBIT_CREDIT | DIRECT_DEBIT)'],
    example: `{
  "restrictionType": "DEBITS"
}

// DEBITS blocks money leaving. CREDITS blocks money arriving.
// DEBIT_CREDIT blocks both.`,
    docUrl: `${DOCS_ROOT}/capabilities/accounts/manage-accounts/post-transaction-restrictions`,
    docQuote:
      'Set restrictionType to DEBITS to block outgoing money only.',
  },

  createRecipient: {
    endpoint: '/v1/recipients',
    method: 'POST',
    description:
      "Connect an external bank account. LINKED_ACCOUNT is the client's own account and checks ownership. RECIPIENT is a third-party payee and does not check ownership.",
    requiredFields: [
      'type (LINKED_ACCOUNT | RECIPIENT | SETTLEMENT_ACCOUNT)',
      'clientId for LINKED_ACCOUNT',
      'partyDetails.type and businessName (ORGANIZATION), or firstName and lastName (INDIVIDUAL)',
      'account.number (1 to 35 digits), account.type, account.countryCode',
      'account.routingInformation[]: routingCodeType USABA, 9-digit routingNumber, and transactionType',
    ],
    example: `{
  "type": "LINKED_ACCOUNT",
  "clientId": "1000010400",
  "partyDetails": {
    "type": "ORGANIZATION",
    "businessName": "Fairy Tale Book Shop"
  },
  "account": {
    "type": "CHECKING",
    "number": "93993289375",
    "countryCode": "US",
    "routingInformation": [
      { "routingCodeType": "USABA", "routingNumber": "122199983", "transactionType": "ACH" }
    ]
  }
}

// A business uses businessName. A person uses firstName and lastName.`,
    docUrl: `${DOCS_ROOT}/capabilities/external-accounts/add-linked-account`,
    docQuote:
      'LINKED_ACCOUNT checks the owner name and account details. RECIPIENT does not check ownership.',
  },

  createTransaction: {
    endpoint: '/v3/transactions',
    method: 'POST',
    description:
      'Send money. type names the payment method, such as ACH. amount is text, and the source account goes inside debtor.account.registeredAccount.',
    requiredFields: [
      'amount: text, for example "5000.00"',
      'currency: "USD"',
      'debtor.account.type: "REGISTERED_ACCOUNT", debtor.account.registeredAccount.id',
      'creditor.id: the recipientId',
      'transactionReferenceId: letters, numbers, and underscores only',
      'type (ACH | RTP | WIRE | CARD | FXACH | FXWIRE)',
      'localInstrumentCode (CCD | PPD | WEB | TEL) — ACH only',
      'Idempotency-Key header',
    ],
    example: `POST /v3/transactions
Idempotency-Key: 7f1c9d2a4b6e

{
  "transactionReferenceId": "inv_pay_001",
  "type": "ACH",
  "localInstrumentCode": "CCD",
  "amount": "5000.00",
  "currency": "USD",
  "debtor": {
    "account": {
      "type": "REGISTERED_ACCOUNT",
      "registeredAccount": { "id": "acc-xxxxx" }
    }
  },
  "creditor": { "id": "rcp-xxxxx" },
  "memo": "Weekly marketplace settlement"
}

// 201 -> { "id", "transactionReferenceId", "requestedExecutionDate" }`,
    docUrl: `${DOCS_ROOT}/capabilities/transactions/payouts/how-to/linked-account`,
    docQuote:
      'transactionReferenceId allows letters, numbers, and underscores. Hyphens are not accepted.',
  },

  createWebhook: {
    endpoint: '/v1/webhooks',
    method: 'POST',
    description:
      'Receive event updates. subscriptions is a list of objects, and the callback field is callbackURL. securityPreferences enables authentication and returns a signingKey for verification.',
    requiredFields: [
      'subscriptions[].eventType (CLIENT_ONBOARDING, ACCOUNT_CREATED, ACCOUNT_UPDATED, ACCOUNT_RESTRICTION, ACCOUNT_CLOSED, ACCOUNT_OVERDRAWN, RECIPIENT_ACCOUNT_VALIDATION, RECIPIENT_UPDATED, TRANSACTION_COMPLETED, TRANSACTION_FAILED, TRANSACTION_CHANGE_REQUESTED, DOCUMENT_GENERATED, DOCUMENT_FAILED)',
      'callbackURL: an HTTPS URL with capital URL',
      'securityPreferences.authorizationDetails: clientId, clientSecret, tokenEndpoint',
    ],
    example: `{
  "subscriptions": [
    { "eventType": "TRANSACTION_COMPLETED" },
    { "eventType": "TRANSACTION_FAILED" },
    { "eventType": "RECIPIENT_ACCOUNT_VALIDATION" }
  ],
  "callbackURL": "https://your-platform.com/webhooks/ep",
  "securityPreferences": {
    "authorizationDetails": {
      "clientId": "ep-callback-client",
      "clientSecret": "rotate-me",
      "tokenEndpoint": "https://your-platform.com/oauth/token"
    }
  }
}

// The response includes a signingKey for verifying updates.
// Event names are singular: TRANSACTION_COMPLETED.`,
    docUrl: `${DOCS_ROOT}/capabilities/notification-subscriptions/how-to/notifications`,
    docQuote:
      'Use RECIPIENT_ACCOUNT_VALIDATION for ownership-check updates. Verify each update with the returned signingKey.',
  },

  generateDocument: {
    endpoint: '/v1/documents',
    method: 'POST',
    description:
      'Create an account document. Put accountId inside parameters. The request starts the work; wait for DOCUMENT_GENERATED before downloading the PDF.',
    requiredFields: [
      'type: "ACCOUNT_CONFIRMATION_LETTER"',
      'parameters.accountId: the account must be OPEN or PENDING_CLOSE',
    ],
    example: `{
  "type": "ACCOUNT_CONFIRMATION_LETTER",
  "parameters": { "accountId": "acc-xxxxx" }
}

// 202 Accepted means work has started.
// Wait for DOCUMENT_GENERATED, then call GET /v1/documents/{documentId}.`,
    docUrl: `${DOCS_ROOT}/capabilities/accounts/manage-accounts/generate-and-download-documents`,
    docQuote:
      'Wait for DOCUMENT_GENERATED before downloading the PDF.',
  },

  closeAccount: {
    endpoint: '/v2/accounts/{id}',
    method: 'PATCH',
    description:
      'Start closing a client account. The account stays PENDING_CLOSE while remaining payments finish, then moves to CLOSED.',
    requiredFields: [
      'state: "CLOSED"',
      'closureReason (ELECTIVE | SUBJECTED_TO_FRAUD | OVERDRAFT | DORMANCY | OTHER)',
    ],
    example: `{
  "state": "CLOSED",
  "closureReason": "ELECTIVE"
}

// The account moves to PENDING_CLOSE before it reaches CLOSED.`,
    docUrl: `${DOCS_ROOT}/capabilities/accounts/account-closure/close-account`,
    docQuote:
      'Set state to CLOSED and include a closureReason. The account moves through PENDING_CLOSE first.',
  },
};
