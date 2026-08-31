import { isAxiosError, type AxiosRequestConfig } from 'axios';

import {
  maintenanceClientSchema,
  maintenanceDocumentRequestListSchema,
  maintenancePageSchema,
  maintenanceVerificationResponseSchema,
} from './models/maintenanceApi.schemas';
import type {
  MaintenanceClient,
  MaintenanceDocumentRequestSummary,
  MaintenancePage,
  MaintenanceParty,
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
  await request({
    url: `/parties/${partyId}`,
    method: 'PATCH',
    skipClientIdBodyInjection: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: partyNameUpdate,
  });
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
