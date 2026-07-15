import { Globe } from 'lucide-react';
import type { Country } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import { cn } from '@/lib/utils';

import { CURRENCY_TO_COUNTRY } from '../PaymentFlowFX.constants';

export interface CurrencyFlagProps {
  /** ISO 4217 currency code (e.g. `EUR`, `GBP`). */
  currency: string;
  /** Extra classes for the flag wrapper. */
  className?: string;
  /**
   * Accessible label. When provided, the flag is exposed to assistive tech;
   * otherwise it is treated as decorative (`aria-hidden`).
   */
  title?: string;
}

/**
 * Renders the country flag for a currency using the SVG flag set from
 * `react-phone-number-input` (the same asset set used by the phone input).
 *
 * The currency is mapped to an ISO 3166-1 alpha-2 country code via
 * {@link CURRENCY_TO_COUNTRY}. The Eurozone (`EU`) and any unmapped currency
 * fall back to a globe glyph, since there is no single-country flag for them.
 */
export function CurrencyFlag({
  currency,
  className,
  title,
}: CurrencyFlagProps) {
  const country = CURRENCY_TO_COUNTRY[currency?.toUpperCase()];
  const Flag =
    country && country !== 'EU' ? flags[country as Country] : undefined;

  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn(
        'eb-flex eb-h-4 eb-w-6 eb-shrink-0 eb-items-center eb-justify-center eb-overflow-hidden eb-rounded-sm eb-bg-foreground/10 [&_svg]:eb-size-full',
        className
      )}
    >
      {Flag ? (
        <Flag title={title ?? currency} />
      ) : (
        <Globe className="eb-h-3.5 eb-w-3.5 eb-text-muted-foreground" />
      )}
    </span>
  );
}
