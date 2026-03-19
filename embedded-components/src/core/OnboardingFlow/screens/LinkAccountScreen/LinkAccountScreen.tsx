import { useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
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
  bankAccountFormDataToDisplayRecipient,
  mergeBankAccountDefaultValues,
  useLinkedAccountConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { RecipientAccountDisplayCard } from '@/core/RecipientWidgets/components/RecipientAccountDisplayCard/RecipientAccountDisplayCard';
import { StatusAlert } from '@/core/RecipientWidgets/components/StatusAlert/StatusAlert';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

/** Fallback base merged with host `initialValues` for readonly review + submit. */
const LINK_ACCOUNT_READONLY_FALLBACK_BASE: BankAccountFormData = {
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
 * Screen rendered within the OnboardingFlow when the user clicks "Start"
 * on the link-account section.  It wraps the shared `BankAccountForm`
 * component configured for the LINKED_ACCOUNT use-case and submits via
 * the `useRecipientForm` hook.
 */
export const LinkAccountScreen = () => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);
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

  const readonlyFormData = useMemo(() => {
    if (linkAccountStepOptions?.completionMode !== 'readonly') {
      return null;
    }
    return mergeBankAccountDefaultValues(
      LINK_ACCOUNT_READONLY_FALLBACK_BASE,
      linkAccountStepOptions.initialValues
    );
  }, [linkAccountStepOptions]);

  const readonlyDisplayRecipient = useMemo(
    () =>
      readonlyFormData
        ? bankAccountFormDataToDisplayRecipient(readonlyFormData)
        : null,
    [readonlyFormData]
  );

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
                <StatusAlert status={existingAccount.status} />
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

  // Host prefill: review-only — confirm submits POST /recipients
  if (readonlyFormData && readonlyDisplayRecipient) {
    return (
      <StepLayout
        title={t(
          'screens.linkAccount.review.title',
          'Review your bank account'
        )}
        description={t(
          'screens.linkAccount.review.description',
          'Confirm the details below before linking this account for payouts.'
        )}
      >
        <div className="eb-mt-6 eb-space-y-4">
          {errorAlert}
          <RecipientAccountDisplayCard
            recipient={readonlyDisplayRecipient}
            showAccountToggle
            showPaymentMethods
            allowDetailedPaymentMethods={false}
          />
          {readonlyFormData.address ? (
            <div className="eb-text-sm eb-text-muted-foreground">
              <p className="eb-font-medium eb-text-foreground">
                {t(
                  'screens.linkAccount.review.addressHeading',
                  'Account holder address'
                )}
              </p>
              <p>
                {[
                  readonlyFormData.address.addressLine1,
                  readonlyFormData.address.addressLine2,
                  readonlyFormData.address.addressLine3,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>
                {[
                  readonlyFormData.address.city,
                  readonlyFormData.address.state,
                  readonlyFormData.address.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          ) : null}
          {readonlyFormData.contacts && readonlyFormData.contacts.length > 0 ? (
            <div className="eb-text-sm eb-text-muted-foreground">
              <p className="eb-font-medium eb-text-foreground">
                {t('screens.linkAccount.review.contactsHeading', 'Contact')}
              </p>
              <ul className="eb-list-inside eb-list-disc eb-space-y-1">
                {readonlyFormData.contacts.map((c, i) => (
                  <li key={`${c.contactType}-${i}`}>
                    {c.contactType}: {c.value}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="eb-flex eb-flex-wrap eb-gap-2">
            <Button
              type="button"
              className="eb-inline-flex eb-items-center eb-gap-2"
              disabled={status === 'pending'}
              onClick={() => submit(readonlyFormData)}
            >
              {status === 'pending' ? (
                <Loader2Icon
                  className="eb-size-4 eb-animate-spin"
                  aria-hidden
                />
              ) : null}
              {t(
                'screens.linkAccount.review.confirmButton',
                'Confirm and link account'
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeftIcon className="eb-size-4" />
              {t('common:cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </StepLayout>
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
