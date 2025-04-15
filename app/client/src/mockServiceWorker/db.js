import { factory, primaryKey } from '@mswjs/data';
import {
  SoleProprietorExistingClient,
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
} from 'mocks/clientDetails.mock';
import { efDocumentRequestDetailsList, efClientQuestionsMock } from 'mocks';

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

  console.log('=== Database State After:', operation, '===');
  console.log('Clients:', JSON.stringify(clients, null, 2));
  console.log('Parties:', JSON.stringify(parties, null, 2));
  console.log('Document Requests:', JSON.stringify(documentRequests, null, 2));
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
        JSON.stringify(predefinedClients, null, 2),
      );

      // Clear existing data
      db.client.deleteMany({});
      db.party.deleteMany({});
      db.documentRequest.deleteMany({});

      // Add predefined clients and their parties
      Object.entries(predefinedClients).forEach(([clientId, clientData]) => {
        try {
          console.log(
            `\nInitializing Client ${clientId}:`,
            JSON.stringify(clientData, null, 2),
          );

          // First create all parties from the client data
          const parties = clientData.parties || [];
          const timestamp = new Date().toISOString();

          console.log('\nCreating Parties:');
          parties.forEach((party) => {
            if (party.id) {
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
              console.log(
                `\nParty ${party.id}:`,
                JSON.stringify(newParty, null, 2),
              );
              db.party.create(newParty);
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
        } catch (e) {
          console.error('Error creating client:', e);
          console.error('Error details:', JSON.stringify(e, null, 2));
        }
      });

      console.log('\n=== Final Database State ===');
      logDbState('Database Initialization');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
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
      updatedClient = merge({}, updatedClient, {
        status: 'INFORMATION_REQUESTED',
        outstanding: {
          documentRequestIds: ['DOC_REQ_001'],
        },
        results: {
          customerIdentityStatus: 'PENDING',
        },
      });

      // Create or update document request with proper schema
      upsertDocumentRequest('DOC_REQ_001', {
        clientId,
        partyId: client.partyId,
        documentType: 'PROOF_OF_IDENTITY',
        status: 'PENDING',
        description: 'Additional verification required',
        requirements: [
          {
            documentTypes: ['PROOF_OF_IDENTITY'],
            level: 'REQUIRED',
            minRequired: 1,
          },
        ],
        outstanding: {
          documentTypes: ['PROOF_OF_IDENTITY'],
          requirements: [
            {
              documentTypes: ['PROOF_OF_IDENTITY'],
              missing: 1,
            },
          ],
        },
        createdAt: new Date().toISOString(),
        validForDays: 30,
      });
      break;

    case MAGIC_VALUES.REVIEW_IN_PROGRESS:
      updatedClient = merge({}, updatedClient, {
        status: 'REVIEW_IN_PROGRESS',
        results: {
          customerIdentityStatus: 'IN_PROGRESS',
        },
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
