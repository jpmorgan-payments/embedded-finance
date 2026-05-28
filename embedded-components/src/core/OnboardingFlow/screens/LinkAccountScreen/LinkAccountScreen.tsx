import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Skeleton } from '@/components/ui/skeleton';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import {
  BankAccountForm,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';
import { invalidateRecipientQueries } from '@/core/RecipientWidgets/utils/invalidateRecipientQueries';

import { ExistingLinkedAccountsList } from './components/ExistingLinkedAccountsList';
import { LinkAccountErrorAlert } from './components/LinkAccountErrorAlert';
import { LinkAccountPresetSelector } from './components/LinkAccountPresetSelector';
import { useLinkAccountAcknowledgements } from './hooks/useLinkAccountAcknowledgements';
import { useLinkAccountFormConfig } from './hooks/useLinkAccountFormConfig';
import { useLinkAccountPreset } from './hooks/useLinkAccountPreset';
import { LinkAccountPrefillSummaryView } from './LinkAccountPrefillSummaryView';

/**
 * LinkAccountScreen
 *
 * Onboarding step for linking a bank account. Supports three modes:
 * - **`editable`** — `BankAccountForm` two-step wizard. (default)
 * - **`reviewOnly`** — Read-only summary + acknowledgements.
 * - **Multi-account** — List existing accounts with "Add account" CTA.
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

  const clientId = clientData?.id;

  // When existing accounts present + allowMultipleAccounts, hide form until user clicks "Add account"
  const [showAddForm, setShowAddForm] = useState(false);
  const [prefillCertifyChecked, setPrefillCertifyChecked] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const { data: clientResponseData } = useSmbdoGetClient(clientId ?? '', {
    query: { enabled: !!clientId },
  });

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

  // ─── Preset selection & derived state ───────────────────────────────────────
  const {
    presetAccounts,
    selectedPresetId,
    setSelectedPresetId,
    effectivePartyId,
    effectiveInitialValues: rawEffectiveInitialValues,
    effectiveCompletionMode,
  } = useLinkAccountPreset({ linkAccountStepOptions, existingAccounts });

  // Enrich initial values with party name when partyId resolves to a known party
  // and the host did not explicitly provide name fields.
  const effectiveInitialValues = useMemo(() => {
    if (!effectivePartyId || !clientResponseData?.parties) {
      return rawEffectiveInitialValues;
    }
    const party = (
      clientResponseData.parties as Array<Record<string, unknown>>
    ).find((p) => p.id === effectivePartyId);
    if (!party) return rawEffectiveInitialValues;

    const enriched = { ...rawEffectiveInitialValues };

    if (party.partyType === 'INDIVIDUAL') {
      const details = party.individualDetails as
        | { firstName?: string; lastName?: string }
        | undefined;
      if (details) {
        if (!enriched.firstName) enriched.firstName = details.firstName ?? '';
        if (!enriched.lastName) enriched.lastName = details.lastName ?? '';
      }
      if (!enriched.accountType) enriched.accountType = 'INDIVIDUAL';
    } else if (party.partyType === 'ORGANIZATION') {
      const details = party.organizationDetails as
        | { organizationName?: string }
        | undefined;
      if (details && !enriched.businessName) {
        enriched.businessName = details.organizationName ?? '';
      }
      if (!enriched.accountType) enriched.accountType = 'ORGANIZATION';
    }

    return enriched;
  }, [rawEffectiveInitialValues, effectivePartyId, clientResponseData]);

  // ─── Acknowledgements state ─────────────────────────────────────────────────
  const acknowledgementItems = linkAccountStepOptions?.reviewAcknowledgements;
  const acknowledgements = useLinkAccountAcknowledgements({
    items: acknowledgementItems,
    resetDeps: [effectiveCompletionMode],
  });

  // ─── Form config composition ────────────────────────────────────────────────
  const {
    configWithOverride,
    bankFormConfigForPrefill,
    prefillSummaryFormData,
    summaryDisplayedPaymentTypes,
  } = useLinkAccountFormConfig({
    linkAccountStepOptions,
    effectiveCompletionMode,
    effectiveInitialValues,
    acknowledgementItems,
  });

  // ─── Form submission ────────────────────────────────────────────────────────
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
        setShowAddForm(false);
        reset();
        invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT');
      } else {
        updateSessionData({ linkAccountJustCreated: true });
        goTo('overview', { resetHistory: true });
      }
    },
  });

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPrefillCertifyChecked(false);
  }, [clientId, acknowledgements.idsKey, prefillSummaryFormData]);

  useEffect(() => {
    if (!prefillSummaryFormData || effectiveCompletionMode !== 'reviewOnly') {
      return undefined;
    }
    const defaultCertShown =
      bankFormConfigForPrefill.requiredFields.certification === true;
    const dirty =
      Object.values(acknowledgements.checked).some(Boolean) ||
      (defaultCertShown && prefillCertifyChecked);
    setFlowUnsavedChanges(dirty);
    return () => setFlowUnsavedChanges(false);
  }, [
    acknowledgements.checked,
    bankFormConfigForPrefill.requiredFields.certification,
    effectiveCompletionMode,
    prefillCertifyChecked,
    prefillSummaryFormData,
    setFlowUnsavedChanges,
  ]);

  // ─── Derived config for editable BankAccountForm ────────────────────────────
  const config = useMemo(
    () => ({
      ...configWithOverride,
      content: {
        ...configWithOverride.content,
        submitButtonText: t('screens.linkAccount.submitButton', 'Link Account'),
        cancelButtonText: t('common:cancel', 'Cancel'),
      },
      existingAccounts: linkAccountStepOptions?.allowMultipleAccounts
        ? existingAccounts
        : undefined,
    }),
    [
      configWithOverride,
      t,
      linkAccountStepOptions?.allowMultipleAccounts,
      existingAccounts,
    ]
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = (data: BankAccountFormData) => submit(data);
  const handleBack = () => {
    reset();
    goTo('overview', { resetHistory: true });
  };

  // ─── Render: Loading ────────────────────────────────────────────────────────
  if (isLoadingRecipients) {
    return (
      <StepLayout title={t('screens.linkAccount.title', 'Link a bank account')}>
        <div className="eb-mt-6 eb-space-y-4">
          <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        </div>
      </StepLayout>
    );
  }

  // ─── Render: Redirect when single existing account ──────────────────────────
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

  // ─── Shared sub-elements ────────────────────────────────────────────────────
  const displayMode =
    linkAccountStepOptions?.existingAccountsDisplay ?? 'detailed';
  const showExistingSection =
    !!linkAccountStepOptions?.allowMultipleAccounts &&
    existingAccounts.length > 0;
  const shouldHideForm = showExistingSection && !showAddForm;

  const existingAccountsSection = showExistingSection ? (
    <ExistingLinkedAccountsList
      accounts={existingAccounts}
      displayMode={displayMode}
      hideRemoval={!!hideLinkedAccountRemoval}
      showAddButton={!showAddForm}
      onAddClick={() => setShowAddForm(true)}
    />
  ) : null;

  const accountSelector =
    presetAccounts && presetAccounts.length > 1 ? (
      <LinkAccountPresetSelector
        presets={presetAccounts}
        value={selectedPresetId}
        onChange={setSelectedPresetId}
      />
    ) : null;

  const errorAlert = formError ? (
    <LinkAccountErrorAlert error={formError} />
  ) : undefined;

  const acknowledgementsIntro =
    acknowledgementItems?.length &&
    linkAccountStepOptions?.showAcknowledgementsIntro
      ? t(
          'screens.linkAccount.prefillSummary.acknowledgementsIntro',
          'By electronically linking this account, you agree that:'
        )
      : undefined;

  // ─── Render: Existing accounts only (form hidden) ───────────────────────────
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

  // ─── Render: Review-only mode ───────────────────────────────────────────────
  if (prefillSummaryFormData && effectiveCompletionMode === 'reviewOnly') {
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
        acknowledgements={acknowledgementItems}
        acknowledgementsIntro={acknowledgementsIntro}
        acknowledgementChecked={acknowledgements.checked}
        onAcknowledgementChange={acknowledgements.handleChange}
        acknowledgementsComplete={acknowledgements.isComplete}
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

  // ─── Render: Editable bank account form ─────────────────────────────────────
  const defaultValuesOverride =
    effectiveCompletionMode === 'editable' ? effectiveInitialValues : undefined;

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
          reviewAcknowledgements={acknowledgementItems}
          acknowledgementsIntro={acknowledgementsIntro}
          reviewAcknowledgementsGroupAriaLabel={tString(
            'screens.linkAccount.review.acknowledgementsGroupLabel',
            'Agreements required to link this account'
          )}
        />
      </div>
    </StepLayout>
  );
};
