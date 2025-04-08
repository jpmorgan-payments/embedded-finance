import { FC } from 'react';
import { BuildingIcon, LucideIcon, UserIcon } from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  PersonalDetailsForm,
  SectionStepFormProps,
} from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';
import { PersonalDetailsFormSchema } from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm.schema';

export type StepType =
  | {
      id: string;
      title: string;
      description?: string;
      formConfig: {
        FormComponent: FC<SectionStepFormProps<any>>;
        schema: any; // Replace with the actual schema type
        party: Partial<PartyResponse>;
      };
      Component?: never; // Ensure Component is not allowed
    }
  | {
      id: string;
      title: string;
      description?: string;
      formConfig?: never; // Ensure formConfig is not allowed
      Component: FC; // Optional non-form component
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
        formConfig: {
          FormComponent: PersonalDetailsForm,
          schema: PersonalDetailsFormSchema,
          party: parties.controller,
        },
      },
      {
        id: 'identity-document',
        title: 'Identity document',
        description:
          'We need some additional details to confirm your identity.',
        formConfig: {
          FormComponent: PersonalDetailsForm,
          schema: PersonalDetailsFormSchema,
          party: parties.controller,
        },
      },
      {
        id: 'company-introduction',
        title: 'Company introduction',
        description: 'Learn more about our company.',
        Component: () => <div>Review step</div>,
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
        formConfig: {
          FormComponent: PersonalDetailsForm,
          schema: PersonalDetailsFormSchema,
          party: parties.organization,
        },
      },
    ],
  },
];
