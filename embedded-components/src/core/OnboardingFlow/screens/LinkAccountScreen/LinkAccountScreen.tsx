import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';

import {
  canVerifyMicrodeposits,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  useClientId,
  useInterceptorStatus,
} from '@/core/EBComponentsProvider/EBComponentsProvider';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import {
  BankAccountForm,
  mergeBankAccountDefaultValues,
  useLinkedAccountConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { RecipientAccountDisplayCard } from '@/core/RecipientWidgets/components/RecipientAccountDisplayCard/RecipientAccountDisplayCard';
import { StatusAlert } from '@/core/RecipientWidgets/components/StatusAlert/StatusAlert';
import { MicrodepositsFormDialogTrigger } from '@/core/RecipientWidgets/forms/MicrodepositsForm/MicrodepositsForm';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';
import { LINKED_ACCOUNT_USER_JOURNEYS } from '@/core/RecipientWidgets/RecipientWidgets.constants';

import { LinkAccountPrefillSummaryView } from './LinkAccountPrefillSummaryView';

/** Fallback base merged with host `initialValues` for `prefillSummary`. */
const LINK_ACCOUNT_PREFILL_MERGE_BASE: BankAccountFormData = {
  accountType: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  businessName: '',
  routingNumbers: [{ paymentType: 'ACH', routingNumber: '' }],
  useSameRoutingNumber: true,
  accountNumber: '',
  bankAccountType: 'CHECKING',
  paymentTypes: ['ACH'],
  certify: false,
};

/**
 * LinkAccountScreen
 *
 * Rendered when the user opens the **Link bank account** flow step (sidebar / navigation).
 * Submits new links via {@link useRecipientForm}.
 *
 * **Second onboarding surface for linked accounts:** the **Overview** screen also shows a read-only
 * bank card + status (and the same **Verify Account** CTA when `READY_FOR_VALIDATION`) without
 * leaving Overview. This step repeats that existing-account UI and adds **Return to overview**.
 * Shared building blocks with **LinkedAccountWidget** (`RecipientAccountDisplayCard`,
 * `StatusAlert`, {@link MicrodepositsFormDialogTrigger}, `linked-accounts` i18n).
 *
 * - **`editable`** — `BankAccountForm` (two-step LINKED_ACCOUNT wizard).
 * - **`prefillSummary`** — `LinkAccountPrefillSummaryView` (disabled fields + optional acknowledgements).
 */
export const LinkAccountScreen = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);
  const { goBack } = useFlowContext();
  const { clientData, linkAccountStepOptions } = useOnboardingContext();

  const clientId = useClientId();
  const { interceptorReady } = useInterceptorStatus();

  // Fetch fresh client data for the form (needed for account-holder prefill)
  const { data: clientResponseData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: interceptorReady && !!clientId,
    },
  });

  // Fetch existing linked accounts
  const { data: recipientsData, isLoading: isLoadingRecipients } =
    useGetAllRecipients(
      { type: 'LINKED_ACCOUNT' },
      {
        query: {
          enabled: interceptorReady,
        },
      }
    );

  const existingAccount: Recipient | undefined =
    recipientsData?.recipients?.find(
      (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
    );

  const [isSuccess, setIsSuccess] = useState(false);

  const linkAcknowledgementItems =
    linkAccountStepOptions?.completionMode === 'prefillSummary'
      ? linkAccountStepOptions.reviewAcknowledgements
      : undefined;

  const linkAckIdsKey = useMemo(
    () =>
      linkAcknowledgementItems?.length
        ? linkAcknowledgementItems.map((a) => a.id).join('\0')
        : '',
    [linkAcknowledgementItems]
  );

  const [acknowledgementChecked, setAcknowledgementChecked] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!linkAcknowledgementItems?.length) {
      setAcknowledgementChecked({});
      return;
    }
    setAcknowledgementChecked(
      Object.fromEntries(linkAcknowledgementItems.map((a) => [a.id, false]))
    );
  }, [linkAckIdsKey]);

  const acknowledgementsComplete =
    !linkAcknowledgementItems?.length ||
    linkAcknowledgementItems.every(
      (a) => acknowledgementChecked[a.id] === true
    );

  // Use the linked-account config hook (same as BankAccountFormWrapper)
  const linkedAccountConfig = useLinkedAccountConfig();

  // Use the recipient form hook for API submission
  const {
    submit,
    status,
    error: formError,
    reset,
  } = useRecipientForm({
    mode: 'create',
    recipientType: 'LINKED_ACCOUNT',
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const config = {
    ...linkedAccountConfig,
    content: {
      ...linkedAccountConfig.content,
      submitButtonText: t('screens.linkAccount.submitButton', 'Link Account'),
      cancelButtonText: t('common:cancel', 'Cancel'),
    },
  };

  const prefillSummaryFormData = useMemo(() => {
    if (linkAccountStepOptions?.completionMode !== 'prefillSummary') {
      return null;
    }
    return mergeBankAccountDefaultValues(
      LINK_ACCOUNT_PREFILL_MERGE_BASE,
      linkAccountStepOptions.initialValues
    );
  }, [linkAccountStepOptions]);

  const summaryDisplayedPaymentTypes =
    useMemo((): RoutingInformationTransactionType[] => {
      if (
        !prefillSummaryFormData ||
        linkAccountStepOptions?.completionMode !== 'prefillSummary'
      ) {
        return [];
      }
      const explicit = linkAccountStepOptions.summaryDisplayedPaymentTypes;
      if (explicit?.length) {
        return [...explicit];
      }
      const pt = prefillSummaryFormData.paymentTypes;
      if (pt?.length) {
        return [...pt];
      }
      return ['ACH'];
    }, [linkAccountStepOptions, prefillSummaryFormData]);

  const handleSubmit = (data: BankAccountFormData) => {
    submit(data);
  };

  const handleCancel = () => {
    reset();
    goBack();
  };

  const defaultValuesOverride =
    linkAccountStepOptions?.completionMode === 'editable'
      ? linkAccountStepOptions.initialValues
      : undefined;

  const errorAlert = formError ? (
    <ServerErrorAlert
      error={formError as any}
      customTitle={t(
        'screens.linkAccount.errorTitle',
        'Failed to link account'
      )}
      customErrorMessage={{
        '400': t(
          'screens.linkAccount.errors.400',
          'Please check the information you entered and try again.'
        ),
        '401': t(
          'screens.linkAccount.errors.401',
          'Your session has expired. Please log in and try again.'
        ),
        '409': t(
          'screens.linkAccount.errors.409',
          'This account may already exist. Please check your linked accounts.'
        ),
        '422': t(
          'screens.linkAccount.errors.422',
          'The account information is invalid. Please verify and try again.'
        ),
        '500': t(
          'screens.linkAccount.errors.500',
          'An unexpected error occurred. Please try again later.'
        ),
        default: t(
          'screens.linkAccount.errors.default',
          'An unexpected error occurred. Please try again.'
        ),
      }}
      showDetails={false}
    />
  ) : undefined;

  // Loading state while checking for existing accounts
  if (isLoadingRecipients) {
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        </div>
      </StepLayout>
    );
  }

  // Existing account state – show the linked account card
  if (existingAccount) {
    const displayName = getRecipientDisplayName(existingAccount);
    const showVerifyMicrodeposit = canVerifyMicrodeposits(existingAccount);

    return (
      <StepLayout
        title={t(
          'screens.linkAccount.existingAccount.title',
          'Your linked bank account'
        )}
        description={t(
          'screens.linkAccount.existingAccount.description',
          'This bank account is linked for payouts.'
        )}
      >
        <div className="eb-mt-6 eb-space-y-4">
          <RecipientAccountDisplayCard
            recipient={existingAccount}
            statusAlert={
              existingAccount.status && existingAccount.status !== 'ACTIVE' ? (
                <StatusAlert
                  status={existingAccount.status}
                  action={
                    showVerifyMicrodeposit ? (
                      <MicrodepositsFormDialogTrigger
                        recipientId={existingAccount.id}
                      >
                        <Button
                          variant="default"
                          size="sm"
                          data-user-event={
                            LINKED_ACCOUNT_USER_JOURNEYS.VERIFY_STARTED
                          }
                          aria-label={`${tString('linked-accounts:actions.verifyAccount')} for ${displayName}`}
                        >
                          <span>
                            {t('linked-accounts:actions.verifyAccount')}
                          </span>
                          <ArrowRightIcon
                            className="eb-ml-2 eb-h-4 eb-w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </MicrodepositsFormDialogTrigger>
                    ) : undefined
                  }
                />
              ) : undefined
            }
            showAccountToggle
            showPaymentMethods
            allowDetailedPaymentMethods={false}
          />
          <Button variant="outline" size="sm" onClick={() => goBack()}>
            <ArrowLeftIcon className="eb-size-4" />
            {t('screens.linkAccount.returnToOverview', 'Return to overview')}
          </Button>
        </div>
      </StepLayout>
    );
  }

  // Success state – show confirmation and allow returning to overview
  if (isSuccess) {
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Alert variant="success" density="sm">
            <CheckCircle2Icon className="eb-size-4" />
            <AlertTitle>
              {t(
                'screens.linkAccount.success.title',
                'Account linked successfully'
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                'screens.linkAccount.success.description',
                'Your bank account has been linked for payouts.'
              )}
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={() => goBack()}>
            <ArrowLeftIcon className="eb-size-4" />
            {t('screens.linkAccount.returnToOverview', 'Return to overview')}
          </Button>
        </div>
      </StepLayout>
    );
  }

  // Host prefill: single-page read-only bank summary + acknowledgements + submit
  if (
    prefillSummaryFormData &&
    linkAccountStepOptions?.completionMode === 'prefillSummary'
  ) {
    return (
      <LinkAccountPrefillSummaryView
        title={t('screens.linkAccount.title', 'Link a bank account')}
        description={t(
          'screens.linkAccount.prefillSummary.description',
          'Review your bank details and accept the agreements to link this account.'
        )}
        data={prefillSummaryFormData}
        displayedPaymentTypes={summaryDisplayedPaymentTypes}
        bankFormConfig={linkedAccountConfig}
        acknowledgements={linkAcknowledgementItems}
        acknowledgementsIntro={
          linkAcknowledgementItems?.length &&
          linkAccountStepOptions?.showAcknowledgementsIntro
            ? t(
                'screens.linkAccount.prefillSummary.acknowledgementsIntro',
                'By electronically linking this account, you agree that:'
              )
            : undefined
        }
        acknowledgementChecked={acknowledgementChecked}
        onAcknowledgementChange={(id, value) =>
          setAcknowledgementChecked((prev) => ({ ...prev, [id]: value }))
        }
        acknowledgementsComplete={acknowledgementsComplete}
        onSubmit={() =>
          submit({
            ...prefillSummaryFormData,
            certify: true,
          })
        }
        onCancel={handleCancel}
        isSubmitting={status === 'pending'}
        errorAlert={errorAlert}
        submitLabel={tString(
          'screens.linkAccount.review.confirmButton',
          'Confirm and link account'
        )}
        cancelLabel={tString('common:cancel', 'Cancel')}
        groupAriaLabel={tString(
          'screens.linkAccount.review.acknowledgementsGroupLabel',
          'Agreements required to link this account'
        )}
        accountHolderLabel={tString(
          'screens.linkAccount.prefillSummary.accountHolderLabel',
          'Account holder'
        )}
      />
    );
  }

  return (
    <StepLayout
      title={t('screens.linkAccount.title', 'Link a bank account')}
      description={t(
        'screens.linkAccount.description',
        'Connect your bank account to receive payouts.'
      )}
    >
      <div className="eb-mt-6">
        <BankAccountForm
          config={config}
          client={clientResponseData ?? clientData}
          defaultValuesOverride={defaultValuesOverride}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={status === 'pending'}
          showCard={false}
          embedded
          alert={errorAlert}
        />
      </div>
    </StepLayout>
  );
};
