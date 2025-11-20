import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

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
    const mockAccounts = [
      {
        id: 'account-1',
        category: 'LIMITED_DDA_PAYMENTS',
      },
      {
        id: 'account-2',
        category: 'LIMITED_DDA',
      },
      {
        id: 'account-3',
        category: 'OTHER',
      },
    ];

    server.use(
      http.get('/accounts', () => {
        return HttpResponse.json({ items: mockAccounts });
      })
    );

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(2);
    expect(result.current.filteredAccountIds).toContain('account-1');
    expect(result.current.filteredAccountIds).toContain('account-2');
    expect(result.current.filteredAccountIds).not.toContain('account-3');
  });

  test('returns empty array when no matching accounts', async () => {
    const mockAccounts = [
      {
        id: 'account-1',
        category: 'OTHER',
      },
    ];

    server.use(
      http.get('/accounts', () => {
        return HttpResponse.json({ items: mockAccounts });
      })
    );

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(0);
  });

  test('handles empty accounts response', async () => {
    server.use(
      http.get('/accounts', () => {
        return HttpResponse.json({ items: [] });
      })
    );

    const { result } = renderHook(() => useAccountsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.filteredAccountIds).toHaveLength(0);
  });
});
