import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import type { FxQuote, PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import { useSubmitTransactionV3 } from './useSubmitTransactionV3';

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

const baseFormData = {
  amount: '100',
  currency: 'USD',
  fromAccountId: 'a1',
  payeeId: 'p1',
  paymentMethod: 'ACH',
  targetCurrency: 'EUR',
} as unknown as PaymentFlowFXFormData;

function expiredLockedQuote(): FxQuote & { fetchedAt: Date } {
  return {
    rate: 0.92,
    isIndicative: false,
    rateId: 'rate-expired',
    expiresAt: new Date(Date.now() - 1000),
    fetchedAt: new Date(Date.now() - 60_000),
  };
}

const createHandler = (status = 202) =>
  http.post('*/transactions', () =>
    HttpResponse.json(
      { id: 'txn-1', transactionReferenceId: 'ref-1', status: 'PENDING' },
      { status }
    )
  );

const enrichHandler = (ok = true) =>
  http.get('*/transactions/:id', ({ params }) =>
    ok
      ? HttpResponse.json({
          id: params.id,
          status: 'COMPLETED',
          targetAmount: '92.00',
          targetCurrency: 'EUR',
          fxInformation: { exchangeRate: '0.92' },
        })
      : HttpResponse.json({ title: 'error' }, { status: 500 })
  );

describe('useSubmitTransactionV3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  it('submits and enriches the transaction on success', async () => {
    server.use(createHandler(), enrichHandler());
    const onTransactionComplete = vi.fn();
    const { result } = renderHook(
      () => useSubmitTransactionV3({ onTransactionComplete }),
      { wrapper }
    );

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit(baseFormData);
    });

    expect(outcome?.success).toBe(true);
    expect(result.current.response?.id).toBe('txn-1');
    expect(result.current.enrichedDetails?.status).toBe('COMPLETED');
    expect(onTransactionComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'txn-1' }),
      undefined,
      expect.objectContaining({ status: 'COMPLETED' })
    );
  });

  it('skips enrichment when enrichAfterSubmit is false', async () => {
    server.use(createHandler(), enrichHandler());
    const { result } = renderHook(
      () => useSubmitTransactionV3({ enrichAfterSubmit: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.submit(baseFormData);
    });

    expect(result.current.response?.id).toBe('txn-1');
    expect(result.current.enrichedDetails).toBeUndefined();
  });

  it('degrades gracefully when enrichment fails', async () => {
    server.use(createHandler(), enrichHandler(false));
    const { result } = renderHook(() => useSubmitTransactionV3(), {
      wrapper,
    });

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit(baseFormData);
    });

    expect(outcome?.success).toBe(true);
    expect(result.current.response?.id).toBe('txn-1');
    expect(result.current.enrichedDetails).toBeUndefined();
  });

  it('reports an error when the create call fails', async () => {
    server.use(
      http.post('*/transactions', () =>
        HttpResponse.json({ title: 'Transaction Failed' }, { status: 422 })
      )
    );
    const onTransactionComplete = vi.fn();
    const { result } = renderHook(
      () => useSubmitTransactionV3({ onTransactionComplete }),
      { wrapper }
    );

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit(baseFormData);
    });

    expect(outcome?.success).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(onTransactionComplete).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ httpStatus: 422 })
    );
  });

  it('re-quotes an expired locked quote before submitting', async () => {
    server.use(createHandler(), enrichHandler());
    const requote = vi.fn().mockResolvedValue({
      rate: 0.9,
      isIndicative: false,
      rateId: 'rate-fresh',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { result } = renderHook(() => useSubmitTransactionV3({ requote }), {
      wrapper,
    });

    await act(async () => {
      await result.current.submit({
        ...baseFormData,
        fxQuote: expiredLockedQuote(),
      });
    });

    expect(requote).toHaveBeenCalledOnce();
    expect(result.current.usedMarketRateFallback).toBe(false);
  });

  it('falls back to the market rate when an expired quote cannot be re-quoted', async () => {
    server.use(createHandler(), enrichHandler());
    const { result } = renderHook(() => useSubmitTransactionV3(), {
      wrapper,
    });

    await act(async () => {
      await result.current.submit({
        ...baseFormData,
        fxQuote: expiredLockedQuote(),
      });
    });

    expect(result.current.usedMarketRateFallback).toBe(true);
  });

  it('reset clears state', async () => {
    server.use(createHandler(), enrichHandler());
    const { result } = renderHook(() => useSubmitTransactionV3(), {
      wrapper,
    });

    await act(async () => {
      await result.current.submit(baseFormData);
    });
    expect(result.current.response).toBeDefined();

    act(() => {
      result.current.reset();
    });
    expect(result.current.response).toBeUndefined();
    expect(result.current.enrichedDetails).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
