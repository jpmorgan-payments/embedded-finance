/**
 * OnboardingFlow — Linked Account Enabled Statuses
 *
 * Stories demonstrating `linkAccountEnabledStatuses` — controls which client
 * statuses allow the user to initiate account linking.
 *
 * `showLinkAccountStep` controls whether the section is shown.
 * `linkAccountEnabledStatuses` controls whether the "Start" button is enabled
 * for the current client status.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ClientStatus } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  mockClientApproved,
  mockClientInfoRequested,
  mockClientInReview,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Enabled Statuses',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts'],
  parameters: {
    layout: 'fullscreen',
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

// ============================================================================
// Status-gated enabled stories
// ============================================================================

/**
 * **Approved only** — Linking is enabled because the client status
 * (`APPROVED`) is in the allowed list.
 */
export const ApprovedOnly: Story = {
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountEnabledStatuses: [ClientStatus.APPROVED],
  },
};

/**
 * **Disabled by status mismatch** — The section is shown (`showLinkAccountStep`)
 * but linking is disabled because the client is `REVIEW_IN_PROGRESS` and only
 * `APPROVED` is in the allowed list. The "Start" button is locked.
 */
export const DisabledByStatusMismatch: Story = {
  loaders: [
    async () => {
      resetAndSeedClient(mockClientInReview, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientInReview,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountEnabledStatuses: [ClientStatus.APPROVED],
  },
};

/**
 * **Multiple statuses** — Linking enabled for `APPROVED`,
 * `REVIEW_IN_PROGRESS`, and `INFORMATION_REQUESTED`. Client is in
 * `INFORMATION_REQUESTED` status so the "Start" button is active.
 */
export const MultipleStatuses: Story = {
  loaders: [
    async () => {
      resetAndSeedClient(mockClientInfoRequested, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientInfoRequested,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountEnabledStatuses: [
      ClientStatus.APPROVED,
      ClientStatus.REVIEW_IN_PROGRESS,
      ClientStatus.INFORMATION_REQUESTED,
    ],
  },
};

/**
 * **Review in progress** — Linking enabled during review.
 * Useful for partners who want early account linking while KYC is in progress.
 */
export const ReviewInProgress: Story = {
  loaders: [
    async () => {
      resetAndSeedClient(mockClientInReview, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientInReview,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountEnabledStatuses: [
      ClientStatus.APPROVED,
      ClientStatus.REVIEW_IN_PROGRESS,
    ],
  },
};

/**
 * **Default behavior** — When `linkAccountEnabledStatuses` is not provided,
 * the component falls back to its built-in status checks. Only
 * `showLinkAccountStep` is needed to show and enable the section.
 */
export const DefaultBehavior: Story = {
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
  },
};
