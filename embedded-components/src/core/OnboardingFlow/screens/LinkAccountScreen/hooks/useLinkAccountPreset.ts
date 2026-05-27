import { useMemo, useState } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type {
  LinkAccountInitialValues,
  LinkAccountPresetEntry,
  LinkAccountStepCompletionMode,
  LinkAccountStepOptions,
} from '@/core/OnboardingFlow/types/onboarding.types';

/** Normalize legacy `'prefillSummary'` to `'reviewOnly'` and default to `'editable'`. */
function normalizeCompletionMode(
  mode: LinkAccountStepCompletionMode | undefined
): LinkAccountStepCompletionMode {
  if (mode === 'prefillSummary') return 'reviewOnly';
  return mode ?? 'editable';
}

type UseLinkAccountPresetOptions = {
  linkAccountStepOptions: LinkAccountStepOptions | undefined;
  existingAccounts: Recipient[];
};

/**
 * Encapsulates preset selection logic, effective initial values derivation,
 * duplicate detection, and effective completion mode resolution.
 */
export function useLinkAccountPreset({
  linkAccountStepOptions,
  existingAccounts,
}: UseLinkAccountPresetOptions) {
  const presetAccounts = linkAccountStepOptions?.presetAccounts;

  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(
    () => presetAccounts?.[0]?.id
  );

  const selectedPreset: LinkAccountPresetEntry | undefined = useMemo(() => {
    if (!presetAccounts?.length) return undefined;
    return presetAccounts.find((p) => p.id === selectedPresetId);
  }, [presetAccounts, selectedPresetId]);

  /** Effective partyId — preset-level takes precedence, then top-level. */
  const effectivePartyId: string | undefined =
    selectedPreset?.partyId ?? linkAccountStepOptions?.partyId;

  /** Effective initial values — either from the selected preset or the single `initialValues`. */
  const rawInitialValues: LinkAccountInitialValues = useMemo(
    () =>
      selectedPreset?.initialValues ??
      linkAccountStepOptions?.initialValues ??
      {},
    [selectedPreset, linkAccountStepOptions?.initialValues]
  );

  /**
   * When `allowMultipleAccounts` is true and the prefilled account number already
   * exists among linked accounts, clear the prefill so the user enters fresh data.
   */
  const isDuplicateAccount = useMemo(() => {
    if (
      !linkAccountStepOptions?.allowMultipleAccounts ||
      !rawInitialValues.accountNumber ||
      existingAccounts.length === 0
    ) {
      return false;
    }
    return existingAccounts.some(
      (r) => r.account?.number === rawInitialValues.accountNumber
    );
  }, [
    rawInitialValues,
    linkAccountStepOptions?.allowMultipleAccounts,
    existingAccounts,
  ]);

  const effectiveInitialValues: LinkAccountInitialValues = isDuplicateAccount
    ? {}
    : rawInitialValues;

  /** When duplicate detected, fall back to editable mode regardless of host config. */
  const effectiveCompletionMode: LinkAccountStepCompletionMode =
    isDuplicateAccount
      ? 'editable'
      : normalizeCompletionMode(linkAccountStepOptions?.completionMode);

  return {
    presetAccounts,
    selectedPresetId,
    setSelectedPresetId,
    selectedPreset,
    effectivePartyId,
    effectiveInitialValues,
    effectiveCompletionMode,
  };
}
