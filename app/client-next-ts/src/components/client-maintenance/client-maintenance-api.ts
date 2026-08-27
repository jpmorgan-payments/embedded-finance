import { API_URL } from '@/data/constants';

import type {
  ClientProductUpdate,
  ClientResponse,
  DocumentRequestResponse,
  ListKycPartyUpdateRequests,
  MaintenancePartyCreate,
  MaintenancePartyUpdate,
  PartyResponse,
  QuestionListResponse,
} from './models/maintenance-api';

const BASE_URL = `${API_URL}/onboarding/v1`;

export type AttestationInput = {
  attester: {
    firstName: string;
    lastName: string;
    designation: string;
  };
  attestationTime: string;
  documentId: string;
  ipAddress: string;
};

type VerificationAccepted = {
  acceptedAt: string;
};

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function requestJson<Response>(
  input: string,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      context?: Array<{ message?: string }>;
      title?: string;
    } | null;
    throw new ApiRequestError(
      error?.context?.[0]?.message ??
        error?.title ??
        `Request failed with status ${response.status}`,
      response.status
    );
  }
  return (await response.json()) as Response;
}

export const clientMaintenanceApi = {
  getClient(clientId: string): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/clients/${clientId}`);
  },

  updateParty(
    partyId: string,
    update: MaintenancePartyUpdate
  ): Promise<PartyResponse> {
    return requestJson(`${BASE_URL}/parties/${partyId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  createParty(party: MaintenancePartyCreate): Promise<PartyResponse> {
    return requestJson(`${BASE_URL}/parties`, {
      method: 'POST',
      body: JSON.stringify(party),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  requestProduct(
    clientId: string,
    update: ClientProductUpdate
  ): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  async getMaintenanceRequests(
    clientId: string
  ): Promise<ListKycPartyUpdateRequests> {
    try {
      return await requestJson(
        `${BASE_URL}/maintenance-requests?clientId=${encodeURIComponent(clientId)}`
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        return {
          parties: [],
          metadata: { page: 0, limit: 25, total: 0 },
        };
      }
      throw error;
    }
  },

  getMaintenanceRequest(
    requestId: string
  ): Promise<ListKycPartyUpdateRequests> {
    return requestJson(`${BASE_URL}/maintenance-requests/${requestId}`);
  },

  addAttestation(
    clientId: string,
    attestation: AttestationInput
  ): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ addAttestations: [attestation] }),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  startVerification(clientId: string): Promise<VerificationAccepted> {
    return requestJson(`${BASE_URL}/clients/${clientId}/verifications`, {
      method: 'POST',
      body: '{}',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  getQuestions(questionIds: string[]): Promise<QuestionListResponse> {
    const ids = encodeURIComponent(questionIds.join(','));
    return requestJson(`${BASE_URL}/questions?questionIds=${ids}`);
  },

  getDocumentRequest(
    documentRequestId: string
  ): Promise<DocumentRequestResponse> {
    return requestJson(
      `${BASE_URL}/document-requests/${encodeURIComponent(documentRequestId)}`
    );
  },

  requestInformation(): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/_maintenance-demo/request-information`, {
      method: 'POST',
    });
  },

  approve(): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/_maintenance-demo/approve`, {
      method: 'POST',
    });
  },

  reset(): Promise<ClientResponse> {
    return requestJson(`${BASE_URL}/_maintenance-demo/reset`, {
      method: 'POST',
    });
  },
};
