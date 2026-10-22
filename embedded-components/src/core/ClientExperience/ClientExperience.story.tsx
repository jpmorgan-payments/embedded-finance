import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  LLC_WITH_DIRECT_OWNERS,
  renamePeter,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryClients';
import { STORY_CLIENT_ID } from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryHandlers';
import {
  maintenanceStoryArgs,
  maintenanceStoryDecorator,
  withScenario,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryMeta';
import {
  commonArgs,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientApproved,
  mockClientInReview,
  mockClientNew,
  resetAndSeedClient,
} from '@/core/OnboardingFlow/stories/story-utils';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { ClientExperience } from './ClientExperience';
import type { ClientExperienceProps } from './ClientExperience.types';

type ClientExperienceStoryArgs = ClientExperienceProps & BaseStoryArgs;

/** Onboarding clients come from the shared MSW db; none has a maintenance request. */
const onboardingScenario = (client: ClientResponse): Partial<Story> => ({
  args: { clientId: DEFAULT_CLIENT_ID },
  loaders: [
    () => {
      resetAndSeedClient(client, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        http.get('/maintenance-requests', () =>
          HttpResponse.json({
            parties: [],
            metadata: { page: 0, limit: 25, total: 0 },
          })
        ),
        ...defaultHandlers,
      ],
    },
  },
});

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
 * Loads the client and its maintenance requests, then renders `OnboardingFlow`
 * or `ApprovedClientMaintenance`. Watch `onExperienceResolved` in Actions to
 * see which route each client takes.
 */
const meta: Meta<ClientExperienceStoryArgs> = {
  title: 'Draft/ClientExperience',
  component: ClientExperience,
  tags: ['autodocs'],
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: {
    onboarding: {
      ...commonArgs,
      availableProducts: ['EMBEDDED_PAYMENTS'],
      availableJurisdictions: ['US'],
      height: '760px',
    },
    maintenance: {
      eligibility: maintenanceStoryArgs.eligibility!,
      initialProductVerificationAcceptedAt:
        maintenanceStoryArgs.initialProductVerificationAcceptedAt,
    },
    onExperienceResolved: fn(),
  },
  argTypes: {
    onboarding: {
      control: { type: 'object' },
      description: 'Props passed to `OnboardingFlow`.',
    },
    maintenance: {
      control: { type: 'object' },
      description: 'Props passed to `ApprovedClientMaintenance`.',
    },
  },
  render: (args) => <ClientExperience {...args} />,
};

export default meta;
type Story = StoryObj<ClientExperienceStoryArgs>;

/** A client still completing onboarding is routed to `OnboardingFlow`. */
export const OnboardingInProgress: Story = onboardingScenario(mockClientNew);

/** Onboarding was submitted and is under review, so it stays in `OnboardingFlow`. */
export const OnboardingUnderReview: Story =
  onboardingScenario(mockClientInReview);

/** An approved client with no maintenance request sees the approved profile. */
export const ApprovedProfile: Story = {
  args: { clientId: STORY_CLIENT_ID },
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** An approved client with a draft maintenance request returns to it. */
export const ActiveMaintenanceRequest: Story = {
  args: { clientId: STORY_CLIENT_ID },
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
  }),
};

/**
 * An approved client with a party that was never reviewed (`profileStatus:
 * NEW`, no open or approved `ADD`). Only an API defect causes this; the party
 * is completed in `OnboardingFlow` like a new one.
 */
export const UnreviewedPartyRoutesToOnboarding: Story = onboardingScenario(
  approvedWithUnreviewedOwner
);

/** The client can't be loaded, so no route is chosen and a retry is offered. */
export const ClientLoadFailure: Story = {
  args: { clientId: STORY_CLIENT_ID },
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    failClientLoad: true,
  }),
};
