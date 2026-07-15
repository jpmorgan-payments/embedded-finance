import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import type { FxConfig } from '../PaymentFlowFX.types';
import { buildRateSheet } from '../stories/story-utils';
import { useFxQuote } from './useFxQuote';

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

describe('useFxQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  it('is idle for domestic (USD / undefined) currency', () => {
    const { result } = renderHook(() => useFxQuote({ targetCurrency: 'USD' }), {
      wrapper,
    });
    expect(result.current.status).toBe('idle');
  });

  it('stays idle in realtime mode without a getIndicativeRate callback', () => {
    const { result } = renderHook(
      () =>
        useFxQuote({ targetCurrency: 'EUR', fxConfig: { mode: 'realtime' } }),
      { wrapper }
    );
    expect(result.current.status).toBe('idle');
  });

  it('resolves an indicative quote in realtime mode', async () => {
    const fxConfig: FxConfig = {
      mode: 'realtime',
      getIndicativeRate: vi.fn().mockResolvedValue({ rate: 0.92 }),
    };
    const { result } = renderHook(
      () => useFxQuote({ targetCurrency: 'EUR', fxConfig }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.quote?.rate).toBe(0.92);
    expect(result.current.quote?.isIndicative).toBe(true);
  });

  it('resolves a locked quote in provider mode (debounced)', async () => {
    const fxConfig: FxConfig = {
      mode: 'provider',
      getRate: vi.fn().mockResolvedValue({
        rate: 0.79,
        rateId: 'r-1',
        isIndicative: false,
      }),
    };
    const { result } = renderHook(
      () =>
        useFxQuote({
          targetCurrency: 'GBP',
          amount: '100',
          fxConfig,
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('success'), {
      timeout: 2000,
    });
    expect(result.current.quote?.rate).toBe(0.79);
    expect(result.current.quote?.isIndicative).toBe(false);
  });

  it('falls back to unavailable when the provider callback throws', async () => {
    const fxConfig: FxConfig = {
      mode: 'provider',
      getRate: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const { result } = renderHook(
      () => useFxQuote({ targetCurrency: 'GBP', amount: '100', fxConfig }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('unavailable'), {
      timeout: 2000,
    });
    expect(result.current.reason).toBeDefined();
  });

  it('selects a rate from the rate sheet in ratesheet mode', async () => {
    server.use(
      http.get('*/accounts/:id/ratesheets/current', () =>
        HttpResponse.json(buildRateSheet())
      )
    );
    const { result } = renderHook(
      () =>
        useFxQuote({
          targetCurrency: 'EUR',
          fromAccountId: 'acc-1',
          amount: '100',
          paymentMethod: 'ACH',
          fxConfig: { mode: 'ratesheet' },
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.quote?.rate).toBe(0.92);
    expect(result.current.quote?.rateId).toBe('rate-eur-exec');
  });

  it('is unavailable when the rate sheet body carries errors', async () => {
    server.use(
      http.get('*/accounts/:id/ratesheets/current', () =>
        HttpResponse.json({
          errors: [
            { errorCode: 'RATE_UNAVAILABLE', errorMsg: 'No rate available' },
          ],
        })
      )
    );
    const { result } = renderHook(
      () =>
        useFxQuote({
          targetCurrency: 'EUR',
          fromAccountId: 'acc-1',
          fxConfig: { mode: 'ratesheet' },
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(result.current.reason).toMatch(/no rate available/i);
  });

  it('is unavailable when the rate sheet request fails', async () => {
    server.use(
      http.get('*/accounts/:id/ratesheets/current', () =>
        HttpResponse.json({ title: 'error' }, { status: 500 })
      )
    );
    const { result } = renderHook(
      () =>
        useFxQuote({
          targetCurrency: 'EUR',
          fromAccountId: 'acc-1',
          fxConfig: { mode: 'ratesheet' },
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('exposes a refetch callback', () => {
    const { result } = renderHook(() => useFxQuote({ targetCurrency: 'USD' }), {
      wrapper,
    });
    expect(typeof result.current.refetch).toBe('function');
    result.current.refetch();
  });
});
