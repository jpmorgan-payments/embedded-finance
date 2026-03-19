import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { TransWithTokens, useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

/** Default English strings for `TransWithTokens` when a host `labelKey` is missing from bundles. */
const REVIEW_ACK_LABEL_DEFAULTS: Partial<Record<string, string>> = {
  'screens.linkAccount.review.acknowledgements.termsAndPolicies':
    'By confirming, you agree to our <termsLink>Terms & Conditions</termsLink> and acknowledge our <privacyLink>Privacy Policy</privacyLink>.',
  'screens.linkAccount.review.acknowledgements.payoutAccountAttestation':
    'I confirm this bank account is owned by or authorized for use by the business in my application for receiving payouts.',
};

function buildAcknowledgementLinkComponents(
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
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
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

  const reviewAcknowledgements =
    linkAccountStepOptions?.completionMode === 'readonly'
      ? linkAccountStepOptions.reviewAcknowledgements
      : undefined;

  const reviewAckIdsKey = useMemo(
    () =>
      reviewAcknowledgements?.length
        ? reviewAcknowledgements.map((a) => a.id).join('\0')
        : '',
    [reviewAcknowledgements]
  );

  const [acknowledgementChecked, setAcknowledgementChecked] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!reviewAcknowledgements?.length) {
      setAcknowledgementChecked({});
      return;
    }
    setAcknowledgementChecked(
      Object.fromEntries(reviewAcknowledgements.map((a) => [a.id, false]))
    );
  }, [reviewAckIdsKey]);

  const acknowledgementsComplete =
    !reviewAcknowledgements?.length ||
    reviewAcknowledgements.every((a) => acknowledgementChecked[a.id] === true);

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
          {reviewAcknowledgements && reviewAcknowledgements.length > 0 ? (
            <div
              className="eb-space-y-3 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-4"
              role="group"
              aria-label={tString(
                'screens.linkAccount.review.acknowledgementsGroupLabel',
                'Agreements required to link this account'
              )}
            >
              {reviewAcknowledgements.map((item) => {
                const checkboxId = `eb-link-account-ack-${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="eb-flex eb-items-start eb-gap-2"
                  >
                    <Checkbox
                      id={checkboxId}
                      className="eb-mt-0.5"
                      checked={acknowledgementChecked[item.id] === true}
                      onCheckedChange={(v) =>
                        setAcknowledgementChecked((prev) => ({
                          ...prev,
                          [item.id]: v === true,
                        }))
                      }
                      disabled={status === 'pending'}
                    />
                    <label
                      htmlFor={checkboxId}
                      className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-relaxed eb-text-foreground"
                    >
                      <TransWithTokens
                        ns="onboarding-overview"
                        i18nKey={item.labelKey}
                        defaults={REVIEW_ACK_LABEL_DEFAULTS[item.labelKey]}
                        components={buildAcknowledgementLinkComponents(
                          item.linkHrefs
                        )}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="eb-flex eb-flex-wrap eb-gap-2">
            <Button
              type="button"
              className="eb-inline-flex eb-items-center eb-gap-2"
              disabled={status === 'pending' || !acknowledgementsComplete}
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
