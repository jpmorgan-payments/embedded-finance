import { factory, primaryKey } from '@mswjs/data';
import merge from 'lodash/merge';
import {
  SoleProprietorExistingClient,
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
} from '../mocks/clientDetails.mock';
import { efDocumentRequestDetailsList, efClientQuestionsMock } from '../mocks';
import { mockRecipientsResponse } from '../mocks/recipients.mock';
import { mockLinkedAccounts } from '../mocks/linkedAccounts.mock';
import { mockTransactionsResponse } from '../mocks/transactions.mock';
import {
  mockAccounts,
  mockAccountBalance,
  mockAccountBalance2,
  mockActiveAccounts,
  mockActiveWithRecipientsAccounts,
  mockActiveBalances,
  mockActiveWithRecipientsBalances,
} from '../mocks/accounts.mock';

// Magic values configuration
export const MAGIC_VALUES = {
  INFORMATION_REQUESTED: '111111111',
  REVIEW_IN_PROGRESS: '222222222',
  REJECTED: '333333333',
  APPROVED: '444444444',
};

// Database initialization scenarios
export const DB_SCENARIOS = {
  ACTIVE: 'active', // Only linked accounts, no regular recipients
  ACTIVE_WITH_RECIPIENTS: 'active-with-recipients', // Current behavior (default)
  EMPTY: 'empty', // Empty recipients/transactions, LIMITED_DDA with zero balance
};

// Default scenario
export const DEFAULT_SCENARIO = DB_SCENARIOS.ACTIVE_WITH_RECIPIENTS;

// Create the database with our models
export const db = factory({
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
    type: String, // 'RECIPIENT' or 'LINKED_ACCOUNT'
    status: String,
    clientId: String,
    partyDetails: Object,
    account: Object,
    createdAt: String,
    updatedAt: String,
  },
  // NEW: Account model for managing accounts
  account: {
    id: primaryKey(String),
    clientId: String,
    label: String,
    state: String, // 'OPEN', 'CLOSED', 'FROZEN'
    category: String, // 'LIMITED_DDA', 'LIMITED_DDA_PAYMENTS', etc.
    paymentRoutingInformation: Object,
    createdAt: String,
    updatedAt: String,
  },
  // NEW: Account balance model for tracking balances
  accountBalance: {
    id: primaryKey(String),
    accountId: String,
    date: String,
    currency: String,
    balanceTypes: Array, // Array of { typeCode: String, amount: Number }
    updatedAt: String,
  },
  transaction: {
    id: primaryKey(String),
    type: String, // 'ACH', 'WIRE', 'RTP'
    status: String, // 'COMPLETED', 'PENDING', 'FAILED'
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
});

// NEW: Function to update account balance when transaction is processed
export function updateAccountBalance(
  accountId,
  amount,
  transactionType = 'CREDIT',
) {
  const balance = db.accountBalance.findFirst({
    where: { accountId: { equals: accountId } },
  });

  if (!balance) {
    console.warn(`No balance found for account ${accountId}`);
    return null;
  }

  // Update the balance based on transaction type
  const updatedBalanceTypes = balance.balanceTypes.map((balanceType) => {
    let newAmount = balanceType.amount;

    if (transactionType === 'CREDIT') {
      newAmount += amount;
    } else if (transactionType === 'DEBIT') {
      newAmount -= amount;
    }

    return {
      ...balanceType,
      amount: Math.max(0, newAmount), // Prevent negative balances
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

// NEW: Function to process transaction and update balances
export function processTransaction(transactionData) {
  const { creditorAccountId, debtorAccountId, amount, type, status } =
    transactionData;

  // Only update balances for completed transactions
  if (status === 'COMPLETED') {
    console.log(`Processing completed transaction: ${type} for $${amount}`);

    // Update creditor account (money coming in)
    if (creditorAccountId) {
      updateAccountBalance(creditorAccountId, amount, 'CREDIT');
    }

    // Update debtor account (money going out)
    if (debtorAccountId) {
      updateAccountBalance(debtorAccountId, amount, 'DEBIT');
    }
  }
}

// NEW: Function to create transaction with balance updates
export function createTransactionWithBalanceUpdate(transactionData) {
  // Generate a unique transaction ID
  const transactionId = `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Look up recipient data if recipientId is provided
  let creditorAccountId = transactionData.creditorAccountId || 'acc-001';
  let creditorName = transactionData.creditorName || 'SellSense Marketplace';

  if (transactionData.recipientId) {
    const recipient = db.recipient.findFirst({
      where: { id: { equals: transactionData.recipientId } },
    });

    if (recipient) {
      // Use recipient's account information for creditor details
      if (recipient.account && recipient.account.number) {
        // Find account by account number
        const account = db.account.findFirst({
          where: {
            paymentRoutingInformation: {
              accountNumber: { equals: recipient.account.number },
            },
          },
        });

        if (account) {
          creditorAccountId = account.id;
        }
      }

      // Use recipient's party details for creditor name
      if (recipient.partyDetails) {
        if (
          recipient.partyDetails.type === 'ORGANIZATION' &&
          recipient.partyDetails.businessName
        ) {
          creditorName = recipient.partyDetails.businessName;
        } else if (recipient.partyDetails.type === 'INDIVIDUAL') {
          const firstName = recipient.partyDetails.firstName || '';
          const lastName = recipient.partyDetails.lastName || '';
          creditorName =
            `${firstName} ${lastName}`.trim() || 'Individual Recipient';
        }
      }
    }
  }

  // Look up debtor account data if debtorAccountId is provided
  let debtorName = transactionData.debtorName || 'Mock Customer';

  if (transactionData.debtorAccountId) {
    const debtorAccount = db.account.findFirst({
      where: { id: { equals: transactionData.debtorAccountId } },
    });

    if (debtorAccount) {
      // Use account label as debtor name if available
      if (debtorAccount.label) {
        debtorName = debtorAccount.label;
      }
    }
  }

  const newTransaction = {
    id: transactionId,
    type: transactionData.type || 'ACH',
    status: transactionData.status || 'COMPLETED',
    amount: transactionData.amount || 0,
    currency: transactionData.currency || 'USD',
    paymentDate:
      transactionData.paymentDate || new Date().toISOString().slice(0, 10),
    effectiveDate:
      transactionData.effectiveDate || new Date().toISOString().slice(0, 10),
    creditorAccountId: creditorAccountId,
    debtorAccountId: transactionData.debtorAccountId || 'acc-002',
    creditorName: creditorName,
    debtorName: debtorName,
    postingVersion: transactionData.postingVersion || 1,
    reference:
      transactionData.reference ||
      transactionData.transactionReferenceId ||
      `Sale #${Math.floor(Math.random() * 100000)}`,
    description:
      transactionData.description || transactionData.memo || 'New transaction',
    createdAt: new Date().toISOString(),
  };

  // Create the transaction in the database
  const createdTransaction = db.transaction.create(newTransaction);

  // Process balance updates if transaction is completed
  if (createdTransaction.status === 'COMPLETED') {
    processTransaction(createdTransaction);
  }

  console.log('Created transaction with balance update:', createdTransaction);
  logDbState('Transaction Creation with Balance Update');

  return createdTransaction;
}

// NEW: Function to update transaction status and process balance changes
export function updateTransactionStatus(transactionId, newStatus) {
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

  // Handle balance updates based on status change
  if (oldStatus !== 'COMPLETED' && newStatus === 'COMPLETED') {
    // Transaction just completed - update balances
    processTransaction(updatedTransaction);
  } else if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
    // Transaction was completed but is now not completed - reverse balance changes
    processTransaction({
      ...updatedTransaction,
      amount: -updatedTransaction.amount, // Reverse the amount
    });
  }

  console.log(
    `Updated transaction ${transactionId} status from ${oldStatus} to ${newStatus}`,
  );
  logDbState('Transaction Status Update');

  return updatedTransaction;
}

// Helper function to handle document request upsert
export function upsertDocumentRequest(id, data) {
  const existingRequest = db.documentRequest.findFirst({
    where: { id: { equals: id } },
  });

  const documentData = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    requirements: data.requirements || [],
    outstanding: data.outstanding || {
      documentTypes: [],
      requirements: [],
    },
    validForDays: data.validForDays || 30,
  };

  let result;
  if (existingRequest) {
    result = db.documentRequest.update({
      where: { id: { equals: id } },
      data: { ...existingRequest, ...documentData },
    });
  } else {
    result = db.documentRequest.create({
      ...documentData,
      id,
    });
  }

  logDbState('Document Request Upsert');
  return result;
}

// Predefined clients data
const predefinedClients = {
  '0030000131': SoleProprietorExistingClient,
  '0030000132': LLCExistingClient,
  '0030000133': LLCExistingClientOutstandingDocuments,
  '0030000134': { ...LLCExistingClient, status: 'REVIEW_IN_PROGRESS' },
};

// Utility function to log entire database state
export function logDbState(operation = 'Current State') {
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

// Initialize with predefined mocks
export function initializeDb(force = false, scenario = DEFAULT_SCENARIO) {
  try {
    // Validate scenario parameter
    const validScenarios = Object.values(DB_SCENARIOS);
    if (!validScenarios.includes(scenario)) {
      console.warn(
        `Invalid scenario: ${scenario}. Using default: ${DEFAULT_SCENARIO}`,
      );
      scenario = DEFAULT_SCENARIO;
    }

    // Only clear if forced or no clients exist
    const existingClients = db.client.getAll();
    if (force || existingClients.length === 0) {
      console.log('=== Starting Database Initialization ===');
      console.log('Scenario:', scenario);
      console.log('Predefined Clients Data:', predefinedClients);

      // Clear existing data
      db.client.deleteMany({});
      db.party.deleteMany({});
      db.documentRequest.deleteMany({});
      db.recipient.deleteMany({});
      db.account.deleteMany({});
      db.accountBalance.deleteMany({});
      db.transaction.deleteMany({});

      // Add predefined clients and their parties
      Object.entries(predefinedClients).forEach(([clientId, clientData]) => {
        try {
          console.log(`\nInitializing Client ${clientId}:`, clientData);

          // First create all parties from the client data
          const parties = clientData.parties || [];
          const timestamp = new Date().toISOString();

          console.log('\nCreating Parties:');
          parties.forEach((party) => {
            if (party.id) {
              // Check if the party already exists
              const existingParty = db.party.findFirst({
                where: { id: { equals: party.id } },
              });

              const newParty = {
                ...party,
                status: party.status || 'ACTIVE',
                active: party.active !== undefined ? party.active : true,
                createdAt: party.createdAt || timestamp,
                preferences: party.preferences || { defaultLanguage: 'en-US' },
                profileStatus: party.profileStatus || 'COMPLETE',
                access: party.access || [],
                validationResponse: party.validationResponse || [],
              };
              console.log(`\nParty ${party.id}:`, newParty);

              try {
                if (existingParty) {
                  // Party already exists - update it instead of creating
                  db.party.update({
                    where: { id: { equals: party.id } },
                    data: newParty,
                  });
                } else {
                  // Party doesn't exist - create it
                  db.party.create(newParty);
                }
              } catch (error) {
                // Silently handle duplicate key errors (parties can be shared between clients)
                if (
                  error instanceof Error &&
                  error.message.includes('already exists')
                ) {
                  // Try to update instead
                  try {
                    db.party.update({
                      where: { id: { equals: party.id } },
                      data: newParty,
                    });
                  } catch (updateError) {
                    console.error('Error updating party:', updateError);
                    // Ignore update errors for shared parties
                  }
                } else {
                  console.error('Error creating party:', error);
                }
              }
            }
          });

          // Then create the client with proper schema
          const newClient = {
            ...clientData,
            id: clientId,
            createdAt: clientData.createdAt || timestamp,
            partyId: clientData.partyId || parties[0]?.id,
            outstanding: {
              documentRequestIds:
                clientData.outstanding?.documentRequestIds || [],
              questionIds: clientData.outstanding?.questionIds || [],
              attestationDocumentIds:
                clientData.outstanding?.attestationDocumentIds || [],
              partyIds: clientData.outstanding?.partyIds || [],
              partyRoles: clientData.outstanding?.partyRoles || [],
            },
            questionResponses: clientData.questionResponses || [],
            attestations: clientData.attestations || [],
            parties: parties.map((p) => p.id) || [],
            products: clientData.products || [],
            results: clientData.results || {
              customerIdentityStatus: 'NOT_STARTED',
            },
          };
          console.log(`\nCreating Client:`, newClient);
          db.client.create(newClient);

          // If client status is INFORMATION_REQUESTED, create document requests
          if (clientData.status === 'INFORMATION_REQUESTED') {
            // Find individual parties
            const individualParties = parties.filter(
              (p) => p.partyType === 'INDIVIDUAL',
            );

            // Create document requests for individual parties
            for (const indParty of individualParties) {
              const indDocRequest = efDocumentRequestDetailsList.find(
                (req) => req.id === '68430',
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000,
              ).toString(); // 5 digit number
              try {
                upsertDocumentRequest(generatedDocRequestId, {
                  ...indDocRequest,
                  id: generatedDocRequestId,
                  clientId,
                  partyId: indParty.id,
                  createdAt: timestamp,
                });

                // Update party with validation response
                const updatedParty = {
                  ...indParty,
                  validationResponse: [
                    ...(indParty.validationResponse || []),
                    {
                      validationStatus: 'NEEDS_INFO',
                      validationType: 'ENTITY_VALIDATION',
                      documentRequestIds: [generatedDocRequestId],
                    },
                  ],
                };

                // Update the party
                db.party.delete({
                  where: { id: { equals: indParty.id } },
                });
                db.party.create(updatedParty);
              } catch (error) {
                console.error('Error creating document request:', error);
              }
            }

            // Create document request for organization if exists
            const orgParty = parties.find(
              (p) => p.partyType === 'ORGANIZATION',
            );
            if (orgParty) {
              const orgDocRequest = efDocumentRequestDetailsList.find(
                (req) => req.id === '68803',
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000,
              ).toString(); // 5 digit number
              try {
                upsertDocumentRequest(generatedDocRequestId, {
                  ...orgDocRequest,
                  id: generatedDocRequestId,
                  clientId,
                  partyId: orgParty.id,
                  createdAt: timestamp,
                });

                // Add the generated ID to client's outstanding block
                newClient.outstanding.documentRequestIds.push(
                  generatedDocRequestId,
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

      // Initialize recipients based on scenario
      console.log('\n=== Initializing Recipients ===');
      console.log('Scenario:', scenario);

      let recipientsToInitialize = [];

      if (scenario === DB_SCENARIOS.ACTIVE) {
        // Only linked accounts, no regular recipients
        recipientsToInitialize = mockLinkedAccounts.recipients;
        console.log('Active scenario: Initializing only linked accounts');
      } else if (scenario === DB_SCENARIOS.EMPTY) {
        // Empty scenario: no recipients at all
        recipientsToInitialize = [];
        console.log('Empty scenario: Initializing no recipients');
      } else {
        // Default: both regular recipients and linked accounts
        recipientsToInitialize = [
          ...mockRecipientsResponse.recipients,
          ...mockLinkedAccounts.recipients,
        ];
        console.log(
          'Active with recipients scenario: Initializing all recipients',
        );
      }

      recipientsToInitialize.forEach((recipient) => {
        try {
          const newRecipient = {
            ...recipient,
            createdAt: recipient.createdAt || new Date().toISOString(),
            updatedAt: recipient.updatedAt || new Date().toISOString(),
          };
          console.log(`Creating recipient ${recipient.id}:`, newRecipient);
          db.recipient.create(newRecipient);
        } catch (error) {
          console.error('Error creating recipient:', error);
        }
      });

      // Initialize accounts based on scenario
      console.log('\n=== Initializing Accounts ===');
      console.log('Scenario:', scenario);

      let accountsToInitialize = [];

      if (scenario === DB_SCENARIOS.ACTIVE) {
        // Only acc-001 for ACTIVE scenario
        accountsToInitialize = mockActiveAccounts.items;
        console.log('Active scenario: Initializing only acc-001');
      } else if (scenario === DB_SCENARIOS.EMPTY) {
        // Empty scenario: only acc-001 (LIMITED_DDA) with zero balance
        accountsToInitialize = mockActiveAccounts.items;
        console.log('Empty scenario: Initializing only acc-001 (LIMITED_DDA)');
      } else {
        // Default: both accounts for ACTIVE_WITH_RECIPIENTS scenario
        accountsToInitialize = mockActiveWithRecipientsAccounts.items;
        console.log(
          'Active with recipients scenario: Initializing both accounts (acc-001 and acc-002)',
        );
      }

      accountsToInitialize.forEach((account) => {
        try {
          const newAccount = {
            ...account,
            createdAt: account.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          console.log(`Creating account ${account.id}:`, newAccount);
          db.account.create(newAccount);
        } catch (error) {
          console.error('Error creating account:', error);
        }
      });

      // Initialize account balances from mock data
      console.log('\n=== Initializing Account Balances ===');

      let balancesToInitialize = [];

      if (scenario === DB_SCENARIOS.EMPTY) {
        // Empty scenario: only acc-001 with zero balance
        const emptyBalance = {
          ...mockAccountBalance,
          balanceTypes: [
            { typeCode: 'ITAV', amount: 0 },
            { typeCode: 'ITBD', amount: 0 },
          ],
          updatedAt: new Date().toISOString(),
        };
        balancesToInitialize = [emptyBalance];
        console.log('Empty scenario: Initializing acc-001 with zero balance');
      } else {
        // Default: both balances for other scenarios
        balancesToInitialize = [
          { ...mockAccountBalance, updatedAt: new Date().toISOString() },
          { ...mockAccountBalance2, updatedAt: new Date().toISOString() },
        ];
        console.log('Default scenario: Initializing both account balances');
      }

      balancesToInitialize.forEach((balance) => {
        try {
          console.log(
            `Creating balance for account ${balance.accountId}:`,
            balance,
          );
          db.accountBalance.create(balance);
        } catch (error) {
          console.error('Error creating account balance:', error);
        }
      });

      // Initialize transactions from mock data
      console.log('\n=== Initializing Transactions ===');

      let transactionsToInitialize = [];

      if (scenario === DB_SCENARIOS.EMPTY) {
        // Empty scenario: no transactions
        transactionsToInitialize = [];
        console.log('Empty scenario: Initializing no transactions');
      } else {
        // Default: all transactions for other scenarios
        transactionsToInitialize = mockTransactionsResponse.items;
        console.log('Default scenario: Initializing all transactions');
      }

      transactionsToInitialize.forEach((transaction) => {
        try {
          const newTransaction = {
            ...transaction,
            createdAt: new Date().toISOString(),
          };
          console.log(
            `Creating transaction ${transaction.id}:`,
            newTransaction,
          );
          db.transaction.create(newTransaction);
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

// Utility function to check magic values and update client state
export function handleMagicValues(clientId, verificationData = {}) {
  const client = db.client.findFirst({
    where: { id: { equals: clientId } },
  });

  if (!client) return null;

  // Get the party to check tax ID
  const rootParty = client.parties?.[0]
    ? db.party.findFirst({
        where: { id: { equals: client.parties[0] } },
      })
    : null;

  if (!rootParty) return null;

  const taxId =
    rootParty.organizationDetails?.organizationIds?.find(
      (id) => id.idType === 'EIN',
    )?.value ||
    rootParty.individualDetails?.individualIds?.find(
      (id) => id.idType === 'SSN',
    )?.value;

  let updatedClient = { ...client };

  switch (taxId) {
    case MAGIC_VALUES.INFORMATION_REQUESTED:
      // Initialize the updated client with base changes
      updatedClient = merge({}, updatedClient, {
        status: 'INFORMATION_REQUESTED',
        outstanding: {
          documentRequestIds: [],
        },
      });

      // Handle organization document requests
      if (rootParty.partyType === 'ORGANIZATION') {
        const generatedDocRequestId = Math.floor(
          10000 + Math.random() * 90000,
        ).toString();
        updatedClient.outstanding.documentRequestIds.push(
          generatedDocRequestId,
        );

        // Create or update organization document request using the mock data
        const orgDocRequest = efDocumentRequestDetailsList.find(
          (req) => req.id === '68803',
        );
        upsertDocumentRequest(generatedDocRequestId, {
          ...orgDocRequest,
          id: generatedDocRequestId,
          clientId,
          partyId: client.partyId,
          createdAt: new Date().toISOString(),
        });
      }

      // Handle individual document requests and validation response
      const individualParties = client.parties
        .map((partyId) =>
          db.party.findFirst({ where: { id: { equals: partyId } } }),
        )
        .filter((party) => party && party.partyType === 'INDIVIDUAL');

      for (const indParty of individualParties) {
        const generatedDocRequestId = Math.floor(
          10000 + Math.random() * 90000,
        ).toString();
        updatedClient.outstanding.documentRequestIds.push(
          generatedDocRequestId,
        );

        // Update the party with validation response
        const updatedParty = {
          ...indParty,
          validationResponse: [
            ...(indParty.validationResponse || []),
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: [generatedDocRequestId],
            },
          ],
        };

        // Update the party in the database
        db.party.delete({
          where: { id: { equals: indParty.id } },
        });
        db.party.create(updatedParty);

        // Create or update individual document request using the mock data
        const indDocRequest = efDocumentRequestDetailsList.find(
          (req) => req.id === '68430',
        );
        upsertDocumentRequest(generatedDocRequestId, {
          ...indDocRequest,
          id: generatedDocRequestId,
          clientId,
          partyId: indParty.id,
          createdAt: new Date().toISOString(),
        });
      }
      break;

    case MAGIC_VALUES.REVIEW_IN_PROGRESS:
      updatedClient = merge({}, updatedClient, {
        status: 'REVIEW_IN_PROGRESS',
      });
      break;

    case MAGIC_VALUES.REJECTED:
      updatedClient = merge({}, updatedClient, {
        status: 'REJECTED',
        results: {
          customerIdentityStatus: 'REJECTED',
        },
      });
      break;

    case MAGIC_VALUES.APPROVED:
      updatedClient = merge({}, updatedClient, {
        status: 'APPROVED',
        results: {
          customerIdentityStatus: 'APPROVED',
        },
      });
      break;

    default:
      updatedClient = merge({}, updatedClient, {
        status: 'REVIEW_IN_PROGRESS',
      });
      break;
  }

  // Update the client
  const updated = db.client.update({
    where: { id: { equals: clientId } },
    data: updatedClient,
  });

  logDbState('Client Verification Update');

  // Return verification response according to SMBDO schema
  return {
    acceptedAt: new Date().toISOString(),
    consumerDevice: verificationData.consumerDevice || {
      ipAddress: '',
      sessionId: '',
    },
  };
}

// Utility function to reset the database
export function resetDb(scenario = DEFAULT_SCENARIO) {
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

// Initialize the database when this module loads
initializeDb(false, DEFAULT_SCENARIO);

// Export a function to get database status
export function getDbStatus() {
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
    transactions: transactions.map((t) => t.id),
  };
}
