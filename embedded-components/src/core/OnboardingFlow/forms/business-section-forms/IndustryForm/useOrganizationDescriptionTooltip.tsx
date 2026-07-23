import type { ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';

/**
 * The business-description field's rich guidance tooltip (example + visibility
 * notes). Shared by the onboarding `IndustryForm` step and the delta-mode
 * review panel so both surfaces render the exact same popover content instead
 * of the delta panel dropping it. Returns `undefined` when the tooltip content
 * is not configured, so callers can conditionally omit the tooltip.
 */
export function useOrganizationDescriptionTooltip(): ReactNode | undefined {
  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  if (!tString('fields.organizationDescription.tooltipContent.exampleTitle')) {
    return undefined;
  }

  return (
    <div className="eb-space-y-3">
      <h2 className="eb-font-header eb-text-2xl eb-font-medium">
        {t('fields.organizationDescription.tooltipContent.exampleTitle')}
      </h2>
      <p className="eb-text-sm">
        {t('fields.organizationDescription.tooltipContent.exampleText')}
      </p>
      <p className="eb-pb-1 eb-text-sm">
        {t('fields.organizationDescription.tooltipContent.alignmentNote')}
      </p>
      <h2 className="eb-font-header eb-text-2xl eb-font-medium">
        {t('fields.organizationDescription.tooltipContent.visibilityTitle')}
      </h2>
      <p className="eb-pb-1 eb-text-sm">
        {t('fields.organizationDescription.tooltipContent.visibilityText')}
      </p>
    </div>
  );
}
