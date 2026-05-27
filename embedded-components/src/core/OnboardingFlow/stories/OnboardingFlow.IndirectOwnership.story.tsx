/**
 * OnboardingFlow - Indirect Ownership Integration
 *
 * Stories demonstrating the indirect ownership feature within OnboardingFlow.
 * Controlled by the `enableIndirectOwnership` prop (feature flag).
 *
 * When enabled, the owners section renders the IndirectOwnership component
 * instead of the standard direct-only beneficial owner list.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Indirect Ownership',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@indirect-ownership'],
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
    enableIndirectOwnership: {
      control: { type: 'boolean' },
      description:
        'Enable indirect ownership hierarchy support. When true, the owners ' +
        'section renders an enhanced UI supporting both direct and indirect ownership.',
      table: {
        category: 'Feature Flags',
        defaultValue: { summary: 'false' },
      },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// INDIRECT OWNERSHIP ENABLED
// =============================================================================

/**
 * **Indirect Ownership — Enabled**
 *
 * When `enableIndirectOwnership` is true, the owners section screen renders
 * the IndirectOwnership component instead of the standard owner list with
 * add/edit/remove buttons.
 */
export const Enabled: Story = {
  name: 'Enabled',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    enableIndirectOwnership: true,
  },
};

// =============================================================================
// INDIRECT OWNERSHIP DISABLED (default)
// =============================================================================

/**
 * **Indirect Ownership — Disabled (Default)**
 *
 * When `enableIndirectOwnership` is false or omitted, the standard
 * direct-only beneficial owner UI is rendered.
 */
export const Disabled: Story = {
  name: 'Disabled (Default)',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    enableIndirectOwnership: false,
  },
};
