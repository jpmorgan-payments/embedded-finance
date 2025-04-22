import { FC } from 'react';
import { defaultResources } from '@/i18n/config';
import { LucideIcon } from 'lucide-react';
import { DeepPartial } from 'react-hook-form';
import { z } from 'zod';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import { Jurisdiction } from '../utils/types';
import { GlobalStepper } from './OnboardingGlobalStepper';

export type OnboardingConfigDefault = {
  initialClientId?: string;
  onboardingContentTokens?: DeepPartial<
    (typeof defaultResources)['enUS']['onboarding']
  >;
  alertOnExit?: boolean;
  userEventsToTrack?: string[];
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
};

export type OnboardingConfigUsedInContext = {
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartyResponse?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  availableOrganizationTypes?: Array<OrganizationType>;
  height?: string;
};

export type SectionStepFormComponent<
  TSchema extends z.ZodObject<Record<string, z.ZodType<any>>> = z.ZodObject<
    Record<string, z.ZodType<any>>
  >,
> = FC<{ currentPartyData?: PartyResponse }> & {
  schema: TSchema;
  refineSchemaFn?: (schema: TSchema) => z.ZodEffects<TSchema>;
  modifyFormValuesBeforeSubmit?: (
    values: z.output<TSchema>,
    partyData: PartyResponse | undefined
  ) => z.output<TSchema>;
};

export type StepType =
  | {
      id: string;
      type: 'form';
      title: string;
      description?: string;
      FormComponent: SectionStepFormComponent;
    }
  | {
      id: string;
      type: 'check-answers';
      title: string;
      description?: string;
      FormComponent?: never; // Ensure formConfig is not allowed\
    };

export type StepperSectionType = {
  id: string;
  title: string;
  icon: LucideIcon;
  type: 'stepper';
  correspondingParty: Partial<PartyResponse>;
  defaultPartyRequestBody?: Partial<PartyResponse>;
  steps: StepType[];
  Component?: never;
};

export type GlobalStepSectionType = {
  id: string;
  title: string;
  icon: LucideIcon;
  type: 'global-step';
  correspondingParty?: never;
  defaultPartyRequestBody?: never;
  steps?: never;
  stepId: (typeof GlobalStepper.steps)[number]['id'];
};

export type SectionType = StepperSectionType | GlobalStepSectionType;
