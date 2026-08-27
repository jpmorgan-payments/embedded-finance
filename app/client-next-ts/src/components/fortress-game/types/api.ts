// =============================================================================
// J.P. Morgan Embedded Payments API Type Definitions
// Source: https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments
// API surface verified: 2026-08-18
// =============================================================================

/** J.P. Morgan routing numbers for Processing, Management and treasury DDAs. */
export const JPM_ACH_ROUTING_NUMBER = '028000024';
export const JPM_WIRE_ROUTING_NUMBER = '021000021';

// --- Client Onboarding (Digital Onboarding API) ---

/** Allowed values as revised in the Nov 2025 Digital Onboarding release (v1.0.18). */
export type OrganizationType =
  | 'LIMITED_LIABILITY_COMPANY'
  | 'LIMITED_LIABILITY_PARTNERSHIP'
  | 'LIMITED_PARTNERSHIP'
  | 'GENERAL_PARTNERSHIP'
  | 'C_CORPORATION'
  | 'S_CORPORATION'
  | 'NON_PROFIT_CORPORATION'
  | 'GOVERNMENT_ENTITY'
  | 'SOLE_PROPRIETORSHIP'
  | 'UNINCORPORATED_ASSOCIATION';

export const ORGANIZATION_TYPES: OrganizationType[] = [
  'LIMITED_LIABILITY_COMPANY',
  'LIMITED_LIABILITY_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'GENERAL_PARTNERSHIP',
  'C_CORPORATION',
  'S_CORPORATION',
  'NON_PROFIT_CORPORATION',
  'GOVERNMENT_ENTITY',
  'SOLE_PROPRIETORSHIP',
  'UNINCORPORATED_ASSOCIATION',
];

/** Withdrawn from the allowed list in Nov 2025 — now rejected with error 10104. */
export const DEPRECATED_ORGANIZATION_TYPES = ['PARTNERSHIP', 'PUBLICLY_TRADED_COMPANY'];

/**
 * PO boxes, private mail boxes, virtual offices and registered agent addresses are
 * not accepted — the address must be the principal place of business.
 */
export const DISALLOWED_ADDRESS_PATTERNS = [
  /\bp\.?\s?o\.?\s?box\b/i,
  /\bpost\s+office\s+box\b/i,
  /\bpmb\b/i,
  /\bprivate\s+mail\s?box\b/i,
  /\bvirtual\s+office\b/i,
  /\bregistered\s+agent\b/i,
];

/**
 * Screening also knows the addresses themselves, so deleting the "c/o" line is not a
 * fix. Matched against "<lines> <city> <state>".
 */
export const KNOWN_REGISTERED_AGENT_ADDRESSES = [
  /1209\s+orange\s+st.*wilmington/i,
  /251\s+little\s+falls\s+dr.*wilmington/i,
  /850\s+new\s+burton\s+rd.*dover/i,
  /108\s+west\s+13th\s+st.*wilmington/i,
];

export interface Address {
  addressType: AddressType;
  addressLines: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Only these two are accepted on an organization. */
export const ORGANIZATION_ADDRESS_TYPES = ['LEGAL_ADDRESS', 'BUSINESS_ADDRESS'];
export type AddressType =
  | 'LEGAL_ADDRESS'
  | 'MAILING_ADDRESS'
  | 'BUSINESS_ADDRESS'
  | 'RESIDENTIAL_ADDRESS';

export const ADDRESS_TYPES: AddressType[] = [
  'LEGAL_ADDRESS',
  'MAILING_ADDRESS',
  'BUSINESS_ADDRESS',
  'RESIDENTIAL_ADDRESS',
];

export interface Phone {
  /** The published examples all use BUSINESS_PHONE. */
  phoneType: string;
  countryCode: string;
  phoneNumber: string;
}

export interface OrganizationId {
  idType: 'EIN' | 'SSN' | 'ITIN' | 'BUSINESS_REGISTRATION_ID';
  value: string;
  issuer: string;
}

export interface IndividualId {
  idType: 'SSN' | 'ITIN' | 'PASSPORT' | 'DRIVERS_LICENSE';
  value: string;
  issuer: string;
}

export type PartyRole =
  | 'CLIENT'
  | 'CONTROLLER'
  | 'BENEFICIAL_OWNER'
  | 'INTERMEDIARY_OWNER'
  | 'DIRECTOR'
  | 'PRIMARY_CONTACT'
  | 'AUTHORIZED_USER';

export const PARTY_ROLES: PartyRole[] = [
  'CLIENT',
  'CONTROLLER',
  'BENEFICIAL_OWNER',
  'INTERMEDIARY_OWNER',
  'DIRECTOR',
  'PRIMARY_CONTACT',
  'AUTHORIZED_USER',
];

export const DEPRECATED_PARTY_ROLES = ['DECISION_MAKER'];

export interface OrganizationDetails {
  organizationName: string;
  organizationType: OrganizationType;
  countryOfFormation: string;
  dbaName?: string;
  organizationDescription?: string;
  industryCategory?: string;
  industryType?: string;
  naics?: string;
  /** A string in the API, not a number. */
  yearOfFormation?: string;
  significantOwnership?: boolean;
  entitiesInOwnership?: boolean;
  addresses?: Address[];
  phone?: Phone;
  organizationIds?: OrganizationId[];
  websiteAvailable?: boolean;
  website?: string;
  /** Set on INTERMEDIARY_OWNER entities in an ownership chain. */
  natureOfOwnership?: NatureOfOwnership;
}

export interface IndividualDetails {
  firstName: string;
  lastName: string;
  countryOfResidence: string;
  birthDate?: string; // YYYY-MM-DD
  addresses?: Address[];
  individualIds?: IndividualId[];
  jobTitle?: string;
  jobTitleDescription?: string;
  phone?: Phone;
  soleOwner?: boolean;
  natureOfOwnership?: NatureOfOwnership;
}

/** Mixed case in the API, unlike every other enum. */
export type NatureOfOwnership = 'Direct' | 'Indirect';

/**
 * Everything about the business lives on the party that holds the CLIENT role.
 * There is no organization data at the root of the request.
 */
export interface ClientParty {
  id?: string;
  partyType: 'ORGANIZATION' | 'INDIVIDUAL';
  roles: PartyRole[];
  externalId?: string;
  email?: string;
  /** The immediate parent in an ownership chain, used by POST /parties. */
  parentPartyId?: string;
  organizationDetails?: OrganizationDetails;
  individualDetails?: IndividualDetails;
}

export type ProductType = 'EMBEDDED_PAYMENTS' | 'MERCHANT_SERVICES';
export const PRODUCT_TYPES: ProductType[] = ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'];

export interface ClientRequest {
  parties: ClientParty[];
  products: ProductType[];
}

export type ClientStatus =
  | 'NEW'
  | 'REVIEW_IN_PROGRESS'
  | 'INFORMATION_REQUESTED'
  | 'APPROVED'
  | 'DECLINED';

/**
 * Onboarding is a state machine: the response tells you what is still owed before
 * the client can be approved and given an account.
 */
export interface OutstandingRequirements {
  attestationDocumentIds: string[];
  questionIds: string[];
  documentRequestIds: string[];
  partyIds: string[];
  partyRoles: PartyRole[];
}

export interface ClientResponse {
  id: string;
  status: ClientStatus;
  /** The party id of the CLIENT-role organization. */
  partyId: string;
  parties: (ClientParty & { id: string })[];
  outstanding: OutstandingRequirements;
  products: string[];
  createdAt: string;
}

export interface VerificationResponse {
  clientId: string;
  status: ClientStatus;
  verificationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  /** Populated when screening surfaces a hit that a human must clear. */
  findings: string[];
  initiatedAt: string;
}

export interface PartyValidationResponse {
  partyId: string;
  validationStatus: 'PENDING' | 'PASSED' | 'FAILED';
  checks: { name: string; result: 'PASS' | 'FAIL' | 'REVIEW'; description?: string }[];
}

export interface DocumentRequest {
  id: string;
  clientId: string;
  partyId?: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  description: string;
  requirements: { documentTypes: string[]; minRequired: number }[];
}

// --- Accounts ---

/**
 * Limited accounts are real J.P. Morgan bank accounts held for an onboarded client.
 * Transaction accounts are virtual sub-ledgers under a single physical DDA, used by
 * platforms that sit in the flow of funds without onboarding their counterparties.
 */
export type AccountCategory =
  | 'LIMITED_DDA'
  | 'LIMITED_DDA_PAYMENTS'
  | 'EMBEDDED_DDA'
  | 'SUMMARY_ACCOUNT'
  | 'TRANSACTION_ACCOUNT'
  | 'PROCESSING'
  | 'PROCESSING_OFFSET'
  | 'CLIENT_OFFSET'
  | 'MANAGEMENT'
  | 'DDA'
  | 'CLIENT_DDA'
  | 'PAYIN'
  | 'DEFAULT';

/** The categories a platform may create for a client. */
export const CREATABLE_ACCOUNT_CATEGORIES = [
  'LIMITED_DDA',
  'LIMITED_DDA_PAYMENTS',
  'SUMMARY_ACCOUNT',
  'TRANSACTION_ACCOUNT',
];

/** Kept only for the legacy Embedded Banking product — rejected for new accounts. */
export const LEGACY_ACCOUNT_CATEGORIES = ['EMBEDDED_DDA'];

/** Only MAIN is supported today. */
export const ACCOUNT_LABEL_PATTERN = /^[A-Z]+$/;
/** Client ids are ten digits. */
export const CLIENT_ID_PATTERN = /^\d{10}$/;

export type AccountState = 'PENDING_OPEN' | 'OPEN' | 'PENDING_CLOSE' | 'CLOSED';

export interface AccountRequest {
  clientId?: string;
  category: AccountCategory;
  label?: string;
  parentAccountId?: string;
}

export interface AccountRoutingInformation {
  /** Accounts use ABA here; recipients use USABA. */
  type: 'ABA';
  value: string;
}

export interface PaymentRoutingInformation {
  /** The Payment Routing Number (PRN). */
  accountNumber: string;
  country: string;
  routingInformation: AccountRoutingInformation[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AccountResponse {
  id: string;
  clientId?: string;
  label: string;
  category: AccountCategory;
  state: AccountState;
  paymentRoutingInformation: PaymentRoutingInformation;
  restrictions: AccountRestriction[];
  closureReason?: AccountClosureReason;
  createdAt: string;
}

export type RestrictionType = 'DEBITS' | 'CREDITS' | 'DEBIT_CREDIT' | 'DIRECT_DEBIT';

export const RESTRICTION_TYPES: RestrictionType[] = [
  'DEBITS',
  'CREDITS',
  'DEBIT_CREDIT',
  'DIRECT_DEBIT',
];

export type RestrictionReason =
  | 'CLIENT_REQUESTED'
  | 'COURT_ORDER'
  | 'FDIC'
  | 'OTHER_RESTRICTION'
  | 'PROBATE';

export interface AccountRestrictionRequest {
  restrictionType: RestrictionType;
}

export interface AccountRestriction {
  restrictionId: string;
  restrictionType: RestrictionType;
  restrictionReason: RestrictionReason;
  restrictionStatus: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
  effectiveFrom: string;
}

export type AccountClosureReason =
  | 'ELECTIVE'
  | 'SUBJECTED_TO_FRAUD'
  | 'OVERDRAFT'
  | 'DORMANCY'
  | 'OTHER';

export const ACCOUNT_CLOSURE_REASONS: AccountClosureReason[] = [
  'ELECTIVE',
  'SUBJECTED_TO_FRAUD',
  'OVERDRAFT',
  'DORMANCY',
  'OTHER',
];

/** ITAV = interim available, ITBD = interim booked. */
export interface AccountBalanceEntry {
  typeCode: 'ITAV' | 'ITBD';
  amount: number;
}

export interface AccountBalances {
  id: string;
  date: string;
  currency: string;
  balanceTypes: AccountBalanceEntry[];
  minimumBalance?: string;
  maximumBalance?: string;
}

// --- Recipients (external accounts) ---

/**
 * LINKED_ACCOUNT is the client's own external account and is put through Account
 * Validation Service ownership checks. RECIPIENT is a third-party payee and is NOT
 * subject to those ownership checks — it can only be paid from LIMITED_DDA_PAYMENTS.
 * SETTLEMENT_ACCOUNT is the platform-level route for bulk payouts and collections.
 */
export type RecipientType = 'LINKED_ACCOUNT' | 'RECIPIENT' | 'SETTLEMENT_ACCOUNT';

export interface RecipientRoutingInformation {
  routingCodeType: 'USABA';
  routingNumber: string;
  transactionType: PaymentRail;
}

export interface RecipientAccount {
  type: 'CHECKING' | 'SAVINGS';
  number: string;
  countryCode: string;
  routingInformation: RecipientRoutingInformation[];
}

export interface RecipientPartyDetails {
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  /** Individuals use firstName + lastName; organizations use businessName. */
  firstName?: string;
  lastName?: string;
  businessName?: string;
  address?: Address;
  contacts?: { contactType: 'PHONE' | 'EMAIL' | 'WEBSITE'; countryCode?: string; value: string }[];
}

export interface RecipientRequest {
  type: RecipientType;
  clientId?: string;
  /** The onboarded party that owns the external account. */
  partyId?: string;
  partyDetails: RecipientPartyDetails;
  account: RecipientAccount;
}

export interface AccountValidationResult {
  code: string;
  result: 'PASS' | 'FAIL' | 'NOT_PERFORMED';
  description?: string;
}

export interface RecipientResponse {
  id: string;
  type: RecipientType;
  clientId?: string;
  partyId?: string;
  partyDetails: RecipientPartyDetails;
  account: Omit<RecipientAccount, 'number'> & { number: string };
  status:
    | 'ACTIVE'
    | 'READY_FOR_VALIDATION'
    | 'MICRODEPOSITS_INITIATED'
    | 'VERIFIED'
    | 'REJECTED'
    | 'INACTIVE';
  accountValidationResponse: AccountValidationResult[];
  createdAt: string;
}

// --- Transactions ---

/** Payment rails, not intents. TRANSFER/PAYOUT are descriptions of direction, not values. */
export type PaymentRail = 'ACH' | 'RTP' | 'WIRE' | 'CARD' | 'FXACH' | 'FXWIRE';

export const PAYMENT_RAILS: PaymentRail[] = ['ACH', 'RTP', 'WIRE', 'CARD', 'FXACH', 'FXWIRE'];

/** Standard Entry Class codes for ACH. Defaulted on v2, mandatory on v3. */
export const LOCAL_INSTRUMENT_CODES = ['CCD', 'PPD', 'WEB', 'TEL'];

/** `transactionReferenceId` must match this pattern — hyphens are rejected. */
export const TRANSACTION_REFERENCE_PATTERN = /^[_0-9A-Za-z]+$/;
/** Only USABA routing numbers are supported, and they are nine digits. */
export const ROUTING_NUMBER_PATTERN = /^\d{9}$/;

/** The debtor is always an account you hold; the creditor is a registered recipient. */
export interface TransactionDebtor {
  account?: {
    /** ON_BEHALF_OF pays an unregistered third party without onboarding them. */
    type: 'REGISTERED_ACCOUNT' | 'ON_BEHALF_OF';
    registeredAccount?: { id: string };
  };
}

export interface TransactionCreditor {
  /** The recipientId returned by POST /v1/recipients. */
  id?: string;
}

export interface TransactionRequest {
  /** A string in this API, not a number. */
  amount: string;
  currency: string;
  debtor: TransactionDebtor;
  creditor: TransactionCreditor;
  transactionReferenceId: string;
  type: PaymentRail;
  localInstrumentCode?: string;
  memo?: string;
}

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'RETURNED'
  | 'HELD';

export interface TransactionResponse {
  id: string;
  transactionReferenceId: string;
  requestedExecutionDate: string;
  amount: string;
  currency: string;
  type: PaymentRail;
  status: TransactionStatus;
  memo?: string;
}

/** Payment holds surfaced by Alerts & Decisioning for manual approve/reject. */
export interface PaymentHold {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'HELD' | 'RELEASED' | 'CANCELLED';
  reasonCode: string;
  reason: string;
}

// --- Notifications (webhooks) ---

/**
 * Callbacks carry a digital signature made with the signing key returned when the
 * subscription is created. The optional clientSecret is used to fetch an OAuth token
 * from YOUR identity provider — it is not an HMAC secret for the payload.
 */
export type WebhookEventType =
  | 'CLIENT_ONBOARDING'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_RESTRICTION'
  | 'ACCOUNT_FAILED'
  | 'ACCOUNT_CLOSED'
  | 'ACCOUNT_OVERDRAWN'
  | 'RECIPIENT_ACCOUNT_VALIDATION'
  | 'RECIPIENT_UPDATED'
  | 'TRANSACTION_COMPLETED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_CHANGE_REQUESTED'
  | 'THRESHOLD_LIMIT'
  | 'DOCUMENT_GENERATED'
  | 'DOCUMENT_FAILED';

export const WEBHOOK_EVENT_TYPES: WebhookEventType[] = [
  'CLIENT_ONBOARDING',
  'ACCOUNT_CREATED',
  'ACCOUNT_UPDATED',
  'ACCOUNT_RESTRICTION',
  'ACCOUNT_FAILED',
  'ACCOUNT_CLOSED',
  'ACCOUNT_OVERDRAWN',
  'RECIPIENT_ACCOUNT_VALIDATION',
  'RECIPIENT_UPDATED',
  'TRANSACTION_COMPLETED',
  'TRANSACTION_FAILED',
  'TRANSACTION_CHANGE_REQUESTED',
  'THRESHOLD_LIMIT',
  'DOCUMENT_GENERATED',
  'DOCUMENT_FAILED',
];

/** Plural forms and the old recipient events are not valid event types. */
export const RETIRED_WEBHOOK_EVENT_TYPES = [
  'TRANSACTIONS_COMPLETED',
  'TRANSACTIONS_FAILED',
  'RECIPIENT_READY_FOR_VALIDATION',
  'RECIPIENT_READY_FOR_VALIDATION_REMINDER',
  'RECIPIENT_READY_FOR_VALIDATION_EXPIRED',
  'ACCOUNT_RESTRICTIONS_UPDATED',
  'CLIENT_VERIFICATION_COMPLETED',
];

export type WebhookResourceType =
  | 'CLIENTS'
  | 'ACCOUNTS'
  | 'RECIPIENTS'
  | 'TRANSACTIONS'
  | 'DOCUMENTS';

export interface WebhookSubscriptionRequest {
  subscriptions: { eventType: WebhookEventType }[];
  /** Capital URL — the API spells it callbackURL. */
  callbackURL: string;
  securityPreferences?: {
    authorizationDetails?: {
      clientId?: string;
      clientSecret?: string;
      tokenEndpoint?: string;
    };
    headerFields?: Record<string, string>;
  };
}

export interface WebhookSubscriptionResponse {
  id: string;
  subscriptions: { eventType: WebhookEventType }[];
  callbackURL: string;
  status: 'ACTIVE' | 'INACTIVE';
  /** Returned when securityPreferences are supplied; used to verify payloads. */
  signingKey?: {
    publicKeyIdentifier: string;
    publicKeyText: string;
    publicKeyExpirationDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  eventId: string;
  eventType: WebhookEventType;
  resourceType: WebhookResourceType;
  resourceId: string;
  timestamp: string;
  resource: Record<string, unknown>;
  /** Detached signature over the payload, verified against the JPM public certificate. */
  signature: string;
  errors?: ApiError;
}

// --- Documents ---

export type DocumentType = 'ACCOUNT_CONFIRMATION_LETTER';

export interface DocumentGenerationRequest {
  type: DocumentType;
  parameters: { accountId: string };
}

export interface DocumentGenerationResponse {
  id: string;
  type: DocumentType;
  parameters: { accountId: string };
}

export interface AccountClosureRequest {
  state: 'CLOSED';
  closureReason: AccountClosureReason;
}

// --- Error Responses (EP Error Catalog) ---

export interface ApiErrorContext {
  code: string;
  message: string;
  field?: string;
  location?: 'BODY' | 'QUERY' | 'PATH';
}

export interface ApiError {
  title: string;
  httpStatus: number;
  traceId: string;
  requestId?: string;
  context: ApiErrorContext[];
}

/** Gateway errors use a different envelope to the rest of the API. */
export interface GatewayError {
  errors: { errorCode: string; errorMsg: string }[];
}
