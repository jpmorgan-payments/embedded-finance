import { http, HttpResponse, type RequestHandler } from 'msw';

import {
  createMaintenanceDemoClient,
  createMaintenanceDemoProposals,
  MAINTENANCE_ATTESTATION_DOCUMENT_ID,
  MAINTENANCE_DEMO_CLIENT_ID,
} from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import type {
  ClientProductUpdate,
  ClientResponse,
  KycUpdateRequest,
  KycUpdateRequestStatus,
  ListKycPartyUpdateRequests,
  MaintenancePartyCreate,
  MaintenancePartyUpdate,
  PartyResponse,
  ProductDetailsStatusItem,
} from '@/components/client-maintenance/models/maintenance-api';
import { buildMaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';

type UpdateClientRequest = {
  productDetails?: ClientProductUpdate['productDetails'];
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
  clientProductProposal?: {
    productDetails: ProductDetailsStatusItem[];
    updateRequest: KycUpdateRequest;
  };
  proposals: PartyResponse[];
  nextPartyId: number;
  nextRequestId: number;
};

function createState(): DemoState {
  return {
    client: createMaintenanceDemoClient(),
    proposals: createMaintenanceDemoProposals(),
    nextPartyId: 2000000558,
    nextRequestId: 4000001049,
  };
}

function getClientResponse(state: DemoState): ClientResponse {
  const client = structuredClone(state.client);
  if (!state.clientProductProposal) return client;
  return {
    ...client,
    productDetails: [
      ...(client.productDetails ?? []),
      ...structuredClone(state.clientProductProposal.productDetails),
    ],
    updateRequest: structuredClone(state.clientProductProposal.updateRequest),
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

function conflict(message: string) {
  return HttpResponse.json(
    {
      title: 'Conflict',
      httpStatus: 409,
      context: [{ message }],
    },
    { status: 409 }
  );
}

function resolveDraftRequest(
  state: DemoState
):
  | { requestId: string; response?: never }
  | { requestId?: never; response: ReturnType<typeof conflict> } {
  const openRequests = [
    ...state.proposals.flatMap((party) =>
      isOpenStatus(party.updateRequest?.status) && party.updateRequest
        ? [party.updateRequest]
        : []
    ),
    ...(isOpenStatus(state.clientProductProposal?.updateRequest.status) &&
    state.clientProductProposal?.updateRequest
      ? [state.clientProductProposal.updateRequest]
      : []),
  ];
  const requestIds = new Set(
    openRequests.flatMap((request) =>
      request.requestId ? [request.requestId] : []
    )
  );
  if (requestIds.size > 1) {
    return {
      response: conflict('More than one open request was found.'),
    };
  }
  if (openRequests.some((request) => request.status !== 'NEW')) {
    return {
      response: conflict(
        'No further edits are allowed after the request is submitted.'
      ),
    };
  }
  return {
    requestId:
      requestIds.values().next().value ?? String(state.nextRequestId++),
  };
}

function requireAttestation(state: DemoState): void {
  if (
    !state.client.outstanding.attestationDocumentIds.includes(
      MAINTENANCE_ATTESTATION_DOCUMENT_ID
    )
  ) {
    state.client.outstanding.attestationDocumentIds.push(
      MAINTENANCE_ATTESTATION_DOCUMENT_ID
    );
  }
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
      return HttpResponse.json(getClientResponse(state));
    }),

    http.post(`${baseUrl}/parties`, async ({ request }) => {
      const party = (await request.json()) as MaintenancePartyCreate;
      const parentExists = state.client.parties.some(
        (candidate) =>
          candidate.id === party.parentPartyId && candidate.active !== false
      );
      if (!parentExists) return new HttpResponse(null, { status: 404 });

      const draft = resolveDraftRequest(state);
      if ('response' in draft) return draft.response;

      const created: PartyResponse = {
        ...party,
        id: String(state.nextPartyId++),
        active: true,
        profileStatus: 'APPROVED',
        updateRequest: {
          action: 'ADD',
          requestId: draft.requestId,
          status: 'NEW',
          submittedAt: new Date().toISOString(),
        },
      };
      state.proposals.push(created);
      requireAttestation(state);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch(`${baseUrl}/parties/:partyId`, async ({ params, request }) => {
      const partyId = String(params.partyId);
      const approvedParty = state.client.parties.find(
        (party) => party.id === partyId
      );
      if (!approvedParty) return new HttpResponse(null, { status: 404 });

      const draft = resolveDraftRequest(state);
      if ('response' in draft) return draft.response;

      const update = (await request.json()) as MaintenancePartyUpdate;
      const requestId = draft.requestId;
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
      requireAttestation(state);
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
      if (update.productDetails?.length) {
        const draft = resolveDraftRequest(state);
        if ('response' in draft) return draft.response;
        state.clientProductProposal = {
          productDetails: update.productDetails.map((detail) => ({
            product: detail.product,
            subProduct: detail.subProduct,
            onboardingStatus: 'NEW',
          })),
          updateRequest: {
            action: 'MODIFY',
            requestId: draft.requestId,
            status: 'NEW',
            submittedAt: new Date().toISOString(),
          },
        };
        requireAttestation(state);
      }
      const documentIds = new Set(
        update.addAttestations?.map((attestation) => attestation.documentId) ??
          []
      );
      state.client.outstanding.attestationDocumentIds =
        state.client.outstanding.attestationDocumentIds.filter(
          (documentId) => !documentIds.has(documentId)
        );
      return HttpResponse.json(getClientResponse(state));
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
        !state.proposals.some(
          (party) => party.updateRequest?.status === 'NEW'
        ) &&
        state.clientProductProposal?.updateRequest.status !== 'NEW'
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
      if (state.clientProductProposal?.updateRequest.status === 'NEW') {
        state.clientProductProposal = {
          productDetails: state.clientProductProposal.productDetails.map(
            (detail) => ({
              ...detail,
              onboardingStatus: 'REVIEW_IN_PROGRESS',
            })
          ),
          updateRequest: {
            ...state.clientProductProposal.updateRequest,
            status: 'REVIEW_IN_PROGRESS',
          },
        };
      }
      return HttpResponse.json(
        { acceptedAt: new Date().toISOString() },
        { status: 202 }
      );
    }),

    http.post(`${baseUrl}/_maintenance-demo/approve`, () => {
      const projection = buildMaintenanceProjection(
        getClientResponse(state),
        state.proposals
      );
      state.client = {
        ...projection.proposedClient,
        status: 'APPROVED',
        updateRequest: undefined,
        productDetails: projection.proposedClient.productDetails?.map(
          (detail) => ({ ...detail, onboardingStatus: 'APPROVED' })
        ),
        parties: projection.proposedClient.parties.map((party) => ({
          ...party,
          profileStatus: 'APPROVED',
        })),
      };
      state.clientProductProposal = undefined;
      state.proposals = setActiveStatuses(state.proposals, 'APPROVED');
      return HttpResponse.json(getClientResponse(state));
    }),

    http.post(`${baseUrl}/_maintenance-demo/reset`, () => {
      state = createState();
      return HttpResponse.json(getClientResponse(state));
    }),
  ];
}
