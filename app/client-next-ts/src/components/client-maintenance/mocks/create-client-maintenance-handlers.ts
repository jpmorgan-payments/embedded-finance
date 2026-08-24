import { http, HttpResponse, type RequestHandler } from 'msw';

import {
  createMaintenanceDemoClient,
  createMaintenanceDemoProposals,
  MAINTENANCE_ATTESTATION_DOCUMENT_ID,
  MAINTENANCE_DEMO_CLIENT_ID,
} from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import type {
  ClientResponse,
  KycUpdateRequestStatus,
  ListKycPartyUpdateRequests,
  MaintenancePartyUpdate,
  PartyResponse,
} from '@/components/client-maintenance/models/maintenance-api';
import { buildMaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';

type UpdateClientRequest = {
  addAttestations?: Array<{
    attester?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    attestationTime: string;
    documentId: string;
    ipAddress: string;
  }>;
};

type DemoState = {
  client: ClientResponse;
  proposals: PartyResponse[];
  nextRequestId: number;
};

function createState(): DemoState {
  return {
    client: createMaintenanceDemoClient(),
    proposals: createMaintenanceDemoProposals(),
    nextRequestId: 4000001050,
  };
}

function listResponse(parties: PartyResponse[]): ListKycPartyUpdateRequests {
  return {
    parties,
    metadata: { page: 0, limit: 25, total: parties.length },
  };
}

function setActiveStatuses(
  proposals: PartyResponse[],
  status: KycUpdateRequestStatus
): PartyResponse[] {
  return proposals.map((party) => {
    const currentStatus = party.updateRequest?.status;
    if (
      currentStatus !== 'NEW' &&
      currentStatus !== 'REVIEW_IN_PROGRESS' &&
      currentStatus !== 'INFORMATION_REQUESTED'
    ) {
      return party;
    }
    return {
      ...party,
      updateRequest: { ...party.updateRequest, status },
    };
  });
}

function isOpenStatus(status: KycUpdateRequestStatus | undefined): boolean {
  return (
    status === 'NEW' ||
    status === 'REVIEW_IN_PROGRESS' ||
    status === 'INFORMATION_REQUESTED'
  );
}

export function createClientMaintenanceHandlers(
  apiUrl: string
): RequestHandler[] {
  let state = createState();
  const baseUrl = `${apiUrl}/onboarding/v1`;

  return [
    http.get(`${baseUrl}/clients/:clientId`, ({ params }) => {
      if (params.clientId !== MAINTENANCE_DEMO_CLIENT_ID) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(state.client);
    }),

    http.patch(`${baseUrl}/parties/:partyId`, async ({ params, request }) => {
      const partyId = String(params.partyId);
      const approvedParty = state.client.parties.find(
        (party) => party.id === partyId
      );
      if (!approvedParty) return new HttpResponse(null, { status: 404 });

      const openProposals = state.proposals.filter((party) =>
        isOpenStatus(party.updateRequest?.status)
      );
      const openRequestIds = new Set(
        openProposals.flatMap((party) =>
          party.updateRequest?.requestId ? [party.updateRequest.requestId] : []
        )
      );
      if (openRequestIds.size > 1) {
        return HttpResponse.json(
          {
            title: 'Conflict',
            httpStatus: 409,
            context: [{ message: 'More than one open request was found.' }],
          },
          { status: 409 }
        );
      }
      if (
        openProposals.some((party) => party.updateRequest?.status !== 'NEW')
      ) {
        return HttpResponse.json(
          {
            title: 'Conflict',
            httpStatus: 409,
            context: [
              {
                message:
                  'No further edits are allowed after the request is submitted.',
              },
            ],
          },
          { status: 409 }
        );
      }

      const update = (await request.json()) as MaintenancePartyUpdate;
      const requestId =
        openRequestIds.values().next().value ?? String(state.nextRequestId++);
      const existingIndex = state.proposals.findIndex(
        (party) =>
          party.id === partyId &&
          party.updateRequest?.requestId === requestId &&
          party.updateRequest.status === 'NEW'
      );
      const existing =
        existingIndex >= 0 ? state.proposals[existingIndex] : undefined;
      const proposal: PartyResponse = {
        ...existing,
        ...update,
        id: partyId,
        individualDetails: update.individualDetails
          ? { ...existing?.individualDetails, ...update.individualDetails }
          : existing?.individualDetails,
        organizationDetails: update.organizationDetails
          ? { ...existing?.organizationDetails, ...update.organizationDetails }
          : existing?.organizationDetails,
        updateRequest: {
          action: 'MODIFY',
          requestId,
          status: 'NEW',
          submittedAt: new Date().toISOString(),
        },
      };
      if (existingIndex >= 0) state.proposals[existingIndex] = proposal;
      else state.proposals.push(proposal);
      if (
        !state.client.outstanding.attestationDocumentIds.includes(
          MAINTENANCE_ATTESTATION_DOCUMENT_ID
        )
      ) {
        state.client.outstanding.attestationDocumentIds.push(
          MAINTENANCE_ATTESTATION_DOCUMENT_ID
        );
      }
      return HttpResponse.json({
        ...structuredClone(approvedParty),
        updateRequest: proposal.updateRequest,
      });
    }),

    http.get(`${baseUrl}/maintenance-requests`, ({ request }) => {
      const url = new URL(request.url);
      const clientId = url.searchParams.get('clientId');
      const partyId = url.searchParams.get('partyId');
      if ((clientId && partyId) || (!clientId && !partyId)) {
        return HttpResponse.json(
          { title: 'Bad Request', httpStatus: 400 },
          { status: 400 }
        );
      }
      if (clientId && clientId !== MAINTENANCE_DEMO_CLIENT_ID) {
        return new HttpResponse(null, { status: 404 });
      }
      const parties = partyId
        ? state.proposals.filter((party) => party.id === partyId)
        : state.proposals;
      return HttpResponse.json(listResponse(parties));
    }),

    http.get(`${baseUrl}/maintenance-requests/:requestId`, ({ params }) => {
      const parties = state.proposals.filter(
        (party) => party.updateRequest?.requestId === params.requestId
      );
      if (parties.length === 0) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(listResponse(parties));
    }),

    http.patch(`${baseUrl}/clients/:clientId`, async ({ params, request }) => {
      if (params.clientId !== MAINTENANCE_DEMO_CLIENT_ID) {
        return new HttpResponse(null, { status: 404 });
      }
      const update = (await request.json()) as UpdateClientRequest;
      const documentIds = new Set(
        update.addAttestations?.map((attestation) => attestation.documentId) ??
          []
      );
      state.client.outstanding.attestationDocumentIds =
        state.client.outstanding.attestationDocumentIds.filter(
          (documentId) => !documentIds.has(documentId)
        );
      return HttpResponse.json(state.client);
    }),

    http.post(`${baseUrl}/clients/:clientId/verifications`, ({ params }) => {
      if (params.clientId !== MAINTENANCE_DEMO_CLIENT_ID) {
        return new HttpResponse(null, { status: 404 });
      }
      if (state.client.outstanding.attestationDocumentIds.length > 0) {
        return HttpResponse.json(
          {
            title: 'Unprocessable Entity',
            httpStatus: 422,
            context: [{ message: 'Complete outstanding attestations first.' }],
          },
          { status: 422 }
        );
      }
      if (
        !state.proposals.some((party) => party.updateRequest?.status === 'NEW')
      ) {
        return HttpResponse.json(
          {
            title: 'Unprocessable Entity',
            httpStatus: 422,
            context: [{ message: 'No draft maintenance request was found.' }],
          },
          { status: 422 }
        );
      }
      state.proposals = state.proposals.map((party) =>
        party.updateRequest?.status === 'NEW'
          ? {
              ...party,
              updateRequest: {
                ...party.updateRequest,
                status: 'REVIEW_IN_PROGRESS',
              },
            }
          : party
      );
      return HttpResponse.json(
        { acceptedAt: new Date().toISOString() },
        { status: 202 }
      );
    }),

    http.post(`${baseUrl}/_maintenance-demo/approve`, () => {
      const projection = buildMaintenanceProjection(
        state.client,
        state.proposals
      );
      state.client = {
        ...projection.proposedClient,
        status: 'APPROVED',
        parties: projection.proposedClient.parties.map((party) => ({
          ...party,
          profileStatus: 'APPROVED',
        })),
      };
      state.proposals = setActiveStatuses(state.proposals, 'APPROVED');
      return HttpResponse.json(state.client);
    }),

    http.post(`${baseUrl}/_maintenance-demo/reset`, () => {
      state = createState();
      return HttpResponse.json(state.client);
    }),
  ];
}
