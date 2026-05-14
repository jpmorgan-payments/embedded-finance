/**
 * OnboardingFlow — Prepopulated client data story
 *
 * Demonstrates resuming onboarding for a client that already has
 * organization and controller data populated (restaurant).
 * Uses custom content tokens for field label overrides and link-account step.
 */

import { efClientOperator80Mock } from '@/mocks/efClientOperator80.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { type ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  defaultHandlers,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Mock Data
// ============================================================================

const PREPOPULATED_CLIENT_ID = '3100006997';

const mockClientOperator80: ClientResponse = {
  ...efClientOperator80Mock,
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Prepopulated Client',
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

// =============================================================================
// PREPOPULATED CLIENT STORIES
// =============================================================================

/**
 * **Prepopulated LLC with Controller & Authorized User**
 *
 * Demonstrates resuming onboarding for a client with pre-existing data:
 * - Organization: Neverland Books (LLC, book store)
 * - Controller/Authorized User: Peiter Pan
 * - Question responses pre-filled
 * - Link account step enabled with editable completion mode
 * - Custom content tokens overriding job title labels to "Occupation"
 */
export const Operator80Prepopulated: Story = {
  name: 'Prepopulated LLC (with Authorized User)',
  loaders: [
    () => resetAndSeedClient(mockClientOperator80, PREPOPULATED_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: PREPOPULATED_CLIENT_ID,
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      initialValues: {},
      completionMode: 'editable',
    },
    disclosureConfig: {
      platformName: 'Platform, Inc.',
    },
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          fields: {
            controllerJobTitle: {
              label: 'Occupation',
            },
            controllerJobTitleDescription: {
              label: 'Occupation Description',
            },
          },
        },
      },
    },
  },
};
