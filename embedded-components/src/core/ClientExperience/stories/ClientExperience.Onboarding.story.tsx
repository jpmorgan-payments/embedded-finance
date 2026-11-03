import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  mockClientApproved,
  mockClientDeclined,
  mockClientInfoRequested,
  mockClientInfoRequestedQuestionsOnly,
  mockClientInfoRequestedWithQuestions,
  mockClientInReview,
  mockClientNew,
  mockClientNewWithInformationRequest,
} from '@/core/OnboardingFlow/stories/story-utils';

import {
  clientExperienceMetaBase,
  onboardingScenario,
  type ClientExperienceStoryArgs,
} from './support/clientExperienceStoryMeta';

const approvedWithUnreviewedOwner: ClientResponse = {
  ...mockClientApproved,
  parties: [
    ...(mockClientApproved.parties ?? []),
    {
      id: '2000000114',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      profileStatus: 'NEW',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Darling',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
      },
    },
  ],
};

/**
 * Clients that `ClientExperience` routes to `OnboardingFlow`: everything
 * before approval, plus an approved client with a party that was never
 * reviewed. Watch `onExperienceResolved` in Actions.
 */
const meta: Meta<ClientExperienceStoryArgs> = {
  title: 'Draft/ClientExperience/Onboarding',
  ...clientExperienceMetaBase,
};

export default meta;
type Story = StoryObj<ClientExperienceStoryArgs>;

/** A new client still completing onboarding. */
export const InProgress: Story = onboardingScenario(mockClientNew);

/**
 * Review asked a question before the client submitted. It gets its own
 * section, apart from the onboarding questions.
 */
export const InProgressWithInformationRequest: Story = onboardingScenario(
  mockClientNewWithInformationRequest
);

/** Onboarding was submitted and is under review. */
export const UnderReview: Story = onboardingScenario(mockClientInReview);

/** Review asked for documents. */
export const InformationRequestedDocuments: Story = onboardingScenario(
  mockClientInfoRequested
);

/** Review asked questions only. */
export const InformationRequestedQuestions: Story = onboardingScenario(
  mockClientInfoRequestedQuestionsOnly
);

/** Review asked for documents and questions. */
export const InformationRequestedDocumentsAndQuestions: Story =
  onboardingScenario(mockClientInfoRequestedWithQuestions);

/** Onboarding was declined. */
export const Declined: Story = onboardingScenario(mockClientDeclined);

/**
 * An approved client with a party that was never reviewed (`profileStatus:
 * NEW`, no open or approved `ADD`). Only an API defect causes this; the party
 * is completed in `OnboardingFlow` like a new one.
 */
export const ApprovedWithUnreviewedParty: Story = onboardingScenario(
  approvedWithUnreviewedOwner
);
