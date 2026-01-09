import React from 'react';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Recipient } from '@/api/generated/ep-recipients.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { useRecipients } from './useRecipients';

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

// Mock recipient data
const mockActiveRecipient: Recipient = {
  id: 'recipient-1',
  status: 'ACTIVE',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '12345678',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '123456789',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockPendingRecipient: Recipient = {
  id: 'recipient-2',
  status: 'PENDING',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  account: {
    number: '87654321',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '987654321',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockReadyForValidationRecipient: Recipient = {
  id: 'recipient-3',
  status: 'READY_FOR_VALIDATION',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Alice',
    lastName: 'Johnson',
  },
  account: {
    number: '11111111',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '111111111',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe('useRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('should fetch and return recipients with default variant', async () => {
    server.use(
      http.get('/recipients', () => {
        return HttpResponse.json({
          recipients: [mockActiveRecipient, mockPendingRecipient],
          metadata: {
            total_items: 2,
            total_pages: 1,
          },
          page: 0,
          limit: 25,
        });
      })
    );

    const { result } = renderHook(
      () => useRecipients({ variant: 'default', recipientType: 'LINKED_ACCOUNT' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.recipients).toHaveLength(2);
    expect(result.current.hasActiveRecipient).toBe(true);
    expect(result.current.totalCount).toBe(2);
  });

  it('should return only first recipient with singleAccount variant', async () => {
    server.use(
      http.get('/recipients', () => {
        return HttpResponse.json({
          recipients: [mockActiveRecipient, mockReadyForValidationRecipient],
          metadata: {
            total_items: 2,
            total_pages: 1,
          },
          page: 0,
          limit: 25,
        });
      })
    );

    const { result } = renderHook(
      () =>
        useRecipients({
          variant: 'singleAccount',
          recipientType: 'LINKED_ACCOUNT',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.recipients).toHaveLength(1);
    expect(result.current.recipients[0].id).toBe('recipient-1');
    expect(result.current.totalCount).toBe(2);
  });

  it('should handle empty recipients', async () => {
    server.use(
      http.get('/recipients', () => {
        return HttpResponse.json({
          recipients: [],
          metadata: {
            total_items: 0,
            total_pages: 0,
          },
          page: 0,
          limit: 25,
        });
      })
    );

    const { result } = renderHook(() => useRecipients({ recipientType: 'LINKED_ACCOUNT' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.recipients).toHaveLength(0);
    expect(result.current.hasActiveRecipient).toBe(false);
  });

  it('should handle loading state', async () => {
    server.use(
      http.get('/recipients', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
        return HttpResponse.json({
          recipients: [],
          metadata: {
            total_items: 0,
            total_pages: 0,
          },
          page: 0,
          limit: 25,
        });
      })
    );

    const { result } = renderHook(() => useRecipients({ recipientType: 'LINKED_ACCOUNT' }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.recipients).toHaveLength(0);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle error state', async () => {
    server.use(
      http.get('/recipients', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useRecipients({ recipientType: 'LINKED_ACCOUNT' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.recipients).toHaveLength(0);
  });

  it('should provide refetch function', async () => {
    let callCount = 0;
    server.use(
      http.get('/recipients', () => {
        callCount += 1;
        const recipients = callCount === 1 ? [] : [mockActiveRecipient];
        return HttpResponse.json({
          recipients,
          metadata: {
            total_items: recipients.length,
            total_pages: recipients.length > 0 ? 1 : 0,
          },
          page: 0,
          limit: 25,
        });
      })
    );

    const { result } = renderHook(() => useRecipients({ recipientType: 'LINKED_ACCOUNT' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.recipients).toHaveLength(0);

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.recipients).toHaveLength(1);
    });
  });
});
