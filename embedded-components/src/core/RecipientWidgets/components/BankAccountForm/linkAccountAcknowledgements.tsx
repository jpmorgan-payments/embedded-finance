import type { ReactElement, ReactNode } from 'react';
import { TransWithTokens } from '@/i18n';

import { Checkbox } from '@/components/ui/checkbox';

import type { LinkAccountReviewAcknowledgement } from './BankAccountForm.types';

/** Default English for `TransWithTokens` when a host `labelKey` is missing from bundles. */
export const LINK_ACCOUNT_ACK_LABEL_DEFAULTS: Partial<Record<string, string>> =
  {
    'screens.linkAccount.review.acknowledgements.termsAndPolicies':
      'By confirming, you agree to our <termsLink>Terms & Conditions</termsLink> and acknowledge our <privacyLink>Privacy Policy</privacyLink>.',
    'screens.linkAccount.review.acknowledgements.payoutAccountAttestation':
      'I confirm this bank account is owned by or authorized for use by the business in my application for receiving payouts.',
    'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose':
      'I acknowledge that the linked account is primarily for business purposes and not for consumer purposes.',
    'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy':
      'I authorize verification of this linked account, including microdeposit verification if required. I certify that the information provided is accurate and matches my bank account details.',
    'screens.linkAccount.prefillSummary.acknowledgements.debitAndTerms':
      'I authorize the platform provider and JPMorgan Chase Bank, N.A. to debit my linked account or accounts for funding, payment of negative balances, or other fees. I have read and agree to the <jpTermsLink>J.P. Morgan terms</jpTermsLink> and the <platformAgreementLink>platform provider program agreement</platformAgreementLink>.',
  };

export function buildAcknowledgementLinkComponents(
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

type LinkAccountAcknowledgementsGroupProps = {
  items: readonly LinkAccountReviewAcknowledgement[];
  checked: Record<string, boolean>;
  onCheckedChange: (id: string, value: boolean) => void;
  disabled?: boolean;
  groupAriaLabel: string;
  intro?: ReactNode;
};

export function LinkAccountAcknowledgementsGroup({
  items,
  checked,
  onCheckedChange,
  disabled = false,
  groupAriaLabel,
  intro,
}: LinkAccountAcknowledgementsGroupProps) {
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
          const checkboxId = `eb-link-account-ack-${item.id}`;
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
                  defaults={LINK_ACCOUNT_ACK_LABEL_DEFAULTS[item.labelKey]}
                  components={buildAcknowledgementLinkComponents(
                    item.linkHrefs
                  )}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
