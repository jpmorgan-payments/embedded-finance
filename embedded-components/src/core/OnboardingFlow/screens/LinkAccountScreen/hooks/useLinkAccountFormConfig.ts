import { useMemo } from 'react';

import type { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';
import type {
  LinkAccountInitialValues,
  LinkAccountReviewAcknowledgement,
  LinkAccountStepCompletionMode,
  LinkAccountStepOptions,
} from '@/core/OnboardingFlow/types/onboarding.types';
import {
  createCustomConfig,
  mergeBankAccountDefaultValues,
  useLinkedAccountConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';

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

type UseLinkAccountFormConfigOptions = {
  linkAccountStepOptions: LinkAccountStepOptions | undefined;
  effectiveCompletionMode: LinkAccountStepCompletionMode | undefined;
  effectiveInitialValues: LinkAccountInitialValues;
  acknowledgementItems: readonly LinkAccountReviewAcknowledgement[] | undefined;
};

/**
 * Composes the bank form config chain: base config → override → prefill adjustments.
 * Also derives `prefillSummaryFormData` and `summaryDisplayedPaymentTypes`.
 */
export function useLinkAccountFormConfig({
  linkAccountStepOptions,
  effectiveCompletionMode,
  effectiveInitialValues,
  acknowledgementItems,
}: UseLinkAccountFormConfigOptions) {
  const linkedAccountConfig = useLinkedAccountConfig();

  const configWithOverride: BankAccountFormConfig = useMemo(() => {
    if (!linkAccountStepOptions?.bankFormConfigOverride) {
      return linkedAccountConfig;
    }
    return createCustomConfig(
      linkedAccountConfig,
      linkAccountStepOptions.bankFormConfigOverride
    );
  }, [linkedAccountConfig, linkAccountStepOptions?.bankFormConfigOverride]);

  /** When acknowledgements replace the certify row, suppress it in the config. */
  const bankFormConfigForPrefill: BankAccountFormConfig = useMemo(() => {
    if (!acknowledgementItems?.length) return configWithOverride;
    return {
      ...configWithOverride,
      requiredFields: {
        ...configWithOverride.requiredFields,
        certification: false,
      },
    };
  }, [configWithOverride, acknowledgementItems]);

  const prefillSummaryFormData: BankAccountFormData | null = useMemo(() => {
    if (effectiveCompletionMode !== 'prefillSummary') return null;
    return mergeBankAccountDefaultValues(
      LINK_ACCOUNT_PREFILL_MERGE_BASE,
      effectiveInitialValues
    );
  }, [effectiveCompletionMode, effectiveInitialValues]);

  const summaryDisplayedPaymentTypes =
    useMemo((): RoutingInformationTransactionType[] => {
      if (
        !prefillSummaryFormData ||
        effectiveCompletionMode !== 'prefillSummary'
      ) {
        return [];
      }
      const explicit = linkAccountStepOptions?.summaryDisplayedPaymentTypes;
      if (explicit?.length) return [...explicit];
      const pt = prefillSummaryFormData.paymentTypes;
      if (pt?.length) return [...pt];
      return ['ACH'];
    }, [linkAccountStepOptions, prefillSummaryFormData]);

  return {
    configWithOverride,
    bankFormConfigForPrefill,
    prefillSummaryFormData,
    summaryDisplayedPaymentTypes,
  };
}
