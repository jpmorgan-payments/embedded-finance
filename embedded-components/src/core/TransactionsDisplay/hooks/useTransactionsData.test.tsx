import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { useTransactionsData } from './useTransactionsData';

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

describe('useTransactionsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  test('fetches and processes transactions', async () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        type: 'PAYMENT',
        status: 'COMPLETED',
        amount: 1000,
        currency: 'USD',
        createdAt: '2024-01-15T10:00:00Z',
        creditorAccountId: 'account-1',
        debtorName: 'Debtor',
        creditorName: 'Creditor',
      },
    ];

    server.use(
      http.get('/transactions', () => {
        return HttpResponse.json({ items: mockTransactions });
      })
    );

    const { result } = renderHook(
      () => useTransactionsData({ accountIds: ['account-1'] }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].payinOrPayout).toBe('PAYIN');
    expect(result.current.transactions[0].counterpartName).toBe('Debtor');
  });

  test('returns empty array when no data', async () => {
    server.use(
      http.get('/transactions', () => {
        return HttpResponse.json({ items: [] });
      })
    );

    const { result } = renderHook(() => useTransactionsData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.transactions).toHaveLength(0);
  });

  test('handles error state', async () => {
    server.use(
      http.get('/transactions', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useTransactionsData(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });
});
