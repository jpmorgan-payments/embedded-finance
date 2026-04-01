import { useEffect } from 'react';

import { useFlowContext } from '@/core/OnboardingFlow/contexts';

/**
 * Registers the active screen form's dirty state with the flow so leave / back
 * prompts only run when there are unsaved edits (see OnboardingFlow props
 * `alertOnExit` and `alertOnPreviousStep`).
 *
 * Updates a ref in FlowProvider only (no extra tree re-renders from this hook).
 */
export function useFlowUnsavedChangesSync(isDirty: boolean) {
  const { setFlowUnsavedChanges } = useFlowContext();

  useEffect(() => {
    setFlowUnsavedChanges(isDirty);
    return () => {
      setFlowUnsavedChanges(false);
    };
  }, [isDirty, setFlowUnsavedChanges]);
}
