import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types';
import {
  FlowProgress,
  FlowSessionData,
  ScreenId,
  SectionScreenConfig,
  SectionStatus,
  StepConfig,
  StepperValidation,
} from '@/core/OnboardingFlow/types/flow.types';

import {
  getClientContext,
  getPartyByAssociatedPartyFilters,
} from './dataUtils';
import {
  convertPartyResponseToFormValues,
  modifySchemaByClientContext,
} from './formUtils';

/**
 * Pre-built, FULLY MODIFIED step schemas keyed by the step object. Built once
 * during render — the schema factory (`step.Component.schema()`) AND the
 * `refineSchemaFn` applied by `modifySchemaByClientContext` are both hook-based
 * (`useGetValidationMessage`) — so that pure, non-hook code (e.g. a form
 * resolver running outside render) can validate party steps via `safeParse`.
 * The stored schema already has `modifySchemaByClientContext` applied; callers
 * must NOT re-apply it.
 */
export type StepSchemaMap = Map<
  StepConfig,
  ReturnType<typeof modifySchemaByClientContext>
>;

/**
 * Build the FULLY MODIFIED step schemas for every form step in the flow, keyed
 * by the step object. This calls `step.Component.schema()` (hook-based via
 * `useGetValidationMessage`) once per step, so it MUST run at the top level of
 * render with a STABLE step list.
 *
 * Callers pass the UNFILTERED step set (all sections' steps, before `isVisible`
 * filtering). That keeps the schema-hook call count constant across renders
 * even when a step's visibility toggles — the map is keyed by step object, so a
 * later lookup for the visible subset still resolves. Feed the result into
 * `getFlowProgress` / `getStepperValidation` so those run pure `safeParse`
 * instead of re-invoking the schema hooks with a variable count.
 *
 * Section steps are modified for `sectionScreenId`; owner steps for
 * `'owner-stepper'` (matching how each is collected / validated elsewhere).
 */
export function buildStepSchemas(
  sections: SectionScreenConfig[],
  ownerSteps: StepConfig[],
  clientData: ClientResponse | undefined,
  sectionScreenId: ScreenId
): StepSchemaMap {
  const map: StepSchemaMap = new Map();
  const clientContext = getClientContext(clientData);
  const addSteps = (steps: StepConfig[], screenId: ScreenId) => {
    for (const step of steps) {
      if (step.stepType === 'form' && !map.has(step)) {
        const rawSchema =
          typeof step.Component.schema === 'function'
            ? step.Component.schema()
            : step.Component.schema;
        map.set(
          step,
          modifySchemaByClientContext(
            rawSchema,
            clientContext,
            screenId,
            step.Component.refineSchemaFn
          )
        );
      }
    }
  };
  for (const section of sections) {
    if (section.type === 'stepper' && section.stepperConfig) {
      addSteps(section.stepperConfig.steps, sectionScreenId);
    }
  }
  addSteps(ownerSteps, 'owner-stepper');
  return map;
}

export function getFlowProgress(
  sections: SectionScreenConfig[],
  sessionData: FlowSessionData,
  clientData: ClientResponse | undefined,
  savedFormValues:
    | Partial<OnboardingFormValuesSubmit>
    | Record<string, unknown>
    | undefined,
  screenId: ScreenId,
  // Optional pre-built step schemas (keyed by step object). When provided,
  // `getStepperValidation` runs pure `safeParse` instead of invoking the
  // hook-based `step.Component.schema()`. Callers pass a map built ONCE from
  // the UNFILTERED step set so the schema-hook count stays constant even when
  // step visibility changes across renders (avoids a hook-order violation).
  stepSchemas?: StepSchemaMap
): FlowProgress {
  const sectionStatuses: Partial<FlowProgress['sectionStatuses']> = {};
  const stepValidations: Partial<FlowProgress['stepValidations']> = {};

  for (const section of sections) {
    let status: SectionStatus = 'not_started';
    let allStepsValid = true;

    if (section.type === 'stepper') {
      let partyData: Partial<PartyResponse> = {};

      if (section.stepperConfig.associatedPartyFilters) {
        partyData = getPartyByAssociatedPartyFilters(
          clientData,
          section.stepperConfig.associatedPartyFilters
        );
      }

      const stepperValidation = getStepperValidation(
        section.stepperConfig.steps,
        partyData,
        clientData,
        savedFormValues,
        screenId,
        stepSchemas
      );

      stepValidations[section.id] = stepperValidation.stepValidationMap;
      allStepsValid = stepperValidation.allStepsValid;
    }

    if (section.sectionConfig.statusResolver) {
      status = section.sectionConfig.statusResolver(
        sessionData,
        clientData,
        allStepsValid,
        stepValidations[section.id] || {},
        savedFormValues,
        screenId,
        stepSchemas
      );
    } else if (allStepsValid) {
      status = 'completed';
    }

    sectionStatuses[section.id] = status;
  }

  return {
    sectionStatuses: sectionStatuses as FlowProgress['sectionStatuses'],
    stepValidations: stepValidations as FlowProgress['stepValidations'],
  };
}

/**
 * Resolve form-value overlays for party Zod validation.
 *
 * Delta mode may pass nested `owners.{partyId}` plus `question_*` keys.
 * When that nested owners bag is present, apply only the matching owner's
 * values. Otherwise return the flat overlay unchanged (non-delta path).
 */
export function resolvePartyFormOverlay(
  partyData: Partial<PartyResponse> | undefined,
  savedFormValues:
    | Partial<OnboardingFormValuesSubmit>
    | Record<string, unknown>
    | undefined
): Partial<OnboardingFormValuesSubmit> {
  if (!savedFormValues) {
    return {};
  }

  const values = savedFormValues as Record<string, unknown>;
  const { owners } = values;

  const hasNestedOwnerBag =
    owners != null &&
    typeof owners === 'object' &&
    !Array.isArray(owners) &&
    Object.keys(owners as object).length > 0;

  // Non-delta / normal stepper: preserve historical flat-merge behaviour.
  if (!hasNestedOwnerBag) {
    return savedFormValues as Partial<OnboardingFormValuesSubmit>;
  }

  const ownersById = owners as Record<
    string,
    Partial<OnboardingFormValuesSubmit>
  >;

  if (partyData?.id && ownersById[partyData.id]) {
    return ownersById[partyData.id] ?? {};
  }

  // Org / controller validation under delta: flat keys only (no owners bag /
  // question_* pollution of party schemas).
  const overlay: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key !== 'owners' && !key.startsWith('question_')) {
      overlay[key] = value;
    }
  }
  return overlay as Partial<OnboardingFormValuesSubmit>;
}

export const getStepperValidation = (
  steps: StepConfig[],
  partyData: Partial<PartyResponse> | undefined,
  clientData: ClientResponse | undefined,
  savedFormValues:
    | Partial<OnboardingFormValuesSubmit>
    | Record<string, unknown>
    | undefined,
  screenId: ScreenId,
  // Optional pre-built raw step schemas (keyed by the step object). The schema
  // factory (`step.Component.schema()`) is hook-based, so callers that must run
  // outside React render (e.g. a form resolver) build the schemas once during
  // render and pass them here; this function then does only pure `safeParse`.
  stepSchemas?: StepSchemaMap
): StepperValidation => {
  const stepValidationMap: Record<string, any> = {};
  let allStepsValid = true;
  const formOverlay = resolvePartyFormOverlay(partyData, savedFormValues);

  for (const step of steps) {
    if (step.stepType === 'form') {
      const formValues = convertPartyResponseToFormValues(partyData ?? {});
      // A pre-built schema is ALREADY fully modified (base factory +
      // modifySchemaByClientContext + refineSchemaFn applied during render), so
      // use it directly — re-running modifySchemaByClientContext here would
      // re-invoke the hook-based refineSchemaFn outside render ("Invalid hook
      // call"). Only fall back to building it when no pre-built schema exists
      // (callers already inside React render).
      const preBuiltSchema = stepSchemas?.get(step);
      const modifiedSchema =
        preBuiltSchema ??
        modifySchemaByClientContext(
          typeof step.Component.schema === 'function'
            ? step.Component.schema()
            : step.Component.schema,
          getClientContext(clientData),
          screenId,
          step.Component.refineSchemaFn
        );

      const result = modifiedSchema.safeParse({
        ...formValues,
        ...formOverlay,
      });
      stepValidationMap[step.id] = {
        result,
        isValid: result.success,
      };

      if (!result.success) {
        allStepsValid = false;
      }
    } else if (step.stepType === 'check-answers') {
      stepValidationMap[step.id] = {
        result: undefined,
        isValid: allStepsValid,
      };
    } else {
      // Static steps and other unknown types cannot be validated
      // by schema — they are always marked invalid so the sidebar
      // renders them as on_hold (locked), preventing skip-ahead.
      stepValidationMap[step.id] = {
        result: undefined,
        isValid: false,
      };
    }
  }

  return {
    stepValidationMap,
    allStepsValid,
  };
};

export const getStepperValidations = (
  steps: StepConfig[],
  parties: PartyResponse[],
  clientData: ClientResponse | undefined,
  savedFormValues:
    | Partial<OnboardingFormValuesSubmit>
    | Record<string, unknown>
    | undefined,
  screenId: ScreenId,
  // Pre-built step schemas (keyed by step object). Forwarded to each
  // `getStepperValidation` so validating a variable number of parties stays
  // hook-free — otherwise the schema-hook count would scale with party count.
  stepSchemas?: StepSchemaMap
) => {
  const partyValidations: Record<string, StepperValidation> = {};

  parties.forEach((party) => {
    const stepperValidation = getStepperValidation(
      steps,
      party,
      clientData,
      savedFormValues,
      screenId,
      stepSchemas
    );
    if (party.id) {
      partyValidations[party.id] = stepperValidation;
    }
  });

  return partyValidations;
};
