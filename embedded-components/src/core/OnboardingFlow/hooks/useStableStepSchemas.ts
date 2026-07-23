import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import {
  buildStepSchemas,
  StepSchemaMap,
} from '@/core/OnboardingFlow/utils/flowUtils';

/**
 * Build the flow's step schemas ONCE per render, keyed by step object, from the
 * UNFILTERED step set.
 *
 * `step.Component.schema()` is hook-based (`useGetValidationMessage`), so the
 * number of schema-hook calls must stay constant across renders. Deriving the
 * schemas from the visibility-filtered `sections` makes that count move whenever
 * a step's `isVisible` toggles (e.g. `identity-document` when the org resolves
 * to a US-exchange PTC), which violates the Rules of Hooks. Building from
 * `allSections` (every step, always) keeps the count fixed.
 *
 * Pass the returned map to `getFlowProgress` / `getStepperValidation`; when a
 * pre-built schema is present those functions run pure `safeParse` instead of
 * re-invoking the schema hooks, so their own hook count can't vary with step
 * visibility or the number of owners.
 */
export function useStableStepSchemas(): StepSchemaMap {
  const { clientData } = useOnboardingContext();
  const { allSections, staticScreens, currentScreenId } = useFlowContext();

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  return buildStepSchemas(allSections, ownerSteps, clientData, currentScreenId);
}
