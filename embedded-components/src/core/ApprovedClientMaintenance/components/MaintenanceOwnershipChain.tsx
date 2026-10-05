import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';

export function MaintenanceOwnershipChain({
  steps,
  finalLabel,
}: {
  steps: string[];
  finalLabel: string;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  return (
    <ol data-ownership-chain="">
      {steps.map((step, index) => {
        const isLastStep = index === steps.length - 1;
        return (
          <li
            key={`${step}-${index}`}
            className="eb-relative eb-flex eb-gap-3 eb-pb-3 last:eb-pb-0"
          >
            {!isLastStep ? (
              <span
                aria-hidden="true"
                className="eb-absolute eb-bottom-0 eb-left-[7px] eb-top-4 eb-border-l-2 eb-border-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                'eb-relative eb-mt-1 eb-size-4 eb-shrink-0 eb-rounded-full eb-border-2',
                isLastStep
                  ? 'eb-border-primary eb-bg-accent'
                  : 'eb-border-border eb-bg-background'
              )}
            />
            <span className="eb-min-w-0">
              <span
                className={cn(
                  'eb-block eb-truncate eb-text-sm',
                  isLastStep && 'eb-font-medium'
                )}
              >
                {step}
              </span>
              <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                {isLastStep
                  ? finalLabel
                  : index === 0
                    ? t('ownership.clientRoot')
                    : t('ownership.intermediaryOwner')}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
