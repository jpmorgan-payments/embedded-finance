import React from 'react';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { useLinkedAccountForm } from './useLinkedAccountForm';

// Helper to create wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <EBComponentsProvider apiBaseUrl="/" headers={{}}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('useLinkedAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('should submit create form with LINKED_ACCOUNT type', async () => {
    let capturedData: any = null;

    server.use(
      http.post('/recipients', async ({ request }) => {
        capturedData = await request.json();
        return HttpResponse.json({
          id: 'new-recipient',
          status: 'MICRODEPOSITS_INITIATED',
          ...capturedData,
        });
      })
    );

    const onSuccess = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(
      () =>
        useLinkedAccountForm({
          mode: 'create',
          clientId: 'test-client',
          onSuccess,
          onSettled,
        }),
      { wrapper: createWrapper() }
    );

    const formData = {
      accountType: 'INDIVIDUAL' as const,
      firstName: 'Test',
      lastName: 'User',
      routingNumbers: [
        {
          paymentType: 'ACH' as const,
          routingNumber: '123456789',
        },
      ],
      accountNumber: '12345678',
      bankAccountType: 'CHECKING' as const,
      paymentTypes: ['ACH' as const],
      certify: true,
    };

    result.current.submit(formData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('type', 'LINKED_ACCOUNT');
    expect(capturedData).toHaveProperty('partyDetails');
    expect(onSuccess).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
  });

  it('should submit edit form without type field', async () => {
    let capturedData: any = null;
    let capturedId: string | null = null;

    server.use(
      http.put('/recipients/:id', async ({ request, params }) => {
        capturedData = await request.json();
        capturedId = params.id as string;
        return HttpResponse.json({
          id: capturedId,
          status: 'ACTIVE',
          type: 'LINKED_ACCOUNT',
          ...capturedData,
        });
      })
    );

    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useLinkedAccountForm({
          mode: 'edit',
          recipientId: 'recipient-1',
          clientId: 'test-client',
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    const formData = {
      accountType: 'INDIVIDUAL' as const,
      firstName: 'Updated',
      lastName: 'User',
      routingNumbers: [
        {
          paymentType: 'ACH' as const,
          routingNumber: '123456789',
        },
      ],
      accountNumber: '12345678',
      bankAccountType: 'CHECKING' as const,
      paymentTypes: ['ACH' as const],
      certify: true,
    };

    result.current.submit(formData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedId).toBe('recipient-1');
    expect(capturedData).not.toHaveProperty('type');
    expect(capturedData).toHaveProperty('partyDetails');
    expect(capturedData).toHaveProperty('account');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle create errors', async () => {
    server.use(
      http.post('/recipients', () => {
        return HttpResponse.json({ message: 'Invalid data' }, { status: 400 });
      })
    );

    const onError = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(
      () =>
        useLinkedAccountForm({
          mode: 'create',
          clientId: 'test-client',
          onError,
          onSettled,
        }),
      { wrapper: createWrapper() }
    );

    const formData = {
      accountType: 'INDIVIDUAL' as const,
      firstName: 'Test',
      lastName: 'User',
      routingNumbers: [
        {
          paymentType: 'ACH' as const,
          routingNumber: '123456789',
        },
      ],
      accountNumber: '12345678',
      bankAccountType: 'CHECKING' as const,
      paymentTypes: ['ACH' as const],
      certify: true,
    };

    result.current.submit(formData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith(undefined, expect.any(Object));
  });

  it('should handle edit errors', async () => {
    server.use(
      http.put('/recipients/:id', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useLinkedAccountForm({
          mode: 'edit',
          recipientId: 'recipient-1',
          clientId: 'test-client',
          onError,
        }),
      { wrapper: createWrapper() }
    );

    const formData = {
      accountType: 'INDIVIDUAL' as const,
      firstName: 'Test',
      lastName: 'User',
      routingNumbers: [
        {
          paymentType: 'ACH' as const,
          routingNumber: '123456789',
        },
      ],
      accountNumber: '12345678',
      bankAccountType: 'CHECKING' as const,
      paymentTypes: ['ACH' as const],
      certify: true,
    };

    result.current.submit(formData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should reset mutation state', async () => {
    const { result } = renderHook(
      () =>
        useLinkedAccountForm({
          mode: 'create',
          clientId: 'test-client',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe('idle');

    result.current.reset();

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe(null);
  });
});
