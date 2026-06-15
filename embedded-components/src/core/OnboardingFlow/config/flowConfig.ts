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
import { LinkAccountScreen } from '@/core/OnboardingFlow/screens/LinkAccountScreen/LinkAccountScreen';
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
  getOrganizationParty,
  isUSExchangePTC,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';

const ownerSteps: StepConfig[] = [
  {
    id: 'personal-details',
    stepType: 'form',
    titleKey: 'screens.ownerSteps.personalDetails.title',
    descriptionKey: 'screens.ownerSteps.personalDetails.description',
    Component: PersonalDetailsForm,
  },
  {
    id: 'identity-document',
    stepType: 'form',
    titleKey: 'screens.ownerSteps.identityDocument.title',
    descriptionKey: 'screens.ownerSteps.identityDocument.description',
    Component: IndividualIdentityForm,
  },
  {
    id: 'contact-details',
    stepType: 'form',
    titleKey: 'screens.ownerSteps.contactDetails.title',
    descriptionKey: 'screens.ownerSteps.contactDetails.description',
    Component: ContactDetailsForm,
  },
  {
    id: 'check-answers',
    stepType: 'check-answers',
    titleKey: 'screens.ownerSteps.checkAnswers.title',
    descriptionKey: 'screens.ownerSteps.checkAnswers.description',
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
  {
    id: 'link-account',
    isSection: false,
    type: 'component',
    Component: LinkAccountScreen,
  },
];

const sectionScreens: SectionScreenConfig[] = [
  {
    id: 'personal-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      labelKey: 'screens.personalSection.label',
      shortLabelKey: 'screens.personalSection.shortLabel',
      icon: UserIcon,
      requirementsListKeys: [
        'screens.personalSection.requirementsList.0',
        'screens.personalSection.requirementsList.1',
        'screens.personalSection.requirementsList.2',
      ],
      statusResolver: (
        _sessionData,
        clientData,
        allStepsValid,
        stepValidationMap
      ) => {
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'completed_disabled';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
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
          titleKey: 'screens.personalSection.steps.personalDetails.title',
          stepType: 'form',
          descriptionKey:
            'screens.personalSection.steps.personalDetails.description',
          requirementSummaryKey:
            'screens.personalSection.steps.personalDetails.requirementSummary',
          Component: PersonalDetailsForm,
        },
        {
          id: 'identity-document',
          titleKey: 'screens.personalSection.steps.identityDocument.title',
          stepType: 'form',
          descriptionKey:
            'screens.personalSection.steps.identityDocument.description',
          requirementSummaryKey:
            'screens.personalSection.steps.identityDocument.requirementSummary',
          Component: IndividualIdentityForm,
          isVisible: (ctx) => !isUSExchangePTC(ctx.orgParty),
        },
        {
          id: 'contact-details',
          titleKey: 'screens.personalSection.steps.contactDetails.title',
          stepType: 'form',
          descriptionKey:
            'screens.personalSection.steps.contactDetails.description',
          requirementSummaryKey:
            'screens.personalSection.steps.contactDetails.requirementSummary',
          Component: ContactDetailsForm,
        },
        {
          id: 'check-answers',
          titleKey: 'screens.personalSection.steps.checkAnswers.title',
          stepType: 'check-answers',
          descriptionKey:
            'screens.personalSection.steps.checkAnswers.description',
        },
      ],
    },
  },
  {
    id: 'business-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      labelKey: 'screens.businessSection.label',
      icon: BuildingIcon,
      requirementsListKeys: [
        'screens.businessSection.requirementsList.0',
        'screens.businessSection.requirementsList.1',
        'screens.businessSection.requirementsList.2',
      ],
      statusResolver: (
        _sessionData,
        clientData,
        allStepsValid,
        stepValidationMap
      ) => {
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'completed_disabled';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
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
          titleKey: 'screens.businessSection.steps.businessIdentity.title',
          descriptionKey:
            'screens.businessSection.steps.businessIdentity.description',
          Component: BusinessIdentityForm,
        },
        {
          id: 'industry',
          stepType: 'form',
          titleKey: 'screens.businessSection.steps.industry.title',
          descriptionKey: 'screens.businessSection.steps.industry.description',
          Component: IndustryForm,
        },
        {
          id: 'contact-info',
          stepType: 'form',
          titleKey: 'screens.businessSection.steps.contactInfo.title',
          descriptionKey:
            'screens.businessSection.steps.contactInfo.description',
          Component: BusinessContactInfoForm,
        },
        {
          id: 'check-answers',
          stepType: 'check-answers',
          titleKey: 'screens.businessSection.steps.checkAnswers.title',
          descriptionKey:
            'screens.businessSection.steps.checkAnswers.description',
        },
      ],
    },
  },
  {
    id: 'owners-section',
    isSection: true,
    type: 'component',
    sectionConfig: {
      isVisible: (ctx) =>
        !!ctx.orgParty?.organizationDetails?.organizationType &&
        ctx.orgParty.organizationDetails.organizationType !==
          'SOLE_PROPRIETORSHIP' &&
        !isUSExchangePTC(ctx.orgParty),
      labelKey: 'screens.ownersSection.label',
      shortLabelKey: 'screens.ownersSection.shortLabel',
      icon: Users2Icon,
      requirementsListKeys: [
        'screens.ownersSection.requirementsList.0',
        'screens.ownersSection.requirementsList.1',
        'screens.ownersSection.requirementsList.2',
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

        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'completed_disabled';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
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
      labelKey: 'screens.additionalQuestionsSection.label',
      icon: TagIcon,
      requirementsListKeys: [
        'screens.additionalQuestionsSection.requirementsList.0',
        'screens.additionalQuestionsSection.requirementsList.1',
      ],
      statusResolver: (_sessionData, clientData) => {
        const sectionCompleted =
          clientData?.outstanding?.questionIds?.length === 0;
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'completed_disabled';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
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
      labelKey: 'screens.reviewAttestSection.label',
      icon: FileIcon,
      statusResolver: (_sessionData, clientData) => {
        if (
          clientData?.status === 'INFORMATION_REQUESTED' ||
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'completed_disabled';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
        }
        return 'not_started';
      },
    },
    stepperConfig: {
      steps: [
        {
          id: 'review',
          titleKey: 'screens.reviewAttestSection.steps.review.title',
          stepType: 'static',
          descriptionKey:
            'screens.reviewAttestSection.steps.review.description',
          Component: ReviewForm,
        },
        {
          id: 'documents',
          titleKey: 'screens.reviewAttestSection.steps.documents.title',
          stepType: 'static',
          descriptionKey:
            'screens.reviewAttestSection.steps.documents.description',
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
      labelKey: 'screens.uploadDocumentsSection.label',
      icon: UploadIcon,
      onHoldTextKey: 'screens.uploadDocumentsSection.onHoldText',
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

        // Hide during REVIEW_IN_PROGRESS since we can't determine doc request history from clientData.
        // The OverviewScreen shows the appropriate alert ("We have your documents" vs "Application submitted")
        // using useSmbdoListDocumentRequests which has the actual document request data.
        if (
          clientData?.status === 'REVIEW_IN_PROGRESS' ||
          clientData?.status === 'APPROVED' ||
          clientData?.status === 'DECLINED'
        ) {
          return 'hidden';
        }

        if (
          !getOrganizationParty(clientData)?.organizationDetails
            ?.organizationType
        ) {
          return 'on_hold';
        }
        return 'on_hold';
      },
    },
    Component: DocumentUploadScreen,
  },
];

export const flowConfig: FlowConfig = {
  screens: [...staticScreens, ...sectionScreens],
};
