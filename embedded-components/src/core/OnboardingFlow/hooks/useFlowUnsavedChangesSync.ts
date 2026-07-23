import { useEffect, useId } from 'react';

import { useFlowContext } from '@/core/OnboardingFlow/contexts';

/**
 * Registers the active screen form's dirty state with the flow so leave / back
 * prompts only run when there are unsaved edits (see OnboardingFlow props
 * `alertOnExit` and `alertOnPreviousStep`).
 *
 * Multiple registrants (e.g. delta review: pending + terms + accuracy) OR
 * together — last-write-wins is avoided by tracking each source independently.
 *
 * Updates a ref in FlowProvider only (no extra tree re-renders from this hook).
 */
export function useFlowUnsavedChangesSync(isDirty: boolean, sourceId?: string) {
  const generatedId = useId();
  const source = sourceId ?? generatedId;
  const { setFlowUnsavedChanges } = useFlowContext();

  useEffect(() => {
    setFlowUnsavedChanges(source, isDirty);
    return () => {
      setFlowUnsavedChanges(source, false);
    };
  }, [isDirty, setFlowUnsavedChanges, source]);
}
