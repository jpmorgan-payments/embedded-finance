import { AxiosError, type AxiosRequestConfig } from 'axios';
import { describe, expect, test, vi } from 'vitest';

import {
  cancelMaintenanceRequest,
  getAllMaintenanceParties,
  getMaintenanceDocumentRequests,
  patchMaintenancePartyName,
  submitMaintenanceVerification,
  type MaintenanceRequest,
} from './clientMaintenanceApi';

describe('clientMaintenanceApi', () => {
  test('treats a maintenance-list 404 as no maintenance records', async () => {
    const notFoundData = {
      title: 'Not Found',
      httpStatus: 404,
      message: 'Error details not available',
      error: 'NOT_FOUND',
      context: [
        {
          message:
            'The server can not find the requested resource. KYC Maintenance request with ID: [3002022212] not found',
        },
      ],
    };
    const notFound = new AxiosError(
      'Not found',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      { status: 404, data: notFoundData } as never
    );
    const request = vi.fn<MaintenanceRequest>().mockRejectedValue(notFound);

    await expect(
      getAllMaintenanceParties(request, 'approved-client-1')
    ).resolves.toEqual({
      pages: [
        {
          parties: [],
          metadata: { page: 0, limit: 25, total: 0 },
        },
      ],
      parties: [],
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('keeps non-404 maintenance-list failures fatal', async () => {
    const serverError = new AxiosError(
      'Server error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      { status: 500 } as never
    );
    const request = vi.fn<MaintenanceRequest>().mockRejectedValue(serverError);

    await expect(
      getAllMaintenanceParties(request, 'approved-client-1')
    ).rejects.toBe(serverError);
  });

  test('keeps unrelated maintenance-list 404 failures fatal', async () => {
    const unrelatedNotFound = new AxiosError(
      'Not found',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        data: {
          error: 'NOT_FOUND',
          context: [{ message: 'Client resource not found' }],
        },
      } as never
    );
    const request = vi
      .fn<MaintenanceRequest>()
      .mockRejectedValue(unrelatedNotFound);

    await expect(
      getAllMaintenanceParties(request, 'approved-client-1')
    ).rejects.toBe(unrelatedNotFound);
  });

  test('fetches and validates every maintenance page plus a confirmation read', async () => {
    const request = vi
      .fn<MaintenanceRequest>()
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, limit: 1, total: 2 },
      })
      .mockResolvedValueOnce({
        parties: [{ id: 'party-2' }],
        metadata: { page: 1, limit: 1, total: 2 },
      })
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, limit: 1, total: 2 },
      });

    const result = await getAllMaintenanceParties(request, 'client-1', 1);

    expect(result.parties.map((party) => party.id)).toEqual([
      'party-1',
      'party-2',
    ]);
    expect(request).toHaveBeenCalledTimes(3);
  });

  test('accepts the live API pagination shape without a limit', async () => {
    const liveResponse = {
      metadata: { page: 0, total: 1 },
      parties: [
        {
          id: '2001166633',
          individualDetails: { lastName: 'EP UAT 1' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: '400000320',
            submittedAt: '2026-08-26T17:58:36.99Z',
          },
        },
      ],
    };
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue(liveResponse);

    const result = await getAllMaintenanceParties(request, 'approved-client-1');

    expect(result.parties).toEqual(liveResponse.parties);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('uses the requested limit to fetch multiple pages when metadata omits it', async () => {
    const request = vi
      .fn<MaintenanceRequest>()
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, total: 2 },
      })
      .mockResolvedValueOnce({
        parties: [{ id: 'party-2' }],
        metadata: { page: 1, total: 2 },
      })
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, total: 2 },
      });

    const result = await getAllMaintenanceParties(request, 'client-1', 1);

    expect(result.parties.map((party) => party.id)).toEqual([
      'party-1',
      'party-2',
    ]);
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/maintenance-requests',
      method: 'GET',
      params: { clientId: 'client-1', page: 1, limit: 1 },
    });
  });

  test('rejects an explicit limit that conflicts with the requested limit', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({
      parties: [],
      metadata: { page: 0, limit: 10, total: 0 },
    });

    await expect(
      getAllMaintenanceParties(request, 'client-1', 25)
    ).rejects.toThrow('invalid pagination metadata');
  });

  test('blocks a changing total', async () => {
    const request = vi
      .fn<MaintenanceRequest>()
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, limit: 1, total: 1 },
      })
      .mockResolvedValueOnce({
        parties: [{ id: 'party-1' }],
        metadata: { page: 0, limit: 1, total: 2 },
      });

    await expect(
      getAllMaintenanceParties(request, 'client-1', 1)
    ).rejects.toThrow('changed while pages were loading');
  });

  test('blocks a same-count page substitution', async () => {
    const request = vi
      .fn<MaintenanceRequest>()
      .mockResolvedValueOnce({
        parties: [
          {
            id: 'party-1',
            updateRequest: { requestId: 'request-1', status: 'NEW' },
          },
        ],
        metadata: { page: 0, limit: 1, total: 1 },
      })
      .mockResolvedValueOnce({
        parties: [
          {
            id: 'party-2',
            updateRequest: { requestId: 'request-2', status: 'NEW' },
          },
        ],
        metadata: { page: 0, limit: 1, total: 1 },
      });

    await expect(
      getAllMaintenanceParties(request, 'client-1', 1)
    ).rejects.toThrow('changed while pages were loading');
  });

  test('sends a sparse update with the supplied idempotency key', async () => {
    const request = vi.fn<(config: AxiosRequestConfig) => Promise<unknown>>();
    request.mockResolvedValue({});

    await patchMaintenancePartyName(
      request,
      'party-1',
      { individualDetails: { lastName: 'Diaz' } },
      'idempotency-1'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/parties/party-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-1' },
      data: { individualDetails: { lastName: 'Diaz' } },
    });
  });

  test('cancels every party in a maintenance change set', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await cancelMaintenanceRequest(request, 'change-set-1', 'idempotency-1');

    expect(request).toHaveBeenCalledWith({
      url: '/maintenance-requests/change-set-1',
      method: 'DELETE',
      headers: { 'Idempotency-Key': 'idempotency-1' },
      params: undefined,
    });
  });

  test('cancels one party within a maintenance change set', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await cancelMaintenanceRequest(
      request,
      'change-set-1',
      'idempotency-2',
      'party-1'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/maintenance-requests/change-set-1',
      method: 'DELETE',
      headers: { 'Idempotency-Key': 'idempotency-2' },
      params: { partyId: 'party-1' },
    });
  });

  test('submits the complete draft for verification with an empty body', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({
      acceptedAt: '2026-08-26T16:15:00.000Z',
    });

    await expect(
      submitMaintenanceVerification(request, 'client-1', 'idempotency-3')
    ).resolves.toEqual({ acceptedAt: '2026-08-26T16:15:00.000Z' });
    expect(request).toHaveBeenCalledWith({
      url: '/clients/client-1/verifications',
      method: 'POST',
      skipClientIdBodyInjection: true,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idempotency-3',
      },
      data: {},
    });
  });

  test('accepts a verification response without acceptedAt', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await expect(
      submitMaintenanceVerification(request, 'client-1', 'idempotency-4')
    ).resolves.toEqual({});
  });

  test('loads related document request statuses for pre-submit validation', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({
      documentRequests: [
        { id: 'document-1', partyId: 'party-1', status: 'CLOSED' },
      ],
    });

    await expect(
      getMaintenanceDocumentRequests(request, 'client-1')
    ).resolves.toEqual([
      { id: 'document-1', partyId: 'party-1', status: 'CLOSED' },
    ]);
    expect(request).toHaveBeenCalledWith({
      url: '/document-requests',
      method: 'GET',
      params: { clientId: 'client-1', includeRelatedParty: true },
    });
  });
});
