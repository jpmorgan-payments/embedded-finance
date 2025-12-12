// @ts-nocheck
import { factory, primaryKey } from '@mswjs/data';
import merge from 'lodash/merge';

import { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
  SoleProprietorExistingClient,
} from '@/core/OnboardingWizardBasic/OnboardingOverviewFlow/.storybook/mocks/clientDetails.mock';
import { efDocumentRequestDetailsList } from '@/core/OnboardingWizardBasic/OnboardingOverviewFlow/.storybook/mocks/documentRequestDetailsList.mock';

// Configure logging behavior
export const ENABLE_LOGS = process.env.NODE_ENV !== 'test';

// Custom logger function that respects testing environment
export function dbLogger(...args: any[]) {
  if (ENABLE_LOGS) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

// Magic values configuration
export const MAGIC_VALUES = {
  INFORMATION_REQUESTED: '111111111',
  REVIEW_IN_PROGRESS: '222222222',
  REJECTED: '333333333',
  APPROVED: '444444444',
};

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
    type: String,
    status: String,
    clientId: String,
    partyDetails: Object,
    account: Object,
    createdAt: String,
    updatedAt: String,
    verificationAttempts: Number,
  },
});

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
    // Delete and recreate to avoid any issues with updates
    db.documentRequest.delete({
      where: { id: { equals: id } },
    });
    result = db.documentRequest.create({
      ...documentData,
      id,
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
const predefinedClients: Record<string, ClientResponse> = {
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

  dbLogger('=== Database State After:', operation, '===');
  dbLogger(
    'Clients:',
    clients.map((c) => c.id)
  );
  dbLogger(
    'Parties:',
    parties.map((p) => p.id)
  );
  dbLogger(
    'Document Requests:',
    documentRequests.map((dr) => dr.id)
  );
  dbLogger(
    'Recipients:',
    recipients.map((r) => `${r.id} (${r.status})`)
  );
  dbLogger('=====================================');
}

// Helper function to get active recipients (filter out INACTIVE and REJECTED)
export function getActiveRecipients(clientId?: string) {
  const allRecipients = db.recipient.getAll();

  let filteredRecipients = allRecipients.filter(
    (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
  );

  if (clientId) {
    filteredRecipients = filteredRecipients.filter(
      (r) => r.clientId === clientId
    );
  }

  return filteredRecipients;
}

// Helper function to handle microdeposit verification
export function verifyMicrodeposit(recipientId: string, amounts: number[]) {
  const recipient = db.recipient.findFirst({
    where: { id: { equals: recipientId } },
  });

  if (!recipient) {
    return {
      error: {
        httpStatus: 404,
        title: 'Recipient not found',
      },
    };
  }

  // Track verification attempts
  const currentAttempts = recipient.verificationAttempts || 0;
  const newAttempts = currentAttempts + 1;
  const maxAttempts = 3;

  // Check if max attempts already exceeded
  if (currentAttempts >= maxAttempts) {
    return {
      status: 'FAILED_MAX_ATTEMPTS_EXCEEDED',
      recipientId,
    };
  }

  // Simulate verification logic
  // For testing: amounts [0.23, 0.47] are correct
  const correctAmounts = [0.23, 0.47];
  const isCorrect =
    (amounts[0] === correctAmounts[0] && amounts[1] === correctAmounts[1]) ||
    (amounts[0] === correctAmounts[1] && amounts[1] === correctAmounts[0]);

  if (isCorrect) {
    // Success - update to VERIFIED/ACTIVE
    db.recipient.update({
      where: { id: { equals: recipientId } },
      data: {
        status: 'ACTIVE',
        verificationAttempts: newAttempts,
        updatedAt: new Date().toISOString(),
      },
    });

    logDbState('Microdeposit Verification Success');

    return {
      status: 'VERIFIED',
    };
  }

  // Failed verification
  if (newAttempts >= maxAttempts) {
    // Max attempts exceeded - mark as REJECTED
    db.recipient.update({
      where: { id: { equals: recipientId } },
      data: {
        status: 'REJECTED',
        verificationAttempts: newAttempts,
        updatedAt: new Date().toISOString(),
      },
    });

    logDbState('Microdeposit Verification - Max Attempts Exceeded');

    return {
      status: 'FAILED_MAX_ATTEMPTS_EXCEEDED',
    };
  }

  // Failed but can retry
  db.recipient.update({
    where: { id: { equals: recipientId } },
    data: {
      verificationAttempts: newAttempts,
      updatedAt: new Date().toISOString(),
    },
  });

  logDbState('Microdeposit Verification Failed');

  return {
    status: 'FAILED',
  };
}

// Initialize with predefined mocks
export function initializeDb(force = false) {
  try {
    // Only clear if forced or no clients exist
    const existingClients = db.client.getAll();
    if (force || existingClients.length === 0) {
      dbLogger('=== Starting Database Initialization ===');
      dbLogger(
        'Predefined Clients Data:',
        JSON.stringify(predefinedClients, null, 2)
      );

      try {
        // Clear existing data
        db.client.deleteMany({
          where: {},
        });
        db.party.deleteMany({
          where: {},
        });
        db.documentRequest.deleteMany({
          where: {},
        });
        db.recipient.deleteMany({
          where: {},
        });
      } catch (err) {
        dbLogger('Error clearing database:', err);
        // Continue with initialization even if clearing fails
      }

      // Add predefined clients and their parties
      Object.entries(predefinedClients).forEach(([clientId, clientData]) => {
        try {
          dbLogger(
            `\nInitializing Client ${clientId}:`,
            JSON.stringify(clientData, null, 2)
          );

          // First create all parties from the client data
          const parties = clientData.parties || [];
          const timestamp = new Date().toISOString();

          dbLogger('\nCreating Parties:');
          parties.forEach((party) => {
            if (party.id) {
              // Check if the party already exists
              const existingParty = db.party.findFirst({
                where: { id: { equals: party.id } },
              });

              const newParty = {
                ...party,
                status: party?.status || 'ACTIVE',
                active: party.active !== undefined ? party.active : true,
                createdAt: party.createdAt || timestamp,
                preferences: party.preferences || { defaultLanguage: 'en-US' },
                profileStatus: party.profileStatus || 'COMPLETE',
                access: party.access || [],
                validationResponse: party.validationResponse || [],
              };
              dbLogger(
                `\nParty ${party.id}:`,
                JSON.stringify(newParty, null, 2)
              );

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
                    dbLogger('Error updating party:', updateError);
                    // Ignore update errors for shared parties
                  }
                } else {
                  dbLogger('Error creating party:', error);
                }
              }
            }
          });

          // Check if the client already exists
          const existingClient = db.client.findFirst({
            where: { id: { equals: clientId } },
          });

          // If it exists, delete it first to avoid any issues
          if (existingClient) {
            dbLogger(`Client ${clientId} already exists, deleting it first`);
            db.client.delete({
              where: { id: { equals: clientId } },
            });
          }

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
          dbLogger(`\nCreating Client:`, JSON.stringify(newClient, null, 2));
          db.client.create(newClient);

          // If client status is INFORMATION_REQUESTED, create document requests
          if (clientData.status === 'INFORMATION_REQUESTED') {
            // Find individual parties
            const individualParties = parties.filter(
              (p) => p.partyType === 'INDIVIDUAL'
            );

            // Create document requests for individual parties
            for (const indParty of individualParties) {
              const indDocRequest = efDocumentRequestDetailsList.find(
                (req) => req.id === '68430'
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000
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
                dbLogger('Error creating document request:', error);
              }
            }

            // Create document request for organization if exists
            const orgParty = parties.find(
              (p) => p.partyType === 'ORGANIZATION'
            );
            if (orgParty) {
              const orgDocRequest = efDocumentRequestDetailsList.find(
                (req) => req.id === '68803'
              );
              const generatedDocRequestId = Math.floor(
                10000 + Math.random() * 90000
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
                  generatedDocRequestId
                );
              } catch (error) {
                dbLogger('Error creating document request:', error);
              }
            }
          }
        } catch (e) {
          dbLogger('Error creating client:', e);
        }
      });

      dbLogger('\n=== Final Database State ===');
      logDbState('Database Initialization');
      return true;
    }
    return false;
  } catch (error) {
    dbLogger('Database initialization error:', error);
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
      (id) => id.idType === 'EIN'
    )?.value ||
    rootParty.individualDetails?.individualIds?.find(
      (id) => id.idType === 'SSN'
    )?.value;

  let updatedClient = { ...client };

  const individualParties = client.parties
    .map((partyId) =>
      db.party.findFirst({ where: { id: { equals: partyId } } })
    )
    .filter((party) => party && party.partyType === 'INDIVIDUAL');

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
          10000 + Math.random() * 90000
        ).toString();
        updatedClient.outstanding.documentRequestIds.push(
          generatedDocRequestId
        );

        // Create or update organization document request using the mock data
        const orgDocRequest = efDocumentRequestDetailsList.find(
          (req) => req.id === '68803'
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
      for (const indParty of individualParties) {
        const generatedDocRequestId = Math.floor(
          10000 + Math.random() * 90000
        ).toString();
        updatedClient.outstanding.documentRequestIds.push(
          generatedDocRequestId
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
          (req) => req.id === '68430'
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

  logDbState('Client Verification Update', updated);

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
export function resetDb() {
  const success = initializeDb(true);
  logDbState('Database Reset');
  return {
    success,
    message: success
      ? 'Database reset successfully'
      : 'Database reset completed with warnings',
  };
}

// Initialize the database when this module loads
initializeDb();

// Export a function to get database status
export function getDbStatus() {
  const clients = db.client.getAll();
  const parties = db.party.getAll();
  const documentRequests = db.documentRequest.getAll();
  const recipients = db.recipient.getAll();

  logDbState('Status Check');
  return {
    clientCount: clients.length,
    partyCount: parties.length,
    documentRequestCount: documentRequests.length,
    recipientCount: recipients.length,
    clients: clients.map((c) => c.id),
    recipients: recipients.map((r) => ({ id: r.id, status: r.status })),
  };
}
