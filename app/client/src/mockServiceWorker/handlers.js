import { http, HttpResponse } from 'msw';
import {
  accountBalanceMock,
  accountsMock,
  casesMock,
  debitCardsMock,
  industryCategoriesMock,
  jobTitlesMock,
  recipientsMock,
  transactionDetailsMock,
  transactionsMock,
  efClientQuestionsMock,
  efDocumentClientDetail,
} from 'mocks';

import { API_URL } from 'data/constants';
import { db, handleMagicValues, resetDb, getDbStatus, logDbState } from './db';
import merge from 'lodash/merge';

export const createHandlers = (apiUrl) => [
  http.get(`${API_URL}/api/transactions`, () => {
    return HttpResponse.json(transactionsMock);
  }),
  http.get(`${API_URL}/api/transactions/:selectedTxnId`, () => {
    return HttpResponse.json(transactionDetailsMock);
  }),
  http.get(`${API_URL}/api/recipients`, () => {
    return HttpResponse.json(recipientsMock);
  }),
  http.get(`${API_URL}/api/accounts`, () => {
    return HttpResponse.json(accountsMock);
  }),
  http.get(`${API_URL}/api/accounts/:accountId/balances`, () => {
    return HttpResponse.json(accountBalanceMock);
  }),
  http.get(`${API_URL}/api/debit-cards`, () => {
    return HttpResponse.json(debitCardsMock);
  }),
  http.get(`${API_URL}/api/cases`, () => {
    return HttpResponse.json(casesMock);
  }),
  http.get(`${API_URL}/api/industry-categories`, () => {
    return HttpResponse.json(industryCategoriesMock);
  }),
  http.get(`${API_URL}/api/job-titles`, () => {
    return HttpResponse.json(jobTitlesMock);
  }),

  http.get(`/ef/do/v1/clients/:clientId`, (req) => {
    const { clientId } = req.params;
    const client = db.client.findFirst({
      where: { id: { equals: clientId } },
    });

    if (!client) {
      return new HttpResponse(null, { status: 404 });
    }

    // Expand party references to full party objects
    const expandedClient = {
      ...client,
      // Map party IDs to full party objects
      parties: client.parties
        .map((partyId) => {
          const party = db.party.findFirst({
            where: { id: { equals: partyId } },
          });
          return party || null;
        })
        .filter(Boolean), // Remove any null entries if party not found
    };

    return HttpResponse.json(expandedClient, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }),

  http.post(`/ef/do/v1/clients`, async ({ request }) => {
    const data = await request.json();
    const newClientId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();

    // First create the parties if any
    const partyIds = [];
    if (data.parties && Array.isArray(data.parties)) {
      for (const partyData of data.parties) {
        const newPartyId = Math.random().toString(36).substring(7);
        const newParty = {
          id: newPartyId,
          status: 'ACTIVE',
          ...partyData,
          createdAt: timestamp,
          active: true,
          preferences: partyData.preferences || { defaultLanguage: 'en-US' },
          profileStatus: partyData.profileStatus || 'COMPLETE',
          access: partyData.access || [],
          validationResponse: partyData.validationResponse || [],
        };
        db.party.create(newParty);
        partyIds.push(newPartyId);
      }
    }

    // Create the client with party IDs
    const client = db.client.create({
      id: newClientId,
      status: 'DRAFT',
      createdAt: timestamp,
      partyId: partyIds[0] || null, // Set first party as primary if exists
      parties: partyIds,
      products: data.products || [],
      outstanding: {
        documentRequestIds: [],
        questionIds: ['Q1', 'Q2'],
        attestationDocumentIds: [],
        partyIds: [],
        partyRoles: [],
      },
      questionResponses: [],
      attestations: [],
      results: {
        customerIdentityStatus: 'NOT_STARTED',
      },
    });

    // Return response with expanded parties
    const expandedClient = {
      ...client,
      parties: client.parties
        .map((partyId) => {
          const party = db.party.findFirst({
            where: { id: { equals: partyId } },
          });
          return party || null;
        })
        .filter(Boolean),
    };

    logDbState('Client Creation');
    return HttpResponse.json(expandedClient, {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  }),

  http.post(`/ef/do/v1/clients/:clientId`, async ({ request, params }) => {
    const { clientId } = params;
    const data = await request.json();

    // Check for magic values and update client state
    const updatedClient = handleMagicValues(clientId, data);
    if (!updatedClient) {
      return new HttpResponse(null, { status: 404 });
    }

    // Handle adding new parties if present
    if (data.addParties && Array.isArray(data.addParties)) {
      for (const partyData of data.addParties) {
        // Generate a new party ID if not provided
        const newPartyId = Math.random().toString(36).substring(7);

        // Create the new party with required fields
        const newParty = {
          id: newPartyId,
          status: 'ACTIVE',
          ...partyData,
          // Ensure partyType and roles are present as they are required
          partyType: partyData.partyType || 'ORGANIZATION',
          roles: partyData.roles || ['OWNER'],
          // Set parent party ID to link to the client
          parentPartyId: updatedClient.partyId,
        };

        // Create the party in the database
        db.party.create(newParty);

        // Add the new party to the client's parties array
        updatedClient.parties = [...(updatedClient.parties || []), newPartyId];
      }
    }

    // Handle adding new products if present
    if (data.addProducts) {
      updatedClient.products = [
        ...(updatedClient.products || []),
        ...data.addProducts,
      ];
    }

    // Handle adding new attestations if present
    if (data.addAttestations) {
      updatedClient.attestations = [
        ...(updatedClient.attestations || []),
        ...data.addAttestations,
      ];
    }

    // Handle removing attestations if present
    if (data.removeAttestations) {
      const attestationIdsToRemove = data.removeAttestations.map(
        (a) => a.documentId,
      );
      updatedClient.attestations = (updatedClient.attestations || []).filter(
        (a) => !attestationIdsToRemove.includes(a.documentId),
      );
    }

    // Handle question responses if present
    if (data.questionResponses) {
      updatedClient.questionResponses = [
        ...(updatedClient.questionResponses || []),
        ...data.questionResponses,
      ];
    }

    // Update the client with the new data
    const client = db.client.update({
      where: { id: { equals: clientId } },
      data: updatedClient,
    });

    // Expand parties before returning
    const expandedClient = {
      ...client,
      parties: client.parties
        .map((partyId) => {
          const party = db.party.findFirst({
            where: { id: { equals: partyId } },
          });
          return party || null;
        })
        .filter(Boolean),
    };

    logDbState('Client Update');
    return HttpResponse.json(expandedClient, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.post('/ef/do/v1/parties/:partyId', async ({ request, params }) => {
    const { partyId } = params;
    const data = await request.json();

    // Check if party exists first
    const existingParty = db.party.findFirst({
      where: { id: { equals: partyId } },
    });

    if (!existingParty) {
      return new HttpResponse(null, { status: 404 });
    }

    // First delete the existing party
    db.party.delete({
      where: { id: { equals: partyId } },
    });

    // Use lodash merge for deep merging
    const mergedData = merge({}, existingParty, data);

    // Create a new party with the merged data
    const updatedParty = db.party.create({
      ...mergedData,
      id: partyId, // Ensure we keep the same ID
    });

    logDbState('Party Update');
    return HttpResponse.json(updatedParty);
  }),

  http.get('/ef/do/v1/questions', (req) => {
    const url = new URL(req.request.url);
    const questionIds = url.searchParams.get('questionIds');
    return HttpResponse.json({
      metadata: efClientQuestionsMock.metadata,
      questions: efClientQuestionsMock?.questions.filter((q) =>
        questionIds?.includes(q.id),
      ),
    });
  }),

  http.get('/ef/do/v1/documents/:documentId', () => {
    return HttpResponse.json(efDocumentClientDetail);
  }),

  http.get('/ef/do/v1/document-requests/:documentRequestId', (req) => {
    const { documentRequestId } = req.params;
    const documentRequest = db.documentRequest.findFirst({
      where: { id: { equals: documentRequestId } },
    });

    if (!documentRequest) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(documentRequest);
  }),

  http.post('/ef/do/v1/_reset', () => {
    return HttpResponse.json(resetDb());
  }),

  http.get('/ef/do/v1/_status', () => {
    return HttpResponse.json(getDbStatus());
  }),

  http.post(
    '/ef/do/v1/clients/:clientId/verifications',
    async ({ request, params }) => {
      const { clientId } = params;
      const data = await request.json();

      const verificationResponse = handleMagicValues(clientId, data);
      if (!verificationResponse) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(verificationResponse);
    },
  ),
];
