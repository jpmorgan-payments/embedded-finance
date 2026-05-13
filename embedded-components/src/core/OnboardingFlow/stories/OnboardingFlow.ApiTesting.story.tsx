/**
 * OnboardingFlow - API Testing
 *
 * Stories that bypass MSW and connect to a real backend API for
 * end-to-end integration testing.
 *
 * **Setup:**
 * Create a `.env.local` file in `embedded-components/` with:
 * ```
 * VITE_API_BASE_URL=<your-gateway-base-url>/do/v1/
 * VITE_API_CLIENT_ID=<your-client-id>
 * VITE_API_PLATFORM_ID=<your-platform-id>
 * ```
 *
 * Or override values directly in Storybook Controls panel.
 *
 * **URL Transforms:**
 * When the base URL uses `/do/v1/`, the `recipients` endpoint is
 * automatically transformed back to `/v1/` (recipients don't use the
 * `/do/` prefix). All other onboarding endpoints (clients, parties,
 * questions, document-requests, documents) stay on `/do/v1/`.
 */

import React from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  OnboardingFlowTemplate,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

/**
 * Custom decorator that overrides the global EBComponentsProvider with
 * URL transforms appropriate for a `/do/v1/` base URL:
 * - recipients → strip `/do/` (goes to `/v1/`)
 * - All other paths stay on `/do/v1/` as-is
 */
const withApiTestingProvider: Decorator<OnboardingFlowStoryArgs> = (
  Story,
  context
) => {
  const { args } = context;
  const baseUrl = args.apiBaseUrl || '/';

  return (
    <EBComponentsProvider
      apiBaseUrl={baseUrl}
      apiBaseUrlTransforms={{
        recipients: (url: string) => url.replace(/\/do\/v1\/$/, '/v1/'),
      }}
      headers={args.headers}
      clientId={args.clientId ?? ''}
    >
      <Story />
    </EBComponentsProvider>
  );
};

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/API Testing',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@api-testing'],
  decorators: [withApiTestingProvider],
  parameters: {
    layout: 'fullscreen',
    // Disable MSW so requests go to the real API
    msw: {
      handlers: [],
    },
    docs: {
      description: {
        component:
          'Functional testing stories without MSW mocks. Connects to a real backend API for end-to-end testing. Configure via `.env.local` or Storybook Controls.',
      },
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
    apiBaseUrl: {
      control: { type: 'text' },
      description:
        'Base URL for the API. Should end with `/do/v1/` for standard gateway routing.',
      table: { category: 'API Testing' },
    },
    clientId: {
      control: { type: 'text' },
      description: 'Client ID to load',
      table: { category: 'API Testing' },
    },
    headers: {
      control: { type: 'object' },
      description:
        'Headers including platform_id, token, client_id for authentication',
      table: { category: 'API Testing' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/**
 * **Default**
 *
 * Connects to the API using env variables or Controls.
 * The `argsEnhancers` in `.storybook/preview.tsx` automatically
 * populate `apiBaseUrl` from `VITE_API_BASE_URL`.
 * `clientId` and `headers.platform_id` are read from
 * `VITE_API_CLIENT_ID` and `VITE_API_PLATFORM_ID`.
 *
 * The custom decorator applies `apiBaseUrlTransforms` so that
 * `recipients` routes to `/v1/` while everything else stays on `/do/v1/`.
 */
export const Default: Story = {
  args: {
    ...commonArgs,
    clientId: import.meta.env.VITE_API_CLIENT_ID ?? '',
    headers: {
      platform_id: import.meta.env.VITE_API_PLATFORM_ID ?? '',
    },
    showLinkAccountStep: true,
  },
};

/**
 * **Custom Environment**
 *
 * Use Storybook Controls to set `apiBaseUrl`, `clientId`, and `headers`
 * for any environment or client.
 */
export const CustomEnvironment: Story = {
  args: {
    ...commonArgs,
    apiBaseUrl: '',
    clientId: '',
    headers: {
      platform_id: '',
      token: '',
      client_id: '',
    },
  },
};
