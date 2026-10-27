import { useTranslationWithTokens } from '@/i18n';

import type { OrganizationType } from '@/api/generated/smbdo.schemas';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';

/**
 * Display label for an organization type, preferring a host-defined label from
 * `experimental_organizationTypesByCountryOfFormation` over the built-in translation.
 */
export function useOrganizationTypeLabel() {
  const { experimental_organizationTypesByCountryOfFormation } =
    useOnboardingContext();
  const { t } = useTranslationWithTokens(['onboarding-overview']);

  return (organizationType: string) => {
    const hostOption = Object.values(
      experimental_organizationTypesByCountryOfFormation ?? {}
    )
      .flat()
      .find((option) => option?.value === organizationType);

    return (
      hostOption?.label ??
      t(
        `organizationTypes.${organizationType as OrganizationType}`,
        organizationType
      )
    );
  };
}
