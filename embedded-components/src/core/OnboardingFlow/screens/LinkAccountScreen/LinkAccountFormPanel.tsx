import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
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

import { LinkAccountErrorAlert } from './components/LinkAccountErrorAlert';
import { LinkAccountPresetSelector } from './components/LinkAccountPresetSelector';
import { useLinkAccountAcknowledgements } from './hooks/useLinkAccountAcknowledgements';
import { useLinkAccountFormConfig } from './hooks/useLinkAccountFormConfig';
import { useLinkAccountPreset } from './hooks/useLinkAccountPreset';
import { LinkAccountPrefillSummaryView } from './LinkAccountPrefillSummaryView';
import { enrichInitialValuesWithPartyName } from './utils/enrichInitialValues';

export type LinkAccountFormPanelProps = {
  existingAccounts: Recipient[];
  /** `step` wraps content in StepLayout; `inline` is for Overview embedding. */
  layout: 'step' | 'inline';
  onSuccess: () => void;
  /** When omitted, cancel controls are hidden (typical for Overview inline). */
  onCancel?: () => void;
};

/**
 * Shared create/review UI for linking a bank account — used by
 * {@link LinkAccountScreen} and Overview's empty bank section.
 */
export function LinkAccountFormPanel({
  existingAccounts,
  layout,
  onSuccess,
  onCancel,
}: LinkAccountFormPanelProps) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);
  const { setFlowUnsavedChanges } = useFlowContext();
  const { clientData, linkAccountStepOptions } = useOnboardingContext();

  const clientId = clientData?.id;
  const [prefillCertifyChecked, setPrefillCertifyChecked] = useState(false);

  const { data: clientResponseData } = useSmbdoGetClient(clientId ?? '', {
    query: { enabled: !!clientId },
  });

  const {
    presetAccounts,
    selectedPresetId,
    setSelectedPresetId,
    effectivePartyId,
    effectiveInitialValues: rawEffectiveInitialValues,
    effectiveCompletionMode,
  } = useLinkAccountPreset({ linkAccountStepOptions, existingAccounts });

  const effectiveInitialValues = useMemo(() => {
    if (!effectivePartyId || !clientResponseData?.parties) {
      return rawEffectiveInitialValues;
    }
    const party = (
      clientResponseData.parties as Array<Record<string, unknown>>
    ).find((p) => p.id === effectivePartyId);
    if (!party) return rawEffectiveInitialValues;

    return enrichInitialValuesWithPartyName(rawEffectiveInitialValues, party);
  }, [rawEffectiveInitialValues, effectivePartyId, clientResponseData]);

  const acknowledgementItems = linkAccountStepOptions?.reviewAcknowledgements;
  const acknowledgements = useLinkAccountAcknowledgements({
    items: acknowledgementItems,
    resetDeps: [effectiveCompletionMode],
  });

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
      reset();
      onSuccess();
    },
  });

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
    setFlowUnsavedChanges('link-account-prefill', dirty);
    return () => setFlowUnsavedChanges('link-account-prefill', false);
  }, [
    acknowledgements.checked,
    bankFormConfigForPrefill.requiredFields.certification,
    effectiveCompletionMode,
    prefillCertifyChecked,
    prefillSummaryFormData,
    setFlowUnsavedChanges,
  ]);

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

  const handleSubmit = (data: BankAccountFormData) => submit(data);
  const handleCancel = onCancel
    ? () => {
        reset();
        onCancel();
      }
    : undefined;

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

  const wrapStep = (
    content: ReactNode,
    title: ReactNode,
    description?: ReactNode
  ) =>
    layout === 'step' ? (
      <StepLayout title={title} description={description}>
        <div className="eb-mt-6">{content}</div>
      </StepLayout>
    ) : (
      <div className="eb-space-y-4">{content}</div>
    );

  if (prefillSummaryFormData && effectiveCompletionMode === 'reviewOnly') {
    return (
      <LinkAccountPrefillSummaryView
        wrapInStepLayout={layout === 'step'}
        title={t('screens.linkAccount.title', 'Link a bank account')}
        description={t(
          'screens.linkAccount.prefillSummary.description',
          'Review your bank details and accept the agreements to link this account.'
        )}
        preSelector={accountSelector}
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

  const defaultValuesOverride =
    effectiveCompletionMode === 'editable' ? effectiveInitialValues : undefined;

  return wrapStep(
    <>
      {accountSelector}
      <BankAccountForm
        config={config}
        client={clientResponseData ?? clientData}
        defaultValuesOverride={defaultValuesOverride}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={status === 'pending'}
        showCard={false}
        embedded
        layout="singlePage"
        alert={errorAlert}
        onDirtyChange={(dirty) =>
          setFlowUnsavedChanges('link-account-form', dirty)
        }
        reviewAcknowledgements={acknowledgementItems}
        acknowledgementsIntro={acknowledgementsIntro}
        reviewAcknowledgementsGroupAriaLabel={tString(
          'screens.linkAccount.review.acknowledgementsGroupLabel',
          'Agreements required to link this account'
        )}
      />
    </>,
    t('screens.linkAccount.title', 'Link a bank account'),
    t(
      'screens.linkAccount.description',
      'Connect your bank account to receive payouts.'
    )
  );
}
