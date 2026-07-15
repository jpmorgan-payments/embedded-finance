/**
 * useFxQuote
 *
 * Rate acquisition state machine driving {@link FxQuotePreview} and the review
 * FX block. Supports the three `fxConfig` modes (SPECIFICATION.md FR-FX-6):
 * `realtime` (optional indicative estimate), `ratesheet` (built-in
 * getCurrentRatesheet), and `provider` (host callback, debounced).
 *
 * All failure paths are non-blocking: the result falls back to `status:
 * 'unavailable'` with a reason so the payment can still submit at the market rate.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGetCurrentRatesheet } from '@/api/generated/fx-rate-sheet';

import type { FxConfig, FxQuote } from '../PaymentFlowFX.types';
import { getRateSheetErrors, selectRateFromSheet } from '../utils/rateSheet';

export type FxQuoteStatus = 'idle' | 'loading' | 'success' | 'unavailable';

export interface UseFxQuoteParams {
  targetCurrency?: string;
  fromAccountId?: string;
  /** USD amount (debit side). */
  amount?: string;
  paymentMethod?: 'ACH' | 'WIRE';
  beneficiaryType?: 'INDIVIDUAL' | 'BUSINESS';
  fxConfig?: FxConfig;
}

export interface UseFxQuoteResult {
  status: FxQuoteStatus;
  quote?: FxQuote;
  /** Present when `status === 'unavailable'`. */
  reason?: string;
  /** Manually re-acquire the quote (used for expiry re-quote). */
  refetch: () => void;
}

const PROVIDER_DEBOUNCE_MS = 500;

export function useFxQuote({
  targetCurrency,
  fromAccountId,
  amount,
  paymentMethod = 'ACH',
  beneficiaryType,
  fxConfig,
}: UseFxQuoteParams): UseFxQuoteResult {
  const mode = fxConfig?.mode ?? 'realtime';
  const fxActive = !!targetCurrency && targetCurrency !== 'USD';

  // Nonce to force re-acquisition in async (realtime/provider) modes.
  const [nonce, setNonce] = useState(0);
  const refetchAsync = useCallback(() => setNonce((n) => n + 1), []);

  // ---- Rate sheet mode (react-query) ----
  const ratesheetEnabled = fxActive && mode === 'ratesheet' && !!fromAccountId;

  const ratesheetQuery = useGetCurrentRatesheet(
    fromAccountId ?? '',
    fxConfig?.customerDepartment
      ? { customerDepartment: fxConfig.customerDepartment }
      : undefined,
    {
      query: {
        enabled: ratesheetEnabled,
        ...(fxConfig?.refreshIntervalMs
          ? { refetchInterval: fxConfig.refreshIntervalMs }
          : {}),
      },
    }
  );

  const ratesheetResult = useMemo<UseFxQuoteResult>(() => {
    if (!ratesheetEnabled) return { status: 'idle', refetch: () => {} };
    if (ratesheetQuery.isLoading) {
      return { status: 'loading', refetch: () => ratesheetQuery.refetch() };
    }
    if (ratesheetQuery.isError || !ratesheetQuery.data) {
      return {
        status: 'unavailable',
        reason: 'Rate unavailable',
        refetch: () => ratesheetQuery.refetch(),
      };
    }

    // 200-with-errors body is a failure (§3.3 / §11).
    const errors = getRateSheetErrors(ratesheetQuery.data);
    if (errors) {
      return {
        status: 'unavailable',
        reason: errors[0] ?? 'Rate unavailable',
        refetch: () => ratesheetQuery.refetch(),
      };
    }

    const selection = selectRateFromSheet(ratesheetQuery.data, {
      targetCurrency: targetCurrency as string,
      paymentMethod,
      beneficiaryType,
      amount: amount ? Number(amount) : undefined,
      customerDepartment: fxConfig?.customerDepartment,
    });

    if (selection.status === 'unavailable') {
      return {
        status: 'unavailable',
        reason: selection.reason,
        refetch: () => ratesheetQuery.refetch(),
      };
    }

    return {
      status: 'success',
      quote: selection.rate,
      refetch: () => ratesheetQuery.refetch(),
    };
  }, [
    ratesheetEnabled,
    ratesheetQuery.isLoading,
    ratesheetQuery.isError,
    ratesheetQuery.data,
    ratesheetQuery.refetch,
    targetCurrency,
    paymentMethod,
    beneficiaryType,
    amount,
    fxConfig?.customerDepartment,
  ]);

  // ---- Async modes (realtime indicative / provider) ----
  const [asyncState, setAsyncState] = useState<{
    status: FxQuoteStatus;
    quote?: FxQuote;
    reason?: string;
  }>({ status: 'idle' });

  const requestSeq = useRef(0);

  useEffect(() => {
    if (!fxActive || mode === 'ratesheet') {
      setAsyncState({ status: 'idle' });
      return undefined;
    }

    // realtime without an indicative callback ⇒ no fetch, just idle.
    if (mode === 'realtime' && !fxConfig?.getIndicativeRate) {
      setAsyncState({ status: 'idle' });
      return undefined;
    }

    requestSeq.current += 1;
    const seq = requestSeq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      setAsyncState({ status: 'loading' });
      try {
        if (mode === 'provider' && fxConfig?.getRate) {
          const result = await fxConfig.getRate({
            baseCurrency: 'USD',
            targetCurrency: targetCurrency as string,
            amount,
            paymentMethod,
          });
          if (seq !== requestSeq.current) return;
          setAsyncState({
            status: 'success',
            quote: { ...result, isIndicative: result.isIndicative ?? false },
          });
        } else if (mode === 'realtime' && fxConfig?.getIndicativeRate) {
          const result = await fxConfig.getIndicativeRate({
            baseCurrency: 'USD',
            targetCurrency: targetCurrency as string,
          });
          if (seq !== requestSeq.current) return;
          setAsyncState({
            status: 'success',
            quote: { ...result, isIndicative: true },
          });
        } else {
          setAsyncState({ status: 'idle' });
        }
      } catch {
        if (seq !== requestSeq.current) return;
        setAsyncState({ status: 'unavailable', reason: 'Rate unavailable' });
      }
    };

    if (mode === 'provider') {
      // Debounce provider calls on amount changes.
      timer = setTimeout(run, PROVIDER_DEBOUNCE_MS);
    } else {
      run().catch(() => undefined);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    fxActive,
    mode,
    targetCurrency,
    amount,
    paymentMethod,
    nonce,
    fxConfig?.getRate,
    fxConfig?.getIndicativeRate,
  ]);

  // Auto re-quote at expiry for whichever mode produced a quote.
  const activeResult = mode === 'ratesheet' ? ratesheetResult : asyncState;
  const expiresAt = activeResult.quote?.expiresAt;

  useEffect(() => {
    if (!expiresAt) return undefined;
    const ms = expiresAt.getTime() - Date.now();
    if (ms <= 0) return undefined;
    const timer = setTimeout(() => {
      if (mode === 'ratesheet') ratesheetQuery.refetch();
      else refetchAsync();
    }, ms);
    return () => clearTimeout(timer);
  }, [expiresAt, mode, ratesheetQuery, refetchAsync]);

  const refetch = useCallback(() => {
    if (mode === 'ratesheet') ratesheetQuery.refetch();
    else refetchAsync();
  }, [mode, ratesheetQuery, refetchAsync]);

  if (!fxActive) {
    return { status: 'idle', refetch };
  }

  if (mode === 'ratesheet') {
    return { ...ratesheetResult, refetch };
  }

  return { ...asyncState, refetch };
}
