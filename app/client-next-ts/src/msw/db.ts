/**
 * MSW stateful data layer using @mswjs/data (v0.16.x factory API).
 *
 * Best practices:
 * - One factory, one db instance; all models use primaryKey(String) for id.
 * - Seed via initializeDb() / resetDb(scenario); handlers read/write through db.*.
 * - Entity shapes align with OAS (`@ef-api/*-schemas`).
 * - Use deleteMany({}) to clear a model; update via findFirst + update.
 */
import { factory, primaryKey } from '@mswjs/data';
import merge from 'lodash/merge';

import type {
  AccountBalanceDto,
  AccountBalanceDtoTypeCode,
  AccountBalanceResponse,
  AccountResponse,
} from '@ef-api/ep-accounts-schemas';
import type { Recipient } from '@ef-api/ep-recipients-schemas';
import type { TransactionsSearchResponseV2 } from '@ef-api/ep-transactions-schemas';
import type {
  ClientResponseOutstanding,
  ClientStatus,
  DocumentRequestResponse,
  PartyResponse,
} from '@ef-api/smbdo-schemas';

import { efDocumentRequestDetailsList } from '../mocks';
import {
  mockAccountBalance,
  mockAccountBalance2,
  mockActiveAccounts,
  mockActiveWithRecipientsAccounts,
} from '../mocks/accounts.mock';
import {
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
  SoleProprietorExistingClient,
} from '../mocks/clientDetails.mock';
import { mockLinkedAccounts } from '../mocks/linkedAccounts.mock';
import { mockRecipientsResponse } from '../mocks/recipients.mock';
import { mockTransactionsResponse } from '../mocks/transactions.mock';

// --- Entity types (OAS-aligned) ---

export interface DbClient {
  id: string;
  status?: ClientStatus;
  partyId?: string;
  parties?: string[];
  products?: string[] | unknown[];
  outstanding?: ClientResponseOutstanding;
  questionResponses?: unknown[];
  attestations?: unknown[];
  results?: Record<string, unknown>;
  createdAt?: string;
}

export type DbParty = PartyResponse & Record<string, unknown>;
export type DbDocumentRequest = DocumentRequestResponse & Record<string, unknown>;
export type DbRecipient = Recipient;
export type DbAccount = AccountResponse;
/** OAS AccountBalanceResponse + DB-only fields (accountId, updatedAt). */
export type DbAccountBalance = AccountBalanceResponse & {
  accountId?: string;
  updatedAt?: string;
};
export type DbTransaction = TransactionsSearchResponseV2;

/** Options for id-based findFirst/delete (e.g. { where: { id: { equals: 'x' } } }). */
type WhereIdOpts = { where: { id: { equals: string } } };
type WhereClientId = { where: { clientId: { equals: string } } };

/** documentRequest.update first argument (where + data). */
export type DocumentRequestUpdateOpts = {
  where: { id: { equals: string } };
  data: Partial<DbDocumentRequest> & Record<string, unknown>;
};

/** recipient.update first argument (where + data). */
export type RecipientUpdateOpts = {
  where: { id: { equals: string } };
  data: Partial<DbRecipient> & Record<string, unknown>;
};

export interface Db {
  client: {
    findFirst: (opts: WhereIdOpts) => DbClient | null;
    findMany: (opts: WhereClientId) => DbClient[];
    getAll: () => DbClient[];
    create: (data: (Partial<DbClient> & { id: string }) | Record<string, unknown>) => DbClient;
    update: (opts: { where: { id: { equals: string } }; data: Partial<DbClient> | Record<string, unknown> }) => DbClient;
    deleteMany: (opts: object) => void;
    delete: (opts: WhereIdOpts) => void;
  };
  party: {
    findFirst: (opts: WhereIdOpts) => DbParty | null;
    getAll: () => DbParty[];
    create: (data: (Partial<DbParty> & { id: string }) | Record<string, unknown>) => DbParty;
    update: (opts: { where: { id: { equals: string } }; data: Partial<DbParty> | Record<string, unknown> }) => DbParty;
    delete: (opts: WhereIdOpts) => void;
    deleteMany: (opts: object) => void;
  };
  documentRequest: {
    findFirst: (opts: WhereIdOpts) => DbDocumentRequest | null;
    findMany: (opts: WhereClientId) => DbDocumentRequest[];
    getAll: () => DbDocumentRequest[];
    update: (opts: DocumentRequestUpdateOpts) => DbDocumentRequest;
    create: (data: (Partial<DbDocumentRequest> & { id: string }) | Record<string, unknown>) => DbDocumentRequest;
    deleteMany: (opts: object) => void;
  };
  recipient: {
    findFirst: (opts: WhereIdOpts) => DbRecipient | null;
    getAll: () => DbRecipient[];
    create: (data: (Partial<DbRecipient> & { id: string }) | Record<string, unknown>) => DbRecipient;
    update: (opts: RecipientUpdateOpts) => DbRecipient;
    deleteMany: (opts: object) => void;
  };
  account: {
    findFirst: (opts: { where: Record<string, unknown> }) => DbAccount | null;
    getAll: () => DbAccount[];
    create: (data: (Partial<DbAccount> & { id: string }) | Record<string, unknown>) => DbAccount;
    deleteMany: (opts: object) => void;
  };
  accountBalance: {
    findFirst: (opts: { where: { accountId: { equals: string } } }) => DbAccountBalance | null;
    getAll: () => DbAccountBalance[];
    create: (data: (Partial<DbAccountBalance> & { id: string }) | Record<string, unknown>) => DbAccountBalance;
    update: (opts: { where: { accountId: { equals: string } }; data: Partial<DbAccountBalance> }) => DbAccountBalance;
    deleteMany: (opts: object) => void;
  };
  transaction: {
    findFirst: (opts: WhereIdOpts) => DbTransaction | null;
    getAll: () => DbTransaction[];
    create: (data: (Partial<DbTransaction> & { id: string }) | Record<string, unknown>) => DbTransaction;
    update: (opts: { where: { id: { equals: string } }; data: Partial<DbTransaction> | Record<string, unknown> }) => DbTransaction;
    deleteMany: (opts: object) => void;
  };
}

// --- Constants ---

export const MAGIC_VALUES: Record<string, string> = {
  INFORMATION_REQUESTED: '111111111',
  REVIEW_IN_PROGRESS: '222222222',
  REJECTED: '333333333',
  APPROVED: '444444444',
};

export const DB_SCENARIOS: Record<string, string> = {
  ACTIVE: 'active',
  ACTIVE_WITH_RECIPIENTS: 'active-with-recipients',
  EMPTY: 'empty',
};

export const DEFAULT_SCENARIO = DB_SCENARIOS.ACTIVE_WITH_RECIPIENTS;

// --- Factory ---

export const db: Db = factory({
  client: {
    id: primaryKey(String),
    status: String,
    partyId: String,
    parties: Array,
    products: Array,
    outstanding: {
      documentRequestIds: Array,
      questionIds: Array,
      attestationDocumentIds: Array,
      partyIds: Array,
      partyRoles: Array,
    },
    questionResponses: Array,
    attestations: Array,
    results: Object,
    createdAt: String,
  },
  party: {
    id: primaryKey(String),
    partyType: String,
    email: String,
    externalId: String,
    roles: Array,
    organizationDetails: Object,
    individualDetails: Object,
    status: String,
    active: Boolean,
    createdAt: String,
    parentPartyId: String,
    parentExternalId: String,
    preferences: Object,
    profileStatus: String,
    access: Array,
    networkRegistration: Object,
    validationResponse: Array,
  },
  documentRequest: {
    id: primaryKey(String),
    clientId: String,
    partyId: String,
    documentType: String,
    status: String,
    description: String,
    requirements: Array,
    outstanding: Object,
    createdAt: String,
    validForDays: Number,
  },
  recipient: {
    id: primaryKey(String),
    type: String,
    status: String,
    clientId: String,
    partyDetails: Object,
    account: Object,
    createdAt: String,
    updatedAt: String,
  },
  account: {
    id: primaryKey(String),
    clientId: String,
    label: String,
    state: String,
    category: String,
    paymentRoutingInformation: Object,
    createdAt: String,
    updatedAt: String,
  },
  accountBalance: {
    id: primaryKey(String),
    accountId: String,
    date: String,
    currency: String,
    balanceTypes: Array,
    updatedAt: String,
  },
  transaction: {
    id: primaryKey(String),
    type: String,
    status: String,
    amount: Number,
    currency: String,
    paymentDate: String,
    effectiveDate: String,
    creditorAccountId: String,
    debtorAccountId: String,
    creditorName: String,
    debtorName: String,
    postingVersion: Number,
    reference: String,
    description: String,
    createdAt: String,
  },
}) as unknown as Db;

// --- Helpers ---

export function updateAccountBalance(
  accountId: string,
  amount: number,
  transactionType: 'CREDIT' | 'DEBIT' = 'CREDIT'
): DbAccountBalance | null {
  const balance = db.accountBalance.findFirst({
    where: { accountId: { equals: accountId } },
  });

  if (!balance) {
    console.warn(`No balance found for account ${accountId}`);
    return null;
  }

  const balanceTypes: AccountBalanceDto[] = Array.isArray(balance.balanceTypes) ? balance.balanceTypes : [];
  const updatedBalanceTypes: AccountBalanceDto[] = balanceTypes.map((balanceType) => {
    let newAmount = balanceType.amount ?? 0;
    if (transactionType === 'CREDIT') {
      newAmount += amount;
    } else if (transactionType === 'DEBIT') {
      newAmount -= amount;
    }
    return {
      typeCode: (balanceType.typeCode ?? 'ITAV') as AccountBalanceDtoTypeCode,
      amount: Math.max(0, newAmount),
    };
  });

  const updatedBalance = db.accountBalance.update({
    where: { accountId: { equals: accountId } },
    data: {
      ...balance,
      balanceTypes: updatedBalanceTypes,
      updatedAt: new Date().toISOString(),
    },
  });

  console.log(`Updated balance for account ${accountId}:`, updatedBalance);
  return updatedBalance;
}

export function processTransaction(transactionData: DbTransaction): void {
  const { creditorAccountId, debtorAccountId, amount, status } = transactionData;

  if (status === 'COMPLETED') {
    const amt = typeof amount === 'number' ? amount : 0;
    console.log(`Processing completed transaction for $${amt}`);
    if (creditorAccountId) {
      updateAccountBalance(creditorAccountId, amt, 'CREDIT');
    }
    if (debtorAccountId) {
      updateAccountBalance(debtorAccountId, amt, 'DEBIT');
    }
  }
}

export function createTransactionWithBalanceUpdate(
  transactionData: Record<string, unknown>
): DbTransaction {
  const transactionId = `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let creditorAccountId = (transactionData.creditorAccountId as string) || 'acc-001';
  let creditorName = (transactionData.creditorName as string) || 'SellSense Marketplace';

  if (transactionData.recipientId) {
    const recipient = db.recipient.findFirst({
      where: { id: { equals: transactionData.recipientId as string } },
    });

    if (recipient) {
      if (recipient.account?.number) {
        const account = db.account.findFirst({
          where: {
            paymentRoutingInformation: {
              accountNumber: { equals: recipient.account.number },
            },
          } as Record<string, unknown>,
        });
        if (account) {
          creditorAccountId = account.id;
        }
      }
      if (recipient.partyDetails) {
        if (
          recipient.partyDetails.type === 'ORGANIZATION' &&
          recipient.partyDetails.businessName
        ) {
          creditorName = recipient.partyDetails.businessName;
        } else if (recipient.partyDetails.type === 'INDIVIDUAL') {
          const firstName = recipient.partyDetails.firstName || '';
          const lastName = recipient.partyDetails.lastName || '';
          creditorName = `${firstName} ${lastName}`.trim() || 'Individual Recipient';
        }
      }
    }
  }

  let debtorName = (transactionData.debtorName as string) || 'Mock Customer';
  if (transactionData.debtorAccountId) {
    const debtorAccount = db.account.findFirst({
      where: { id: { equals: transactionData.debtorAccountId as string } },
    });
    if (debtorAccount?.label) {
      debtorName = debtorAccount.label;
    }
  }

  const newTransaction: Record<string, unknown> = {
    id: transactionId,
    type: transactionData.type || 'ACH',
    status: transactionData.status || 'COMPLETED',
    amount: transactionData.amount || 0,
    currency: transactionData.currency || 'USD',
    paymentDate:
      (transactionData.paymentDate as string) || new Date().toISOString().slice(0, 10),
    effectiveDate:
      (transactionData.effectiveDate as string) || new Date().toISOString().slice(0, 10),
    creditorAccountId,
    debtorAccountId: (transactionData.debtorAccountId as string) || 'acc-002',
    creditorName,
    debtorName,
    postingVersion: (transactionData.postingVersion as number) ?? 1,
    reference:
      (transactionData.reference as string) ||
      (transactionData.transactionReferenceId as string) ||
      `Sale #${Math.floor(Math.random() * 100000)}`,
    description:
      (transactionData.description as string) ||
      (transactionData.memo as string) ||
      'New transaction',
    createdAt: new Date().toISOString(),
  };

  const createdTransaction = db.transaction.create(newTransaction as Partial<DbTransaction> & { id: string });

  if (createdTransaction.status === 'COMPLETED') {
    processTransaction(createdTransaction);
  }

  console.log('Created transaction with balance update:', createdTransaction);
  logDbState('Transaction Creation with Balance Update');

  return createdTransaction;
}

export function updateTransactionStatus(
  transactionId: string,
  newStatus: string
): DbTransaction {
  const transaction = db.transaction.findFirst({
    where: { id: { equals: transactionId } },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  const oldStatus = transaction.status;
  const updatedTransaction = db.transaction.update({
    where: { id: { equals: transactionId } },
    data: {
      ...transaction,
      status: newStatus,
    },
  });

  if (oldStatus !== 'COMPLETED' && newStatus === 'COMPLETED') {
    processTransaction(updatedTransaction);
  } else if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
    const amt = typeof updatedTransaction.amount === 'number' ? updatedTransaction.amount : 0;
    processTransaction({
      ...updatedTransaction,
      amount: -amt,
    } as DbTransaction);
  }

  console.log(
    `Updated transaction ${transactionId} status from ${oldStatus} to ${newStatus}`
  );
  logDbState('Transaction Status Update');

  return updatedTransaction;
}

export function upsertDocumentRequest(
  id: string,
  data: Partial<DbDocumentRequest>
): DbDocumentRequest {
  const existingRequest = db.documentRequest.findFirst({
    where: { id: { equals: id } },
  });

  const documentData: Record<string, unknown> = {
    ...data,
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    requirements: (data.requirements as unknown[]) || [],
    outstanding: (data.outstanding as object) || {
      documentTypes: [],
      requirements: [],
    },
    validForDays: (data.validForDays as number) ?? 30,
  };

  let result: DbDocumentRequest;
  if (existingRequest) {
    result = db.documentRequest.update({
      where: { id: { equals: id } },
      data: { ...existingRequest, ...documentData },
    });
  } else {
    result = db.documentRequest.create({
      ...documentData,
      id,
    } as Partial<DbDocumentRequest> & { id: string });
  }

  logDbState('Document Request Upsert');
  return result;
}

// --- Predefined data ---

interface PredefinedClientShape {
  parties?: DbParty[];
  partyId?: string;
  outstanding?: ClientResponseOutstanding;
  questionResponses?: unknown[];
  attestations?: unknown[];
  products?: string[];
  results?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const predefinedClients: Record<string, PredefinedClientShape> = {
  '0030000131': SoleProprietorExistingClient as PredefinedClientShape,
  '0030000132': LLCExistingClient as PredefinedClientShape,
  '0030000133': LLCExistingClientOutstandingDocuments as PredefinedClientShape,
  '0030000134': { ...LLCExistingClient, status: 'REVIEW_IN_PROGRESS' } as PredefinedClientShape,
};

// --- Logging ---

export function logDbState(operation = 'Current State'): void {
  const clients = db.client.getAll();
  const parties = db.party.getAll();
  const documentRequests = db.documentRequest.getAll();
  const recipients = db.recipient.getAll();
  const accounts = db.account.getAll();
  const accountBalances = db.accountBalance.getAll();
  const transactions = db.transaction.getAll();

  console.log('=== Database State After:', operation, '===');
  console.log('Clients:', clients);
  console.log('Parties:', parties);
  console.log('Document Requests:', documentRequests);
  console.log('Recipients:', recipients);
  console.log('Accounts:', accounts);
  console.log('Account Balances:', accountBalances);
  console.log('Transactions:', transactions);
  console.log('=====================================');
}

// --- Initialize ---

export function initializeDb(force = false, scenario = DEFAULT_SCENARIO): boolean {
  try {
    const validScenarios = Object.values(DB_SCENARIOS);
    if (!validScenarios.includes(scenario)) {
      console.warn(`Invalid scenario: ${scenario}. Using default: ${DEFAULT_SCENARIO}`);
      scenario = DEFAULT_SCENARIO;
    }

    const existingClients = db.client.getAll();
    if (force || existingClients.length === 0) {
      console.log('=== Starting Database Initialization ===');
      console.log('Scenario:', scenario);

      db.client.deleteMany({});
      db.party.deleteMany({});
      db.documentRequest.deleteMany({});
      db.recipient.deleteMany({});
      db.account.deleteMany({});
      db.accountBalance.deleteMany({});
      db.transaction.deleteMany({});

      Object.entries(predefinedClients).forEach(([clientId, clientData]) => {
        try {
          console.log(`\nInitializing Client ${clientId}:`, clientData);

          const parties = clientData.parties || [];
          const timestamp = new Date().toISOString();

          console.log('\nCreating Parties:');
          parties.forEach((party) => {
            if (party.id) {
              const existingParty = db.party.findFirst({
                where: { id: { equals: party.id as string } },
              });

              const newParty = {
                ...party,
                status: (party.status as string) || 'ACTIVE',
                active: party.active !== undefined ? party.active : true,
                createdAt: (party.createdAt as string) || timestamp,
                preferences: (party.preferences as object) || { defaultLanguage: 'en-US' },
                profileStatus: (party.profileStatus as string) || 'COMPLETE',
                access: (party.access as unknown[]) || [],
                validationResponse: (party.validationResponse as unknown[]) || [],
              };

              try {
                if (existingParty) {
                  db.party.update({
                    where: { id: { equals: party.id as string } },
                    data: newParty,
                  });
                } else {
                  db.party.create(newParty as Partial<DbParty> & { id: string });
                }
              } catch (error) {
                if (
                  error instanceof Error &&
                  error.message.includes('already exists')
                ) {
                  try {
                    db.party.update({
                      where: { id: { equals: party.id as string } },
                      data: newParty,
                    });
                  } catch (updateError) {
                    console.error('Error updating party:', updateError);
                  }
                } else {
                  console.error('Error creating party:', error);
                }
              }
            }
          });

          const newClient = {
            ...clientData,
            id: clientId,
            createdAt: (clientData.createdAt as string) || timestamp,
            partyId: (clientData.partyId as string) || (parties[0] as { id?: string } | undefined)?.id,
            outstanding: {
              documentRequestIds: (clientData.outstanding?.documentRequestIds as string[]) || [],
              questionIds: (clientData.outstanding?.questionIds as string[]) || [],
              attestationDocumentIds: (clientData.outstanding?.attestationDocumentIds as string[]) || [],
              partyIds: (clientData.outstanding?.partyIds as string[]) || [],
              partyRoles: (clientData.outstanding?.partyRoles as string[]) || [],
            },
            questionResponses: clientData.questionResponses || [],
            attestations: clientData.attestations || [],
            parties: parties.map((p) => (p as { id?: string }).id).filter(Boolean) as string[],
            products: (clientData.products as string[]) || [],
            results: (clientData.results as Record<string, unknown>) || {
              customerIdentityStatus: 'NOT_STARTED',
            },
          };

          db.client.create(newClient as Partial<DbClient> & { id: string });

          if (clientData.status === 'INFORMATION_REQUESTED') {
            const individualParties = parties.filter(
              (p) => (p as { partyType?: string }).partyType === 'INDIVIDUAL'
            );

            for (const indParty of individualParties) {
              const indDocRequest = efDocumentRequestDetailsList.find(
                (req: { id?: string }) => req.id === '68430'
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000
              ).toString();
              try {
                upsertDocumentRequest(generatedDocRequestId, {
                  ...indDocRequest,
                  id: generatedDocRequestId,
                  clientId,
                  partyId: (indParty as { id?: string }).id,
                  createdAt: timestamp,
                } as Partial<DbDocumentRequest>);

                const updatedParty = {
                  ...indParty,
                  validationResponse: [
                    ...((indParty.validationResponse as unknown[]) || []),
                    {
                      validationStatus: 'NEEDS_INFO',
                      validationType: 'ENTITY_VALIDATION',
                      documentRequestIds: [generatedDocRequestId],
                    },
                  ],
                };

                db.party.delete({ where: { id: { equals: (indParty as { id: string }).id } } });
                db.party.create(updatedParty as Partial<DbParty> & { id: string });
              } catch (error) {
                console.error('Error creating document request:', error);
              }
            }

            const orgParty = parties.find(
              (p) => (p as { partyType?: string }).partyType === 'ORGANIZATION'
            );
            if (orgParty) {
              const orgDocRequest = efDocumentRequestDetailsList.find(
                (req: { id?: string }) => req.id === '68803'
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000
              ).toString();
              try {
                upsertDocumentRequest(generatedDocRequestId, {
                  ...orgDocRequest,
                  id: generatedDocRequestId,
                  clientId,
                  partyId: (orgParty as { id?: string }).id,
                  createdAt: timestamp,
                } as Partial<DbDocumentRequest>);

                (newClient.outstanding as { documentRequestIds: string[] }).documentRequestIds.push(
                  generatedDocRequestId
                );
              } catch (error) {
                console.error('Error creating document request:', error);
              }
            }
          }
        } catch (e) {
          console.error('Error creating client:', e);
        }
      });

      // Recipients
      console.log('\n=== Initializing Recipients ===');

      let recipientsToInitialize: DbRecipient[] = [];
      if (scenario === DB_SCENARIOS.ACTIVE) {
        recipientsToInitialize = mockLinkedAccounts.recipients ?? [];
      } else if (scenario === DB_SCENARIOS.EMPTY) {
        recipientsToInitialize = [];
      } else {
        recipientsToInitialize = [
          ...(mockRecipientsResponse.recipients ?? []),
          ...(mockLinkedAccounts.recipients ?? []),
        ];
      }

      recipientsToInitialize.forEach((recipient) => {
        try {
          const newRecipient = {
            ...recipient,
            createdAt: recipient.createdAt || new Date().toISOString(),
            updatedAt: recipient.updatedAt || new Date().toISOString(),
          };
          db.recipient.create(newRecipient as Partial<DbRecipient> & { id: string });
        } catch (error) {
          console.error('Error creating recipient:', error);
        }
      });

      // Accounts
      console.log('\n=== Initializing Accounts ===');

      let accountsToInitialize: DbAccount[] = [];
      if (scenario === DB_SCENARIOS.ACTIVE || scenario === DB_SCENARIOS.EMPTY) {
        accountsToInitialize = mockActiveAccounts.items;
      } else {
        accountsToInitialize = mockActiveWithRecipientsAccounts.items;
      }

      accountsToInitialize.forEach((account) => {
        try {
          const newAccount = {
            ...account,
            createdAt: account.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.account.create(newAccount as Partial<DbAccount> & { id: string });
        } catch (error) {
          console.error('Error creating account:', error);
        }
      });

      // Balances
      console.log('\n=== Initializing Account Balances ===');

      let balancesToInitialize: (DbAccountBalance & { accountId: string })[] = [];
      if (scenario === DB_SCENARIOS.EMPTY) {
        balancesToInitialize = [
          {
            ...mockAccountBalance,
            balanceTypes: [
              { typeCode: 'ITAV' as AccountBalanceDtoTypeCode, amount: 0 },
              { typeCode: 'ITBD' as AccountBalanceDtoTypeCode, amount: 0 },
            ],
            updatedAt: new Date().toISOString(),
          },
        ];
      } else {
        balancesToInitialize = [
          { ...mockAccountBalance, updatedAt: new Date().toISOString() },
          { ...mockAccountBalance2, updatedAt: new Date().toISOString() },
        ];
      }

      balancesToInitialize.forEach((balance) => {
        try {
          db.accountBalance.create(balance as Partial<DbAccountBalance> & { id: string });
        } catch (error) {
          console.error('Error creating account balance:', error);
        }
      });

      // Transactions
      console.log('\n=== Initializing Transactions ===');

      const transactionsToInitialize =
        scenario === DB_SCENARIOS.EMPTY ? [] : (mockTransactionsResponse.items ?? []);

      transactionsToInitialize.forEach((transaction) => {
        try {
          const newTransaction = {
            ...transaction,
            createdAt: new Date().toISOString(),
          };
          db.transaction.create(newTransaction as Partial<DbTransaction> & { id: string });
        } catch (error) {
          console.error('Error creating transaction:', error);
        }
      });

      console.log('\n=== Final Database State ===');
      logDbState('Database Initialization');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

export function handleMagicValues(
  clientId: string,
  verificationData: Record<string, unknown> = {}
): Record<string, unknown> | null {
  const client = db.client.findFirst({
    where: { id: { equals: clientId } },
  });

  if (!client) return null;

  const rootParty = client.parties?.[0]
    ? db.party.findFirst({
        where: { id: { equals: client.parties[0] } },
      })
    : null;

  if (!rootParty) return null;

  const rootPartyObj = rootParty as Record<string, unknown>;
  const orgDetails = rootPartyObj.organizationDetails as { organizationIds?: Array<{ idType?: string; value?: string }> } | undefined;
  const indDetails = rootPartyObj.individualDetails as { individualIds?: Array<{ idType?: string; value?: string }> } | undefined;

  const taxId =
    orgDetails?.organizationIds?.find((id) => id.idType === 'EIN')?.value ||
    indDetails?.individualIds?.find((id) => id.idType === 'SSN')?.value;

  let updatedClient: Record<string, unknown> = { ...client };

  switch (taxId) {
    case MAGIC_VALUES.INFORMATION_REQUESTED: {
      updatedClient = merge({}, updatedClient, {
        status: 'INFORMATION_REQUESTED',
        outstanding: { documentRequestIds: [] },
      });
      const outstanding = updatedClient.outstanding as { documentRequestIds: string[] };

      if ((rootParty as { partyType?: string }).partyType === 'ORGANIZATION') {
        const generatedDocRequestId = Math.floor(
          10000 + Math.random() * 90000
        ).toString();
        outstanding.documentRequestIds.push(generatedDocRequestId);
        const orgDocRequest = efDocumentRequestDetailsList.find(
          (req: { id?: string }) => req.id === '68803'
        );
        upsertDocumentRequest(generatedDocRequestId, {
          ...orgDocRequest,
          id: generatedDocRequestId,
          clientId,
          partyId: client.partyId as string,
          createdAt: new Date().toISOString(),
        } as Partial<DbDocumentRequest>);
      }

      const individualParties = (client.parties as string[] || [])
        .map((partyId) =>
          db.party.findFirst({ where: { id: { equals: partyId } } })
        )
        .filter((party): party is DbParty => party != null && (party as { partyType?: string }).partyType === 'INDIVIDUAL');

      for (const indParty of individualParties) {
        const generatedDocRequestId = Math.floor(
          10000 + Math.random() * 90000
        ).toString();
        outstanding.documentRequestIds.push(generatedDocRequestId);

        const updatedParty = {
          ...indParty,
          validationResponse: [
            ...((indParty.validationResponse as unknown[]) || []),
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: [generatedDocRequestId],
            },
          ],
        };

        db.party.delete({ where: { id: { equals: (indParty.id as string) ?? '' } } });
        db.party.create(updatedParty as Partial<DbParty> & { id: string });

        const indDocRequest = efDocumentRequestDetailsList.find(
          (req: { id?: string }) => req.id === '68430'
        );
        upsertDocumentRequest(generatedDocRequestId, {
          ...indDocRequest,
          id: generatedDocRequestId,
          clientId,
          partyId: indParty.id as string,
          createdAt: new Date().toISOString(),
        } as Partial<DbDocumentRequest>);
      }
      break;
    }
    case MAGIC_VALUES.REVIEW_IN_PROGRESS:
      updatedClient = merge({}, updatedClient, { status: 'REVIEW_IN_PROGRESS' });
      break;
    case MAGIC_VALUES.REJECTED:
      updatedClient = merge({}, updatedClient, {
        status: 'REJECTED',
        results: { customerIdentityStatus: 'REJECTED' },
      });
      break;
    case MAGIC_VALUES.APPROVED:
      updatedClient = merge({}, updatedClient, {
        status: 'APPROVED',
        results: { customerIdentityStatus: 'APPROVED' },
      });
      break;
    default:
      updatedClient = merge({}, updatedClient, { status: 'REVIEW_IN_PROGRESS' });
      break;
  }

  db.client.update({
    where: { id: { equals: clientId } },
    data: updatedClient,
  });

  logDbState('Client Verification Update');

  return {
    acceptedAt: new Date().toISOString(),
    consumerDevice: (verificationData.consumerDevice as object) || {
      ipAddress: '',
      sessionId: '',
    },
  };
}

export function resetDb(scenario = DEFAULT_SCENARIO): {
  success: boolean;
  message: string;
  scenario: string;
} {
  const success = initializeDb(true, scenario);
  logDbState('Database Reset');
  return {
    success,
    message: success
      ? `Database reset successfully with scenario: ${scenario}`
      : 'Database reset completed with warnings',
    scenario,
  };
}

initializeDb(false, DEFAULT_SCENARIO);

export function getDbStatus(): {
  clientCount: number;
  partyCount: number;
  documentRequestCount: number;
  recipientCount: number;
  accountCount: number;
  accountBalanceCount: number;
  transactionCount: number;
  clients: string[];
  recipients: string[];
  accounts: string[];
  transactions: string[];
} {
  const clients = db.client.getAll();
  const parties = db.party.getAll();
  const documentRequests = db.documentRequest.getAll();
  const recipients = db.recipient.getAll();
  const accounts = db.account.getAll();
  const accountBalances = db.accountBalance.getAll();
  const transactions = db.transaction.getAll();

  logDbState('Status Check');
  return {
    clientCount: clients.length,
    partyCount: parties.length,
    documentRequestCount: documentRequests.length,
    recipientCount: recipients.length,
    accountCount: accounts.length,
    accountBalanceCount: accountBalances.length,
    transactionCount: transactions.length,
    clients: clients.map((c) => c.id),
    recipients: recipients.map((r) => r.id),
    accounts: accounts.map((a) => a.id),
    transactions: transactions.map((t) => (t as { id?: string }).id ?? ''),
  };
}
