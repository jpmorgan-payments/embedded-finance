import {
  BuildingIcon,
  FileIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
  Users2Icon,
} from 'lucide-react';

import {
  FlowConfig,
  SectionScreenConfig,
  StaticScreenConfig,
} from './flow.types';
import { BusinessContactInfoForm } from './screens/BusinessSectionForms/BusinessContactInfoForm/BusinessContactInfoForm';
import { CompanyIdentificationForm } from './screens/BusinessSectionForms/CompanyIdentificationForm/CompanyIdentificationForm';
import { CustomerFacingDetailsForm } from './screens/BusinessSectionForms/CustomerFacingDetailsForm/CustomerFacingDetailsForm';
import { IndustryForm } from './screens/BusinessSectionForms/IndustryForm/IndustryForm';
import { ChecklistScreen } from './screens/ChecklistScreen/ChecklistScreen';
import { DocumentUploadScreen } from './screens/DocumentUploadScreen/DocumentUploadScreen';
import { GatewayScreen } from './screens/GatewayScreen/GatewayScreen';
import { OperationalDetailsForm } from './screens/OperationalDetailsForm/OperationalDetailsForm';
import { OverviewScreen } from './screens/OverviewScreen/OverviewScreen';
import { OwnersSectionScreen } from './screens/OwnersSectionScreen/OwnersSectionScreen';
import { ownerSteps } from './screens/OwnersSectionScreen/ownerSteps';
import { ContactDetailsForm } from './screens/PersonalSectionForms/ContactDetailsForm/ContactDetailsForm';
import { IndividualIdentityForm } from './screens/PersonalSectionForms/IndividualIdentityForm/IndividualIdentityForm';
import { PersonalDetailsForm } from './screens/PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';
import { ReviewForm } from './screens/ReviewAndAttestSectionForms/ReviewForm/ReviewForm';
import { TermsAndConditionsForm } from './screens/ReviewAndAttestSectionForms/TermsAndConditionsForm/TermsAndConditionsForm';
import { getActiveOwners } from './utils/dataUtils';
import { getStepperValidation } from './utils/flowUtils';

const staticScreens: StaticScreenConfig[] = [
  {
    id: 'gateway',
    isSection: false,
    type: 'component',
    Component: GatewayScreen,
  },
  {
    id: 'checklist',
    isSection: false,
    type: 'component',
    Component: ChecklistScreen,
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
      defaultPartyRequestBody: {
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
      },
      steps: ownerSteps,
    },
  },
];

const sectionScreens: SectionScreenConfig[] = [
  {
    id: 'personal-section',
    isSection: true,
    type: 'stepper',
    sectionConfig: {
      label: 'Personal details',
      icon: UserIcon,
    },
    stepperConfig: {
      associatedPartyFilters: {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      },
      defaultPartyRequestBody: {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      },
      steps: [
        {
          id: 'personal-details',
          title: 'Personal details',
          stepType: 'form',
          description:
            'We collect your personal information as the primary person controlling business operations for the company.',
          Component: PersonalDetailsForm,
        },
        {
          id: 'identity-document',
          title: 'Individual identity',
          stepType: 'form',
          description:
            'We need some additional details to confirm your identity.',
          Component: IndividualIdentityForm,
        },
        {
          id: 'contact-details',
          title: 'Contact details',
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
            'Please review the information you provided before we proceed.',
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
    },
    stepperConfig: {
      associatedPartyFilters: {
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
      },
      defaultPartyRequestBody: {
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
      },
      steps: [
        {
          id: 'industry',
          stepType: 'form',
          title: 'Business classification',
          description:
            'Selecting your business classification helps satisfy important risk and compliance obligations.',
          Component: IndustryForm,
        },
        {
          id: 'company-identification',
          stepType: 'form',
          title: 'Company identification',
          description: 'Please provide details about your company.',
          Component: CompanyIdentificationForm,
        },
        {
          id: 'customer-facing-details',
          stepType: 'form',
          title: 'Customer facing details',
          description:
            'Please help us understand how you present your company to customers.',
          Component: CustomerFacingDetailsForm,
        },
        {
          id: 'contact-info',
          stepType: 'form',
          title: 'Contact info',
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
      label: 'Owners and key roles',
      icon: Users2Icon,
      statusResolver: (sessionData, clientData) => {
        const activeOwners = getActiveOwners(clientData);
        const allOwnersValid = activeOwners?.every((owner) => {
          const { allStepsValid } = getStepperValidation(
            ownerSteps,
            owner,
            clientData
          );
          return allStepsValid;
        });

        if (sessionData.isOwnersSectionDone && allOwnersValid) {
          return 'done_editable';
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
      statusResolver: (sessionData, clientData) => {
        const completed = clientData?.outstanding?.questionIds?.length === 0;
        if (completed) {
          return 'done_editable';
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
        const completed = clientData?.status === 'REVIEW_IN_PROGRESS';
        if (completed || sessionData.mockedKycCompleted) {
          return 'done_editable';
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
      label: 'Upload documents',
      icon: UploadIcon,
      helpText: 'Supporting documents are only needed in some cases',
      statusResolver: (sessionData, clientData) => {
        if (
          sessionData.mockedKycCompleted ||
          clientData?.status === 'INFORMATION_REQUESTED'
        ) {
          return 'not_started';
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
