// =============================================================================
// Mock J.P. Morgan Embedded Payments API
// Mirrors the published request/response contracts, validation order and error
// codes so that failures in the game teach the same lessons as the real API.
// Verified against the developer portal on 2026-08-18.
// =============================================================================

import type {
  ClientRequest,
  ClientResponse,
  ClientParty,
  PartyRole,
  Address,
  AccountRequest,
  AccountResponse,
  AccountBalances,
  AccountRestriction,
  RestrictionType,
  AccountClosureReason,
  RecipientRequest,
  RecipientResponse,
  TransactionRequest,
  TransactionResponse,
  WebhookSubscriptionRequest,
  WebhookSubscriptionResponse,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
  PartyValidationResponse,
  VerificationResponse,
  PaymentHold,
  ApiError,
  ApiErrorContext,
} from '../types';
import {
  ORGANIZATION_TYPES,
  DEPRECATED_ORGANIZATION_TYPES,
  DISALLOWED_ADDRESS_PATTERNS,
  KNOWN_REGISTERED_AGENT_ADDRESSES,
  ADDRESS_TYPES,
  ORGANIZATION_ADDRESS_TYPES,
  PARTY_ROLES,
  DEPRECATED_PARTY_ROLES,
  PRODUCT_TYPES,
  CREATABLE_ACCOUNT_CATEGORIES,
  LEGACY_ACCOUNT_CATEGORIES,
  ACCOUNT_LABEL_PATTERN,
  CLIENT_ID_PATTERN,
  RESTRICTION_TYPES,
  ACCOUNT_CLOSURE_REASONS,
  PAYMENT_RAILS,
  LOCAL_INSTRUMENT_CODES,
  TRANSACTION_REFERENCE_PATTERN,
  ROUTING_NUMBER_PATTERN,
  WEBHOOK_EVENT_TYPES,
  RETIRED_WEBHOOK_EVENT_TYPES,
  JPM_ACH_ROUTING_NUMBER,
} from '../types';

type ErrorInput = { code: string; message: string; field?: string; location?: string };

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Account, recipient and document ids are opaque 32-character hex strings. */
function generateResourceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateUuid(): string {
  return crypto.randomUUID();
}

/** Client and party ids are ten digits. */
function generateNumericId(prefix: string): string {
  return prefix + Math.floor(Math.random() * 10 ** (10 - prefix.length))
    .toString()
    .padStart(10 - prefix.length, '0');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(800 + Math.random() * 1200);
}

function createApiError(
  title: string,
  httpStatus: number,
  contexts: ErrorInput[]
): ApiError {
  return {
    title,
    httpStatus,
    traceId: generateId('trace'),
    requestId: generateId('req'),
    context: contexts.map<ApiErrorContext>((c) => ({
      code: c.code,
      message: c.message,
      field: c.field,
      location: c.location as 'BODY' | 'QUERY' | 'PATH' | undefined,
    })),
  };
}

// In-memory state so that later calls can be validated against earlier ones.
const idempotencyMap = new Map<string, { payload: string; response: unknown }>();
const inFlightIdempotencyKeys = new Set<string>();
const accountStore = new Map<string, AccountResponse>();
const recipientStore = new Map<string, RecipientResponse>();
const balanceStore = new Map<string, AccountBalances>();

/** Wipes mock state between games so a second play-through starts clean. */
export function resetMockApi(): void {
  idempotencyMap.clear();
  inFlightIdempotencyKeys.clear();
  accountStore.clear();
  recipientStore.clear();
  balanceStore.clear();
}

export function seedAccount(account: AccountResponse, available: number): void {
  accountStore.set(account.id, account);
  balanceStore.set(account.id, {
    id: account.id,
    date: new Date().toISOString().slice(0, 10),
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: available },
      { typeCode: 'ITBD', amount: available },
    ],
  });
}

function availableBalance(accountId: string): number | undefined {
  return balanceStore.get(accountId)?.balanceTypes.find((b) => b.typeCode === 'ITAV')?.amount;
}

function debitAvailable(accountId: string, amount: number): void {
  const balances = balanceStore.get(accountId);
  if (!balances) return;
  balanceStore.set(accountId, {
    ...balances,
    balanceTypes: balances.balanceTypes.map((b) =>
      b.typeCode === 'ITAV' ? { ...b, amount: b.amount - amount } : b
    ),
  });
}

/**
 * Registers an account the player never created, so a round entered directly still
 * resolves its accountId instead of failing 11001 forever.
 */
export function seedDemoAccount(
  accountId: string,
  clientId: string | null,
  available = 12400
): void {
  seedAccount(
    {
      id: accountId,
      clientId: clientId ?? undefined,
      label: 'MAIN',
      category: 'LIMITED_DDA',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: `2000005760${Math.floor(1000 + Math.random() * 8999)}`,
        country: 'US',
        routingInformation: [{ type: 'ABA', value: JPM_ACH_ROUTING_NUMBER }],
        status: 'INACTIVE',
      },
      restrictions: [],
      createdAt: new Date().toISOString(),
    },
    available
  );
}

/** Companion to seedDemoAccount for rounds that pay a recipient they never registered. */
export function seedDemoRecipient(recipientId: string, clientId: string | null): void {
  recipientStore.set(recipientId, {
    id: recipientId,
    type: 'LINKED_ACCOUNT',
    clientId: clientId ?? undefined,
    partyDetails: { type: 'ORGANIZATION', businessName: 'Demo Linked Account' },
    account: {
      type: 'CHECKING',
      number: '****9375',
      countryCode: 'US',
      routingInformation: [
        { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'ACH' },
        { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'WIRE' },
        { routingCodeType: 'USABA', routingNumber: '122199983', transactionType: 'RTP' },
      ],
    },
    status: 'ACTIVE',
    accountValidationResponse: [
      { code: 'AVS_OWNERSHIP', result: 'PASS', description: 'Name matches the account holder of record' },
    ],
    createdAt: new Date().toISOString(),
  });
}

/**
 * Idempotency semantics: a key replayed with the same body is safe (10107 while the
 * first is still in flight), a key replayed with a different body never is (10106).
 */
function guardIdempotency(key: string | undefined, payload: unknown): unknown | undefined {
  if (!key) return undefined;
  const serialized = JSON.stringify(payload);
  const existing = idempotencyMap.get(key);

  if (existing) {
    if (existing.payload !== serialized) {
      throw createApiError('Conflict', 409, [
        {
          code: '10106',
          message: 'Client sent a duplicate idempotency key but with different payload',
          field: 'Idempotency-Key',
          location: 'BODY',
        },
      ]);
    }
    return existing.response;
  }

  if (inFlightIdempotencyKeys.has(key)) {
    throw createApiError('Conflict', 409, [
      {
        code: '10107',
        message: 'Two concurrent requests with same idempotency key and same payload received',
        field: 'Idempotency-Key',
        location: 'BODY',
      },
    ]);
  }

  inFlightIdempotencyKeys.add(key);
  return undefined;
}

function commitIdempotency(key: string | undefined, payload: unknown, response: unknown): void {
  if (!key) return;
  inFlightIdempotencyKeys.delete(key);
  idempotencyMap.set(key, { payload: JSON.stringify(payload), response });
}

function requireField(
  errors: ErrorInput[],
  value: unknown,
  field: string,
  message?: string
): void {
  const missing =
    value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
  if (missing) {
    errors.push({
      code: '10001',
      message: message ?? `Property '${field}' must be present`,
      field,
      location: 'BODY',
    });
  }
}

// --- Client Onboarding ---

/** Anything that is not a mailing address must be a real, physical location. */
function validateAddresses(
  errors: ErrorInput[],
  addresses: Address[] | undefined,
  fieldPrefix: string,
  organization: boolean
): void {
  for (const address of addresses ?? []) {
    if (!ADDRESS_TYPES.includes(address.addressType)) {
      errors.push({
        code: '10104',
        message: `'${address.addressType}' is not a valid addressType. Permitted values: ${ADDRESS_TYPES.join(', ')}`,
        field: `${fieldPrefix}.addressType`,
        location: 'BODY',
      });
      continue;
    }
    if (organization && !ORGANIZATION_ADDRESS_TYPES.includes(address.addressType)) {
      errors.push({
        code: '10104',
        message: `An organization address must be ${ORGANIZATION_ADDRESS_TYPES.join(' or ')}. Use BUSINESS_ADDRESS for the principal place of business.`,
        field: `${fieldPrefix}.addressType`,
        location: 'BODY',
      });
    }

    if (address.addressType === 'MAILING_ADDRESS') continue;

    const line = (address.addressLines ?? []).join(' ');
    const full = [line, address.city, address.state].filter(Boolean).join(' ');
    if (DISALLOWED_ADDRESS_PATTERNS.some((pattern) => pattern.test(line))) {
      errors.push({
        code: '10104',
        message:
          'Post-office boxes, private mail boxes, virtual office and registered agent addresses are not allowed. The address must be the principal place of business.',
        field: `${fieldPrefix}.addressLines`,
        location: 'BODY',
      });
    } else if (KNOWN_REGISTERED_AGENT_ADDRESSES.some((pattern) => pattern.test(full))) {
      errors.push({
        code: '10104',
        message:
          'This address is on file as a commercial registered agent (CT Corporation System, 1209 Orange St, Wilmington DE) — it accepts legal service, nobody trades there. Deleting the "c/o" line does not change what is at that address. Open [ CLIENT FILE ] and use the principal place of business.',
        field: `${fieldPrefix}.addressLines`,
        location: 'BODY',
      });
    }

    if (address.country === 'US' && !address.state) {
      errors.push({
        code: '10001',
        message: 'State is mandatory in the US and must be an ISO-3166-2 alpha-2 code',
        field: `${fieldPrefix}.state`,
        location: 'BODY',
      });
    }
    if (address.city && address.city.length > 40) {
      errors.push({
        code: '10003',
        message: 'City has a maximum of 40 characters',
        field: `${fieldPrefix}.city`,
        location: 'BODY',
      });
    }
  }
}

function validateOrganizationParty(
  errors: ErrorInput[],
  party: ClientParty,
  index: number
): void {
  const field = `parties[${index}].organizationDetails`;
  const details = party.organizationDetails;

  if (!details) {
    requireField(
      errors,
      undefined,
      field,
      "Property 'organizationDetails' must be present when partyType is ORGANIZATION"
    );
    return;
  }

  requireField(errors, details.organizationName, `${field}.organizationName`);
  requireField(errors, details.organizationType, `${field}.organizationType`);
  requireField(errors, details.countryOfFormation, `${field}.countryOfFormation`);

  // PARTNERSHIP and PUBLICLY_TRADED_COMPANY were withdrawn in the Nov 2025 release.
  if (details.organizationType) {
    const value = details.organizationType as string;
    if (DEPRECATED_ORGANIZATION_TYPES.includes(value)) {
      errors.push({
        code: '10104',
        message: `'${value}' is deprecated and must not be used. Permitted values: ${ORGANIZATION_TYPES.join(', ')}`,
        field: `${field}.organizationType`,
        location: 'BODY',
      });
    } else if (!ORGANIZATION_TYPES.includes(details.organizationType)) {
      errors.push({
        code: '10104',
        message: `'${value}' is not a valid organizationType. Permitted values: ${ORGANIZATION_TYPES.join(', ')}`,
        field: `${field}.organizationType`,
        location: 'BODY',
      });
    }
  }

  if (party.roles?.includes('CLIENT') && !details.industryCategory && !details.naics) {
    errors.push({
      code: '10001',
      message: "Must provide 'industryCategory' and 'industryType', or a 'naics' code",
      field: `${field}.industryCategory`,
      location: 'BODY',
    });
  }

  // yearOfFormation is a string in this API, which trips up most integrations.
  if (details.yearOfFormation !== undefined) {
    if (typeof details.yearOfFormation !== 'string') {
      errors.push({
        code: '10103',
        message: "'yearOfFormation' must be a string, for example \"1989\"",
        field: `${field}.yearOfFormation`,
        location: 'BODY',
      });
    } else if (!/^\d{4}$/.test(details.yearOfFormation)) {
      errors.push({
        code: '10103',
        message: "'yearOfFormation' must be a four-digit year",
        field: `${field}.yearOfFormation`,
        location: 'BODY',
      });
    } else if (Number(details.yearOfFormation) > new Date().getFullYear()) {
      errors.push({
        code: '10104',
        message: `'${details.yearOfFormation}' is not a valid yearOfFormation`,
        field: `${field}.yearOfFormation`,
        location: 'BODY',
      });
    }
  }

  for (const orgId of details.organizationIds ?? []) {
    if (['EIN', 'SSN', 'ITIN'].includes(orgId.idType) && !/^\d{9}$/.test(orgId.value ?? '')) {
      errors.push({
        code: '10103',
        message: `${orgId.idType} must consist of 9 digits for the United States`,
        field: `${field}.organizationIds.value`,
        location: 'BODY',
      });
    }
  }

  validateAddresses(errors, details.addresses, `${field}.addresses`, true);
}

function validateIndividualParty(
  errors: ErrorInput[],
  party: ClientParty,
  index: number
): void {
  const field = `parties[${index}].individualDetails`;
  const details = party.individualDetails;

  if (!details) {
    requireField(
      errors,
      undefined,
      field,
      "Property 'individualDetails' must be present when partyType is INDIVIDUAL"
    );
    return;
  }

  requireField(errors, details.firstName, `${field}.firstName`);
  requireField(errors, details.lastName, `${field}.lastName`);
  requireField(errors, details.countryOfResidence, `${field}.countryOfResidence`);

  for (const id of details.individualIds ?? []) {
    if (['SSN', 'ITIN'].includes(id.idType) && !/^\d{9}$/.test(id.value ?? '')) {
      errors.push({
        code: '10103',
        message: `${id.idType} must consist of 9 digits for the United States`,
        field: `${field}.individualIds.value`,
        location: 'BODY',
      });
    }
  }

  validateAddresses(errors, details.addresses, `${field}.addresses`, false);
}

/** Shared by POST /clients and POST /parties. */
function validateClientParty(errors: ErrorInput[], party: ClientParty, index: number): void {
  const prefix = `parties[${index}]`;

  requireField(errors, party.partyType, `${prefix}.partyType`);
  requireField(errors, party.roles, `${prefix}.roles`);

  if (party.partyType && !['ORGANIZATION', 'INDIVIDUAL'].includes(party.partyType)) {
    errors.push({
      code: '10104',
      message: `'${party.partyType}' is not a valid partyType. Permitted values: ORGANIZATION, INDIVIDUAL`,
      field: `${prefix}.partyType`,
      location: 'BODY',
    });
  }

  for (const role of party.roles ?? []) {
    if (DEPRECATED_PARTY_ROLES.includes(role)) {
      errors.push({
        code: '10104',
        message: `'${role}' is deprecated and must not be used`,
        field: `${prefix}.roles`,
        location: 'BODY',
      });
    } else if (!PARTY_ROLES.includes(role)) {
      errors.push({
        code: '10104',
        message: `'${role}' is not a valid role. Permitted values: ${PARTY_ROLES.join(', ')}`,
        field: `${prefix}.roles`,
        location: 'BODY',
      });
    }
  }

  // The business entity is one party and only one party, and it carries no other role.
  if (party.roles?.includes('CLIENT')) {
    if (party.roles.length > 1) {
      errors.push({
        code: '10104',
        message: "No other role can be specified alongside 'CLIENT'",
        field: `${prefix}.roles`,
        location: 'BODY',
      });
    }
    if (party.partyType === 'INDIVIDUAL') {
      errors.push({
        code: '10104',
        message: "The party holding the 'CLIENT' role must have partyType ORGANIZATION",
        field: `${prefix}.partyType`,
        location: 'BODY',
      });
    }
  }

  if (party.partyType === 'ORGANIZATION') validateOrganizationParty(errors, party, index);
  if (party.partyType === 'INDIVIDUAL') validateIndividualParty(errors, party, index);
}

export async function createClient(
  request: Partial<ClientRequest>,
  idempotencyKey?: string
): Promise<ClientResponse> {
  const replay = guardIdempotency(idempotencyKey, request);
  await randomDelay();
  if (replay) return replay as ClientResponse;

  const errors: ErrorInput[] = [];

  requireField(
    errors,
    request.parties,
    'parties',
    "Property 'parties' must be present with at least one party"
  );
  requireField(
    errors,
    request.products,
    'products',
    "Property 'products' must be present, for example [\"EMBEDDED_PAYMENTS\"]"
  );

  for (const product of request.products ?? []) {
    if (!PRODUCT_TYPES.includes(product)) {
      errors.push({
        code: '10104',
        message: `'${product}' is not a valid product. Permitted values: ${PRODUCT_TYPES.join(', ')}`,
        field: 'products',
        location: 'BODY',
      });
    }
  }

  const parties = request.parties ?? [];
  parties.forEach((party, index) => validateClientParty(errors, party, index));

  const clientParties = parties.filter((p) => p.roles?.includes('CLIENT'));
  if (parties.length > 0 && clientParties.length === 0) {
    errors.push({
      code: '10001',
      message:
        "One party must hold the 'CLIENT' role — that party carries the organization details for the business being onboarded",
      field: 'parties.roles',
      location: 'BODY',
    });
  }
  if (clientParties.length > 1) {
    errors.push({
      code: '10104',
      message: "Only one party under a client may hold the 'CLIENT' role",
      field: 'parties.roles',
      location: 'BODY',
    });
  }

  if (errors.length > 0) {
    inFlightIdempotencyKeys.delete(idempotencyKey ?? '');
    throw createApiError('Invalid Data', 400, errors);
  }

  const hasController = parties.some((p) => p.roles?.includes('CONTROLLER'));
  const hasBeneficialOwner = parties.some((p) => p.roles?.includes('BENEFICIAL_OWNER'));
  const outstandingRoles: PartyRole[] = [];
  if (!hasController) outstandingRoles.push('CONTROLLER');
  if (!hasBeneficialOwner) outstandingRoles.push('BENEFICIAL_OWNER');

  const withIds = parties.map((p) => ({ ...p, id: generateNumericId('2') }));

  const response: ClientResponse = {
    id: generateNumericId('1'),
    status: 'INFORMATION_REQUESTED',
    partyId: withIds.find((p) => p.roles?.includes('CLIENT'))?.id ?? withIds[0].id,
    parties: withIds,
    products: request.products ?? ['EMBEDDED_PAYMENTS'],
    outstanding: {
      attestationDocumentIds: ['att-terms-and-conditions'],
      questionIds: ['q-aml-30001', 'q-pep-30002'],
      documentRequestIds: hasBeneficialOwner ? [] : ['dr-ownership-50002'],
      partyIds: [],
      // A missing role is reported as outstanding work, not a hard error.
      partyRoles: outstandingRoles,
    },
    createdAt: new Date().toISOString(),
  };

  commitIdempotency(idempotencyKey, request, response);
  return response;
}

export async function verifyClient(clientId: string): Promise<VerificationResponse> {
  await randomDelay();

  if (!clientId) {
    throw createApiError('Invalid Data', 400, [
      { code: '10001', message: "Property 'clientId' must be present", field: 'clientId', location: 'PATH' },
    ]);
  }

  return {
    clientId,
    status: 'REVIEW_IN_PROGRESS',
    verificationStatus: 'IN_PROGRESS',
    findings: [],
    initiatedAt: new Date().toISOString(),
  };
}

/** Screens a single party against J.P. Morgan and third-party sources. */
export async function validateParty(partyId: string): Promise<PartyValidationResponse> {
  await randomDelay();

  if (!partyId) {
    throw createApiError('Invalid Data', 400, [
      { code: '10001', message: "Property 'partyId' must be present", field: 'partyId', location: 'PATH' },
    ]);
  }

  return {
    partyId,
    validationStatus: 'PASSED',
    checks: [
      { name: 'IDENTITY_VERIFICATION', result: 'PASS' },
      { name: 'SANCTIONS_SCREENING', result: 'PASS' },
      { name: 'PEP_SCREENING', result: 'PASS' },
      { name: 'ADVERSE_MEDIA', result: 'PASS' },
    ],
  };
}

// --- Accounts ---

export async function createAccount(
  request: Partial<AccountRequest>,
  idempotencyKey?: string
): Promise<AccountResponse> {
  const replay = guardIdempotency(idempotencyKey, request);
  await randomDelay();
  if (replay) return replay as AccountResponse;

  const errors: ErrorInput[] = [];
  const clientScopedCategories = ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'];

  requireField(errors, request.category, 'category');

  if (request.category && LEGACY_ACCOUNT_CATEGORIES.includes(request.category)) {
    errors.push({
      code: '10104',
      message: `'${request.category}' exists only to support the legacy Embedded Banking product and must not be used. Permitted values: ${CREATABLE_ACCOUNT_CATEGORIES.join(', ')}`,
      field: 'category',
      location: 'BODY',
    });
  } else if (request.category && !CREATABLE_ACCOUNT_CATEGORIES.includes(request.category)) {
    errors.push({
      code: '10104',
      message: `'${request.category}' cannot be created via this endpoint. Permitted values: ${CREATABLE_ACCOUNT_CATEGORIES.join(', ')}`,
      field: 'category',
      location: 'BODY',
    });
  }

  // Limited accounts belong to an onboarded client; virtual accounts do not.
  if (request.category && clientScopedCategories.includes(request.category) && !request.clientId) {
    errors.push({
      code: '10001',
      message: `Property 'clientId' must be present when category is ${request.category}`,
      field: 'clientId',
      location: 'BODY',
    });
  }
  if (request.clientId && !CLIENT_ID_PATTERN.test(request.clientId)) {
    errors.push({
      code: '10103',
      message: "'clientId' must be the ten-digit id returned by POST /v1/clients",
      field: 'clientId',
      location: 'BODY',
    });
  }
  if (request.category === 'TRANSACTION_ACCOUNT' && !request.parentAccountId) {
    errors.push({
      code: '10001',
      message: "Property 'parentAccountId' must be present — a TRANSACTION_ACCOUNT hangs off a SUMMARY_ACCOUNT",
      field: 'parentAccountId',
      location: 'BODY',
    });
  }
  if (request.label && !ACCOUNT_LABEL_PATTERN.test(request.label)) {
    errors.push({
      code: '10103',
      message: "'label' must be upper case. Only MAIN is supported today",
      field: 'label',
      location: 'BODY',
    });
  }

  if ('currency' in request) {
    errors.push({
      code: '10105',
      message:
        "Unexpected field 'currency'. Accounts are USD and the currency is returned on the balance, not set on creation.",
      field: 'currency',
      location: 'BODY',
    });
  }

  if (errors.length > 0) {
    inFlightIdempotencyKeys.delete(idempotencyKey ?? '');
    throw createApiError('Invalid Data', 400, errors);
  }

  const response: AccountResponse = {
    id: generateResourceId(),
    clientId: request.clientId,
    label: request.label ?? 'MAIN',
    category: request.category!,
    state: 'OPEN',
    paymentRoutingInformation: {
      accountNumber: `2000005760${Math.floor(1000 + Math.random() * 8999)}`,
      country: 'US',
      routingInformation: [{ type: 'ABA', value: JPM_ACH_ROUTING_NUMBER }],
      // A LIMITED_DDA has no externally addressable number until it is a PAYMENTS account.
      status: request.category === 'LIMITED_DDA_PAYMENTS' ? 'ACTIVE' : 'INACTIVE',
    },
    restrictions: [],
    createdAt: new Date().toISOString(),
  };

  accountStore.set(response.id, response);
  balanceStore.set(response.id, {
    id: response.id,
    date: new Date().toISOString().slice(0, 10),
    currency: 'USD',
    balanceTypes: [
      { typeCode: 'ITAV', amount: 0 },
      { typeCode: 'ITBD', amount: 0 },
    ],
  });

  commitIdempotency(idempotencyKey, request, response);
  return response;
}

export async function getBalances(accountId: string): Promise<AccountBalances> {
  await randomDelay();
  const balances = balanceStore.get(accountId);
  if (!balances) {
    throw createApiError('Invalid Data', 400, [
      { code: '11001', message: 'Account number is invalid or missing', field: 'accountId', location: 'PATH' },
    ]);
  }
  return balances;
}

/**
 * Adds a transaction restriction. This is the API-native way to stop money leaving an
 * account under attack — far more surgical than disabling the integration.
 */
export async function postAccountRestrictions(
  accountId: string,
  request: { restrictionType?: RestrictionType }
): Promise<AccountRestriction> {
  await randomDelay();

  const errors: ErrorInput[] = [];

  requireField(errors, request.restrictionType, 'restrictionType');

  if (request.restrictionType && !RESTRICTION_TYPES.includes(request.restrictionType)) {
    errors.push({
      code: '10104',
      message: `'${request.restrictionType}' is not a valid restriction type. Permitted values: ${RESTRICTION_TYPES.join(', ')}`,
      field: 'restrictionType',
      location: 'BODY',
    });
  }

  const account = accountStore.get(accountId);
  if (!account) {
    errors.push({
      code: '11001',
      message: 'Account number is invalid or missing',
      field: 'accountId',
      location: 'PATH',
    });
  } else if (account.state === 'CLOSED') {
    errors.push({
      code: '11004',
      message: "Account number specified has been closed on the bank of account's books",
      field: 'accountId',
      location: 'PATH',
    });
  }

  if (errors.length > 0) {
    throw createApiError('Invalid Data', 400, errors);
  }

  const restriction: AccountRestriction = {
    restrictionId: generateUuid(),
    restrictionType: request.restrictionType!,
    restrictionReason: 'CLIENT_REQUESTED',
    restrictionStatus: 'ACTIVE',
    effectiveFrom: new Date().toISOString(),
  };
  accountStore.set(accountId, {
    ...account!,
    restrictions: [...account!.restrictions, restriction],
  });
  return restriction;
}

/** Balance limits let the platform refuse transactions before they ever reach a rail. */
export async function setBalanceLimits(
  accountId: string,
  request: { minimumBalance?: string; maximumBalance?: string }
): Promise<AccountBalances> {
  await randomDelay();

  const balances = balanceStore.get(accountId);
  if (!balances) {
    throw createApiError('Invalid Data', 400, [
      { code: '11001', message: 'Account number is invalid or missing', field: 'accountId', location: 'PATH' },
    ]);
  }
  if (request.minimumBalance === undefined && request.maximumBalance === undefined) {
    throw createApiError('Invalid Data', 400, [
      {
        code: '10001',
        message: "At least one of 'minimumBalance' or 'maximumBalance' must be present",
        field: 'minimumBalance',
        location: 'BODY',
      },
    ]);
  }

  const updated: AccountBalances = { ...balances, ...request };
  balanceStore.set(accountId, updated);
  return updated;
}

export async function closeAccount(
  accountId: string,
  request: { state?: string; closureReason?: string }
): Promise<AccountResponse> {
  await randomDelay();

  const errors: ErrorInput[] = [];
  const account = accountStore.get(accountId);

  if (!account) {
    errors.push({
      code: '11001',
      message: 'Account number is invalid or missing',
      field: 'accountId',
      location: 'PATH',
    });
  }
  if (request.state !== 'CLOSED') {
    errors.push({
      code: '10104',
      message: "'state' must be 'CLOSED' when requesting account closure",
      field: 'state',
      location: 'BODY',
    });
  }
  requireField(errors, request.closureReason, 'closureReason');
  if (
    request.closureReason &&
    !ACCOUNT_CLOSURE_REASONS.includes(request.closureReason as AccountClosureReason)
  ) {
    errors.push({
      code: '10104',
      message: `'${request.closureReason}' is not a valid closureReason. Permitted values: ${ACCOUNT_CLOSURE_REASONS.join(', ')}`,
      field: 'closureReason',
      location: 'BODY',
    });
  }
  // Closure is only offered on the client's own limited accounts.
  if (account && !['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'].includes(account.category)) {
    errors.push({
      code: '10104',
      message: `OPERATION_NOT_SUPPORTED — closure is only supported for LIMITED_DDA and LIMITED_DDA_PAYMENTS accounts, not ${account.category}`,
      field: 'accountId',
      location: 'PATH',
    });
  }

  if (errors.length > 0) {
    throw createApiError('Invalid Data', 400, errors);
  }

  // Closure is asynchronous — the account parks in PENDING_CLOSE until funds settle.
  const updated: AccountResponse = {
    ...account!,
    state: 'PENDING_CLOSE',
    closureReason: request.closureReason as AccountClosureReason,
  };
  accountStore.set(accountId, updated);
  return updated;
}

// --- Recipients ---

export async function createRecipient(
  request: Partial<RecipientRequest>,
  idempotencyKey?: string
): Promise<RecipientResponse> {
  const replay = guardIdempotency(idempotencyKey, request);
  await randomDelay();
  if (replay) return replay as RecipientResponse;

  const errors: ErrorInput[] = [];
  const validTypes = ['LINKED_ACCOUNT', 'RECIPIENT', 'SETTLEMENT_ACCOUNT'];

  // account.type is the bank account type, so "it's already there" is a common misread.
  if (!request.type && request.account?.type) {
    errors.push({
      code: '10001',
      message:
        "Property 'type' must be present at the top level of the request. 'account.type' is the bank account type (CHECKING/SAVINGS) — the recipient type is a separate field.",
      field: 'type',
      location: 'BODY',
    });
  } else {
    requireField(errors, request.type, 'type');
  }
  requireField(errors, request.partyDetails, 'partyDetails');
  requireField(errors, request.account, 'account');

  if (request.type && !validTypes.includes(request.type)) {
    errors.push({
      code: '10104',
      message: `'${request.type}' is not a valid recipient type. Permitted values: ${validTypes.join(', ')}`,
      field: 'type',
      location: 'BODY',
    });
  }

  // A linked account is by definition the client's own account.
  if (request.type === 'LINKED_ACCOUNT' && !request.clientId) {
    errors.push({
      code: '10001',
      message: "Property 'clientId' must be present when type is LINKED_ACCOUNT",
      field: 'clientId',
      location: 'BODY',
    });
  }

  if (request.partyDetails) {
    requireField(errors, request.partyDetails.type, 'partyDetails.type');
    // Individuals are named with firstName + lastName; organizations with businessName.
    if (request.partyDetails.type === 'ORGANIZATION') {
      requireField(
        errors,
        request.partyDetails.businessName,
        'partyDetails.businessName',
        "Property 'partyDetails.businessName' must be present when partyDetails.type is ORGANIZATION"
      );
    } else if (request.partyDetails.type === 'INDIVIDUAL') {
      requireField(errors, request.partyDetails.firstName, 'partyDetails.firstName');
      requireField(errors, request.partyDetails.lastName, 'partyDetails.lastName');
    }
    if ('name' in request.partyDetails) {
      errors.push({
        code: '10105',
        message:
          "Unexpected field 'partyDetails.name'. Use firstName and lastName for an INDIVIDUAL, or businessName for an ORGANIZATION.",
        field: 'partyDetails.name',
        location: 'BODY',
      });
    }
  }

  if (request.account) {
    requireField(errors, request.account.number, 'account.number');
    requireField(errors, request.account.type, 'account.type');
    requireField(errors, request.account.countryCode, 'account.countryCode');
    requireField(errors, request.account.routingInformation, 'account.routingInformation');

    if (request.account.number && !/^\d{1,35}$/.test(request.account.number)) {
      errors.push({
        code: '10103',
        message: 'account.number must be digits, up to 35 characters',
        field: 'account.number',
        location: 'BODY',
      });
    }

    for (const routing of request.account.routingInformation ?? []) {
      if (!ROUTING_NUMBER_PATTERN.test(routing.routingNumber ?? '')) {
        errors.push({
          code: '10103',
          message: 'routingNumber must be a nine-digit USABA routing number',
          field: 'account.routingInformation.routingNumber',
          location: 'BODY',
        });
      }
      if (!PAYMENT_RAILS.includes(routing.transactionType)) {
        errors.push({
          code: '10104',
          message: `'${routing.transactionType}' is not a valid transactionType. Permitted values: ${PAYMENT_RAILS.join(', ')}`,
          field: 'account.routingInformation.transactionType',
          location: 'BODY',
        });
      }
    }
  }

  if (errors.length > 0) {
    inFlightIdempotencyKeys.delete(idempotencyKey ?? '');
    throw createApiError('Invalid Data', 400, errors);
  }

  // Only LINKED_ACCOUNT goes through Account Validation Service ownership checks.
  // RECIPIENT deliberately skips them, which is exactly why it cannot be paid from
  // a LIMITED_DDA — the bank has never confirmed who owns the other end.
  const isLinked = request.type === 'LINKED_ACCOUNT';
  const accountValidationResponse = isLinked
    ? [
        { code: 'AVS_ACCOUNT_STATUS', result: 'PASS' as const, description: 'Account is open and can receive credits' },
        { code: 'AVS_OWNERSHIP', result: 'PASS' as const, description: 'Name matches the account holder of record' },
      ]
    : [
        {
          code: 'AVS_OWNERSHIP',
          result: 'NOT_PERFORMED' as const,
          description:
            'Ownership validation is not performed for third-party recipients. This account may be paid only from a LIMITED_DDA_PAYMENTS account.',
        },
      ];

  const response: RecipientResponse = {
    id: generateUuid(),
    type: request.type!,
    clientId: request.clientId,
    partyId: request.partyId,
    partyDetails: request.partyDetails!,
    account: {
      ...request.account!,
      number: `****${request.account!.number.slice(-4)}`,
    },
    status: isLinked ? 'ACTIVE' : 'READY_FOR_VALIDATION',
    accountValidationResponse,
    createdAt: new Date().toISOString(),
  };

  recipientStore.set(response.id, response);
  commitIdempotency(idempotencyKey, request, response);
  return response;
}

export async function verifyMicrodeposits(
  recipientId: string,
  request: { amounts?: number[] }
): Promise<RecipientResponse> {
  await randomDelay();

  const recipient = recipientStore.get(recipientId);
  if (!recipient) {
    throw createApiError('Invalid Data', 400, [
      { code: '10001', message: 'Recipient not found', field: 'recipientId', location: 'PATH' },
    ]);
  }
  if (!request.amounts || request.amounts.length !== 2) {
    throw createApiError('Invalid Data', 400, [
      {
        code: '10001',
        message: "Property 'amounts' must contain exactly two micro-deposit values",
        field: 'amounts',
        location: 'BODY',
      },
    ]);
  }

  const updated: RecipientResponse = { ...recipient, status: 'VERIFIED' };
  recipientStore.set(recipientId, updated);
  return updated;
}

// --- Transactions ---

/** Rails close at different times; anything past the window is rejected with 11657. */
const RAIL_CUTOFF_HOUR: Partial<Record<string, number>> = { ACH: 17, WIRE: 17, FXACH: 16, FXWIRE: 16 };

export async function createTransaction(
  request: Partial<TransactionRequest>,
  idempotencyKey?: string,
  options: { simulatedHour?: number } = {}
): Promise<TransactionResponse> {
  const replay = guardIdempotency(idempotencyKey, request);
  await randomDelay();
  if (replay) return replay as TransactionResponse;

  const errors: ErrorInput[] = [];

  requireField(errors, request.amount, 'amount');
  requireField(errors, request.currency, 'currency');
  requireField(errors, request.debtor, 'debtor');
  requireField(errors, request.creditor, 'creditor');
  requireField(errors, request.transactionReferenceId, 'transactionReferenceId');
  requireField(errors, request.type, 'type');

  // The amount is a decimal string in this API, which surprises most integrations.
  if (request.amount !== undefined && typeof request.amount !== 'string') {
    errors.push({
      code: '10103',
      message: "'amount' must be a string, for example \"5000.00\"",
      field: 'amount',
      location: 'BODY',
    });
  } else if (request.amount !== undefined && !/^\d+(\.\d{1,2})?$/.test(request.amount)) {
    errors.push({
      code: '10103',
      message: "'amount' must be a positive decimal string with at most two decimal places",
      field: 'amount',
      location: 'BODY',
    });
  } else if (request.amount !== undefined && Number(request.amount) <= 0) {
    errors.push({
      code: '10100',
      message: "'amount' must be greater than 0",
      field: 'amount',
      location: 'BODY',
    });
  }

  if (request.currency && request.currency !== 'USD') {
    errors.push({
      code: '10104',
      message: `${request.currency} is not a valid currency code`,
      field: '$.currency',
      location: 'BODY',
    });
  }

  // Hyphens and spaces are rejected — the pattern tightened in Nov 2024.
  if (
    request.transactionReferenceId &&
    !TRANSACTION_REFERENCE_PATTERN.test(request.transactionReferenceId)
  ) {
    errors.push({
      code: '10103',
      message: "'transactionReferenceId' must match [_0-9A-Za-z]+ — hyphens and spaces are not permitted",
      field: 'transactionReferenceId',
      location: 'BODY',
    });
  }

  if (request.type && !PAYMENT_RAILS.includes(request.type)) {
    errors.push({
      code: '10104',
      message: `'${request.type}' is not a valid transaction type. Permitted values: ${PAYMENT_RAILS.join(', ')}`,
      field: 'type',
      location: 'BODY',
    });
  }

  if (
    request.localInstrumentCode &&
    !LOCAL_INSTRUMENT_CODES.includes(request.localInstrumentCode)
  ) {
    errors.push({
      code: '10104',
      message: `'${request.localInstrumentCode}' is not a valid SEC code. Permitted values: ${LOCAL_INSTRUMENT_CODES.join(', ')}`,
      field: 'localInstrumentCode',
      location: 'BODY',
    });
  }

  // The debtor is an account you hold, wrapped in debtor.account.registeredAccount.
  const debtorAccountId = request.debtor?.account?.registeredAccount?.id;
  if (request.debtor && !debtorAccountId) {
    errors.push({
      code: '10001',
      message:
        "Property 'debtor.account.registeredAccount.id' must be present — the debtor is an account you hold, not a bare accountId",
      field: 'debtor.account.registeredAccount.id',
      location: 'BODY',
    });
  }
  if (request.debtor?.account && !request.debtor.account.type) {
    errors.push({
      code: '10001',
      message: "Property 'debtor.account.type' must be present, for example REGISTERED_ACCOUNT",
      field: 'debtor.account.type',
      location: 'BODY',
    });
  }
  // The creditor is the recipientId, and the property is simply `id`.
  if (request.creditor && !request.creditor.id) {
    errors.push({
      code: '10001',
      message:
        "Property 'creditor.id' must be present — this is the recipientId returned by POST /v1/recipients",
      field: 'creditor.id',
      location: 'BODY',
    });
  }

  if (errors.length > 0) {
    inFlightIdempotencyKeys.delete(idempotencyKey ?? '');
    throw createApiError('Invalid Data', 400, errors);
  }

  const amount = Number(request.amount);
  const debtorAccount = debtorAccountId ? accountStore.get(debtorAccountId) : undefined;
  const creditorRecipient = request.creditor?.id
    ? recipientStore.get(request.creditor.id)
    : undefined;

  // Business rejects — these come back as a 422, not a schema error.
  const rejects: ErrorInput[] = [];

  if (debtorAccount) {
    if (debtorAccount.state === 'CLOSED') {
      rejects.push({ code: '11005', message: 'Debtor account number closed', field: 'debtor.account.registeredAccount.id' });
    }
    const blocksDebits = debtorAccount.restrictions.some(
      (r) =>
        r.restrictionStatus === 'ACTIVE' &&
        (r.restrictionType === 'DEBITS' || r.restrictionType === 'DEBIT_CREDIT')
    );
    if (blocksDebits) {
      rejects.push({ code: '11006', message: 'Blocked Account', field: 'debtor.account.registeredAccount.id' });
    }

    // A third-party RECIPIENT can only be paid from LIMITED_DDA_PAYMENTS.
    if (creditorRecipient?.type === 'RECIPIENT' && debtorAccount.category === 'LIMITED_DDA') {
      rejects.push({
        code: '11017',
        message:
          'Transaction Forbidden — a LIMITED_DDA may only pay a validated LINKED_ACCOUNT. Third-party recipients must be paid from LIMITED_DDA_PAYMENTS.',
        field: 'creditor.id',
      });
    }

    const available = availableBalance(debtorAccount.id);
    if (available !== undefined && amount > available) {
      rejects.push({
        code: '11506',
        message: `Amount of funds available to cover specified message amount is insufficient (available: ${available.toFixed(2)} USD)`,
        field: 'amount',
      });
    }
  }

  if (creditorRecipient) {
    const supportsRail = creditorRecipient.account.routingInformation.some(
      (r) => r.transactionType === request.type
    );
    if (!supportsRail) {
      rejects.push({
        code: '11019',
        message: `Transaction type ${request.type} not supported/authorized on this account — the recipient has no ${request.type} routing information`,
        field: 'type',
      });
    }
    if (creditorRecipient.status === 'READY_FOR_VALIDATION') {
      rejects.push({
        code: '11017',
        message: 'Transaction Forbidden — recipient has not completed account validation',
        field: 'creditor.id',
      });
    }
  }

  const hour = options.simulatedHour ?? new Date().getHours();
  const cutoff = RAIL_CUTOFF_HOUR[request.type!];
  if (cutoff !== undefined && hour >= cutoff) {
    rejects.push({
      code: '11657',
      message:
        'Associated message, payment information block, or transaction was received after agreed processing cut-off time',
      field: 'type',
    });
  }

  if (rejects.length > 0) {
    inFlightIdempotencyKeys.delete(idempotencyKey ?? '');
    throw createApiError('Unprocessable Entity', 422, rejects.map((r) => ({ ...r, location: 'BODY' })));
  }

  const response: TransactionResponse = {
    id: generateId('txn').replace(/-/g, '').slice(0, 15),
    transactionReferenceId: request.transactionReferenceId!,
    requestedExecutionDate: new Date().toISOString().slice(0, 10),
    amount: request.amount!,
    currency: 'USD',
    type: request.type!,
    // Money movement is asynchronous — the webhook, not this response, is the outcome.
    status: 'PENDING',
    memo: request.memo,
  };

  if (debtorAccount) debitAvailable(debtorAccount.id, amount);

  commitIdempotency(idempotencyKey, request, response);
  return response;
}

/** Approve or reject a payment held by fraud screening. */
export async function decidePaymentHold(
  holdId: string,
  request: {
    action?: 'APPROVE' | 'REJECT';
    rejectReason?: 'TRANSACTION_NO_LONGER_NEEDED' | 'DUPLICATE_TRANSACTION' | 'INCORRECT_BENEFICIARY' | 'FRAUD';
    fraud?: {
      type?: 'BUSINESS_EMAIL_COMPROMISE' | 'JPM_PLATFORM_ACCOUNT_TAKEOVER' | 'SCAM' | 'OTHER';
      additionalInformation?: string;
    };
  }
): Promise<PaymentHold> {
  await randomDelay();

  const errors: ErrorInput[] = [];
  requireField(errors, request.action, 'action');
  if (request.action && !['APPROVE', 'REJECT'].includes(request.action)) {
    errors.push({
      code: '10104',
      message: "'action' must be either APPROVE or REJECT",
      field: 'action',
      location: 'BODY',
    });
  }
  if (request.action === 'REJECT') {
    requireField(errors, request.rejectReason, 'rejectReason');
  }
  if (request.rejectReason === 'FRAUD' && !request.fraud?.type) {
    errors.push({
      code: '10001',
      message: "Property 'fraud.type' must be present when rejectReason is FRAUD",
      field: 'fraud.type',
      location: 'BODY',
    });
  }
  if (errors.length > 0) {
    throw createApiError('Invalid Data', 400, errors);
  }

  return {
    id: holdId,
    transactionId: generateId('txn'),
    amount: 0,
    currency: 'USD',
    status: request.action === 'APPROVE' ? 'RELEASED' : 'CANCELLED',
    reasonCode: '11672',
    reason: request.fraud?.additionalInformation ?? request.rejectReason ?? 'Approved',
  };
}

// --- Notifications (webhooks) ---

export async function createWebhookSubscription(
  request: Partial<WebhookSubscriptionRequest>
): Promise<WebhookSubscriptionResponse> {
  await randomDelay();

  const errors: ErrorInput[] = [];

  requireField(
    errors,
    request.subscriptions,
    'subscriptions',
    "Property 'subscriptions' must be present with at least one { eventType } entry"
  );
  requireField(
    errors,
    request.callbackURL,
    'callbackURL',
    "Property 'callbackURL' must be present — note the capitalisation"
  );

  // eventTypes[] is the shape everyone assumes; the API takes subscriptions[{eventType}].
  if ('eventTypes' in request) {
    errors.push({
      code: '10105',
      message:
        "Unexpected field 'eventTypes'. Send subscriptions: [{ \"eventType\": \"...\" }] instead.",
      field: 'eventTypes',
      location: 'BODY',
    });
  }
  if ('callbackUrl' in request) {
    errors.push({
      code: '10105',
      message: "Unexpected field 'callbackUrl'. The property is 'callbackURL'.",
      field: 'callbackUrl',
      location: 'BODY',
    });
  }
  if ('authentication' in request) {
    errors.push({
      code: '10105',
      message:
        "Unexpected field 'authentication'. OAuth details go in securityPreferences.authorizationDetails { clientId, clientSecret, tokenEndpoint }.",
      field: 'authentication',
      location: 'BODY',
    });
  }
  if ('secret' in request) {
    errors.push({
      code: '10105',
      message:
        "Unexpected field 'secret'. Callback payloads are signed with the key returned in signingKey, not with a shared HMAC secret.",
      field: 'secret',
      location: 'BODY',
    });
  }

  if (request.callbackURL && !request.callbackURL.startsWith('https://')) {
    errors.push({
      code: '10103',
      message: 'callbackURL must use HTTPS',
      field: 'callbackURL',
      location: 'BODY',
    });
  }

  for (const [index, subscription] of (request.subscriptions ?? []).entries()) {
    const eventType = subscription?.eventType;
    if (!eventType) {
      errors.push({
        code: '10001',
        message: "Property 'subscriptions.eventType' must be present",
        field: `subscriptions[${index}].eventType`,
        location: 'BODY',
      });
      continue;
    }
    if (RETIRED_WEBHOOK_EVENT_TYPES.includes(eventType)) {
      errors.push({
        code: '10104',
        message: `'${eventType}' is not a valid event type. The transaction events are singular — TRANSACTION_COMPLETED, TRANSACTION_FAILED — and RECIPIENT_ACCOUNT_VALIDATION replaced the RECIPIENT_READY_FOR_VALIDATION events.`,
        field: `subscriptions[${index}].eventType`,
        location: 'BODY',
      });
    } else if (!WEBHOOK_EVENT_TYPES.includes(eventType)) {
      errors.push({
        code: '10104',
        message: `'${eventType}' is not a valid event type. Permitted values: ${WEBHOOK_EVENT_TYPES.join(', ')}`,
        field: `subscriptions[${index}].eventType`,
        location: 'BODY',
      });
    }
  }

  const auth = request.securityPreferences?.authorizationDetails;
  if (auth && !auth.tokenEndpoint) {
    errors.push({
      code: '10001',
      message:
        "Property 'securityPreferences.authorizationDetails.tokenEndpoint' must be present — this is where we fetch the OAuth token",
      field: 'securityPreferences.authorizationDetails.tokenEndpoint',
      location: 'BODY',
    });
  }

  if (errors.length > 0) {
    throw createApiError('Invalid Data', 400, errors);
  }

  const now = new Date().toISOString();
  return {
    id: generateUuid(),
    subscriptions: request.subscriptions!,
    callbackURL: request.callbackURL!,
    status: 'ACTIVE',
    // The signing key is only issued when you configure security preferences.
    signingKey: request.securityPreferences
      ? {
          publicKeyIdentifier: generateUuid(),
          publicKeyText: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----',
          publicKeyExpirationDate: '2027-08-19',
        }
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

// --- Documents ---

export async function generateDocument(
  request: Partial<DocumentGenerationRequest>
): Promise<DocumentGenerationResponse> {
  await randomDelay();

  const errors: ErrorInput[] = [];
  requireField(errors, request.type, '$.type');
  requireField(errors, request.parameters, '$.parameters');

  if ('documentType' in request) {
    errors.push({
      code: '10105',
      message: "Unexpected field 'documentType'. The property is 'type'.",
      field: '$.documentType',
      location: 'BODY',
    });
  }
  if ('accountId' in request) {
    errors.push({
      code: '10105',
      message: "Unexpected field 'accountId'. It belongs inside 'parameters'.",
      field: '$.accountId',
      location: 'BODY',
    });
  }

  if (request.type && request.type !== 'ACCOUNT_CONFIRMATION_LETTER') {
    errors.push({
      code: '10104',
      message: "'type' must be ACCOUNT_CONFIRMATION_LETTER",
      field: '$.type',
      location: 'BODY',
    });
  }

  const accountId = request.parameters?.accountId;
  if (request.parameters && !accountId) {
    errors.push({
      code: '10001',
      message: "Property 'parameters.accountId' must be present",
      field: '$.parameters.accountId',
      location: 'BODY',
    });
  }

  const account = accountId ? accountStore.get(accountId) : undefined;
  if (accountId && !account) {
    errors.push({
      code: '11001',
      message: 'Account number is invalid or missing',
      field: '$.parameters.accountId',
      location: 'BODY',
    });
  } else if (account && !['OPEN', 'PENDING_CLOSE'].includes(account.state)) {
    // Eligibility is state-dependent: closed accounts cannot produce a letter.
    errors.push({
      code: '10199',
      message: `Account state ${account.state} is not eligible for a confirmation letter — it must be OPEN or PENDING_CLOSE`,
      field: '$.parameters.accountId',
      location: 'BODY',
    });
  }

  if (errors.length > 0) {
    throw createApiError('Invalid Data', 400, errors);
  }

  // Generation is asynchronous — DOCUMENT_GENERATED tells you when to fetch the PDF.
  return {
    id: generateUuid(),
    type: 'ACCOUNT_CONFIRMATION_LETTER',
    parameters: { accountId: accountId! },
  };
}
