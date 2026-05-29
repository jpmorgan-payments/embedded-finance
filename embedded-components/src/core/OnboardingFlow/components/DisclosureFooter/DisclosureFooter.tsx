import { useTranslationWithTokens } from '@/i18n';

import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';

/**
 * Persistent disclosure footer required by regulatory guidelines (§ 1.1).
 *
 * Renders:
 * - "Banking services provided by JPMorgan Chase Bank, N.A.,
 *    Member FDIC. [Platform Provider] is not a bank."
 *
 * Only visible when the host supplies a `disclosureConfig` with a
 * `platformName`.  All copy is controlled via `onboarding-old` i18n
 * content tokens so platforms can override wording if approved by
 * JPM Legal.
 */
export function DisclosureFooter() {
  const { disclosureConfig, showDisclosureFooter } = useOnboardingContext();

  const { t } = useTranslationWithTokens('onboarding-old');

  if (!showDisclosureFooter || !disclosureConfig?.platformName) {
    return null;
  }

  return (
    <footer
      className="eb-mt-6 eb-border-t eb-border-border eb-px-4 eb-py-3 eb-text-center eb-text-xs eb-text-muted-foreground"
      role="contentinfo"
      aria-label="Regulatory disclosure"
    >
      <p>
        {t('reviewAndAttest.disclosure.footer', {
          platformName: disclosureConfig.platformName,
          defaultValue:
            'Banking services provided by JPMorgan Chase Bank, N.A., Member FDIC. {{platformName}} is not a bank.',
        })}
      </p>
    </footer>
  );
}
