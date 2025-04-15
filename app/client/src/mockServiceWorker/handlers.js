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

    // Find the existing client
    const existingClient = db.client.findFirst({
      where: { id: { equals: clientId } },
    });

    if (!existingClient) {
      return new HttpResponse(null, { status: 404 });
    }

    // Start with existing client data
    let updatedClient = { ...existingClient };

    // Ensure outstanding object exists
    updatedClient.outstanding = updatedClient.outstanding || {
      documentRequestIds: [],
      questionIds: [],
      attestationDocumentIds: [],
      partyIds: [],
      partyRoles: [],
    };

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

    // Handle question responses if present
    if (data.questionResponses) {
      // Add new question responses
      updatedClient.questionResponses = [
        ...(updatedClient.questionResponses || []),
        ...data.questionResponses,
      ];

      // Ensure outstanding object exists
      updatedClient.outstanding = updatedClient.outstanding || {
        documentRequestIds: [],
        questionIds: [],
        attestationDocumentIds: [],
        partyIds: [],
        partyRoles: [],
      };

      // Remove answered question IDs from outstanding
      const answeredQuestionIds = data.questionResponses.map(
        (response) => response.questionId,
      );
      updatedClient.outstanding.questionIds = (
        updatedClient.outstanding.questionIds || []
      ).filter((id) => !answeredQuestionIds.includes(id));
    }

    // Handle adding new attestations if present
    if (data.addAttestations) {
      // Add new attestations
      updatedClient.attestations = [
        ...(updatedClient.attestations || []),
        ...data.addAttestations,
      ];

      // Ensure outstanding object exists
      updatedClient.outstanding = updatedClient.outstanding || {
        documentRequestIds: [],
        questionIds: [],
        attestationDocumentIds: [],
        partyIds: [],
        partyRoles: [],
      };

      // Remove attested document IDs from outstanding
      const attestedDocumentIds = data.addAttestations.map(
        (attestation) => attestation.documentId,
      );
      updatedClient.outstanding.attestationDocumentIds = (
        updatedClient.outstanding.attestationDocumentIds || []
      ).filter((id) => !attestedDocumentIds.includes(id));
    }

    // Handle removing attestations if present
    if (data.removeAttestations) {
      const attestationIdsToRemove = data.removeAttestations.map(
        (a) => a.documentId,
      );
      updatedClient.attestations = (updatedClient.attestations || []).filter(
        (a) => !attestationIdsToRemove.includes(a.documentId),
      );

      // Ensure outstanding object exists
      updatedClient.outstanding = updatedClient.outstanding || {
        documentRequestIds: [],
        questionIds: [],
        attestationDocumentIds: [],
        partyIds: [],
        partyRoles: [],
      };

      // Add removed attestation IDs back to outstanding
      updatedClient.outstanding.attestationDocumentIds = [
        ...(updatedClient.outstanding.attestationDocumentIds || []),
        ...attestationIdsToRemove,
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

  http.get('/ef/do/v1/documents/:documentId/file', () => {
    // This is a minimal valid PDF file encoded in base64
    const pdfBase64 =
      'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G';

    return new HttpResponse(
      Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0)),
      {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="sample.pdf"',
        },
      },
    );
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

  http.post('/ef/do/v1/documents', async ({ request }) => {
    const data = await request.json();
    const documentId = Math.random().toString(36).substring(7);

    // Create a mock document response
    const documentResponse = {
      id: documentId,
      status: 'ACTIVE',
      documentType: data.documentType,
      fileName: data.fileName,
      mimeType: data.mimeType,
      createdAt: new Date().toISOString(),
      metadata: data.metadata || {},
    };

    return HttpResponse.json(documentResponse, { status: 201 });
  }),

  http.post(
    '/ef/do/v1/document-requests/:documentRequestId/submit',
    async ({ params }) => {
      const { documentRequestId } = params;

      // Find the document request
      const documentRequest = db.documentRequest.findFirst({
        where: { id: { equals: documentRequestId } },
      });

      if (!documentRequest) {
        return new HttpResponse(null, { status: 404 });
      }

      // Update document request status
      const updatedRequest = db.documentRequest.update({
        where: { id: { equals: documentRequestId } },
        data: {
          ...documentRequest,
          status: 'SUBMITTED',
        },
      });

      // Find the associated client
      const client = db.client.findFirst({
        where: { id: { equals: documentRequest.clientId } },
      });

      if (client) {
        // Remove document request ID from client's outstanding block
        const updatedClient = {
          ...client,
          outstanding: {
            ...client.outstanding,
            documentRequestIds: (
              client.outstanding?.documentRequestIds || []
            ).filter((id) => id !== documentRequestId),
          },
        };

        // Check if there are any remaining document requests
        const hasOutstandingDocRequests =
          updatedClient.outstanding.documentRequestIds.length > 0;

        // Check if there are any parties with outstanding validation
        const parties = updatedClient.parties
          .map((partyId) =>
            db.party.findFirst({ where: { id: { equals: partyId } } }),
          )
          .filter(Boolean);

        const hasPartyValidationPending = parties.some((party) =>
          (party.validationResponse || []).some(
            (validation) => validation.validationStatus === 'NEEDS_INFO',
          ),
        );

        // If no outstanding requests and no pending validations, update client status
        if (!hasOutstandingDocRequests && !hasPartyValidationPending) {
          updatedClient.status = 'REVIEW_IN_PROGRESS';
        }

        // Update client
        db.client.update({
          where: { id: { equals: client.id } },
          data: updatedClient,
        });
      }

      // If associated with a party, update party's validation response
      if (documentRequest.partyId) {
        const party = db.party.findFirst({
          where: { id: { equals: documentRequest.partyId } },
        });

        if (party) {
          const updatedParty = {
            ...party,
            validationResponse: (party.validationResponse || [])
              .map((validation) => ({
                ...validation,
                documentRequestIds: validation.documentRequestIds.filter(
                  (id) => id !== documentRequestId,
                ),
              }))
              .filter((validation) => validation.documentRequestIds.length > 0),
          };

          // Update party
          db.party.delete({
            where: { id: { equals: party.id } },
          });
          db.party.create(updatedParty);
        }
      }

      logDbState('Document Request Submission');
      return HttpResponse.json(updatedRequest);
    },
  ),

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
