import { i18n } from '@/i18n/config';
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
  BusinessIdentityForm,
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
    title: i18n.t(
      'onboarding-overview:screens.ownerSteps.personalDetails.title'
    ),
    description: i18n.t(
      'onboarding-overview:screens.ownerSteps.personalDetails.description'
    ),
    Component: PersonalDetailsForm,
  },
  {
    id: 'identity-document',
    stepType: 'form',
    title: i18n.t(
      'onboarding-overview:screens.ownerSteps.identityDocument.title'
    ),
    description: i18n.t(
      'onboarding-overview:screens.ownerSteps.identityDocument.description'
    ),
    Component: IndividualIdentityForm,
  },
  {
    id: 'contact-details',
    stepType: 'form',
    title: i18n.t(
      'onboarding-overview:screens.ownerSteps.contactDetails.title'
    ),
    description: i18n.t(
      'onboarding-overview:screens.ownerSteps.contactDetails.description'
    ),
    Component: ContactDetailsForm,
  },
  {
    id: 'check-answers',
    stepType: 'check-answers',
    title: i18n.t('onboarding-overview:screens.ownerSteps.checkAnswers.title'),
    description: i18n.t(
      'onboarding-overview:screens.ownerSteps.checkAnswers.description'
    ),
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
      label: i18n.t('onboarding-overview:screens.personalSection.label'),
      shortLabel: i18n.t(
        'onboarding-overview:screens.personalSection.shortLabel'
      ),
      icon: UserIcon,
      requirementsList: [
        i18n.t(
          'onboarding-overview:screens.personalSection.requirementsList.0'
        ),
        i18n.t(
          'onboarding-overview:screens.personalSection.requirementsList.1'
        ),
        i18n.t(
          'onboarding-overview:screens.personalSection.requirementsList.2'
        ),
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
          title: i18n.t(
            'onboarding-overview:screens.personalSection.steps.personalDetails.title'
          ),
          stepType: 'form',
          description: i18n.t(
            'onboarding-overview:screens.personalSection.steps.personalDetails.description'
          ),
          Component: PersonalDetailsForm,
        },
        {
          id: 'identity-document',
          title: i18n.t(
            'onboarding-overview:screens.personalSection.steps.identityDocument.title'
          ),
          stepType: 'form',
          description: i18n.t(
            'onboarding-overview:screens.personalSection.steps.identityDocument.description'
          ),
          Component: IndividualIdentityForm,
        },
        {
          id: 'contact-details',
          title: i18n.t(
            'onboarding-overview:screens.personalSection.steps.contactDetails.title'
          ),
          stepType: 'form',
          description: i18n.t(
            'onboarding-overview:screens.personalSection.steps.contactDetails.description'
          ),
          Component: ContactDetailsForm,
        },
        {
          id: 'check-answers',
          title: i18n.t(
            'onboarding-overview:screens.personalSection.steps.checkAnswers.title'
          ),
          stepType: 'check-answers',
          description: i18n.t(
            'onboarding-overview:screens.personalSection.steps.checkAnswers.description'
          ),
        },
      ],
    },
  },
  {
    id: 'business-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      label: i18n.t('onboarding-overview:screens.businessSection.label'),
      icon: BuildingIcon,
      requirementsList: [
        i18n.t(
          'onboarding-overview:screens.businessSection.requirementsList.0'
        ),
        i18n.t(
          'onboarding-overview:screens.businessSection.requirementsList.1'
        ),
        i18n.t(
          'onboarding-overview:screens.businessSection.requirementsList.2'
        ),
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
          id: 'business-identity',
          stepType: 'form',
          title: i18n.t(
            'onboarding-overview:screens.businessSection.steps.businessIdentity.title'
          ),
          description: i18n.t(
            'onboarding-overview:screens.businessSection.steps.businessIdentity.description'
          ),
          Component: BusinessIdentityForm,
        },
        {
          id: 'industry',
          stepType: 'form',
          title: i18n.t(
            'onboarding-overview:screens.businessSection.steps.industry.title'
          ),
          description: i18n.t(
            'onboarding-overview:screens.businessSection.steps.industry.description'
          ),
          Component: IndustryForm,
        },
        {
          id: 'contact-info',
          stepType: 'form',
          title: i18n.t(
            'onboarding-overview:screens.businessSection.steps.contactInfo.title'
          ),
          description: i18n.t(
            'onboarding-overview:screens.businessSection.steps.contactInfo.description'
          ),
          Component: BusinessContactInfoForm,
        },
        {
          id: 'check-answers',
          stepType: 'check-answers',
          title: i18n.t(
            'onboarding-overview:screens.businessSection.steps.checkAnswers.title'
          ),
          description: i18n.t(
            'onboarding-overview:screens.businessSection.steps.checkAnswers.description'
          ),
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
      label: i18n.t('onboarding-overview:screens.ownersSection.label'),
      icon: Users2Icon,
      requirementsList: [
        i18n.t('onboarding-overview:screens.ownersSection.requirementsList.0'),
        i18n.t('onboarding-overview:screens.ownersSection.requirementsList.1'),
        i18n.t('onboarding-overview:screens.ownersSection.requirementsList.2'),
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
      label: i18n.t(
        'onboarding-overview:screens.additionalQuestionsSection.label'
      ),
      icon: TagIcon,
      requirementsList: [
        i18n.t(
          'onboarding-overview:screens.additionalQuestionsSection.requirementsList.0'
        ),
        i18n.t(
          'onboarding-overview:screens.additionalQuestionsSection.requirementsList.1'
        ),
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
      label: i18n.t('onboarding-overview:screens.reviewAttestSection.label'),
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
          title: i18n.t(
            'onboarding-overview:screens.reviewAttestSection.steps.review.title'
          ),
          stepType: 'static',
          description: i18n.t(
            'onboarding-overview:screens.reviewAttestSection.steps.review.description'
          ),
          Component: ReviewForm,
        },
        {
          id: 'documents',
          title: i18n.t(
            'onboarding-overview:screens.reviewAttestSection.steps.documents.title'
          ),
          stepType: 'static',
          description: i18n.t(
            'onboarding-overview:screens.reviewAttestSection.steps.documents.description'
          ),
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
      label: i18n.t('onboarding-overview:screens.uploadDocumentsSection.label'),
      icon: UploadIcon,
      onHoldText: i18n.t(
        'onboarding-overview:screens.uploadDocumentsSection.onHoldText'
      ),
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
