import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import {
  FlowProgress,
  FlowSessionData,
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

export function getFlowProgress(
  sections: SectionScreenConfig[],
  sessionData: FlowSessionData,
  clientData: ClientResponse | undefined
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
        clientData
      );

      stepValidations[section.id] = stepperValidation.stepValidationMap;
      allStepsValid = stepperValidation.allStepsValid;
    }

    if (section.sectionConfig.statusResolver) {
      status = section.sectionConfig.statusResolver(
        sessionData,
        clientData,
        allStepsValid,
        stepValidations[section.id] || {}
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

export const getStepperValidation = (
  steps: StepConfig[],
  partyData: Partial<PartyResponse> | undefined,
  clientData: ClientResponse | undefined
): StepperValidation => {
  const stepValidationMap: Record<string, any> = {};
  let allStepsValid = true;

  for (const step of steps) {
    if (step.stepType === 'form') {
      const formValues = convertPartyResponseToFormValues(partyData ?? {});
      const modifiedSchema = modifySchemaByClientContext(
        step.Component.schema,
        getClientContext(clientData),
        step.Component.refineSchemaFn
      );

      const result = modifiedSchema.safeParse(formValues);
      stepValidationMap[step.id] = {
        result,
        isValid: result.success,
      };

      if (!result.success) {
        allStepsValid = false;
      }
    } else {
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
  clientData: ClientResponse | undefined
) => {
  const partyValidations: Record<string, StepperValidation> = {};

  parties.forEach((party) => {
    const stepperValidation = getStepperValidation(steps, party, clientData);
    if (party.id) {
      partyValidations[party.id] = stepperValidation;
    }
  });

  return partyValidations;
};
