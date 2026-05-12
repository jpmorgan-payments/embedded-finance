import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import type { LinkAccountPresetEntry } from '@/core/OnboardingFlow/types/onboarding.types';
import {
  BankAccountForm,
  createCustomConfig,
  mergeBankAccountDefaultValues,
  useLinkedAccountConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { RecipientCard } from '@/core/RecipientWidgets/components/RecipientCard/RecipientCard';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';
import { invalidateRecipientQueries } from '@/core/RecipientWidgets/utils/invalidateRecipientQueries';

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
 * - **`reviewAcknowledgements`** — optional in any mode; `prefillSummary` uses the summary view, `editable` uses `BankAccountForm` step 2.
 */
export const LinkAccountScreen = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);
  const { goTo, setFlowUnsavedChanges, updateSessionData } = useFlowContext();
  const { clientData, linkAccountStepOptions, hideLinkedAccountRemoval } =
    useOnboardingContext();
  const queryClient = useQueryClient();

  const { interceptorReady } = useInterceptorStatus();

  // Use the clientId from onboarding context (clientData.id) rather than the
  // provider's clientId.  When no clientId was supplied to EBComponentsProvider
  // a new client is created after the gateway screen and only the onboarding
  // context is updated — the provider value stays empty.
  const clientId = clientData?.id;

  // ─── Multi-account preset selection ─────────────────────────────────────────
  const presetAccounts = linkAccountStepOptions?.presetAccounts;
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(
    () => presetAccounts?.[0]?.id
  );

  // Track linked-then-continue flow (allowMultipleAccounts)
  const [linkedCount, setLinkedCount] = useState(0);
  const [showLinkAnother, setShowLinkAnother] = useState(false);
  // When existing accounts present + allowMultipleAccounts, hide form until user clicks "Link another"
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedPreset: LinkAccountPresetEntry | undefined = useMemo(() => {
    if (!presetAccounts?.length) return undefined;
    return presetAccounts.find((p) => p.id === selectedPresetId);
  }, [presetAccounts, selectedPresetId]);

  /** Effective initial values — either from the selected preset or the single `initialValues`. */
  const effectiveInitialValues = useMemo(
    () =>
      selectedPreset?.initialValues ??
      linkAccountStepOptions?.initialValues ??
      {},
    [selectedPreset, linkAccountStepOptions?.initialValues]
  );

  /** Effective partyId — preset-level takes precedence, then top-level. */
  const effectivePartyId: string | undefined =
    selectedPreset?.partyId ?? linkAccountStepOptions?.partyId;

  // Fetch fresh client data for the form (needed for account-holder prefill)
  const { data: clientResponseData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: interceptorReady && !!clientId,
    },
  });

  // Fetch existing linked accounts
  const { data: recipientsData, isLoading: isLoadingRecipients } =
    useGetAllRecipients(
      { type: 'LINKED_ACCOUNT', clientId },
      {
        query: {
          enabled: interceptorReady && !!clientId,
        },
      }
    );

  const existingAccount: Recipient | undefined =
    recipientsData?.recipients?.find(
      (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
    );

  // When allowMultipleAccounts is true, don't auto-redirect on existing account
  const shouldRedirectOnExisting =
    !!existingAccount && !linkAccountStepOptions?.allowMultipleAccounts;

  /** All active/pending linked accounts (for display when allowMultipleAccounts). */
  const existingAccounts: Recipient[] = useMemo(
    () =>
      recipientsData?.recipients?.filter(
        (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      ) ?? [],
    [recipientsData]
  );

  const linkAcknowledgementItems =
    linkAccountStepOptions?.reviewAcknowledgements;

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

  const [prefillCertifyChecked, setPrefillCertifyChecked] = useState(false);

  useEffect(() => {
    if (!linkAcknowledgementItems?.length) {
      setAcknowledgementChecked({});
      return;
    }
    setAcknowledgementChecked(
      Object.fromEntries(linkAcknowledgementItems.map((a) => [a.id, false]))
    );
  }, [linkAccountStepOptions?.completionMode, linkAckIdsKey]);

  const acknowledgementsComplete =
    !linkAcknowledgementItems?.length ||
    linkAcknowledgementItems.every(
      (a) => acknowledgementChecked[a.id] === true
    );

  // Use the linked-account config hook (same as BankAccountFormWrapper)
  const linkedAccountConfig = useLinkedAccountConfig();

  const linkedAccountConfigWithOverride = useMemo(() => {
    if (!linkAccountStepOptions?.bankFormConfigOverride) {
      return linkedAccountConfig;
    }
    return createCustomConfig(
      linkedAccountConfig,
      linkAccountStepOptions.bankFormConfigOverride
    );
  }, [linkedAccountConfig, linkAccountStepOptions?.bankFormConfigOverride]);

  /** When acknowledgements replace the certify row ({@link BankAccountForm}), keep prefill aligned. */
  const bankFormConfigForPrefill = useMemo(() => {
    const base = linkedAccountConfigWithOverride;
    if (!linkAcknowledgementItems?.length) return base;
    return {
      ...base,
      requiredFields: {
        ...base.requiredFields,
        certification: false,
      },
    };
  }, [linkedAccountConfigWithOverride, linkAcknowledgementItems]);

  // Use the recipient form hook for API submission
  const {
    submit,
    status,
    error: formError,
    reset,
  } = useRecipientForm({
    mode: 'create',
    recipientType: 'LINKED_ACCOUNT',
    clientId,
    partyId: effectivePartyId,
    onSuccess: () => {
      if (linkAccountStepOptions?.allowMultipleAccounts) {
        setLinkedCount((c) => c + 1);
        setShowAddForm(false);
        setShowLinkAnother(true);
        reset();
      } else {
        updateSessionData({ linkAccountJustCreated: true });
        goTo('overview', { resetHistory: true });
      }
    },
  });

  const config = {
    ...linkedAccountConfigWithOverride,
    content: {
      ...linkedAccountConfigWithOverride.content,
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
      effectiveInitialValues
    );
  }, [linkAccountStepOptions, effectiveInitialValues]);

  useEffect(() => {
    setPrefillCertifyChecked(false);
  }, [clientId, linkAckIdsKey, prefillSummaryFormData]);

  useEffect(() => {
    if (
      !prefillSummaryFormData ||
      linkAccountStepOptions?.completionMode !== 'prefillSummary'
    ) {
      return undefined;
    }
    const defaultCertShown =
      bankFormConfigForPrefill.requiredFields.certification === true;
    const dirty =
      Object.values(acknowledgementChecked).some(Boolean) ||
      (defaultCertShown && prefillCertifyChecked);
    setFlowUnsavedChanges(dirty);
    return () => setFlowUnsavedChanges(false);
  }, [
    acknowledgementChecked,
    bankFormConfigForPrefill.requiredFields.certification,
    linkAccountStepOptions?.completionMode,
    prefillCertifyChecked,
    prefillSummaryFormData,
    setFlowUnsavedChanges,
  ]);

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

  const handleBack = () => {
    reset();
    goTo('overview', { resetHistory: true });
  };

  const handleLinkAnother = useCallback(() => {
    setShowLinkAnother(false);
    setShowAddForm(true);
    reset();
    // If presets, advance to next unlinked preset or stay on current
    if (presetAccounts?.length) {
      const currentIdx = presetAccounts.findIndex(
        (p) => p.id === selectedPresetId
      );
      const nextPreset = presetAccounts[currentIdx + 1];
      if (nextPreset) {
        setSelectedPresetId(nextPreset.id);
      }
    }
  }, [presetAccounts, selectedPresetId, reset]);

  const handleFinishLinking = useCallback(() => {
    updateSessionData({ linkAccountJustCreated: true });
    goTo('overview', { resetHistory: true });
  }, [updateSessionData, goTo]);

  const defaultValuesOverride =
    linkAccountStepOptions?.completionMode === 'editable'
      ? effectiveInitialValues
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

  // Existing account — redirect to Overview where the linked-account card (and optional Remove) lives.
  // Removal is controlled there by `hideLinkedAccountRemoval`; this step has no separate Remove UI.
  // When allowMultipleAccounts is true, skip this redirect to allow creating more.
  if (shouldRedirectOnExisting) {
    // Use setTimeout to avoid state updates during render
    setTimeout(() => goTo('overview', { resetHistory: true }), 0);
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        </div>
      </StepLayout>
    );
  }

  // ─── Success state: "Link another account" prompt (allowMultipleAccounts) ───
  if (showLinkAnother) {
    return (
      <StepLayout
        title={t('screens.linkAccount.title', 'Link a bank account')}
        description={t(
          'screens.linkAccount.multiAccount.successDescription',
          'Account linked successfully. You can link another account or return to overview.'
        )}
      >
        <div className="eb-mt-6 eb-flex eb-flex-col eb-items-start eb-gap-3">
          <p className="eb-text-sm eb-text-muted-foreground">
            {t(
              'screens.linkAccount.multiAccount.linkedCount',
              '{{count}} account(s) linked in this session.',
              { count: linkedCount }
            )}
          </p>
          <div className="eb-flex eb-gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleLinkAnother}
              data-testid="link-another-account-btn"
            >
              {t(
                'screens.linkAccount.multiAccount.linkAnother',
                'Link another account'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleFinishLinking}
              data-testid="finish-linking-btn"
            >
              {t('screens.linkAccount.multiAccount.done', 'Done')}
            </Button>
          </div>
        </div>
      </StepLayout>
    );
  }

  // ─── Account preset selector (when presetAccounts provided) ─────────────────
  const accountSelector =
    presetAccounts && presetAccounts.length > 1 ? (
      <div className="eb-mb-4">
        <label
          htmlFor="link-account-preset-select"
          className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
        >
          {t(
            'screens.linkAccount.presetSelector.label',
            'Select account to link'
          )}
        </label>
        <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
          <SelectTrigger
            id="link-account-preset-select"
            data-testid="preset-account-select"
          >
            <SelectValue
              placeholder={t(
                'screens.linkAccount.presetSelector.placeholder',
                'Choose an account'
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {presetAccounts.map((preset, idx) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label ??
                  (preset.initialValues.firstName
                    ? `${preset.initialValues.firstName} ${preset.initialValues.lastName ?? ''}`.trim()
                    : (preset.initialValues.businessName ??
                      t(
                        'screens.linkAccount.presetSelector.defaultLabel',
                        'Account {{index}}',
                        { index: idx + 1 }
                      )))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null;

  // ─── Existing linked accounts cards (shown when allowMultipleAccounts) ──────
  const displayMode =
    linkAccountStepOptions?.existingAccountsDisplay ?? 'detailed';

  const existingAccountsSection =
    linkAccountStepOptions?.allowMultipleAccounts &&
    existingAccounts.length > 0 ? (
      <div className="eb-mb-6" data-testid="existing-linked-accounts">
        <h3 className="eb-mb-2 eb-text-sm eb-font-medium">
          {t(
            'screens.linkAccount.multiAccount.existingTitle',
            'Linked accounts ({{count}})',
            { count: existingAccounts.length }
          )}
        </h3>
        <div className="eb-space-y-3">
          {existingAccounts.map((recipient) => (
            <RecipientCard
              key={recipient.id}
              recipient={recipient}
              compact={displayMode === 'compact'}
              hideRemoveRecipient={!!hideLinkedAccountRemoval}
              onRemoveSuccess={() => {
                invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT');
              }}
              recipientType="LINKED_ACCOUNT"
              i18nNamespace="linked-accounts"
            />
          ))}
        </div>
        {!showAddForm && (
          <div className="eb-mt-4 eb-flex eb-items-center eb-justify-between eb-rounded-md eb-border eb-border-dashed eb-border-muted-foreground eb-p-3">
            <span className="eb-text-sm eb-font-medium">
              {t(
                'screens.linkAccount.multiAccount.addMoreTitle',
                'Link another account'
              )}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              data-testid="add-another-account-btn"
            >
              {t(
                'screens.linkAccount.multiAccount.addMoreButton',
                'Add account'
              )}
            </Button>
          </div>
        )}
      </div>
    ) : null;

  // Hide form when existing accounts present and user hasn't clicked "Add account"
  const shouldHideForm =
    linkAccountStepOptions?.allowMultipleAccounts &&
    existingAccounts.length > 0 &&
    !showAddForm;

  // ─── Existing accounts only (form hidden until "Add account" clicked) ───────
  if (shouldHideForm) {
    return (
      <StepLayout
        title={t('screens.linkAccount.title', 'Link a bank account')}
        description={t(
          'screens.linkAccount.multiAccount.manageDescription',
          'Manage your linked bank accounts or add a new one.'
        )}
      >
        <div className="eb-mt-6">{existingAccountsSection}</div>
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
        preSelector={
          <>
            {!showAddForm && existingAccountsSection}
            {accountSelector}
          </>
        }
        data={prefillSummaryFormData}
        displayedPaymentTypes={summaryDisplayedPaymentTypes}
        bankFormConfig={bankFormConfigForPrefill}
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
        certifyChecked={prefillCertifyChecked}
        onCertifyCheckedChange={setPrefillCertifyChecked}
        onSubmit={handleSubmit}
        onCancel={handleBack}
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
        {!showAddForm && existingAccountsSection}
        {accountSelector}
        <BankAccountForm
          config={config}
          client={clientResponseData ?? clientData}
          defaultValuesOverride={defaultValuesOverride}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={status === 'pending'}
          showCard={false}
          embedded
          alert={errorAlert}
          onDirtyChange={setFlowUnsavedChanges}
          reviewAcknowledgements={linkAcknowledgementItems}
          acknowledgementsIntro={
            linkAcknowledgementItems?.length &&
            linkAccountStepOptions?.showAcknowledgementsIntro
              ? t(
                  'screens.linkAccount.prefillSummary.acknowledgementsIntro',
                  'By electronically linking this account, you agree that:'
                )
              : undefined
          }
          reviewAcknowledgementsGroupAriaLabel={tString(
            'screens.linkAccount.review.acknowledgementsGroupLabel',
            'Agreements required to link this account'
          )}
        />
      </div>
    </StepLayout>
  );
};
