import React from 'react';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { useRecipientForm } from './useRecipientForm';

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

describe('useRecipientForm', () => {
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
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
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
      http.post('/recipients/:id', async ({ request, params }) => {
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
        useRecipientForm({
          mode: 'edit',
          recipientType: 'LINKED_ACCOUNT',
          recipientId: 'recipient-1',
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

    // First wait for the mutation to complete (either success or error)
    await waitFor(
      () => {
        expect(
          result.current.status !== 'idle' &&
            result.current.status !== 'pending'
        ).toBe(true);
      },
      { timeout: 3000 }
    );

    // Check if it succeeded
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);

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
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
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
      http.post('/recipients/:id', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'edit',
          recipientType: 'LINKED_ACCOUNT',
          recipientId: 'recipient-1',
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
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe('idle');

    result.current.reset();

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe(null);
  });

  // ─── PartyId resolution tests ──────────────────────────────────────────────

  const baseFormData = {
    accountType: 'INDIVIDUAL' as const,
    firstName: 'Test',
    lastName: 'User',
    routingNumbers: [
      { paymentType: 'ACH' as const, routingNumber: '123456789' },
    ],
    accountNumber: '12345678',
    bankAccountType: 'CHECKING' as const,
    paymentTypes: ['ACH' as const],
    certify: true,
  };

  it('should send partyId and omit partyDetails when explicit partyId prop is provided', async () => {
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

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
          partyId: 'party-explicit-123',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit(baseFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('partyId', 'party-explicit-123');
    expect(capturedData).not.toHaveProperty('partyDetails');
    expect(capturedData).toHaveProperty('type', 'LINKED_ACCOUNT');
    expect(capturedData).toHaveProperty('account');
  });

  it('should send partyId from form selectedPartyId when no explicit partyId prop', async () => {
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

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit({
      ...baseFormData,
      selectedPartyId: 'party-from-form-456',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('partyId', 'party-from-form-456');
    expect(capturedData).not.toHaveProperty('partyDetails');
  });

  it('should prefer explicit partyId prop over form selectedPartyId', async () => {
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

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
          partyId: 'prop-party-wins',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit({
      ...baseFormData,
      selectedPartyId: 'form-party-loses',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('partyId', 'prop-party-wins');
    expect(capturedData).not.toHaveProperty('partyDetails');
  });

  it('should send partyDetails and no partyId when neither prop nor form provides partyId', async () => {
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

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit(baseFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('partyDetails');
    expect(capturedData.partyDetails).toEqual(
      expect.objectContaining({
        type: 'INDIVIDUAL',
        firstName: 'Test',
        lastName: 'User',
      })
    );
    expect(capturedData).not.toHaveProperty('partyId');
  });

  it('should include clientId alongside partyId when both are provided', async () => {
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

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'create',
          recipientType: 'LINKED_ACCOUNT',
          partyId: 'party-with-client',
          clientId: 'client-abc',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit(baseFormData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedData).toHaveProperty('partyId', 'party-with-client');
    expect(capturedData).toHaveProperty('clientId', 'client-abc');
    expect(capturedData).not.toHaveProperty('partyDetails');
  });

  it('should NOT use partyId for edit mode (only partyDetails)', async () => {
    let capturedData: any = null;

    server.use(
      http.post('/recipients/:id', async ({ request }) => {
        capturedData = await request.json();
        return HttpResponse.json({
          id: 'recipient-1',
          status: 'ACTIVE',
          type: 'LINKED_ACCOUNT',
          ...capturedData,
        });
      })
    );

    const { result } = renderHook(
      () =>
        useRecipientForm({
          mode: 'edit',
          recipientType: 'LINKED_ACCOUNT',
          recipientId: 'recipient-1',
          partyId: 'party-should-be-ignored',
        }),
      { wrapper: createWrapper() }
    );

    result.current.submit(baseFormData);

    await waitFor(
      () => {
        expect(
          result.current.status !== 'idle' &&
            result.current.status !== 'pending'
        ).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.isSuccess).toBe(true);
    // Edit mode should send partyDetails, not partyId
    expect(capturedData).toHaveProperty('partyDetails');
    expect(capturedData).not.toHaveProperty('partyId');
  });
});
