import { i18n } from '@/i18n/config';
import { UserIcon } from 'lucide-react';

import {
  ContactDetailsForm,
  IndividualIdentityForm,
  PersonalDetailsForm,
} from '@/core/OnboardingFlow/forms/personal-section-forms';
import { FlowConfig, StepConfig } from '@/core/OnboardingFlow/types/flow.types';

const inviteOwnerSteps: StepConfig[] = [
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

/**
 * Builds a flow config for invite-based owner info collection.
 * The flow has a single section labeled with the party's name, containing
 * the standard owner steps (personal details, identity document, contact details, check answers).
 */
export function buildInviteFlowConfig(partyName: string): FlowConfig {
  return {
    screens: [
      {
        id: 'invite-owner-section',
        isSection: true,
        type: 'stepper',
        sectionConfig: {
          label: partyName,
          icon: UserIcon,
          statusResolver: (sessionData) =>
            sessionData.inviteSubmitted ? 'completed_disabled' : 'not_started',
        },
        stepperConfig: {
          associatedPartyFilters: {
            partyType: 'INDIVIDUAL',
            roles: ['BENEFICIAL_OWNER'],
          },
          steps: inviteOwnerSteps,
        },
      },
    ],
  };
}
