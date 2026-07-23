import type { ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';

/**
 * The industry-classification field's rich guidance tooltip. Shared by the
 * onboarding `IndustryForm` step and the delta-mode review panel so both
 * surfaces render the exact same popover content (instead of the delta panel
 * dropping it). Returns `undefined` when the tooltip title token is not
 * configured, so callers can conditionally omit the tooltip.
 */
export function useIndustryTooltip(): ReactNode | undefined {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  if (!tString('screens.industryForm.tooltip.title')) {
    return undefined;
  }

  return (
    <div>
      <h2 className="eb-mb-0 eb-font-header eb-text-2xl eb-font-medium">
        {t('screens.industryForm.tooltip.title')}
      </h2>
      <p className="eb-mb-0 eb-mt-1 eb-text-sm">
        {t('screens.industryForm.tooltip.pleaseSelect')}
      </p>
      <h3 className="eb-mb-0 eb-mt-3 eb-text-sm eb-font-medium">
        {t('screens.industryForm.tooltip.ifSoleProp')}
      </h3>
      <p className="eb-mb-0 eb-mt-1 eb-text-sm">
        {t('screens.industryForm.tooltip.makeBestChoice')}
      </p>
    </div>
  );
}
