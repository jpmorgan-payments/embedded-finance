import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  STORY_CLIENT_ID,
  type MaintenanceStoryScenario,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryHandlers';
import {
  maintenanceStoryArgs,
  maintenanceStoryDecorator,
  withScenario,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryMeta';
import {
  commonArgs,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  resetAndSeedClient,
} from '@/core/OnboardingFlow/stories/story-utils';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import { ClientExperience } from '../../ClientExperience';
import type { ClientExperienceProps } from '../../ClientExperience.types';

export type ClientExperienceStoryArgs = ClientExperienceProps & BaseStoryArgs;
type Story = StoryObj<ClientExperienceStoryArgs>;

export const maintenanceArgs: NonNullable<
  ClientExperienceProps['maintenance']
> = {
  eligibility: maintenanceStoryArgs.eligibility!,
  initialProductVerificationAcceptedAt:
    maintenanceStoryArgs.initialProductVerificationAcceptedAt,
};

/** Everything a ClientExperience story file shares except its `title`. */
export const clientExperienceMetaBase = {
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
    maintenance: maintenanceArgs,
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
} satisfies Omit<Meta<ClientExperienceStoryArgs>, 'title'>;

/** Onboarding clients come from the shared MSW db; none has a maintenance request. */
export const onboardingScenario = (client: ClientResponse): Story => ({
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

/** An approved client with its own stateful maintenance API. */
export const maintenanceScenario = (
  scenario: MaintenanceStoryScenario,
  maintenance?: Partial<NonNullable<ClientExperienceProps['maintenance']>>
): Story => ({
  args: {
    clientId: STORY_CLIENT_ID,
    ...(maintenance
      ? { maintenance: { ...maintenanceArgs, ...maintenance } }
      : {}),
  },
  parameters: withScenario(scenario),
});
