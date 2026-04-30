/**
 * OnboardingFlow - Main Entry Point
 *
 * Complete multi-step onboarding experience for embedded banking applications.
 * Guides users through collecting business information, personal details,
 * and compliance documentation for KYC/AML verification.
 *
 * **Features:**
 * - Multi-step wizard with progress tracking
 * - Optional sidebar navigation
 * - Document upload integration
 * - NAICS code recommendations
 * - User event tracking for analytics
 *
 * **See also:** `stories/Docs.mdx` (Storybook decomposition taxonomy), plus grouped stories under `stories/` (Client States, Configuration & variants, Interactive, Resilience, Entry points, etc.).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  defaultHandlers,
  OnboardingFlowTemplate,
} from './stories/story-utils';
import type { OnboardingFlowProps } from './types/onboarding.types';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow',
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

/**
 * **Default**
 *
 * Fresh onboarding flow for a new client.
 * No existing client data - user starts from the beginning.
 *
 * See also:
 * - Client States/* for different client status scenarios
 * - Configuration/* for configuration options
 */
export const Default: Story = {
  args: {
    ...commonArgs,
  },
};
