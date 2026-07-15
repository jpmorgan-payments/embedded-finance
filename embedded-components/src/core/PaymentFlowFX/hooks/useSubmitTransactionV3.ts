/**
 * useSubmitTransactionV3
 *
 * Owns V3 request assembly, the create mutation, the optional post-submit
 * enrichment fetch, and transaction success/error state. See SPECIFICATION.md
 * FR-FX-8 / FR-FX-9.
 */
import { useCallback, useState } from 'react';

import {
  useCreateTransactionV3,
  useGetTransactionV3Hook,
} from '@/api/generated/ep-transactions-v3';
import type {
  ApiErrorV2,
  PaymentType,
  TransactionGetResponseV3,
  TransactionResponseV3,
} from '@/api/generated/ep-transactions-v3.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

import type {
  FxConfig,
  FxQuote,
  PaymentFlowFXFormData,
} from '../PaymentFlowFX.types';
import { buildV3Request } from '../utils/counterparty';
import { generateTransactionReferenceId } from '../utils/referenceId';

export interface UseSubmitTransactionV3Options {
  fxConfig?: FxConfig;
  /** Fetch getTransactionV3 once after the 202 (default true). */
  enrichAfterSubmit?: boolean;
  onTransactionComplete?: (
    response?: TransactionResponseV3,
    error?: ApiErrorV2,
    details?: TransactionGetResponseV3
  ) => void;
  /** Optional one-shot re-quote used when a locked quote has expired at submit. */
  requote?: (formData: PaymentFlowFXFormData) => Promise<FxQuote | undefined>;
}

export interface SubmitResult {
  success: boolean;
}

export interface UseSubmitTransactionV3Result {
  submit: (formData: PaymentFlowFXFormData) => Promise<SubmitResult>;
  isSubmitting: boolean;
  response?: TransactionResponseV3;
  enrichedDetails?: TransactionGetResponseV3;
  error: ErrorType<ApiErrorV2> | null;
  /** True when an expired locked quote forced a market-rate submission. */
  usedMarketRateFallback: boolean;
  reset: () => void;
  setError: (error: ErrorType<ApiErrorV2> | null) => void;
}

/** Map a UI payment method to the V3 `PaymentType`. */
function toPaymentType(method: string | undefined): PaymentType {
  switch (method) {
    case 'RTP':
      return 'RTP';
    case 'WIRE':
      return 'WIRE';
    case 'ACH':
    default:
      return 'ACH';
  }
}

/** True when a locked (non-indicative) quote exists and has expired. */
function isLockedQuoteExpired(formData: PaymentFlowFXFormData): boolean {
  const quote = formData.fxQuote;
  return (
    !!quote &&
    !quote.isIndicative &&
    !!quote.rateId &&
    !!quote.expiresAt &&
    quote.expiresAt.getTime() <= Date.now()
  );
}

export function useSubmitTransactionV3(
  options: UseSubmitTransactionV3Options = {}
): UseSubmitTransactionV3Result {
  const {
    fxConfig,
    enrichAfterSubmit = true,
    onTransactionComplete,
    requote,
  } = options;

  const createTransaction = useCreateTransactionV3();
  const getTransactionV3 = useGetTransactionV3Hook();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<TransactionResponseV3 | undefined>();
  const [enrichedDetails, setEnrichedDetails] = useState<
    TransactionGetResponseV3 | undefined
  >();
  const [error, setError] = useState<ErrorType<ApiErrorV2> | null>(null);
  const [usedMarketRateFallback, setUsedMarketRateFallback] = useState(false);

  const reset = useCallback(() => {
    setResponse(undefined);
    setEnrichedDetails(undefined);
    setError(null);
    setUsedMarketRateFallback(false);
    setIsSubmitting(false);
  }, []);

  const submit = useCallback(
    async (formData: PaymentFlowFXFormData): Promise<SubmitResult> => {
      setIsSubmitting(true);
      setError(null);
      setUsedMarketRateFallback(false);

      let effectiveFormData = formData;

      // Expired locked quote ⇒ one automatic re-quote, else market-rate fallback.
      if (isLockedQuoteExpired(formData)) {
        let refreshed: FxQuote | undefined;
        if (requote) {
          try {
            refreshed = await requote(formData);
          } catch {
            refreshed = undefined;
          }
        }
        if (refreshed && !refreshed.isIndicative && refreshed.rateId) {
          effectiveFormData = {
            ...formData,
            fxQuote: { ...refreshed, fetchedAt: new Date() },
          };
        } else {
          // Strip the expired rate: submit at the market rate.
          effectiveFormData = { ...formData, fxQuote: undefined };
          setUsedMarketRateFallback(true);
        }
      }

      const request = buildV3Request({
        formData: effectiveFormData,
        transactionReferenceId: generateTransactionReferenceId(),
        paymentType: toPaymentType(effectiveFormData.paymentMethod),
        paymentPurpose: fxConfig?.paymentPurpose,
      });

      try {
        const created = await createTransaction.mutateAsync({ data: request });
        setResponse(created);
        createTransaction.reset();

        let details: TransactionGetResponseV3 | undefined;
        if (enrichAfterSubmit && created?.id) {
          try {
            details = await getTransactionV3(created.id);
            setEnrichedDetails(details);
          } catch {
            // Silent degradation — the payment succeeded (FR-FX-9).
            details = undefined;
          }
        }

        onTransactionComplete?.(created, undefined, details);
        setIsSubmitting(false);
        return { success: true };
      } catch (err) {
        const axiosError = err as ErrorType<ApiErrorV2>;
        setError(axiosError);
        onTransactionComplete?.(undefined, {
          httpStatus: axiosError.response?.status ?? 500,
          title: axiosError.response?.data?.title ?? 'Transaction Failed',
        });
        setIsSubmitting(false);
        return { success: false };
      }
    },
    [
      createTransaction,
      getTransactionV3,
      enrichAfterSubmit,
      fxConfig?.paymentPurpose,
      onTransactionComplete,
      requote,
    ]
  );

  return {
    submit,
    isSubmitting,
    response,
    enrichedDetails,
    error,
    usedMarketRateFallback,
    reset,
    setError,
  };
}
