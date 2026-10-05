import { http, HttpResponse, type HttpHandler } from 'msw';

import type {
  ClientResponseOutstanding,
  KycUpdateRequest,
  KycUpdateRequestStatus,
} from '@/api/generated/smbdo.schemas';

import type {
  MaintenanceClient,
  MaintenanceParty,
  MaintenanceProductDetail,
} from '../../models/maintenanceApi.types';

export const STORY_CLIENT_ID = '0030000131';
export const STORY_REQUEST_ID = 'maintenance-2026-00482';
const STORY_SUBMITTED_AT = '2026-09-28T15:30:00.000Z';

export type StoryDocumentRequest = {
  id: string;
  partyId?: string;
  status: 'ACTIVE' | 'CLOSED';
  description: string;
  requirements: Array<{
    description?: string;
    documentTypes: string[];
    minRequired: number;
    optional?: boolean;
  }>;
};

export type StoryQuestion = {
  id: string;
  label: string;
  description?: string;
  /** Omit for free text. */
  options?: string[];
};

export type MaintenanceStoryScenario = {
  client: MaintenanceClient;
  /** Sparse party proposals returned by GET /maintenance-requests. */
  proposals?: MaintenanceParty[];
  /** Status of a pending Limited DDA Payments addition, if any. */
  productUpgrade?: KycUpdateRequestStatus;
  documentRequests?: StoryDocumentRequest[];
  questions?: StoryQuestion[];
  attestationDocumentIds?: string[];
  /** Outstanding items beyond those derived from documents, questions, and attestations. */
  outstanding?: Pick<ClientResponseOutstanding, 'partyIds' | 'partyRoles'>;
  failClientLoad?: boolean;
};

export const pendingUpdate = (
  status: KycUpdateRequestStatus = 'NEW',
  action: KycUpdateRequest['action'] = 'MODIFY',
  requestId = STORY_REQUEST_ID
): KycUpdateRequest => ({
  status,
  action,
  requestId,
  submittedAt: STORY_SUBMITTED_AT,
});

export const identityDocumentRequest = (
  partyId: string,
  name: string
): StoryDocumentRequest => ({
  id: `document-${partyId}`,
  partyId,
  status: 'ACTIVE',
  description: `Provide a current government-issued photo ID for ${name}.`,
  requirements: [
    {
      description: `Passport or driver's license showing ${name}'s current legal name`,
      documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
      minRequired: 1,
    },
  ],
});

const isActiveStatus = (status?: KycUpdateRequestStatus) =>
  status === 'NEW' ||
  status === 'REVIEW_IN_PROGRESS' ||
  status === 'INFORMATION_REQUESTED';

// A one-page PDF so attestation stories can open a document.
const ATTESTATION_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 58>>stream
BT /F1 18 Tf 72 720 Td (Beneficial ownership attestation) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

/**
 * Stateful MSW handlers for one story. Writes behave like the API: party
 * PATCHes become sparse proposals, uploads close document requests, answers
 * and attestations clear outstanding items, and verification submits.
 */
export function createMaintenanceStoryHandlers(
  scenario: MaintenanceStoryScenario
): HttpHandler[] {
  let proposals = [...(scenario.proposals ?? [])];
  let productUpgrade = scenario.productUpgrade;
  let nextPartyId = 2290000001;
  const documentRequests = structuredClone(scenario.documentRequests ?? []);
  const answeredQuestionIds = new Set<string>();
  const attestedDocumentIds = new Set<string>();
  const approvedParties = scenario.client.parties ?? [];

  const getClient = (): MaintenanceClient => {
    const openDocuments = documentRequests.filter(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
    const activeStatus = proposals.find((proposal) =>
      isActiveStatus(proposal.updateRequest?.status)
    )?.updateRequest?.status;
    return {
      ...scenario.client,
      parties: approvedParties.map((party) => {
        const documentRequestIds = openDocuments
          .filter((documentRequest) => documentRequest.partyId === party.id)
          .map((documentRequest) => documentRequest.id);
        return documentRequestIds.length > 0
          ? {
              ...party,
              validationResponse: [
                ...(party.validationResponse ?? []),
                {
                  validationStatus: 'NEEDS_INFO',
                  validationType: 'ENTITY_VALIDATION',
                  documentRequestIds,
                },
              ],
            }
          : party;
      }),
      productDetails: [
        ...(scenario.client.productDetails ?? []),
        ...(productUpgrade
          ? [
              {
                product: 'EMBEDDED_PAYMENTS',
                subProduct: 'LIMITED_DDA_PAYMENTS',
                action: 'ADD',
                onboardingStatus: productUpgrade,
              } satisfies MaintenanceProductDetail,
            ]
          : []),
      ],
      outstanding: {
        partyIds: [
          ...new Set([
            ...openDocuments.flatMap((documentRequest) =>
              documentRequest.partyId ? [documentRequest.partyId] : []
            ),
            ...(scenario.outstanding?.partyIds ?? []),
          ]),
        ],
        partyRoles: scenario.outstanding?.partyRoles ?? [],
        documentRequestIds: openDocuments
          .filter((documentRequest) => !documentRequest.partyId)
          .map((documentRequest) => documentRequest.id),
        questionIds: (scenario.questions ?? [])
          .map((question) => question.id)
          .filter((questionId) => !answeredQuestionIds.has(questionId)),
        attestationDocumentIds: (scenario.attestationDocumentIds ?? []).filter(
          (documentId) => !attestedDocumentIds.has(documentId)
        ),
      },
      updateRequest: activeStatus
        ? { status: activeStatus, requestId: STORY_REQUEST_ID }
        : scenario.client.updateRequest,
    };
  };

  return [
    http.get('/clients/:clientId', () =>
      scenario.failClientLoad
        ? HttpResponse.json(
            { title: 'Service unavailable', httpStatus: 503 },
            { status: 503 }
          )
        : HttpResponse.json(getClient())
    ),
    http.get('/maintenance-requests', ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 25);
      return HttpResponse.json({
        parties: page === 0 ? proposals : [],
        metadata: { page, limit, total: proposals.length },
      });
    }),
    http.get('/document-requests', () =>
      HttpResponse.json({ documentRequests })
    ),
    http.get('/document-requests/:documentRequestId', ({ params }) => {
      const documentRequest = documentRequests.find(
        (candidate) => candidate.id === params.documentRequestId
      );
      return documentRequest
        ? HttpResponse.json({ ...documentRequest, clientId: STORY_CLIENT_ID })
        : new HttpResponse(null, { status: 404 });
    }),
    http.post('/documents', () =>
      HttpResponse.json(
        { id: crypto.randomUUID(), status: 'ACTIVE' },
        { status: 201 }
      )
    ),
    http.post('/document-requests/:documentRequestId/submit', ({ params }) => {
      const documentRequest = documentRequests.find(
        (candidate) => candidate.id === params.documentRequestId
      );
      if (!documentRequest) return new HttpResponse(null, { status: 404 });
      documentRequest.status = 'CLOSED';
      return HttpResponse.json(documentRequest);
    }),
    http.get('/questions', ({ request }) => {
      const questionIds = (
        new URL(request.url).searchParams.get('questionIds') ?? ''
      ).split(',');
      return HttpResponse.json({
        questions: (scenario.questions ?? [])
          .filter((question) => questionIds.includes(question.id))
          .map((question) => ({
            id: question.id,
            content: [
              {
                label: question.label,
                description: question.description,
                locale: 'en-US',
              },
            ],
            responseSchema: {
              items: question.options
                ? { type: 'string', enum: question.options }
                : { type: 'string' },
            },
          })),
      });
    }),
    http.get(
      '/documents/:documentId/file',
      () =>
        new HttpResponse(ATTESTATION_PDF, {
          headers: { 'Content-Type': 'application/pdf' },
        })
    ),
    http.patch('/clients/:clientId', async ({ request }) => {
      const body = (await request.json()) as {
        productDetails?: Array<{ subProduct?: string; action?: string }>;
        questionResponses?: Array<{ questionId: string }>;
        addAttestations?: Array<{ documentId: string }>;
      };
      const productCommand = body.productDetails?.find(
        (detail) => detail.subProduct === 'LIMITED_DDA_PAYMENTS'
      );
      if (productCommand) {
        productUpgrade = productCommand.action === 'REMOVE' ? undefined : 'NEW';
      }
      body.questionResponses?.forEach((response) =>
        answeredQuestionIds.add(response.questionId)
      );
      body.addAttestations?.forEach((attestation) =>
        attestedDocumentIds.add(attestation.documentId)
      );
      return HttpResponse.json(getClient());
    }),
    http.patch('/parties/:partyId', async ({ request, params }) => {
      const body = (await request.json()) as MaintenanceParty;
      const partyId = String(params.partyId);
      const pendingParty = proposals.find((party) => party.id === partyId);
      const nextProposal: MaintenanceParty = {
        ...pendingParty,
        ...body,
        id: partyId,
        individualDetails:
          body.individualDetails || pendingParty?.individualDetails
            ? {
                ...pendingParty?.individualDetails,
                ...body.individualDetails,
              }
            : undefined,
        organizationDetails:
          body.organizationDetails || pendingParty?.organizationDetails
            ? {
                ...pendingParty?.organizationDetails,
                ...body.organizationDetails,
              }
            : undefined,
        updateRequest: pendingUpdate(
          'NEW',
          pendingParty?.updateRequest?.action === 'ADD' ? 'ADD' : 'MODIFY'
        ),
      };
      proposals = [
        ...proposals.filter((proposal) => proposal.id !== partyId),
        nextProposal,
      ];
      // Like the API, the PATCH response keeps persisted values.
      return HttpResponse.json({
        ...approvedParties.find((party) => party.id === partyId),
        updateRequest: nextProposal.updateRequest,
      });
    }),
    http.post('/parties', async ({ request }) => {
      const body = (await request.json()) as MaintenanceParty;
      const nextProposal: MaintenanceParty = {
        ...body,
        id: String(nextPartyId++),
        updateRequest: pendingUpdate('NEW', 'ADD'),
      };
      proposals = [...proposals, nextProposal];
      return HttpResponse.json(nextProposal, { status: 201 });
    }),
    http.delete('/maintenance-requests/:requestId', ({ request }) => {
      const partyId = new URL(request.url).searchParams.get('partyId');
      const terminated = proposals.filter(
        (proposal) => !partyId || proposal.id === partyId
      );
      proposals = proposals.filter(
        (proposal) => !terminated.includes(proposal)
      );
      return HttpResponse.json({
        parties: terminated.map((proposal) => ({
          ...proposal,
          updateRequest: { ...proposal.updateRequest, status: 'TERMINATED' },
        })),
      });
    }),
    http.post('/clients/:clientId/verifications', () => {
      proposals = proposals.map((proposal) => ({
        ...proposal,
        updateRequest: {
          ...proposal.updateRequest,
          status: 'REVIEW_IN_PROGRESS',
        },
      }));
      if (productUpgrade) productUpgrade = 'REVIEW_IN_PROGRESS';
      return HttpResponse.json(
        { acceptedAt: new Date().toISOString() },
        { status: 202 }
      );
    }),
  ];
}
