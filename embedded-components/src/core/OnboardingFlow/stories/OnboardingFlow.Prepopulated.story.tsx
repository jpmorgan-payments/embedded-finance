/**
 * OnboardingFlow — Prepopulated client data story
 *
 * Demonstrates resuming onboarding for a client that already has
 * organization and controller data populated (Operator 80 restaurant).
 * Uses custom content tokens for field label overrides and link-account step.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { type ClientResponse } from '@/api/generated/smbdo.schemas';
import { efClientOperator80Mock } from '@/mocks/efClientOperator80.mock';

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
 * **Operator 80 — Prepopulated LLC with Controller**
 *
 * Demonstrates resuming onboarding for a client with pre-existing data:
 * - Organization: Operator 80 Palo Alto CA (LLC, food services)
 * - Controller/Beneficial Owner: Kathy Thomas Gellar
 * - Question responses pre-filled
 * - Link account step enabled with editable completion mode
 * - Custom content tokens overriding job title labels to "Occupation"
 */
export const Operator80Prepopulated: Story = {
  name: 'Operator 80 — Prepopulated LLC',
  loaders: [() => resetAndSeedClient(mockClientOperator80, PREPOPULATED_CLIENT_ID)],
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
