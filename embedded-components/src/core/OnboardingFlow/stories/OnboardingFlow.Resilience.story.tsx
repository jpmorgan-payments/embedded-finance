/**
 * OnboardingFlow — MSW resilience (HTTP errors)
 *
 * Supplements happy-path handlers with failing **GET /clients/:id** responses.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Resilience',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/** GET client fails with HTTP 503 — expect the shell error alert component. */
export const ClientGetServiceUnavailable: Story = {
  name: 'Client GET — 503 Service Unavailable',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        clientId: DEFAULT_CLIENT_ID,
        status: 503,
      }),
    },
    docs: {
      description: {
        story:
          'Overrides GET client with HTTP 503 after seeding the db (response still comes from the override). Expect the onboarding shell error alert.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};
