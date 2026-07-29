import { useMemo } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';

import { LinkAccountFormPanel } from './LinkAccountFormPanel';

/**
 * LinkAccountScreen
 *
 * Dedicated onboarding step for linking a bank account (sidebar / Add flow).
 * Empty Overview embeds the same form via {@link LinkAccountFormPanel}.
 * Supports `editable` and `reviewOnly` completion modes.
 */
export const LinkAccountScreen = () => {
  const { t } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);
  const { goTo, updateSessionData } = useFlowContext();
  const { clientData, linkAccountStepOptions } = useOnboardingContext();

  const clientId = clientData?.id;

  const { data: recipientsData, isLoading: isLoadingRecipients } =
    useGetAllRecipients(
      { type: 'LINKED_ACCOUNT', clientId },
      { query: { enabled: !!clientId } }
    );

  const existingAccounts: Recipient[] = useMemo(
    () =>
      recipientsData?.recipients?.filter(
        (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      ) ?? [],
    [recipientsData]
  );

  const existingAccount = existingAccounts[0];
  const shouldRedirectOnExisting =
    !!existingAccount && !linkAccountStepOptions?.allowMultipleAccounts;

  if (isLoadingRecipients) {
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        </div>
      </StepLayout>
    );
  }

  if (shouldRedirectOnExisting) {
    setTimeout(() => goTo('overview', { resetHistory: true }), 0);
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        </div>
      </StepLayout>
    );
  }

  return (
    <LinkAccountFormPanel
      existingAccounts={existingAccounts}
      layout="step"
      onSuccess={() => {
        updateSessionData({ linkAccountJustCreated: true });
        goTo('overview', { resetHistory: true });
      }}
      onCancel={() => goTo('overview', { resetHistory: true })}
    />
  );
};
