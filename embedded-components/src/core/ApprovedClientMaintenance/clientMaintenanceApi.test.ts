import { AxiosError, type AxiosRequestConfig } from 'axios';
import { describe, expect, test, vi } from 'vitest';

import {
  addLimitedDdaPaymentsProduct,
  cancelLimitedDdaPaymentsAddition,
  cancelMaintenanceRequest,
  createMaintenanceParty,
  downloadMaintenanceAttestation,
  getAllMaintenanceParties,
  getMaintenanceDocumentRequests,
  getMaintenanceQuestions,
  patchMaintenanceParty,
  patchMaintenancePartyName,
  submitMaintenanceVerification,
  updateMaintenanceClientTasks,
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
          individualDetails: {
            firstName: 'Embedded Payments',
            lastName: 'EP UAT 1',
          },
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

  test('sends the supplied individual delta with the idempotency key', async () => {
    const request = vi.fn<(config: AxiosRequestConfig) => Promise<unknown>>();
    request.mockResolvedValue({});

    await patchMaintenancePartyName(
      request,
      'party-1',
      {
        individualDetails: {
          firstName: 'Jane',
          middleName: 'R',
          lastName: 'Diaz',
          countryOfResidence: 'US',
        },
      },
      'idempotency-1'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/parties/party-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-1' },
      data: {
        individualDetails: {
          firstName: 'Jane',
          middleName: 'R',
          lastName: 'Diaz',
          countryOfResidence: 'US',
        },
      },
    });
  });

  test('sends organization and removal updates without provider body injection', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await patchMaintenanceParty(
      request,
      'organization-1',
      {
        organizationDetails: {
          organizationName: 'Neverland Books',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          countryOfFormation: 'US',
          dbaName: 'Neverland Bookshop',
          addresses: [
            {
              addressType: 'BUSINESS_ADDRESS',
              addressLines: ['100 Market Street'],
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94105',
              country: 'US',
            },
          ],
        },
      },
      'idempotency-org'
    );
    await patchMaintenanceParty(
      request,
      'person-1',
      { active: false },
      'idempotency-remove'
    );

    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/parties/organization-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-org' },
      data: {
        organizationDetails: {
          organizationName: 'Neverland Books',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          countryOfFormation: 'US',
          dbaName: 'Neverland Bookshop',
          addresses: [
            expect.objectContaining({ addressLines: ['100 Market Street'] }),
          ],
        },
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/parties/person-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-remove' },
      data: { active: false },
    });
  });

  test('preserves complete role arrays', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await patchMaintenanceParty(
      request,
      'person-1',
      {
        roles: ['BENEFICIAL_OWNER'],
      },
      'idempotency-root-update'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/parties/person-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-root-update' },
      data: {
        roles: ['BENEFICIAL_OWNER'],
      },
    });
  });

  test('creates a related party with its immediate parent and role', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({
      id: 'person-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
    });

    await expect(
      createMaintenanceParty(
        request,
        {
          partyType: 'INDIVIDUAL',
          parentPartyId: 'organization-1',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            birthDate: '1975-03-12',
            natureOfOwnership: 'Direct',
          },
        },
        'idempotency-create'
      )
    ).resolves.toEqual(expect.objectContaining({ id: 'person-2' }));
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/parties',
        method: 'POST',
        skipClientIdBodyInjection: true,
        headers: { 'Idempotency-Key': 'idempotency-create' },
        data: expect.objectContaining({
          parentPartyId: 'organization-1',
          roles: ['BENEFICIAL_OWNER'],
        }),
      })
    );
  });

  test('adds Limited DDA Payments without replacing existing products', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await addLimitedDdaPaymentsProduct(
      request,
      'client-1',
      'idempotency-product'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/clients/client-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-product' },
      data: {
        productDetails: [
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA_PAYMENTS',
            action: 'ADD',
          },
        ],
      },
    });
  });

  test('cancels a pending Limited DDA Payments addition', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});

    await cancelLimitedDdaPaymentsAddition(
      request,
      'client-1',
      'idempotency-product-remove'
    );

    expect(request).toHaveBeenCalledWith({
      url: '/clients/client-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'idempotency-product-remove' },
      data: {
        productDetails: [
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA_PAYMENTS',
            action: 'REMOVE',
          },
        ],
      },
    });
  });

  test('loads localized questions and preserves response options', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({
      questions: [
        {
          id: '30005',
          content: [
            { locale: 'en-US', label: 'What is your expected volume?' },
          ],
          responseSchema: {
            items: { type: 'enum', enum: ['$10,000', '$25,000'] },
          },
        },
      ],
    });

    await expect(getMaintenanceQuestions(request, ['30005'])).resolves.toEqual([
      expect.objectContaining({
        id: '30005',
        label: 'What is your expected volume?',
        options: ['$10,000', '$25,000'],
      }),
    ]);
    expect(request).toHaveBeenCalledWith({
      url: '/questions',
      method: 'GET',
      params: { questionIds: '30005' },
    });
  });

  test('submits question responses and structured attestations as sparse client tasks', async () => {
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue({});
    const attestation = {
      documentId: 'attestation-1',
      attestationTime: '2026-09-01T12:00:00.000Z',
      ipAddress: '127.0.0.1',
      attester: {
        firstName: 'Peiter',
        lastName: 'Pan',
        designation: 'Chief financial officer',
      },
    };

    await updateMaintenanceClientTasks(
      request,
      'client-1',
      { questionResponses: [{ questionId: '30005', values: ['$10,000'] }] },
      'question-key'
    );
    await updateMaintenanceClientTasks(
      request,
      'client-1',
      { addAttestations: [attestation] },
      'attestation-key'
    );

    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/clients/client-1',
      method: 'PATCH',
      skipClientIdBodyInjection: true,
      headers: { 'Idempotency-Key': 'question-key' },
      data: {
        questionResponses: [{ questionId: '30005', values: ['$10,000'] }],
      },
    });
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { addAttestations: [attestation] },
      })
    );
  });

  test('downloads attestation files as blobs', async () => {
    const blob = new Blob(['attestation'], { type: 'application/pdf' });
    const request = vi.fn<MaintenanceRequest>().mockResolvedValue(blob);

    await expect(
      downloadMaintenanceAttestation(request, 'attestation-1')
    ).resolves.toBe(blob);
    expect(request).toHaveBeenCalledWith({
      url: '/documents/attestation-1/file',
      method: 'GET',
      responseType: 'blob',
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
