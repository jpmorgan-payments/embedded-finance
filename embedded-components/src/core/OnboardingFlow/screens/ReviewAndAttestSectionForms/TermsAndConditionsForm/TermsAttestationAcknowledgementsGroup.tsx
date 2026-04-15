import type { ReactElement, ReactNode } from 'react';
import { TransWithTokens } from '@/i18n';

import { Checkbox } from '@/components/ui/checkbox';
import type { ReviewAttestTermsAcknowledgement } from '@/core/OnboardingFlow/types/onboarding.types';

/**
 * Fallback English when a host `labelKey` is not in the locale bundle.
 * Prefer adding strings to `onboarding-overview` JSON.
 */
export const TERMS_ATTESTATION_ACK_LABEL_DEFAULTS: Partial<
  Record<string, string>
> = {
  'reviewAndAttest.attestation.authorizeSharing':
    'You authorize {{platformName}} and JPMorgan Chase Bank, N.A. ("JPMC") to share information to facilitate the opening of your deposit account(s), and appoint {{platformName}} as your agent to act on your behalf regarding your deposit account.',
  'reviewAndAttest.termsAndConditions.agreeToTerms':
    'You have read and agree to the J.P. Morgan Account Terms.',
  'reviewAndAttest.termsAndConditions.agreeToTermsWithPlatform':
    'You have read and agree to the J.P. Morgan Account Terms and the {{platformAgreementLabel}}.',
};

function buildAttestationLinkComponents(
  linkHrefs: Record<string, string> | undefined
): Record<string, ReactElement> | undefined {
  if (!linkHrefs || Object.keys(linkHrefs).length === 0) {
    return undefined;
  }
  const out: Record<string, ReactElement> = {};
  for (const [tag, href] of Object.entries(linkHrefs)) {
    out[tag] = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="eb-text-primary eb-underline eb-underline-offset-2 hover:eb-underline"
      />
    );
  }
  return out;
}

export type TermsAttestationAcknowledgementsGroupProps = {
  items: readonly ReviewAttestTermsAcknowledgement[];
  checked: Record<string, boolean>;
  onCheckedChange: (id: string, value: boolean) => void;
  disabled?: boolean;
  groupAriaLabel: string;
  intro?: ReactNode;
  /** e.g. `platformName`, `platformAgreementLabel` for `{{...}}` in copy */
  labelInterpolationValues?: Record<string, unknown>;
};

export function TermsAttestationAcknowledgementsGroup({
  items,
  checked,
  onCheckedChange,
  disabled = false,
  groupAriaLabel,
  intro,
  labelInterpolationValues,
}: TermsAttestationAcknowledgementsGroupProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="eb-space-y-3">
      {intro ? (
        <p className="eb-text-sm eb-font-medium eb-text-foreground">{intro}</p>
      ) : null}
      <div
        className="eb-space-y-3 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-4"
        role="group"
        aria-label={groupAriaLabel}
      >
        {items.map((item) => {
          const checkboxId = `eb-terms-attest-ack-${item.id}`;
          return (
            <div key={item.id} className="eb-flex eb-items-start eb-gap-2">
              <Checkbox
                id={checkboxId}
                className="eb-mt-0.5"
                checked={checked[item.id] === true}
                onCheckedChange={(v) => onCheckedChange(item.id, v === true)}
                disabled={disabled}
              />
              <label
                htmlFor={checkboxId}
                className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-relaxed eb-text-foreground"
              >
                <TransWithTokens
                  ns="onboarding-overview"
                  i18nKey={item.labelKey}
                  values={labelInterpolationValues}
                  defaults={TERMS_ATTESTATION_ACK_LABEL_DEFAULTS[item.labelKey]}
                  components={buildAttestationLinkComponents(item.linkHrefs)}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
