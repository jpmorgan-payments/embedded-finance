// org type condition
// disabled.locked condition state

import { FC } from 'react';
import { BuildingIcon, LucideIcon, UserIcon } from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  PersonalDetailsForm,
  SectionStepFormProps,
} from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';
import { PersonalDetailsFormSchema } from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm.schema';

export type StepType = {
  id: string;
  title: string;
  description?: string;
  content: FC<SectionStepFormProps<any>>;
  form?: {
    schema: any; // Replace with the actual schema type
    party: Partial<PartyResponse>;
    // populateDataOnLoad:
    // modifyDataOnSubmit:
  };
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
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        content: PersonalDetailsForm,
        form: {
          schema: PersonalDetailsFormSchema,
          party: parties.controller,
        },
      },
      {
        id: 'identity-document',
        title: 'Identity document',
        description:
          'We need some additional details to confirm your identity.',
        content: PersonalDetailsForm,
        form: {
          schema: PersonalDetailsFormSchema,
          party: parties.controller,
        },
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
        title: 'Company details',
        description: 'Provide details about your company.',
        content: PersonalDetailsForm,
        form: {
          schema: PersonalDetailsFormSchema,
          party: parties.organization,
        },
      },
      {
        id: 'company-identification',
        title: 'Company identification',
        description: 'Provide identification details for your company.',
        content: PersonalDetailsForm,
        form: {
          schema: PersonalDetailsFormSchema,
          party: parties.organization,
        },
      },
    ],
  },
];
