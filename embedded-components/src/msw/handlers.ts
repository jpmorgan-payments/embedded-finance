// @ts-nocheck
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efDocumentClientDetail } from '@/mocks/efDocumentClientDetail';
import {
  mockTransactionComplete,
  mockTransactionFee,
  mockTransactionFeeReversal,
  mockTransactionMinimal,
  mockTransactionWithError,
} from '@/mocks/transactions.mock';
import merge from 'lodash/merge';
import { http, HttpResponse } from 'msw';

import { CreateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';

import {
  db,
  dbLogger,
  getActiveRecipients,
  getDbStatus,
  handleMagicValues,
  logDbState,
  resetDb,
  verifyMicrodeposit,
} from './db';

export const handlers = [
  http.get(`*/clients/:clientId`, (req) => {
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

  http.post(`*/clients`, async ({ request }) => {
    const rawData = await request.json();
    if (!rawData || typeof rawData !== 'object') {
      return new HttpResponse(null, {
        status: 400,
        statusText: 'Invalid request body',
      });
    }
    const data: CreateClientRequestSmbdo = rawData as CreateClientRequestSmbdo;

    // Generate client ID starting with '00' followed by 8 random digits
    const newClientId = `00${Math.floor(10000000 + Math.random() * 90000000).toString()}`;
    const timestamp = new Date().toISOString();

    // First create the parties if any
    const partyIds = [];
    if (data && data.parties && Array.isArray(data.parties)) {
      for (const partyData of data.parties) {
        // Generate party ID starting with '2' followed by 9 random digits
        const newPartyId = `2${Math.floor(100000000 + Math.random() * 900000000).toString()}`;
        const newParty = {
          id: newPartyId,
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
      status: 'NEW',
      createdAt: timestamp,
      partyId: partyIds[0] || null, // Set first party as primary if exists
      parties: partyIds,
      products: data?.products || ['EMBEDDED_PAYMENTS'],
      outstanding: {
        documentRequestIds: [],
        questionIds: ['30005', '30158'],
        attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
        partyIds: [],
        partyRoles: [],
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

  http.post(`*/clients/:clientId`, async ({ request, params }) => {
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
    const updatedClient = { ...existingClient };

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
        const newPartyId = `2${Math.floor(100000000 + Math.random() * 900000000).toString()}`;

        // Create the new party with required fields
        const newParty = {
          id: newPartyId,
          active: true,
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
      // Get existing responses without the ones we're updating
      const existingResponses = (updatedClient.questionResponses || []).filter(
        (existing) =>
          !data.questionResponses.some(
            (incoming) => incoming.questionId === existing.questionId
          )
      );

      // Combine existing responses (minus the updated ones) with new responses
      updatedClient.questionResponses = [
        ...existingResponses,
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
        (response) => response.questionId
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
        (attestation) => attestation.documentId
      );
      updatedClient.outstanding.attestationDocumentIds = (
        updatedClient.outstanding.attestationDocumentIds || []
      ).filter((id) => !attestedDocumentIds.includes(id));
    }

    // Handle removing attestations if present
    if (data.removeAttestations) {
      const attestationIdsToRemove = data.removeAttestations.map(
        (a) => a.documentId
      );
      updatedClient.attestations = (updatedClient.attestations || []).filter(
        (a) => !attestationIdsToRemove.includes(a.documentId)
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

  http.post('*/parties/:partyId', async ({ request, params }) => {
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

    // Use lodash merge for deep merging, but handle roles separately
    const { roles: newRoles, ...restData } = data;
    const { roles: existingRoles, ...restExisting } = existingParty;

    // Merge everything except roles
    const mergedData = merge({}, restExisting, restData);

    // Add roles back, preferring the new roles if provided
    const finalData = {
      ...mergedData,
      roles: newRoles || existingRoles,
    };

    // Create a new party with the merged data
    const updatedParty = db.party.create({
      ...finalData,
      id: partyId, // Ensure we keep the same ID
    });

    logDbState('Party Update');
    return HttpResponse.json(updatedParty);
  }),

  http.get('/questions', (req) => {
    const url = new URL(req.request.url);
    const questionIds = url.searchParams.get('questionIds');
    return HttpResponse.json({
      metadata: efClientQuestionsMock.metadata,
      questions: efClientQuestionsMock?.questions.filter((q) =>
        questionIds?.includes(q.id)
      ),
    });
  }),

  http.get('/documents/:documentId', () => {
    return HttpResponse.json(efDocumentClientDetail);
  }),

  http.get('/documents/:documentId/file', () => {
    // This is a minimal valid PDF file with "Sample PDF" text, encoded in base64
    const pdfBase64 =
      'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBwYWdlIGNvbnRlbnQKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAo3MCA1MCBURCAKL0YxIDI0IFRmCihTYW1wbGUgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA3OSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAzMDEgMDAwMDAgbiAKMDAwMDAwMDM4MCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0Y=';

    return new HttpResponse(
      Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0)),
      {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="sample.pdf"',
        },
      }
    );
  }),

  http.get('/document-requests/:documentRequestId', (req) => {
    const { documentRequestId } = req.params;
    const documentRequest = db.documentRequest.findFirst({
      where: { id: { equals: documentRequestId } },
    });

    if (!documentRequest) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(documentRequest);
  }),

  http.post('/documents', async ({ request }) => {
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
    '/document-requests/:documentRequestId/submit',
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
            db.party.findFirst({ where: { id: { equals: partyId } } })
          )
          .filter(Boolean);

        const hasPartyValidationPending = parties.some((party) =>
          (party.validationResponse || []).some(
            (validation) => validation.validationStatus === 'NEEDS_INFO'
          )
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
                  (id) => id !== documentRequestId
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
    }
  ),

  http.get('*/clients/:clientId', () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/_reset', () => {
    return HttpResponse.json(resetDb());
  }),

  http.get('/_status', () => {
    return HttpResponse.json(getDbStatus());
  }),

  http.post(
    '*/clients/:clientId/verifications',
    async ({ request, params }) => {
      const { clientId } = params;
      const data = await request.json();

      const verificationResponse = handleMagicValues(clientId, data);
      if (!verificationResponse) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(verificationResponse);
    }
  ),

  // Recipient endpoints
  http.get('/recipients', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    // Get active recipients (filter out INACTIVE and REJECTED)
    const recipients = getActiveRecipients(clientId || undefined);

    return HttpResponse.json({
      recipients,
      page: 0,
      limit: 100,
      total_items: recipients.length,
    });
  }),

  http.get('/recipients/:id', ({ params }) => {
    const { id } = params;
    const recipient = db.recipient.findFirst({
      where: { id: { equals: id } },
    });

    if (!recipient) {
      return HttpResponse.json(
        {
          httpStatus: 404,
          title: 'Recipient not found',
          context: [],
        },
        { status: 404 }
      );
    }

    // Don't return INACTIVE or REJECTED recipients
    if (recipient.status === 'INACTIVE' || recipient.status === 'REJECTED') {
      return HttpResponse.json(
        {
          httpStatus: 404,
          title: 'Recipient not found',
          context: [],
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(recipient);
  }),

  http.post(
    '/recipients/:id/verify-microdeposit',
    async ({ params, request }) => {
      const { id } = params;
      const body = await request.json();
      const amounts = body?.amounts || [];

      if (!Array.isArray(amounts) || amounts.length !== 2) {
        return HttpResponse.json(
          {
            httpStatus: 400,
            title: 'Invalid amounts provided',
            context: [
              {
                field: 'amounts',
                reason: 'Must provide exactly 2 amounts',
              },
            ],
          },
          { status: 400 }
        );
      }

      const result = verifyMicrodeposit(id as string, amounts);

      if (result.error) {
        return HttpResponse.json(result.error, {
          status: result.error.httpStatus,
        });
      }

      return HttpResponse.json(result);
    }
  ),

  http.post('/recipients', async ({ request }) => {
    const body = await request.json();
    const timestamp = new Date().toISOString();
    const newRecipientId = `recipient-${Date.now()}`;

    const newRecipient = {
      id: newRecipientId,
      type: body?.type || 'LINKED_ACCOUNT',
      status: 'MICRODEPOSITS_INITIATED',
      clientId: body?.clientId,
      partyDetails: body?.partyDetails || {},
      account: body?.account || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      verificationAttempts: 0,
    };

    db.recipient.create(newRecipient);
    logDbState('Recipient Created');

    return HttpResponse.json(newRecipient, { status: 201 });
  }),

  http.post('/recipients/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    dbLogger('[MSW] POST /recipients/:id called with:', { id, body });

    const recipient = db.recipient.findFirst({
      where: { id: { equals: id } },
    });

    if (!recipient) {
      dbLogger('[MSW] Recipient not found with ID:', id);
      const allRecipients = db.recipient.getAll();
      dbLogger(
        '[MSW] Available recipients:',
        allRecipients.map((r) => ({ id: r.id, status: r.status }))
      );

      return HttpResponse.json(
        {
          httpStatus: 404,
          title: 'Recipient not found',
        },
        { status: 404 }
      );
    }

    dbLogger('[MSW] Found recipient before update:', recipient);

    const updatedRecipient = db.recipient.update({
      where: { id: { equals: id } },
      data: {
        ...recipient,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });

    dbLogger('[MSW] Updated recipient:', updatedRecipient);
    logDbState('Recipient Updated');

    return HttpResponse.json(updatedRecipient);
  }),

  http.delete('/recipients/:id', ({ params }) => {
    const { id } = params;
    const recipient = db.recipient.findFirst({
      where: { id: { equals: id } },
    });

    if (!recipient) {
      return HttpResponse.json(
        {
          httpStatus: 404,
          title: 'Recipient not found',
        },
        { status: 404 }
      );
    }

    db.recipient.delete({
      where: { id: { equals: id } },
    });

    logDbState('Recipient Deleted');

    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/accounts', () => {
    return HttpResponse.json({
      accounts: [],
      metadata: { total: 0 },
    });
  }),

  http.get('/accounts/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: `Account ${id}`,
      balance: '1000.00',
      currency: 'USD',
    });
  }),

  // Transaction details endpoint
  http.get('/transactions/:id', ({ params }) => {
    const { id } = params;

    // Return different mocks based on transaction ID pattern
    if (typeof id === 'string') {
      if (id.includes('error')) {
        return HttpResponse.json(mockTransactionWithError);
      }
      if (id.includes('minimal')) {
        return HttpResponse.json(mockTransactionMinimal);
      }
      if (id.includes('fee-reversal')) {
        return HttpResponse.json(mockTransactionFeeReversal);
      }
      if (id.includes('fee')) {
        return HttpResponse.json(mockTransactionFee);
      }
      if (id.includes('complete')) {
        return HttpResponse.json(mockTransactionComplete);
      }
    }

    // Default: return complete transaction
    return HttpResponse.json(mockTransactionComplete);
  }),
];
