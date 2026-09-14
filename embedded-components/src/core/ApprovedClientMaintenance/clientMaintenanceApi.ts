import { isAxiosError, type AxiosRequestConfig } from 'axios';

import {
  maintenanceClientSchema,
  maintenanceDocumentRequestListSchema,
  maintenancePageSchema,
  maintenancePartySchema,
  maintenanceQuestionListSchema,
  maintenanceVerificationResponseSchema,
} from './models/maintenanceApi.schemas';
import type {
  MaintenanceClient,
  MaintenanceClientTaskUpdateRequest,
  MaintenanceDocumentRequestSummary,
  MaintenancePage,
  MaintenanceParty,
  MaintenancePartyCreateRequest,
  MaintenancePartyUpdateRequest,
  MaintenanceProductUpdateRequest,
  MaintenanceQuestion,
  MaintenanceVerificationResponse,
} from './models/maintenanceApi.types';
import type { PartyNameUpdateRequest } from './utils/buildPartyNameUpdate';

export type MaintenanceRequest = (
  config: AxiosRequestConfig
) => Promise<unknown>;

export type CompleteMaintenanceRead = {
  pages: MaintenancePage[];
  parties: MaintenanceParty[];
};

type ValidatedPageMetadata = {
  page: number;
  limit: number;
  total: number;
};

type MaintenanceNotFoundData = {
  error?: unknown;
  context?: Array<{ message?: unknown }>;
};

const isMissingMaintenanceRecordError = (error: unknown) => {
  if (!isAxiosError(error) || error.response?.status !== 404) return false;

  const responseData = error.response.data as
    | MaintenanceNotFoundData
    | undefined;
  return (
    responseData?.error === 'NOT_FOUND' &&
    responseData.context?.some(
      ({ message }) =>
        typeof message === 'string' &&
        /KYC Maintenance request with ID: \[.+\] not found/i.test(message)
    ) === true
  );
};

const validatePageMetadata = (
  page: MaintenancePage,
  expectedPage: number,
  requestedLimit: number
): ValidatedPageMetadata => {
  const metadata = page.metadata;
  if (
    metadata?.page !== expectedPage ||
    metadata.total === undefined ||
    (metadata.limit !== undefined && metadata.limit !== requestedLimit)
  ) {
    throw new Error(
      'Maintenance response contains invalid pagination metadata.'
    );
  }
  return {
    page: metadata.page,
    limit: metadata.limit ?? requestedLimit,
    total: metadata.total,
  };
};

const getMaintenancePage = async (
  request: MaintenanceRequest,
  clientId: string,
  pageNumber: number,
  limit: number
) => {
  try {
    const response = await request({
      url: '/maintenance-requests',
      method: 'GET',
      params: { clientId, page: pageNumber, limit },
    });
    return maintenancePageSchema.parse(response) as MaintenancePage;
  } catch (error) {
    if (isMissingMaintenanceRecordError(error)) {
      return {
        parties: [],
        metadata: { page: pageNumber, limit, total: 0 },
      };
    }
    throw error;
  }
};

const getPageProposalFingerprint = (page: MaintenancePage) =>
  JSON.stringify(
    (page.parties ?? []).map((party) => ({
      partyId: party.id,
      requestId: party.updateRequest?.requestId,
      status: party.updateRequest?.status,
      action: party.updateRequest?.action,
      submittedAt: party.updateRequest?.submittedAt,
    }))
  );

export async function getMaintenanceClient(
  request: MaintenanceRequest,
  clientId: string
): Promise<MaintenanceClient> {
  const response = await request({
    url: `/clients/${clientId}`,
    method: 'GET',
  });
  return maintenanceClientSchema.parse(response) as MaintenanceClient;
}

export async function getMaintenanceDocumentRequests(
  request: MaintenanceRequest,
  clientId: string
): Promise<MaintenanceDocumentRequestSummary[]> {
  const response = await request({
    url: '/document-requests',
    method: 'GET',
    params: { clientId, includeRelatedParty: true },
  });
  return maintenanceDocumentRequestListSchema.parse(response)
    .documentRequests as MaintenanceDocumentRequestSummary[];
}

export async function getAllMaintenanceParties(
  request: MaintenanceRequest,
  clientId: string,
  requestedLimit = 25
): Promise<CompleteMaintenanceRead> {
  const firstPage = await getMaintenancePage(
    request,
    clientId,
    0,
    requestedLimit
  );
  const firstMetadata = validatePageMetadata(firstPage, 0, requestedLimit);
  const pageCount = Math.ceil(firstMetadata.total / firstMetadata.limit);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, pageIndex) =>
      getMaintenancePage(request, clientId, pageIndex + 1, firstMetadata.limit)
    )
  );

  remainingPages.forEach((page, pageIndex) => {
    validatePageMetadata(page, pageIndex + 1, firstMetadata.limit);
  });

  const pages = [firstPage, ...remainingPages];
  const parties = pages.flatMap((page) => page.parties ?? []);
  if (parties.length !== firstMetadata.total) {
    throw new Error('Maintenance response is incomplete.');
  }

  const confirmationPage = await getMaintenancePage(
    request,
    clientId,
    0,
    firstMetadata.limit
  );
  const confirmationMetadata = validatePageMetadata(
    confirmationPage,
    0,
    firstMetadata.limit
  );
  if (
    confirmationMetadata.total !== firstMetadata.total ||
    getPageProposalFingerprint(confirmationPage) !==
      getPageProposalFingerprint(firstPage)
  ) {
    throw new Error('Maintenance response changed while pages were loading.');
  }

  return { pages, parties };
}

export async function patchMaintenancePartyName(
  request: MaintenanceRequest,
  partyId: string,
  partyNameUpdate: PartyNameUpdateRequest,
  idempotencyKey: string
): Promise<void> {
  return patchMaintenanceParty(
    request,
    partyId,
    partyNameUpdate,
    idempotencyKey
  );
}

export async function patchMaintenanceParty(
  request: MaintenanceRequest,
  partyId: string,
  partyUpdate: MaintenancePartyUpdateRequest,
  idempotencyKey: string
): Promise<void> {
  await request({
    url: `/parties/${partyId}`,
    method: 'PATCH',
    skipClientIdBodyInjection: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: partyUpdate,
  });
}

export async function createMaintenanceParty(
  request: MaintenanceRequest,
  party: MaintenancePartyCreateRequest,
  idempotencyKey: string
): Promise<MaintenanceParty> {
  const response = await request({
    url: '/parties',
    method: 'POST',
    skipClientIdBodyInjection: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: party,
  });
  return maintenancePartySchema.parse(response) as MaintenanceParty;
}

const updateLimitedDdaPaymentsProduct = async (
  request: MaintenanceRequest,
  clientId: string,
  idempotencyKey: string,
  action: 'ADD' | 'REMOVE'
) => {
  const productUpdate: MaintenanceProductUpdateRequest = {
    productDetails: [
      {
        product: 'EMBEDDED_PAYMENTS',
        subProduct: 'LIMITED_DDA_PAYMENTS',
        action,
      },
    ],
  };
  await request({
    url: `/clients/${clientId}`,
    method: 'PATCH',
    skipClientIdBodyInjection: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: productUpdate,
  });
};

export async function addLimitedDdaPaymentsProduct(
  request: MaintenanceRequest,
  clientId: string,
  idempotencyKey: string
): Promise<void> {
  await updateLimitedDdaPaymentsProduct(
    request,
    clientId,
    idempotencyKey,
    'ADD'
  );
}

export async function cancelLimitedDdaPaymentsAddition(
  request: MaintenanceRequest,
  clientId: string,
  idempotencyKey: string
): Promise<void> {
  await updateLimitedDdaPaymentsProduct(
    request,
    clientId,
    idempotencyKey,
    'REMOVE'
  );
}

export async function cancelMaintenanceRequest(
  request: MaintenanceRequest,
  requestId: string,
  idempotencyKey: string,
  partyId?: string
): Promise<void> {
  await request({
    url: `/maintenance-requests/${requestId}`,
    method: 'DELETE',
    headers: { 'Idempotency-Key': idempotencyKey },
    params: partyId ? { partyId } : undefined,
  });
}

export async function submitMaintenanceVerification(
  request: MaintenanceRequest,
  clientId: string,
  idempotencyKey: string
): Promise<MaintenanceVerificationResponse> {
  const response = await request({
    url: `/clients/${clientId}/verifications`,
    method: 'POST',
    skipClientIdBodyInjection: true,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    data: {},
  });
  return maintenanceVerificationResponseSchema.parse(
    response
  ) as MaintenanceVerificationResponse;
}

export async function getMaintenanceQuestions(
  request: MaintenanceRequest,
  questionIds: string[],
  locale = 'en-US'
): Promise<MaintenanceQuestion[]> {
  if (questionIds.length === 0) return [];
  const response = maintenanceQuestionListSchema.parse(
    await request({
      url: '/questions',
      method: 'GET',
      params: { questionIds: questionIds.join(',') },
    })
  );
  return response.questions.map((question) => {
    const content =
      question.content?.find((item) => item.locale === locale) ??
      question.content?.[0];
    return {
      id: question.id,
      label: content?.label ?? question.description ?? question.id ?? '',
      description: content?.description ?? question.description,
      responseType: question.responseSchema?.items?.type as
        | MaintenanceQuestion['responseType']
        | undefined,
      options: question.responseSchema?.items?.enum,
    };
  });
}

export async function updateMaintenanceClientTasks(
  request: MaintenanceRequest,
  clientId: string,
  taskUpdate: MaintenanceClientTaskUpdateRequest,
  idempotencyKey: string
): Promise<void> {
  await request({
    url: `/clients/${clientId}`,
    method: 'PATCH',
    skipClientIdBodyInjection: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: taskUpdate,
  });
}

export async function downloadMaintenanceAttestation(
  request: MaintenanceRequest,
  documentId: string
): Promise<Blob> {
  return request({
    url: `/documents/${documentId}/file`,
    method: 'GET',
    responseType: 'blob',
  }) as Promise<Blob>;
}
