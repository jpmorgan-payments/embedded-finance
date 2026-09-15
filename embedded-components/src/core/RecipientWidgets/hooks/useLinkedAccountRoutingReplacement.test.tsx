import type { ReactNode } from 'react';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { BankAccountFormData } from '../components/BankAccountForm';
import { useLinkedAccountRoutingReplacement } from './useLinkedAccountRoutingReplacement';

const originalRecipient = {
  id: 'linked-account-1',
  type: 'LINKED_ACCOUNT',
  status: 'ACTIVE',
  clientId: 'client-1',
  partyId: 'party-1',
  partyDetails: { type: 'ORGANIZATION', businessName: 'Acme' },
  account: {
    number: '1234567890',
    type: 'CHECKING',
    countryCode: 'US',
    routingInformation: [
      {
        routingNumber: '021000021',
        transactionType: 'ACH',
        routingCodeType: 'USABA',
      },
    ],
  },
} as unknown as Recipient;

const updatedFormData = {
  accountType: 'ORGANIZATION',
  firstName: '',
  lastName: '',
  businessName: 'Acme',
  routingNumbers: [{ paymentType: 'ACH', routingNumber: '031000503' }],
  accountNumber: '1234567890',
  bankAccountType: 'CHECKING',
  paymentTypes: ['ACH'],
  certify: false,
} as BankAccountFormData;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <EBComponentsProvider apiBaseUrl="/" headers={{}}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </EBComponentsProvider>
    );
  };
};

describe('useLinkedAccountRoutingReplacement', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('creates the replacement before deactivating the original account', async () => {
    const requests: string[] = [];
    let createPayload: Record<string, unknown> | undefined;

    server.use(
      http.post('/recipients', async ({ request }) => {
        requests.push('create');
        createPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'linked-account-2',
          type: 'LINKED_ACCOUNT',
          status: 'MICRODEPOSITS_INITIATED',
          ...createPayload,
        });
      }),
      http.post('/recipients/:id', async ({ request, params }) => {
        requests.push(`deactivate:${String(params.id)}`);
        expect(await request.json()).toEqual({ status: 'INACTIVE' });
        return HttpResponse.json({
          ...originalRecipient,
          id: String(params.id),
          status: 'INACTIVE',
        });
      })
    );

    const onSettled = vi.fn();
    const { result } = renderHook(
      () =>
        useLinkedAccountRoutingReplacement({
          recipient: originalRecipient,
          onSettled,
        }),
      { wrapper: createWrapper() }
    );

    await result.current.replace(updatedFormData);

    expect(requests).toEqual(['create', 'deactivate:linked-account-1']);
    expect(createPayload).toMatchObject({
      type: 'LINKED_ACCOUNT',
      clientId: 'client-1',
      partyId: 'party-1',
      account: {
        routingInformation: [
          { transactionType: 'ACH', routingNumber: '031000503' },
        ],
      },
    });
    expect(createPayload).not.toHaveProperty('partyDetails');
    expect(onSettled).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'linked-account-2' })
    );
  });

  it('leaves the original active when replacement creation fails', async () => {
    const amendRecipient = vi.fn();
    server.use(
      http.post('/recipients', () =>
        HttpResponse.json(
          { title: 'Create failed', httpStatus: 400 },
          { status: 400 }
        )
      ),
      http.post('/recipients/:id', () => {
        amendRecipient();
        return HttpResponse.json({});
      })
    );

    const { result } = renderHook(
      () =>
        useLinkedAccountRoutingReplacement({ recipient: originalRecipient }),
      { wrapper: createWrapper() }
    );

    await expect(result.current.replace(updatedFormData)).rejects.toMatchObject(
      {
        response: { data: { title: 'Create failed' } },
      }
    );
    expect(amendRecipient).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.failureStage).toBe('create'));
  });

  it('deactivates the replacement when the original cannot be deactivated', async () => {
    const requests: string[] = [];
    server.use(
      http.post('/recipients', () => {
        requests.push('create');
        return HttpResponse.json({
          ...originalRecipient,
          id: 'linked-account-2',
          status: 'MICRODEPOSITS_INITIATED',
        });
      }),
      http.post('/recipients/:id', ({ params }) => {
        const id = String(params.id);
        requests.push(`deactivate:${id}`);
        if (id === originalRecipient.id) {
          return HttpResponse.json(
            { title: 'Deactivate failed', httpStatus: 500 },
            { status: 500 }
          );
        }
        return HttpResponse.json({
          ...originalRecipient,
          id,
          status: 'INACTIVE',
        });
      })
    );

    const { result } = renderHook(
      () =>
        useLinkedAccountRoutingReplacement({ recipient: originalRecipient }),
      { wrapper: createWrapper() }
    );

    await expect(result.current.replace(updatedFormData)).rejects.toMatchObject(
      {
        response: { data: { title: 'Deactivate failed' } },
      }
    );
    expect(requests).toEqual([
      'create',
      'deactivate:linked-account-1',
      'deactivate:linked-account-2',
    ]);

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.failureStage).toBe('deactivate-original');
    });
  });
});
