/**
 * FxReviewBlock
 *
 * Compact conversion summary rendered inside the shared ReviewPanel (via its
 * `renderExtraContent` hook) for cross-border payouts. Presentational: it reads
 * the live form data passed by the ReviewPanel. See SPECIFICATION.md FR-FX-7.
 */
import { useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Clock, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import { formatTargetCurrency } from '../utils/format';

export interface FxReviewBlockProps {
  formData: PaymentFlowFXFormData;
  locale?: string;
}

/** Human-readable "Xh Ym" / "Xm Ys" remaining string, or null once expired. */
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

export function FxReviewBlock({
  formData,
  locale = 'en-US',
}: FxReviewBlockProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  const { targetCurrency, fxQuote } = formData;

  const isLocked = !!fxQuote && !fxQuote.isIndicative;

  // Tick every second so the lock countdown stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLocked || !fxQuote?.expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked, fxQuote?.expiresAt]);

  // Only render for active cross-border payouts.
  if (!targetCurrency || targetCurrency === 'USD') return null;

  const usdAmount = parseFloat(formData.amount) || 0;
  const rate = fxQuote?.rate;
  const hasRate = rate !== undefined && rate > 0;
  const estimatedTarget = hasRate ? usdAmount * (rate as number) : null;

  const countdown = isLocked ? formatCountdown(fxQuote?.expiresAt, now) : null;
  const isExpiringSoon =
    isLocked && fxQuote?.expiresAt
      ? fxQuote.expiresAt.getTime() - now < 60 * 60 * 1000
      : false;

  return (
    <div
      className="eb-space-y-2 eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-3"
      aria-live="polite"
    >
      <div className="eb-flex eb-items-center eb-justify-between">
        <span className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
          {t('fx.conversionTitle', 'Currency conversion')}
        </span>
        <div className="eb-flex eb-items-center eb-gap-1.5">
          {isLocked && (
            <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-bg-primary/10 eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-primary">
              <Lock className="eb-h-3 eb-w-3" />
              {t('fx.locked', 'Locked')}
            </span>
          )}
          {countdown && (
            <span
              className={cn(
                'eb-inline-flex eb-items-center eb-gap-1 eb-rounded eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium',
                isExpiringSoon
                  ? 'eb-bg-amber-100 eb-text-amber-800'
                  : 'eb-bg-muted eb-text-muted-foreground'
              )}
            >
              <Clock className="eb-h-3 eb-w-3" />
              {t('fx.expiresIn', 'Expires in {{time}}', { time: countdown })}
            </span>
          )}
          {fxQuote?.isIndicative && (
            <span className="eb-rounded eb-bg-muted eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
              {t('fx.indicative', 'Indicative')}
            </span>
          )}
        </div>
      </div>

      {estimatedTarget !== null ? (
        <div className="eb-flex eb-items-baseline eb-justify-between">
          <span className="eb-text-sm eb-text-muted-foreground">
            {t('fx.recipientGetsApprox', 'Recipient gets (approx.)')}
          </span>
          <span className="eb-text-sm eb-font-semibold">
            {formatTargetCurrency(estimatedTarget, targetCurrency, locale)}
          </span>
        </div>
      ) : (
        <p className="eb-text-sm eb-text-muted-foreground">
          {t(
            'fx.convertedAtProcessing',
            'The final amount in {{currency}} is determined at processing.',
            { currency: targetCurrency }
          )}
        </p>
      )}

      {hasRate && (
        <div className="eb-flex eb-items-baseline eb-justify-between">
          <span className="eb-text-xs eb-text-muted-foreground">
            {t('fx.rate', 'Rate')}
          </span>
          <span className="eb-text-xs eb-font-medium">
            {t('fx.rateLine', '1 USD = {{rate}} {{currency}}', {
              rate: (rate as number).toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }),
              currency: targetCurrency,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
