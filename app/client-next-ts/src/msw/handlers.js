import merge from 'lodash/merge';
import { http, HttpResponse } from 'msw';

import { getClientStatusOverrideForScenario } from '../components/sellsense/scenarios-config';
import {
  createMockLinkedAccountsResponse,
  createMockTransactionsResponse,
  efClientQuestionsMock,
  efDocumentClientDetail,
  mockEmptyLinkedAccounts,
  mockEmptyTransactionsResponse,
  mockLinkedAccounts,
  mockRecipientsResponse,
  mockTransactionsResponse,
} from '../mocks';
import {
  mockAccountBalance,
  mockAccountBalance2,
  mockAccounts,
} from '../mocks/accounts.mock';
import {
  createTransactionWithBalanceUpdate,
  db,
  DEFAULT_SCENARIO,
  getDbStatus,
  handleMagicValues,
  logDbState,
  resetDb,
  updateAccountBalance,
  updateTransactionStatus,
} from './db';

export const createHandlers = (apiUrl) => [
  http.get(`${apiUrl}/ef/do/v1/clients/:clientId`, (req) => {
    const { clientId } = req.params;
    const client = db.client.findFirst({
      where: { id: { equals: clientId } },
    });

    if (!client) {
      return new HttpResponse(null, { status: 404 });
    }

    const scenarioDisplayName = req.request.headers.get('X-Scenario');
    const statusOverride = getClientStatusOverrideForScenario(scenarioDisplayName);

    // Expand party references to full party objects
    const expandedClient = {
      ...client,
      ...(statusOverride && { status: statusOverride }),
      // Map party IDs to full party objects
      parties: client.parties
        .map((partyId) => {
          const party = db.party.findFirst({
            where: { id: { equals: partyId } },
          });
          return party ? { ...party, ...(statusOverride && party.id === client.partyId && { profileStatus: statusOverride }) } : null;
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

  http.post(`${apiUrl}/ef/do/v1/clients`, async ({ request }) => {
    const data = await request.json();
    // Generate client ID starting with '00' followed by 8 random digits
    const newClientId =
      '00' + Math.floor(10000000 + Math.random() * 90000000).toString();
    const timestamp = new Date().toISOString();

    // First create the parties if any
    const partyIds = [];
    if (data.parties && Array.isArray(data.parties)) {
      for (const partyData of data.parties) {
        // Generate party ID starting with '2' followed by 9 random digits
        const newPartyId =
          '2' + Math.floor(100000000 + Math.random() * 900000000).toString();
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
        documentRequestIds: [''],
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

  http.post(
    `${apiUrl}/ef/do/v1/clients/:clientId`,
    async ({ request, params }) => {
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
          const newPartyId =
            '2' + Math.floor(100000000 + Math.random() * 900000000).toString();

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
          updatedClient.parties = [
            ...(updatedClient.parties || []),
            newPartyId,
          ];
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
        const existingResponses = (
          updatedClient.questionResponses || []
        ).filter(
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
    }
  ),

  http.post(
    `${apiUrl}/ef/do/v1/parties/:partyId`,
    async ({ request, params }) => {
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
    }
  ),

  http.get(`${apiUrl}/ef/do/v1/questions`, (req) => {
    const url = new URL(req.request.url);
    const questionIds = url.searchParams.get('questionIds');
    return HttpResponse.json({
      metadata: efClientQuestionsMock.metadata,
      questions: efClientQuestionsMock?.questions.filter((q) =>
        questionIds?.includes(q.id)
      ),
    });
  }),

  http.get(`${apiUrl}/ef/do/v1/documents/:documentId`, () => {
    return HttpResponse.json(efDocumentClientDetail);
  }),

  http.get(`${apiUrl}/ef/do/v1/documents/:documentId/file`, () => {
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

  http.get(`${apiUrl}/ef/do/v1/document-requests`, (req) => {
    const url = new URL(req.request.url);
    const clientId = url.searchParams.get('clientId');
    const includeRelatedParty = url.searchParams.get('includeRelatedParty');

    if (!clientId) {
      return new HttpResponse(null, {
        status: 400,
        statusText: 'Bad Request: Missing clientId parameter',
      });
    }

    return HttpResponse.json({
      documentRequests: db.documentRequest.findMany({
        where: { clientId: { equals: clientId } },
      }),
    });
  }),

  http.get(`${apiUrl}/ef/do/v1/document-requests/:documentRequestId`, (req) => {
    const { documentRequestId } = req.params;
    const documentRequest = db.documentRequest.findFirst({
      where: { id: { equals: documentRequestId } },
    });

    if (!documentRequest) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(documentRequest);
  }),

  http.post(`${apiUrl}/ef/do/v1/documents`, async ({ request }) => {
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
    `${apiUrl}/ef/do/v1/document-requests/:documentRequestId/submit`,
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

  http.get(`${apiUrl}/clients/:clientId`, () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.post(`${apiUrl}/ef/do/v1/_reset`, async ({ request }) => {
    try {
      const body = await request.json();
      const scenario = body?.scenario || DEFAULT_SCENARIO;

      return HttpResponse.json(resetDb(scenario));
    } catch (error) {
      // If no body or invalid JSON, use default scenario
      return HttpResponse.json(resetDb(DEFAULT_SCENARIO));
    }
  }),

  http.get(`${apiUrl}/ef/do/v1/_status`, () => {
    const status = getDbStatus();
    const recipients = db.recipient.getAll();
    const linkedAccounts = recipients.filter(
      (r) => r.type === 'LINKED_ACCOUNT'
    );
    const regularRecipients = recipients.filter((r) => r.type === 'RECIPIENT');

    // Determine current scenario based on data
    let currentScenario;
    if (recipients.length === 0) {
      currentScenario = 'empty';
    } else if (linkedAccounts.length > 0 && regularRecipients.length > 0) {
      currentScenario = 'active-with-recipients';
    } else {
      currentScenario = 'active';
    }

    return HttpResponse.json({
      ...status,
      scenario: {
        current: currentScenario,
        linkedAccountsCount: linkedAccounts.length,
        regularRecipientsCount: regularRecipients.length,
      },
    });
  }),

  http.get(`${apiUrl}/ef/do/v1/_scenarios`, () => {
    return HttpResponse.json({
      scenarios: {
        active: {
          name: 'Active',
          description: 'Only linked accounts, no regular recipients',
          recipients: 'linked-accounts-only',
        },
        'active-with-recipients': {
          name: 'Active with Recipients',
          description: 'Both regular recipients and linked accounts (default)',
          recipients: 'all-recipients',
        },
        empty: {
          name: 'Empty',
          description:
            'Empty recipients/transactions, LIMITED_DDA with zero balance',
          recipients: 'no-recipients',
        },
      },
      default: DEFAULT_SCENARIO,
    });
  }),

  http.post(
    `${apiUrl}/ef/do/v1/clients/:clientId/verifications`,
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

  // --- Onboarding Session Transfer Mock Endpoint ---
  http.post(
    `${apiUrl}/api/onboarding/session-transfer`,
    async ({ request }) => {
      // Simulate reading a payload (e.g., { userId: '123' })
      const { userId } = await request.json();
      // Return a mock JWT token
      return HttpResponse.json(
        {
          token: 'mock-jwt-token-12345',
          userId,
          expiresIn: 3600,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  ),

  // Add OPTIONS handler for CORS preflight
  http.options(`${apiUrl}/api/onboarding/session-transfer`, () => {
    return new HttpResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),

  // EF Linked Account Creation
  http.post(`${apiUrl}/ef/do/v1/recipients`, async ({ request }) => {
    const data = await request.json();
    console.log('Creating EF recipient:', data);

    // Generate a unique recipient ID
    const recipientId =
      'c0712fc9-b7d5-4ee2-81bb-' + Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();

    // Determine initial status based on recipient type
    let initialStatus = data.status || 'ACTIVE';
    if (data.type === 'LINKED_ACCOUNT' || data.type === undefined) {
      // Linked accounts should start in microdeposit check state
      initialStatus = 'READY_FOR_VALIDATION';
    }

    // Create the recipient in the database
    const newRecipient = {
      id: recipientId,
      type: data.type || 'LINKED_ACCOUNT',
      status: initialStatus,
      clientId: data.clientId || 'client-001',
      partyDetails: data.partyDetails,
      account: data.account,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      const createdRecipient = db.recipient.create(newRecipient);
      console.log('Created EF recipient:', createdRecipient);

      logDbState('EF Recipient Creation');

      return HttpResponse.json(createdRecipient, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error creating EF recipient:', error);
      return HttpResponse.json(
        { error: 'Failed to create recipient', message: error.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // EF Microdeposit Verification
  http.post(
    `${apiUrl}/ef/do/v1/recipients/:recipientId/verify-microdeposit`,
    async ({ params, request }) => {
      const { recipientId } = params;
      const data = await request.json();

      console.log('Verifying microdeposit for recipient:', recipientId, data);

      // Find the recipient in the database
      const recipient = db.recipient.findFirst({
        where: { id: { equals: recipientId } },
      });

      if (!recipient) {
        return HttpResponse.json(
          { error: 'Recipient not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mock verification logic - in real app this would validate the amounts
      const isValid = data.amounts && data.amounts.length === 2;

      if (isValid) {
        // Update recipient status in database
        const updatedRecipient = db.recipient.update({
          where: { id: { equals: recipientId } },
          data: {
            ...recipient,
            status: 'ACTIVE',
            updatedAt: new Date().toISOString(),
          },
        });

        console.log('Updated recipient status to ACTIVE:', updatedRecipient);
        logDbState('Microdeposit Verification');

        // Return success response
        return HttpResponse.json(
          {
            id: recipientId,
            status: 'ACTIVE',
            message: 'Microdeposit verification successful',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Return error response
        return HttpResponse.json(
          {
            error: 'Invalid microdeposit amounts',
            message: 'The amounts provided do not match our records',
          },
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }
  ),

  // EF Get specific recipient
  http.get(`${apiUrl}/ef/do/v1/recipients/:recipientId`, ({ params }) => {
    const { recipientId } = params;

    console.log('Getting recipient:', recipientId);

    // Find the recipient in the database
    const recipient = db.recipient.findFirst({
      where: { id: { equals: recipientId } },
    });

    if (!recipient) {
      return HttpResponse.json(
        { error: 'Recipient not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found recipient:', recipient);
    return HttpResponse.json(recipient, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  // --- Embedded Components Handlers ---

  // TransactionsDisplay Component Handlers
  http.get(`${apiUrl}/ef/do/v1/transactions`, ({ request }) => {
    console.log('Transactions API call:', request.url);
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const accountId = url.searchParams.get('accountId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    // Get all transactions from database with safety check
    let filteredTransactions = db.transaction.getAll() || [];

    // Filter transactions based on query parameters
    if (accountId) {
      filteredTransactions = filteredTransactions.filter(
        (t) =>
          t.creditorAccountId === accountId || t.debtorAccountId === accountId
      );
    }

    if (status) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.status === status
      );
    }

    if (type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === type
      );
    }

    console.log(
      'Filtered transactions from database:',
      filteredTransactions.length
    );

    // Handle optional pagination - if no page/limit provided, return all transactions
    if (!pageParam && !limitParam) {
      console.log('No pagination params, returning all transactions');
      const response = {
        items: filteredTransactions || [],
        page: 1,
        limit: filteredTransactions.length,
        total_items: filteredTransactions.length,
        total_pages: 1,
      };
      return HttpResponse.json(response, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use pagination if provided
    const page = parseInt(pageParam || '1', 10);
    const limit = parseInt(limitParam || '10', 10);

    console.log('Transactions API call params:', {
      page,
      limit,
      accountId,
      status,
      type,
    });

    // Manual pagination since we're using database
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      endIndex
    );

    const response = {
      items: paginatedTransactions || [],
      page,
      limit,
      total_items: filteredTransactions.length,
      total_pages: Math.ceil(filteredTransactions.length / limit),
    };

    console.log('Transactions response:', response);
    return HttpResponse.json(response, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Add handler for GET /ef/do/v1/transactions/:id using the mock
  http.get(`${apiUrl}/ef/do/v1/transactions/:id`, ({ params }) => {
    const { id } = params;
    const transaction = db.transaction.findFirst({
      where: { id: { equals: id } },
    });
    if (transaction) {
      return HttpResponse.json(transaction, { status: 200 });
    }
    return HttpResponse.json(
      { error: 'Transaction not found' },
      { status: 404 }
    );
  }),

  // Create new transaction with balance updates
  http.post(`${apiUrl}/ef/do/v1/transactions`, async ({ request }) => {
    const data = await request.json();
    console.log('Creating new transaction with balance updates:', data);

    try {
      const createdTransaction = createTransactionWithBalanceUpdate(data);
      console.log(
        'Created transaction with balance updates:',
        createdTransaction
      );

      return HttpResponse.json(createdTransaction, {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return HttpResponse.json(
        { error: 'Failed to create transaction', message: error.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // Recipients Component Handlers
  http.get(`${apiUrl}/ef/do/v1/recipients`, ({ request }) => {
    console.log('Recipients API call:', request.url);
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    console.log('Recipients API call params:', {
      type,
      status,
      pageParam,
      limitParam,
    });

    // Get all recipients from database
    let filteredRecipients = db.recipient.getAll();

    // Filter by type if specified
    if (type) {
      filteredRecipients = filteredRecipients.filter((r) => r.type === type);
    }

    // Filter by status if specified
    if (status) {
      filteredRecipients = filteredRecipients.filter(
        (r) => r.status === status
      );
    }

    console.log(
      'Filtered recipients from database:',
      filteredRecipients.length
    );

    // Handle optional pagination
    // OAS spec: page is 0-based, default to 0 if not provided
    if (!pageParam && !limitParam) {
      console.log('No pagination params, returning all recipients');
      const response = {
        recipients: filteredRecipients,
        page: 0,
        limit: filteredRecipients.length,
        total_items: filteredRecipients.length,
        metadata: {
          page: 0,
          limit: filteredRecipients.length,
          total_items: filteredRecipients.length,
        },
      };
      return HttpResponse.json(response, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // OAS spec: page is 0-based (default to 0), limit defaults to 25
    const page = Math.max(0, parseInt(pageParam || '0', 10));
    const limit = Math.min(25, Math.max(1, parseInt(limitParam || '25', 10)));

    // Manual pagination since we're using database (0-based page indexing)
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex);

    const response = {
      recipients: paginatedRecipients,
      page,
      limit,
      total_items: filteredRecipients.length,
      metadata: {
        page,
        limit,
        total_items: filteredRecipients.length,
      },
    };

    console.log('Final response:', response);
    return HttpResponse.json(response, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // MakePayment Component Handlers - Updated to use database
  http.get(`${apiUrl}/ef/do/v1/accounts`, () => {
    const accounts = db.account.getAll();
    console.log('Retrieved accounts from database:', accounts.length);

    return HttpResponse.json(
      {
        items: accounts,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  http.get(`${apiUrl}/ef/do/v1/accounts/:accountId/balances`, ({ params }) => {
    const { accountId } = params;

    const balance = db.accountBalance.findFirst({
      where: { accountId: { equals: accountId } },
    });

    if (balance) {
      console.log(`Retrieved balance for account ${accountId}:`, balance);
      return HttpResponse.json(balance, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return 404 for unknown account IDs
    console.warn(`No balance found for account ${accountId}`);
    return new HttpResponse(null, { status: 404 });
  }),

  http.get(`${apiUrl}/ef/do/v1/payment-recipients`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // Get payment recipients from database (not linked accounts)
    let filteredRecipients = db.recipient
      .getAll()
      .filter((r) => r.type === 'RECIPIENT');

    if (type) {
      filteredRecipients = filteredRecipients.filter((r) => r.type === type);
    }

    console.log('Payment recipients from database:', filteredRecipients.length);
    return HttpResponse.json(filteredRecipients, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Keep-alive ping handler to prevent service worker termination
  http.get(`${apiUrl}/ping`, () => {
    console.log('MSW Ping received:', new Date().toISOString());
    return HttpResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'MSW service worker is alive',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }),
];
