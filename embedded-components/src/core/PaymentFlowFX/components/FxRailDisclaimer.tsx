import { useTranslationWithTokens } from '@/i18n';
import { ArrowRightLeftIcon, BanknoteIcon, InfoIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  FX_RAIL_INFO,
  getFxAvailableRails,
  getFxCurrencyRequirement,
  type FxRail,
} from '../fxRecipientRequirements';

export interface FxRailDisclaimerProps {
  /** ISO 4217 credit currency the recipient will be paid in. */
  currency: string;
  /** Optional extra classes. */
  className?: string;
}

const RAIL_ICON: Record<FxRail, typeof BanknoteIcon> = {
  ACH: BanknoteIcon,
  WIRE: ArrowRightLeftIcon,
};

/**
 * FX-only disclaimer that explains which settlement rails are available for the
 * selected credit currency, and clarifies that these are the FX product's
 * value tiers — **not** US domestic ACH/wire.
 *
 * Rail availability comes from {@link getFxAvailableRails}; per-rail copy
 * (tier, use case, settlement window) comes from {@link FX_RAIL_INFO}, which
 * mirrors the PDP "Rail eligibility" table.
 */
export function FxRailDisclaimer({
  currency,
  className,
}: FxRailDisclaimerProps) {
  const { t, tString } = useTranslationWithTokens(['make-payment']);
  const requirement = getFxCurrencyRequirement(currency);
  const rails = getFxAvailableRails(currency);

  if (!requirement || rails.length === 0) {
    return null;
  }

  return (
    <Alert
      variant="informative"
      density="sm"
      className={className}
      data-testid="fx-rail-disclaimer"
    >
      <InfoIcon className="eb-h-4 eb-w-4" />
      <AlertTitle>
        {t('fx.rails.title', 'Payment rails for {{country}} ({{currency}})', {
          country: requirement.countryName,
          currency: requirement.currency,
        })}
      </AlertTitle>
      <AlertDescription>
        <ul className="eb-mt-1 eb-space-y-2">
          {rails.map((rail) => {
            const info = FX_RAIL_INFO[rail];
            const Icon = RAIL_ICON[rail];
            return (
              <li key={rail} className="eb-flex eb-items-start eb-gap-2">
                <Icon
                  className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-informative"
                  aria-hidden="true"
                />
                <span>
                  <span className="eb-font-medium">
                    {t(
                      `fx.rails.label.${rail}`,
                      rail === 'WIRE' ? 'FX High-value' : 'FX Low-value'
                    )}
                  </span>
                  {' — '}
                  {t(`fx.rails.useCase.${rail}`, info.useCase)}
                  {'. '}
                  <span className="eb-text-muted-foreground">
                    {t('fx.rails.settlement', 'Settles in {{window}}.', {
                      window: tString(
                        `fx.rails.window.${rail}`,
                        info.settlement
                      ),
                    })}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
          {t(
            'fx.rails.notUsAch',
            '\u201cACH\u201d and \u201cWire\u201d here refer to the FX low-value and high-value settlement tiers \u2014 not US domestic ACH or Fedwire. The available rails depend on the destination currency and your funding account type.'
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}
