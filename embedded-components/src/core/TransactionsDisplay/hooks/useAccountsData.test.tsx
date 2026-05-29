import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type {
  AccountResponse,
  ListAccountsResponse,
} from '@/api/generated/ep-accounts.schemas';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { useAccountsData } from './useAccountsData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EBComponentsProvider
    apiBaseUrl="/"
    headers={{}}
    contentTokens={{ name: 'enUS' }}
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </EBComponentsProvider>
);

describe('useAccountsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('fetches and filters accounts', async () => {
    const mockItems: AccountResponse[] = [
      {
        id: 'account-1',
        label: 'MAIN',
        state: 'OPEN',
        createdAt: '2025-01-26T00:00:00.000Z',
        category: 'LIMITED_DDA_PAYMENTS',
      },
      {
        id: 'account-2',
        label: 'MAIN',
        state: 'OPEN',
        createdAt: '2025-01-26T00:00:00.000Z',
        category: 'LIMITED_DDA',
      },
      {
        id: 'account-3',
        label: 'MAIN',
        state: 'OPEN',
        createdAt: '2025-01-26T00:00:00.000Z',
        category: 'MANAGEMENT',
      },
    ];

    const response: ListAccountsResponse = {
      metadata: { page: 0, limit: 25, total_items: 3 },
      items: mockItems,
    };

    server.use(http.get('*/accounts', () => HttpResponse.json(response)));

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(2);
    expect(result.current.filteredAccountIds).toContain('account-1');
    expect(result.current.filteredAccountIds).toContain('account-2');
    expect(result.current.filteredAccountIds).not.toContain('account-3');
  });

  test('returns empty array when no matching accounts', async () => {
    const response: ListAccountsResponse = {
      metadata: { page: 0, limit: 25, total_items: 1 },
      items: [
        {
          id: 'account-1',
          label: 'MAIN',
          state: 'OPEN',
          createdAt: '2025-01-26T00:00:00.000Z',
          category: 'MANAGEMENT',
        },
      ],
    };

    server.use(http.get('*/accounts', () => HttpResponse.json(response)));

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(0);
  });

  test('handles empty accounts response', async () => {
    const emptyResponse: ListAccountsResponse = {
      metadata: { page: 0, limit: 25, total_items: 0 },
      items: [],
    };

    server.use(http.get('*/accounts', () => HttpResponse.json(emptyResponse)));

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(0);
  });
});
