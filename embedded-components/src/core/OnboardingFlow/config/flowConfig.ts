import {
  BuildingIcon,
  FileIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
  Users2Icon,
} from 'lucide-react';

import {
  BusinessContactInfoForm,
  CompanyIdentificationForm,
  CustomerFacingDetailsForm,
  IndustryForm,
} from '@/core/OnboardingFlow/forms/business-section-forms';
import {
  ContactDetailsForm,
  IndividualIdentityForm,
  PersonalDetailsForm,
} from '@/core/OnboardingFlow/forms/personal-section-forms';
import { DocumentUploadForm } from '@/core/OnboardingFlow/screens/DocumentUploadScreen/DocumentUploadForm';
import { DocumentUploadScreen } from '@/core/OnboardingFlow/screens/DocumentUploadScreen/DocumentUploadScreen';
import { GatewayScreen } from '@/core/OnboardingFlow/screens/GatewayScreen/GatewayScreen';
import { OperationalDetailsForm } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm';
import { OverviewScreen } from '@/core/OnboardingFlow/screens/OverviewScreen/OverviewScreen';
import { OwnersSectionScreen } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';
import { ReviewForm } from '@/core/OnboardingFlow/screens/ReviewAndAttestSectionForms/ReviewForm/ReviewForm';
import { TermsAndConditionsForm } from '@/core/OnboardingFlow/screens/ReviewAndAttestSectionForms/TermsAndConditionsForm/TermsAndConditionsForm';
import {
  FlowConfig,
  SectionScreenConfig,
  StaticScreenConfig,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';
import {
  clientHasOutstandingDocRequests,
  getActiveOwners,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';

const ownerSteps: StepConfig[] = [
  {
    id: 'personal-details',
    stepType: 'form',
    title: 'Personal details',
    description:
      'We collect personal information to verify individuals for security and compliance.',
    Component: PersonalDetailsForm,
  },
  {
    id: 'identity-document',
    stepType: 'form',
    title: 'Identity document',
    description:
      'We need some additional details to verify individuals for security and compliance.',
    Component: IndividualIdentityForm,
  },
  {
    id: 'contact-details',
    stepType: 'form',
    title: 'Contact details',
    description: 'We need some additional details to confirm your identity.',
    Component: ContactDetailsForm,
  },
  {
    id: 'check-answers',
    stepType: 'check-answers',
    title: 'Check your answers',
    description:
      'Please ensure your answers are accurate and complete anything you may have missed.',
  },
];

const staticScreens: StaticScreenConfig[] = [
  {
    id: 'gateway',
    isSection: false,
    type: 'component',
    Component: GatewayScreen,
  },
  {
    id: 'overview',
    isSection: false,
    type: 'component',
    Component: OverviewScreen,
  },
  {
    id: 'owner-stepper',
    isSection: false,
    type: 'stepper',
    stepperConfig: {
      associatedPartyFilters: {
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
      },
      getDefaultPartyRequestBody: () => ({
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
      }),
      steps: ownerSteps,
    },
  },
  {
    id: 'document-upload-form',
    isSection: false,
    type: 'component',
    Component: DocumentUploadForm,
  },
];

const sectionScreens: SectionScreenConfig[] = [
  {
    id: 'personal-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      label: 'Your personal details',
      shortLabel: 'Personal details',
      icon: UserIcon,
      requirementsList: [
        'Your name and job title',
        'Government issued identifier (e.g. social security number)',
        'Address and contact details',
      ],
      statusResolver: (
        sessionData,
        clientData,
        allStepsValid,
        stepValidationMap
      ) => {
        if (sessionData.mockedKycCompleted) {
          return 'hidden';
        }
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }
        if (allStepsValid) {
          return 'completed';
        }

        const isAnyStepValid = Object.entries(stepValidationMap).some(
          ([, stepValidation]) => {
            return stepValidation.isValid;
          }
        );

        if (isAnyStepValid) {
          return 'missing_details';
        }

        return 'not_started';
      },
    },
    stepperConfig: {
      associatedPartyFilters: {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      },
      getDefaultPartyRequestBody: (organizationType) => ({
        partyType: 'INDIVIDUAL',
        roles:
          organizationType === 'SOLE_PROPRIETORSHIP'
            ? ['CONTROLLER', 'BENEFICIAL_OWNER']
            : ['CONTROLLER'],
      }),
      steps: [
        {
          id: 'personal-details',
          title: 'Your personal details',
          stepType: 'form',
          description:
            'We collect your personal information as the primary person controlling business operations for the company.',
          Component: PersonalDetailsForm,
        },
        {
          id: 'identity-document',
          title: 'Your ID details',
          stepType: 'form',
          description:
            'We need some additional details to confirm your identity.',
          Component: IndividualIdentityForm,
        },
        {
          id: 'contact-details',
          title: 'Your contact details',
          stepType: 'form',
          description:
            'We need some additional details to confirm your identity.',
          Component: ContactDetailsForm,
        },
        {
          id: 'check-answers',
          title: 'Check your answers',
          stepType: 'check-answers',
          description:
            'Please ensure your answers are accurate and complete anything you may have missed.',
        },
      ],
    },
  },
  {
    id: 'business-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      label: 'Business details',
      icon: BuildingIcon,
      requirementsList: [
        'Industry classification code',
        'Registration ID details (e.g. employer identification number)',
        'Location and contact details',
      ],
      statusResolver: (
        sessionData,
        clientData,
        allStepsValid,
        stepValidationMap
      ) => {
        if (sessionData.mockedKycCompleted) {
          return 'hidden';
        }
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }
        if (allStepsValid) {
          return 'completed';
        }
        const isAnyStepValid = Object.entries(stepValidationMap).some(
          ([, stepValidation]) => {
            return stepValidation.isValid;
          }
        );
        if (isAnyStepValid) {
          return 'missing_details';
        }
        return 'not_started';
      },
    },
    stepperConfig: {
      associatedPartyFilters: {
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
      },
      getDefaultPartyRequestBody: () => ({
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
      }),
      steps: [
        {
          id: 'industry',
          stepType: 'form',
          title: 'Industry classification',
          description:
            'Choose a classification that best describes your income-producing lines of business.',
          Component: IndustryForm,
        },
        {
          id: 'company-identification',
          stepType: 'form',
          title: 'Business identity',
          description: 'Please provide details about your business.',
          Component: CompanyIdentificationForm,
        },
        {
          id: 'customer-facing-details',
          stepType: 'form',
          title: 'Description & website',
          description:
            'Please help us understand the products and services you offer.',
          Component: CustomerFacingDetailsForm,
        },
        {
          id: 'contact-info',
          stepType: 'form',
          title: 'Contact information',
          description: 'Please let us know how to get in touch.',
          Component: BusinessContactInfoForm,
        },
        {
          id: 'check-answers',
          stepType: 'check-answers',
          title: 'Check your answers',
          description:
            'Please ensure your answers are accurate and complete anything you may have missed.',
        },
      ],
    },
  },
  {
    id: 'owners-section',
    isSection: true,
    type: 'component',
    sectionConfig: {
      excludedForOrgTypes: ['SOLE_PROPRIETORSHIP'],
      label: 'Owners and key roles',
      icon: Users2Icon,
      requirementsList: [
        'Name and job titles for all individuals',
        'Government issued identifier (e.g. social security number)',
        'Address and contact details',
      ],
      statusResolver: (
        sessionData,
        clientData,
        _allStepsValid,
        _stepValidationMap,
        savedFormValues,
        screenId
      ) => {
        const activeOwners = getActiveOwners(clientData);
        const allOwnersValid = activeOwners?.every((owner) => {
          const { allStepsValid } = getStepperValidation(
            ownerSteps,
            owner,
            clientData,
            savedFormValues,
            screenId
          );
          return allStepsValid;
        });

        if (sessionData.mockedKycCompleted) {
          return 'hidden';
        }
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }

        if (!allOwnersValid) {
          return 'missing_details';
        }

        if (sessionData.isOwnersSectionDone) {
          return 'completed';
        }
        return 'not_started';
      },
    },
    Component: OwnersSectionScreen,
  },
  {
    id: 'additional-questions-section',
    isSection: true,
    type: 'component',
    sectionConfig: {
      label: 'Operational details',
      icon: TagIcon,
      requirementsList: [
        'Total annual revenue',
        'Additional questions based on your business profile',
      ],
      statusResolver: (sessionData, clientData) => {
        const sectionCompleted =
          clientData?.outstanding?.questionIds?.length === 0;
        if (sessionData.mockedKycCompleted) {
          return 'hidden';
        }
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }
        if (sectionCompleted) {
          return 'completed';
        }
        return 'not_started';
      },
    },
    Component: OperationalDetailsForm,
  },
  {
    id: 'review-attest-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      label: 'Review and attest',
      icon: FileIcon,
      statusResolver: (sessionData, clientData) => {
        if (sessionData.mockedKycCompleted) {
          return 'hidden';
        }
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }
        return 'not_started';
      },
    },
    stepperConfig: {
      steps: [
        {
          id: 'review',
          title: 'Review your details',
          stepType: 'static',
          description:
            'Please ensure your answers are accurate and complete anything you may have missed.',
          Component: ReviewForm,
        },
        {
          id: 'documents',
          title: 'Terms and conditions',
          stepType: 'static',
          description:
            'Please open and review the following documents from J.P. Morgan to complete the process.',
          Component: TermsAndConditionsForm,
        },
      ],
    },
  },
  {
    id: 'upload-documents-section',
    isSection: true,
    type: 'component',
    sectionConfig: {
      label: 'Supporting documents',
      icon: UploadIcon,
      onHoldText: "We'll let you know if any documents are needed",
      statusResolver: (_sessionData, clientData) => {
        const hasOutstandingDocRequests =
          clientHasOutstandingDocRequests(clientData);

        if (clientData?.status === 'NEW') {
          return 'on_hold';
        }

        if (
          clientData?.status === 'INFORMATION_REQUESTED' &&
          hasOutstandingDocRequests
        ) {
          return 'not_started';
        }
        if (
          clientData?.status === 'REVIEW_IN_PROGRESS' &&
          !hasOutstandingDocRequests
        ) {
          return 'completed_disabled';
        }
        if (
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }
        return 'completed_disabled';
      },
    },
    Component: DocumentUploadScreen,
  },
];

export const flowConfig: FlowConfig = {
  screens: [...staticScreens, ...sectionScreens],
};
