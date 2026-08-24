import { API_URL } from '@/data/constants';

import type {
  ClientResponse,
  ListKycPartyUpdateRequests,
  MaintenancePartyUpdate,
  PartyResponse,
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
    throw new Error(
      error?.context?.[0]?.message ??
        error?.title ??
        `Request failed with status ${response.status}`
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

  getMaintenanceRequests(
    clientId: string
  ): Promise<ListKycPartyUpdateRequests> {
    return requestJson(
      `${BASE_URL}/maintenance-requests?clientId=${encodeURIComponent(clientId)}`
    );
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
