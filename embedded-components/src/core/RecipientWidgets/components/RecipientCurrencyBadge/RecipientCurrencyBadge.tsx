import { cn } from '@/lib/utils';
import { CurrencyFlag } from '@/core/PaymentFlowFX/components/CurrencyFlag';
import { CURRENCY_LABELS } from '@/core/PaymentFlowFX/PaymentFlowFX.constants';

export interface RecipientCurrencyBadgeProps {
  /** ISO 4217 currency code (e.g. `EUR`, `USD`). */
  currency: string;
  /** Extra classes for the badge wrapper. */
  className?: string;
  /**
   * When true, shows `EUR — Euro` (form-style label) instead of the ISO code alone.
   * @default false
   */
  showFullLabel?: boolean;
}

/**
 * Currency chip matching PaymentFlowFX patterns: {@link CurrencyFlag} plus an
 * accessible currency label (same assets/labels as the FX bank-account form).
 *
 * When `showFullLabel` is true, the visible text carries the name and the flag
 * is decorative (same as the PaymentFlowFX currency select). Otherwise the flag
 * exposes an accessible name via `title`.
 */
export function RecipientCurrencyBadge({
  currency,
  className,
  showFullLabel = false,
}: RecipientCurrencyBadgeProps) {
  const code = currency?.toUpperCase() || 'USD';
  const name = CURRENCY_LABELS[code] ?? code;
  const accessibleLabel = `${code} — ${name}`;
  const visibleLabel = showFullLabel ? accessibleLabel : code;

  return (
    <span
      className={cn(
        'eb-inline-flex eb-items-center eb-gap-1.5 eb-rounded eb-bg-muted eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-muted-foreground',
        className
      )}
      title={accessibleLabel}
    >
      <CurrencyFlag
        currency={code}
        className="eb-h-3 eb-w-4"
        title={showFullLabel ? undefined : accessibleLabel}
      />
      <span>{visibleLabel}</span>
    </span>
  );
}
