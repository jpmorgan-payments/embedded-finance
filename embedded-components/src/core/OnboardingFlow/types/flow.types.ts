import { LucideIcon } from 'lucide-react';
import { z } from 'zod';

import {
  ClientResponse,
  CreatePartyRequestInline,
  OrganizationType,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types/form.types';

type DefaultSchema = z.ZodObject<Record<string, z.ZodType<any>>>;

export type FormStepComponent<TSchema extends DefaultSchema = DefaultSchema> =
  React.ComponentType<{
    currentPartyData?: PartyResponse;
  }> & {
    schema: TSchema | (() => TSchema);
    refineSchemaFn?: (schema: TSchema) => z.ZodEffects<TSchema>;
    modifyFormValuesBeforeSubmit?: (
      values: z.output<TSchema>,
      partyData: PartyResponse | undefined
    ) => Partial<OnboardingFormValuesSubmit>;
    updateAnotherPartyOnSubmit?: {
      partyFilters: AssociatedPartyFilters;
      getCondition?: (clientData: ClientResponse | undefined) => boolean;
      getValues: (
        values: Partial<OnboardingFormValuesSubmit>
      ) => Partial<OnboardingFormValuesSubmit>;
    };
  };

export interface VisibilityContext {
  orgParty: PartyResponse | undefined;
}

export type VisibilityPredicate = (ctx: VisibilityContext) => boolean;

interface StepBase {
  id: string;
  title: string;
  description?: string;
  /** Short summary shown in the overview requirements list for this step. */
  requirementSummary?: string;
  isVisible?: VisibilityPredicate;
}

export type StepConfig = BaseStep | FormStep;

export interface BaseStep extends StepBase {
  stepType: 'static' | 'check-answers';
  Component?: React.ComponentType<StepperStepProps>;
}

export interface FormStep extends StepBase {
  stepType: 'form';
  Component: FormStepComponent;
}

export type ScreenId = StaticScreenId | SectionScreenId;

export type StaticScreenId =
  | 'gateway'
  | 'checklist'
  | 'overview'
  | 'owner-stepper'
  | 'charitable-donor-stepper'
  | 'wealth-contributor-stepper'
  | 'document-upload-form'
  | 'link-account';

export type SectionScreenId =
  | 'personal-section'
  | 'business-section'
  | 'owners-section'
  | 'nonprofit-due-diligence-section'
  | 'additional-questions-section'
  | 'review-attest-section'
  | 'upload-documents-section';

export type ScreenConfig = StaticScreenConfig | SectionScreenConfig;

export type StaticScreenConfig = BaseScreenConfig & {
  id: StaticScreenId;
  isSection: false;
  sectionConfig?: never;
};

export type SectionScreenConfig = BaseScreenConfig & {
  id: SectionScreenId;
  isSection: true;
  sectionConfig: {
    icon: LucideIcon;
    label: string;
    shortLabel?: string;
    helpText?: string;
    onHoldText?: string;
    requirementsList?: string[];
    isVisible?: VisibilityPredicate;
    statusResolver?: (
      sessionData: FlowSessionData,
      clientData: ClientResponse | undefined,
      allStepsValid: boolean,
      stepValidationMap: StepValidationMap,
      savedFormValues: Partial<OnboardingFormValuesSubmit> | undefined,
      screenId: ScreenId
    ) => SectionStatus;
  };
};

type BaseScreenConfig = BaseScreenComponentConfig | BaseScreenStepperConfig;

interface BaseScreenComponentConfig {
  type: 'component';
  Component: React.ComponentType<any>;
  stepperConfig?: never;
}

interface BaseScreenStepperConfig {
  type: 'stepper';
  Component?: never;
  stepperConfig: StepperConfig;
}

export interface StepperConfig {
  steps: StepConfig[];
  associatedPartyFilters?: AssociatedPartyFilters;
  getDefaultPartyRequestBody?: (
    orgType?: OrganizationType
  ) => Partial<CreatePartyRequestInline>;
}

export interface AssociatedPartyFilters {
  partyType: PartyResponse['partyType'];
  roles: PartyResponse['roles'];
}

export interface FlowConfig {
  screens: ScreenConfig[];
}

export interface StepperValidation {
  stepValidationMap: StepValidationMap;
  allStepsValid: boolean;
}

export type StepValidationMap = Record<
  string,
  {
    result: z.SafeParseReturnType<unknown, unknown> | undefined;
    isValid: boolean;
  }
>;

export type SectionStatus =
  | 'not_started'
  | 'verifying'
  | 'completed'
  | 'completed_disabled'
  | 'missing_details'
  | 'on_hold'
  | 'hidden';

export type FlowProgress = {
  sectionStatuses: Record<SectionScreenId, SectionStatus>;
  stepValidations: Record<SectionScreenId, StepValidationMap>;
};

export type FlowSessionData = {
  isControllerOwnerQuestionAnswered?: boolean;
  isOwnersSectionDone?: boolean;
  isNonprofitDueDiligenceDone?: boolean;
  hasCharitableDonors?: boolean;
  hasWealthContributors?: boolean;
  mockedVerifyingSectionId?: ScreenId;
  hideGatewayInfoAlert?: boolean;
  hideOverviewInfoAlert?: boolean;
  completedStaticStepIds?: string[];
  /** Transient flag set after successfully creating a linked account; cleared when overview dismisses the banner. */
  linkAccountJustCreated?: boolean;
  /** Set when the user answers the PTC question on the gateway screen. */
  isPTCQuestionAnswered?: boolean;
};

export type StepperStepProps = {
  handleNext: () => void;
  handlePrev: () => void;
  getPrevButtonLabel: () => React.ReactNode | null;
  getNextButtonLabel: () => React.ReactNode | null;
  prevButtonDisabled?: boolean;
};
