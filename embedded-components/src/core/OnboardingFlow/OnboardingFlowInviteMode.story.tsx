/**
 * OnboardingFlow — Invitation Mode
 *
 * Standalone flow for collecting a single owner's information via an invite link.
 * When `partyId` is provided, the flow shows only that party's steps:
 * Personal details → Identity document → Contact details → Check your answers → Submit.
 *
 * The section title displays the party's name (fetched from the API).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { db } from '../../msw/db';
import {
  commonArgs,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './stories/story-utils';
import type { OnboardingFlowProps } from './types/onboarding.types';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Invitation Mode',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    msw: { handlers: defaultHandlers },
    layout: 'fullscreen',
  },
  argTypes: commonArgTypes,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

export const Default: Story = {
  loaders: [
    () => {
      resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID);
      // Remove the fully-seeded party and recreate with only minimal invite data
      db.party.delete({ where: { id: { equals: '2000000112' } } });
      db.party.create({
        id: '2000000112',
        partyType: 'INDIVIDUAL',
        email: 'alice.johnson@acmecorp.com',
        roles: ['BENEFICIAL_OWNER'],
        active: true,
        profileStatus: 'NEW',
        createdAt: '2024-06-21T18:12:21.005Z',
        individualDetails: {
          firstName: 'Alice',
          lastName: 'Johnson',
          jobTitle: 'CFO',
        },
      });
    },
  ],
  args: {
    ...commonArgs,
    partyId: '2000000112',
    onInviteSubmitSuccess: (partyData) => {
      // eslint-disable-next-line no-console
      console.log('@@Invite submit success', partyData);
    },
  },
};
