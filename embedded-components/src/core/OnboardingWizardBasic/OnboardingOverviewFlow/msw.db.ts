// @ts-nocheck
import { factory, primaryKey } from '@mswjs/data';
import merge from 'lodash/merge';

import { ClientResponse } from '@/api/generated/smbdo.schemas';

import {
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
  SoleProprietorExistingClient,
} from './.storybook/mocks/clientDetails.mock';
import { efDocumentRequestDetailsList } from './.storybook/mocks/documentRequestDetailsList.mock';

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

  console.log('=== Database State After:', operation, '===');
  console.log(
    'Clients:',
    clients.map((c) => c.id)
  );
  console.log(
    'Parties:',
    parties.map((p) => p.id)
  );
  console.log(
    'Document Requests:',
    documentRequests.map((dr) => dr.id)
  );
  console.log('=====================================');
}

// Initialize with predefined mocks
export function initializeDb(force = false) {
  try {
    // Only clear if forced or no clients exist
    const existingClients = db.client.getAll();
    if (force || existingClients.length === 0) {
      console.log('=== Starting Database Initialization ===');
      console.log(
        'Predefined Clients Data:',
        JSON.stringify(predefinedClients, null, 2)
      );

      // Clear existing data
      db.client.deleteMany({
        where: {},
      });
      db.party.deleteMany({ where: {} });
      db.documentRequest.deleteMany({ where: {} });

      // Add predefined clients and their parties
      Object.entries(predefinedClients).forEach(([clientId, clientData]) => {
        try {
          console.log(
            `\nInitializing Client ${clientId}:`,
            JSON.stringify(clientData, null, 2)
          );

          // First create all parties from the client data
          const parties = clientData.parties || [];
          const timestamp = new Date().toISOString();

          console.log('\nCreating Parties:');
          parties.forEach((party) => {
            if (party.id) {
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
              console.log(
                `\nParty ${party.id}:`,
                JSON.stringify(newParty, null, 2)
              );
              try {
                db.party.create(newParty);
              } catch (error) {
                console.error('Error creating party:', error);
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
          console.log(`\nCreating Client:`, JSON.stringify(newClient, null, 2));
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
                console.error('Error creating document request:', error);
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
                console.error('Error creating document request:', error);
              }
            }
          }
        } catch (e) {
          console.error('Error creating client:', e);
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

  logDbState('Status Check');
  return {
    clientCount: clients.length,
    partyCount: parties.length,
    documentRequestCount: documentRequests.length,
    clients: clients.map((c) => c.id),
  };
}
