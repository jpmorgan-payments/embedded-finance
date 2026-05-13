import { useEffect, useMemo, useState } from 'react';

import type { LinkAccountReviewAcknowledgement } from '@/core/OnboardingFlow/types/onboarding.types';

type UseLinkAccountAcknowledgementsOptions = {
  items: readonly LinkAccountReviewAcknowledgement[] | undefined;
  /** Reset triggers — acknowledgements reset when these change. */
  resetDeps: readonly unknown[];
};

/**
 * Manages acknowledgement checkbox state and completion derivation.
 * Extracted from LinkAccountScreen to avoid repeating state init/reset logic.
 */
export function useLinkAccountAcknowledgements({
  items,
  resetDeps,
}: UseLinkAccountAcknowledgementsOptions) {
  const idsKey = useMemo(
    () => (items?.length ? items.map((a) => a.id).join('\0') : ''),
    [items]
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!items?.length) {
      setChecked({});
      return;
    }
    setChecked(Object.fromEntries(items.map((a) => [a.id, false])));
  }, [...resetDeps, idsKey]); // eslint-disable-line

  const isComplete =
    !items?.length || items.every((a) => checked[a.id] === true);

  const handleChange = (id: string, value: boolean) => {
    setChecked((prev) => ({ ...prev, [id]: value }));
  };

  return {
    checked,
    isComplete,
    handleChange,
    idsKey,
  };
}
