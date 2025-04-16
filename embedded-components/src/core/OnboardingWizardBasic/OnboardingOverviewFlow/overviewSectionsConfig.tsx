import { FC } from 'react';
import {
  BuildingIcon,
  FileIcon,
  LucideIcon,
  TagIcon,
  UserIcon,
  Users2Icon,
} from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import { CompanyIdentificationForm } from './OnboardingSectionStepper/BusinessSectionForms/CompanyIdentificationForm/CompanyIdentificationForm';
import { IndustryForm } from './OnboardingSectionStepper/BusinessSectionForms/IndustryForm/IndustryForm';
import { ContactDetailsForm } from './OnboardingSectionStepper/PersonalSectionForms/ContactDetailsForm/ContactDetailsForm';
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

export const overviewSections: SectionType[] = [
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
        id: 'contact-details',
        type: 'form',
        title: 'Contact details',
        description:
          'We need some additional details to confirm your identity.',
        formConfig: {
          FormComponent: ContactDetailsForm,
          party: parties.controller,
        },
      },
      {
        id: 'check-answers',
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
        id: 'industry',
        type: 'form',
        title: 'Industry',
        description:
          'Selecting your industry helps satisfy important risk and compliance obligations.',
        formConfig: {
          FormComponent: IndustryForm,
          party: parties.organization,
        },
      },
      {
        id: 'company-identification',
        type: 'form',
        title: 'Company identification',
        description: 'Please provide details about your company.',
        formConfig: {
          FormComponent: CompanyIdentificationForm,
          party: parties.organization,
        },
      },
    ],
  },
  {
    id: 'owners',
    title: 'Owners and key roles',
    icon: Users2Icon,
    steps: [],
  },
  { id: 'operational', title: 'Operational details', icon: TagIcon, steps: [] },
  {
    id: 'attest',
    title: 'Review and attest',
    icon: FileIcon,
    steps: [],
  },
];
