import { FC } from 'react';
import { BuildingIcon, LucideIcon, UserIcon } from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import { IndividualIdentityForm } from './OnboardingSectionStepper/PersonalSectionForms/IndividualIdentityForm/IndividualIdentityForm';
import { PersonalDetailsForm } from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';
import { SectionStepFormComponent } from './types';

export type StepType =
  | {
      id: string;
      type: 'form';
      title: string;
      description?: string;
      formConfig: {
        FormComponent: SectionStepFormComponent;
        party: Partial<PartyResponse>;
      };
      Component?: never; // Ensure Component is not allowed
    }
  | {
      id: string;
      type: 'non-form';
      title: string;
      description?: string;
      formConfig?: never; // Ensure formConfig is not allowed
      Component: FC; // Optional non-form component
    }
  | {
      id: string;
      type: 'check-answers';
      title: string;
      description?: string;
      formConfig?: never; // Ensure formConfig is not allowed\
      Component?: never;
    };

type SectionType = {
  id: string;
  title: string;
  icon: LucideIcon;
  steps: StepType[];
};

const parties: Record<string, Partial<PartyResponse>> = {
  controller: {
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
  },
  organization: {
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'],
  },
};

export const onboardingOverviewSections: SectionType[] = [
  {
    id: 'personal',
    title: 'Personal details',
    icon: UserIcon,
    steps: [
      {
        id: 'personal-details',
        type: 'form',
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        formConfig: {
          FormComponent: PersonalDetailsForm,
          party: parties.controller,
        },
      },
      {
        id: 'identity-document',
        type: 'form',
        title: 'Identity document',
        description:
          'We need some additional details to confirm your identity.',
        formConfig: {
          FormComponent: IndividualIdentityForm,
          party: parties.controller,
        },
      },
      {
        id: 'company-introduction',
        type: 'check-answers',
        title: 'Check your answers',
        description:
          'Please ensure your answers are accurate and complete anything you may have missed.',
      },
    ],
  },
  {
    id: 'business',
    title: 'Business details',
    icon: BuildingIcon,
    steps: [
      {
        id: 'company-details',
        type: 'form',
        title: 'Company details',
        description: 'Provide details about your company.',
        formConfig: {
          FormComponent: PersonalDetailsForm,
          party: parties.organization,
        },
      },
    ],
  },
];
