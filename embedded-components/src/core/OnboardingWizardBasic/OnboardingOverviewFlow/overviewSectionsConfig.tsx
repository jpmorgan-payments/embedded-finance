import {
  BuildingIcon,
  FileIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
  Users2Icon,
} from 'lucide-react';

import { PartyResponse } from '@/api/generated/smbdo.schemas';

import { CompanyIdentificationForm } from './OnboardingSectionStepper/BusinessSectionForms/CompanyIdentificationForm/CompanyIdentificationForm';
import { CustomerFacingDetailsForm } from './OnboardingSectionStepper/BusinessSectionForms/CustomerFacingDetailsForm/CustomerFacingDetailsForm';
import { IndustryForm } from './OnboardingSectionStepper/BusinessSectionForms/IndustryForm/IndustryForm';
import { ContactDetailsForm } from './OnboardingSectionStepper/PersonalSectionForms/ContactDetailsForm/ContactDetailsForm';
import { IndividualIdentityForm } from './OnboardingSectionStepper/PersonalSectionForms/IndividualIdentityForm/IndividualIdentityForm';
import { PersonalDetailsForm } from './OnboardingSectionStepper/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';
import { SectionType } from './types';

const parties: Record<string, Partial<PartyResponse>> = {
  controller: {
    partyType: 'INDIVIDUAL',
    roles: ['BENEFICIAL_OWNER'],
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
    type: 'stepper',
    correspondingParty: parties.controller,
    defaultPartyRequestBody: parties.controller,
    steps: [
      {
        id: 'personal-details',
        type: 'form',
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        FormComponent: PersonalDetailsForm,
      },
      {
        id: 'identity-document',
        type: 'form',
        title: 'Identity document',
        description:
          'We need some additional details to confirm your identity.',
        FormComponent: IndividualIdentityForm,
      },
      {
        id: 'contact-details',
        type: 'form',
        title: 'Contact details',
        description:
          'We need some additional details to confirm your identity.',
        FormComponent: ContactDetailsForm,
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
    type: 'stepper',
    correspondingParty: parties.organization,
    defaultPartyRequestBody: parties.organization,
    steps: [
      {
        id: 'industry',
        type: 'form',
        title: 'Business classification',
        description:
          'Selecting your business classification helps satisfy important risk and compliance obligations.',
        FormComponent: IndustryForm,
      },
      {
        id: 'company-identification',
        type: 'form',
        title: 'Company identification',
        description: 'Please provide details about your company.',
        FormComponent: CompanyIdentificationForm,
      },
      {
        id: 'customer-facing-details',
        type: 'form',
        title: 'Customer facing details',
        description:
          'Please help us understand how you present your company to customers.',
        FormComponent: CustomerFacingDetailsForm,
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
    id: 'owners',
    title: 'Owners and key roles',
    icon: Users2Icon,
    type: 'global-step',
    stepId: 'owners',
  },
  {
    id: 'operational',
    title: 'Operational details',
    icon: TagIcon,
    type: 'global-step',
    stepId: 'operational-details',
  },
  {
    id: 'attest',
    title: 'Review and attest',
    icon: FileIcon,
    type: 'global-step',
    stepId: 'overview',
  },
  {
    id: 'upload-documents',
    title: 'Supporting documents',
    icon: UploadIcon,
    type: 'global-step',
    stepId: 'overview',
  },
];
