/**
 * FxQuotePreview
 *
 * Conversion card shown in the FX transfer view. Presents the approximate
 * amount the recipient receives, the exchange rate, a lock/indicative label, an
 * expiry countdown chip, a collapsible disclaimer, and a market-rate fallback
 * notice (SPECIFICATION.md FR-FX-7).
 */
import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangle, ChevronDown, Clock, Info, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import type { FxQuoteStatus } from '../hooks/useFxQuote';
import type { FxQuote } from '../PaymentFlowFX.types';
import { formatTargetCurrency } from '../utils/format';

export interface FxQuotePreviewProps {
  status: FxQuoteStatus;
  quote?: FxQuote;
  /** Reason shown when the quote is unavailable. */
  unavailableReason?: string;
  targetCurrency: string;
  /** USD amount being sent. */
  usdAmount: number;
  /** True when the last submission fell back to the market rate. */
  usedMarketRateFallback?: boolean;
  locale?: string;
}

/** Human-readable "expires in Xh Ym" / "Xm Ys" string, or null once expired. */
function formatCountdown(expiresAt?: Date, now?: number): string | null {
  if (!expiresAt) return null;
  const remainingMs = expiresAt.getTime() - (now ?? Date.now());
  if (remainingMs <= 0) return null;
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function FxQuotePreview({
  status,
  quote,
  unavailableReason,
  targetCurrency,
  usdAmount,
  usedMarketRateFallback = false,
  locale = 'en-US',
}: FxQuotePreviewProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Tick every second so the countdown chip stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quote?.expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quote?.expiresAt]);

  if (status === 'loading') {
    return (
      <div className="eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-4">
        <Skeleton className="eb-mb-2 eb-h-4 eb-w-32" />
        <Skeleton className="eb-mb-2 eb-h-6 eb-w-40" />
        <Skeleton className="eb-h-3 eb-w-24" />
      </div>
    );
  }

  if (status === 'unavailable' || status === 'idle') {
    // Non-blocking: the payment can still proceed at the market rate.
    return (
      <div className="eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-4">
        <div className="eb-flex eb-items-start eb-gap-2">
          <Info className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground" />
          <div className="eb-text-sm eb-text-muted-foreground">
            {unavailableReason ??
              t(
                'fx.rateUnavailable',
                'A live exchange rate is not available right now. Your payment will be converted at the market rate on execution.'
              )}
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const recipientGets =
    usdAmount > 0
      ? formatTargetCurrency(usdAmount * quote.rate, targetCurrency, locale)
      : null;
  const countdown = quote.isIndicative
    ? null
    : formatCountdown(quote.expiresAt, now);
  const isExpiringSoon = (() => {
    if (!quote.expiresAt || quote.isIndicative) return false;
    return quote.expiresAt.getTime() - now < 60 * 60 * 1000; // < 1h
  })();

  return (
    <div
      className="eb-rounded-lg eb-border eb-border-border eb-bg-primary/5 eb-p-4"
      aria-live="polite"
    >
      <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
        <div>
          <div className="eb-text-xs eb-text-muted-foreground">
            {t('fx.recipientGets', 'Recipient gets (approx.)')}
          </div>
          <div className="eb-text-lg eb-font-semibold">
            {recipientGets ?? '—'}
          </div>
          <div className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
            {t('fx.rateLine', '1 USD = {{rate}} {{currency}}', {
              rate: quote.rate.toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }),
              currency: targetCurrency,
            })}
          </div>
        </div>

        <div className="eb-flex eb-flex-col eb-items-end eb-gap-1.5">
          {quote.isIndicative ? (
            <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-bg-muted eb-px-2 eb-py-0.5 eb-text-xs eb-text-muted-foreground">
              <Info className="eb-h-3 eb-w-3" />
              {t('fx.indicative', 'Indicative')}
            </span>
          ) : (
            <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-bg-green-100 eb-px-2 eb-py-0.5 eb-text-xs eb-text-green-800">
              <Lock className="eb-h-3 eb-w-3" />
              {t('fx.locked', 'Locked')}
            </span>
          )}
          {countdown && (
            <span
              className={cn(
                'eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-px-2 eb-py-0.5 eb-text-xs',
                isExpiringSoon
                  ? 'eb-bg-amber-100 eb-text-amber-800'
                  : 'eb-bg-muted eb-text-muted-foreground'
              )}
            >
              <Clock className="eb-h-3 eb-w-3" />
              {t('fx.expiresIn', 'Expires in {{time}}', { time: countdown })}
            </span>
          )}
        </div>
      </div>

      {usedMarketRateFallback && (
        <div className="eb-mt-3 eb-flex eb-items-start eb-gap-2 eb-rounded-md eb-border eb-border-amber-200 eb-bg-amber-50 eb-p-2.5 eb-text-xs eb-text-amber-800">
          <AlertTriangle className="eb-mt-0.5 eb-h-3.5 eb-w-3.5 eb-shrink-0" />
          <span>
            {t(
              'fx.marketRateFallback',
              'The locked rate expired, so your payment was submitted at the market rate.'
            )}
          </span>
        </div>
      )}

      {quote.disclaimer && (
        <div className="eb-mt-3">
          <button
            type="button"
            onClick={() => setShowDisclaimer((v) => !v)}
            className="eb-flex eb-items-center eb-gap-1 eb-text-xs eb-text-muted-foreground hover:eb-text-foreground"
            aria-expanded={showDisclaimer}
          >
            <ChevronDown
              className={cn(
                'eb-h-3 eb-w-3 eb-transition-transform',
                showDisclaimer && 'eb-rotate-180'
              )}
            />
            {t('fx.rateDisclaimer', 'Rate disclaimer')}
          </button>
          {showDisclaimer && (
            <p className="eb-mt-1.5 eb-text-xs eb-text-muted-foreground">
              {quote.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
